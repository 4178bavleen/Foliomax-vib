const { PrismaClient, PaymentStatus } = require("@prisma/client");

const prisma = new PrismaClient();


exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    // ===============================
    // Query Params
    // ===============================
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const status = req.query.status; // SUCCESS / FAILED / CREATED / REFUNDED
    const fromDate = req.query.from;
    const toDate = req.query.to;

    const skip = (page - 1) * limit;

    // ===============================
    // Build Where Clause
    // ===============================
    const where = {
      userId,
    };

    if (status && Object.values(PaymentStatus).includes(status)) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.createdAt = {};

      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }

      if (toDate) {
        where.createdAt.lte = new Date(toDate);
      }
    }

    // ===============================
    // Fetch Transactions
    // ===============================
    const [transactions, totalCount, totalSpent] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          pdf: {
            select: {
              id: true,
              title: true,
              originalName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        skip,
        take: limit,
      }),

      prisma.payment.count({ where }),

      prisma.payment.aggregate({
        where: {
          userId,
          status: PaymentStatus.SUCCESS,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // ===============================
    // Format Response
    // ===============================
    const formatted = transactions.map((tx) => ({
      id: tx.id,
      pdfId: tx.pdfId,
      pdfTitle: tx.pdf?.title || tx.pdf?.originalName || "N/A",

      amount: tx.amount / 100, // paisa → INR
      currency: tx.currency,

      status: tx.status,
      method: tx.method,

      razorpayOrderId: tx.razorpayOrderId,
      razorpayPaymentId: tx.razorpayPaymentId,

      paidAt: tx.paidAt,
      createdAt: tx.createdAt,

      email: tx.email,
      contact: tx.contact,
    }));

    return res.status(200).json({
      ok: true,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      totalSpent: (totalSpent._sum.amount || 0) / 100,
      transactions: formatted,
    });

  } catch (err) {
    console.error("getMyTransactions error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch transactions",
    });
  }
};