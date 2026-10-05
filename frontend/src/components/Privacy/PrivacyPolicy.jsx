import React from "react";
import "./PrivacyPolicy.css";

function PrivacyPolicy() {
  return (
    <div className="privacy-wrapper">
      <div className="auto-container">
        <div className="privacy-card">
          <div className="privacy-layout">
            {/* MAIN CONTENT */}
            <main className="privacy-main">
              <div className="policy-header">
                <p className="privacy-kicker">FOLIOMAX · PRIVACY</p>
                <h1 className="privacy-main-title">Your Data, Your Control</h1>
                <p className="privacy-subtitle">
                  This Privacy Policy explains how FolioMax (“we”, “our”, “us”)
                  collects, uses, and protects your information when you use our
                  website, dashboard, and any related services (collectively,
                  the “Services”).
                </p>
                <p className="privacy-updated">
                  Last updated: <strong>November 2025</strong>
                </p>
              </div>

              {/* 1. Information We Collect */}
              <section id="info" className="policy-block">
                <p className="policy-number">01</p>
                <h2 className="policy-title">Information We Collect</h2>
                <p className="policy-text">
                  We collect information to provide you with a smooth, secure,
                  and personalized experience on FolioMax.
                </p>
                <ul className="policy-list">
                  <li>
                    <strong>Account Information:</strong> Name, email address,
                    phone number, and password when you create or manage your
                    FolioMax account.
                  </li>
                  <li>
                    <strong>Profile Details:</strong> Optional data you share
                    such as city, country, or professional details.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Pages you visit, features you
                    use, time spent on the platform, and analytics to improve
                    performance.
                  </li>
                  <li>
                    <strong>Transaction &amp; Subscription Data:</strong> Plan
                    selected, billing history, and payment method (handled
                    securely by trusted third-party payment gateways).
                  </li>
                  <li>
                    <strong>Communication Data:</strong> Messages you send via
                    contact forms, support chat, email, or other communication
                    channels.
                  </li>
                </ul>
              </section>

              {/* 2. How We Use Your Information */}
              <section id="use" className="policy-block">
                <p className="policy-number">02</p>
                <h2 className="policy-title">How We Use Your Information</h2>
                <p className="policy-text">
                  We use your information only for legitimate business purposes
                  and to deliver the best trading analytics experience.
                </p>
                <ul className="policy-list">
                  <li>To create, manage, and secure your FolioMax account.</li>
                  <li>To process logins, subscriptions, and payments.</li>
                  <li>
                    To personalize dashboards, insights, and educational
                    content.
                  </li>
                  <li>
                    To send important notifications such as service updates,
                    policy changes, and security alerts.
                  </li>
                  <li>
                    To detect, prevent, and investigate fraud, abuse, or
                    security issues.
                  </li>
                  <li>To comply with applicable laws and regulations.</li>
                </ul>
              </section>

              {/* 3. Cookies & Tracking */}
              <section id="cookies" className="policy-block">
                <p className="policy-number">03</p>
                <h2 className="policy-title">Cookies &amp; Tracking</h2>
                <p className="policy-text">
                  FolioMax uses cookies and similar technologies to:
                </p>
                <ul className="policy-list">
                  <li>Keep you signed in and maintain session security.</li>
                  <li>Remember your preferences and settings.</li>
                  <li>
                    Understand how the platform is used so we can improve
                    features and performance.
                  </li>
                </ul>
                <p className="policy-text">
                  You can manage or disable cookies through your browser
                  settings, but some features may not function properly if you
                  do so.
                </p>
              </section>

              {/* 4. Sharing Information */}
              <section id="share" className="policy-block">
                <p className="policy-number">04</p>
                <h2 className="policy-title">How We Share Your Information</h2>
                <p className="policy-text">
                  We do <strong>not</strong> sell your personal data. We may
                  share limited information only in the following situations:
                </p>
                <ul className="policy-list">
                  <li>
                    <strong>Service Providers:</strong> With trusted partners
                    who help us with hosting, analytics, messaging, and payment
                    processing—strictly under data protection agreements.
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required to do so
                    by law, regulation, or legal process.
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In connection with any
                    merger, acquisition, or sale of assets, where user data may
                    be part of the transferred assets.
                  </li>
                </ul>
              </section>

              {/* 5. Data Security */}
              <section id="security" className="policy-block">
                <p className="policy-number">05</p>
                <h2 className="policy-title">Data Security</h2>
                <p className="policy-text">
                  We use industry-standard security practices to protect your
                  data, including encryption, access controls, and continuous
                  monitoring. While no system is completely secure, we work
                  hard to keep your information safe and review our safeguards
                  regularly.
                </p>
              </section>

              {/* 6. Your Rights */}
              <section id="rights" className="policy-block">
                <p className="policy-number">06</p>
                <h2 className="policy-title">Your Rights</h2>
                <p className="policy-text">
                  Depending on your location, you may have the right to:
                </p>
                <ul className="policy-list">
                  <li>Request access to the personal data we hold about you.</li>
                  <li>Ask us to correct inaccurate or incomplete data.</li>
                  <li>
                    Request deletion of your data, where applicable and
                    legally permitted.
                  </li>
                  <li>
                    Object to or restrict certain types of processing, such as
                    marketing communications.
                  </li>
                  <li>Export your data in a portable format, where required.</li>
                </ul>
              </section>

              {/* 7. Contact Us */}
              <section id="contact" className="policy-block">
                <p className="policy-number">07</p>
                <h2 className="policy-title">Contact Us</h2>
                <p className="policy-text">
                  If you have any questions about this Privacy Policy or how
                  we handle your data, you can contact us at:
                </p>
                <p className="policy-text">
                  <strong>Email:</strong> support@foliomax.com
                  <br />
                  <strong>Location:</strong> Dulapally, Hyderabad, Telangana,
                  India
                </p>
              </section>
            </main>

            {/* SIDEBAR */}
            <aside className="privacy-sidebar">
              <div className="side-nav">
                <h3 className="side-nav-title">Quick Navigation</h3>
                <ul>
                  <li>
                    <a href="#info">Information We Collect</a>
                  </li>
                  <li>
                    <a href="#use">How We Use Your Data</a>
                  </li>
                  <li>
                    <a href="#cookies">Cookies &amp; Tracking</a>
                  </li>
                  <li>
                    <a href="#share">Sharing Information</a>
                  </li>
                  <li>
                    <a href="#security">Data Security</a>
                  </li>
                  <li>
                    <a href="#rights">Your Rights</a>
                  </li>
                  <li>
                    <a href="#contact">Contact Us</a>
                  </li>
                </ul>

                <div className="sidebar-box">
                  <strong>We Respect Your Privacy</strong>
                  FolioMax is built for transparency and trust. Your trading
                  data, analytics, and personal details are handled with care.
                </div>

                <button
                  type="button"
                  className="theme-btn btn-two privacy-back-top"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  Back to Top
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
