const express = require("express");
const router = express.Router();

const transactionController = require("../../controller/User/transactionController");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// GET /api/user/transactions
router.get(
  "/transactions",
  authMiddleware,
  transactionController.getMyTransactions
);

module.exports = router;