'use strict';

const path = require('path');
const fs = require('fs/promises');
const multer = require('multer');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COURSE_MAX_SIZE_MB = Number(process.env.COURSE_MAX_SIZE_MB || 200);
const THUMB_MAX_SIZE_MB = 5;
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'courses');
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbnails');
const TMP_DIR = path.join(UPLOAD_DIR, 'tmp');

const FILE_EXTS = [
  '.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.flv', '.wmv',
  '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
  '.ppt', '.pptx', '.odp',
  '.xls', '.xlsx', '.csv', '.ods',
  '.zip', '.rar', '.7z',
];

const THUMB_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

const KIND_MAP = {
  video: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.flv', '.wmv'],
  presentation: ['.ppt', '.pptx', '.odp'],
  document: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
  spreadsheet: ['.xls', '.xlsx', '.csv', '.ods'],
  archive: ['.zip', '.rar', '.7z'],
};

function extOf(name) {
  return path.extname(name || '').toLowerCase();
}

function kindFor(ext) {
  for (const [kind, exts] of Object.entries(KIND_MAP)) {
    if (exts.includes(ext)) return kind;
  }
  return 'other';
}

function safeName(ext) {
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

function toPublicUrl(req, storagePath) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/${storagePath.replace(/^\/+/, '')}`;
}

async function ensureDirs() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(THUMB_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
}

ensureDirs().catch((e) => console.warn('[courseController] dir error', e.message));

async function moveTmp(tmpPath, finalAbs) {
  await fs.mkdir(path.dirname(finalAbs), { recursive: true });
  try {
    await fs.rename(tmpPath, finalAbs);
  } catch (err) {
    if (err.code === 'EXDEV') {
      await fs.copyFile(tmpPath, finalAbs);
      await fs.unlink(tmpPath);
    } else {
      throw err;
    }
  }
}

async function unlinkQuiet(absPath) {
  if (!absPath) return;
  try {
    await fs.unlink(absPath);
  } catch (_) {}
}

/* =====================================================
   Multer
===================================================== */

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureDirs();
      cb(null, TMP_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const ext = extOf(file.originalname);
    cb(null, safeName(ext));
  },
});

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: COURSE_MAX_SIZE_MB * 1024 * 1024,
    files: 2,
  },
  fileFilter: (req, file, cb) => {
    const ext = extOf(file.originalname);

    if (file.fieldname === 'thumbnail') {
      if (!THUMB_EXTS.includes(ext)) {
        return cb(new Error(`Thumbnail must be an image (${THUMB_EXTS.join(', ')})`));
      }
      return cb(null, true);
    }

    if (file.fieldname === 'file') {
      if (!FILE_EXTS.includes(ext)) {
        return cb(new Error(`File type not allowed (${ext || 'unknown'})`));
      }
      return cb(null, true);
    }

    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
  },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

const runMulter = (req, res) =>
  new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => (err ? reject(err) : resolve()));
  });

function parseBody(body) {
  const title = String(body.title || '').trim();
  const description = body.description ? String(body.description).trim() : null;
  const category = body.category ? String(body.category).trim() : null;
  const duration = body.duration !== undefined && body.duration !== '' ? Number(body.duration) : null;
  const status = body.status === 'draft' ? 'draft' : 'active';
  const sortOrder = body.sortOrder !== undefined && body.sortOrder !== '' ? Number(body.sortOrder) : 0;

  let planId = null;
  if (body.planId !== undefined && body.planId !== null && String(body.planId).trim() !== '') {
    planId = Number(body.planId);
    if (!Number.isInteger(planId)) planId = null;
  }

  return { title, description, category, duration, status, sortOrder, planId };
}

/* =====================================================
   CREATE
===================================================== */

exports.createCourse = async (req, res) => {
  try {
    await runMulter(req, res);

    const file = req.files?.file?.[0];
    const thumb = req.files?.thumbnail?.[0];

    if (!file) {
      return res.status(400).json({ ok: false, message: "Course file is required" });
    }

    const fields = parseBody(req.body);

    if (!fields.title) {
      await unlinkQuiet(file.path);
      if (thumb) await unlinkQuiet(thumb.path);
      return res.status(400).json({ ok: false, message: "Title is required" });
    }

    if (thumb && thumb.size > THUMB_MAX_SIZE_MB * 1024 * 1024) {
      await unlinkQuiet(file.path);
      await unlinkQuiet(thumb.path);
      return res.status(400).json({ ok: false, message: `Thumbnail must be under ${THUMB_MAX_SIZE_MB}MB` });
    }

    if (fields.planId) {
      const plan = await prisma.subscriptionplan.findUnique({ where: { id: fields.planId } });
      if (!plan) {
        await unlinkQuiet(file.path);
        if (thumb) await unlinkQuiet(thumb.path);
        return res.status(400).json({ ok: false, message: "Selected plan does not exist" });
      }
    }

    const ext = extOf(file.originalname);
    const fileRel = path.posix.join('uploads', 'courses', file.filename);
    const fileAbs = path.join(process.cwd(), 'public', fileRel);
    await moveTmp(file.path, fileAbs);

    let thumbRel = null;
    if (thumb) {
      const tExt = extOf(thumb.originalname);
      const tName = safeName(tExt);
      thumbRel = path.posix.join('uploads', 'courses', 'thumbnails', tName);
      const thumbAbs = path.join(process.cwd(), 'public', thumbRel);
      await moveTmp(thumb.path, thumbAbs);
    }

    const created = await prisma.course.create({
      data: {
        title: fields.title,
        description: fields.description,
        category: fields.category,
        duration: fields.duration,
        status: fields.status,
        sortOrder: fields.sortOrder,
        planId: fields.planId,
        fileName: file.originalname,
        filePath: fileRel,
        fileUrl: toPublicUrl(req, fileRel),
        fileSize: file.size,
        fileType: ext.replace('.', ''),
        fileKind: kindFor(ext),
        mimeType: file.mimetype,
        thumbnail: thumbRel,
        thumbnailUrl: thumb ? toPublicUrl(req, thumbRel) : null,
        uploadedById: req.user?.id || null,
      },
      include: { plan: { select: { id: true, name: true, duration: true, price: true } } },
    });

    return res.status(201).json({ ok: true, course: created });
  } catch (err) {
    console.error('[courseController.createCourse]', err);
    const message = err instanceof multer.MulterError || err.message?.startsWith('Thumbnail') || err.message?.startsWith('File type')
      ? err.message
      : 'Upload failed';
    return res.status(500).json({ ok: false, message });
  }
};

/* =====================================================
   LIST (ADMIN)
===================================================== */

exports.listAll = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { plan: { select: { id: true, name: true, duration: true, price: true } } },
    });
    return res.json({ ok: true, data: courses });
  } catch (err) {
    console.error('[courseController.listAll]', err);
    return res.status(500).json({ ok: false, message: 'Failed to load courses' });
  }
};

/* =====================================================
   LIST (PUBLIC — active only)
===================================================== */

// Public shape: never expose the raw file URL of plan-linked courses
function publicShape(c) {
  if (!c) return c;
  const { fileUrl, ...rest } = c;
  return { ...rest, fileUrl: c.planId ? null : fileUrl };
}

exports.listActive = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'active' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { plan: { select: { id: true, name: true, duration: true, price: true } } },
    });
    return res.json({ ok: true, data: courses.map(publicShape) });
  } catch (err) {
    console.error('[courseController.listActive]', err);
    return res.status(500).json({ ok: false, message: 'Failed to load courses' });
  }
};

/* =====================================================
   GET SINGLE (PUBLIC — active only)
===================================================== */

exports.getCoursePublic = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }

    const course = await prisma.course.findFirst({
      where: { id, status: 'active' },
      include: { plan: { select: { id: true, name: true, duration: true, price: true } } },
    });

    if (!course) {
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }

    return res.json({ ok: true, course: publicShape(course) });
  } catch (err) {
    console.error('[courseController.getCoursePublic]', err);
    return res.status(500).json({ ok: false, message: 'Failed to load course' });
  }
};

/* =====================================================
   UPDATE
===================================================== */

exports.updateCourse = async (req, res) => {
  try {
    await runMulter(req, res);

    const id = Number(req.params.id);
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }

    const file = req.files?.file?.[0];
    const thumb = req.files?.thumbnail?.[0];
    const fields = parseBody(req.body);

    if (!fields.title) {
      if (file) await unlinkQuiet(file.path);
      if (thumb) await unlinkQuiet(thumb.path);
      return res.status(400).json({ ok: false, message: 'Title is required' });
    }

    if (thumb && thumb.size > THUMB_MAX_SIZE_MB * 1024 * 1024) {
      if (file) await unlinkQuiet(file.path);
      await unlinkQuiet(thumb.path);
      return res.status(400).json({ ok: false, message: `Thumbnail must be under ${THUMB_MAX_SIZE_MB}MB` });
    }

    if (fields.planId) {
      const plan = await prisma.subscriptionplan.findUnique({ where: { id: fields.planId } });
      if (!plan) {
        if (file) await unlinkQuiet(file.path);
        if (thumb) await unlinkQuiet(thumb.path);
        return res.status(400).json({ ok: false, message: 'Selected plan does not exist' });
      }
    }

    const data = {
      title: fields.title,
      description: fields.description,
      category: fields.category,
      duration: fields.duration,
      status: fields.status,
      sortOrder: fields.sortOrder,
      planId: fields.planId,
    };

    if (file) {
      const ext = extOf(file.originalname);
      const fileRel = path.posix.join('uploads', 'courses', file.filename);
      const fileAbs = path.join(process.cwd(), 'public', fileRel);
      await moveTmp(file.path, fileAbs);

      data.fileName = file.originalname;
      data.filePath = fileRel;
      data.fileUrl = toPublicUrl(req, fileRel);
      data.fileSize = file.size;
      data.fileType = ext.replace('.', '');
      data.fileKind = kindFor(ext);
      data.mimeType = file.mimetype;

      await unlinkQuiet(path.join(process.cwd(), 'public', existing.filePath));
    }

    if (thumb) {
      const tExt = extOf(thumb.originalname);
      const tName = safeName(tExt);
      const thumbRel = path.posix.join('uploads', 'courses', 'thumbnails', tName);
      const thumbAbs = path.join(process.cwd(), 'public', thumbRel);
      await moveTmp(thumb.path, thumbAbs);

      data.thumbnail = thumbRel;
      data.thumbnailUrl = toPublicUrl(req, thumbRel);

      if (existing.thumbnail) {
        await unlinkQuiet(path.join(process.cwd(), 'public', existing.thumbnail));
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data,
      include: { plan: { select: { id: true, name: true, duration: true, price: true } } },
    });

    return res.json({ ok: true, course: updated });
  } catch (err) {
    console.error('[courseController.updateCourse]', err);
    const message = err instanceof multer.MulterError || err.message?.startsWith('Thumbnail') || err.message?.startsWith('File type') || err.message?.startsWith('File type')
      ? err.message
      : 'Update failed';
    return res.status(500).json({ ok: false, message });
  }
};

/* =====================================================
   DELETE
===================================================== */

exports.deleteCourse = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }

    await prisma.course.delete({ where: { id } });

    await unlinkQuiet(path.join(process.cwd(), 'public', existing.filePath));
    if (existing.thumbnail) {
      await unlinkQuiet(path.join(process.cwd(), 'public', existing.thumbnail));
    }

    return res.json({ ok: true, message: 'Course deleted' });
  } catch (err) {
    console.error('[courseController.deleteCourse]', err);
    return res.status(500).json({ ok: false, message: 'Delete failed' });
  }
};

/* =====================================================
   PROTECTED ACCESS (customer — checks plan subscription)
===================================================== */

exports.getCourseProtected = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const course = await prisma.course.findUnique({ where: { id } });

    if (!course || course.status !== 'active') {
      return res.status(404).json({ ok: false, message: 'Course not found' });
    }

    if (course.planId) {
      const subscription = await prisma.usersubscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
      });

      if (!subscription) {
        return res.status(403).json({ ok: false, message: 'Subscription required' });
      }
    }

    return res.json({
      ok: true,
      url: course.fileUrl,
      fileName: course.fileName,
      fileKind: course.fileKind,
      mimeType: course.mimeType,
    });
  } catch (err) {
    console.error('[courseController.getCourseProtected]', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};
