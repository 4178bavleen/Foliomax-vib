// src/controller/siteContentController.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * ===============================
 * PUBLIC: Get content by page
 * ===============================
 * GET /api/content/:page
 */
const getContentByPage = async (req, res) => {
  try {
    const { page } = req.params;

    const rows = await prisma.sitecontent.findMany({
      where: { pageName: page },
      select: { key: true, value: true }
    });

    // convert key-value rows into object
    const result = {};
    rows.forEach(row => {
      const shortKey = row.key.replace(`${page}.`, "");
      result[shortKey] = row.value;
    });

    res.json({ ok: true, data: result });
  } catch (err) {
    console.error("getContentByPage error:", err);
    res.status(500).json({ ok: false, message: "Failed to fetch content" });
  }
};

/**
 * ===============================
 * ADMIN: Create or Update content
 * ===============================
 * PUT /api/admin/content
 */
const upsertContent = async (req, res) => {
  try {
    const { key, value, pageName } = req.body;
    const adminId = req.user.id; // from auth middleware

    if (!key || !value) {
      return res
        .status(400)
        .json({ ok: false, message: "key and value are required" });
    }

    await prisma.sitecontent.upsert({
      where: { key },
      update: {
        value,
        pageName,
        updatedBy: adminId
      },
      create: {
        key,
        value,
        pageName,
        updatedBy: adminId
      }
    });

    res.json({ ok: true, message: "Content saved successfully" });
  } catch (err) {
    console.error("upsertContent error:", err);
    res.status(500).json({ ok: false, message: "Failed to save content" });
  }
};

/**
 * ===============================
 * ADMIN: Get all content (dashboard)
 * ===============================
 * GET /api/admin/content?page=about
 */
const getAllContent = async (req, res) => {
  try {
    const { page } = req.query;

    const data = await prisma.sitecontent.findMany({
      where: page ? { pageName: page } : {},
      orderBy: { updatedAt: "desc" }
    });

    res.json({ ok: true, data });
  } catch (err) {
    console.error("getAllContent error:", err);
    res.status(500).json({ ok: false, message: "Failed to load content" });
  }
};

module.exports = {
  getContentByPage,
  upsertContent,
  getAllContent
};
