'use strict';

const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  uploadWord,
  parse,
  list,
  remove,
  overwrite,
  getMeta,
  getTextRange,
  getOne,
  getCount        // <-- add here
} = require('../../../controller/Admin/Word/wordController');

// -------------------------
// STORAGE CONFIG (multer)
// -------------------------
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_, __, cb) {
    cb(null, uploadDir);
  },
  filename: function (_, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const final = `${base}-${Date.now()}${ext}`;
    cb(null, final);
  },
});

// Limit: 10 MB same as frontend
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// -------------------------
// ROUTES
// -------------------------

// ⬇️ Add Word file count route BEFORE any route using :id
router.get('/wordfiles/count', getCount);       // <--- IMPORTANT

// Upload Word File (.docx, .doc, .rtf, .txt)
router.post('/upload-word', upload.single('file'), uploadWord);

// Get list of uploaded Word files
router.get('/', list);

// Parse file (fast: Redis/disk → slow: Mammoth)
router.get('/:id/parse', parse);

// Get single file details
router.get('/:id', getOne);

// Delete file
router.delete('/:id', remove);

// Overwrite file
router.patch('/:id/overwrite', upload.single('file'), overwrite);

// Get metadata
router.get('/:id/meta', getMeta);

// Paginated text content
router.get('/:id/text', getTextRange);

module.exports = router;
