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

async function resolvePdfUrl(req, storagePath) {
  if (!storagePath) return null;
  const pdfRel = getPdfStoragePath(storagePath);
  const pdfAbs = path.join(process.cwd(), 'public', pdfRel);
  if (fsSync.existsSync(pdfAbs)) {
    return toPublicUrl(req, pdfRel);
  }
  // Try on-demand conversion immediately so the request returns the ready PDF
  try {
    await triggerPptToPdfConversion(storagePath);
    if (fsSync.existsSync(pdfAbs)) {
      return toPublicUrl(req, pdfRel);
    }
  } catch (err) {
    console.warn('[pptController] On-demand conversion notice:', err && err.message);
  }
  return null;
}

function convertWithSoffice(inputAbs, outDir) {
  const binaries = [
    process.env.LIBREOFFICE_BIN,
    'libreoffice',
    'soffice',
    '/usr/bin/libreoffice',
    '/usr/bin/soffice',
    '/snap/bin/libreoffice',
  ].filter(Boolean);

  const args = [
    '--headless',
    '--invisible',
    '--nodefault',
    '--nofirststartwizard',
    '--nolockcheck',
    '--nologo',
    '--norestore',
    '-env:UserInstallation=file:///tmp/libreoffice_profile',
    '--convert-to',
    'pdf',
    '--outdir',
    outDir,
    inputAbs,
  ];

  return new Promise(async (resolve, reject) => {
    let lastError = null;
    for (const bin of binaries) {
      try {
        await new Promise((res, rej) => {
          execFile(bin, args, { timeout: 90000 }, (err, stdout, stderr) => {
            if (err) {
              const msg = (stderr || stdout || err.message || 'soffice failed').toString();
              return rej(new Error(msg));
            }
            res();
          });
        });
        return resolve();
      } catch (e) {
        lastError = e;
      }
    }
    reject(lastError || new Error('No LibreOffice binary found'));
  });
}

function convertWithPowerShell(inputAbs, outputAbs) {
  const scriptPath = path.join(process.cwd(), 'scripts', 'convertPpt.ps1');
  if (!fsSync.existsSync(scriptPath)) {
    return Promise.reject(new Error('convertPpt.ps1 not found'));
  }
  return new Promise((resolve, reject) => {
    execFile(
      'powershell',
      ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-InputFile', inputAbs, '-OutputFile', outputAbs],
      { timeout: 180000 },
      (err, stdout, stderr) => {
        if (err) {
          const msg = (stderr || stdout || err.message || 'powershell conversion failed').toString();
          return reject(new Error(msg));
        }
        resolve();
      }
    );
  });
}

async function triggerPptToPdfConversion(storagePath) {
  try {
    const ext = path.extname(storagePath);
    const pdfRel = storagePath.slice(0, -ext.length) + '.pdf';
    const pptAbs = path.join(process.cwd(), 'public', storagePath);
    const pdfAbs = path.join(process.cwd(), 'public', pdfRel);
    const outDir = path.dirname(pdfAbs);

    if (!fsSync.existsSync(pptAbs)) {
      return null;
    }
    if (fsSync.existsSync(pdfAbs)) {
      return pdfAbs;
    }

    // 1. Try LibreOffice (primary cross-platform converter, standard on Linux production)
    try {
      await convertWithSoffice(pptAbs, outDir);
      if (fsSync.existsSync(pdfAbs)) {
        console.log('[pptController] Successfully converted presentation to PDF via LibreOffice:', pdfRel);
        return pdfAbs;
      }
    } catch (sofficeErr) {
      // 2. If Windows and LibreOffice is not installed, fallback to PowerShell PowerPoint COM
      if (process.platform === 'win32') {
        try {
          await convertWithPowerShell(pptAbs, pdfAbs);
          if (fsSync.existsSync(pdfAbs)) {
            console.log('[pptController] Successfully converted presentation to PDF via PowerShell:', pdfRel);
            return pdfAbs;
          }
        } catch (psErr) {
          console.warn('[pptController] PowerShell conversion fallback failed:', psErr.message);
        }
      } else {
        console.warn('[pptController] LibreOffice conversion warning:', sofficeErr.message);
      }
    }
  } catch (err) {
    console.warn('[pptController] PPT conversion failed:', err.message);
  }
  return null;
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
  if (!storagePath) return '';
  const clean = storagePath.replace(/^\/+/, '');
  if (!clean) return '';
  const host = req.get('host') || '';
  const proto =
    req.headers['x-forwarded-proto'] ||
    (req.secure ? 'https' : (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'));
  const base = `${proto}://${host}`;
  return `${base}/${clean}`;
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

    // Automatically trigger and await PPT to PDF conversion via LibreOffice
    await triggerPptToPdfConversion(fileRec.storagePath).catch(() => {});

    return res.status(201).json({
      ok: true,
      file: {
        id: fileRec.id,
        name: fileRec.name,
        url: toPublicUrl(req, fileRec.storagePath),
        pdfUrl: await resolvePdfUrl(req, fileRec.storagePath),
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
      pdfUrl: rec.storagePath ? await resolvePdfUrl(req, rec.storagePath) : null,
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
      pdfUrl: ppt.storagePath ? await resolvePdfUrl(req, ppt.storagePath) : null,
    });
  } catch (err) {
    console.error("getProtectedPpt error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

/**
 * GET /foliomax/public/ppt/diagnostics/system
 * Diagnostic endpoint to inspect LibreOffice converter status on host
 */
exports.checkHealth = async (req, res) => {
  const results = {};
  const binaries = [
    process.env.LIBREOFFICE_BIN,
    'libreoffice',
    'soffice',
    '/usr/bin/libreoffice',
    '/usr/bin/soffice',
    '/snap/bin/libreoffice',
  ].filter(Boolean);

  for (const bin of binaries) {
    try {
      const ver = await new Promise((resolve, reject) => {
        execFile(bin, ['--version'], { timeout: 8000 }, (err, stdout, stderr) => {
          if (err) return reject(new Error(stderr || stdout || err.message));
          resolve((stdout || stderr || '').trim());
        });
      });
      results[bin] = { status: 'available', version: ver };
    } catch (e) {
      results[bin] = { status: 'not available', error: e.message };
    }
  }

  return res.json({
    ok: true,
    platform: process.platform,
    cwd: process.cwd(),
    binaries: results,
  });
};