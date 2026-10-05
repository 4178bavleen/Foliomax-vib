const express = require("express");
const router = express.Router();
const { getIndices } = require("../controller/IndicesController");

router.get("/indices", getIndices);

module.exports = router;
