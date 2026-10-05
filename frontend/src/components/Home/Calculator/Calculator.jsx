import React, { useState, useEffect } from "react";

export default function CAGRCalculator() {
  const [initialAmount, setInitialAmount] = useState(100000);
  const [finalAmount, setFinalAmount] = useState(200000);
  const [years, setYears] = useState(5);
  const [cagr, setCagr] = useState(0);

  // Format INR
  const formatCurrency = (num) =>
    `₹${Number(num).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const calculateCAGR = (initial, final, time) => {
    if (initial > 0 && final > 0 && time > 0) {
      const result = (Math.pow(final / initial, 1 / time) - 1) * 100;
      setCagr(result);
    }
  };

  useEffect(() => {
    calculateCAGR(initialAmount, finalAmount, years);
  }, [initialAmount, finalAmount, years]);

  return (
    <section className="profit-calculator">
      <div className="auto-container">
        <div className="row align-items-center">
          
          {/* Left Calculator */}
          <div className="col-lg-6 col-md-12 col-sm-12 profit-column">
            <div className="profit-inner">
              <div className="bg-layer"></div>
              <span className="big-text">calculator</span>

              <div className="inner-box">

                {/* Initial Investment */}
                <h5>Initial Investment</h5>
                <button className="w-125">
                  {formatCurrency(initialAmount)}
                </button>
                <div className="single-item">
                  <input
                    type="range"
                    min="10000"
                    max="5000000"
                    step="10000"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(Number(e.target.value))}
                  />
                  <div className="currency-list">
                    <span onClick={() => setInitialAmount(100000)}>₹1,00,000</span>
                    <span onClick={() => setInitialAmount(1000000)}>₹10,00,000</span>
                  </div>
                </div>

                {/* Final Value */}
                <h5>Final Value</h5>
                <button className="w-125">
                  {formatCurrency(finalAmount)}
                </button>
                <div className="single-item">
                  <input
                    type="range"
                    min="20000"
                    max="10000000"
                    step="10000"
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(Number(e.target.value))}
                  />
                </div>

                {/* Time Period */}
                <h5>Investment Duration (Years)</h5>
                <button className="w-125">
                  {years} Years
                </button>
                <div className="single-item">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                  />
                </div>

                {/* Result */}
                <div className="btn-box">
                  <h3>
                    {cagr.toFixed(2)}% <span>/ year</span>
                  </h3>

                  <button
                    className="theme-btn btn-two"
                    onClick={() => (window.location.href = "/calculators")}
                  >
                    <span>More Calculator</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-lg-6 col-md-12 col-sm-12 content-column">
            <div className="content-box">
              <div className="sec-title">
                <h6>CAGR Calculator</h6>
                <h2>Measure Long-Term Growth Accurately</h2>
              </div>
              <div className="text-box">
                <p>
                  The CAGR Calculator helps you understand the real annual growth
                  rate of your investments over time. It smoothens market
                  volatility and provides a true picture of long-term returns.
                </p>
                <ul className="list-style-two clearfix">
                  <li>True Annual Growth Rate</li>
                  <li>Long-Term Investment Planning</li>
                  <li>Portfolio Performance Tracking</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
