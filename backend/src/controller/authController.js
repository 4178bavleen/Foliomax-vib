const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../email/emailSender');   

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';
// Strip trailing slashes so links never contain "//" (React Router won't match those)
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/+$/, "");

// -------------------- Helper Functions --------------------
const validatePasswordStrength = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);

const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "24h" });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "7d" });

// =========================================================
// REGISTER
// =========================================================

exports.register = async (req, res) => {
  try {
    let { email, password, name, phone } = req.body;

    // ===============================
    // Basic Input Validation
    // ===============================

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email and Password are required"
      });
    }

    email = email.trim().toLowerCase();
    password = password.trim();
    name = name ? name.trim() : null;
    phone = phone ? phone.trim() : null;

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid email format"
      });
    }

    // Password strength validation
    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        ok: false,
        error:
          "Password must contain uppercase, lowercase, number, symbol and be minimum 8 characters"
      });
    }

    // ===============================
    // Check Existing Email
    // ===============================

    const exists = await prisma.user.findUnique({
      where: { email }
    });

    if (exists) {
      return res.status(409).json({
        ok: false,
        error: "Email already registered"
      });
    }

    // ===============================
    // Hash Password
    // ===============================

    const passwordHash = await bcrypt.hash(password, 12); // stronger salt rounds

    // ===============================
    // Generate Verification Token
    // ===============================

    const token = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // ===============================
    //  Create User
    // ===============================

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        verificationToken: token,
        verificationExpiry
      }
    });

    // ===============================
    //  Verification Link
    // ===============================

    const verifyLink =`${CLIENT_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // ===============================
    // Send Email (Non-blocking)
    // ===============================

    sendEmail(
      email,
      "Verify your email - Foliomax",
      "verifyEmail.html",
      {
        name: name || "",
        verifyLink,
        dashboardLink: `${CLIENT_URL}/customer`,
        privacyLink: `${CLIENT_URL}/privacy-policy`,
        unsubscribeLink: `${CLIENT_URL}/unsubscribe`,
        year: new Date().getFullYear().toString()
      }
    ).catch((err) => {
      console.error("Email sending failed:", err.message);
    });

    // ===============================
    // Success Response
    // ===============================

    return res.status(201).json({
      ok: true,
      message: "Registered successfully. Please verify your email."
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    // Prisma unique constraint fallback
    if (err.code === "P2002") {
      return res.status(409).json({
        ok: false,
        error: "Email already exists"
      });
    }

    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  }
};

// =========================================================
// VERIFY EMAIL
// =========================================================
exports.verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) return res.status(400).json({ error: "Missing token/email" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(400).json({ error: "Invalid link" });
    if (user.emailVerified) return res.json({ ok: true, message: "Email already verified" });
    if (user.verificationToken !== token) return res.status(400).json({ error: "Invalid token" });
    if (user.verificationExpiry < new Date()) return res.status(400).json({ error: "Verification expired" });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationExpiry: null }
    });

    // Send welcome email after successful verification
    sendEmail(
      user.email,
      "Welcome to Foliomax 🎉",
      "welcome.html",
      {
        name: user.name || "",
        dashboardLink: `${CLIENT_URL}/customer`,          // change if your dashboard route is different
        unsubscribeLink: `${CLIENT_URL}/unsubscribe`,     // can be placeholder for now
        privacyLink: `${CLIENT_URL}/privacy-policy`
      }
    ).catch(err => {
      console.error("WELCOME EMAIL ERROR:", err);
      // don't fail the response just because email failed
    });

    return res.json({ ok: true, message: "Email verified successfully" });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


// =========================================================
// RESEND VERIFICATION EMAIL
// =========================================================
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Always respond ok for unknown emails (to avoid user enumeration)
    const genericMessage =
      "If an account with that email exists and is not verified, a verification link has been sent.";

    if (!user) {
      return res.json({ ok: true, message: genericMessage });
    }

    if (user.emailVerified) {
      return res.json({
        ok: true,
        alreadyVerified: true,
        message: "This email is already verified. Please sign in."
      });
    }

    // Fresh token so the new link always works (old links are invalidated)
    const token = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token, verificationExpiry }
    });

    const verifyLink = `${CLIENT_URL}/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    const result = await sendEmail(
      normalizedEmail,
      "Verify your email - Foliomax",
      "verifyEmail.html",
      {
        name: user.name || "",
        verifyLink,
        dashboardLink: `${CLIENT_URL}/customer`,
        privacyLink: `${CLIENT_URL}/privacy-policy`,
        unsubscribeLink: `${CLIENT_URL}/unsubscribe`,
        year: new Date().getFullYear().toString()
      }
    );

    // sendEmail never throws — check its result so SMTP failures surface to the user
    if (!result.success) {
      console.error("RESEND VERIFICATION EMAIL FAILED:", result.error);
      return res.status(502).json({
        ok: false,
        error: "Could not send the verification email. Please try again later."
      });
    }

    return res.json({
      ok: true,
      message: "Verification email sent. Please check your inbox."
    });
  } catch (err) {
    console.error("RESEND VERIFICATION ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};


// =========================================================
// LOGIN
// =========================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.emailVerified) return res.status(403).json({ error: "Verify email first" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await bcrypt.hash(refreshToken, 10) }
    });

    return res.json({ ok: true, accessToken, refreshToken });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =========================================================
// REFRESH ACCESS TOKEN
// =========================================================
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.refreshToken) return res.status(403).json({ error: "Invalid token" });

    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) return res.status(403).json({ error: "Invalid token" });

    return res.json({ ok: true, accessToken: generateAccessToken(user) });

  } catch (err) {
    return res.status(403).json({ error: "Expired or invalid refresh token" });
  }
};

// =========================================================
// LOGOUT
// =========================================================
exports.logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null }
    });

    return res.json({ ok: true, message: "Logged out successfully" });

  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// =========================================================
// FORGOT PASSWORD
// =========================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ ok: false, error: "Email is required" });
    }

    const normalizedEmail = String(email).toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always respond ok (to avoid user enumeration)
    if (!user) {
      return res.json({
        ok: true,
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hash,
        passwordResetExpiry: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // 👉 Frontend reset page URL
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}&email=${encodeURIComponent(
      normalizedEmail
    )}`;

    // Use resetPassword.html template (matches placeholders in your HTML)
    sendEmail(
      normalizedEmail,
      "Reset your password - Foliomax",
      "resetPassword.html",
      {
        name: user.name || "",
        email: normalizedEmail,
        resetLink, // {{resetLink}}
        // supportEmail: SUPPORT_EMAIL, // {{supportEmail}}
        privacyLink: `${CLIENT_URL}/privacy-policy`, // {{privacyLink}}
        securityLink: `${CLIENT_URL}/security`, // or FAQ / same page // {{securityLink}}
        year: new Date().getFullYear().toString(), // {{year}}
      }
    ).catch((err) => console.error("FORGOT PASSWORD EMAIL ERROR:", err));

    return res.json({
      ok: true,
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};

// =========================================================
// RESET PASSWORD
// =========================================================
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({ ok: false, error: "token, email and newPassword are required" });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        ok: false,
        error: "Password must be minimum 8 characters and include uppercase, lowercase, number and symbol",
      });
    }

    const normalizedEmail = String(email).toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordResetToken || !user.passwordResetExpiry) {
      return res.status(400).json({ ok: false, error: "Invalid or expired reset token" });
    }

    const hash = crypto.createHash("sha256").update(token).digest("hex");

    if (hash !== user.passwordResetToken) {
      return res.status(400).json({ ok: false, error: "Invalid or expired reset token" });
    }

    if (user.passwordResetExpiry < new Date()) {
      return res.status(400).json({ ok: false, error: "Reset token expired" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        refreshToken: null, // force re-login on all devices
      },
    });

    return res.json({
      ok: true,
      message: "Password has been reset. Please login with your new password.",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};


// =========================================================
// SEND OTP LOGIN
// =========================================================
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, error: "Email required" });
    }

    const normalizedEmail = email.toLowerCase();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ ok: false, error: "Verify email first" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: hashedOtp,
        otpExpiry: expiry,
        otpAttempts: 0,
      },
    });

    // Send OTP email
    sendEmail(
  email,
  "Your Login OTP - Foliomax",
  "otpTemplate.html",
  {
    name: user.name || "",
    otp,
    logoUrl: `${process.env.API_URL}/public/logo/updated-logo.png`,
    year: new Date().getFullYear(),
    privacyLink: `${CLIENT_URL}/privacy-policy`,
    securityLink: `${CLIENT_URL}/security`,
  }
);

    return res.json({
      ok: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};

// =========================================================
// VERIFY OTP LOGIN
// =========================================================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ ok: false, error: "Email and OTP required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.otp) {
      return res.status(400).json({ ok: false, error: "Invalid request" });
    }

    // 🚫 Too many attempts
    if (user.otpAttempts >= 5) {
      return res.status(429).json({ ok: false, error: "Too many attempts. Try later." });
    }

    const cleanOtp = otp.toString().trim();

    const hashedOtp = crypto
      .createHash("sha256")
      .update(cleanOtp)
      .digest("hex");

    if (user.otp !== hashedOtp) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpAttempts: user.otpAttempts + 1,
        },
      });

      return res.status(400).json({ ok: false, error: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ ok: false, error: "OTP expired" });
    }

    // ✅ Clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiry: null,
        otpAttempts: 0,
      },
    });

    // 🔑 Generate tokens (same as your login)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(refreshToken, 10),
      },
    });

    return res.json({
      ok: true,
      accessToken,
      refreshToken,
      user,
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};