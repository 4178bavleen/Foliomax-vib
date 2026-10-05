const express = require("express");
const router = express.Router();
const { getNsePrices } = require("../controller/marketController");

router.get("/nse-ticker", getNsePrices);

module.exports = router;
