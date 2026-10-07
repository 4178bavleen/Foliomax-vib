import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import "./Subscription.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.foliomax.in";

function Subscriptions() {
  const [pdfs, setPdfs] = useState([]);
  const [excels, setExcels] = useState([]); // ✅ ADDED

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlans, setShowPlans] = useState(false);

  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchSubscriptions();
    fetchExcels(); // ✅ ADDED
    fetchSubscriptionStatus();
    fetchPlans();
  }, []);

  /* ===============================
     AUTO OPEN MODAL AFTER LOGIN
  =============================== */
  useEffect(() => {
    const token = sessionStorage.getItem("foliomax_accessToken");
    const redirectPath = localStorage.getItem("redirectAfterLogin");

    if (token && redirectPath === "/subscription") {
      setShowPlans(true);
    }
  }, [location]);

  /* ===============================
     FETCH PLANS
  =============================== */
  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_BASE}/foliomax/subscription/all`);
      const data = await res.json();

      if (data.ok) {
        setPlans(data.data);
        setSelectedPlan(data.data[0]);
      }
    } catch {
      toast.error("Failed to load plans");
    }
  };

  /* ===============================
     FETCH SUB STATUS
  =============================== */
  const fetchSubscriptionStatus = async () => {
    try {
      const token = sessionStorage.getItem("foliomax_accessToken");
      if (!token) return;

      const res = await fetch(
        `${API_BASE}/foliomax/payment/subscription-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (data.ok) setIsSubscribed(data.active);
    } catch {}
  };

  /* ===============================
     FETCH PDFs
  =============================== */
  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/foliomax/public/pdf/public?tags=Subscription`
      );
      const data = await res.json();
      if (data?.data) setPdfs(data.data);
    } catch {
      toast.error("Failed to load PDFs");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     FETCH EXCELS (NEW)
  =============================== */
  const fetchExcels = async () => {
  try {
    const res = await fetch(
      `${API_BASE}/foliomax/api/files`
    );

    const data = await res.json();

    if (Array.isArray(data)) {
      setExcels(data.filter((e) => e.isPremium));
    }
  } catch {
    toast.error("Failed to load Excels");
  }
};

/* ===============================
     VIEW EXCEL
   =============================== */
  const handleViewExcel = async (excel) => {
    const token = sessionStorage.getItem("foliomax_accessToken");

    // 🔒 Not logged in
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/foliomax/api/files/${excel.id}/protected`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      // ❌ API error
      if (!res.ok || !data.ok) {
        toast.error(data?.message || "Subscription required");
        return;
      }

      // ❌ Safety check
      if (!data.url) {
        toast.error("File URL not available");
        return;
      }

      // ✅ Navigate to Excel Viewer page
      navigate(`/excel/${excel.id}`);

    } catch (err) {
      console.error("Excel view error:", err);
      toast.error("Something went wrong while opening file");
    }
  };

  /* ===============================
     SUBSCRIBE CLICK
  =============================== */
  const handleSubscribeClick = () => {
    const token = sessionStorage.getItem("foliomax_accessToken");

    if (!token) {
      toast.error("Please login first");
      localStorage.setItem("redirectAfterLogin", "/subscription");
      navigate("/login");
      return;
    }

    setShowPlans(true);
  };

  /* ===============================
     PAYMENT
  =============================== */
  const handlePayment = async () => {
    try {
      const token = sessionStorage.getItem("foliomax_accessToken");

      if (!token) {
        toast.error("Login required");
        navigate("/login");
        return;
      }

      if (!selectedPlan) {
        toast.error("Select a plan");
        return;
      }

      const res = await fetch(`${API_BASE}/foliomax/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          type: "subscription",
        }),
      });

      const order = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "FolioMax",
        description: selectedPlan.name,
        order_id: order.id,

        handler: async (response) => {
          const verifyRes = await fetch(
            `${API_BASE}/foliomax/payment/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            }
          );

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            toast.success("Subscription Activated 🎉");
            setIsSubscribed(true);
            setShowPlans(false);
          } else {
            toast.error("Payment failed");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch {
      toast.error("Payment error");
    }
  };

  /* ===============================
     VIEW PDF
  =============================== */
  const handleView = async (pdf) => {
    const token = sessionStorage.getItem("foliomax_accessToken");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/foliomax/public/pdf/protected/${pdf.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!data.ok) {
        toast.error(data.message || "Subscription required");
        return;
      }

      if (!data.url) {
        toast.error("PDF URL missing");
        return;
      }

      window.open(data.url, "_blank");

    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <section className="service-section">
      <div className="auto-container">
        <div className="row align-items-center">

          {loading && <p>Loading...</p>}

          {/* ================= PDF ================= */}
          {!loading &&
            pdfs.map((pdf) => (
              <div key={pdf.id} className="col-lg-4 col-md-6 col-sm-12 service-block">
                <div className="service-block-one">
                  <div className="inner-box fm-card">

                    <h6>
                      <span style={{
                        background: "#ff4d4f",
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}>
                        PDF
                      </span>

                      <span className="fm-badge">Premium</span>
                    </h6>

                    <h3>{pdf.title}</h3>

                    <p className="fm-subtext">
                      Premium insights designed for serious learners.
                    </p>

                    <p style={{ color: "#555", fontSize: "14px" }}>
                      Unlock this premium PDF and gain expert-level insights instantly.
                    </p>

                    <ul className="fm-points">
                      <li>✔ Expert curated content</li>
                      <li>✔ Lifetime learning value</li>
                      <li>✔ Instant access after purchase</li>
                    </ul>

                    <div className="btn-box mt-3">
                      {isSubscribed ? (
                        <button className="premium-btn" onClick={() => handleView(pdf)}>
                          View PDF
                        </button>
                      ) : (
                        <button className="premium-btn cta" onClick={handleSubscribeClick}>
                          🔒 Unlock Now
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            ))}

          {/* ================= EXCEL ================= */}
          {!loading &&
            excels.map((excel) => {
              const isPremium = excel.isPremium;

              return (
                <div key={excel.id} className="col-lg-4 col-md-6 col-sm-12 service-block">
                  <div className="service-block-one">
                    <div className="inner-box fm-card">

                      <h6>
                        <span style={{
                          background: "#1890ff",
                          color: "#fff",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "12px"
                        }}>
                          EXCEL
                        </span>

                        <span className="fm-badge">
                          {isPremium ? "Premium" : "Free"}
                        </span>
                      </h6>

                      <h3>{excel.name}</h3>

                       <p style={{ color: "#555", fontSize: "14px" }}>
                      Unlock this premium PDF and gain expert-level insights instantly.
                    </p>

                    <ul className="fm-points">
                      <li>✔ Expert curated content</li>
                      <li>✔ Lifetime learning value</li>
                      <li>✔ Instant access after purchase</li>
                    </ul>

                      <p className="fm-subtext">
                        {isPremium
                          ? "Premium Excel insights for advanced users."
                          : "Free Excel sheet available instantly."}
                      </p>

                      <div className="btn-box mt-3">
                        {!isPremium && (
                          <button
                            className="premium-btn"
                            onClick={() => window.open(excel.url, "_blank")}
                          >
                            View Excel
                          </button>
                        )}

                        {isPremium && (
                          isSubscribed ? (
                            <button
                              className="premium-btn"
                              onClick={() => handleViewExcel(excel)}
                            >
                              View Excel
                            </button>
                          ) : (
                            <button
                              className="premium-btn cta"
                              onClick={handleSubscribeClick}
                            >
                              🔒 Unlock Now
                            </button>
                          )
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}

        </div>
      </div>

     {showPlans && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.65)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "fadeIn 0.3s ease",
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "40px",
        borderRadius: "16px",
        width: "90%",
        maxWidth: "950px",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        animation: "scaleUp 0.3s ease",
      }}
    >
      {/* CLOSE */}
      <span
        onClick={() => setShowPlans(false)}
        style={{
          position: "absolute",
          top: "15px",
          right: "20px",
          cursor: "pointer",
          fontSize: "22px",
          fontWeight: "bold",
        }}
      >
        ✕
      </span>

      {/* TITLE */}
      <h2
        style={{
          textAlign: "center",
          marginBottom: "10px",
          fontWeight: "700",
        }}
      >
        Unlock All Premium PDFs
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#777",
          marginBottom: "30px",
        }}
      >
        Choose a plan and get unlimited access
      </p>

      {/* PLANS */}
      <div className="row">
        {plans.map((plan, index) => {
          const isActive = selectedPlan?.id === plan.id;
          const isPopular = index === 1; // middle plan

          return (
            <div key={plan.id} className="col-md-4">
              <div
                onClick={() => setSelectedPlan(plan)}
                style={{
                  border: isActive
                    ? "2px solid #324e31"
                    : "1px solid #e5e5e5",
                  borderRadius: "12px",
                  padding: "25px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "0.3s",
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                  boxShadow: isActive
                    ? "0 10px 30px rgba(0,0,0,0.1)"
                    : "none",
                  position: "relative",
                  background: "#fff",
                }}
              >
                {/* MOST POPULAR */}
                {isPopular && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#324e31",
                      color: "#fff",
                      padding: "4px 10px",
                      fontSize: "12px",
                      borderRadius: "20px",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <h4 style={{ marginBottom: "10px" }}>{plan.name}</h4>

                <h2 style={{ fontWeight: "700" }}>
                  ₹{plan.price}
                </h2>

                <p style={{ color: "#777" }}>
                  {plan.duration} months
                </p>

                {/* ACTIVE CHECK */}
                {isActive && (
                  <div
                    style={{
                      marginTop: "10px",
                      color: "#324e31",
                      fontWeight: "600",
                    }}
                  >
                    ✔ Selected
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* BUTTON */}
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <button
          className="premium-btn outline"
          onClick={handlePayment}
          style={{
            padding: "12px 30px",
            fontSize: "16px",
            borderRadius: "8px",
          }}
        >
          Continue Payment →
        </button>
      </div>
    </div>

    {/* ANIMATIONS */}
    <style>
      {`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
      `}
    </style>
  </div>
)}
    </section>
  );
}

export default Subscriptions;