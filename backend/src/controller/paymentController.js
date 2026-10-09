const Razorpay = require("razorpay");
const crypto = require("crypto");
const { PrismaClient, $Enums } = require("@prisma/client");

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
      return $Enums.payment_method.CARD;
    case "upi":
      return $Enums.payment_method.UPI;
    case "netbanking":
      return $Enums.payment_method.NETBANKING;
    case "wallet":
      return $Enums.payment_method.WALLET;
    case "emi":
      return $Enums.payment_method.EMI;
    default:
      return $Enums.payment_method.UNKNOWN;
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
        amount: plan.price * 100,
        currency: "INR",
        status: $Enums.payment_status.CREATED,
        // 🔥 store planId directly (IMPORTANT)
        usersubscription: {
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
      planId,
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!razorpay_payment_id) {
      return res.status(400).json({ error: "Missing parameters: razorpay_payment_id required" });
    }

    /* 🔐 1. SIGNATURE VERIFY (If order_id and signature are present) */
    if (razorpay_order_id && razorpay_signature) {
      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expected !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    /* 🔎 2. FETCH FROM RAZORPAY */
    let rzpPayment;
    try {
      rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (rzpErr) {
      console.error("Fetch Razorpay Payment Error:", rzpErr);
      return res.status(400).json({ error: "Payment not found on Razorpay", detail: rzpErr.message });
    }

    if (!rzpPayment || (rzpPayment.status !== "captured" && rzpPayment.status !== "authorized")) {
      return res.status(400).json({ error: `Payment is not successful (status: ${rzpPayment?.status})` });
    }

    // Auto-capture if authorized
    if (rzpPayment.status === "authorized") {
      try {
        rzpPayment = await razorpay.payments.capture(
          razorpay_payment_id,
          rzpPayment.amount,
          rzpPayment.currency
        );
      } catch (capErr) {
        console.error("Capture warning:", capErr.message);
      }
    }

    /* 🔎 3. FIND PAYMENT IN DB */
    const effectiveOrderId = razorpay_order_id || rzpPayment.order_id;
    let payment = null;

    if (effectiveOrderId) {
      payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: effectiveOrderId },
        include: { usersubscription: true },
      });
    }

    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { razorpayPaymentId: razorpay_payment_id },
        include: { usersubscription: true },
      });
    }

    /* 🛑 IDEMPOTENCY: Already marked SUCCESS */
    if (payment && payment.status === $Enums.payment_status.SUCCESS) {
      return res.json({ success: true, message: "Payment already verified" });
    }

    /* 4. CREATE PAYMENT IF MISSING (e.g. orderless payment or initial creation failed) */
    if (!payment) {
      let targetPlan = null;
      if (planId) {
        targetPlan = await prisma.subscriptionplan.findUnique({
          where: { id: Number(planId) },
        });
      }

      if (!targetPlan) {
        const amountInRupees = Math.round(rzpPayment.amount / 100);
        targetPlan = await prisma.subscriptionplan.findFirst({
          where: { price: amountInRupees, isActive: true },
        }) || await prisma.subscriptionplan.findFirst({
          where: { isActive: true },
          orderBy: { price: "asc" },
        });
      }

      if (!targetPlan) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }

      const orderRef = effectiveOrderId || `direct_${razorpay_payment_id}`;

      payment = await prisma.payment.create({
        data: {
          userId,
          razorpayOrderId: orderRef,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature || null,
          amount: rzpPayment.amount,
          currency: rzpPayment.currency || "INR",
          status: $Enums.payment_status.SUCCESS,
          method: mapPaymentMethod(rzpPayment.method),
          email: rzpPayment.email || null,
          contact: rzpPayment.contact || null,
          paidAt: new Date(rzpPayment.created_at * 1000),
          rawResponse: rzpPayment,
          usersubscription: {
            create: {
              userId,
              planId: targetPlan.id,
              startDate: new Date(),
              endDate: new Date(),
              status: "PENDING",
            },
          },
        },
        include: { usersubscription: true },
      });
    } else {
      /* ✅ UPDATE EXISTING PAYMENT */
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature || payment.razorpaySignature,
          status: $Enums.payment_status.SUCCESS,
          method: mapPaymentMethod(rzpPayment.method),
          email: rzpPayment.email || payment.email,
          contact: rzpPayment.contact || payment.contact,
          paidAt: new Date(rzpPayment.created_at * 1000),
          rawResponse: rzpPayment,
        },
        include: { usersubscription: true },
      });
    }

    /* ======================================================
       🔥 ACTIVATE SUBSCRIPTION
    ====================================================== */
    let sub = payment.usersubscription?.[0];

    if (!sub) {
      let targetPlan = null;
      if (planId) {
        targetPlan = await prisma.subscriptionplan.findUnique({
          where: { id: Number(planId) },
        });
      }
      if (!targetPlan) {
        targetPlan = await prisma.subscriptionplan.findFirst({
          where: { isActive: true },
          orderBy: { price: "asc" },
        });
      }

      sub = await prisma.usersubscription.create({
        data: {
          userId,
          planId: targetPlan.id,
          paymentId: payment.id,
          startDate: new Date(),
          endDate: new Date(),
          status: "PENDING",
        },
      });
    }

    const plan = await prisma.subscriptionplan.findUnique({
      where: { id: sub.planId },
    });

    if (!plan) {
      return res.status(500).json({ error: "Plan not found" });
    }

    const existingActive = await prisma.usersubscription.findFirst({
      where: {
        userId: payment.userId,
        status: "ACTIVE",
        id: { not: sub.id },
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
        paymentId: payment.id,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Verify Error:", err);
    return res.status(500).json({ error: "Verification failed", detail: err.message });
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
          status: $Enums.payment_status.FAILED,
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