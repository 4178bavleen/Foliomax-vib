import React from 'react'
import './Team.css'

function Stats() {
  return (
    <>
      <section className="funfact-style-three bg-color-custom-stats centred">
        <div
          className="pattern-layer"
          style={{ backgroundImage: 'url(assets/images/shape/shape-49.png)' }}
        />
        <div className="auto-container">
          <div className="row clearfix">

            {/* STAT 1 */}
            <div className="col-lg-3 col-md-6 col-sm-12 single-column">
              <div className="funfact-block-one">
                <div className="inner-box">
                  <div className="icon-box">
                    <img src="assets/images/icons/icon-68.png" alt="" />
                  </div>
                  <h2>
                    99.9%
                  </h2>
                  <p>
                    Accuracy
                  </p>
                </div>
              </div>
            </div>

            {/* STAT 2 */}
            <div className="col-lg-3 col-md-6 col-sm-12 single-column">
              <div className="funfact-block-one">
                <div className="inner-box">
                  <div className="icon-box">
                    <img src="assets/images/icons/icon-69.png" alt="" />
                  </div>
                  <h2>
                    50+
                  </h2>
                  <p>
                    Indicators
                  </p>
                </div>
              </div>
            </div>

            {/* STAT 3 */}
            <div className="col-lg-3 col-md-6 col-sm-12 single-column">
              <div className="funfact-block-one">
                <div className="inner-box">
                  <div className="icon-box">
                    <img src="assets/images/icons/icon-70.png" alt="" />
                  </div>
                  <h2>
                    0
                  </h2>
                  <p>
                    Zero Hidden Fees
                  </p>
                </div>
              </div>
            </div>

            {/* STAT 4 */}
            <div className="col-lg-3 col-md-6 col-sm-12 single-column">
              <div className="funfact-block-one">
                <div className="inner-box">
                  <div className="icon-box">
                    <img src="assets/images/icons/icon-71.png" alt="" />
                  </div>
                  <h2>
                    10,000+
                  </h2>
                  <p>
                    Trade Scenarios
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

export default Stats
