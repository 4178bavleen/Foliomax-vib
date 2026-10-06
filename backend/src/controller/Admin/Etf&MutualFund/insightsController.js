const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();
const learnFeedCache = require("../../../lib/learnFeedCache");

/**
 * CREATE INSIGHT
 */
exports.createInsight = async (req, res) => {
  try {
    const {
      title,
      slug,
      categoryId,
      shortDescription,
      content,
      authorName,
      readingTime,
      type,
      tags,
      isFeatured,
    } = req.body;

    const coverImage = req.file
      ? `/uploads/insights/${req.file.filename}`
      : null;

    if (!title || !slug || !categoryId || !content || !type) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const exists = await prisma.insight.findUnique({
      where: { slug },
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Insight already exists",
      });
    }

    const category = await prisma.insightcategory.findUnique({
      where: { id: Number(categoryId) },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Insight category not found",
      });
    }

    const insight = await prisma.insight.create({
      data: {
        title,
        slug: slug.toLowerCase().trim(),
        categoryId: Number(categoryId),
        shortDescription,
        content,
        coverImage,
        authorName: authorName || "Investment Research Team",
        readingTime,
        type,
        tags: tags ? JSON.parse(tags) : [],
        isFeatured: Boolean(isFeatured),
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    await learnFeedCache.invalidate();

    res.status(201).json({
      success: true,
      data: insight,
    });
  } catch (err) {
    console.error("CREATE INSIGHT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create insight",
    });
  }
};

/**
 * Relation field on `insight` is `insightcategory`. Every public endpoint
 * re-exposes it as `category` so the API contract stays stable.
 */
function withCategory(insight) {
  if (!insight) return insight;
  const { insightcategory, ...rest } = insight;
  return { ...rest, category: insightcategory || null };
}

/**
 * LIST INSIGHTS
 */
exports.getInsights = async (req, res) => {
  try {
    const { category, type, limit } = req.query;

    const insights = await prisma.insight.findMany({
      where: {
        isPublished: true,
        ...(type && { type }),
        ...(category && {
          category: { slug: category },
        }),
      },
      include: {
        insightcategory: true,
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      ...(Number(limit) > 0 ? { take: Math.min(Number(limit), 100) } : {}),
    });

    res.json({ success: true, data: insights.map(withCategory) });
  } catch (err) {
    console.error("GET INSIGHTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch insights",
    });
  }
};

/**
 * GET SINGLE INSIGHT
 */
exports.getInsightBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const insight = await prisma.insight.findUnique({
      where: { slug },
      include: { insightcategory: true },
    });

    if (!insight || !insight.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Insight not found",
      });
    }

    res.json({ success: true, data: withCategory(insight) });
  } catch (err) {
    console.error("GET INSIGHT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch insight",
    });
  }
};


exports.deleteInsight = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Insight ID is required",
      });
    }

    // find insight
    const insight = await prisma.insight.findUnique({
      where: { id: Number(id) },
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        message: "Insight not found",
      });
    }

    // delete image from disk (if exists)
    if (insight.coverImage) {
      const imagePath = path.join(
        __dirname,
        "../../../..", // adjust if needed
        insight.coverImage
      );

      fs.unlink(imagePath, (err) => {
        if (err) {
          console.warn("Could not delete insight image:", err.message);
        }
      });
    }

    // delete record
    await prisma.insight.delete({
      where: { id: Number(id) },
    });

    await learnFeedCache.invalidate();

    res.json({
      success: true,
      message: "Insight deleted successfully",
    });
  } catch (err) {
    console.error("DELETE INSIGHT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete insight",
    });
  }
};