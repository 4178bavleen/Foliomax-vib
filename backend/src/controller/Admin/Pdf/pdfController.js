'use strict';

const path = require('path');
const fs = require('fs/promises');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const crypto = require('crypto');

const REDIS = require('../../../lib/redisClient');

const PDF_MAX_SIZE_MB = Number(process.env.PDF_MAX_SIZE_MB || 50);
const UPLOAD_DIR =
  process.env.PDF_UPLOAD_DIR ||
  path.join(process.cwd(), 'public', 'uploads', 'pdfs');

/* =====================================================
   Ensure Upload Directory Exists
===================================================== */
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.warn('[pdfController] upload dir error', e.message);
  }
})();

/* =====================================================
   Helpers
===================================================== */

function safeFileName(original) {
  const ext = '.pdf';
  const base = crypto.randomBytes(8).toString('hex');
  return `${Date.now()}-${base}${ext}`;
}

function toPublicUrl(req, storagePath) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/${storagePath.replace(/^\/+/, '')}`;
}

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(String).map(s => s.trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(String).map(s => s.trim()).filter(Boolean);
    }
  } catch (_) {}

  return String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

/* =====================================================
   Multer Config
===================================================== */

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dest = path.join(UPLOAD_DIR, 'tmp');
    await fs.mkdir(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, safeFileName(file.originalname));
  },
});

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: PDF_MAX_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(
        new multer.MulterError(
          'LIMIT_UNEXPECTED_FILE',
          'Only application/pdf allowed'
        )
      );
    }
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

/* =====================================================
   Upload PDF
===================================================== */

exports.uploadPdf = async (req, res) => {
  try {
    await runMulter(req, res);

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "No file field named 'file' was sent",
      });
    }

    const tmpPath = req.file.path;
    const finalRel = path.posix.join(
      "uploads",
      "pdfs",
      req.file.filename
    );
    const finalAbs = path.join(process.cwd(), "public", finalRel);

    await fs.mkdir(path.dirname(finalAbs), { recursive: true });

    await fs.rename(tmpPath, finalAbs).catch(async (err) => {
      if (err.code === "EXDEV") {
        await fs.copyFile(tmpPath, finalAbs);
        await fs.unlink(tmpPath);
      } else {
        throw err;
      }
    });

    const url = toPublicUrl(req, finalRel);

    const title = req.body.title?.trim() || null;
    const description = req.body.description?.trim() || null;
    const tagNames = parseTags(req.body.tags);

    /* ✅ TAG HANDLING ONLY (NO PRICE) */
    const tagNestedCreates = tagNames.map((name) => ({
      tag: {
        connectOrCreate: {
          where: { name },
          create: { name },
        },
      },
    }));

    const created = await prisma.pdf.create({
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
        pdftag: { create: tagNestedCreates },
      },
      include: { pdftag: { include: { tag: true } } },
    });

    try {
      await REDIS.del("pdf:list:cached");
    } catch (_) {}

    return res.status(201).json({
      ok: true,
      file: {
        id: created.id,
        title: created.title,
        description: created.description,
        originalName: created.originalName,
        mimeType: created.mimeType,
        sizeBytes: String(created.sizeBytes),
        url: created.url,
        uploadedAt: created.uploadedAt,
        tags: created.pdftag.map((t) => t.tag?.name).filter(Boolean),
      },
    });

  } catch (err) {
    console.error("[pdfController.uploadPdf]", err);
    return res.status(500).json({
      ok: false,
      message: "Upload failed",
    });
  }
};



/* =====================================================
   List PDFs (Pagination + Tag Filter)
===================================================== */

exports.listPdfs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(5, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const tags = parseTags(req.query.tags);
    const mode = String(req.query.mode || "any").toLowerCase();

    let where = { isDeleted: false };

    /* =====================================================
       Tag Filtering
    ===================================================== */
    if (tags.length) {
      if (mode === "all") {
        where.AND = tags.map((name) => ({
          pdftag: { some: { tag: { name } } },
        }));
      } else {
        where.pdftag = {
          some: { tag: { name: { in: tags } } },
        };
      }
    }

    /* =====================================================
       Cache (only when no pagination params)
    ===================================================== */
    if (!req.query.page && !req.query.limit) {
      try {
        const cached = await REDIS.get("pdf:list:cached");
        if (cached) return res.json(JSON.parse(cached));
      } catch (_) {}
    }

    /* =====================================================
       DB Query
    ===================================================== */
    const [items, total] = await Promise.all([
      prisma.pdf.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: "desc" },
        include: { pdftag: { include: { tag: true } } },
      }),
      prisma.pdf.count({ where }),
    ]);

    /* =====================================================
       Format Response
    ===================================================== */
    const data = items.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      price: r.price, // ✅ ADDED PRICE
      originalName: r.originalName,
      mimeType: r.mimeType,
      sizeBytes: String(r.sizeBytes),
      url: r.url || toPublicUrl(req, r.storagePath),
      uploadedAt: r.uploadedAt?.toISOString(),
      tags: r.pdftag.map((tt) => tt.tag?.name).filter(Boolean),
    }));

    const payload = {
      ok: true,
      data,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    /* =====================================================
       Store Cache (only first page, no pagination)
    ===================================================== */
    if (!req.query.page && !req.query.limit) {
      try {
        await REDIS.set(
          "pdf:list:cached",
          JSON.stringify(payload),
          "EX",
          60
        );
      } catch (_) {}
    }

    return res.json(payload);

  } catch (err) {
    console.error("[pdfController.listPdfs]", err);
    return res.status(500).json({ ok: false });
  }
};

/* =====================================================
   Get Single PDF
===================================================== */

exports.getPdf = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid id",
      });
    }

    const rec = await prisma.pdf.findUnique({
      where: { id },
      include: {
        pdftag: { include: { tag: true } },
      },
    });

    if (!rec || rec.isDeleted) {
      return res.status(404).json({
        ok: false,
        message: "PDF not found",
      });
    }

    return res.json({
      ok: true,
      data: {
        id: rec.id,
        title: rec.title,
        description: rec.description,
        originalName: rec.originalName,
        mimeType: rec.mimeType,
        sizeBytes: String(rec.sizeBytes),
        url: rec.url || toPublicUrl(req, rec.storagePath),
        uploadedAt: rec.uploadedAt?.toISOString(),
        tags: rec.pdftag.map((tt) => tt.tag?.name).filter(Boolean),
      },
    });

  } catch (err) {
    console.error("[pdfController.getPdf]", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch PDF",
    });
  }
};

/* =====================================================
   Delete (Soft Delete)
===================================================== */

exports.deletePdf = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid id",
      });
    }

    const rec = await prisma.pdf.findUnique({ where: { id } });

    if (!rec || rec.isDeleted) {
      return res.status(404).json({
        ok: false,
        message: "PDF not found",
      });
    }

    await prisma.pdf.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: req.user?.id || null,
      },
    });

    try {
      await REDIS.del("pdf:list:cached");
    } catch (_) {}

    return res.json({ ok: true });

  } catch (err) {
    console.error("[pdfController.deletePdf]", err);
    return res.status(500).json({
      ok: false,
      message: "Delete failed",
    });
  }
};

exports.publicListPdfsByTag = async (req, res) => {
  try {
    const rawTags = req.query.tags ? String(req.query.tags) : "";
    const tags = rawTags.split(",").map(t => t.trim()).filter(Boolean);
    const mode = String(req.query.mode || "any").toLowerCase();

    let where = { isDeleted: false };

    if (tags.length) {
      if (mode === "all") {
        where.AND = tags.map((t) => ({
          pdftag: { some: { tag: { name: t } } },
        }));
      } else {
        where.pdftag = {
          some: { tag: { name: { in: tags } } },
        };
      }
    }

    const items = await prisma.pdf.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
      include: { pdftag: { include: { tag: true } } },
    });

    const data = items.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      price: v.price, // ✅ Added
      url: v.url || toPublicUrl(req, v.storagePath),
      sizeBytes: String(v.sizeBytes),
      uploadedAt: v.uploadedAt?.toISOString(),
      tags: v.pdftag.map(tt => tt.tag?.name).filter(Boolean),
    }));

    return res.json({
      ok: true,
      data,
      count: data.length,
    });

  } catch (err) {
    console.error("[pdfController.publicListPdfsByTag]", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch PDFs",
    });
  }
};

exports.overwritePdf = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid id",
      });
    }

    await runMulter(req, res);

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "No file sent",
      });
    }

    const existing = await prisma.pdf.findUnique({
      where: { id },
    });

    if (!existing || existing.isDeleted) {
      return res.status(404).json({
        ok: false,
        message: "PDF not found",
      });
    }

    const finalAbs = path.join(
      process.cwd(),
      "public",
      existing.storagePath
    );

    await fs.rename(req.file.path, finalAbs).catch(async (err) => {
      if (err.code === "EXDEV") {
        await fs.copyFile(req.file.path, finalAbs);
        await fs.unlink(req.file.path);
      } else {
        throw err;
      }
    });

    const stat = await fs.stat(finalAbs);

    const updated = await prisma.pdf.update({
      where: { id },
      data: {
        sizeBytes: BigInt(stat.size),
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        updatedAt: new Date(),
      },
    });

    try {
      await REDIS.del("pdf:list:cached");
    } catch (_) {}

    return res.json({
      ok: true,
      data: {
        id: updated.id,
        sizeBytes: String(updated.sizeBytes),
      },
    });

  } catch (err) {
    console.error("[pdfController.overwritePdf]", err);
    return res.status(500).json({
      ok: false,
      message: "Overwrite failed",
    });
  }
};

exports.getProtectedPdf = async (req, res) => {
  try {
    const userId = req.user.id;
    const pdfId = Number(req.params.id);

    const pdf = await prisma.pdf.findUnique({
      where: { id: pdfId },
      include: { pdftag: { include: { tag: true } } },
    });

    if (!pdf || pdf.isDeleted) {
      return res.status(404).json({
        ok: false,
        message: "PDF not found",
      });
    }

    /* 🔥 CHECK TAG */
    const isSubscriptionPdf = pdf.pdftag.some(
      (t) => t.tag?.name === "Subscription"
    );

    /* 🔥 ONLY CHECK SUBSCRIPTION IF REQUIRED */
    if (isSubscriptionPdf) {
      const subscription = await prisma.usersubscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          endDate: { gte: new Date() },
        },
      });

      if (!subscription) {
        return res.status(403).json({
          ok: false,
          message: "Subscription required",
        });
      }
    }

    return res.json({
      ok: true,
      url: pdf.url,
    });

  } catch (err) {
    console.error("getProtectedPdf error", err);
    return res.status(500).json({ ok: false });
  }
};