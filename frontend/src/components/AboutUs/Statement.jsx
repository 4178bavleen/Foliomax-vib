import React from 'react'

function Statement() {
  return (
    <>
      <section className="statements-section bg-color-1 centred">
        <div className="auto-container">
          <div className="sec-title">
            <h6>Statements</h6>
            <h2>
              Built for Clarity. Driven by Results.
            </h2>
          </div>

          <div className="row clearfix">
            {/* LEFT COLUMN */}
            <div className="col-lg-8 col-md-12 col-sm-12 left-column">
              <div className="left-content">
                <div className="row clearfix">

                  {/* Mission Box */}
                  <div className="col-lg-6 col-md-6 col-sm-12 statements-block">
                    <div className="statements-block-one">
                      <div
                        className="inner-box"
                        style={{
                          backgroundImage: 'url(assets/images/resource/statement-1.jpg)',
                        }}
                      >
                        <div
                          className="shape"
                          style={{
                            backgroundImage: 'url(assets/images/shape-37.png)',
                          }}
                        />
                        <h3>Our Mission</h3>
                      </div>
                    </div>
                  </div>

                  {/* Mission Text */}
                  <div className="col-lg-6 col-md-6 col-sm-12 statements-block">
                    <div className="statements-block-two">
                      <div className="inner-box">
                        <div className="icon-box">
                          <img src="assets/images/icons/icon-72.png" alt="" />
                        </div>
                        <p>
                          To simplify investing by replacing complex data with intuitive visuals and real-time insights that empower everyone to trade with confidence.

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vision Text */}
                  <div className="col-lg-6 col-md-6 col-sm-12 statements-block">
                    <div className="statements-block-two">
                      <div className="inner-box">
                        <div className="icon-box">
                          <img src="assets/images/icons/icon-53.png" alt="" />
                        </div>
                        <p>
                          To be the world’s most trusted visual ecosystem for financial clarity, transforming how the modern investor navigates the market.

                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vision Box */}
                  <div className="col-lg-6 col-md-6 col-sm-12 statements-block">
                    <div className="statements-block-one">
                      <div
                        className="inner-box"
                        style={{
                          backgroundImage: 'url(assets/images/resource/statement-2.jpg)',
                        }}
                      >
                        <div
                          className="shape"
                          style={{
                            backgroundImage: 'url(assets/images/shape-37.png)',
                          }}
                        />
                        <h3>Our Vision</h3>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-lg-4 col-md-12 col-sm-12 right-column">
              <div className="right-content">
                <div className="statements-block-three">
                  <div className="inner-box">
                    <div className="icon-box">
                      <img src="assets/images/icons/icon-74.png" alt="" />
                    </div>

                    <h3>Our Core Values</h3>
                    <p>
                      We are dedicated to bridging the gap between complex market data and investor success through a culture of total transparency and relentless innovation. 
                    </p>

                    <ul className="list-item">
                      <li>Clarity</li>
                      <li>Integrity</li>
                      <li>Precision</li>
                      <li>Empowerment</li>
                      <li>Risk Management</li>
                    </ul>

                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default Statement
