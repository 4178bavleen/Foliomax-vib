'use strict';

const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const crypto = require('crypto');

const REDIS = require('../../../lib/redisClient'); // optional, ensure path valid
const learnFeedCache = require('../../../lib/learnFeedCache');
const VIDEO_MAX_SIZE_MB = Number(process.env.VIDEO_MAX_SIZE_MB || 500);
const UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads', 'videos');

// ensure upload dir exists
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.warn('[videoController] could not create upload dir', UPLOAD_DIR, e && e.message);
  }
})();

// ---------- helpers ----------
function safeFileName(original) {
  const ext = path.extname(original) || '.mp4';
  const base = crypto.randomBytes(8).toString('hex');
  return `${Date.now()}-${base}${ext}`;
}
function toPublicUrl(req, storagePath) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/${storagePath.replace(/^\/+/, '')}`;
}
function isVideoMime(mime) {
  return !!mime && mime.startsWith('video/');
}
function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);
  // allow JSON string or comma-separated
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
  } catch (e) { /* ignore JSON parse error */ }
  return String(raw).split(',').map(s => s.trim()).filter(Boolean);
}

// ---------- multer disk storage ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(UPLOAD_DIR, 'tmp');
    fs.mkdir(dest, { recursive: true }).then(() => cb(null, dest)).catch(cb);
  },
  filename: (req, file, cb) => {
    cb(null, safeFileName(file.originalname));
  },
});
const uploadMiddleware = multer({
  storage,
  limits: { fileSize: VIDEO_MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!isVideoMime(file.mimetype)) return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only video/* MIME types allowed'));
    cb(null, true);
  },
}).single('file');

const runMulter = (req, res) =>
  new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

// ---------- controllers ----------
exports.uploadVideo = async (req, res) => {
  try {
    await runMulter(req, res);

    if (!req.file) return res.status(400).json({ ok: false, message: "No file field named 'file' was sent" });

    // Move from tmp to final dir
    const tmpPath = req.file.path;
    const finalName = req.file.filename;
    const finalRel = path.posix.join('uploads', 'videos', finalName); // path stored in DB
    const finalAbs = path.join(process.cwd(), 'public', finalRel);

    await fs.mkdir(path.dirname(finalAbs), { recursive: true });

    await fs.rename(tmpPath, finalAbs).catch(async (err) => {
      if (err.code === 'EXDEV') {
        await fs.copyFile(tmpPath, finalAbs);
        await fs.unlink(tmpPath);
      } else {
        throw err;
      }
    });

    const url = toPublicUrl(req, finalRel);

    // Title/description/tags may come in form fields
    const title = req.body.title ? String(req.body.title).trim() : null;
    const description = req.body.description ? String(req.body.description).trim() : null;
    const tagNames = parseTags(req.body.tags);

    // prepare nested create for tags using connectOrCreate (creates VideoTag rows)
    const tagNestedCreates = tagNames.map((name) => ({
      tag: {
        connectOrCreate: {
          where: { name },
          create: { name },
        },
      },
    }));

    const created = await prisma.video.create({
      data: {
        title,
        description,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: BigInt(req.file.size),
        storagePath: finalRel,
        url,
        isPublic: true,
        uploadedAt: new Date(),
        uploadedById: req.user?.id || null,
        videotag: { create: tagNestedCreates },
      },
      include: {
        videotag: { include: { tag: true } },
      },
    });

    // invalidate redis cache
    try { await REDIS.del('videos:list:cached'); } catch (e) { /* ignore */ }
    await learnFeedCache.invalidate();

    // Format tag list for response
    const tagList = (created.videotag || []).map(t => t.tag?.name).filter(Boolean);

    return res.status(201).json({
      ok: true,
      file: {
        id: created.id,
        title: created.title,
        description: created.description,
        originalName: created.originalName,
        mimeType: created.mimeType,
        sizeBytes: created.sizeBytes ? String(created.sizeBytes) : null,
        storagePath: created.storagePath,
        url: created.url,
        uploadedAt: created.uploadedAt,
        tags: tagList,
      }
    });
  } catch (err) {
    console.error('[videoController.uploadVideo] error', err && (err.stack || err.message || err));
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ ok: false, message: `File too large. Max ${VIDEO_MAX_SIZE_MB} MB` });
      }
      return res.status(400).json({ ok: false, message: err.message || 'Upload error' });
    }
    return res.status(500).json({ ok: false, message: err.message || 'Upload failed' });
  }
};

exports.listVideos = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(5, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    // filter by tags: ?tags=education,training  and mode=all|any
    const rawTags = req.query.tags ? String(req.query.tags) : null;
    const tags = parseTags(rawTags);
    const mode = String(req.query.mode || 'any').toLowerCase(); // 'any' or 'all'

    // Try small cache when default paging
    if (!req.query.page && !req.query.limit) {
      try {
        const cached = await REDIS.get('videos:list:cached');
        if (cached) return res.json(JSON.parse(cached));
      } catch (e) { /* ignore */ }
    }

    // Build where clause
    let where = { isDeleted: false };

    if (tags.length) {
      if (mode === 'all') {
        // AND semantics: each tag must be present
        where.AND = tags.map(name => ({
          videotag: { some: { tag: { name } } }
        }));
      } else {
        // any: at least one tag in list
        where.videotag = { some: { tag: { name: { in: tags } } } };
      }
    }

    const [items, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
        include: { videotag: { include: { tag: true } } },
      }),
      prisma.video.count({ where }),
    ]);

    const data = items.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      originalName: r.originalName,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes ? String(r.sizeBytes) : null,
      storagePath: r.storagePath,
      url: r.url || toPublicUrl(req, r.storagePath || ''),
      uploadedAt: r.uploadedAt ? r.uploadedAt.toISOString() : null,
      tags: (r.videotag || []).map(tt => tt.tag?.name).filter(Boolean),
    }));

    const payload = {
      ok: true,
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    if (!req.query.page && !req.query.limit) {
      try { await REDIS.set('videos:list:cached', JSON.stringify(payload), 'EX', 60); } catch (e) { /* ignore */ }
    }

    return res.json(payload);
  } catch (err) {
    console.error('[videoController.listVideos] error', err && (err.stack || err.message || err));
    return res.status(500).json({ ok: false, message: 'Could not list videos' });
  }
};

exports.getVideo = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const rec = await prisma.video.findUnique({
      where: { id },
      include: { videotag: { include: { tag: true } } },
    });
    if (!rec || rec.isDeleted) return res.status(404).json({ ok: false, message: 'Not found' });

    return res.json({
      ok: true,
      data: {
        id: rec.id,
        title: rec.title,
        description: rec.description,
        originalName: rec.originalName,
        mimeType: rec.mimeType,
        sizeBytes: rec.sizeBytes ? String(rec.sizeBytes) : null,
        url: rec.url || toPublicUrl(req, rec.storagePath || ''),
        uploadedAt: rec.uploadedAt ? rec.uploadedAt.toISOString() : null,
        tags: (rec.videotag || []).map(tt => tt.tag?.name).filter(Boolean),
      }
    });
  } catch (err) {
    console.error('[videoController.getVideo] error', err && (err.stack || err.message || err));
    return res.status(500).json({ ok: false, message: 'Failed to fetch video' });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const rec = await prisma.video.findUnique({ where: { id }, select: { id: true, storagePath: true, isDeleted: true } });
    if (!rec) return res.status(404).json({ ok: false, message: 'Not found' });
    if (rec.isDeleted) return res.status(410).json({ ok: false, message: 'Already deleted' });

    if (rec.storagePath) {
      const abs = path.join(process.cwd(), 'public', rec.storagePath.replace(/^\/+/, ''));
      try { await fs.unlink(abs); } catch (e) { /* ignore */ }
    }

    const updated = await prisma.video.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: req.user?.id || null },
    });

    try { await REDIS.del('videos:list:cached'); } catch (e) { /* ignore */ }
    await learnFeedCache.invalidate();

    return res.json({ ok: true, data: { id: updated.id } });
  } catch (err) {
    console.error('[videoController.deleteVideo] error', err && (err.stack || err.message || err));
    return res.status(500).json({ ok: false, message: 'Could not delete video' });
  }
};

exports.overwriteVideo = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    // parse incoming multipart
    await runMulter(req, res);
    if (!req.file) return res.status(400).json({ ok: false, message: "No file field named 'file' was sent" });

    const rec = await prisma.video.findUnique({ where: { id }, include: { videotag: { include: { tag: true } } } });
    if (!rec || rec.isDeleted) return res.status(404).json({ ok: false, message: 'Not found' });

    // write temp then rename
    const finalRel = rec.storagePath;
    if (!finalRel) return res.status(500).json({ ok: false, message: 'Existing storagePath missing' });

    const finalAbs = path.join(process.cwd(), 'public', finalRel.replace(/^\/+/, ''));

    const tmpPath = `${finalAbs}.tmp-${process.pid}`;
    await fs.copyFile(req.file.path, tmpPath);
    await fs.rename(tmpPath, finalAbs).catch(async (err) => {
      if (err.code === 'EXDEV') {
        await fs.copyFile(tmpPath, finalAbs);
        await fs.unlink(tmpPath);
      } else throw err;
    });
    try { await fs.unlink(req.file.path); } catch (_) {}

    const stat = await fs.stat(finalAbs);

    // update metadata fields (allow title/description/tags override via body)
    const title = req.body.title ? String(req.body.title).trim() : rec.title;
    const description = req.body.description ? String(req.body.description).trim() : rec.description;
    const tagNames = parseTags(req.body.tags);

    // update tag associations if tags provided (replace current tags)
    if (tagNames.length) {
      // Build connectOrCreate set for VideoTag.create
      // Easiest approach: remove existing VideoTag entries then recreate
      await prisma.videotag.deleteMany({ where: { videoId: id } });

      const nested = tagNames.map((name) => ({
        tag: {
          connectOrCreate: {
            where: { name },
            create: { name },
          },
        },
      }));

      // update video and create new VideoTag rows in a transaction
      const updated = await prisma.$transaction(async (tx) => {
        const v = await tx.video.update({
          where: { id },
          data: {
            sizeBytes: BigInt(stat.size),
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            title,
            description,
            updatedAt: new Date(),
            isDeleted: false,
            videotag: { create: nested },
          },
          include: { videotag: { include: { tag: true } } },
        });
        return v;
      });

      try { await REDIS.del('videos:list:cached'); } catch (e) { /* ignore */ }
      await learnFeedCache.invalidate();

      return res.json({
        ok: true,
        data: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          sizeBytes: updated.sizeBytes ? String(updated.sizeBytes) : null,
          tags: (updated.videotag || []).map(tt => tt.tag?.name).filter(Boolean),
        }
      });
    } else {
      // no tag changes: simple update
      const updated = await prisma.video.update({
        where: { id },
        data: {
          sizeBytes: BigInt(stat.size),
          mimeType: req.file.mimetype,
          originalName: req.file.originalname,
          title,
          description,
          updatedAt: new Date(),
          isDeleted: false,
        },
        include: { videotag: { include: { tag: true } } },
      });

      try { await REDIS.del('videos:list:cached'); } catch (e) { /* ignore */ }
      await learnFeedCache.invalidate();

      return res.json({
        ok: true,
        data: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          sizeBytes: updated.sizeBytes ? String(updated.sizeBytes) : null,
          tags: (updated.videotag || []).map(tt => tt.tag?.name).filter(Boolean),
        }
      });
    }
  } catch (err) {
    console.error('[videoController.overwriteVideo] error', err && (err.stack || err.message || err));
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ ok: false, message: `File too large. Max ${VIDEO_MAX_SIZE_MB} MB` });
      }
      return res.status(400).json({ ok: false, message: err.message || 'Upload error' });
    }
    return res.status(500).json({ ok: false, message: 'Overwrite failed' });
  }
};


exports.publicListVideosByTag = async (req, res) => {
  try {
    // Example:  /foliomax/admin/video/public?tags=education
    // Example:  /foliomax/admin/video/public?tags=training,education&mode=all

    const rawTags = req.query.tags ? String(req.query.tags) : "";
    const tags = parseTags(rawTags);
    const mode = String(req.query.mode || "any").toLowerCase();

    let where = { isDeleted: false };

    // Tag filter (optional)
    if (tags.length) {
      if (mode === "all") {
        // ALL tags must match → AND query
        where.AND = tags.map((t) => ({
          videotag: { some: { tag: { name: t } } },
        }));
      } else {
        // ANY tag matches
        where.videotag = { some: { tag: { name: { in: tags } } } };
      }
    }

    const items = await prisma.video.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      include: { videotag: { include: { tag: true } } },
    });

    const data = items.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      originalName: v.originalName,
      mimeType: v.mimeType,
      sizeBytes: v.sizeBytes ? String(v.sizeBytes) : null,
      url: v.url || toPublicUrl(req, v.storagePath || ""),
      // No thumbnail column exists on the video table yet. Declared explicitly
      // so consumers stop rendering poster="" on a broken source.
      thumbnail: null,
      uploadedAt: v.uploadedAt ? v.uploadedAt.toISOString() : null,
      tags: (v.videotag || []).map((tt) => tt.tag?.name).filter(Boolean),
    }));

    return res.json({
      ok: true,
      data,
      count: data.length,
    });
  } catch (err) {
    console.error("[videoController.publicListVideosByTag] error", err);
    return res.status(500).json({ ok: false, message: "Could not fetch videos" });
  }
};
