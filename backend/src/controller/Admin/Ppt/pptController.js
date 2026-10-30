'use strict';

const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getPptModel() {
  const model = prisma.pptfile || prisma.pptFile || prisma.PptFile;
  if (!model) {
    throw new Error(
      "Prisma model 'pptfile' is not generated. Run 'npx prisma generate' on the server and restart PM2."
    );
  }
  return model;
}
const multer = require('multer');
const crypto = require('crypto');
const { execFile } = require('child_process');
const learnFeedCache = require('../../../lib/learnFeedCache');

function getPdfStoragePath(storagePath) {
  if (!storagePath) return null;
  const ext = path.extname(storagePath);
  return storagePath.slice(0, -ext.length) + '.pdf';
}

function resolvePdfUrl(req, storagePath) {
  if (!storagePath) return null;
  const pdfRel = getPdfStoragePath(storagePath);
  const pdfAbs = path.join(process.cwd(), 'public', pdfRel);
  if (fsSync.existsSync(pdfAbs)) {
    return toPublicUrl(req, pdfRel);
  }
  // Trigger background conversion if script exists
  triggerPptToPdfConversion(storagePath).catch(() => {});
  return null;
}

function triggerPptToPdfConversion(storagePath) {
  return new Promise((resolve) => {
    try {
      const ext = path.extname(storagePath);
      const pdfRel = storagePath.slice(0, -ext.length) + '.pdf';
      const pptAbs = path.join(process.cwd(), 'public', storagePath);
      const pdfAbs = path.join(process.cwd(), 'public', pdfRel);
      const scriptPath = path.join(process.cwd(), 'scripts', 'convertPpt.ps1');

      if (!fsSync.existsSync(pptAbs) || !fsSync.existsSync(scriptPath)) {
        return resolve(null);
      }

      execFile(
        'powershell',
        ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-InputFile', pptAbs, '-OutputFile', pdfAbs],
        { timeout: 180000 },
        (err) => {
          if (err) console.warn('[pptController] PPT conversion notice:', err.message);
          resolve(pdfAbs);
        }
      );
    } catch (_) {
      resolve(null);
    }
  });
}

const PPT_MAX_SIZE_MB = Number(process.env.PPT_MAX_SIZE_MB || 50);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'presentations');

// Ensure upload directory exists
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    console.warn('[pptController] could not create upload dir', UPLOAD_DIR, e && e.message);
  }
})();

function safeFileName(original) {
  const ext = path.extname(original) || '.pptx';
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const rand = crypto.randomBytes(4).toString('hex');
  return `${base}-${Date.now()}-${rand}${ext}`;
}

function toPublicUrl(req, storagePath) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/${storagePath.replace(/^\/+/, '')}`;
}

const ALLOWED_EXTS = ['.ppt', '.pptx', '.odp', '.pps', '.ppsx'];
const ALLOWED_MIMES = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  'application/vnd.oasis.opendocument.presentation',
  'application/octet-stream',
];

function isPptFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  return ALLOWED_EXTS.includes(ext) || ALLOWED_MIMES.includes(file.mimetype);
}

// Multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, safeFileName(file.originalname));
  },
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: PPT_MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!isPptFile(file)) {
      return cb(new Error('Only PowerPoint and presentation files (.ppt, .pptx, .odp, .pps, .ppsx) are allowed'));
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

/**
 * POST /foliomax/admin/ppt/upload
 */
exports.uploadPpt = async (req, res) => {
  try {
    await runMulter(req, res);

    if (!req.file) {
      return res.status(400).json({ ok: false, message: "No file field named 'file' was sent" });
    }

    const { originalname, mimetype, size, filename } = req.file;
    const storagePath = `uploads/presentations/${filename}`;

    let pageName = null;
    if (req.body && typeof req.body.pageName === 'string') {
      const trimmed = req.body.pageName.trim();
      if (trimmed && trimmed !== 'none') {
        pageName = trimmed;
      }
    }

    const displayName = req.body.title?.trim() || originalname;

    const fileRec = await getPptModel().create({
      data: {
        name: displayName,
        originalFilename: originalname,
        mimeType: mimetype,
        sizeBytes: BigInt(size),
        storagePath,
        isActive: true,
        pageName,
      },
    });

    await learnFeedCache.invalidate().catch(() => {});

    // Automatically trigger PPT to PDF conversion for perfect fidelity
    triggerPptToPdfConversion(fileRec.storagePath).catch(() => {});

    return res.status(201).json({
      ok: true,
      file: {
        id: fileRec.id,
        name: fileRec.name,
        url: toPublicUrl(req, fileRec.storagePath),
        pdfUrl: resolvePdfUrl(req, fileRec.storagePath),
        size: Number(fileRec.sizeBytes),
        uploadedAt: fileRec.createdAt,
        pageName: fileRec.pageName ?? null,
      },
    });
  } catch (err) {
    console.error('uploadPpt error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Upload failed' });
  }
};

/**
 * GET /foliomax/admin/ppt
 */
exports.listPpts = async (req, res) => {
  try {
    const qPageName = typeof req.query.pageName === 'string' ? req.query.pageName : null;
    let where = { isDeleted: false };

    if (qPageName && qPageName !== 'all') {
      if (qPageName === 'none') {
        where = { ...where, pageName: null };
      } else {
        where = { ...where, pageName: qPageName };
      }
    }

    const rows = await getPptModel().findMany({
      where,
      orderBy: { id: 'desc' },
    });

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.storagePath ? toPublicUrl(req, r.storagePath) : '',
      size: r.sizeBytes ? Number(r.sizeBytes) : undefined,
      uploadedAt: r.createdAt?.toISOString?.() ?? null,
      pageName: r.pageName ?? null,
    }));

    return res.json(data);
  } catch (err) {
    console.error('listPpts error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Failed to list presentations' });
  }
};

/**
 * GET /foliomax/admin/ppt/:id
 */
exports.getPpt = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const rec = await getPptModel().findUnique({
      where: { id },
    });

    if (!rec || rec.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Presentation not found' });
    }

    return res.json({
      ok: true,
      id: rec.id,
      name: rec.name,
      originalFilename: rec.originalFilename,
      url: rec.storagePath ? toPublicUrl(req, rec.storagePath) : '',
      pdfUrl: rec.storagePath ? resolvePdfUrl(req, rec.storagePath) : null,
      size: rec.sizeBytes ? Number(rec.sizeBytes) : undefined,
      uploadedAt: rec.createdAt,
      pageName: rec.pageName,
    });
  } catch (err) {
    console.error('getPpt error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Failed to fetch presentation' });
  }
};

/**
 * DELETE /foliomax/admin/ppt/:id
 */
exports.deletePpt = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const file = await getPptModel().findUnique({
      where: { id },
    });

    if (!file || file.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Presentation not found' });
    }

    // Delete file from disk if present
    if (file.storagePath) {
      const abs = path.join(process.cwd(), 'public', file.storagePath);
      try {
        await fs.unlink(abs);
      } catch (_) {}
    }

    await getPptModel().update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    await learnFeedCache.invalidate().catch(() => {});

    return res.json({ ok: true, message: 'Presentation deleted successfully' });
  } catch (err) {
    console.error('deletePpt error:', err);
    return res.status(500).json({ ok: false, message: err.message || 'Failed to delete presentation' });
  }
};

/**
 * GET /foliomax/admin/ppt/count
 */
exports.getCount = async (req, res) => {
  try {
    const count = await getPptModel().count({
      where: { isDeleted: false },
    });
    return res.json({ ok: true, count });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || 'Failed to count presentations' });
  }
};


/**
 * GET /foliomax/public/ppt/protected/:id
 * Protected presentation access (subscription check)
 */
exports.getProtectedPpt = async (req, res) => {
  try {
    const userId = req.user.id;
    const pptId = Number(req.params.id);

    const ppt = await getPptModel().findUnique({
      where: { id: pptId },
    });

    if (!ppt || ppt.isDeleted) {
      return res.status(404).json({
        ok: false,
        message: "Presentation not found",
      });
    }

    if (ppt.pageName === "subscription") {
      const subscription = await prisma.usersubscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          endDate: { gte: new Date() },
        },
      });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isAdmin = user && user.role === "ADMIN";

      if (!subscription && !isAdmin) {
        return res.status(403).json({
          ok: false,
          message: "Subscription required",
        });
      }
    }

    return res.json({
      ok: true,
      id: ppt.id,
      name: ppt.name,
      originalFilename: ppt.originalFilename,
      pageName: ppt.pageName,
      size: ppt.sizeBytes ? Number(ppt.sizeBytes) : undefined,
      uploadedAt: ppt.createdAt,
      url: ppt.storagePath ? toPublicUrl(req, ppt.storagePath) : "",
      pdfUrl: ppt.storagePath ? resolvePdfUrl(req, ppt.storagePath) : null,
    });
  } catch (err) {
    console.error("getProtectedPpt error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};