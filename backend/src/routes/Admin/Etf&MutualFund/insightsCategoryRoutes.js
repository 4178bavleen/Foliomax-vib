const express = require("express");
const router = express.Router();
const {
  createInsightCategory,
  getInsightCategories,
} = require("../../../controller/Admin/Etf&MutualFund/insightCategoryController");

router.post("/", createInsightCategory);
router.get("/", getInsightCategories);

module.exports = router;
