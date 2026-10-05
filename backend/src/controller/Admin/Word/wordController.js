// src/controller/wordController.js
'use strict';

const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const mammoth = require('mammoth');

const redis = require('../../../lib/redisClient'); // ioredis client
const { produce } = require('../../../lib/kafkaProducer'); // kafkajs producer

const WORD_TOPIC = process.env.WORD_UPLOADED_TOPIC || 'word.uploaded';
const REDIS_TTL_SECONDS = Number(process.env.WORD_REDIS_TTL_SECONDS || 24 * 3600);

/**
 * Helper: make public URL for a stored file
 */
function toPublicUrl(req, storagePath) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/${storagePath.replace(/^\/+/, '')}`;
}

/**
 * Best-effort text extraction from buffer for non-docx files.
 * - txt -> decode UTF-8
 * - rtf  -> strip basic rtf tags (very rough)
 * - doc  -> will fallback to binary decode (not ideal). Prefer worker conversion on server if needed.
 */
async function extractTextFromBuffer(buf, ext) {
  const textDecoder = new TextDecoder('utf-8');

  if (ext === '.txt') {
    try {
      return textDecoder.decode(buf);
    } catch (e) {
      return '';
    }
  }

  if (ext === '.rtf') {
    try {
      const raw = textDecoder.decode(buf);
      // very naive: remove RTF control words and braces
      // (this won't preserve formatting but gives readable text)
      return raw
        .replace(/\\[a-z]+\d* ?/g, '')
        .replace(/[{}]/g, '')
        .replace(/\r\n/g, '\n');
    } catch (e) {
      return '';
    }
  }

  // default: try binary decode as fallback
  try {
    return textDecoder.decode(buf);
  } catch (e) {
    return '';
  }
}

/**
 * GET /api/files/:id/parse
 * - Try redis -> disk -> synchronous parse -> background cache writes
 */
exports.parse = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const rec = await prisma.wordfile.findUnique({
      where: { id },
      select: { id: true, storagePath: true, isDeleted: true },
    });
    if (!rec || rec.isDeleted || !rec.storagePath) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }

    const abs = path.join(process.cwd(), 'public', rec.storagePath.replace(/^\/+/, ''));
    const redisKey = `word:parsed:${id}`;
    const parsedPath = abs + '.parsed.json';

    // 1) Redis cache
    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        const parsedObj = JSON.parse(cached);
        return res.json({
          ok: true,
          cached: true,
          parsed: parsedObj,
          version: parsedObj.version || null,
        });
      }
    } catch (e) {
      console.warn('redis read failed (continuing):', e && e.message);
    }

    // 2) Disk cache
    try {
      const txt = await fs.readFile(parsedPath, 'utf8');
      const parsedObj = JSON.parse(txt);
      // repopulate redis (best-effort)
      redis
        .set(redisKey, JSON.stringify(parsedObj), 'EX', REDIS_TTL_SECONDS)
        .catch(() => {});
      return res.json({
        ok: true,
        cached: false,
        parsed: parsedObj,
        version: parsedObj.version || null,
      });
    } catch (e) {
      // disk miss -> fallthrough
    }

    // 3) Synchronous parse
    const ext = path.extname(abs).toLowerCase();
    let parsedText = '';

    if (ext === '.docx') {
      // mammoth works well for docx
      try {
        const buf = await fs.readFile(abs);
        const r = await mammoth.extractRawText({ buffer: buf });
        parsedText = r && r.value ? String(r.value) : '';
      } catch (e) {
        console.warn(
          'mammoth extract failed, falling back to binary decode',
          e && e.message
        );
        try {
          const buf = await fs.readFile(abs);
          parsedText = await extractTextFromBuffer(buf, ext);
        } catch (_) {
          parsedText = '';
        }
      }
    } else {
      // TXT/RTF/DOC fallback
      try {
        const buf = await fs.readFile(abs);
        parsedText = await extractTextFromBuffer(buf, ext);
      } catch (e) {
        parsedText = '';
      }
    }

    // Normalize paragraphs: split on two or more newlines, or on single newline if short lines
    const paragraphs = parsedText
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const charCount = parsedText.length;
    const wordCount = parsedText.trim().length
      ? parsedText.trim().split(/\s+/).length
      : 0;
    const titleGuess = paragraphs.length ? paragraphs[0].slice(0, 200) : '';

    const parsedObj = {
      fileId: id,
      version: Date.now().toString(),
      parsedAt: new Date().toISOString(),
      title: titleGuess,
      charCount,
      wordCount,
      paragraphs,
    };

    // background: write disk cache + redis (do not block response)
    (async () => {
      try {
        const tmp = parsedPath + `.tmp-${process.pid}`;
        await fs.mkdir(path.dirname(parsedPath), { recursive: true }).catch(() => {});
        await fs.writeFile(tmp, JSON.stringify(parsedObj), 'utf8');
        await fs.rename(tmp, parsedPath);
      } catch (e) {
        console.warn('disk cache write failed', e && e.message);
      }
      try {
        await redis.set(redisKey, JSON.stringify(parsedObj), 'EX', REDIS_TTL_SECONDS);
      } catch (e) {
        console.warn('redis set failed', e && e.message);
      }
    })();

    return res.json({ ok: true, parsed: parsedObj });
  } catch (err) {
    console.error('word parse error:', err && (err.stack || err.message || err));
    return res
      .status(500)
      .json({ ok: false, message: 'Parse failed', detail: err.message });
  }
};

/**
 * POST /api/files/upload-word
 * multipart/form-data -> field "file"
 * - Create DB record and produce Kafka event for background parsing
 */
exports.uploadWord = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, message: "No file field named 'file' was sent" });
    }

    const { originalname, mimetype, size, filename } = req.file;
    const storagePath = `uploads/${filename}`;

    // 👇 pageName comes from multipart body (optional)
    let pageName = null;
    if (req.body && typeof req.body.pageName === 'string') {
      const trimmed = req.body.pageName.trim();
      if (trimmed && trimmed !== 'none') {
        pageName = trimmed;
      }
    }

    const fileRec = await prisma.wordfile.create({
      data: {
        name: originalname,
        originalFilename: originalname,
        mimeType: mimetype,
        sizeBytes: size,
        storagePath,
        isActive: true,
        pageName, // 👈 store pageName in DB (nullable)
      },
      select: {
        id: true,
        name: true,
        sizeBytes: true,
        storagePath: true,
        createdAt: true,
        pageName: true,
      },
    });

    // Produce Kafka event for async parsing; non-blocking (best-effort)
    const payload = {
      fileId: fileRec.id,
      storagePath: fileRec.storagePath,
      version: Date.now().toString(),
      uploadedAt: new Date().toISOString(),
    };
    produce(WORD_TOPIC, fileRec.id, payload)
      .then(() => console.log('Produced word.uploaded', fileRec.id))
      .catch((e) =>
        console.warn('Kafka produce failed (upload) — continuing', e && e.message)
      );

    return res.status(201).json({
      ok: true,
      file: {
        id: fileRec.id,
        name: fileRec.name,
        url: toPublicUrl(req, fileRec.storagePath),
        size: fileRec.sizeBytes,
        uploadedAt: fileRec.createdAt,
        pageName: fileRec.pageName ?? null, // 👈 return pageName
      },
    });
  } catch (err) {
    console.error('uploadWord error:', err && (err.stack || err.message || err));
    return res
      .status(500)
      .json({ ok: false, message: err.message || 'Upload failed' });
  }
};

/**
 * GET /api/files?type=word[&pageName=...]
 */
exports.list = async (req, res) => {
  try {
    // optional filter: pageName; "none" = unassigned/null
    const qPageName = typeof req.query.pageName === 'string' ? req.query.pageName : null;
    let where = { isDeleted: false };

    if (qPageName) {
      if (qPageName === 'none') {
        where = { ...where, pageName: null };
      } else {
        where = { ...where, pageName: qPageName };
      }
    }

    const rows = await prisma.wordfile.findMany({
      where,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        sizeBytes: true,
        storagePath: true,
        createdAt: true,
        pageName: true,
      },
    });

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.storagePath ? toPublicUrl(req, r.storagePath) : '',
      size: r.sizeBytes ?? undefined,
      uploadedAt: r.createdAt?.toISOString?.() ?? null,
      pageName: r.pageName ?? null,
    }));

    return res.json(data);
  } catch (err) {
    console.error('list word files error:', err && (err.stack || err.message || err));
    return res
      .status(500)
      .json({ ok: false, message: 'Failed to list files' });
  }
};

/**
 * DELETE /api/files/:id
 * - delete disk file
 * - soft delete DB record
 * - invalidate caches
 */
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ ok: false, message: 'Invalid id' });

    const file = await prisma.wordfile.findUnique({
      where: { id },
      select: { id: true, storagePath: true, isDeleted: true },
    });

    if (!file || file.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }

    if (file.storagePath) {
      const abs = path.join(
        process.cwd(),
        'public',
        file.storagePath.replace(/^uploads[\\/]/, 'uploads/')
      );
      try {
        await fs.unlink(abs);
      } catch (_) {}
      try {
        await fs.unlink(abs + '.parsed.json');
      } catch (_) {}
      // invalidate redis
      try {
        await redis.del(`word:parsed:${id}`);
      } catch (_) {}
    }

    await prisma.wordfile.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(
      'remove word file error:',
      err && (err.stack || err.message || err)
    );
    return res.status(500).json({ ok: false, message: 'Delete failed' });
  }
};

/**
 * PATCH /api/files/:id/overwrite
 * - replace file bytes
 * - update DB size
 * - invalidate cache and produce reparse event
 */
exports.overwrite = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ ok: false, message: 'Invalid id' });
    if (!req.file)
      return res
        .status(400)
        .json({ ok: false, message: "No file field named 'file' was sent" });

    const rec = await prisma.wordfile.findUnique({
      where: { id },
      select: { id: true, storagePath: true, isDeleted: true },
    });
    if (!rec || rec.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }

    const abs = path.join(
      process.cwd(),
      'public',
      rec.storagePath.replace(/^uploads[\\/]/, 'uploads/')
    );

    // replace file atomically
    const uploadedBuf = await fs.readFile(req.file.path);
    const tmpPath = `${abs}.tmp-${process.pid}`;
    await fs.writeFile(tmpPath, uploadedBuf);
    await fs.rename(tmpPath, abs);
    // cleanup temp upload
    try {
      await fs.unlink(req.file.path);
    } catch (_) {}

    // Update size in DB
    const stat = await fs.stat(abs);
    await prisma.wordfile.update({
      where: { id },
      data: { sizeBytes: stat.size, isActive: true },
    });

    // Invalidate caches (disk + redis)
    try {
      await fs.unlink(abs + '.parsed.json');
    } catch (_) {}
    try {
      await redis.del(`word:parsed:${id}`);
    } catch (_) {}

    // Produce reparse event for worker to parse new file in background
    const payload = {
      fileId: id,
      storagePath: rec.storagePath,
      version: Date.now().toString(),
      uploadedAt: new Date().toISOString(),
    };
    produce(WORD_TOPIC, id, payload).catch(() => {});

    return res.json({ ok: true });
  } catch (err) {
    console.error(
      'overwrite word file error:',
      err && (err.stack || err.message || err)
    );
    return res.status(500).json({ ok: false, message: 'Overwrite failed' });
  }
};

/**
 * GET /api/files/:id/meta
 * Returns small JSON meta for the word file (from parsed cache or parse on the fly).
 * Response shape: { ok: true, meta: { title, wordCount, charCount, paragraphsCount, snippet } }
 */
exports.getMeta = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ ok: false, message: 'Invalid id' });

    const rec = await prisma.wordfile.findUnique({
      where: { id },
      select: { id: true, storagePath: true, isDeleted: true },
    });
    if (!rec || rec.isDeleted || !rec.storagePath)
      return res.status(404).json({ ok: false, message: 'Not found' });

    const parsedPath = path.join(
      process.cwd(),
      'public',
      rec.storagePath.replace(/^\/+/, '') + '.parsed.json'
    );

    try {
      const txt = await fs.readFile(parsedPath, 'utf8');
      const parsedObj = JSON.parse(txt);
      const meta = {
        title: parsedObj.title || null,
        wordCount: parsedObj.wordCount || 0,
        charCount: parsedObj.charCount || 0,
        paragraphsCount: Array.isArray(parsedObj.paragraphs)
          ? parsedObj.paragraphs.length
          : 0,
        snippet:
          Array.isArray(parsedObj.paragraphs) && parsedObj.paragraphs[0]
            ? parsedObj.paragraphs[0].slice(0, 400)
            : '',
      };
      return res.json({ ok: true, meta });
    } catch (e) {
      // fallback to on-the-fly parse (cheap: first chunk only)
      try {
        const abs = path.join(
          process.cwd(),
          'public',
          rec.storagePath.replace(/^\/+/, '')
        );
        const ext = path.extname(abs).toLowerCase();
        let parsedText = '';
        if (ext === '.docx') {
          const buf = await fs.readFile(abs);
          const r = await mammoth.extractRawText({ buffer: buf });
          parsedText = r && r.value ? String(r.value) : '';
        } else {
          const buf = await fs.readFile(abs);
          parsedText = await extractTextFromBuffer(buf, ext);
        }
        const paragraphs = parsedText
          .replace(/\r\n/g, '\n')
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);
        const wordCount = parsedText.trim()
          ? parsedText.trim().split(/\s+/).length
          : 0;
        const charCount = parsedText.length;
        const meta = {
          title: paragraphs.length ? paragraphs[0].slice(0, 200) : null,
          wordCount,
          charCount,
          paragraphsCount: paragraphs.length,
          snippet: paragraphs.length ? paragraphs[0].slice(0, 400) : '',
        };
        return res.json({ ok: true, meta });
      } catch (ex) {
        return res.status(404).json({ ok: false, message: 'Meta not found' });
      }
    }
  } catch (err) {
    console.error(
      'getWordMeta error',
      err && (err.stack || err.message || err)
    );
    return res
      .status(500)
      .json({ ok: false, message: 'Failed', detail: err.message });
  }
};

/**
 * GET /api/files/:id/text?start=0&limit=5
 * Returns paragraph-range of the parsed text.
 * Response: { ok: true, paragraphs: [ ... ] }
 */
exports.getTextRange = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const start = Math.max(0, Number(req.query.start || 0));
    const limit = Math.max(1, Math.min(1000, Number(req.query.limit || 5)));
    if (Number.isNaN(id))
      return res.status(400).json({ ok: false, message: 'Invalid id' });

    const rec = await prisma.wordfile.findUnique({
      where: { id },
      select: { id: true, storagePath: true, isDeleted: true },
    });
    if (!rec || rec.isDeleted || !rec.storagePath)
      return res.status(404).json({ ok: false, message: 'Not found' });

    const parsedPath = path.join(
      process.cwd(),
      'public',
      rec.storagePath.replace(/^\/+/, '') + '.parsed.json'
    );

    // Try disk parsed.json first
    try {
      const txt = await fs.readFile(parsedPath, 'utf8');
      const parsedObj = JSON.parse(txt);
      const paras = Array.isArray(parsedObj.paragraphs)
        ? parsedObj.paragraphs.slice(start, start + limit)
        : [];
      return res.json({ ok: true, paragraphs: paras });
    } catch (e) {
      // fallback to parse on the fly and slice
      try {
        const abs = path.join(
          process.cwd(),
          'public',
          rec.storagePath.replace(/^\/+/, '')
        );
        const ext = path.extname(abs).toLowerCase();
        let parsedText = '';
        if (ext === '.docx') {
          const buf = await fs.readFile(abs);
          const r = await mammoth.extractRawText({ buffer: buf });
          parsedText = r && r.value ? String(r.value) : '';
        } else {
          const buf = await fs.readFile(abs);
          parsedText = await extractTextFromBuffer(buf, ext);
        }
        const paragraphs = parsedText
          .replace(/\r\n/g, '\n')
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean);
        const paras = paragraphs.slice(start, start + limit);
        return res.json({ ok: true, paragraphs: paras });
      } catch (ex) {
        return res
          .status(404)
          .json({ ok: false, message: 'Text not available' });
      }
    }
  } catch (err) {
    console.error(
      'getTextRange error',
      err && (err.stack || err.message || err)
    );
    return res
      .status(500)
      .json({ ok: false, message: 'Failed', detail: err.message });
  }
};

/**
 * GET /api/files/:id
 * Returns single word file record (with public URL)
 */
exports.getOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ ok: false, message: 'Invalid id' });

    const r = await prisma.wordfile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        originalFilename: true,
        mimeType: true,
        sizeBytes: true,
        storagePath: true,
        isActive: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        pageName: true, // 👈 include pageName
      },
    });

    if (!r || r.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }

    const fileObj = {
      id: r.id,
      name: r.name,
      originalFilename: r.originalFilename || null,
      mimeType: r.mimeType || null,
      url: r.storagePath ? toPublicUrl(req, r.storagePath) : '',
      size: r.sizeBytes ?? undefined,
      isActive: !!r.isActive,
      uploadedAt: r.createdAt?.toISOString?.() ?? null,
      updatedAt: r.updatedAt?.toISOString?.() ?? null,
      pageName: r.pageName ?? null, // 👈 return pageName
    };

    return res.json({ ok: true, file: fileObj });
  } catch (err) {
    console.error(
      'getOne word file error',
      err && (err.stack || err.message || err)
    );
    return res
      .status(500)
      .json({ ok: false, message: 'Failed', detail: err.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    const total = await prisma.wordfile.count({
      where: { isDeleted: false },
    });

    return res.json({ ok: true, total });
  } catch (err) {
    console.error('getCount files error:', err);
    return res
      .status(500)
      .json({ ok: false, message: 'Failed to get count' });
  }
};
