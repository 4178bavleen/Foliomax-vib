import React, { useEffect, useState } from "react";
import "./Dashboard.css";

const API = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/* 🔥 PLAN MAPPING */
const PLAN_MAP = {
  1: "1 Month",
  2: "3 Months",
  3: "6 Months",
  4: "12 Months",
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [data, setData] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [summary, setSummary] = useState({
    totalCount: 0,
    totalSpent: 0,
    totalPages: 1,
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem("foliomax_accessToken");

  useEffect(() => {
    fetchProfile();
    fetchTransactions();
    fetchSubscription();
  }, [page]);

  /* ================= PROFILE ================= */
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/foliomax/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.ok) setUser(result.user);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= TRANSACTIONS ================= */
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/foliomax/user/transactions?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const result = await res.json();

      if (result.ok) {
        setData(result.transactions);
        setSummary({
          totalCount: result.totalCount,
          totalSpent: result.totalSpent,
          totalPages: result.totalPages,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUBSCRIPTION ================= */
  const fetchSubscription = async () => {
    try {
      const res = await fetch(`${API}/foliomax/payment/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.ok) setSubscription(data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= HELPERS ================= */
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

  const getRemainingDays = () => {
    if (!subscription?.expiry) return 0;

    const diff =
      new Date(subscription.expiry).getTime() - new Date().getTime();

    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const statusColor = (status) => {
    if (status === "SUCCESS") return "status success";
    if (status === "FAILED") return "status failed";
    return "status pending";
  };

  return (
    <div className="dash-container">

      {/* 🔥 GLOW BACKGROUND */}
      <div className="glow one" />
      <div className="glow two" />

      {/* ===== HEADER ===== */}
      <div className="dash-header">
        <h1>Welcome back, {user?.name || "Investor"}</h1>
        <p>Your premium financial dashboard</p>
      </div>

      {/* ===== SUMMARY ===== */}
      <div className="dash-summary">

        <div className="dash-card">
          <p>Total Transactions</p>
          <h3>{summary.totalCount}</h3>
        </div>

        <div className="dash-card">
          <p>Total Spent</p>
          <h3>₹ {summary.totalSpent}</h3>
        </div>

        <div className="dash-card">
          <p>Subscription</p>
          <h3 style={{ color: subscription?.active ? "#4ade80" : "#f87171" }}>
            {subscription?.active ? "Active" : "Inactive"}
          </h3>
        </div>

        <div className="dash-card">
          <p>Plan</p>
          <h3>{PLAN_MAP[subscription?.planId] || "N/A"}</h3>
        </div>

        <div className="dash-card">
          <p>Expiry</p>
          <h3>
            {subscription?.expiry
              ? formatDate(subscription.expiry)
              : "N/A"}
          </h3>
        </div>

      </div>

      {/* ===== PROGRESS ===== */}
      {subscription?.active && (
        <div className="dash-progress-card">
          <p>Subscription Remaining</p>
          <h2>{getRemainingDays()} Days Left</h2>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, (getRemainingDays() / 365) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="dash-table-wrapper">
        {loading ? (
          <div className="dash-loader">Loading transactions...</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Type</th>
                <th>Plan</th>
                <th>Paid At</th>
              </tr>
            </thead>

            <tbody>
              {data.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{tx.pdfTitle || tx.planName || "Premium Access"}</td>
                  <td>₹ {tx.amount}</td>

                  <td>
                    <span className={statusColor(tx.status)}>
                      {tx.status}
                    </span>
                  </td>

                  <td>{tx.method}</td>
                  <td>{tx.type || "PDF"}</td>
                  <td>{tx.planName || "-"}</td>
                  <td>{formatDate(tx.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      <div className="dash-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>

        <span>
          Page {page} / {summary.totalPages}
        </span>

        <button
          disabled={page === summary.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

    </div>
  );
};

export default Dashboard;