// LoanEMICalculator.responsive.fixed.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function LoanEMICalculator({
  initialPrincipal = 500000,
  initialRate = 9,
  initialYears = 10,
}) {
  const [principal, setPrincipal] = useState(initialPrincipal);
  const [annualRate, setAnnualRate] = useState(initialRate);
  const [years, setYears] = useState(initialYears);

  useEffect(() => setPrincipal(initialPrincipal), [initialPrincipal]);
  useEffect(() => setAnnualRate(initialRate), [initialRate]);
  useEffect(() => setYears(initialYears), [initialYears]);

  const safePrincipal = Number.isFinite(Number(principal)) ? Number(principal) : 0;
  const safeRate = Number.isFinite(Number(annualRate)) ? Number(annualRate) : 0;
  const safeYears = Number.isFinite(Number(years)) ? Number(years) : 0;

  const clamp = (v, lo, hi) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return lo;
    return Math.max(lo, Math.min(hi, n));
  };

  // EMI calculations
  const months = Math.max(1, Math.round(safeYears * 12));
  const monthlyRate = safeRate / 100 / 12;

  const { emi, totalPayment, totalInterest, schedule } = useMemo(() => {
    const P = safePrincipal;
    const r = monthlyRate;
    const n = months;

    if (n <= 0) return { emi: 0, totalPayment: 0, totalInterest: 0, schedule: [] };

    if (r === 0) {
      const emi0 = P / n;
      const schedule0 = Array.from({ length: n }, (_, i) => {
        const principalPaid = emi0;
        const interest = 0;
        const balance = Math.max(0, P - emi0 * (i + 1));
        return { month: i + 1, interest, principalPaid, balance };
      });
      return { emi: emi0, totalPayment: P, totalInterest: 0, schedule: schedule0 };
    }

    const emiCalc = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let balance = P;
    const sch = [];
    let totalInt = 0;
    for (let i = 1; i <= n; i++) {
      const interest = balance * r;
      const principalPaid = Math.max(0, emiCalc - interest);
      balance = Math.max(0, balance - principalPaid);
      totalInt += interest;
      sch.push({ month: i, interest, principalPaid, balance });
    }

    return { emi: emiCalc, totalPayment: emiCalc * n, totalInterest: totalInt, schedule: sch };
  }, [safePrincipal, monthlyRate, months]);

  const fmt = (num, digits = 0) =>
    "₹" + Number(num || 0).toLocaleString("en-IN", { maximumFractionDigits: digits });

  const chartData = useMemo(() => {
    const p = Math.max(0, safePrincipal);
    const i = Math.max(0, totalInterest);
    return {
      labels: ["Principal", "Interest"],
      datasets: [
        {
          data: [p, i],
          backgroundColor: ["#e6f9f1", "#2563eb"],
          borderWidth: 0,
        },
      ],
    };
  }, [safePrincipal, totalInterest]);

  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  };

  return (
    <div className="le-outer">
      <style>{`
        :root{
          --le-max-w: 980px;
          --le-gap: 28px;
          --le-panel-bg: #fff;
          --le-border: 1px solid #eef1f5;
          --le-shadow: 0 10px 30px rgba(2,6,23,0.04);
          --le-label-w: 160px;
          --le-accent: #0ea5a0;
          --le-input-bg: #ecfdf5;
        }

        .le-outer{
          font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          max-width: var(--le-max-w);
          margin: 20px auto;
          padding: 22px;
          border-radius: 14px;
          background: var(--le-panel-bg);
          border: var(--le-border);
          box-shadow: var(--le-shadow);
          color: #0f172a;
          box-sizing: border-box;
        }

        .le-title { margin:0 0 8px 0; font-size:18px; font-weight:700; color:#0f172a; }
        .le-sub { color:#6b7280; margin-bottom:16px; font-size:14px; }

        .le-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: var(--le-gap);
          align-items: start;
          min-width: 0;
        }

        .le-panel { min-width: 0; }

        .le-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          min-width: 0;
        }

        .le-label {
          width: var(--le-label-w);
          color: #374151;
          font-size: 14px;
          flex: 0 0 var(--le-label-w);
          box-sizing: border-box;
        }

        .le-range {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 6px;
          background: #e6eef0;
          flex: 1 1 auto;
        }
        .le-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--le-accent); border: 4px solid white;
          box-shadow: 0 2px 6px rgba(14,165,160,0.25);
          margin-top: -6px; cursor: pointer;
        }
        .le-range::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--le-accent); border: 4px solid white;
          box-shadow: 0 2px 6px rgba(14,165,160,0.25);
          cursor: pointer;
        }

        .le-input {
          min-width: 120px;
          padding: 7px 14px;
          border-radius: 8px;
          background: var(--le-input-bg);
          color: #065f46;
          border: 1px solid rgba(6,95,70,0.20);
          font-weight: 700;
          font-size: 15px;
          text-align: center;
          outline: none;
          box-sizing: border-box;
        }

        .le-input.small { min-width: 90px; }

        .le-results { margin-top: 8px; }

        .le-table-wrap { margin-top: 14px; }

        /* scroll container for table on narrow widths */
        .le-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        table.le-table { width: 100%; border-collapse: collapse; min-width: 520px; }
        table.le-table th, table.le-table td { padding: 6px; font-size: 13px; text-align: left; border-bottom: 1px solid rgba(15,23,42,0.03); }

        .le-chart-wrap { justify-content:center; align-items:flex-start; padding-top:6px; }
        .le-chart { width: 320px; height: 320px; position: relative; }
        .le-chart canvas { width:100% !important; height:100% !important; display:block; }

        .le-legend { display:flex; gap:12px; align-items:center; justify-content:center; margin-bottom:8px; flex-wrap:wrap; color:#6b7280; }

        /* responsive */
        @media (max-width: 1024px) {
          .le-grid { grid-template-columns: 1fr 300px; gap:20px; }
          .le-chart { width: 300px; height: 300px; }
        }

        @media (max-width: 768px) {
          .le-grid { display:flex; flex-direction:column; gap:18px; }
          .le-label { width: 140px; flex: 0 0 140px; }
          .le-input { min-width: 100px; }
          .le-chart { width: 280px; height: 280px; align-self: center; }
          table.le-table { min-width: 480px; }
        }

        /* <= 480px: stack rows & make inputs full width; table becomes stacked cards */
        @media (max-width: 480px) {
          .le-row { flex-direction: column; align-items: stretch; }
          .le-label { width: 100%; flex: none; margin-bottom: 8px; }
          .le-range { margin-right: 0; width: 100%; }
          .le-input { width: 100%; min-width: 0; margin-top: 8px; }
          .le-chart { width: 100%; height: 320px; }

          /* table: stacked/card style for very small screens */
          .le-table-scroll { overflow: visible; }
          table.le-table { display: block; width: 100%; min-width: 0; }
          table.le-table thead { display: none; }
          table.le-table tbody { display: block; }
          table.le-table tr {
            display: grid;
            grid-template-columns: 1fr;
            gap: 6px;
            background: #fff;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 6px 18px rgba(2,6,23,0.04);
            border: 1px solid rgba(14,165,160,0.04);
          }
          table.le-table td {
            display: flex;
            justify-content: space-between;
            padding: 6px 8px;
            border-bottom: none;
            font-size: 14px;
          }
          table.le-table td::before {
            content: attr(data-label);
            color: #6b7280;
            margin-right: 8px;
            font-weight: 600;
          }
          table.le-table tr:last-child { margin-bottom: 0; }
        }

        /* remove flex on small screens (≤600) — keep inline display:flex on desktop but switch to block on small */
        @media (max-width: 600px) {
          .hide-on-sm {
            display: block !important;
            width: 100%;
          }
        }

        @media (max-width: 360px) {
          .le-outer { padding: 12px; border-radius: 10px; }
          .le-chart { height: 260px; }
          .le-input { padding: 7px 10px; }
        }
      `}</style>

      <h3 className="le-title">Loan / EMI Calculator</h3>
      <div className="le-sub">Compute EMI and amortization for a loan.</div>

      <div className="le-grid">
        <div className="le-panel" aria-live="polite">
          {/* Principal */}
          <div className="le-row">
            <label className="le-label" htmlFor="loan-principal">Loan Amount</label>

            <input
              id="loan-principal"
              className="le-range"
              type="range"
              min={10000}
              max={20000000}
              step={1000}
              value={principal}
              onChange={(e) => setPrincipal(clamp(e.target.value, 10000, 20000000))}
              aria-label="Loan amount"
            />

            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(clamp(e.target.value, 10000, 20000000))}
              className="le-input"
              aria-label="Loan amount number"
            />
          </div>

          {/* Rate */}
          <div className="le-row">
            <label className="le-label" htmlFor="loan-rate">Annual rate (p.a.)</label>

            <input
              id="loan-rate"
              className="le-range"
              type="range"
              min={0}
              max={30}
              step={0.01}
              value={annualRate}
              onChange={(e) => setAnnualRate(clamp(e.target.value, 0, 30))}
              aria-label="Annual interest rate"
            />

            <input
              type="number"
              value={annualRate}
              onChange={(e) => setAnnualRate(clamp(e.target.value, 0, 30))}
              className="le-input"
              aria-label="Annual interest rate number"
            />
          </div>

          {/* Tenure */}
          <div className="le-row">
            <label className="le-label" htmlFor="loan-years">Tenure (years)</label>

            <input
              id="loan-years"
              className="le-range"
              type="range"
              min={1}
              max={40}
              step={1}
              value={years}
              onChange={(e) => setYears(clamp(e.target.value, 1, 40))}
              aria-label="Loan tenure in years"
            />

            <input
              type="number"
              value={years}
              onChange={(e) => setYears(clamp(e.target.value, 1, 40))}
              className="le-input small"
              aria-label="Loan tenure number"
            />
          </div>

          {/* Results */}
          <div className="le-results" role="status" aria-live="polite">
            <div className="hide-on-sm" style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
              <div>EMI (monthly)</div>
              <div style={{ fontWeight: 700 }}>{fmt(emi, 0)}</div>
            </div>

            <div className="hide-on-sm" style={{ display: "flex", justifyContent: "space-between", color: "#6b7280", marginTop: 8 }}>
              <div>Total interest</div>
              <div style={{ fontWeight: 700 }}>{fmt(totalInterest, 0)}</div>
            </div>

            <div className="hide-on-sm" style={{ display: "flex", justifyContent: "space-between", color: "#111827", fontWeight: 800, marginTop: 10 }}>
              <div>Total payment</div>
              <div>{fmt(totalPayment, 0)}</div>
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
                  setPrincipal(initialPrincipal);
                  setAnnualRate(initialRate);
                  setYears(initialYears);
                }}
                aria-label="Reset loan inputs"
              >
                RESET
              </button>
            </div>

            {/* amortization preview - responsive table */}
            <div className="le-table-wrap">
              <div style={{ color: "#6b7280", fontSize: 13, margin: "8px 0" }}>Amortization (first 6 months)</div>

              <div className="le-table-scroll">
                <table className="le-table" role="table" aria-label="Amortization first six months">
                  <thead>
                    <tr>
                      <th>M</th>
                      <th>Interest</th>
                      <th>Principal</th>
                      <th>Bal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.slice(0, 6).map((r) => (
                      <tr key={r.month}>
                        <td data-label="M">{r.month}</td>
                        <td data-label="Interest">{fmt(r.interest, 0)}</td>
                        <td data-label="Principal">{fmt(r.principalPaid, 0)}</td>
                        <td data-label="Bal">{fmt(r.balance, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="le-chart-wrap" aria-hidden={false}>
          <div style={{ textAlign: "center", marginBottom: 8, color: "#6b7280" }}>
            <span style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 12, height: 12, background: "#e6f9f1", borderRadius: 3 }} />
              <span style={{ fontSize: 13 }}>Principal</span>
              <span style={{ width: 12, height: 12, background: "#2563eb", borderRadius: 3, marginLeft: 12 }} />
              <span style={{ fontSize: 13 }}>Interest</span>
            </span>
          </div>

          <div className="le-chart" role="img" aria-label="Principal vs interest chart">
            <Doughnut data={chartData} options={doughnutOptions} />
          </div>
        </div>
      </div>
      {/* -------- About Loan / EMI -------- */}
<section
  style={{
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid #eef1f5",
  }}
>
  <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>
    What is EMI?
  </h4>

  <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
    EMI (Equated Monthly Installment) is the fixed amount you pay every month
    to repay a loan. It includes both <strong>principal</strong> and
    <strong> interest</strong> components.
  </p>

  <p style={{ margin: "0 0 10px", color: "#6b7280", lineHeight: 1.6 }}>
    Your EMI amount usually remains constant throughout the loan tenure,
    while the proportion of interest and principal changes every month.
  </p>

  <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
    How this Loan / EMI Calculator works
  </h5>

  <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
    <li>Calculates monthly EMI based on loan amount, interest rate, and tenure</li>
    <li>Shows total interest payable over the full loan period</li>
    <li>Displays total repayment amount (principal + interest)</li>
    <li>Provides a month-wise amortization breakdown</li>
  </ul>

  <h5 style={{ margin: "14px 0 6px", fontSize: 14, fontWeight: 700 }}>
    Why use an EMI calculator?
  </h5>

  <ul style={{ paddingLeft: 18, margin: 0, color: "#6b7280", lineHeight: 1.6 }}>
    <li>Helps you plan your monthly budget in advance</li>
    <li>Compare different loan amounts and tenures</li>
    <li>Understand the long-term impact of interest</li>
    <li>Avoid financial stress by choosing the right EMI</li>
  </ul>

  <p
    style={{
      marginTop: 12,
      color: "#6b7280",
      fontSize: 13,
      lineHeight: 1.6,
    }}
  >
    <strong>Tip:</strong> Longer tenure reduces EMI but increases total interest.
    Shorter tenure increases EMI but saves interest overall.
  </p>

  <p
    style={{
      marginTop: 8,
      color: "#6b7280",
      fontSize: 13,
      lineHeight: 1.6,
    }}
  >
    <strong>Disclaimer:</strong> EMI values shown are estimates. Actual loan
    terms may vary based on lender policies, processing fees, and applicable taxes.
  </p>
</section>

    </div>
  );
}
