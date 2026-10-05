// SipLumpsumCalculator.responsive.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SipLumpsumCalculator({ initialMode = "sip" }) {
  const [mode, setMode] = useState(initialMode);
  const [amount, setAmount] = useState(1000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  useEffect(() => {
    if (initialMode === "sip" || initialMode === "lumpsum") {
      setMode(initialMode);
    }
  }, [initialMode]);

  const safeAmount = Number(amount) || 0;
  const safeRate = Number(rate) || 0;
  const safeYears = Number(years) || 0;

  const clamp = (v, lo, hi) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return lo;
    return Math.max(lo, Math.min(hi, n));
  };

  const investedAmount = useMemo(() => {
    return mode === "sip"
      ? safeAmount * 12 * safeYears
      : safeAmount;
  }, [safeAmount, safeYears, mode]);

  const futureValue = useMemo(() => {
    const r = safeRate / 100 / 12;
    const n = safeYears * 12;

    if (mode === "sip") {
      if (r === 0) return safeAmount * n;
      return safeAmount * ((Math.pow(1 + r, n) - 1) / r);
    } else {
      return safeAmount * Math.pow(1 + r, n);
    }
  }, [safeAmount, safeRate, safeYears, mode]);

  const returnsAmount = Math.max(0, futureValue - investedAmount);

  const fmt = (n) =>
    "₹" +
    Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const chartData = {
    labels: ["Invested amount", "Est. returns"],
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
    <div className="sl-outer">
      <style>{`
        :root{
          --sl-max-w: 980px;
          --sl-gap: 28px;
          --sl-card-bg: #fff;
          --sl-border: 1px solid #eef1f5;
          --sl-shadow: 0 10px 30px rgba(2,6,23,0.04);
          --sl-label-w: 160px;
          --sl-accent: #0ea5a0;
          --sl-input-bg: #ecfdf5;
        }

        .sl-outer{
          max-width: var(--sl-max-w);
          margin: 20px auto;
          padding: 20px;
          border-radius: 14px;
          background: var(--sl-card-bg);
          border: var(--sl-border);
          box-shadow: var(--sl-shadow);
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
          color: #0f172a;
          box-sizing: border-box;
        }

        .sl-tabs { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
        .sl-tab {
          padding: 8px 18px;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          cursor: pointer;
        }
        .sl-tab--active { background:#e9fff4; color:#059669; }
        .sl-tab--inactive { color:#6b7280; background:transparent; }

        .sl-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: var(--sl-gap);
          align-items: start;
        }

        .sl-left { min-width: 0; }
        .sl-row {
          display:flex;
          gap:16px;
          align-items:center;
          margin-bottom:18px;
          min-width:0;
        }

        .sl-label {
          width: var(--sl-label-w);
          color:#374151;
          font-size:14px;
          flex:0 0 var(--sl-label-w);
          box-sizing:border-box;
        }

        .ss-range {
          -webkit-appearance: none;
          appearance: none;
          height:6px;
          border-radius:6px;
          background:#e6eef0;
          flex:1 1 auto;
        }
        .ss-range::-webkit-slider-thumb {
          -webkit-appearance:none;
          width:18px;height:18px;border-radius:50%;
          background:var(--sl-accent); border:4px solid white;
          box-shadow:0 2px 6px rgba(14,165,160,0.25); margin-top:-6px; cursor:pointer;
        }
        .ss-range::-moz-range-thumb {
          width:18px;height:18px;border-radius:50%;
          background:var(--sl-accent); border:4px solid white;
          box-shadow:0 2px 6px rgba(14,165,160,0.25); cursor:pointer;
        }

        .sl-input {
          min-width:120px;
          padding:7px 14px;
          border-radius:8px;
          background:var(--sl-input-bg);
          color:#065f46;
          border:1px solid rgba(6,95,70,0.20);
          font-weight:700;
          font-size:15px;
          text-align:center;
          outline:none;
          box-sizing:border-box;
        }

        .sl-input.small { min-width:90px; }

        .sl-results { margin-top:10px; }

        .sl-row-results { display:flex; justify-content:space-between; color:#6b7280; margin-top:8px; }
        .sl-row-results strong { font-weight:700; color:#111827; }

        .sl-chart-wrap {
          width:100%;
          display:flex;
          justify-content:center;
          padding-top:6px;
        }
        .sl-chart {
          width:320px;
          height:320px;
          position:relative;
        }
        .sl-chart canvas { width:100% !important; height:100% !important; display:block; }

        /* Responsive breakpoints */
        @media (max-width: 1024px) {
          .sl-grid { grid-template-columns: 1fr 300px; gap:20px; }
          .sl-chart { width:300px; height:300px; }
        }

        @media (max-width: 768px) {
          .sl-grid { display:flex; flex-direction:column; gap:18px; }
          .sl-label { width:140px; flex:0 0 140px; }
          .sl-input { min-width:100px; }
          .sl-chart { width:280px; height:280px; align-self:center; }
        }

        /* On small phones stack inputs and make inputs full width; chart becomes full-width */
        @media (max-width: 480px) {
          .sl-row { flex-direction:column; align-items:stretch; }
          .sl-label { width:100%; flex:none; margin-bottom:8px; }
          .ss-range { margin-right:0; width:100%; }
          .sl-input { width:100%; min-width:0; margin-top:8px; }
          .sl-chart { width:100%; height:320px; }
        }

        /* Extra small phones */
        @media (max-width:360px) {
          .sl-outer { padding:14px; }
          .sl-chart { height:260px; }
          .sl-input { padding:7px 10px; font-size:14px; }
          .sl-tab { padding:6px 14px; font-size:14px; }
        }

        /* Make chart responsive when maintainAspectRatio:false wasn't used */
        @media (prefers-reduced-motion: reduce) {
          .sl-chart { transition: none; }
        }
      `}</style>

      <div className="sl-tabs" role="tablist" aria-label="Mode tabs">
        <button
          role="tab"
          aria-pressed={mode === "sip"}
          className={`sl-tab ${mode === "sip" ? "sl-tab--active" : "sl-tab--inactive"}`}
          onClick={() => setMode("sip")}
        >
          SIP
        </button>

        <button
          role="tab"
          aria-pressed={mode === "lumpsum"}
          className={`sl-tab ${mode === "lumpsum" ? "sl-tab--active" : "sl-tab--inactive"}`}
          onClick={() => setMode("lumpsum")}
        >
          Lumpsum
        </button>
      </div>

      <div className="sl-grid">
        <div className="sl-left">
          {/* AMOUNT */}
          <div className="sl-row">
            <label className="sl-label" htmlFor="sl-amount">
              {mode === "sip" ? "Monthly investment" : "Initial investment"}
            </label>

            <input
              id="sl-amount"
              className="ss-range"
              type="range"
              min={mode === "sip" ? 500 : 1000}
              max={mode === "sip" ? 200000 : 5000000}
              step={mode === "sip" ? 500 : 1000}
              value={amount}
              onChange={(e) =>
                setAmount(
                  clamp(
                    e.target.value,
                    mode === "sip" ? 500 : 1000,
                    mode === "sip" ? 200000 : 5000000
                  )
                )
              }
              aria-label={mode === "sip" ? "Monthly investment" : "Initial investment"}
            />

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="sl-input"
              aria-label="Amount number"
            />
          </div>

          {/* RATE */}
          <div className="sl-row">
            <label className="sl-label" htmlFor="sl-rate">Expected return (p.a)</label>

            <input
              id="sl-rate"
              className="ss-range"
              type="range"
              min={0}
              max={30}
              step={0.25}
              value={rate}
              onChange={(e) => setRate(clamp(e.target.value, 0, 30))}
              aria-label="Expected return"
            />

            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value) || 0)}
              className="sl-input"
              aria-label="Rate number"
            />
          </div>

          {/* YEARS */}
          <div className="sl-row">
            <label className="sl-label" htmlFor="sl-years">Time period</label>

            <input
              id="sl-years"
              className="ss-range"
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
              value={years}
              onChange={(e) => setYears(Number(e.target.value) || 1)}
              className="sl-input small"
              aria-label="Years number"
            />
          </div>

          {/* RESULTS */}
          <div className="sl-results" role="status" aria-live="polite">
            <div className="sl-row-results" aria-hidden={false}>
              <div>Invested amount</div>
              <div><strong>{fmt(investedAmount)}</strong></div>
            </div>

            <div className="sl-row-results" aria-hidden={false} style={{ marginTop: 8 }}>
              <div>Est. returns</div>
              <div><strong>{fmt(returnsAmount)}</strong></div>
            </div>

            <div className="sl-row-results" style={{ marginTop: 10, color: "#111827" }}>
              <div>Total value</div>
              <div><strong>{fmt(futureValue)}</strong></div>
            </div>

            <button
              style={{
                marginTop: 14,
                padding: "10px 20px",
                background: "#059669",
                color: "#fff",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
              }}
              aria-label="Invest now"
            >
              INVEST NOW
            </button>
          </div>
        </div>

        {/* RIGHT: Chart */}
        <div className="sl-chart-wrap" aria-hidden={false}>
          <div style={{ width: 320, maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 12, height: 12, background: "#e6f9f1", borderRadius: 3 }} />
                <div style={{ color: "#6b7280", fontSize: 13 }}>Invested amount</div>

                <div style={{ width: 12, height: 12, background: "#2563eb", borderRadius: 3, marginLeft: 12 }} />
                <div style={{ color: "#6b7280", fontSize: 13 }}>Est. returns</div>
              </div>
            </div>

            <div className="sl-chart" role="img" aria-label="Invested vs returns chart">
              <Doughnut data={chartData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>
{/* -------- About SIP / Lumpsum -------- */}
<section
  style={{
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid #eef1f5",
  }}
>
  {mode === "sip" ? (
    <>
      <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
        What is SIP?
      </h4>

      <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
        SIP (Systematic Investment Plan) is a method of investing a fixed amount
        regularly—usually monthly—into mutual funds or other investment options.
      </p>

      <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
        SIP helps investors benefit from <strong>rupee cost averaging</strong> and
        <strong> compounding</strong> over the long term, while reducing the impact
        of market volatility.
      </p>

      <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
        Why choose SIP?
      </h5>

      <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
        <li>Encourages disciplined investing</li>
        <li>Lower risk due to regular investments</li>
        <li>Ideal for long-term goals like retirement or wealth creation</li>
      </ul>
    </>
  ) : (
    <>
      <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
        What is Lumpsum Investment?
      </h4>

      <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
        A lumpsum investment means investing a large amount of money at once,
        instead of spreading it over time.
      </p>

      <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
        Lumpsum investments are suitable when you have surplus funds and believe
        markets are reasonably valued for long-term growth.
      </p>

      <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
        When is lumpsum suitable?
      </h5>

      <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
        <li>When you receive a bonus, inheritance, or one-time income</li>
        <li>For long-term investments in stable market conditions</li>
        <li>When you can stay invested despite short-term volatility</li>
      </ul>
    </>
  )}

  <p
    style={{
      marginTop: 12,
      color: "#6b7280",
      fontSize: 13,
      lineHeight: 1.6,
    }}
  >
    <strong>Note:</strong> Returns shown are estimates based on assumed rates and
    do not guarantee future performance. Market investments are subject to risk.
  </p>
</section>


    </div>
  );
}
