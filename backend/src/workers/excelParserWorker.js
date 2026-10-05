'use strict';
require("dotenv").config();
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');
const ExcelJS = require('exceljs');
const fs = require('fs/promises');
const fsSync = require('fs'); // for createReadStream etc if needed
const path = require('path');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const GROUP_ID = process.env.KAFKA_CONSUMER_GROUP || 'excel-parsers';
const TOPIC = process.env.EXCEL_UPLOADED_TOPIC || 'excel.uploaded';
const REDIS_TTL_SECONDS = Number(process.env.EXCEL_REDIS_TTL_SECONDS || 24 * 3600);

const kafka = new Kafka({ brokers: KAFKA_BROKERS, clientId: process.env.KAFKA_CLIENT_ID || 'folio-worker' });
const consumer = kafka.consumer({ groupId: GROUP_ID });
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

/**
 * Helper to convert ExcelJS ARGB style to CSS hex (e.g. 'FF00FF00' -> '#00FF00')
 */
function argbToHex(argb) {
  if (!argb) return null;
  try {
    const s = String(argb || '').trim();
    if (s.length === 8) return `#${s.slice(-6)}`;
    if (s.length === 6) return `#${s}`;
    // fallback: strip leading zeros
    const stripped = s.replace(/^0+/, '');
    return stripped ? `#${stripped}` : null;
  } catch {
    return null;
  }
}

/** CSV escape helper (RFC4180-ish, good for most cases) */
function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function writeCsvAndMeta(fileId, sheets) {
  // parsedDir => public/uploads/parsed/<fileId>/
  const parsedDir = path.join(process.cwd(), 'public', 'uploads', 'parsed', String(fileId));
  try {
    await fs.mkdir(parsedDir, { recursive: true });
  } catch (e) {
    // non-fatal: proceed (mkdir may fail if concurrent)
    console.warn('mkdir parsedDir failed', e && e.message);
  }

  for (let si = 0; si < sheets.length; si++) {
    const s = sheets[si];

    // Build CSV lines (values only)
    // rows is expected to be array of arrays of cell objects
    const lines = s.rows.map((row) => {
      // ensure we produce at least one column if row is empty
      const cols = row && Array.isArray(row) && row.length ? row : [{ value: '' }];
      return cols.map((cell) => csvEscape(cell && cell.value)).join(',');
    });

    const csvPath = path.join(parsedDir, `sheet-${si}.csv`);
    const tmpCsv = csvPath + `.tmp-${process.pid}`;

    try {
      await fs.writeFile(tmpCsv, lines.join('\n'), 'utf8');
      await fs.rename(tmpCsv, csvPath);
    } catch (e) {
      console.warn('write csv failed for', csvPath, e && e.message);
      try { await fs.unlink(tmpCsv); } catch (_) {}
    }

    // Build sparse meta: name, cols, merges, styles (only non-defaults)
    const meta = {
      name: s.name || `Sheet ${si + 1}`,
      cols: s.cols || [],
      merges: s.merges || [],
      styles: {}, // keyed by "row,col" (1-based)
    };

    // iterate rows to collect style info
    for (const row of s.rows) {
      for (const cell of row) {
        if (!cell) continue;
        const key = `${cell.r},${cell.c}`; // "1,1"
        const small = {};
        if (cell.bg) small.bg = cell.bg;
        if (cell.color) small.color = cell.color;
        if (cell.bold) small.bold = true;
        if (cell.italic) small.italic = true;
        if (Object.keys(small).length) meta.styles[key] = small;
      }
    }

    const metaPath = path.join(parsedDir, `sheet-${si}.meta.json`);
    const tmpMeta = metaPath + `.tmp-${process.pid}`;

    try {
      await fs.writeFile(tmpMeta, JSON.stringify(meta), 'utf8');
      await fs.rename(tmpMeta, metaPath);
    } catch (e) {
      console.warn('write meta failed for', metaPath, e && e.message);
      try { await fs.unlink(tmpMeta); } catch (_) {}
    }
  }
}

/**
 * Parse workbook and cache results (existing behavior preserved).
 * Adds writing CSV + meta per sheet into public/uploads/parsed/<fileId>/
 */
async function parseAndCache(fileId, storagePath, version) {
  const abs = path.join(process.cwd(), 'public', storagePath.replace(/^\/+/, ''));
  const workbook = new ExcelJS.Workbook();

  // read file (styles included by default for xlsx)
  await workbook.xlsx.readFile(abs);

  const sheets = [];

  workbook.eachSheet((ws) => {
    // column widths
    const cols = (ws.columns || []).map((c) => (c && c.width) ? c.width : null);

    // merges: try to extract known merges; ExcelJS keeps merges on ws._merges (private) but it's widely used
    const merges = [];
    try {
      for (const key of Object.keys(ws._merges || {})) {
        try {
          const m = ws._merges[key];
          merges.push({ range: (m && m.model) ? m.model : key });
        } catch (e) { /* ignore inner */ }
      }
    } catch (e) { /* ignore */ }

    const rows = [];
    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const cells = [];
      const maxCol = Math.max(ws.actualColumnCount || 0, row.cellCount || 0);

      for (let col = 1; col <= Math.max(1, maxCol); col++) {
        const cell = row.getCell(col);
        const raw = cell.value;
        let value = '';
        try {
          if (raw == null) {
            value = '';
          } else if (typeof raw === 'object') {
            if (raw.richText) value = raw.richText.map(rt => rt.text).join('');
            else if (raw.text) value = raw.text;
            else if (raw.result != null) value = String(raw.result);
            else if (raw.formula != null && raw.result != null) value = String(raw.result);
            else value = '';
          } else {
            value = String(raw);
          }
        } catch (e) {
          value = '';
        }

        // style extraction (best-effort)
        let bg = null, color = null, bold = false, italic = false, align = null, numFmt = null;
        try {
          if (cell.fill && cell.fill.fgColor && cell.fill.fgColor.argb) {
            bg = argbToHex(cell.fill.fgColor.argb);
          } else if (cell.fill && cell.fill.bgColor && cell.fill.bgColor.argb) {
            bg = argbToHex(cell.fill.bgColor.argb);
          }

          if (cell.font && cell.font.color && cell.font.color.argb) {
            color = argbToHex(cell.font.color.argb);
          }

          if (cell.font && cell.font.bold) bold = true;
          if (cell.font && cell.font.italic) italic = true;
          if (cell.alignment) align = cell.alignment.horizontal || null;
          if (cell.numFmt) numFmt = cell.numFmt;
        } catch (e) {
          // swallow style parse errors
        }

        const isMerged = !!cell.isMerged || !!(cell.master && cell.master.address && cell.master.address !== cell.address);

        const cellObj = {
          r: rowNumber,
          c: col,
          value,
          bg,
          color,
          bold,
          italic,
          align,
          numFmt,
          isMerged,
          formula: cell.formula || null,
          rawType: cell.type || null,
        };

        cells.push(cellObj);
      }

      rows.push(cells);
    });

    sheets.push({
      name: ws.name,
      cols,
      merges,
      rows,
    });
  });

  // --------------- write CSV + meta per sheet (new) ----------------
  try {
    await writeCsvAndMeta(fileId, sheets);
  } catch (e) {
    console.warn('writeCsvAndMeta failed (continuing):', e && e.message);
  }

  // --------------- existing caching: Redis + parsed.json ----------------
  const parsedObj = {
    fileId,
    version: version || Date.now().toString(),
    parsedAt: new Date().toISOString(),
    sheets,
  };

  const redisKey = `excel:parsed:${fileId}`;

  // write to Redis (atomic set with TTL)
  try {
    await redis.set(redisKey, JSON.stringify(parsedObj), 'EX', REDIS_TTL_SECONDS);
  } catch (e) {
    console.warn('redis set failed in worker:', e && e.message);
  }

  // write disk cache atomically (.parsed.json)
  try {
    const parsedPath = abs + '.parsed.json';
    const tmp = parsedPath + `.tmp-${process.pid}`;
    await fs.writeFile(tmp, JSON.stringify(parsedObj), 'utf8');
    await fs.rename(tmp, parsedPath);
  } catch (e) {
    console.warn('disk cache write failed in worker:', e && e.message);
  }

  console.log(`Parsed & cached file ${fileId} (version=${parsedObj.version})`);
  return parsedObj;
}

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  console.log('✅ Kafka consumer connected, listening for', TOPIC);

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const val = message.value.toString();
        const obj = JSON.parse(val);
        const { fileId, storagePath, version } = obj;
        console.log('Worker got', fileId, storagePath, version);

        // idempotency check: skip parse if same version present in Redis
        const redisKey = `excel:parsed:${fileId}`;
        const cached = await redis.get(redisKey);
        if (cached) {
          try {
            const j = JSON.parse(cached);
            if (j.version === version) {
              console.log('Worker skip: same version cached', fileId);
              return;
            }
          } catch (e) {
            // fallthrough if cached parse is invalid
          }
        }

        await parseAndCache(fileId, storagePath, version);
      } catch (err) {
        console.error('Worker message processing error', err && (err.stack || err.message || err));
        // consider DLQ in production
      }
    },
  });
}

run().catch(err => {
  console.error('Worker failed', err && (err.stack || err.message || err));
  process.exit(1);
});

// graceful shutdown
process.on('SIGINT', async () => {
  console.log('Worker SIGINT — shutting down');
  try { await consumer.disconnect(); await redis.quit(); } catch (e) {}
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('Worker SIGTERM — shutting down');
  try { await consumer.disconnect(); await redis.quit(); } catch (e) {}
  process.exit(0);
});
