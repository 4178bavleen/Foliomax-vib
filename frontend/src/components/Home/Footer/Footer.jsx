import React from 'react';

const Footer = () => {
  return (
    <>
      {/* footer-style-two */}
      <footer className="footer-style-two bg-color-4">
        <div className="widget-section">
          <div
            className="pattern-layer"
            style={{ backgroundImage: 'url(/assets/images/shape/shape-15.png)' }}
          ></div>

          <div className="auto-container">
            <div className="row clearfix">
              {/* Column 1 */}
              <div className="col-lg-4 col-md-6 col-sm-12 footer-column">
                <div className="footer-widget logo-widget">
                  <figure className="footer-logo">
                    <a href="/">
                      <img src="/assets/images/updated-logo.svg" alt="Fxvibe" className="footer-logo" />
                    </a>
                  </figure>
                  <p>Take a look at ratings to gauge our performance and customer satisfaction.</p>
                  <h5>Rated 4.9/5</h5>
                  <ul className="rating">
                    <li><i className="flaticon-rate-star-button"></i></li>
                    <li><i className="flaticon-rate-star-button"></i></li>
                    <li><i className="flaticon-rate-star-button"></i></li>
                    <li><i className="flaticon-rate-star-button"></i></li>
                    <li><i className="flaticon-rate-star-button"></i></li>
                  </ul>
                  <h6>Reviewed by 1.5 million investors & traders on Trustpilot.</h6>
                  {/* <a href="/" className="theme-btn btn-two">
                    <span>Read Reviews</span>
                  </a> */}
                </div>
              </div>

              {/* Column 2 */}
              <div className="col-lg-4 col-md-6 col-sm-12 footer-column">
                <div className="footer-widget links-widget">
                  <div className="widget-title">
                    <h3>Useful Links</h3>
                  </div>
                  <div className="widget-content">
                    <div className="row clearfix">
                      <div className="col-lg-6 col-md-6 col-sm-12 list-column">
                        <ul className="links-list clearfix">
                          <li><a href="/">Home</a></li>
                          <li><a href="/quiz">Quiz</a></li>
                          {/* <li><a href="/">History</a></li>
                          <li><a href="/our-team">Our Team</a></li> */}
                          {/* <li><a href="/">Trading Rules</a></li> */}
                          <li><a href="/blogs">Blogs</a></li>
                          <li><a href="/faqs">Faq’s</a></li>
                          {/* <li><a href="/contact-us">Help Center</a></li> */}
                        </ul>
                      </div>

                      {/* <div className="col-lg-6 col-md-6 col-sm-12 list-column">
                        <ul className="links-list clearfix">
                          <li><a href="index-2.html">Markets</a></li>
                          <li><a href="index-2.html">Evaluations</a></li>
                          <li><a href="index-2.html">Affiliates</a></li>
                          <li><a href="index-2.html">Pricing</a></li>
                          <li><a href="index-2.html">Get Funded</a></li>
                          <li><a href="index-2.html">Course</a></li>
                          <li><a href="index-2.html">Live Chat</a></li>
                        </ul>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="col-lg-4 col-md-6 col-sm-12 footer-column">
                <div className="footer-widget contact-widget">
                  <div className="widget-title">
                    <h3>Support</h3>
                  </div>
                  <div className="widget-content">
                    <p>Find our office!</p>
                    <span className="address">
  Dulapally, Secunderabad<br />
  Telangana – PIN 500014
</span>
                    <p>Prefer emailing us!</p>
                    <h5>
                      <a href="mailto:support@foliomax.in">support@foliomax.in</a>
                    </h5>
                    {/* <p>Prefer call us!</p>
                    <h5>
                      <a href="tel:18007661234">+91 88992 28718</a>
                    </h5> */}
                    <ul className="social-links clearfix">
                      <li><a href="/"><i className="flaticon-facebook"></i></a></li>
                      {/* <li><a href="/"><i className="flaticon-user"></i></a></li> */}
                      <li><a href="/"><i className="flaticon-instagram-logo"></i></a></li>
                      {/* <li><a href="/"><i className="flaticon-video-camera"></i></a></li> */}
                      {/* <li><a href="/"><i className="flaticon-youtube"></i></a></li> */}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer-bottom */}
        <div className="footer-bottom">
          <div className="auto-container">
            <div className="bottom-inner">
              <div className="copyright">
                <p>
                  &copy; 2023 <a href="/">Foliomax</a> 
                </p>
              </div>
              <ul className="footer-nav">
                <li><a href="/privacy-policy">Privacy Policy</a></li>
                <li><a href="/terms-conditions">Terms & Conditions</a></li>
                {/* <li><a href="/legal">Legal</a></li> */}
              </ul>
            </div>
          </div>
        </div>
      </footer>
      {/* footer-style-two end */}
    </>
  );
};

export default Footer;
