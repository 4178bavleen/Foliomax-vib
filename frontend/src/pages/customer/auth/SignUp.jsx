import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [resending, setResending] = useState(false);

  // ===============================
  // Validators
  // ===============================

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    // Minimum 8 chars, uppercase, lowercase, number, symbol
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return strongPassword.test(password);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // optional field
    const phoneRegex = /^[0-9+\-\s]{7,15}$/;
    return phoneRegex.test(phone);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // prevent double submit

    // Trim values
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();
    const phone = form.phone.trim();

    // ===============================
    // Client Side Validation
    // ===============================

    if (!name) {
      return setMessage({ type: "error", text: "Full name is required." });
    }

    if (!validateEmail(email)) {
      return setMessage({ type: "error", text: "Invalid email format." });
    }

    if (!validatePassword(password)) {
      return setMessage({
        type: "error",
        text:
          "Password must contain uppercase, lowercase, number, symbol and be at least 8 characters."
      });
    }

    if (password !== confirmPassword) {
      return setMessage({
        type: "error",
        text: "Passwords do not match."
      });
    }

    if (!validatePhone(phone)) {
      return setMessage({
        type: "error",
        text: "Invalid phone number format."
      });
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/foliomax/auth/register`,{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone
        })
      });

      let data;

      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response.");
      }

      if (!res.ok) {
        const error = new Error(data?.error || "Registration failed.");
        // Account exists but verification email was never received/clicked
        if (res.status === 409) error.action = "resend";
        throw error;
      }

      setMessage({
        type: "success",
        text: "Signup successful! Please verify your email."
      });

      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Server error. Try again later.",
        action: err.action
      });
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Resend verification email (409 dead-end)
  // ===============================
  const handleResendVerification = async () => {
    const email = form.email.trim().toLowerCase();

    if (!validateEmail(email)) {
      return setMessage({ type: "error", text: "Enter a valid email first." });
    }

    setResending(true);
    setMessage(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/foliomax/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Failed to resend verification email.");
      }

      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Server error. Try again later."
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="h-login-root">
      <div className="h-login-left">
        <div className="h-login-left-inner">

          <div className="h-login-form-wrapper">
            <h1 className="h-login-title">Create an account</h1>
            <p className="h-login-subtitle">
              Fill in your details to get started with Foliomax.
            </p>

            {message && (
              <div
                style={{
                  background: message.type === "error" ? "#ffdddd" : "#ddffdd",
                  color: message.type === "error" ? "#b30000" : "#006600",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  textAlign: "center"
                }}
              >
                {message.text}
                {message.action === "resend" && (
                  <div>
                    <button
                      type="button"
                      className="h-resend-btn"
                      onClick={handleResendVerification}
                      disabled={resending}
                    >
                      {resending ? "Sending..." : "Resend verification email"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <form className="h-login-form" onSubmit={handleSubmit}>
              <div className="h-field">
                <label htmlFor="name">Full Name*</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="h-field">
                <label htmlFor="email">Email*</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="h-field">
                <label htmlFor="phone">Phone Number (optional)</label>
                <input
                  id="phone"
                  type="text"
                  placeholder="Enter your phone number"
                  onChange={handleChange}
                />
              </div>

              <div className="h-field">
                <label htmlFor="password">Password*</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="h-field">
                <label htmlFor="confirmPassword">Confirm Password*</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="h-remember-row">
                <label className="h-checkbox">
                  <input type="checkbox" required />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      className="h-text-link"
                      onClick={() => navigate("/terms-conditions")}
                    >
                      Terms & Conditions
                    </button>
                  </span>
                </label>
              </div>

              <button type="submit" className="h-primary-btn" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <p className="h-register-text">
              Already have an account?{" "}
              <button
                type="button"
                className="h-text-link"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </p>
          </div>

          <p className="h-left-footer">©2026 Foliomax. All Rights Reserved.</p>
        </div>
      </div>

      <div className="h-login-right">
        <div className="h-right-gradient"></div>
      </div>
    </div>
  );
};

export default Signup;