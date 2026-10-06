const express = require("express");
const router = express.Router();

const upload = require("../../../middlewares/blogUpload");
const {
  createBlog,
  getBlogs,
  deleteBlog,
  updateBlog,
} = require("../../../controller/Admin/Blog/blogController");
const { authMiddleware, adminOnly } = require("../../../middlewares/authMiddleware");

// CREATE BLOG
router.post(
  "/create",
  authMiddleware,
  adminOnly,
  upload.single("image"),
  createBlog
);

// GET BLOGS (public - consumed by /blogs and the learn feed)
router.get("/get", getBlogs);

// DELETE BLOG
router.delete("/delete/:id", authMiddleware, adminOnly, deleteBlog);

router.put(
  "/update/:id",
  authMiddleware,
  adminOnly,
  upload.single("image"),
  updateBlog
);

module.exports = router;
