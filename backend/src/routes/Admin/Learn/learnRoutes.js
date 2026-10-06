// src/routes/Admin/Learn/learnRoutes.js
const express = require('express');
const router = express.Router();

const { getLearnFeed } = require('../../../controller/Admin/Learn/learnFeedController');

// Public unified feed for the public "Learn With Us" page.
router.get('/feed', getLearnFeed);

module.exports = router;