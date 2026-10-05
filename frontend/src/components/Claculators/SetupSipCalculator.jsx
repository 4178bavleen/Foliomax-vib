import React, { useState, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SetupSipCalculator() {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [increase, setIncrease] = useState(10);

  const months = years * 12;
  const r = rate / 100 / 12;
  const inc = 1 + increase / 100;

  const { fv, invested, gains } = useMemo(() => {
    let bal = 0;
    let total = 0;
    let sip = monthly;

    for (let i = 1; i <= months; i++) {
      bal = bal * (1 + r) + sip;
      total += sip;
      if (i % 12 === 0) sip *= inc;
    }

    return { fv: bal, invested: total, gains: bal - total };
  }, [monthly, rate, years, increase]);

  const fmt = (n) =>
    "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const chartData = {
    labels: ["Invested amount", "Returns"],
    datasets: [
      {
        data: [invested, gains],
        backgroundColor: ["#e6f9f1", "#2563eb"],
        borderWidth: 0,
      },
    ],
  };

  const clamp = (value, min, max) => {
    const n = Number(value);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  };

  return (
    <div className="ss-container">
      <style>{`
:root{--muted:#6b7280;--bg:#fff;--card-border:#eef1f5;--accent:#059669;--success:#065f46}
*{box-sizing:border-box}
.ss-container{
  max-width:980px;
  margin:20px auto; padding:22px; border-radius:14px;
  background:var(--bg); border:1px solid var(--card-border);
  box-shadow:0 10px 30px rgba(2,6,23,0.04); font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto;
}

h3{margin-bottom:12px; font-size:18px; color:#0f172a}

/* GRID LAYOUT - right column is the chart */
.sl-grid{display:grid; grid-template-columns: 1fr minmax(260px,360px); gap:36px; align-items:start}

/* each row contains label / control area / value */
.sl-row{display:flex; align-items:center; gap:12px; margin-bottom:18px}
.sl-label{width:160px; flex-shrink:0; font-size:14px; color:#374151}

/* control area stretches and stacks cleanly */
.sl-controls{flex:1; display:flex; align-items:center; gap:12px}
.sl-range-wrap{flex:1; display:flex; align-items:center; gap:12px}
.ss-range{flex:1; -webkit-appearance:none; appearance:none; height:6px; background:#e6eef0; border-radius:6px}
.ss-range::-webkit-slider-thumb{ -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#0ea5a0; border:4px solid #fff; box-shadow:0 2px 6px rgba(14,165,160,0.25);}

.number-input{max-width:250px; padding:7px 14px; border-radius:8px; background:#ecfdf5; color:var(--success); border:1px solid rgba(6,95,70,0.20); font-weight:700; font-size:15px; text-align:center}

/* results */
.results{margin-top:6px}
.results .row{display:flex; justify-content:space-between; color:var(--muted); margin-top:8px}
.results .row.strong{color:#111827; font-weight:800; margin-top:10px}

.reset-btn{margin-top:14px; padding:10px 20px; background:var(--accent); color:#fff; border-radius:8px; border:none; font-weight:700; cursor:pointer}

/* CHART */
.sl-chart-wrap{display:flex; justify-content:center; padding-top:6px}
.chart-card{width:100%; max-width:320px}

/* RESPONSIVE RULES */
@media (max-width: 1024px){
  .sl-grid{grid-template-columns:1fr; gap:28px}
  .sl-label{width:140px}
}

@media (max-width: 768px){
  .sl-row{align-items:flex-start}
  .sl-label{width:120px}
  .number-input{max-width:180px}
}

@media (max-width:520px){
  .sl-row{flex-direction:column; align-items:stretch}
  .sl-label{width:100%; margin-bottom:6px}
  .sl-controls{flex-direction:column; align-items:stretch}
  .sl-range-wrap{width:100%}
  .number-input{max-width:140px; align-self:flex-end}
  .results .row{font-size:14px}
}

@media (max-width:380px){
  .chart-card{transform:scale(0.92); transform-origin:center top}
}

@media (max-width:330px){
  .chart-card{transform:scale(0.85)}
  .ss-container{padding:14px}
}

`}</style>

      <h3>Step-Up SIP Calculator</h3>

      <div style={{ color: "var(--muted)", marginBottom: 18 }}>
        Increase SIP amount yearly for higher returns.
      </div>

      <div className="sl-grid">
        {/* LEFT SIDE */}
        <div>
          {/* Monthly SIP */}
          <div className="sl-row">
            <div className="sl-label">Initial Monthly SIP</div>

            <div className="sl-controls">
              <div className="sl-range-wrap">
                <input
                  aria-label="Initial monthly SIP"
                  type="range"
                  className="ss-range"
                  min={500}
                  max={200000}
                  step={500}
                  value={monthly}
                  onChange={(e) => setMonthly(clamp(e.target.value, 500, 200000))}
                />
              </div>

              <input
                className="number-input"
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(clamp(e.target.value, 500, 200000))}
              />
            </div>
          </div>

          {/* Rate */}
          <div className="sl-row">
            <div className="sl-label">Expected Return (p.a)</div>

            <div className="sl-controls">
              <div className="sl-range-wrap">
                <input
                  aria-label="Expected return"
                  type="range"
                  className="ss-range"
                  min={1}
                  max={30}
                  value={rate}
                  onChange={(e) => setRate(clamp(e.target.value, 1, 30))}
                />
              </div>

              <input
                className="number-input"
                type="number"
                value={rate}
                onChange={(e) => setRate(clamp(e.target.value, 1, 30))}
              />
            </div>
          </div>

          {/* Years */}
          <div className="sl-row">
            <div className="sl-label">Time Period</div>

            <div className="sl-controls">
              <div className="sl-range-wrap">
                <input
                  aria-label="Time period"
                  type="range"
                  className="ss-range"
                  min={1}
                  max={40}
                  value={years}
                  onChange={(e) => setYears(clamp(e.target.value, 1, 40))}
                />
              </div>

              <input
                className="number-input"
                type="number"
                value={years}
                onChange={(e) => setYears(clamp(e.target.value, 1, 40))}
              />
            </div>
          </div>

          {/* Increase */}
          <div className="sl-row">
            <div className="sl-label">Annual Increase (%)</div>

            <div className="sl-controls">
              <div className="sl-range-wrap">
                <input
                  aria-label="Annual increase"
                  type="range"
                  className="ss-range"
                  min={0}
                  max={25}
                  value={increase}
                  onChange={(e) => setIncrease(clamp(e.target.value, 0, 25))}
                />
              </div>

              <input
                className="number-input"
                type="number"
                value={increase}
                onChange={(e) => setIncrease(clamp(e.target.value, 0, 25))}
              />
            </div>
          </div>

          {/* Results */}
          <div className="results">
            <div className="row"><div>Invested amount</div><div style={{ fontWeight: 700 }}>{fmt(invested)}</div></div>
            <div className="row"><div>Returns</div><div style={{ fontWeight: 700 }}>{fmt(gains)}</div></div>
            <div className="row strong"><div>Future value</div><div>{fmt(fv)}</div></div>

            <button
              className="reset-btn"
              onClick={() => {
                setMonthly(5000);
                setRate(12);
                setYears(10);
                setIncrease(10);
              }}
            >
              RESET
            </button>
          </div>
        </div>

        {/* RIGHT CHART */}
        <div className="sl-chart-wrap">
          <div className="chart-card">
            <Doughnut
              data={chartData}
              options={{ maintainAspectRatio: true, cutout: "70%" }}
            />
          </div>
        </div>
      </div>
{/* -------- About Step-Up SIP -------- */}
<section
  style={{
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid #eef1f5",
  }}
>
  <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
    What is Step-Up SIP?
  </h4>

  <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
    A Step-Up SIP is an advanced form of SIP where the investment amount increases
    periodically—usually every year—along with your income.
  </p>

  <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
    Instead of investing a fixed amount throughout, Step-Up SIP allows you to
    invest more over time, which can significantly boost long-term returns.
  </p>

  <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
    How this calculator works
  </h5>

  <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
    <li>
      <strong>Initial Monthly SIP:</strong> Starting amount invested every month.
    </li>
    <li>
      <strong>Expected Return (p.a.):</strong> Annual return assumed on investment.
    </li>
    <li>
      <strong>Time Period:</strong> Total investment duration in years.
    </li>
    <li>
      <strong>Annual Increase:</strong> Percentage by which SIP increases every year.
    </li>
  </ul>

  <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
    Why choose Step-Up SIP?
  </h5>

  <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
    <li>Aligns investments with salary growth</li>
    <li>Creates higher wealth without stress</li>
    <li>Ideal for long-term goals like retirement or child education</li>
  </ul>

  <p
    style={{
      marginTop: 12,
      color: "#6b7280",
      fontSize: 13,
      lineHeight: 1.6,
    }}
  >
    <strong>Note:</strong> Returns shown are estimates based on assumed rates.
    Actual market returns may vary. Mutual fund investments are subject to market risks.
  </p>
</section>


    </div>
  );
}
