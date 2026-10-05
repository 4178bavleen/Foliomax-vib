const transporter = require("../config/mailer");
const fs = require("fs");
const path = require("path");

exports.sendEmail = async (to, subject, templateName, variables = {}) => {
  console.log("\n================ EMAIL DEBUG START ================");
  console.log("📨 To:", to);
  console.log("📌 Subject:", subject);
  console.log("📧 SMTP User:", process.env.SMTP_USER);
  console.log("📁 Template:", templateName);

  try {
    const filePath = path.join(__dirname, "templates", templateName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Template not found: ${filePath}`);
    }

    // ✅ Inject logo here
    variables.logoUrl = `${process.env.API_URL}/public/logo/updated-logo.png`;

    let html = fs.readFileSync(filePath, "utf8");

    for (const key in variables) {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), variables[key]);
    }

    console.log("📝 HTML Loaded & Variables Injected");

    const mailOptions = {
      from: `"Foliomax" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    console.log("🚀 Sending email...");

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("📨 Message ID:", info.messageId);
    console.log("📬 Response:", info.response);

    console.log("================ EMAIL DEBUG END ================\n");

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };

  } catch (err) {
    console.error("❌ EMAIL FAILED");
    console.error("👉 Error Message:", err.message);
    console.error("👉 Full Error:", err);

    console.log("================ EMAIL DEBUG END ================\n");

    return {
      success: false,
      error: err.message,
    };
  }
};