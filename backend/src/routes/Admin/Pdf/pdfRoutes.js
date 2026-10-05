const express = require('express');
const router = express.Router();

const pdfController = require('../../../controller/Admin/Pdf/pdfController');
const { authMiddleware, adminOnly } = require('../../../middlewares/authMiddleware');

/* =====================================================
   PUBLIC ROUTES
===================================================== */

/**
 * GET /public
 * Example:
 * /public?tags=education
 * /public?tags=training,education&mode=all
 */
router.get('/public', pdfController.publicListPdfsByTag);

/**
 * 🔥 PROTECTED PDF VIEW (FIXED)
 * Requires login + subscription check
 */
router.get(
  "/protected/:id",
  authMiddleware, // ✅ VERY IMPORTANT
  pdfController.getProtectedPdf
);

/* =====================================================
   ADMIN PROTECTED ROUTES
===================================================== */

// Require auth + admin for all routes below
router.use(authMiddleware);
router.use(adminOnly);

/**
 * POST /upload
 * form-data:
 * file=<pdf>
 * optional: title, description, tags (JSON array or csv)
 */
router.post('/upload', pdfController.uploadPdf);

/**
 * GET /
 * optional query:
 * ?page=1
 * &limit=20
 * &tags=education,training
 * &mode=any|all
 */
router.get('/', pdfController.listPdfs);

/**
 * GET /:id
 * Return metadata for a PDF (ADMIN ONLY)
 */
router.get('/:id', pdfController.getPdf);

/**
 * PATCH /:id/overwrite
 */
router.patch('/:id/overwrite', pdfController.overwritePdf);

/**
 * DELETE /:id
 */
router.delete('/:id', pdfController.deletePdf);

module.exports = router;