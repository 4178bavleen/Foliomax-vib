const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");
const { authMiddleware } = require("../middlewares/authMiddleware");

/* =========================================
   1️⃣ Create Order (Protected)
========================================= */
router.post(
  "/create-order",
  authMiddleware,
  paymentController.createOrder
);

/* =========================================
   2️⃣ Verify Payment (Protected)
========================================= */
router.post(
  "/verify",
  authMiddleware,
  paymentController.verifyPayment
);


/* =========================================
   NEW: SUBSCRIPTION STATUS
========================================= */
router.get(
  "/subscription-status",
  authMiddleware,
  paymentController.getSubscriptionStatus
);

/* =========================================
   3️⃣ Razorpay Webhook (NO AUTH)
========================================= */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.razorpayWebhook
);

module.exports = router;