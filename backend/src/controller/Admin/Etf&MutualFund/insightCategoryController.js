const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * CREATE INSIGHT CATEGORY
 */
exports.createInsightCategory = async (req, res) => {
  try {
    const { name, slug, description, type, order } = req.body;

    if (!name || !slug || !type) {
      return res.status(400).json({
        success: false,
        message: "Name, slug and type are required",
      });
    }

    const exists = await prisma.insightcategory.findUnique({
      where: { slug },
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Insight category already exists",
      });
    }

    const category = await prisma.insightcategory.create({
      data: {
        name,
        slug,
        description,
        type,
        order: order || 0,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to create insight category",
    });
  }
};

/**
 * LIST INSIGHT CATEGORIES (PUBLIC)
 */
exports.getInsightCategories = async (req, res) => {
  try {
    const categories = await prisma.insightcategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    res.json({ success: true, data: categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch insight categories",
    });
  }
};
