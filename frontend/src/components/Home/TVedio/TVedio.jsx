import React from "react";

export default function TVideo() {
  return (
    <section className="video-section bg-color-7">
      <div
        className="pattern-layer"
        style={{ backgroundImage: "url(/assets/images/shape/shape-26.png)" }}
      ></div>

      <div className="auto-container">
        <div className="row align-items-center">
          {/* Video Column */}
          <div className="col-lg-6 col-md-12 col-sm-12 video-column">
            <div className="video-content">
              <div
                className="video-inner"
                style={{
                  backgroundImage: "url(/assets/images/background/video-bg.jpg)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="video-btn">
                  {/* opens external video (your template uses lightbox; keep class for plugin) */}
                  <a
                    href="https://www.youtube.com/watch?v=nfP5N9Yc72A&t=28s"
                    className="lightbox-image"
                    data-caption=""
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Play demo video"
                  >
                    <img src="/assets/images/icons/icon-56.png" alt="play" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Content Column */}
          <div className="col-lg-6 col-md-12 col-sm-12 content-column">
            <div className="content-box">
              <div className="sec-title">
                <h6>Video Tutorial</h6>
                <h2>Curated forex training video series</h2>
              </div>

              <div className="text-box">
                <h3>Introduction to forex trading</h3>
                <h6>Duration: 6.05 Mins</h6>
                <p>
                  Watch our forex trading videos to get the most from the markets
                  &amp; become a profitable forex trader.
                </p>
                <a href="/videos" className="theme-btn btn-two">
                  <span>More Videos</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
