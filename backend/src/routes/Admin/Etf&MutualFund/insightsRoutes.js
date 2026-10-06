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
const { authMiddleware, adminOnly } = require("../../../middlewares/authMiddleware");

// LIST INSIGHTS (public - consumed by /etf-mutual-insights and the learn feed)
router.get("/", getInsights);

// GET SINGLE INSIGHT (public)
router.get("/:slug", getInsightBySlug);

// CREATE INSIGHT (with image upload)
router.post(
  "/",
  authMiddleware,
  adminOnly,
  insightUpload.single("coverImage"),
  createInsight
);

router.delete("/:id", authMiddleware, adminOnly, deleteInsight);

module.exports = router;
