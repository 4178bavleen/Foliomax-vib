const express = require("express");
const router = express.Router();

const {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
} = require("../../../controller/Admin/Subscriptions/subscriptionController");

// 🔐 Add your admin auth middleware if exists

router.post("/create", createPlan);
router.get("/all", getPlans);
router.put("/update/:id", updatePlan);
router.delete("/delete/:id", deletePlan);

module.exports = router;