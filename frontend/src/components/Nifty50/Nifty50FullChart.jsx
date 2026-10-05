import React, { useEffect, useState } from "react";
import axios from "axios";
import "./nifty50FullChart.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function Nifty50FullChart() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchNifty();
    const interval = setInterval(fetchNifty, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNifty = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/popular-stock/nifty50`
      );
      setData(res.data.data);
    } catch (err) {
      console.error("NIFTY fetch failed", err);
    }
  };

  if (!data || !data.history?.length) return null;

  const isPositive = data.change >= 0;
  const max = Math.max(...data.history);
  const min = Math.min(...data.history);

  const points = data.history
    .map((p, i) => {
      const x = (i / (data.history.length - 1)) * 100;
      const y = 100 - ((p - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    
      <div className="auto-container">
        {/* Title */}
        <div className="sec-title">
          <h6>Market Overview</h6>
          <h2>NIFTY 50</h2>
        </div>

        {/* Card */}
        <div className="nifty-wrapper">
          {/* Header */}
          <div className="nifty-header">
            <div className="nifty-main-price">
              ₹{data.price.toLocaleString()}
            </div>

            <div className="nifty-meta">
              <span className={isPositive ? "up" : "down"}>
                {isPositive ? "▲" : "▼"} {data.change} ({data.changePercent}%)
              </span>
              <span className="duration">1D</span>
            </div>
          </div>

          {/* Chart */}
          <div className="nifty-chart-wrapper">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="nifty-chart"
            >
              <defs>
                <linearGradient id="niftyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPositive ? "#00b386" : "#ef4444"}
                    stopOpacity="0.35"
                  />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Line */}
              <polyline
                fill="none"
                stroke={isPositive ? "#00b386" : "#ef4444"}
                strokeWidth="2.2"
                points={points}
              />

              {/* Soft fill */}
              <polyline
                fill="url(#niftyGradient)"
                stroke="none"
                points={`0,100 ${points} 100,100`}
              />
            </svg>
          </div>
        </div>
      </div>
    
  );
}
