// ValuationCalculator.jsx (responsive version)
import React, { useMemo, useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ValuationCalculator({
  initialEps = 40,
  initialPe = 20,
  initialDivNext = 15,
  initialReqReturn = 12,
  initialGrowth = 6,
  initialCashflows = "1000,1100,1210,1331",
  initialDiscountRate = 10,
  initialTerminalGrowth = 3,
}) {
  // inputs
  const [eps, setEps] = useState(initialEps);
  const [pe, setPe] = useState(initialPe);

  const [divNext, setDivNext] = useState(initialDivNext);
  const [reqReturn, setReqReturn] = useState(initialReqReturn);
  const [growth, setGrowth] = useState(initialGrowth);

  const [cashflowText, setCashflowText] = useState(initialCashflows);
  const [discountRate, setDiscountRate] = useState(initialDiscountRate);
  const [terminalGrowth, setTerminalGrowth] = useState(initialTerminalGrowth);

  // sync props if parent changes
  useEffect(() => setEps(initialEps), [initialEps]);
  useEffect(() => setPe(initialPe), [initialPe]);
  useEffect(() => setDivNext(initialDivNext), [initialDivNext]);
  useEffect(() => setReqReturn(initialReqReturn), [initialReqReturn]);
  useEffect(() => setGrowth(initialGrowth), [initialGrowth]);
  useEffect(() => setCashflowText(initialCashflows), [initialCashflows]);
  useEffect(() => setDiscountRate(initialDiscountRate), [initialDiscountRate]);
  useEffect(() => setTerminalGrowth(initialTerminalGrowth), [initialTerminalGrowth]);

  // safe numeric helpers
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const clamp = (v, lo, hi) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return lo;
    return Math.max(lo, Math.min(hi, n));
  };

  /* ---------------- calculations ---------------- */
  // P/E valuation
  const pePrice = useMemo(() => {
    const e = toNum(eps);
    const p = toNum(pe);
    return e * p;
  }, [eps, pe]);

  // Gordon Growth (DDM)
  const gordonPrice = useMemo(() => {
    const d = toNum(divNext);
    const r = toNum(reqReturn) / 100;
    const g = toNum(growth) / 100;
    if (!Number.isFinite(r) || !Number.isFinite(g) || r <= g) return NaN;
    return d / (r - g);
  }, [divNext, reqReturn, growth]);

  // parse cashflows
  const cashflows = useMemo(
    () =>
      String(cashflowText || "")
        .split(",")
        .map((s) => Number(s.trim() || 0))
        .filter((n) => Number.isFinite(n)),
    [cashflowText]
  );

  // simple DCF with terminal
  const dcf = useMemo(() => {
    const r = toNum(discountRate) / 100;
    const g = toNum(terminalGrowth) / 100;
    let pv = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const cf = Number(cashflows[t] || 0);
      pv += cf / Math.pow(1 + r, t + 1);
    }
    const lastCF = Number(cashflows[cashflows.length - 1] || 0);
    let terminal = 0;
    if (lastCF > 0 && r > g) {
      terminal = (lastCF * (1 + g)) / (r - g);
      pv += terminal / Math.pow(1 + r, cashflows.length);
    }
    return { pv, terminal };
  }, [cashflows, discountRate, terminalGrowth]);

  // chart slices: normalize NaN -> 0
  const chartData = useMemo(() => {
    const a = Number.isFinite(pePrice) ? Math.max(0, pePrice) : 0;
    const b = Number.isFinite(gordonPrice) ? Math.max(0, gordonPrice) : 0;
    const c = Number.isFinite(dcf.pv) ? Math.max(0, dcf.pv) : 0;
    return {
      labels: ["P/E price", "Gordon (DDM)", "DCF (PV)"],
      datasets: [
        {
          data: [a, b, c],
          // changed Gordon color (middle) to a pleasant orange-ish tone (keeps variety)
          backgroundColor: ["#e6f9f1", "#fb923c", "#2563eb"],
          borderWidth: 0,
        },
      ],
    };
  }, [pePrice, gordonPrice, dcf.pv]);

  const fmt = (n, digits = 0) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: digits });

  /* Doughnut options - responsive friendly */
  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  /* ----------------- Render ----------------- */

  return (
    <div className="vc-outer">
      {/* component-scoped responsive CSS */}
      <style>{`
        :root{
          --vc-max-width: 980px;
          --vc-gap: 24px;
          --vc-panel-bg: #fff;
          --vc-border: 1px solid #eef1f5;
          --vc-shadow: 0 10px 30px rgba(2,6,23,0.04);
          --vc-label-w: 160px;
          --vc-accent: #0ea5a0;
          --vc-input-bg: #ecfdf5;
        }

        .vc-outer{
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          max-width: var(--vc-max-width);
          margin: 20px auto;
          padding: 22px;
          border-radius: 14px;
          background: var(--vc-panel-bg);
          border: var(--vc-border);
          box-shadow: var(--vc-shadow);
          color: #0f172a;
          box-sizing: border-box;
        }

        .vc-header { margin-bottom: 12px; }
        .vc-sub { color: #6b7280; margin-bottom: 18px; font-size: 14px; }

        .vc-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: var(--vc-gap);
          align-items: start;
        }

        /* rows */
        .vc-row {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 18px;
          min-width: 0;
        }

        .vc-label {
          width: var(--vc-label-w);
          color: #374151;
          font-size: 14px;
          flex: 0 0 var(--vc-label-w);
          box-sizing: border-box;
        }

        .vc-range {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 6px;
          background: #e6eef0;
          flex: 1 1 auto;
        }
        .vc-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--vc-accent); border: 4px solid white;
          box-shadow: 0 2px 6px rgba(14,165,160,0.25);
          margin-top: -6px; cursor: pointer;
        }
        .vc-range::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--vc-accent); border: 4px solid white;
          box-shadow: 0 2px 6px rgba(14,165,160,0.25);
          cursor: pointer;
        }

        .vc-input {
          min-width: 120px;
          padding: 7px 14px;
          border-radius: 8px;
          background: var(--vc-input-bg);
          color: #065f46;
          border: 1px solid rgba(6,95,70,0.20);
          font-weight: 700;
          font-size: 15px;
          text-align: center;
          outline: none;
          box-sizing: border-box;
        }

        .vc-input.small { min-width: 90px; }

        textarea.vc-textarea {
          width: 100%;
          margin-top: 8px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #e6eef0;
          font-family: inherit;
          box-sizing: border-box;
          resize: vertical;
        }

        .vc-results { margin-top: 10px; }

        .vc-legend {
          display:flex;
          gap:12px;
          align-items:center;
          justify-content:center;
          flex-wrap:wrap;
          margin-bottom:8px;
        }
        .vc-swatch { width:12px; height:12px; border-radius:3px; display:inline-block; }
        .vc-chart-wrap { display:flex; justify-content:center; align-items:flex-start; padding-top:6px; }
        .vc-chart {
          width: 320px;
          height: 320px;
          position: relative;
        }
        .vc-chart canvas { width:100% !important; height:100% !important; display:block; }

        /* ---------- Responsive breakpoints ---------- */

        /* Large tablets */
        @media (max-width: 1024px) {
          .vc-grid { grid-template-columns: 1fr 300px; gap:20px; }
          .vc-chart { width: 300px; height: 300px; }
        }

        /* Stack on narrower screens */
        @media (max-width: 768px) {
          .vc-grid { display: flex; flex-direction: column; gap:18px; }
          .vc-label { width: 140px; flex: 0 0 140px; }
          .vc-input { min-width: 100px; }
          .vc-chart { width: 280px; height: 280px; align-self: center; }
        }

        /* Small phones: labels above controls */
        @media (max-width: 480px) {
          .vc-row { flex-direction: column; align-items: stretch; }
          .vc-label { width: 100%; flex: none; margin-bottom: 8px; }
          .vc-range { margin-right: 0; width: 100%; }
          .vc-input { width: 100%; min-width: 0; margin-top: 8px; }
          .vc-chart { width: 100%; height: 320px; }
          .vc-outer { padding: 16px; }
        }

        /* Extra small */
        @media (max-width: 360px) {
          .vc-outer { padding: 12px; border-radius: 10px; }
          .vc-chart { height: 260px; }
          .vc-input { padding: 7px 10px; }
        }
      `}</style>

      <div className="vc-header">
        <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18 }}>Valuation toolkit</h3>
        <div className="vc-sub">Quick P/E, Gordon Growth (DDM) and a simple DCF comparison.</div>
      </div>

      <div className="vc-grid">
        <div style={{ minWidth: 0 }}>
          {/* EPS / P/E */}
          <div className="vc-row">
            <div className="vc-label">EPS (₹)</div>

            <input
              className="vc-range"
              type="range"
              min={-1000}
              max={10000}
              step={1}
              value={eps}
              onChange={(e) => setEps(clamp(e.target.value, -1000, 10000))}
            />

            <input
              type="number"
              value={eps}
              onChange={(e) => setEps(clamp(e.target.value, -1000, 10000))}
              className="vc-input"
            />
          </div>

          <div className="vc-row">
            <div className="vc-label">Target P/E</div>

            <input
              className="vc-range"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={pe}
              onChange={(e) => setPe(clamp(e.target.value, 0, 100))}
            />

            <input
              type="number"
              value={pe}
              onChange={(e) => setPe(clamp(e.target.value, 0, 100))}
              className="vc-input"
            />
          </div>

          {/* DDM inputs */}
          <div className="vc-row">
            <div className="vc-label">Div next year (₹)</div>

            <input
              className="vc-range"
              type="range"
              min={0}
              max={1000}
              step={1}
              value={divNext}
              onChange={(e) => setDivNext(clamp(e.target.value, 0, 1000))}
            />

            <input
              type="number"
              value={divNext}
              onChange={(e) => setDivNext(clamp(e.target.value, 0, 1000))}
              className="vc-input"
            />
          </div>

          <div className="vc-row">
            <div className="vc-label">Required return (%)</div>

            <input
              className="vc-range"
              type="range"
              min={0.1}
              max={50}
              step={0.1}
              value={reqReturn}
              onChange={(e) => setReqReturn(clamp(e.target.value, 0.1, 50))}
            />

            <input
              type="number"
              value={reqReturn}
              onChange={(e) => setReqReturn(clamp(e.target.value, 0.1, 50))}
              className="vc-input"
            />
          </div>

          <div className="vc-row">
            <div className="vc-label">Growth (%)</div>

            <input
              className="vc-range"
              type="range"
              min={-50}
              max={49.9}
              step={0.1}
              value={growth}
              onChange={(e) => setGrowth(clamp(e.target.value, -50, 49.9))}
            />

            <input
              type="number"
              value={growth}
              onChange={(e) => setGrowth(clamp(e.target.value, -50, 49.9))}
              className="vc-input"
            />
          </div>

          {/* DCF cashflows */}
          <div style={{ marginTop: 6 }}>
            <div style={{ color: "#374151", fontSize: 14 }}>Cashflows (comma separated)</div>

            <textarea
              value={cashflowText}
              onChange={(e) => setCashflowText(e.target.value)}
              rows={3}
              className="vc-textarea"
            />

            <div className="vc-row">
              <div className="vc-label">Discount rate (%)</div>

              <input
                className="vc-range"
                type="range"
                min={0.1}
                max={50}
                step={0.1}
                value={discountRate}
                onChange={(e) => setDiscountRate(clamp(e.target.value, 0.1, 50))}
              />

              <input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(clamp(e.target.value, 0.1, 50))}
                className="vc-input"
              />
            </div>

            <div className="vc-row">
              <div className="vc-label">Terminal growth (%)</div>

              <input
                className="vc-range"
                type="range"
                min={-50}
                max={49.9}
                step={0.1}
                value={terminalGrowth}
                onChange={(e) => setTerminalGrowth(clamp(e.target.value, -50, 49.9))}
              />

              <input
                type="number"
                value={terminalGrowth}
                onChange={(e) => setTerminalGrowth(clamp(e.target.value, -50, 49.9))}
                className="vc-input"
              />
            </div>
          </div>

          {/* Results */}
          <div className="vc-results">
            <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
              <div>P/E fair price</div>
              <div style={{ fontWeight: 700 }}>{fmt(pePrice)}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", marginTop: 8 }}>
              <div>Gordon (DDM)</div>
              <div style={{ fontWeight: 700 }}>
                {Number.isFinite(gordonPrice) ? fmt(gordonPrice) : "Invalid (r ≤ g)"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "#111827", fontWeight: 800, marginTop: 10 }}>
              <div>DCF (PV)</div>
              <div>{fmt(dcf.pv)}</div>
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                style={{
                  padding: "10px 20px",
                  background: "#059669",
                  color: "#fff",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setEps(initialEps);
                  setPe(initialPe);
                  setDivNext(initialDivNext);
                  setReqReturn(initialReqReturn);
                  setGrowth(initialGrowth);
                  setCashflowText(initialCashflows);
                  setDiscountRate(initialDiscountRate);
                  setTerminalGrowth(initialTerminalGrowth);
                }}
              >
                RESET
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: chart */}
        <div className="vc-chart-wrap" aria-hidden={false}>
          <div className="vc-chart" role="img" aria-label="Valuation comparison chart">
            <div className="vc-legend" aria-hidden>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="vc-swatch" style={{ background: "#e6f9f1" }} />
                <div style={{ color: "#6b7280", fontSize: 13 }}>P/E</div>

                <div className="vc-swatch" style={{ background: "#fb923c", marginLeft: 12 }} />
                <div style={{ color: "#6b7280", fontSize: 13 }}>Gordon</div>

                <div className="vc-swatch" style={{ background: "#2563eb", marginLeft: 12 }} />
                <div style={{ color: "#6b7280", fontSize: 13 }}>DCF</div>
              </div>
            </div>

            <Doughnut data={chartData} options={doughnutOptions} />
          </div>
        </div>
      </div>
      {/* -------- About Valuation Methods -------- */}
<section
  style={{
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid #eef1f5",
  }}
>
  <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
    What is Stock Valuation?
  </h4>

  <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
    Stock valuation is the process of estimating the <strong>intrinsic (fair) value</strong> 
    of a company based on its fundamentals, earnings, cash flows, and growth potential.
  </p>

  <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
    This valuation toolkit compares multiple commonly used valuation methods to help
    investors make informed decisions.
  </p>

  <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
    Valuation methods used
  </h5>

  <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
    <li>
      <strong>P/E Valuation:</strong> Estimates price using Earnings Per Share (EPS) 
      multiplied by a target P/E multiple.
    </li>
    <li>
      <strong>Gordon Growth Model (DDM):</strong> Values a stock based on expected dividends
      growing at a constant rate.
    </li>
    <li>
      <strong>Discounted Cash Flow (DCF):</strong> Calculates present value of future cash
      flows discounted to today.
    </li>
  </ul>

  <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
    Why use multiple valuation models?
  </h5>

  <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
    <li>No single model gives a perfect valuation</li>
    <li>Different models suit different types of companies</li>
    <li>Helps identify under-valued or over-valued stocks</li>
    <li>Improves confidence in long-term investment decisions</li>
  </ul>

  <p
    style={{
      marginTop: 12,
      color: "#6b7280",
      fontSize: 13,
      lineHeight: 1.6,
    }}
  >
    <strong>Important:</strong> If the required return is less than or equal to the growth
    rate, Gordon valuation becomes invalid (r ≤ g).
  </p>

  <p
    style={{
      marginTop: 8,
      color: "#6b7280",
      fontSize: 13,
      lineHeight: 1.6,
    }}
  >
    <strong>Disclaimer:</strong> Valuations are estimates based on assumptions. Market prices
    may differ due to sentiment, risk, and external factors.
  </p>
</section>

    </div>
  );
}
