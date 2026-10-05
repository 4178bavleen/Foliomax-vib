import React, { useState, useEffect } from "react";
import "./Login.css"; // reuse same styling
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text: "" }

  // Read token & email from URL on mount
  useEffect(() => {
    const t = searchParams.get("token");
    const e = searchParams.get("email");

    if (!t || !e) {
      setMessage({
        type: "error",
        text: "Invalid or missing reset link. Please request a new one.",
      });
    } else {
      setToken(t);
      setEmail(e);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!token || !email) {
      setMessage({
        type: "error",
        text: "Reset link is invalid or expired. Please request a new one.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    // simple client validation
    if (password.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/foliomax/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          newPassword: password,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.ok) {
        setMessage({
          type: "success",
          text: data.message || "Password reset successful. You can now sign in.",
        });

        // optional redirect after few seconds
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Reset failed. Your link may have expired.",
        });
      }
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
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
            <h1 className="h-login-title">Reset Password</h1>
            <p className="h-login-subtitle">
              Choose a new password for your Foliomax account.
            </p>

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
                <label>Email (locked)</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="readonly"
                />
              </div>

              <div className="h-field">
                <label htmlFor="password">New Password*</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="h-field">
                <label htmlFor="confirmPassword">Confirm New Password*</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="h-primary-btn"
                disabled={loading}
              >
                {loading ? "Updating Password..." : "Reset Password"}
              </button>
            </form>

            <p className="h-register-text">
              Remembered your password?{" "}
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

export default ResetPassword;
