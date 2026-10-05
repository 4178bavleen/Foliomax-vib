// src/lib/kafkaProducer.js
'use strict';
const { Kafka } = require('kafkajs');
const config = {
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'folio-producer',
};
const kafka = new Kafka(config);
const producer = kafka.producer();
let ready = false;

async function initProducer() {
  if (ready) return;
  await producer.connect();
  ready = true;
  console.log('✅ Kafka producer connected');
}
initProducer().catch(err => console.warn('Kafka producer init failed', err.message));

/**
 * topic: string
 * key: string | number
 * payload: object
 */
async function produce(topic, key, payload) {
  await initProducer();
  const msg = { key: String(key || ''), value: JSON.stringify(payload) };
  return producer.send({ topic, messages: [msg] });
}

async function disconnect() {
  try { await producer.disconnect(); } catch (e) { /* ignore */ }
}

module.exports = { produce, disconnect };
