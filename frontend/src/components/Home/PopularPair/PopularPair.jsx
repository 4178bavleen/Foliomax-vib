// src/components/PopularPair/PopularPairs.jsx
import React from "react";

const pricingItems = [
  {
    pairLabel: "Reliance / NSE",
    sell: "₹2,940.50",
    buy: "₹2,948.80",
    spread: "+0.28%",
    spreadClass: "green",
    graph: "/assets/images/icons/graph-2.png",
  },
  {
    pairLabel: "TCS / NSE",
    sell: "₹3,780.10",
    buy: "₹3,792.35",
    spread: "+0.32%",
    spreadClass: "green",
    graph: "/assets/images/icons/graph-2.png",
  },
  {
    pairLabel: "Infosys / NSE",
    sell: "₹1,645.20",
    buy: "₹1,652.90",
    spread: "-0.19%",
    spreadClass: "red",
    graph: "/assets/images/icons/graph-3.png",
  },
  {
    pairLabel: "HDFC Bank / NSE",
    sell: "₹1,520.40",
    buy: "₹1,527.10",
    spread: "+0.21%",
    spreadClass: "green",
    graph: "/assets/images/icons/graph-3.png",
  },
];

export default function PopularPairs() {
  return (
    <section className="pricing-section bg-color-8-custom">
      <div className="auto-container">
        <div className="row clearfix">

          {/* Title Column */}
          <div className="col-lg-6 col-md-12 col-sm-12 title-column">
            <div className="sec-title">
              <h6>Popular Indian Stocks</h6>
              <h2>Major NSE stocks & pricing in market</h2>
              <p>
                Track real-time bid–ask levels on India’s most active stocks so you
                can trade with tighter spreads and better control.
              </p>
            </div>
          </div>

          {/* Pricing blocks */}
          {pricingItems.map((item, idx) => (
            <div className="col-lg-3 col-md-6 col-sm-12 pricing-block" key={idx}>
              <div className="pricing-block-one">
                <div className="inner-box">

                  {/* Removed flags – showing just stock titles */}
                  <div className="currency-box">
                    <ul className="list-item">
                      <li>{item.pairLabel.split(" / ")[0]}</li>
                      <li>{item.pairLabel.split(" / ")[1]}</li>
                    </ul>
                  </div>

                  <div className="content-box">
                    <ul className="list-item clearfix">
                      <li>
                        Sell<span>Buy</span>
                      </li>
                      <li className="vilote">
                        {item.sell}
                        <span className="yellow">{item.buy}</span>
                      </li>
                      <li>
                        Change <br />
                        <span className={item.spreadClass}>{item.spread}</span>
                        <a href="index-2.html">Trade</a>
                      </li>
                    </ul>
                  </div>

                  <div className="graph-box">
                    <div className="graph">
                      <img src={item.graph} alt="graph" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}

          {/* Info Column */}
          <div className="col-lg-6 col-md-12 col-sm-12 content-column">
            <div className="content-inner bg-color-3">
              <div className="row clearfix">

                <div className="col-lg-6 col-md-6 col-sm-12 text-column">
                  <div className="text-box">
                    <h3>
                      Live spreads & depth <br />
                      for Indian equities.
                    </h3>
                    <a href="index-2.html" className="theme-btn btn-two">
                      <span>View All Stocks</span>
                    </a>
                  </div>
                </div>

                <div className="col-lg-6 col-md-6 col-sm-12 links-column">
                  <ul className="list-item">
                    <li>Price discovery made simple</li>
                    <li>Real bid & ask quotes</li>
                    <li>Ultra-fast trade execution</li>
                    <li>Supports delivery & intraday</li>
                    <li>Smart risk management tools</li>
                  </ul>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
