import React from 'react'

function CorporateJourney() {
  return (
    <>
      <section className="about-style-two">
        <div className="auto-container">
          <div className="row align-items-center">

            {/* LEFT IMAGE SIDE */}
            <div className="col-lg-7 col-md-12 col-sm-12 image-column">
              <div className="image-box">
                <figure className="image">
                  <img src="assets/images/resource/about-2.jpg" alt="" />
                </figure>

                <div className="experience-box">
                  <div
                    className="shape"
                    style={{
                      backgroundImage: 'url(assets/images/shape/shape-35.png)',
                    }}
                  />
                  <div className="icon-box">
                    <img src="assets/images/icons/icon-37.png" alt="" />
                  </div>

                  <h2>
                    6+ <span>Years</span>
                  </h2>
                  <h5>Experience in Equity Research</h5>
                </div>

                {/* <div className="image-content">
                  <h6>Last Year Accuracy Rate</h6>
                  <h3>87.42%</h3>
                  <p>
                    <i className="flaticon-right-up" />
                    +5.88%
                  </p>
                  <div className="bar">
                    <img src="assets/images/icons/bar-4.png" alt="" />
                  </div>
                </div> */}
              </div>
            </div>

            {/* RIGHT CONTENT SIDE */}
            <div className="col-lg-5 col-md-12 col-sm-12 content-column">
              <div className="content-box">
                <div className="sec-title">
                  <h6>Corporate Journey</h6>
                  <h2>From Data Complexity to Financial Clarity</h2>
                </div>

                <div className="text-box">
                  <p>
                    Foliomax began with a mission to simplify stock market
                    research for everyday investors. Over the years, we’ve
                    evolved into a trusted platform offering accurate insights,
                    market updates, and long-term growth strategies backed by
                    data-driven analytics.
                  </p>

                  <div className="single-item">
                    <div className="icon-box">
                      <img src="assets/images/icons/icon-67.png" alt="" />
                    </div>
                    <h3>Evolution</h3>
                    <p>
                      From curated stock lists to advanced portfolio tools, we
                      continue refining our systems to help investors stay ahead
                      in all market conditions.
                    </p>
                  </div>

                  {/* <a href="/about-us" className="theme-btn btn-two">
                    <span>Explore History</span>
                  </a> */}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default CorporateJourney
