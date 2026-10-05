const express = require("express");
const router = express.Router();

const {
  createInsight,
  getInsights,
  getInsightBySlug,
  deleteInsight
} = require("../../../controller/Admin/Etf&MutualFund/insightsController");

// import insight-specific multer
const insightUpload = require("../../../config/insightMulter");

// CREATE INSIGHT (with image upload)
router.post(
  "/",
  insightUpload.single("coverImage"), 
  createInsight
);

// LIST INSIGHTS
router.get("/", getInsights);

// GET SINGLE INSIGHT
router.get("/:slug", getInsightBySlug);
router.delete("/:id", deleteInsight);
module.exports = router;
