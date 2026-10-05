import React, { useState } from "react";

export default function WhatWeOffer() {
  // Tab data
  const tabs = [
    {
      title: "Real-Time NSE Market Insights",
      text: "Access live, low-latency data to track price movements and market trends with millisecond precision.",
      image: "/assets/images/What-we-offer-01.jpg",
    },
    {
      title: "Advanced Monitoring & Support",
      text: "Transform raw stock data and complex spreadsheets into intuitive heatmaps and charts for instant clarity.",
      image: "/assets/images/What-we-offer-02.jpg",
    },
    {
      title: "Powerful Trading Platforms & Tools",
      text: "Use precision SIP, CAGR, and retirement calculators to align your investments with long-term milestones.",
      image: "/assets/images/What-we-offer-03.jpg",
    },
    {
      title: "Investor Education & Professional Training",
      text: "Monitor asset allocation and diversification through clear, automated visual breakdowns.",
      image: "/assets/images/What-we-offer-04.jpg",
    },
  ];

  // ✅ FIX 1: Default active tab must exist
  const [activeTab, setActiveTab] = useState(tabs[0].title);

  // ✅ FIX 2: Add fallback safety
  const activeContent =
    tabs.find((tab) => tab.title === activeTab) || tabs[0];

  return (
    <section className="offer-section sec-pad-custom">
      <div className="auto-container">
        {/* Section Title */}
        <div className="sec-title-custom centred">
          <h6>What we Offer</h6>
          <h2>Provide all your needs</h2>
        </div>

        <div className="tabs-box">
          <div className="row clearfix">
            {/* Left Column - Tabs */}
            <div className="col-lg-3 col-md-12 col-sm-12 left-column">
              <div className="left-content">
                <div className="tab-btn-box">
                  <ul className="tab-btns tab-buttons clearfix">
                    {tabs.map((tab) => (
                      <li
                        key={tab.title}
                        className={`tab-btn ${
                          activeTab === tab.title ? "active-btn" : ""
                        }`}
                        onClick={() => setActiveTab(tab.title)}
                      >
                        {tab.title}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* <div className="inner-box">
                  <h5>Interesting Fact</h5>
                  <p>
                    <img
                      src="/assets/images/icons/icon-24.png"
                      alt="Trades icon"
                    />
                    No. of Trades Opened Last Month
                  </p>
                  <h3>
                    10 <span>Million</span>
                  </h3>
                </div> */}
              </div>
            </div>

            {/* Middle Column - Tab Content */}
            <div className="col-lg-5 col-md-12 col-sm-12 content-column">
              <div className="tabs-content">
                <div className="tab active-tab">
                  <div className="content-box">
                    <div className="text-box">
                      <h3>{activeContent.title}</h3>
                      <p>{activeContent.text}</p>
                      {/* <a href="/">
                        <span>Read More</span>
                      </a> */}
                    </div>
                    <figure className="image-box">
                      <img
                        src={activeContent.image}
                        alt={activeContent.title}
                      />
                    </figure>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-4 col-md-12 col-sm-12 right-column">
              <div className="right-content">
                <div className="text-box">
                  <h5>Payout Details 2023</h5>
                  <p>Blame belongs those who fail foresee.</p>
                </div>
                <figure className="image-box">
                  <img
                    src="/assets/images/resource/dashboard-2.jpg"
                    alt="Payout dashboard"
                  />
                </figure>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
