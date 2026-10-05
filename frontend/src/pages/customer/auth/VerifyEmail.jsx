import React, { useEffect, useState } from "react";
import "./Login.css"; // reuse same styling
import { useSearchParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link. Missing token or email.");
      return;
    }

    const verify = async () => {
      try {
        
        const res = await fetch(
  `${import.meta.env.VITE_API_BASE}/foliomax/auth/verify-email?token=${token}&email=${encodeURIComponent(
    email
  )}`
);

        const data = await res.json();

        if (data.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          // optional auto-redirect
          setTimeout(() => navigate("/login"), 2500);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (err) {
        console.error("VERIFY EMAIL ERROR:", err);
        setStatus("error");
        setMessage("Server error while verifying. Please try again later.");
      }
    };

    verify();
  }, [searchParams, navigate]);

  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="h-login-root">
      <div className="h-login-left">
        <div className="h-login-left-inner">
          <div className="h-login-form-wrapper">
            <h1 className="h-login-title">
              {isSuccess ? "Email Verified 🎉" : isError ? "Verification Failed" : "Verifying..."}
            </h1>

            <p
              style={{
                background: isError ? "#ffdddd" : isSuccess ? "#ddffdd" : "transparent",
                color: isError ? "#b30000" : isSuccess ? "#006600" : "#333",
                padding: "10px",
                borderRadius: "6px",
                margin: "10px 0 20px",
                textAlign: "center",
              }}
            >
              {message}
            </p>

            {isSuccess && (
              <button
                type="button"
                className="h-primary-btn"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
            )}

            {isError && (
              <button
                type="button"
                className="h-primary-btn"
                onClick={() => navigate("/signup")}
              >
                Create a new account
              </button>
            )}
          </div>

          <p className="h-left-footer">©2026 Foliomax. All Rights Reserved.</p>
        </div>
      </div>

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

export default VerifyEmail;
