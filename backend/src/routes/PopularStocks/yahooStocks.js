const express = require("express");
const router = express.Router();
const { getNseTicker , getNifty50 } = require("../../controller/PopularStocks/yahooStocks");

// GET /api/popular-stock/yahoo-ticker
router.get("/yahoo-ticker", getNseTicker);
router.get("/nifty50", getNifty50);
module.exports = router;
