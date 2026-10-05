const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ========================= AUTH MIDDLEWARE =========================
exports.authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({ ok: false, error: "Authorization header missing" });
    }

    // ---------------- BOT SERVER ACCESS (optional) ----------------
    const botKey = process.env.BOT_API_KEY || process.env.SERVER_API_KEY;
    if (botKey && authorization === `Bearer ${botKey}`) {
      req.isBot = true;
      return next();
    }

    // ---------------- User authentication via JWT -----------------
    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ ok: false, error: "Token missing" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ ok: false, error: "Invalid or expired token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ ok: false, error: "User not found" });
    }

    // Attach decoded user to request
    req.user = user;
    next();

  } catch (err) {
    console.error("AuthMiddleware Error:", err);
    return res.status(500).json({ ok: false, error: "Auth middleware failed" });
  }
};


// ========================== ADMIN ACCESS ONLY ==========================
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ ok: false, error: "Admin access only" });
  }

  next();
};
