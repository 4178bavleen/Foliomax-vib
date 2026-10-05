import React from "react";

export default function CTA() {
  return (
    <section className="cta-section centred bg-color-3">
      {/* Background layer */}
      <div
        className="bg-layer"
        style={{ backgroundImage: "url(/assets/images/shape/shape-13.png)" }}
      ></div>

      <div className="auto-container">
        <div className="content-box">
          <h2>Join Foliomax &amp; Begin!</h2>

          <h3>One Ecosystem. Infinite Financial Possibilities.</h3>

          {/* <h3>
           Learn More About {" "}
            <a
              href="https://www.youtube.com/watch?v=nfP5N9Yc72A&t=28s"
              className="lightbox-image"
              data-caption=""
              target="_blank"
              rel="noopener noreferrer"
            >
              Our Features Designed
            </a> to Enhance Your Experience{" "}
           
          </h3> */}

          <div className="lower-box">
            {/* Start Trading Button */}
            <a href="/login" className="theme-btn btn-two">
              <span>Sign In</span>
            </a>

            {/* Chat Box */}
            <div className="chat-box">
              <div className="image-box">
                <img
                  src="/assets/images/resource/chat-1.png"
                  alt="Chat illustration"
                />
              </div>
              <button type="button">
                <a href="/contact-us"> Connect With <br /> Us </a>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
