import React, { useState } from "react";
import "./Login.css"; // reuse same styles
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text: "" }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/foliomax/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.ok) {
        setMessage({
          type: "success",
          text:
            data.message ||
            "If an account with that email exists, a reset link has been sent.",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch (err) {
      console.error("FORGOT PASSWORD ERROR:", err);
      setLoading(false);
      setMessage({
        type: "error",
        text: "Server error. Please try again later.",
      });
    }
  };

  return (
    <div className="h-login-root">
      {/* LEFT SIDE */}
      <div className="h-login-left">
        <div className="h-login-left-inner">
          <div className="h-login-form-wrapper">
            <h1 className="h-login-title">Forgot Password</h1>
            <p className="h-login-subtitle">
              Enter your registered email address and we'll send you a reset link.
            </p>

            {/* Separator */}
            <div className="h-separator">
              <span className="h-separator-line" />
            </div>

            {/* Message box */}
            {message && (
              <div
                style={{
                  background:
                    message.type === "error" ? "#ffdddd" : "#ddffdd",
                  color: message.type === "error" ? "#b30000" : "#006600",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  textAlign: "center",
                }}
              >
                {message.text}
              </div>
            )}

            {/* FORM */}
            <form className="h-login-form" onSubmit={handleSubmit}>
              <div className="h-field">
                <label htmlFor="email">Email*</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your resgistered email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="h-primary-btn" disabled={loading}>
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>

            <p className="h-register-text">
              Remember your password?{" "}
              <button
                type="button"
                className="h-text-link"
                onClick={() => navigate("/login")}
              >
                Back to Sign In
              </button>
            </p>
          </div>

          <p className="h-left-footer">
            ©2026 Foliomax. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="h-login-right">
        <div className="h-right-gradient">
          {/* <div className="h-logo-container">
            <img
              src="/assets/images/fol-log-white.png"
              alt="FolioMax Logo"
              className="h-logo-image"
            />
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
