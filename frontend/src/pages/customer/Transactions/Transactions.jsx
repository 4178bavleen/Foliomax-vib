import React, { useEffect, useState } from "react";
import "./Transaction.css";
const API = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const Transaction = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalSpent: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem("foliomax_accessToken");

  useEffect(() => {
    fetchTransactions();
  }, [page]);

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
      console.error("Transaction fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

  const statusColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "status success";
      case "FAILED":
        return "status failed";
      case "CREATED":
        return "status pending";
      default:
        return "status";
    }
  };

  return (
    <div className="tx-container">
      <h2 className="tx-title">Transaction History</h2>

      {/* Summary Cards */}
      <div className="tx-summary">
        <div className="tx-card">
          <p>Total Transactions</p>
          <h3>{summary.totalCount}</h3>
        </div>

        <div className="tx-card">
          <p>Total Spent</p>
          <h3>₹ {summary.totalSpent}</h3>
        </div>
      </div>

      {/* Table */}
      <div className="tx-table-wrapper">
        {loading ? (
          <div className="tx-loading">Loading transactions...</div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Paid At</th>
                <th>Order ID</th>
              </tr>
            </thead>
            <tbody>
              {data.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td>{tx.pdfTitle}</td>
                  <td className="amount">
                    ₹ {tx.amount} {tx.currency}
                  </td>
                  <td>
                    <span className={statusColor(tx.status)}>
                      {tx.status}
                    </span>
                  </td>
                  <td>
                    <span className="method">{tx.method}</span>
                  </td>
                  <td>{formatDate(tx.paidAt)}</td>
                  <td className="order-id">{tx.razorpayOrderId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="tx-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {summary.totalPages}
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

export default Transaction;