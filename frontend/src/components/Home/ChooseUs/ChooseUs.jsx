import React from "react";

export default function ChooseUs() {
  return (
    <section className="chooseus-style-two bg-color-3">
      {/* Background Pattern */}
      <div
        className="pattern-layer"
        style={{ backgroundImage: "url(/assets/images/shape/shape-12.png)" }}
      ></div>

      <div className="auto-container">
        {/* Section Title */}
        <div className="sec-title centred light">
          <h6>Key Highlights</h6>
          <h2>Why Choose Foliomax</h2>
          
        </div>

        <div className="row clearfix">
          {/* Left Column */}
          <div className="col-lg-4 col-md-12 col-sm-12 left-column">
            <div className="left-content">
              {/* Block 1 */}
              <div className="chooseus-block-two">
                <div className="inner-box">
                  <div className="icon-box">
                    <div
                      className="icon-bg"
                      style={{
                        backgroundImage:
                          "url(/assets/images/shape/shape-11.png)",
                      }}
                    ></div>
                    <div className="icon">
                      <img
                        src="/assets/images/icons/icon-75.png"
                        alt="Friendly & Expert"
                      />
                    </div>
                  </div>
                  <h3>Real-Time Market Precision</h3>
                  {/* <p>
                    It
helps you to make your
investment choice better
and ….
                  </p> */}
                </div>
              </div>

              {/* Block 2 */}
              <div className="chooseus-block-two">
                <div className="inner-box">
                  <div className="icon-box">
                    <div
                      className="icon-bg"
                      style={{
                        backgroundImage:
                          "url(/assets/images/shape/shape-11.png)",
                      }}
                    ></div>
                    <div className="icon">
                      <img
                        src="/assets/images/icons/icon-76.png"
                        alt="Demo Account"
                      />
                    </div>
                  </div>
                  <h3>Data-Driven Decision Tools</h3>
                  {/* <p>
                   That
helps you to discover
stocks on different
parameters
                  </p> */}
                </div>
              </div>
            </div>
          </div>

          {/* Center Logo Column */}
          <div className="col-lg-4 col-md-12 col-sm-12 left-column">
            <div className="logo-box">
              <figure className="logo">
                <img
                  src="/assets/images/icons/logo-1.png"
                  alt="Company Logo"
                />
              </figure>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-lg-4 col-md-12 col-sm-12 right-column">
            <div className="right-content">
              {/* Block 3 */}
              <div className="chooseus-block-two">
                <div className="inner-box">
                  <div className="icon-box">
                    <div
                      className="icon-bg"
                      style={{
                        backgroundImage:
                          "url(/assets/images/shape/shape-11.png)",
                      }}
                    ></div>
                    <div className="icon">
                      <img
                        src="/assets/images/icons/icon-77.png"
                        alt="24/7 Support"
                      />
                    </div>
                  </div>
                  <h3>Comprehensive Monitoring</h3>
                  {/* <p>
                    Support for
subscribers
                  </p> */}
                </div>
              </div>

              {/* Block 4 */}
              <div className="chooseus-block-two">
                <div className="inner-box">
                  <div className="icon-box">
                    <div
                      className="icon-bg"
                      style={{
                        backgroundImage:
                          "url(/assets/images/shape/shape-11.png)",
                      }}
                    ></div>
                    <div className="icon">
                      <img
                        src="/assets/images/icons/icon-78.png"
                        alt="Award Winner"
                      />
                    </div>
                  </div>
                  <h3>All-in-On<br/>Ecosystem</h3>
                  {/* <p>
                    Trusted by thousands of investors and recognised for
                    transparent, data-driven market insights.
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
