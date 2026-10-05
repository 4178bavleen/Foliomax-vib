import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import "./About.css";

function About() {
  const [content, setContent] = useState(null);
  const API_BASE = import.meta.env.VITE_API_BASE;

  const fallback = {
    mission:
      "Our mission is to provide practical investment education, insights into the business behind stocks, and actionable tools, enabling you to confidently build and manage your own portfolios independently.",
    philosophy:
      "We aim to demystify equity investment by providing clear, fact-based information on listed companies in India. This approach promotes disciplined, informed financial decision-making. Many retail investors chase high-risk opportunities. Our philosophy focuses on sustainable wealth creation through a comprehensive portfolio approach.",
    disclaimer:
      "FOLIOMAX is not a SEBI-registered Investment Adviser..."
  };

  useEffect(() => {
    fetch(`${API_BASE}/foliomax/api/content/about`)
      .then((res) => res.json())
      .then((res) => {
        if (res?.ok && res?.data) {
          setContent(res.data);
        }
      })
      .catch(() => {});
  }, [API_BASE]);

  const mission = content?.mission || fallback.mission;
  const philosophy = content?.philosophy || fallback.philosophy;
  const disclaimer = content?.disclaimer || fallback.disclaimer;

  return (
    <div className="fmax-about-page">
      <div className="fmax-bg-glow-1"></div>
      <div className="fmax-bg-glow-2"></div>

      <section className="fmax-hero-section">
        <div className="fmax-container">
          <div className="fmax-header">
            <h1>
              Welcome to <span className="fmax-gradient-text">Foliomax</span>
            </h1>
            <p className="fmax-subtitle">
              Empowering retail investors across India with data-driven insights.
            </p>
          </div>

          <div className="fmax-main-grid">

            {/* ✅ Mission Card UPDATED */}
            <div className="fmax-glass-card">
              <h3>Our Mission</h3>

              <div
                className="fmax-data-content"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(mission),
                }}
              />

              {/* ✅ NEW PROFESSIONAL IMAGE BLOCK */}
              <div className="fmxv2-mission-img-box">
                <img
                  src="/assets/images/our_mission.jpg"
                  alt="Our Mission"
                  className="fmxv2-mission-img"
                />
                <div className="fmxv2-mission-overlay"></div>
              </div>
            </div>

            {/* Philosophy */}
            <div className="fmax-glass-card">
              <h3>Clarity Over Conjecture</h3>
              <div
                className="fmax-data-content"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(philosophy),
                }}
              />
            </div>

          </div>
        </div>
      </section>

      <br />

      {/* Disclaimer */}
      <section className="fmax-disclaimer-section">
        <div className="fmax-container">
          <div className="fmax-disclaimer-box">
            <div className="fmax-disclaimer-header">
              <span className="fmax-disclaimer-line"></span>
              <h4>Important Disclaimer</h4>
            </div>
            <div
              className="fmax-disclaimer-body"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(disclaimer),
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;