const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * ADMIN DASHBOARD STATS
 * GET /admin/stats
 */
exports.getAdminStats = async (req, res) => {
  try {
    // Run all queries in parallel (FAST 🚀)
    const [
      totalUsers,
      totalAdmins,
      totalBlogs,
      publishedBlogs,
      totalVideos,
      totalPdfs,
      paidPdfs,
      totalWordFiles,
      totalExcelFiles,
      totalContacts,
      unreadContacts,
      totalPayments,
      successfulPayments,
      totalRevenue,
      totalSubscriptions,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: { role: "ADMIN" },
      }),

      prisma.blog.count(),

      prisma.blog.count({
        where: { isPublished: true },
      }),

      prisma.video.count({
        where: { isDeleted: false },
      }),

      prisma.pdf.count({
        where: { isDeleted: false },
      }),

      prisma.pdf.count({
        where: {
          price: { not: null },
          isDeleted: false,
        },
      }),

      prisma.wordfile.count({
        where: { isDeleted: false },
      }),

      prisma.excelfile.count({
        where: { isDeleted: false },
      }),

      prisma.contactmessage.count(),

      prisma.contactmessage.count({
        where: { isRead: false },
      }),

      prisma.payment.count(),

      prisma.payment.count({
        where: { status: "SUCCESS" },
      }),

      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: "SUCCESS",
        },
      }),

      prisma.usersubscription.count(),

      prisma.usersubscription.count({
        where: { status: "ACTIVE" },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
        },

        blogs: {
          total: totalBlogs,
          published: publishedBlogs,
        },

        media: {
          videos: totalVideos,
          pdfs: totalPdfs,
          paidPdfs: paidPdfs,
          wordFiles: totalWordFiles,
          excelFiles: totalExcelFiles,
        },

        contacts: {
          total: totalContacts,
          unread: unreadContacts,
        },

        payments: {
          total: totalPayments,
          successful: successfulPayments,
          revenue: totalRevenue._sum.amount || 0, // in paisa
        },

        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
        },
      },
    });
  } catch (error) {
    console.error("Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};