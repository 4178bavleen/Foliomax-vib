import React, { useState, useEffect } from "react";

import SipLumpsumCalculator from "./SipLumpsumCalculator";
import CAGRCalculator from "./CAGRCalculator";
import SetupSipCalculator from "./SetupSipCalculator";
import LoanEMICalculator from "./LoanEMICalculator";
import ValuationCalculator from "./ValuationCalculator";

/* ---------------------------------------------
   INLINE STYLES (DESKTOP FIRST)
--------------------------------------------- */
const S = {
  page: {
    padding: 16,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  },

  container: {
    maxWidth: 1240,
    margin: "0 auto",
    display: "flex",
    gap: 20,
  },

  sidebar: { flex: "0 0 260px", minWidth: 240 },

  card: {
    padding: 18,
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 6px 18px rgba(4,6,14,0.06)",
  },

  sideWidget: {
    padding: 16,
    borderRadius: 12,
    background: "#f8fafc",
    boxShadow: "0 6px 18px rgba(4,6,14,0.06)",
  },

  sideTitle: { margin: 0, marginBottom: 8, fontSize: 16 },

  sideList: { display: "flex", flexDirection: "column", gap: 10 },

  sideBtn: (active) => ({
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 14px",
    borderRadius: 14,
    background: active ? "#0f172a" : "#fff",
    color: active ? "#fff" : "#0b1220",
    border: "1px solid #e6eef0",
    cursor: "pointer",
    fontSize: 14,
  }),

  smallBtn: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
  },

  content: {
    flex: "1 1 auto",
    minWidth: 0,
  },
};

/* ---------------------------------------------
   CALCULATOR LIST
--------------------------------------------- */
const CALCULATORS = [
  { id: "cagr", label: "CAGR" },
  { id: "sip", label: "SIP" },
  { id: "stepup", label: "Step-up SIP" },
  { id: "lumpsum", label: "Lumpsum" },
  { id: "loan", label: "Loan / EMI" },
  { id: "valuation", label: "Valuation" },
];

/* ---------------------------------------------
   MAIN COMPONENT
--------------------------------------------- */
export default function Calculators() {
  const [active, setActive] = useState("sip");

  /* ---------------------------------------------
     INJECT GLOBAL RESPONSIVE CSS ONCE
  --------------------------------------------- */
  useEffect(() => {
    const id = "calc-global-responsive-css";
    if (document.getElementById(id)) return;

    const css = `
      /* ---------------- GLOBAL ---------------- */
      .calc-container {
        display: flex;
        gap: 20px;
      }
      .calc-sidebar {
        width: 260px;
        min-width: 240px;
      }
      .calc-content {
        flex: 1;
      }

      /* ---------------- 1280px ---------------- */
      @media (max-width: 1280px) {
        .calc-container {
          padding: 0 10px;
        }
      }

      /* ---------------- 1024px ---------------- */
      /* Tablet / Small Laptop */
      @media (max-width: 1024px) {
        .calc-container {
          flex-direction: column;
          gap: 16px;
        }

        .calc-sidebar {
          width: 100%;
          min-width: 100%;
        }

        .calc-side-list {
          flex-direction: row !important;
          gap: 8px !important;
          overflow-x: auto !important;
          white-space: nowrap !important;
          padding-bottom: 6px;
        }

        /* Force all calculators to stack properly */
        .sl-grid,
        .sip-grid {
          grid-template-columns: 1fr !important;
          gap: 24px !important;
        }

        .sl-chart-wrap,
        .sip-chart-wrap {
          justify-content: center !important;
          width: 100% !important;
        }
      }

      /* ---------------- 768px ---------------- */
      /* Tablets */
      @media (max-width: 768px) {
        .calc-side-list button {
          padding: 12px 14px;
          font-size: 14px;
          border-radius: 12px;
        }

        .calc-card {
          padding: 16px !important;
        }
      }

      /* ---------------- 520px ---------------- */
      /* Phones */
      @media (max-width: 520px) {
        .sip-row,
        .sl-row {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 8px !important;
        }

        .sip-label,
        .sl-label {
          width: 100% !important;
        }
      }

      /* ---------------- 380px ---------------- */
      @media (max-width: 380px) {
        .sl-chart-wrap,
        .sip-chart-wrap {
          transform: scale(0.9);
        }
      }

      /* ---------------- 320px ---------------- */
      @media (max-width: 320px) {
        .sl-chart-wrap,
        .sip-chart-wrap {
          transform: scale(0.8);
        }

        .calc-card {
          padding: 12px !important;
        }
      }
    `;

    const el = document.createElement("style");
    el.id = id;
    el.innerHTML = css;
    document.head.appendChild(el);
  }, []);

  /* ---------------------------------------------
     RENDER
  --------------------------------------------- */
  return (
    <div className="calc-root" style={S.page}>
      <div className="calc-container" style={S.container}>
        
        {/* ---------------- SIDEBAR ---------------- */}
        <aside className="calc-sidebar" style={S.sidebar}>
          <div className="calc-side-widget" style={S.sideWidget}>
            <h4 style={S.sideTitle}>Tools</h4>

            <div className="calc-side-list" style={S.sideList}>
              {CALCULATORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  style={S.sideBtn(active === c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={() => setActive("sip")}
                style={{ ...S.smallBtn, flex: 1 }}
              >
                Quick SIP
              </button>
              <button
                onClick={() => setActive("valuation")}
                style={{ ...S.smallBtn, flex: 1 }}
              >
                Valuation
              </button>
            </div>
          </div>

          {/* TIPS */}
          <div style={{ marginTop: 12, ...S.sideWidget }}>
            <div style={{ fontSize: 13, color: "#0f172a", marginBottom: 8 }}>
              Tips
            </div>
            <ul style={{ paddingLeft: 18, margin: 0, color: "#334155" }}>
              <li>Use realistic annual returns (8–15% for equities).</li>
              <li style={{ marginTop: 8 }}>
                SIPs usually grow better with consistency.
              </li>
              <li style={{ marginTop: 8 }}>
                Don't try to time the market — stay invested.
              </li>
            </ul>
          </div>
        </aside>

        {/* ---------------- CONTENT ---------------- */}
        <main className="calc-content" style={S.content}>
          <div className="calc-card" style={S.card}>
            {active === "cagr" && <CAGRCalculator />}
            {(active === "sip" || active === "lumpsum") && (
              <SipLumpsumCalculator initialMode={active} />
            )}
            {active === "stepup" && <SetupSipCalculator />}
            {active === "loan" && <LoanEMICalculator />}
            {active === "valuation" && <ValuationCalculator />}
          </div>
        </main>
      </div>
    </div>
  );
}
