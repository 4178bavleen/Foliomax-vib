import React from "react";

export default function PayoutSystem() {
  return (
    <section className="payout-system">
      <div className="auto-container">
        <div className="row align-items-center">
          {/* Left: Text / Content Column */}
          <div className="col-lg-6 col-md-12 col-sm-12 content-column">
            <div className="content-box">
              {/* Section Title */}
              <div className="sec-title">
                <h6>Payout System</h6>
                <h2>How Foliomax Subscriptions Helps You Win</h2>
              </div>
              <p>
                 Our subscription removes guesswork by delivering
                </p>
                <br/>
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

          {/* Right: Image Column */}
          <div className="col-lg-6 col-md-12 col-sm-12 image-column">
            <div className="image-box">
              <figure className="image">
                <img
                  src="/assets/images/resource/men-1.png"
                  alt="Happy investor using phone"
                />
              </figure>
              <figure className="card-image">
                <img
                  src="/assets/images/resource/card-5.png"
                  alt="Card Illustration"
                />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
