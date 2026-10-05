const express = require("express");
const router = express.Router();

const upload = require("../../../middlewares/blogUpload");
const {
  createBlog,
  getBlogs,
  deleteBlog,
  updateBlog,
} = require("../../../controller/Admin/Blog/blogController");

// CREATE BLOG
router.post("/create", upload.single("image"), createBlog);

// GET BLOGS
router.get("/get", getBlogs);

// DELETE BLOG
router.delete("/delete/:id", deleteBlog);

router.put(
  "/update/:id",
  upload.single("image"),
  updateBlog
);

module.exports = router;
