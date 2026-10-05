const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
} = require("../../../controller/Admin/Blog/blogCategoryController");

router.post("/create", createCategory);
router.get("/get", getCategories);

module.exports = router;
