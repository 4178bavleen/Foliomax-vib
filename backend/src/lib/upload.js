const multer = require("multer");
const path = require("path");
const fs = require("fs");

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 20);
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure folder exists at boot
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ACCEPTED_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls (legacy)
  "text/csv", // .csv
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^\w.-]+/g, "_");
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ACCEPTED_MIME.has(file.mimetype)) {
    return cb(new Error("Only .xlsx, .xls, .csv allowed"));
  }
  cb(null, true);
};

const uploadExcel = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
}).single("file"); // IMPORTANT: field name 'file'

module.exports = { uploadExcel, UPLOAD_DIR };
