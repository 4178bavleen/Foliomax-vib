// src/routes/profileRoutes.js
const express = require("express");
const router = express.Router();

const { getProfile, updateProfile, uploadProfileImage } = require("../../controller/User/profileController");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const upload = require("../../config/multer"); // <— using your simple multer.js

// ================= ROUTES ================= //
router.get("/me", authMiddleware, getProfile);
router.put("/update-profile", authMiddleware, updateProfile);
router.post("/upload-profile", authMiddleware, upload.single("image"), uploadProfileImage);

module.exports = router;
