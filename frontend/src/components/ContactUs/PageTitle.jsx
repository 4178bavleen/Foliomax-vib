import React from "react";

function PageTitle() {
  return (
    <>
      <section className="page-title">
        <div
          className="bg-layer"
          style={{
            backgroundImage:
              "url(assets/images/background/page-title.jpg)",
          }}
        />

        <div className="auto-container">

          {/* ---------------- TITLE ---------------- */}

          <div className="content-box">
            <h1>Contact Us</h1>

            <ul className="bread-crumb clearfix">
              <li>
                <a href="/">Home</a>
              </li>

              <li>
                <span>Contact</span>
              </li>
            </ul>
          </div>

          {/* ---------------- CONTACT CARDS ---------------- */}

          <div className="info-content centred">
            <div className="row clearfix">

              {/* ---------- TELEGRAM / COMMUNITY ---------- */}

              <div className="col-lg-3 col-md-6 col-sm-12 info-block">
                <div className="info-block-one">
                  <div className="inner-box">

                    <div className="icon-box">
                      <img
                        src="assets/images/icons/icon-95.png"
                        alt="community"
                      />
                    </div>

                    <h5>Join Our Community</h5>

                    <p>
                      Get market updates & announcements instantly.
                    </p>

                    <div className="phone-box">
                      <a
                        href="https://t.me/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="theme-btn btn-two"
                      >
                        <span>Join Telegram</span>
                      </a>
                    </div>

                  </div>
                </div>
              </div>

              {/* ---------- WHATSAPP CHAT ---------- */}

              <div className="col-lg-3 col-md-6 col-sm-12 info-block">
                <div className="info-block-one">
                  <div className="inner-box">

                    <div className="icon-box">
                      <img
                        src="assets/images/icons/icon-96.png"
                        alt="chat"
                      />
                    </div>

                    <h5>Chat with Expert</h5>

                    <p>
                      Live chat with our trading & investment specialists.
                    </p>

                    <div className="phone-box">
                      <a
                        href="https://wa.me/918899228718"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="theme-btn btn-two"
                      >
                        <span>Start Chat</span>
                      </a>
                    </div>

                  </div>
                </div>
              </div>

              {/* ---------- QUICK CONTACT ---------- */}

              <div className="col-lg-6 col-md-12 col-sm-12 info-block">
                <div className="info-block-two">
                  <div className="inner-box">

                    <h5>Quick Contact</h5>

                    <ul className="list-item">

                      {/* EMAIL */}

                      <li>
                        <a href="mailto:support@foliomax.in">
                          <i className="flaticon-open-envelope" />
                          support@foliomax.in
                        </a>
                      </li>

                      {/* PHONE */}

                      <li>
                        <a href="tel:+918899228718">
                          <i className="flaticon-phone-call" />
                          +91 88992 28718
                        </a>
                      </li>

                    </ul>

                    {/* BUSINESS HOURS */}

                    <h4>Business Hours</h4>

                    <p>
                      <span>Mon - Friday :</span> 9 am to 5 pm
                      <br />
                      <span>Saturday :</span> 10 am to 1 pm
                    </p>

                    {/* WHATSAPP */}

                    <h6>
                      <img
                        src="assets/images/icons/icon-97.png"
                        alt="whatsapp"
                      />

                      <a
                        href="https://wa.me/918899228718"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp Support
                      </a>
                    </h6>

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

export default PageTitle;