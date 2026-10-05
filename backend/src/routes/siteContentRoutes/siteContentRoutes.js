// routes/siteContentRoutes.js
const express = require("express");
const router = express.Router();

const siteContentCtrl = require("../../controller/SiteContent/siteContentController");
const { authMiddleware, adminOnly } = require("../../middlewares/authMiddleware");

/**
 * ===============================
 * PUBLIC ROUTE
 * ===============================
 * Final path: GET /foliomax/api/content/:page
 */
router.get("/api/content/:page", siteContentCtrl.getContentByPage);

/**
 * ===============================
 * ADMIN ROUTES (Protected)
 * ===============================
 * Final prefix: /foliomax/admin
 */
const adminRouter = express.Router();

// Auth → must have valid token
adminRouter.use(authMiddleware);

// Must be admin
adminRouter.use(adminOnly);

// CONTENT ROUTES
adminRouter.get("/content", siteContentCtrl.getAllContent);
adminRouter.put("/content", siteContentCtrl.upsertContent);

// Mount at /admin
router.use("/admin", adminRouter);

module.exports = router;
