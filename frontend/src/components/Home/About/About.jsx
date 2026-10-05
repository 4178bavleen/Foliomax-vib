import React from 'react'

function About() {
  return (
    <>
      <section className="about-style-three">
        <div
          className="bg-layer"
          style={{ backgroundImage: 'url(assets/images/background/about-bg.jpg)' }}
        />
        <div className="auto-container">
          <div className="row align-items-center">
            {/* LEFT SIDE FUNFACTS */}
            <div className="col-lg-6 col-md-12 col-sm-12 inner-column">
              <div className="inner-content">
                <div className="funfact-block-one">
                  <div className="inner-box">
                    <div className="icon-box">
                      <img src="assets/images/icons/icon-51.png" alt="" />
                    </div>
                    <h2>
                      50<span>+</span>
                    </h2>
                    <p>
                       Analytical Indicators                      
                    </p>
                  </div>
                </div>

                <div className="funfact-block-one">
                  <div className="inner-box">
                    <div className="icon-box">
                      <img src="assets/images/icons/icon-52.png" alt="" />
                    </div>
                    <h2>
                      10,000<span>+</span>
                    </h2>
                    <p>
                      Market Scenarios
                    </p>
                  </div>
                </div>

                <div className="funfact-block-one">
                  <div className="inner-box">
                    <div className="icon-box">
                      <img src="assets/images/icons/icon-53.png" alt="" />
                    </div>
                    <h2>
                      24/7
                    </h2>
                    <p>
                      Goal Tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE CONTENT */}
            <div className="col-lg-6 col-md-12 col-sm-12 content-column">
              <div className="content-box">
                <div className="sec-title light">
                  <h6>About Foliomax</h6>
                  <h2>Visualizing the Market. Simplifying Your Success.</h2>
                </div>

                <div className="text-box">
                  <p>
                    Foliomax is a premier financial insights platform dedicated to turning market complexity into investment confidence. We bridge the gap between dense data and smart decisions by replacing jargon-heavy spreadsheets with intuitive, real-time visuals and low-latency NSE market feeds. By combining high-fidelity analytics with precision goal-planning tools, we empower every investor to cut through the noise and take full control of their financial future.
                  </p>
                </div>

                {/* Mission */}
                <div className="inner-box">
                  <div className="single-item">
                    <div className="row clearfix">
                      <div className="col-lg-6 col-md-6 col-sm-12 title-column">
                        <div className="title-box">
                          <div className="icon-box">
                            <img src="assets/images/icons/icon-54.png" alt="" />
                          </div>
                          <h3>
                            Mission <br />
                            Statement
                          </h3>
                        </div>
                      </div>

                      <div className="col-lg-6 col-md-6 col-sm-12 text-column">
                        <div className="text">
                          <p>
                            We empower investors as well as traders with transparent research, practical tools,
                            and unbiased insights that support smarter investment choices.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commitment */}
                  <div className="single-item">
                    <div className="row clearfix">
                      <div className="col-lg-6 col-md-6 col-sm-12 title-column">
                        <div className="title-box">
                          <div className="icon-box">
                            <img src="assets/images/icons/icon-55.png" alt="" />
                          </div>
                          <h3>
                            Our <br />
                            Commitment
                          </h3>
                        </div>
                      </div>

                      <div className="col-lg-6 col-md-6 col-sm-12 text-column">
                        <div className="text">
                          <p>
                            Every insight we deliver is researched, structured, and designed
                            to support real investors in real market conditions.
                          </p>

                          <ul className="list-item clearfix">
                            <li>Portfolio Optimization</li>
                            <li>Data-Backed Stock Screening</li>
                            <li>Market Trend Analysis</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}

export default About
