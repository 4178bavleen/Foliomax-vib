import React, { useState, useEffect } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi"; // ✅ added

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // ✅ added
  const [message, setMessage] = useState(null);

  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  /* ================= AUTO LOGIN ================= */
  useEffect(() => {
    const token =
      localStorage.getItem("foliomax_accessToken") ||
      sessionStorage.getItem("foliomax_accessToken");

    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.exp * 1000 > Date.now()) {
        const redirectTo =
          localStorage.getItem("redirectAfterLogin") || "/customer";

        localStorage.removeItem("redirectAfterLogin");
        navigate(redirectTo, { replace: true });
      } else {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch {}
  }, [navigate]);

  /* ================= INPUT ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  /* ================= PASSWORD LOGIN ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return setMessage({ type: "error", text: "All fields are required" });
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/foliomax/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.ok) {
        return setMessage({
          type: "error",
          text: data.error || "Invalid credentials",
        });
      }

      const storage = keepLoggedIn ? localStorage : sessionStorage;
      storage.setItem("foliomax_accessToken", data.accessToken);
      storage.setItem("foliomax_refreshToken", data.refreshToken);

      const redirectTo =
        localStorage.getItem("redirectAfterLogin") || "/customer";

      localStorage.removeItem("redirectAfterLogin");

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setLoading(false);
      setMessage({
        type: "error",
        text: "Server error. Please try again.",
      });
    }
  };

  /* ================= SEND OTP ================= */
  const handleSendOtp = async () => {
    if (!form.email) {
      return setMessage({ type: "error", text: "Enter email first" });
    }

    setOtpLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/foliomax/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        }
      );

      const data = await res.json();
      setOtpLoading(false);

      if (!res.ok || !data.ok) {
        return setMessage({
          type: "error",
          text: data.error || "Failed to send OTP",
        });
      }

      setOtpSent(true);
      setMessage({
        type: "success",
        text: "OTP sent to your email",
      });
    } catch {
      setOtpLoading(false);
      setMessage({
        type: "error",
        text: "Network error. Try again.",
      });
    }
  };

  /* ================= VERIFY OTP ================= */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      return setMessage({ type: "error", text: "Enter OTP" });
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/foliomax/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            otp,
          }),
        }
      );

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.ok) {
        return setMessage({
          type: "error",
          text: data.error || "Invalid OTP",
        });
      }

      const storage = keepLoggedIn ? localStorage : sessionStorage;
      storage.setItem("foliomax_accessToken", data.accessToken);
      storage.setItem("foliomax_refreshToken", data.refreshToken);

      const redirectTo =
        localStorage.getItem("redirectAfterLogin") || "/customer";

      localStorage.removeItem("redirectAfterLogin");

      navigate(redirectTo, { replace: true });
    } catch {
      setLoading(false);
      setMessage({
        type: "error",
        text: "Verification failed. Try again.",
      });
    }
  };

  return (
    <div className="h-login-root">
      <div className="h-login-left">
        <div className="h-login-left-inner">
          <div className="h-login-form-wrapper">

            <div className="h-logo-container">
              <img
                src="/assets/images/updated-logo.svg"
                alt="FolioMax Logo"
                className="h-logo-image"
              />
            </div>

            <h1 className="h-login-title">Sign In</h1>

            <p className="h-login-subtitle">
              {isOtpMode
                ? "Login using OTP"
                : "Enter your email and password"}
            </p>

            {/* TOGGLE */}
            <div className="h-login-toggle">
              <button
                type="button"
                className={!isOtpMode ? "h-toggle-btn active" : "h-toggle-btn"}
                onClick={() => {
                  setIsOtpMode(false);
                  setOtpSent(false);
                  setOtp("");
                  setMessage(null);
                }}
              >
                Password
              </button>

              <button
                type="button"
                className={isOtpMode ? "h-toggle-btn active" : "h-toggle-btn"}
                onClick={() => {
                  setIsOtpMode(true);
                  setOtpSent(false);
                  setOtp("");
                  setMessage(null);
                }}
              >
                OTP
              </button>
            </div>

            {message && (
              <div className={`h-msg ${message.type}`}>
                {message.text}
              </div>
            )}

            <form
              onSubmit={isOtpMode ? handleVerifyOtp : handleSubmit}
              className="h-login-form"
            >
              <div className="h-field">
                <label>Email*</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* ✅ PASSWORD WITH ICON */}
              {!isOtpMode && (
                <div className="h-field">
                  <label>Password*</label>

                  <div className="h-password-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      required
                    />

                    <span
                      className="h-eye-icon"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>
              )}

              {!isOtpMode && (
                <button type="submit" className="h-primary-btn">
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              )}
            </form>

            <p className="h-register-text">
              Already have an account?{" "}
              <button
                type="button"
                className="h-text-link"
                onClick={() => navigate("/signup")}
              >
                Create an account
              </button>
            </p>

          </div>
          <p className="h-left-footer">©2026 Foliomax. All Rights Reserved.</p>
        </div>
      </div>

      <div className="h-login-right">
        <div className="h-right-gradient" />
      </div>
    </div>
  );
};

export default Login;