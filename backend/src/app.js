const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { produce } = require("./services/testing-2-kafka/producer");
const { runConsumer } = require("./services/testing-2-kafka/consumer");
const marketRoutes = require("./routes/marketRoutes");
const paymentRoutes = require("./routes/paymentRoutes");


const yahooStocks = require("./routes/PopularStocks/yahooStocks");
const app = express();
app.use(express.json());

// ---------- CORS (add before routes) ----------
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";
const ADMIN_URL = process.env.ADMIN_URL;
app.use(
  cors({
    origin: [FRONTEND_URL, ADMIN_URL], // allow your frontend origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true, // allow cookies and Authorization header
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);
const pdfRoutes = require('./routes/Admin/Pdf/pdfRoutes');
const vedioRoutes = require('./routes/Admin/Video/videoRoutes');
app.use('/foliomax/public/pdf', pdfRoutes);
app.use('/foliomax/public/video', vedioRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/popular-stock", yahooStocks);
app.get("/kafka-testing/:name", async (req, res) => {
  try {
    const payload = { name: req.params.name || "Anonymous" };
    await produce(payload);
    return res.status(200).json({ ok: true, sent: payload });
  } catch (error) {}
});

// optional: if you rely on cookies you might want cookie-parser
// const cookieParser = require('cookie-parser');
// app.use(cookieParser());
// -----------------------------------------------

app.use("/public", express.static(path.join(__dirname, "../public")));

app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use("/uploads", express.static("uploads"));

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

app.use(
  "/uploads/insights",
  express.static(path.join(process.cwd(), "uploads/insights"))
);
const authRoute = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const quizRoutes = require("./routes/Admin/Quiz/quizRoutes");
const statsRoutes = require("./routes/Admin/Stats/StatsRoutes");
const companyRoutes = require("./routes/Admin/Company/companyRoutes");
// const vedioRoutes = require('./routes/Admin/Video/videoRoutes');
const wordRoutes = require('./routes/Admin/Word/wordRoutes');
const faqCategoryRoutes = require('./routes/Admin/FAQ/faqCategoryRoutes');
const faqRoutes = require('./routes/Admin/FAQ/faqRoutes');
const contactRoutes = require("./routes/contactRoutes");
const blogCategoryRoutes = require("./routes/Admin/Blog/blogCategoryRoutes");
const blogRoutes = require("./routes/Admin/Blog/blogRoutes");
const insightsCategoryRoutes =require("./routes/Admin/Etf&MutualFund/insightsCategoryRoutes");
const insightsRoutes =require("./routes/Admin/Etf&MutualFund/insightsRoutes");
const learnRoutes = require("./routes/Admin/Learn/learnRoutes");

// const questionRoutes = require("./routes/Admin/Quiz/questionRoutes");
// Rate limit login: max 5 requests in 15 mins
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many login attempts, try again later" },
});

// place login limiter on the login route
app.use("/foliomax/auth/login", loginLimiter);
app.use("/foliomax",contactRoutes);
// mount routes (after CORS)
app.use("/foliomax/auth", authRoute);
app.use("/foliomax", require("./routes/siteContentRoutes/siteContentRoutes"));

// Routes
app.use("/foliomax", fileRoutes);

app.use("/foliomax/quizzes", quizRoutes);
app.use("/foliomax/companies", companyRoutes);
// app.use("/api/questions", questionRoutes);



app.use("/foliomax/profile", require("./routes/User/profileRoutes"));
app.use("/foliomax/user",require("./routes/User/transactionRoutes"));


app.use("/foliomax/blog-categories", blogCategoryRoutes);
app.use("/foliomax/blogs", blogRoutes);

app.use("/foliomax/insights-categories",insightsCategoryRoutes);
app.use("/foliomax/insights",insightsRoutes);
app.use("/foliomax/learn", learnRoutes);
app.use("/foliomax/admin/video", vedioRoutes);
app.use('/foliomax/admin/pdf', pdfRoutes);
app.use('/foliomax/admin/',statsRoutes);
app.use('/foliomax/files', wordRoutes);
app.use('/foliomax/admin', faqCategoryRoutes ,faqRoutes);
app.use('/foliomax', faqCategoryRoutes ,faqRoutes);
app.use("/foliomax/payment", paymentRoutes);

app.use("/foliomax/admin/subscription", require("./routes/Admin/Subscriptions/subscriptionRoutes"));
app.use("/foliomax/subscription", require("./routes/Admin/Subscriptions/subscriptionRoutes"));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>FolioMax Backend</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: "Inter", sans-serif;
          background: linear-gradient(135deg, #0f172a, #000000);
          color: #f1f5f9;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .box {
          text-align: center;
          padding: 40px 60px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          backdrop-filter: blur(12px);
          box-shadow: 0 0 30px rgba(0,0,0,0.4);
          animation: fadeIn 0.8s ease-out;
        }

        h1 {
          margin: 0 0 10px;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        p {
          margin: 0;
          font-size: 16px;
          opacity: 0.8;
        }

        .pill {
          display: inline-block;
          margin-top: 18px;
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border-radius: 999px;
          font-size: 14px;
          text-decoration: none;
          transition: 0.2s;
        }

        .pill:hover {
          background: #2563eb;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </head>

    <body>
      <div class="box">
        <h1>FolioMax Backend</h1>
        <p>Your Server Is Running Successfully.</p>
        <a class="pill" href="https://foliomax.in" target="_blank">Visit Website</a>
      </div>
    </body>
    </html>
  `);
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(` FolioMax backend running on http://localhost:${PORT}`);
});
