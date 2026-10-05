// src/middlewares/validate.middleware.js
const { ZodError } = require("zod");

exports.validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        ok: false,
        error: err.errors[0].message, // returns first validation error message
      });
    }
    return res.status(500).json({ ok: false, error: "Validation failed" });
  }
};
