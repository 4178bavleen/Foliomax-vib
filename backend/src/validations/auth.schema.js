const { z } = require("zod");

exports.registerSchema = z.object({
  name: z.string().min(2,"Name required"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Min 8 characters")
    .regex(/(?=.*[a-z])/, "Must contain lowercase")
    .regex(/(?=.*[A-Z])/, "Must contain uppercase")
    .regex(/(?=.*[0-9])/, "Must contain number")
    .regex(/(?=.*[\W_])/, "Must contain symbol"),
  phone: z.string().optional(),
});

exports.loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1,"Password required")
});

exports.resetSchema = z.object({
  email: z.string().email("Invalid email"),
});

exports.setNewPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
  token: z.string().min(1,"Token required"),
  newPassword: z.string().min(8,"Min 8 characters"),
});
