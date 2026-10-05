const express = require("express");
const router = express.Router();

const companyController = require("../../../controller/Admin/Company/companyController");

// Company CRUD
router.get("/all-companies", companyController.getCompanies);
router.post("/add", companyController.createCompany);
router.patch("/update/:id", companyController.updateCompany);
router.patch("/status/:id", companyController.updateCompanyStatus);
router.delete("/delete/:id", companyController.deleteCompany);

module.exports = router;
