const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465, // auto secure based on port
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Avoid SSL issue on shared servers
  }
});

// Verify SMTP connection once at startup
transporter.verify()
  .then(() => console.log("📧 SMTP server connected successfully"))
  .catch(err => console.error("❌ SMTP Connection Failed:", err.message));

module.exports = transporter;
