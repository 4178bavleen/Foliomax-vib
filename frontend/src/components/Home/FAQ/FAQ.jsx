import React, { useState, useEffect } from "react";

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [faqs, setFaqs] = useState([]);

  // Fetch ONLY General FAQ
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/foliomax/public/faq-categories/general`
        );

        const json = await res.json();

        const generalFaqs = json?.data?.faqs || [];

        // map API → UI format
        const mappedFaqs = generalFaqs.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
        }));

        setFaqs(mappedFaqs);
      } catch (err) {
        console.error("FAQ fetch error:", err);
      }
    };

    fetchFaqs();
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section sec-pad">
      <div className="auto-container">
        <div className="row clearfix">
          
          {/* Left Image Column */}
          <div className="col-lg-6 col-md-12 col-sm-12 image-column">
            <div className="image-box">
              <figure className="image">
                <img
                  src="/assets/images/resource/faq-1.png"
                  alt="FAQ Illustration"
                />
              </figure>
              <div className="text">
                <h6>24/7 Support</h6>
              </div>
              <div className="icon-box">
                <img
                  src="/assets/images/icons/icon-29.png"
                  alt="FAQ Icon"
                />
              </div>
            </div>
          </div>

          {/* Right Content Column */}
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
                        display: activeIndex === index ? "block" : "none",
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
  );
}