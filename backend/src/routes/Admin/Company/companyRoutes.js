const express = require("express");
const router = express.Router();

const companyController = require("../../../controller/Admin/Company/companyController");
const { authMiddleware, adminOnly } = require("../../../middlewares/authMiddleware");

// Company CRUD
// GET /all-companies is public (company picker on the site)
router.get("/all-companies", companyController.getCompanies);

router.post("/add", authMiddleware, adminOnly, companyController.createCompany);
router.patch(
  "/update/:id",
  authMiddleware,
  adminOnly,
  companyController.updateCompany
);
router.patch(
  "/status/:id",
  authMiddleware,
  adminOnly,
  companyController.updateCompanyStatus
);
router.delete(
  "/delete/:id",
  authMiddleware,
  adminOnly,
  companyController.deleteCompany
);

module.exports = router;
