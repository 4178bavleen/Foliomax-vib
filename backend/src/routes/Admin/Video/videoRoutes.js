const express = require('express');
const router = express.Router();
const vedioController = require('../../../controller/Admin/Video/videoController');
const { authMiddleware, adminOnly } = require('../../../middlewares/authMiddleware');



router.get('/public', vedioController.publicListVideosByTag);

// Require auth + admin for all routes here
router.use(authMiddleware);
router.use(adminOnly);

/**
 * POST /upload
 * form-data: file=<video> & optional title, description, tags (JSON array or csv)
 */
router.post('/upload', vedioController.uploadVideo);

/**
 * GET /
 * optional query: ?page=1&limit=20&tags=education,training&mode=any|all
 */
router.get('/', vedioController.listVideos);

/**
 * GET /:id
 * return metadata for a video
 */
router.get('/:id', vedioController.getVideo);

/**
 * PATCH /:id/overwrite
 * multipart form-data: file=<video>  (replaces bytes)
 * optional: title, description, tags
 */
router.patch('/:id/overwrite', vedioController.overwriteVideo);

/**
 * DELETE /:id
 */
router.delete('/:id', vedioController.deleteVideo);



module.exports = router;
