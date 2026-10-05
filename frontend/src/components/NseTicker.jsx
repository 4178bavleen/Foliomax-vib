import React, { useEffect, useState } from "react";
import "./ticker.css";

// Vite-safe API base
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function NseTicker() {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 90000); // refresh every 90s
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/market/nse-ticker`
      );
      const data = await res.json();
      setStocks(data);
    } catch (err) {
      console.error("Failed to fetch ticker data", err);
    }
  };

  if (!stocks.length) return null;

  return (
    <div className="tv-ticker-wrapper">
      <div className="tv-ticker">
        {[...stocks, ...stocks].map((s, i) => {
          const up = s.changePercent >= 0;

          return (
            <div className="tv-item" key={i}>
              <span className="tv-symbol">{s.symbol}</span>

              <span className="tv-price">
                ₹{s.price.toFixed(2)}
              </span>

              <span className={up ? "tv-up" : "tv-down"}>
                {up ? "▲" : "▼"} {Math.abs(s.changePercent).toFixed(2)}%
              </span>

              <span className="tv-separator">|</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
