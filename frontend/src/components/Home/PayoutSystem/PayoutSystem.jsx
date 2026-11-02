
import React from "react";

export default function PayoutSystem() {
  return (
    <section className="payout-system">
      <div className="auto-container">
        <div className="row align-items-center">

          {/* LEFT: KEEPING YOUR ORIGINAL CONTENT */}
          <div className="col-lg-6 col-md-12 col-sm-12 content-column">
            <div className="content-box">

              <div className="sec-title">
                <h6>Payout System</h6>
                <h2>How Foliomax Subscriptions Helps You Win</h2>
              </div>

              <p>
                Our subscription removes guesswork by delivering
              </p>

              <br />

              <div className="col-lg-6 col-md-6 col-sm-12 links-column">
                <ul className="list-style-two clearfix">
                  <li>Expert-curated stock lists</li>
                  <li>Clear, concise analysis</li>
                  <li>Timely, actionable updates</li>
                  <li>Portfolio approach for real investors</li>
                  <li>Risk Management</li>
                </ul>
              </div>

            </div>
          </div>





   

{/* RIGHT: MODERN FINANCIAL STORYTELLING */}
<div className="col-lg-6 col-md-12 col-sm-12 image-column">
  <div className="fm-story">

    <div className="fm-story-main">

      {/* Image */}
      <div className="fm-story-photo">
        <img
          src="/assets/images/payout-investor.png"
          alt="Professional investor studying financial markets"
        />

        <div className="fm-story-photo-overlay" />

        <div className="fm-story-photo-text">
          <span>FOLIOMAX / INVESTMENT RESEARCH</span>
          <h3>
            Think
            <br />
            Beyond
            <br />
            <em>Markets.</em>
          </h3>
        </div>
      </div>

      {/* Green information section */}
      <div className="fm-story-info">

        <div className="fm-story-top">
          <span>OUR APPROACH</span>
          <span className="fm-story-index">01 — 03</span>
        </div>

        <h3>
          Investing with
          <br />
          <span>greater clarity.</span>
        </h3>

        <div className="fm-story-items">

          <div className="fm-story-item">
            <span className="fm-story-num">01</span>
            <div>
              <h4>Expert Research</h4>
              <p>Curated stock ideas backed by analysis.</p>
            </div>
          </div>

          <div className="fm-story-item">
            <span className="fm-story-num">02</span>
            <div>
              <h4>Actionable Insights</h4>
              <p>Clear information to support decisions.</p>
            </div>
          </div>

          <div className="fm-story-item">
            <span className="fm-story-num">03</span>
            <div>
              <h4>Risk Awareness</h4>
              <p>A disciplined approach to investing.</p>
            </div>
          </div>

        </div>

        <div className="fm-story-bottom">
          <span>INVEST WITH INTENTION</span>
          <span className="fm-story-bottom-line" />
        </div>

      </div>

    </div>

    {/* Outside decorative text */}
    <div className="fm-story-decoration">
      FINANCIAL INTELLIGENCE
    </div>

  </div>
</div>

<style>{`
  .fm-story {
    position: relative;
    width: 100%;
    max-width: 560px;
    margin: 0 auto;
    padding: 15px 18px 15px 0;
  }

  .fm-story-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 475px;
    overflow: hidden;
    border-radius: 5px;
    box-shadow: 0 25px 60px rgba(20, 50, 30, .13);
  }

  .fm-story-photo {
    position: relative;
    min-height: 475px;
    overflow: hidden;
    background: #dce8df;
  }

  .fm-story-photo img {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    object-fit: cover;
    object-position: center;
    transition: transform .8s ease;
  }

  .fm-story:hover .fm-story-photo img {
    transform: scale(1.035);
  }

  .fm-story-photo-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(10, 30, 19, .1) 10%,
      rgba(10, 30, 19, .7) 100%
    );
  }

  .fm-story-photo-text {
    position: absolute;
    left: 25px;
    right: 15px;
    bottom: 35px;
    color: white;
  }

  .fm-story-photo-text > span {
    font-size: 8px;
    letter-spacing: 1.6px;
    font-weight: 700;
    color: #d0e9d6;
  }

  .fm-story-photo-text h3 {
    margin: 18px 0 0;
    color: white;
    font-size: clamp(30px, 3.5vw, 43px);
    line-height: 1.12;
    font-weight: 800;
    letter-spacing: -1.5px;
  }

  .fm-story-photo-text h3 em {
    font-family: Georgia, serif;
    font-weight: 400;
    color: #a9dfb6;
  }

  .fm-story-info {
    display: flex;
    flex-direction: column;
    padding: 30px 23px 24px;
    background: #174c31;
    color: white;
  }

  .fm-story-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 5px;
  }

  .fm-story-top span {
    font-size: 8px;
    letter-spacing: 1.2px;
    font-weight: 800;
    color: #a8cdb4;
  }

  .fm-story-top .fm-story-index {
    color: #6f9e7d;
  }

  .fm-story-info > h3 {
    margin: 34px 0 30px;
    color: white;
    font-size: clamp(23px, 2.6vw, 30px);
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -.8px;
  }

  .fm-story-info > h3 span {
    color: #a8d8b4;
    font-family: Georgia, serif;
    font-weight: 400;
    font-style: italic;
  }

  .fm-story-items {
    display: flex;
    flex-direction: column;
  }

  .fm-story-item {
    display: flex;
    gap: 12px;
    padding: 18px 0;
    border-top: 1px solid rgba(255, 255, 255, .15);
  }

  .fm-story-num {
    color: #8fbd9d;
    font-size: 10px;
    font-weight: 800;
    padding-top: 2px;
  }

  .fm-story-item h4 {
    margin: 0 0 6px;
    color: white;
    font-size: 12px;
    font-weight: 700;
  }

  .fm-story-item p {
    margin: 0;
    color: #b7d1bd;
    font-size: 10px;
    line-height: 1.7;
  }

  .fm-story-bottom {
    margin-top: auto;
    padding-top: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .fm-story-bottom span:first-child {
    font-size: 8px;
    letter-spacing: 1.3px;
    font-weight: 800;
    color: #b9d8c1;
    white-space: nowrap;
  }

  .fm-story-bottom-line {
    height: 1px;
    flex: 1;
    background: rgba(255, 255, 255, .3);
  }

  .fm-story-decoration {
    position: absolute;
    right: -2px;
    bottom: 0;
    writing-mode: vertical-rl;
    font-size: 8px;
    letter-spacing: 2px;
    font-weight: 800;
    color: #608b6c;
    transform: translateX(100%);
  }

  @media (max-width: 991px) {
    .fm-story {
      margin-top: 30px;
    }
  }

  @media (max-width: 575px) {
    .fm-story {
      padding-right: 0;
    }

    .fm-story-main {
      grid-template-columns: 1fr;
    }

    .fm-story-photo {
      min-height: 340px;
    }

    .fm-story-photo-text h3 {
      font-size: 42px;
    }

    .fm-story-info {
      padding: 28px;
    }

    .fm-story-info > h3 {
      margin: 25px 0;
      font-size: 29px;
    }

    .fm-story-decoration {
      display: none;
    }
  }
`}</style>





        </div>
      </div>
    </section>
  );
}
