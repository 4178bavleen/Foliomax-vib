import React, { useState } from "react";

export default function SubsFAQ() {
  const [activeIndex, setActiveIndex] = useState(0); // manage which question is open

 const faqs = [
  {
    question: "What subscription plans does Foliomax offer?",
    answer:
      "Foliomax offers three plans: Basic, Premium, and Pro. Each plan includes different levels of stock insights, curated lists, premium research, and advanced tools. You can choose the plan that best fits your investment journey."
  },
  {
    question: "Can I use Foliomax for free?",
    answer:
      "Yes. Foliomax offers limited free access where users can explore basic stock lists, insights, and tools. To unlock advanced analytics, premium stock picks, and in-depth research, you can upgrade to a paid plan."
  },
  {
    question: "What payment methods do you support?",
    answer:
      "We support UPI, debit/credit cards, net banking, and most major digital wallets. Payments are securely processed through trusted payment gateways."
  },
  {
    question: "Is my subscription auto-renewed?",
    answer:
      "Yes. All Foliomax subscriptions renew automatically to ensure uninterrupted access. You will be notified before each renewal, and you can turn off auto-renewal anytime from your account settings."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely. You can cancel your subscription at any time directly from your dashboard. After cancellation, you will continue to have access until your current billing cycle ends."
  },
  {
    question: "Do I get a refund if I cancel early?",
    answer:
      "Foliomax does not offer partial refunds for mid-cycle cancellations. However, you will retain full access to premium features until your billing period ends."
  },
  {
    question: "Can I switch between plans?",
    answer:
      "Yes. You can upgrade or downgrade your plan anytime. Upgrades are applied instantly, and downgrades take effect at the start of your next billing cycle."
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Absolutely. Foliomax uses industry-standard encryption and PCI-DSS-certified payment processors to ensure your financial data is protected at all times."
  },
  {
    question: "Do you offer student or long-term discounts?",
    answer:
      "Yes, we occasionally offer special discounts on annual plans and for students. Keep an eye on your dashboard or email for active promotions."
  },
  {
    question: "What happens if a payment fails during renewal?",
    answer:
      "If your renewal payment fails, we will notify you immediately and retry processing. You’ll have a short grace period to update your payment method before your premium access is paused."
  }
];

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
                  src="/assets/images/lady-image.png"
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
              {/* <div className="curve-text">
                <div className="link">
                  <a href="index-2.html">
                    <i className="flaticon-right-arrow-1"></i>
                  </a>
                </div>
                <span className="curved-circle-2">
                  ask your questions to experts&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              </div> */}
            </div>
          </div>

          {/* Right Content Column */}
          <div className="col-lg-6 col-md-12 col-sm-12 content-column">
            <div className="content-box">
              <div className="sec-title">
                <h6>Faq’s</h6>
                <h2>Common queries & solutions</h2>
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
