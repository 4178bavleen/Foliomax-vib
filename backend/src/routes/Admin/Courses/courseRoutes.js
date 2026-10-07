const express = require('express');
const router = express.Router();

const courseController = require('../../../controller/Admin/Courses/courseController');
const { authMiddleware, adminOnly } = require('../../../middlewares/authMiddleware');

/* =====================================================
   PUBLIC ROUTES
===================================================== */

/**
 * GET /active
 * Public list of active courses (customer site)
 */
router.get('/active', courseController.listActive);

/**
 * GET /:id/protected
 * Requires login + subscription check (if course linked to a plan)
 */
router.get('/:id/protected', authMiddleware, courseController.getCourseProtected);

/**
 * GET /:id
 * Public metadata of a single active course (course player page)
 */
router.get('/:id', courseController.getCoursePublic);

/* =====================================================
   ADMIN PROTECTED ROUTES
===================================================== */

router.use(authMiddleware);
router.use(adminOnly);

/**
 * POST /upload
 * form-data:
 * file=<course file> (required), thumbnail=<image> (optional)
 * title (required), description, category, duration, status, sortOrder, planId
 */
router.post('/upload', courseController.createCourse);

/**
 * GET /
 * Full course list (admin)
 */
router.get('/', courseController.listAll);

/**
 * PUT /:id
 * Same form-data as /upload; file/thumbnail optional (replace if sent)
 */
router.put('/:id', courseController.updateCourse);

/**
 * DELETE /:id
 */
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
