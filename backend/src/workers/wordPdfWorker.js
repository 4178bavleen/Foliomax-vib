// src/workers/wordPdfWorker.js
'use strict';

const path = require('path');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');

const kafkaBrokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const uploadedTopic = process.env.WORD_UPLOADED_TOPIC || 'word.uploaded';
const convertedTopic = process.env.WORD_CONVERTED_TOPIC || 'word.converted';

const redis = new Redis(process.env.REDIS_URL || undefined);

const kafka = new Kafka({ brokers: kafkaBrokers });
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP || 'word-pdf-converter-group' });
const producer = kafka.producer();

async function execSoffice(abs, outDir) {
  const soffice = process.env.LIBREOFFICE_BIN || 'soffice';
  const args = ['--headless', '--convert-to', 'pdf', '--outdir', outDir, abs];
  return new Promise((resolve, reject) => {
    execFile(soffice, args, { timeout: 180000 }, (err, stdout, stderr) => {
      if (err) {
        const msg = (stderr || stdout || (err && err.message) || 'soffice failed').toString();
        return reject(new Error(msg));
      }
      resolve();
    });
  });
}

async function convertAndPublish(payload) {
  const { fileId, storagePath } = payload;
  if (!fileId || !storagePath) return;

  const uploadsRoot = path.join(process.cwd(), 'public');
  const abs = path.join(uploadsRoot, storagePath.replace(/^\/+/, ''));
  const dir = path.dirname(abs);
  const base = path.basename(abs, path.extname(abs));
  const pdfPath = path.join(dir, `${base}.pdf`);
  const pdfPublicPath = path.relative(uploadsRoot, pdfPath).replace(/\\/g, '/');
  const webHost = process.env.WEB_HOST || (`http://localhost:${process.env.PORT || 4000}`);
  const pdfUrl = `${webHost}/${pdfPublicPath.replace(/^\/+/, '')}`;

  try {
    await redis.set(`word:status:${fileId}`, JSON.stringify({ status: 'converting', startedAt: new Date().toISOString() }), 'EX', 24 * 3600);
  } catch (e) { console.warn('redis set converting failed', e && e.message); }

  try {
    // if pdf exists, skip conversion
    try {
      await fs.stat(pdfPath);
      await redis.set(`word:pdf:${fileId}`, JSON.stringify({ url: pdfUrl, exists: true }), 'EX', 24 * 3600);
      await redis.set(`word:status:${fileId}`, JSON.stringify({ status: 'ready', readyAt: new Date().toISOString() }), 'EX', 24 * 3600);
      await producer.send({ topic: convertedTopic, messages: [{ key: String(fileId), value: JSON.stringify({ fileId, pdfUrl, converted: false }) }] });
      console.log('pdf already exists for', fileId);
      return;
    } catch (_) { /* missing - proceed */ }

    await fs.mkdir(dir, { recursive: true });

    // run LibreOffice conversion
    await execSoffice(abs, dir);

    // verify pdf
    await fs.stat(pdfPath);

    // set redis keys and notify
    await redis.set(`word:pdf:${fileId}`, JSON.stringify({ url: pdfUrl, exists: true }), 'EX', 24 * 3600);
    await redis.set(`word:status:${fileId}`, JSON.stringify({ status: 'ready', readyAt: new Date().toISOString() }), 'EX', 24 * 3600);

    await producer.send({ topic: convertedTopic, messages: [{ key: String(fileId), value: JSON.stringify({ fileId, pdfUrl, converted: true }) }] });

    console.log(`Converted fileId=${fileId} -> ${pdfPath}`);
  } catch (err) {
    console.error('convert failed for', fileId, err && (err.stack || err.message || err));
    try {
      await redis.set(`word:status:${fileId}`, JSON.stringify({ status: 'failed', error: err && err.message, at: new Date().toISOString() }), 'EX', 24 * 3600);
    } catch (_) {}
  }
}

async function run() {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: uploadedTopic, fromBeginning: false });

  console.log('wordPdfWorker running, subscribed to', uploadedTopic);

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        // expected payload: { fileId, storagePath, version, uploadedAt }
        await convertAndPublish(payload);
      } catch (e) {
        console.error('worker parse message failed', e && (e.stack || e.message || e));
      }
    },
  });
}

run().catch((e) => {
  console.error('worker fatal', e && (e.stack || e.message || e));
  process.exit(1);
});
