const express = require("express");
const router = express.Router();
const { uploadExcel } = require("../lib/upload");
const ctrl = require("../controller/fileController");
const {
  authMiddleware,
  adminOnly,
} = require("../middlewares/authMiddleware");

const MAX_MB = process.env.MAX_UPLOAD_MB || 20;

const handleUpload = (req, res, next) => {
  uploadExcel(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          ok: false,
          message: `File too large (max ${MAX_MB}MB)`,
        });
      }
      return res
        .status(400)
        .json({ ok: false, message: err.message || "Invalid file" });
    }
    return next();
  });
};

// Upload Excel (admin only)
router.post(
  "/api/files/upload-excel",
  authMiddleware,
  adminOnly,
  handleUpload,
  ctrl.uploadExcel,
);

// List files — read by the public site as well, intentionally unauthenticated
router.get("/api/files", ctrl.list);

// Delete file (admin only)
router.delete("/api/files/:id", authMiddleware, adminOnly, ctrl.remove);

// Replace the whole workbook (admin only)
router.patch(
  "/api/files/:id/overwrite",
  authMiddleware,
  adminOnly,
  handleUpload,
  ctrl.overwrite,
);

// Edit a single sheet's cell values in place, preserving styles (admin only)
router.patch(
  "/api/files/:id/sheets/:sheetIndex",
  authMiddleware,
  adminOnly,
  ctrl.updateSheet,
);

// Parse Excel — returns JSON with values + cell styles (existing)
router.get("/api/files/:id/parse", ctrl.parse);

// Serve the small metadata file the worker writes (sparse styles, merges, cols)
router.get("/api/files/:id/sheets/:sheetIndex/meta", ctrl.getSheetMeta);

// Fetch CSV rows by range: ?start=0&limit=200
router.get("/api/files/:id/sheets/:sheetIndex/csv", ctrl.getSheetCsvRange);

// Protected Excel file access (requires auth + subscription check for premium files)
router.get("/api/files/:id/protected", authMiddleware, ctrl.getProtectedFile);

module.exports = router;