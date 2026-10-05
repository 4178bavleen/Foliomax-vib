// src/components/PopularStocks/StockTickerCard.jsx
import React from "react";
import Sparkline from "./SparkLine";

export default function StockTickerCard({ stock }) {
  const isPositive = stock.change >= 0;

  return (
    <div className="ticker-card">
      <div className="ticker-header">
        <h5>{stock.name}</h5>
        <span className="exchange">NSE</span>
      </div>

      <div className="ticker-price">
        <h3>₹{stock.price.toLocaleString()}</h3>
        <span className={isPositive ? "positive" : "negative"}>
          {isPositive ? "+" : ""}
          {stock.changePercent}%
        </span>
      </div>

      {/* Sparkline */}
      <Sparkline
        data={stock.history || []}
        isPositive={isPositive}
      />

      {/* Range Bar */}
      <div className="range-bar">
        <span
          className={isPositive ? "range-positive" : "range-negative"}
          style={{ width: `${stock.rangePercent || 50}%` }}
        />
      </div>

      <div className="ticker-footer">
        {stock.symbol}
      </div>
    </div>
  );
}
