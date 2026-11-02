
import React, { useState, useEffect } from "react";

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/foliomax/public/faq-categories/general`
        );

        const json = await res.json();
        const generalFaqs = json?.data?.faqs || [];

        setFaqs(
          generalFaqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
          }))
        );
      } catch (err) {
        console.error("FAQ fetch error:", err);
      }
    };

    fetchFaqs();
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex((current) =>
      current === index ? null : index
    );
  };

  return (
    <>
      <style>{`
        /* LEFT IMAGE SECTION */

        .fm-faq-left {
          position: relative;
          padding: 16px 0 18px 16px;
          margin-left: 28px;
          min-width: 0;
        }

        .fm-faq-left::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 120px;
          height: 120px;
          border-top: 2px solid #5b9b70;
          border-left: 2px solid #5b9b70;
          pointer-events: none;
        }

        .fm-faq-left::after {
          content: "";
          position: absolute;
          right: -18px;
          bottom: -18px;
          width: 75%;
          height: 75%;
          background: #eaf1e9;
          z-index: 0;
        }

        .fm-faq-left .fm-faq-image-frame {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 570px;
          overflow: hidden;
          border-radius: 5px;
          background: #edf1ed;
        }

        .fm-faq-left .fm-faq-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.5s ease;
        }

        .fm-faq-left .fm-faq-image-frame:hover .fm-faq-image {
          transform: scale(1.025);
        }

        /* COMPACT FLOATING SUPPORT CARD */

        .fm-faq-left .fm-support-card {
          position: absolute;
          z-index: 3;
          left: 0;
          bottom: -18px;
          width: auto;
          min-width: 185px;
          padding: 13px 19px;
          border-radius: 7px;
          background: #174a35;
          box-shadow: 0 10px 25px rgba(18, 53, 37, 0.17);
          display: flex;
          align-items: center;
        }

        .fm-faq-left .fm-support-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }

        .fm-faq-left .fm-support-check {
          width: 27px;
          height: 27px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.55);
          border-radius: 50%;
          color: #fff;
        }

        .fm-faq-left .fm-support-heading h6 {
          margin: 0;
          color: #fff;
          white-space: nowrap;
        }

        /* LEFT RESPONSIVE */

        @media (max-width: 1199px) {
          .fm-faq-left {
            margin-left: 15px;
          }

          .fm-faq-left .fm-faq-image-frame {
            height: 510px;
          }
        }

        @media (max-width: 991px) {
          .fm-faq-left {
            max-width: 650px;
            width: calc(100% - 25px);
            margin: 0 auto 45px;
          }

          .fm-faq-left .fm-faq-image-frame {
            height: 520px;
          }
        }

        @media (max-width: 575px) {
          .fm-faq-left {
            width: calc(100% - 12px);
            padding: 12px 0 18px 12px;
          }

          .fm-faq-left .fm-faq-image-frame {
            height: 390px;
          }

          .fm-faq-left::after {
            right: -10px;
            bottom: -10px;
          }

          .fm-faq-left .fm-support-card {
            left: 0;
            bottom: -12px;
            min-width: 170px;
            padding: 11px 15px;
          }

          .fm-faq-left .fm-support-check {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>

      <section className="faq-section sec-pad">
        <div className="auto-container">
          <div className="row clearfix">

            {/* LEFT IMAGE SECTION */}
            <div className="col-lg-6 col-md-12 col-sm-12 image-column">
              <div className="fm-faq-left">

                <div className="fm-faq-image-frame">
                  <img
                    src="/assets/images/resource/faq-1.png"
                    alt="Financial investment dashboard"
                    className="fm-faq-image"
                  />
                </div>

                <div className="fm-support-card">
                  <div className="fm-support-heading">
                    <span className="fm-support-check">✓</span>
                    <h6>24/7 Support</h6>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT SECTION: ORIGINAL DESIGN */}
            <div className="col-lg-6 col-md-12 col-sm-12 content-column">
              <div className="content-box">
                <div className="sec-title">
                  <h6>Faq’s</h6>
                  <h2>Your Financial Journey, Clearly Explained.</h2>
                </div>

                <ul className="accordion-box">
                  {faqs.map((faq, index) => (
                    <li
                      key={index}
                      className={`accordion block ${
                        activeIndex === index ? "active-block" : ""
                      }`}
                    >
                      <div
                        className={`acc-btn ${
                          activeIndex === index ? "active" : ""
                        }`}
                        onClick={() => toggleFAQ(index)}
                        style={{ cursor: "pointer" }}
                      >
                        <h5>{faq.question}</h5>
                      </div>

                      <div
                        className={`acc-content ${
                          activeIndex === index ? "current" : ""
                        }`}
                        style={{
                          display:
                            activeIndex === index ? "block" : "none",
                        }}
                      >
                        <div className="text">
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
