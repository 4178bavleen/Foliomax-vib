const express = require("express");
const router = express.Router();
const { uploadExcel } = require("../lib/upload");
const ctrl = require("../controller/fileController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Upload Excel
router.post("/api/files/upload-excel", (req, res) => {
  uploadExcel(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          ok: false,
          message: `File too large (max ${process.env.MAX_UPLOAD_MB || 10}MB)`,
        });
      }
      return res
        .status(400)
        .json({ ok: false, message: err.message || "Invalid file" });
    }
    try {
      await ctrl.uploadExcel(req, res);
    } catch (e) {
      console.error("controller error:", e);
      res
        .status(500)
        .json({ ok: false, message: e.message || "Upload failed (controller)" });
    }
  });
});

// List files
router.get("/api/files", ctrl.list);

// Delete file
router.delete("/api/files/:id", ctrl.remove);

// Overwrite Excel
router.patch("/api/files/:id/overwrite", (req, res) => {
  uploadExcel(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          ok: false,
          message: `File too large (max ${process.env.MAX_UPLOAD_MB || 10}MB)`,
        });
      }
      return res
        .status(400)
        .json({ ok: false, message: err.message || "Invalid file" });
    }
    return ctrl.overwrite(req, res);
  });
});

// Parse Excel — returns JSON with values + cell styles (existing)
router.get("/api/files/:id/parse", ctrl.parse);

// NEW: serve the small metadata file the worker writes (sparse styles, merges, cols)
router.get("/api/files/:id/sheets/:sheetIndex/meta", ctrl.getSheetMeta);

// NEW: fetch CSV rows by range: ?start=0&limit=200
router.get("/api/files/:id/sheets/:sheetIndex/csv", ctrl.getSheetCsvRange);

// Protected Excel file access (requires auth + subscription check for premium files)
router.get("/api/files/:id/protected", authMiddleware, ctrl.getProtectedFile);

module.exports = router;