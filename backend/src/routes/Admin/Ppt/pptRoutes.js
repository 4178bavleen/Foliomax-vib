'use strict';

const express = require('express');
const router = express.Router();

const {
  uploadPpt,
  listPpts,
  getPpt,
  deletePpt,
  getCount,
  getProtectedPpt,
  checkHealth,
} = require('../../../controller/Admin/Ppt/pptController');
const { authMiddleware, adminOnly } = require('../../../middlewares/authMiddleware');

// Diagnostics & health check
router.get('/diagnostics/system', checkHealth);

// Read endpoints (accessible publicly or by admin)
router.get('/public', listPpts);
router.get('/count', getCount);
router.get('/', listPpts);

// Protected presentation view (checks subscription for premium PPTs)
router.get('/protected/:id', authMiddleware, getProtectedPpt);

router.get('/:id', getPpt);

// Admin protected endpoints
router.post('/upload', authMiddleware, adminOnly, uploadPpt);
router.delete('/:id', authMiddleware, adminOnly, deletePpt);

module.exports = router;
