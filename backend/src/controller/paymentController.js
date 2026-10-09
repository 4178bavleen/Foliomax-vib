const Razorpay = require("razorpay");
const crypto = require("crypto");
const {
  PrismaClient,
  PaymentMethod,
  PaymentStatus,
} = require("@prisma/client");

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ======================================================
   HELPER: MAP METHOD
====================================================== */
function mapPaymentMethod(method) {
  switch (method) {
    case "card":
      return PaymentMethod.CARD;
    case "upi":
      return PaymentMethod.UPI;
    case "netbanking":
      return PaymentMethod.NETBANKING;
    case "wallet":
      return PaymentMethod.WALLET;
    case "emi":
      return PaymentMethod.EMI;
    default:
      return PaymentMethod.UNKNOWN;
  }
}

/* ======================================================
   1️⃣ CREATE ORDER (SUBSCRIPTION ONLY)
====================================================== */
exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!planId) {
      return res.status(400).json({ error: "planId required" });
    }

    const plan = await prisma.subscriptionplan.findUnique({
      where: { id: Number(planId) },
    });

    if (!plan || !plan.isActive) {
      return res.status(404).json({ error: "Invalid plan" });
    }

    const order = await razorpay.orders.create({
      amount: plan.price*100, // already in paisa
      currency: "INR",
      receipt: `sub_${plan.id}_${userId}_${Date.now()}`,
    });

    await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        amount: plan.price*100,
        currency: "INR",
        status: PaymentStatus.CREATED,
        // 🔥 store planId directly (IMPORTANT)
        subscriptions: {
          create: {
            userId,
            planId: plan.id,
            startDate: new Date(),
            endDate: new Date(), // temp (will update after success)
            status: "PENDING",
          },
        },
      },
    });

    return res.status(200).json(order);
  } catch (err) {
    console.error("Create Order Error:", err);
    return res.status(500).json({ error: "Order creation failed", detail: err.message });
  }
};

/* ======================================================
   2️⃣ VERIFY PAYMENT
====================================================== */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    /* 🔐 SIGNATURE VERIFY */
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    /* 🔎 FETCH PAYMENT */
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { subscriptions: true },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    /* 🛑 IDEMPOTENCY */
    if (payment.status === PaymentStatus.SUCCESS) {
      return res.json({ success: true });
    }

    /* 🔎 FETCH FROM RAZORPAY */
    const rzpPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    /* ✅ UPDATE PAYMENT */
    const updatedPayment = await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: PaymentStatus.SUCCESS,
        method: mapPaymentMethod(rzpPayment.method),
        email: rzpPayment.email,
        contact: rzpPayment.contact,
        paidAt: new Date(rzpPayment.created_at * 1000),
        rawResponse: rzpPayment,
      },
    });

    /* ======================================================
       🔥 ACTIVATE SUBSCRIPTION
    ====================================================== */
    const sub = payment.subscriptions[0];
    if (!sub) {
      return res.status(500).json({ error: "Subscription not linked" });
    }

    const plan = await prisma.subscriptionplan.findUnique({
      where: { id: sub.planId },
    });

    const existingActive = await prisma.usersubscription.findFirst({
      where: {
        userId: payment.userId,
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: "desc" },
    });

    let startDate = new Date();

    if (existingActive) {
      startDate = existingActive.endDate;
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration);

    await prisma.usersubscription.update({
      where: { id: sub.id },
      data: {
        startDate,
        endDate,
        status: "ACTIVE",
        paymentId: updatedPayment.id,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Verify Error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
};

/* ======================================================
   3️⃣ GET SUBSCRIPTION STATUS
====================================================== */
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const sub = await prisma.usersubscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: "desc" },
    });

    return res.json({
      ok: true,
      active: !!sub,
      expiry: sub?.endDate || null,
      planId: sub?.planId || null,
    });
  } catch (err) {
    console.error("Status Error:", err);
    return res.status(500).json({ ok: false });
  }
};

/* ======================================================
   4️⃣ WEBHOOK (SAFE + IDEMPOTENT)
====================================================== */
exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== req.headers["x-razorpay-signature"]) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(req.rawBody);

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      await prisma.payment.updateMany({
        where: { razorpayOrderId: payment.order_id },
        data: {
          status: PaymentStatus.FAILED,
          rawResponse: payment,
        },
      });
    }

    return res.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: "Webhook failed" });
  }
};