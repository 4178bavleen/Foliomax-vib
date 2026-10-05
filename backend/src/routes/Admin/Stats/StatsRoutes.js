const express = require("express");
const router = express.Router();

const {
  getAdminStats,
} = require("../../../controller/Admin/Stats/StatsController");

// You can add admin middleware here
// const { isAdmin } = require("../../middlewares/auth");

router.get("/stats", getAdminStats);

module.exports = router;