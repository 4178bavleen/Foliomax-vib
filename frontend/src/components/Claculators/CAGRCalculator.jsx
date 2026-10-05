// CAGRCalculator.responsive.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CAGRCalculator({
  initialPV = 10000,
  initialFV = 20000,
  initialYears = 5,
}) {
  const [pv, setPv] = useState(initialPV);
  const [fv, setFv] = useState(initialFV);
  const [years, setYears] = useState(initialYears);

  useEffect(() => setPv(initialPV), [initialPV]);
  useEffect(() => setFv(initialFV), [initialFV]);
  useEffect(() => setYears(initialYears), [initialYears]);

  const safePv = Number(pv) || 0;
  const safeFv = Number(fv) || 0;
  const safeYears = Number(years) || 0;

  const clamp = (v, lo, hi) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return lo;
    return Math.max(lo, Math.min(hi, n));
  };

  const cagr = useMemo(() => {
    if (safePv <= 0 || safeFv <= 0 || safeYears <= 0) return 0;
    return Math.pow(safeFv / safePv, 1 / safeYears) - 1;
  }, [safePv, safeFv, safeYears]);

  const investedAmount = safePv;
  const returnsAmount = Math.max(0, safeFv - safePv);

  const fmt = (num) =>
    "₹" + Number(num || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const chartData = {
    labels: ["Invested amount", "Returns"],
    datasets: [
      {
        data: [investedAmount, returnsAmount],
        backgroundColor: ["#e6f9f1", "#2563eb"],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="cagr-outer">
      {/* Component-scoped responsive CSS */}
      <style>{`
        :root{
          --cagr-max-w: 980px;
          --cagr-gap: 28px;
          --cagr-panel-bg: #fff;
          --cagr-border: 1px solid #eef1f5;
          --cagr-shadow: 0 10px 30px rgba(2,6,23,0.04);
          --cagr-label-w: 160px;
          --cagr-accent: #0ea5a0;
          --cagr-input-bg: #ecfdf5;
        }

        .cagr-outer{
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          max-width: var(--cagr-max-w);
          margin: 20px auto;
          padding: 20px;
          border-radius: 14px;
          background: var(--cagr-panel-bg);
          border: var(--cagr-border);
          box-shadow: var(--cagr-shadow);
          color: #0f172a;
          box-sizing: border-box;
        }

        .cagr-header { margin-bottom: 12px; }
        .cagr-title { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
        .cagr-sub { margin: 8px 0 0; color: #6b7280; font-size: 14px; }

        .cagr-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: var(--cagr-gap);
          align-items: start;
          min-width: 0;
        }

        .cagr-panel { min-width: 0; }

        .cagr-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          min-width: 0;
        }

        .cagr-label {
          width: var(--cagr-label-w);
          color: #374151;
          font-size: 14px;
          flex: 0 0 var(--cagr-label-w);
          box-sizing: border-box;
        }

        .cagr-range {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 6px;
          background: #e6eef0;
          flex: 1 1 auto;
          margin-right: 8px;
        }

        .cagr-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--cagr-accent);
          border: 4px solid white;
          box-shadow: 0 2px 6px rgba(14,165,160,0.25);
          margin-top: -6px;
          cursor: pointer;
        }
        .cagr-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--cagr-accent);
          border: 4px solid white;
          box-shadow: 0 2px 6px rgba(14,165,160,0.25);
          cursor: pointer;
        }

        .cagr-number {
          min-width: 120px;
          padding: 7px 14px;
          border-radius: 8px;
          background: var(--cagr-input-bg);
          color: #065f46;
          border: 1px solid rgba(6,95,70,0.20);
          font-weight: 700;
          font-size: 15px;
          text-align: center;
          outline: none;
          box-sizing: border-box;
        }
        .cagr-number.small { min-width: 90px; }

        .cagr-results { margin-top: 6px; }
        .result-row {
          display: flex;
          justify-content: space-between;
          color: #6b7280;
          margin-top: 8px;
        }
        .result-row:first-child { margin-top: 0; }

        .result-value { font-weight: 700; color: #111827; }

        .result-row.highlight {
          margin-top: 10px;
          font-weight: 800;
          color: #111827;
        }

        .cagr-reset {
          margin-top: 14px;
          padding: 10px 20px;
          background: #059669;
          color: #fff;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          cursor: pointer;
        }

        .cagr-chart-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .chart-legend { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: center; }
        .legend-swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
        .swatch-invest { background: #e6f9f1; }
        .swatch-return { background: #2563eb; }
        .legend-text { color: #6b7280; font-size: 13px; margin-right: 8px; }

        .cagr-chart {
          width: 320px;
          height: 320px; /* Doughnut uses container size when maintainAspectRatio:false */
          position: relative;
        }
        .cagr-chart canvas { width: 100% !important; height: 100% !important; display: block; }

        /* --------- Responsive --------- */

        @media (max-width: 1024px) {
          .cagr-grid {
            grid-template-columns: 1fr 300px;
            gap: 20px;
          }
          .cagr-chart { width: 300px; height: 300px; }
        }

        @media (max-width: 768px) {
          .cagr-grid {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .cagr-row {
            align-items: center;
          }

          .cagr-label {
            width: 140px;
            flex: 0 0 140px;
          }

          .cagr-number { min-width: 100px; }

          .cagr-chart { width: 280px; height: 280px; align-self: center; }
        }

        @media (max-width: 600px) {
          .cagr-outer { padding: 16px; }
          .cagr-label { width: 120px; flex: 0 0 120px; font-size: 13px; }
          .cagr-number { min-width: 90px; padding: 8px 12px; font-size: 14px; }
          .cagr-range { height: 6px; }
          .cagr-chart { width: 240px; height: 240px; }
        }

        @media (max-width: 480px) {
          .cagr-row {
            flex-direction: column;
            align-items: stretch;
          }

          .cagr-label {
            width: 100%;
            flex: none;
            margin-bottom: 8px;
          }

          .cagr-range { margin-right: 0; width: 100%; }
          .cagr-number { width: 100%; min-width: 0; margin-top: 8px; }
          .cagr-chart { width: 100%; height: 320px; }
        }

        @media (max-width: 360px) {
          .cagr-outer { padding: 12px; border-radius: 10px; }
          .cagr-chart { height: 260px; }
          .cagr-number { padding: 7px 10px; }
          .cagr-reset { padding: 10px 14px; }
        }
      `}</style>

      <header className="cagr-header">
        <h3 className="cagr-title">CAGR calculator</h3>
        <p className="cagr-sub">Calculate the compound annual growth rate between two values.</p>
      </header>

      <div className="cagr-grid">
        <div className="cagr-panel" aria-live="polite">
          {/* PV Row */}
          <div className="cagr-row">
            <label className="cagr-label" htmlFor="pv-range">Initial value (PV)</label>

            <input
              id="pv-range"
              className="cagr-range"
              type="range"
              min={100}
              max={5000000}
              step={100}
              value={pv}
              onChange={(e) => setPv(clamp(e.target.value, 100, 5000000))}
              aria-label="Initial value"
            />

            <input
              type="number"
              className="cagr-number"
              value={pv}
              onChange={(e) => setPv(clamp(e.target.value, 100, 5000000))}
              aria-label="Initial value number"
            />
          </div>

          {/* FV Row */}
          <div className="cagr-row">
            <label className="cagr-label" htmlFor="fv-range">Final value (FV)</label>

            <input
              id="fv-range"
              className="cagr-range"
              type="range"
              min={100}
              max={10000000}
              step={100}
              value={fv}
              onChange={(e) => setFv(clamp(e.target.value, 100, 10000000))}
              aria-label="Final value"
            />

            <input
              type="number"
              className="cagr-number"
              value={fv}
              onChange={(e) => setFv(clamp(e.target.value, 100, 10000000))}
              aria-label="Final value number"
            />
          </div>

          {/* Years Row */}
          <div className="cagr-row">
            <label className="cagr-label" htmlFor="years-range">Time period</label>

            <input
              id="years-range"
              className="cagr-range"
              type="range"
              min={1}
              max={50}
              step={1}
              value={years}
              onChange={(e) => setYears(clamp(e.target.value, 1, 50))}
              aria-label="Time period in years"
            />

            <input
              type="number"
              className="cagr-number small"
              value={years}
              onChange={(e) => setYears(clamp(e.target.value, 1, 50))}
              aria-label="Time period number"
            />
          </div>

          {/* Results */}
          <div className="cagr-results">
            <div className="result-row">
              <div>Invested amount</div>
              <div className="result-value">{fmt(investedAmount)}</div>
            </div>

            <div className="result-row">
              <div>Returns</div>
              <div className="result-value">{fmt(returnsAmount)}</div>
            </div>

            <div className="result-row highlight">
              <div>CAGR (p.a.)</div>
              <div className="result-value">{(cagr * 100).toFixed(2)}%</div>
            </div>

            <button
              className="cagr-reset"
              onClick={() => {
                setPv(10000);
                setFv(20000);
                setYears(5);
              }}
            >
              RESET
            </button>
          </div>
        </div>

        <aside className="cagr-chart-wrap" aria-hidden={false}>
          <div className="chart-legend" aria-hidden>
            <span className="legend-swatch swatch-invest" />
            <span className="legend-text">Invested amount</span>

            <span className="legend-swatch swatch-return" />
            <span className="legend-text">Returns</span>
          </div>

          <div className="cagr-chart" role="img" aria-label="Invested amount vs returns chart">
            <Doughnut data={chartData} options={doughnutOptions} />
          </div>
        </aside>

        {/* -------- About CAGR -------- */}
<section
  style={{
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid #eef1f5",
  }}
>
  <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
    What is CAGR?
  </h4>

  <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
    CAGR (Compound Annual Growth Rate) shows the average yearly growth rate of an
    investment over a specific period, assuming the investment grows at a
    constant rate every year.
  </p>

  <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
    It helps investors compare different investments over time, even if their
    returns were uneven year-to-year.
  </p>

  <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
    How to read this calculator
  </h5>

  <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
    <li>
      <strong>Initial Value (PV):</strong> Amount you invested initially.
    </li>
    <li>
      <strong>Final Value (FV):</strong> Value of the investment after the time
      period.
    </li>
    <li>
      <strong>Time Period:</strong> Number of years the investment was held.
    </li>
    <li>
      <strong>CAGR (p.a.):</strong> Average annual growth rate of your investment.
    </li>
  </ul>

  <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
    Important note
  </h5>

  <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
    CAGR does not reflect market volatility or interim ups and downs. It is best
    used for long-term comparison between investments like mutual funds, stocks,
    or portfolios.
  </p>
</section>


      </div>
    </div>
  );
}
