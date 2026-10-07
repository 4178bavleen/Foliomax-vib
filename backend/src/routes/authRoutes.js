const express = require("express");
const router = express.Router();

const {
  register,
  login,
  verifyEmail,
  resendVerification,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp
} = require("../controller/authController");   // <- fixed path

const { authMiddleware } = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  registerSchema,
  loginSchema,
  resetSchema,
  setNewPasswordSchema
} = require("../validations/auth.schema");

// PUBLIC ROUTES
router.post("/register", validate(registerSchema), register);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", validate(resetSchema), resendVerification);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/forgot-password", validate(resetSchema), forgotPassword);
router.post("/reset-password", validate(setNewPasswordSchema), resetPassword);

// PROTECTED
router.post("/logout", authMiddleware, logout);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;
