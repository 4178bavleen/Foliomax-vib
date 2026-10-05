// controllers/contactController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("express-async-handler");
const { z } = require("zod");
const { stringify } = require("csv-stringify/sync");

// --------------------
// Helper: convert BigInt -> string (recursive)
// --------------------
function convertBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (obj instanceof Date) return obj; // keep Date objects (they'll be stringified by JSON)
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = convertBigInt(v);
    }
    return out;
  }
  return obj;
}

// --------------------
// Validation schema using zod
// --------------------
const createSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  topic: z.string().min(1),
  message: z.string().min(1, "Message required"),
});

// POST /api/contact - public
const createContact = asyncHandler(async (req, res) => {
  const payload = req.body; // if using form-data use multer or parse FormData on client
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, errors: parsed.error.flatten() });
  }

  const { name, email, phone, city, topic, message } = parsed.data;

  const record = await prisma.contactmessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      city: city || null,
      topic,
      message,
      ipAddress: req.ip || null,
      userAgent: req.get("User-Agent") || null,
    },
  });

  // convert BigInt -> string and return
  res.status(201).json({ ok: true, data: convertBigInt(record) });
});

// GET /admin/contacts - list with pagination, filters, search
// Query params: page, limit, status, q (search by name/email/topic/message)
const listContacts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 200);
  const skip = (page - 1) * limit;

  const where = {};
  if (req.query.status) {
    where.status = req.query.status; // should match enum
  }
  if (req.query.q) {
    where.OR = [
      { name: { contains: req.query.q, mode: "insensitive" } },
      { email: { contains: req.query.q, mode: "insensitive" } },
      { topic: { contains: req.query.q, mode: "insensitive" } },
      { message: { contains: req.query.q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.contactmessage.count({ where }),
    prisma.contactmessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  res.json({
    ok: true,
    meta: { page, limit, total, pages: Math.ceil(total / limit || 1) },
    data: convertBigInt(items),
  });
});

// GET /admin/contacts/:id
const getContact = asyncHandler(async (req, res) => {
  let idParam = req.params.id;
  if (!idParam) return res.status(400).json({ ok: false, error: "Missing id" });

  let id;
  try {
    id = BigInt(idParam);
  } catch (err) {
    return res.status(400).json({ ok: false, error: "Invalid id" });
  }

  const item = await prisma.contactmessage.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, data: convertBigInt(item) });
});

// PATCH /admin/contacts/:id - update status / response / mark read
// Allowed body: { status, isRead, response, respondedBy }
const updateContact = asyncHandler(async (req, res) => {
  let idParam = req.params.id;
  if (!idParam) return res.status(400).json({ ok: false, error: "Missing id" });

  let id;
  try {
    id = BigInt(idParam);
  } catch (err) {
    return res.status(400).json({ ok: false, error: "Invalid id" });
  }

  const allowed = {};
  if (req.body.status) allowed.status = req.body.status;
  if (typeof req.body.isRead !== "undefined") allowed.isRead = Boolean(req.body.isRead);
  if (req.body.response) {
    allowed.response = req.body.response;
    allowed.respondedBy = req.body.respondedBy || req.admin?.id || null;
    allowed.respondedAt = new Date();
  }

  const item = await prisma.contactmessage.update({
    where: { id },
    data: allowed,
  });

  res.json({ ok: true, data: convertBigInt(item) });
});

// DELETE /admin/contacts/:id
const deleteContact = asyncHandler(async (req, res) => {
  let idParam = req.params.id;
  if (!idParam) return res.status(400).json({ ok: false, error: "Missing id" });

  let id;
  try {
    id = BigInt(idParam);
  } catch (err) {
    return res.status(400).json({ ok: false, error: "Invalid id" });
  }

  await prisma.contactmessage.delete({ where: { id } });
  res.json({ ok: true });
});

// GET /admin/contacts/export?status=OPEN&page=1&limit=100
// returns CSV
const exportContactsCsv = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;

  const items = await prisma.contactmessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: parseInt(req.query.limit || "1000", 10),
  });

  // ensure ids are strings and dates are ISO strings
  const rows = items.map((it) => ({
    id: typeof it.id === "bigint" ? it.id.toString() : it.id,
    name: it.name,
    email: it.email,
    phone: it.phone,
    city: it.city,
    topic: it.topic,
    message: it.message,
    status: it.status,
    isRead: it.isRead,
    respondedBy: it.respondedBy,
    respondedAt: it.respondedAt ? new Date(it.respondedAt).toISOString() : "",
    createdAt: it.createdAt ? new Date(it.createdAt).toISOString() : "",
  }));

  const csv = stringify(rows, { header: true });
  res.header("Content-Type", "text/csv");
  res.attachment(`contacts-${Date.now()}.csv`);
  res.send(csv);
});

module.exports = {
  createContact,
  listContacts,
  getContact,
  updateContact,
  deleteContact,
  exportContactsCsv,
};
