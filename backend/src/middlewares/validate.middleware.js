// src/middlewares/validate.middleware.js
const { ZodError } = require("zod");

exports.validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Zod v4 exposes issues (v3 also had .errors as an alias)
      const issues = err.issues || err.errors || [];
      return res.status(400).json({
        ok: false,
        error: issues[0]?.message || "Validation failed",
      });
    }
    return res.status(500).json({ ok: false, error: "Validation failed" });
  }
};
