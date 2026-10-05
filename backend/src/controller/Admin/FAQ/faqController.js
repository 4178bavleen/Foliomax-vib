// src/controllers/admin/dashboard/settings/faqController.js
const asyncHandler = require('express-async-handler');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const createFaq = asyncHandler(async (req, res) => {
  const { question, answer = null, categoryId, isPublished = true, order = null, metadata = null } = req.body;

  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }
  if (!categoryId || Number.isNaN(Number(categoryId))) {
    return res.status(400).json({ error: 'Valid categoryId is required' });
  }

  // ensure category exists
  const category = await prisma.FaqCategory.findUnique({ where: { id: Number(categoryId) } });
  if (!category) return res.status(404).json({ error: 'Category not found' });

  const created = await prisma.Faq.create({
    data: {
      question: String(question).trim(),
      answer: answer ? String(answer).trim() : null,
      categoryId: Number(categoryId),
      isPublished: Boolean(isPublished),
      order: order !== null && order !== undefined ? Number(order) : null,
      metadata: metadata || null,
    },
  });

  return res.status(201).json({ data: created });
});

const getAllFaqsAdmin = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 1000);
  const offset = Number(req.query.offset) || 0;
  const search = req.query.search ? String(req.query.search).trim() : null;
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const isPublished = req.query.isPublished !== undefined ? (req.query.isPublished === 'true') : undefined;
  const sortBy = req.query.sortBy || 'order'; // default sort by `order`, fallback to createdAt if order is null
  const orderDir = (req.query.orderDir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

  const where = {};
  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
      { answer: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (typeof isPublished === 'boolean') where.isPublished = isPublished;

  // Build ordering
  const orderBy = [];
  if (sortBy === 'createdAt') {
    orderBy.push({ createdAt: orderDir });
  } else if (sortBy === 'order') {
    // put nulls last/first isn't controllable in Prisma before v4.12; we sort by order then createdAt
    orderBy.push({ order: orderDir });
    orderBy.push({ createdAt: 'desc' });
  } else {
    orderBy.push({ createdAt: orderDir });
  }

  const [data, total] = await Promise.all([
    prisma.Faq.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.Faq.count({ where }),
  ]);

  return res.status(200).json({
    data,
    meta: { total, limit, offset },
  });
});


const getFaqById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const faq = await prisma.Faq.findUnique({ where: { id }, include: { category: true } });
  if (!faq) return res.status(404).json({ error: 'FAQ not found' });
  return res.status(200).json({ data: faq });
});


const updateFaq = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const existing = await prisma.Faq.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'FAQ not found' });

  const { question, answer, categoryId, isPublished, order, metadata } = req.body;

  const updateData = {};
  if (question !== undefined) updateData.question = String(question).trim();
  if (answer !== undefined) updateData.answer = answer === null ? null : String(answer).trim();
  if (categoryId !== undefined) {
    const catIdNum = Number(categoryId);
    if (Number.isNaN(catIdNum)) return res.status(400).json({ error: 'Invalid categoryId' });
    const category = await prisma.FaqCategory.findUnique({ where: { id: catIdNum } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    updateData.categoryId = catIdNum;
  }
  if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);
  if (order !== undefined) updateData.order = order === null ? null : Number(order);
  if (metadata !== undefined) updateData.metadata = metadata;

  const updated = await prisma.Faq.update({ where: { id }, data: updateData });
  return res.status(200).json({ data: updated });
});


const deleteFaq = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const existing = await prisma.Faq.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'FAQ not found' });

  await prisma.Faq.delete({ where: { id } });
  return res.status(200).json({ data: { id }, message: 'FAQ deleted' });
});



const getPublicFaqs = asyncHandler(async (req, res) => {
  const search = req.query.search ? String(req.query.search).trim() : null;
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

 
  if (search) {
    const faqs = await prisma.Faq.findMany({
      where: {
        isPublished: true,
        OR: [
          { question: { contains: search, mode: 'insensitive' } },
          { answer: { contains: search, mode: 'insensitive' } },
        ],
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [
        // keep category order first (if category has `order`), else createdAt desc
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 1000, // safety cap for search results
    });

    // group by category
    const grouped = {};
    let totalFaqs = 0;
    faqs.forEach((f) => {
      const cat = f.category || { id: null, name: 'Uncategorized', description: null };
      const catId = cat.id || 'uncat';
      if (!grouped[catId]) {
        grouped[catId] = {
          id: cat.id,
          name: cat.name,
          description: cat.description || null,
          faqs: [],
        };
      }
      grouped[catId].faqs.push({
        id: f.id,
        question: f.question,
        answer: f.answer,
        order: f.order,
        metadata: f.metadata,
        createdAt: f.createdAt,
      });
      totalFaqs++;
    });

    const data = Object.values(grouped);

    return res.status(200).json({
      data,
      meta: {
        totalCategories: data.length,
        totalFaqs,
      },
    });
  }

  // No search: get categories and include their published faqs (supports categoryId filter).
  // We'll only return categories that have at least one published FAQ.
  const categoryWhere = {};
  if (categoryId) categoryWhere.id = categoryId;

  // fetch categories with their published faqs
  const categories = await prisma.FaqCategory.findMany({
    where: categoryWhere,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: {
      faqs: {
        where: { isPublished: true },
        orderBy: [
          { order: 'asc' },      // faq order if provided
          { createdAt: 'desc' }, // fallback
        ],
        skip: offset,
        take: limit,
        select: {
          id: true,
          question: true,
          answer: true,
          order: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  });

  // filter out categories with no faqs (so frontend only receives categories that contain content)
  const filtered = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description || null,
      faqs: c.faqs,
    }))
    .filter((c) => Array.isArray(c.faqs) && c.faqs.length > 0);

  // compute totals
  const totalCategories = filtered.length;
  const totalFaqs = filtered.reduce((acc, c) => acc + c.faqs.length, 0);

  return res.status(200).json({
    data: filtered,
    meta: { totalCategories, totalFaqs, limit, offset },
  });
});



module.exports = {
  createFaq,
  getPublicFaqs,
  getAllFaqsAdmin,
  getFaqById,
  updateFaq,
  deleteFaq,
};
