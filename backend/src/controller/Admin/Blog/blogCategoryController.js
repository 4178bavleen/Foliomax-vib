const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * CREATE CATEGORY
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ success: false, message: "Name and slug required" });
    }

    const exists = await prisma.blogcategory.findUnique({ where: { slug } });
    if (exists) {
      return res.status(409).json({ success: false, message: "Category already exists" });
    }

    const category = await prisma.blogcategory.create({
      data: { name, slug },
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
};

/**
 * LIST CATEGORIES
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.blogcategory.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};
