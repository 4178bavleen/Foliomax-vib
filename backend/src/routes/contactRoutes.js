// routes/contactRoutes.js
const express = require("express");
const router = express.Router();
const contactCtrl = require("../controller/contactController");
const fileCtrl = require("../controller/fileController");  // <-- ADD THIS
const { authMiddleware, adminOnly } = require("../middlewares/authMiddleware");

/**
 * PUBLIC ROUTE
 * Final path: POST /foliomax/api/contact
 */
router.post("/api/contact", contactCtrl.createContact);

/**
 * ADMIN ROUTES (Protected)
 * Final prefix: /foliomax/admin
 */
const adminRouter = express.Router();

// Auth → must have valid token or bot key
adminRouter.use(authMiddleware);

// Must be admin
adminRouter.use(adminOnly);

// CONTACT ROUTES
adminRouter.get("/contacts", contactCtrl.listContacts);
adminRouter.get("/contacts/export", contactCtrl.exportContactsCsv);
adminRouter.get("/contacts/:id", contactCtrl.getContact);
adminRouter.patch("/contacts/:id", contactCtrl.updateContact);
adminRouter.delete("/contacts/:id", contactCtrl.deleteContact);



adminRouter.get("/files/count", fileCtrl.getCount);   // <-- New endpoint added


// Mount at /admin
router.use("/admin", adminRouter);

module.exports = router;
