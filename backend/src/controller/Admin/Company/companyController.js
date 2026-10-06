// src/controller/Admin/Company/companyController.js
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();
const learnFeedCache = require("../../../lib/learnFeedCache");

// GET /api/companies?status=ACTIVE|PENDING|INACTIVE
exports.getCompanies = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status && ["ACTIVE", "PENDING", "INACTIVE"].includes(status)) {
      where.status = status;
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json(companies);
  } catch (err) {
    console.error("GET /api/companies error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/companies
exports.createCompany = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const trimmedName = name.trim();

    // Check existing by unique name
    const exists = await prisma.company.findUnique({
      where: { name: trimmedName },
    });

    if (exists) {
      return res.status(409).json({ message: "Company already exists" });
    }

    const company = await prisma.company.create({
      data: { name: trimmedName },
    });

    return res.status(201).json(company);
  } catch (err) {
    console.error("POST /api/companies error:", err);

    // Unique constraint safety net
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res.status(409).json({ message: "Company already exists" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/companies/:id
// body can contain { name?, status? }
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const payload = {};

    if (name && name.trim()) {
      payload.name = name.trim();
    }

    if (status) {
      if (!["ACTIVE", "PENDING", "INACTIVE"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      payload.status = status;
    }

    if (Object.keys(payload).length === 0) {
      return res
        .status(400)
        .json({ message: "Nothing to update (name or status required)" });
    }

    const updated = await prisma.company.update({
      where: { id: Number(id) },
      data: payload,
    });

    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/companies/:id error:", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return res
        .status(409)
        .json({ message: "Another company with this name already exists" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/companies/:id
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.company.delete({
      where: { id: Number(id) },
    });

    // Cascades to the company's quiz rows, which the learn feed groups by name.
    await learnFeedCache.invalidate();

    return res.json({ message: "Company deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/companies/:id error:", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/companies/:id/status
// body: { status: "ACTIVE" | "PENDING" | "INACTIVE" }
exports.updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "PENDING", "INACTIVE"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await prisma.company.update({
      where: { id: Number(id) },
      data: { status },
    });

    return res.json(updated);
  } catch (err) {
    console.error("PATCH /api/companies/:id/status error:", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return res.status(404).json({ message: "Company not found" });
    }

    return res.status(500).json({ message: "Server error" });
  }
};
