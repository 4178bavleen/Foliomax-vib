// src/controllers/profileController.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

// ================== GET PROFILE ==================
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profileImage: true,
      }
    });

    return res.json({ ok: true, user });

  } catch (err) {
    console.error("GET PROFILE:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};

// ================== UPDATE PROFILE ==================
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    const data = { name, phone };

    if (password && password.trim() !== "") {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password))
        return res.status(400).json({ ok: false, error: "Weak password format" });

      data.passwordHash = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    return res.json({ ok: true, message: "Profile updated" });

  } catch (err) {
    console.error("UPDATE PROFILE:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};

// ================== UPLOAD PROFILE IMAGE ==================
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "No image uploaded" });

    // Local storage path
    const imgPath = `/uploads/profile/${req.file.filename}`;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImage: imgPath },
    });

    return res.json({ ok: true, message: "Profile image updated", url: imgPath });

  } catch (err) {
    console.error("UPLOAD IMAGE:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};
