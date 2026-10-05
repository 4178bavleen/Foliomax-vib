// src/controllers/admin/dashboard/settings/faqCategoryController.js
const asyncHandler = require("express-async-handler");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


function slugify(str = "") {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_-]/g, "");
}


const createFaqCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }

  const trimmed = String(name).trim();
  const code = slugify(trimmed);

  // Prevent duplicates by name or code
  const existing = await prisma.FaqCategory.findFirst({
    where: {
      OR: [{ name: trimmed }, { code }],
    },
  });

  if (existing) {
    return res.status(409).json({ error: "Category with same name already exists" });
  }

  const created = await prisma.FaqCategory.create({
    data: {
      name: trimmed,
      code,
      isActive: true,
    },
  });

  return res.status(201).json({ data: created });
});


const getAllFaqCategoriesAdmin = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  const offset = parseInt(req.query.offset, 10) || 0;
  const search = req.query.search ? String(req.query.search).trim() : null;
  const includeInactive = req.query.includeInactive === "true";

  const where = {};
  if (!includeInactive) where.isActive = true;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.FaqCategory.findMany({
      where,
      orderBy: { id: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.FaqCategory.count({ where }),
  ]);

  return res.status(200).json({
    data,
    meta: {
      total,
      limit,
      offset,
    },
  });
});


const deleteFaqCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id || req.body.id);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid category id" });
  }

  const existing = await prisma.FaqCategory.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Category not found" });
  }

  await prisma.FaqCategory.delete({ where: { id } });

  return res.status(200).json({ data: { id }, message: "Category deleted" });
});

const getPublicFaqCategories = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const search = req.query.search ? String(req.query.search).trim() : null;
  const includeEmpty = String(req.query.includeEmpty || "false").toLowerCase() === "true";

  const where = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  // Note: use fields that exist in your schema (id, createdAt). Avoid 'order' if it doesn't exist.
  const categories = await prisma.FaqCategory.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      faqs: {
        where: { isPublished: true },
        // order faqs by createdAt (or id). Do not use 'order' unless you added it to schema.
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          question: true,
          answer: true,
          // include metadata only if it exists on your Faq model
          metadata: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  const filtered = includeEmpty ? categories : categories.filter(c => Array.isArray(c.faqs) && c.faqs.length > 0);

  const totalCategories = filtered.length;
  const totalFaqs = filtered.reduce((acc, c) => acc + (Array.isArray(c.faqs) ? c.faqs.length : 0), 0);

  return res.status(200).json({
    data: filtered.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description || null,
      faqs: c.faqs,
    })),
    meta: { totalCategories, totalFaqs, limit, offset },
  });
});


const getPublicFaqCategoryBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || "").trim();
  if (!slug) return res.status(400).json({ error: "Invalid category slug" });

  const limit = Math.min(Number(req.query.limit) || 100, 1000);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const category = await prisma.FaqCategory.findFirst({
    where: { code: slug, isActive: true },
    include: {
      faqs: {
        where: { isPublished: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          question: true,
          answer: true,
          metadata: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!category) return res.status(404).json({ error: "Category not found" });

  return res.status(200).json({
    data: {
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description || null,
      faqs: category.faqs,
    },
    meta: { totalFaqs: category.faqs.length, limit, offset },
  });
});

module.exports = {
  createFaqCategory,
  getAllFaqCategoriesAdmin,
  deleteFaqCategory,
  getPublicFaqCategories,
  getPublicFaqCategoryBySlug,
};
