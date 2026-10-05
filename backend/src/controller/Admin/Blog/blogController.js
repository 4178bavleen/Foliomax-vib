const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * CREATE BLOG
 */
exports.createBlog = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      content,
      authorName,
      categoryId,
      isPublished,
    } = req.body;

    if (!title || !content || !authorName || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ FIX: convert string → boolean
    const publishStatus =
      isPublished === "true" || isPublished === true;

    const imagePath = req.file
      ? `/uploads/blogs/${req.file.filename}`
      : null;

    const blog = await prisma.blog.create({
      data: {
        title,
        subtitle,
        content,
        authorName,
        image: imagePath,
        categoryId: Number(categoryId),
        isPublished: publishStatus, // ✅ boolean
      },
    });

    res.status(201).json({ success: true, data: blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Blog creation failed",
    });
  }
};


/**
 * LIST BLOGS (PUBLIC)
 */
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      include: { category: true },
      orderBy: { uploadedAt: "desc" },
    });

    res.json({ success: true, data: blogs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
};


const fs = require("fs");
const path = require("path");

/**
 * DELETE BLOG (WITH IMAGE CLEANUP)
 */
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required",
      });
    }

    const blog = await prisma.blog.findUnique({
      where: { id: Number(id) },
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // 🗑 Delete image file if exists
    if (blog.image) {
      const imagePath = path.join(
        __dirname,
        "..",
        "..",
        blog.image
      );

      fs.unlink(imagePath, (err) => {
        if (err) console.warn("Image delete failed:", err.message);
      });
    }

    await prisma.blog.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
    });
  }
};


/**
 * UPDATE BLOG
 * PUT /foliomax/blogs/update/:id
 */
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      subtitle,
      content,
      authorName,
      categoryId,
      isPublished,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required",
      });
    }

    // Check existing blog
    const existingBlog = await prisma.blog.findUnique({
      where: { id: Number(id) },
    });

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Convert publish flag safely
    const publishStatus =
      isPublished === "true" || isPublished === true;

    let imagePath = existingBlog.image;

    // 🖼 If new image uploaded → delete old one
    if (req.file) {
      if (existingBlog.image) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "..",
          existingBlog.image
        );

        fs.unlink(oldImagePath, (err) => {
          if (err)
            console.warn("Old image delete failed:", err.message);
        });
      }

      imagePath = `/uploads/blogs/${req.file.filename}`;
    }

    const updatedBlog = await prisma.blog.update({
      where: { id: Number(id) },
      data: {
        title: title ?? existingBlog.title,
        subtitle: subtitle ?? existingBlog.subtitle,
        content: content ?? existingBlog.content,
        authorName: authorName ?? existingBlog.authorName,
        categoryId: categoryId
          ? Number(categoryId)
          : existingBlog.categoryId,
        isPublished:
          isPublished !== undefined
            ? publishStatus
            : existingBlog.isPublished,
        image: imagePath,
      },
    });

    res.json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to update blog",
    });
  }
};
