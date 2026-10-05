const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ===============================
   CREATE PLAN (ADMIN)
=============================== */
exports.createPlan = async (req, res) => {
  try {
    const { name, duration, price } = req.body;

    if (!name || !duration || !price) {
      return res.status(400).json({
        ok: false,
        message: "All fields required",
      });
    }

    const plan = await prisma.subscriptionplan.create({
      data: {
        name,
        duration: Number(duration),
        price: Number(price), // store in paisa
      },
    });

    return res.json({
      ok: true,
      data: plan,
    });
  } catch (err) {
    console.error("createPlan error", err);
    return res.status(500).json({ ok: false });
  }
};

/* ===============================
   GET ALL PLANS
=============================== */
exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionplan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      ok: true,
      data: plans,
    });
  } catch (err) {
    console.error("getPlans error", err);
    return res.status(500).json({ ok: false });
  }
};

/* ===============================
   UPDATE PLAN
=============================== */
exports.updatePlan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, duration, price, isActive } = req.body;

    const updated = await prisma.subscriptionplan.update({
      where: { id },
      data: {
        name,
        duration: duration ? Number(duration) : undefined,
        price: price ? Number(price) : undefined,
        isActive,
      },
    });

    return res.json({
      ok: true,
      data: updated,
    });
  } catch (err) {
    console.error("updatePlan error", err);
    return res.status(500).json({ ok: false });
  }
};

/* ===============================
   DELETE PLAN (SOFT)
=============================== */
exports.deletePlan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.subscriptionplan.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("deletePlan error", err);
    return res.status(500).json({ ok: false });
  }
};