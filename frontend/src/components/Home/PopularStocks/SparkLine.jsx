// src/components/PopularStocks/Sparkline.jsx
import React from "react";

export default function Sparkline({ data, isPositive }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="sparkline">
      <polyline
        fill="none"
        stroke={isPositive ? "#22c55e" : "#ef4444"}
        strokeWidth="3"
        points={points}
      />
    </svg>
  );
}
