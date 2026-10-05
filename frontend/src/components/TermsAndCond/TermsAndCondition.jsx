import React from "react";
import './Terms.css'
function TermsAndConditions() {
  return (
    <div className="privacy-wrapper">{/* reuse same wrapper styles */}
      {/* Page Heading */}
      <section className="page-header">
        <div className="auto-container">
          <h1 className="page-title">Terms &amp; Conditions</h1>
          <p className="subtitle">
            These Terms &amp; Conditions govern your use of the FolioMax platform,
            tools, and services. Please read them carefully before using our website
            or creating an account.
          </p>
          <p className="updated">
            Last updated: <strong>November 2025</strong>
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="content-section">
        <div className="auto-container row">
          {/* LEFT CONTENT */}
          <div className="col-lg-8 col-md-12">
            {/* Intro */}
            <div className="policy-block" id="overview">
              <h2>Welcome to FolioMax</h2>
              <p>
                By accessing or using FolioMax (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;),
                you agree to be bound by these Terms &amp; Conditions and our Privacy Policy.
                If you do not agree, please do not use our Services.
              </p>
            </div>

            {/* 1. Acceptance */}
            <div className="policy-block" id="acceptance">
              <h3>1. Acceptance of Terms</h3>
              <p>
                By using our website, dashboard, tools, or any related services
                (collectively, the &quot;Services&quot;), you confirm that:
              </p>
              <ul className="clean-list">
                <li>You are at least 18 years of age or legally eligible to use our Services.</li>
                <li>
                  You have read, understood, and agree to be bound by these Terms &amp; Conditions.
                </li>
                <li>
                  If you are using FolioMax on behalf of a company or organization,
                  you have the authority to bind that entity to these Terms.
                </li>
              </ul>
            </div>

            {/* 2. Use of Services */}
            <div className="policy-block" id="use">
              <h3>2. Use of the FolioMax Platform</h3>
              <p>You agree to use FolioMax only for lawful purposes and in a responsible way.</p>
              <ul className="clean-list">
                <li>
                  You will not misuse our tools, dashboards, or content for illegal or
                  unauthorized activities.
                </li>
                <li>
                  You will not attempt to interfere with the security, performance, or
                  availability of the platform.
                </li>
                <li>
                  You will not reverse engineer, copy, or resell our Services without
                  written permission.
                </li>
              </ul>
            </div>

            {/* 3. Accounts & Security */}
            <div className="policy-block" id="accounts">
              <h3>3. Accounts &amp; Security</h3>
              <ul className="clean-list">
                <li>You are responsible for maintaining the confidentiality of your login details.</li>
                <li>
                  Any activity that occurs under your account is your responsibility, whether
                  or not you authorized it.
                </li>
                <li>
                  Notify us immediately if you believe your account has been accessed
                  without permission.
                </li>
              </ul>
            </div>

            {/* 4. Subscription & Billing */}
            <div className="policy-block" id="billing">
              <h3>4. Subscription, Plans &amp; Billing</h3>
              <ul className="clean-list">
                <li>
                  Access to certain features may require a paid subscription or plan.
                </li>
                <li>
                  All prices, plans, and features are subject to change, and we will make
                  reasonable efforts to notify you of significant changes.
                </li>
                <li>
                  You are responsible for ensuring that your billing information is accurate
                  and up to date.
                </li>
              </ul>
            </div>

            {/* 5. Trading & Risk Disclaimer */}
            <div className="policy-block" id="risk">
              <h3>5. Trading &amp; Risk Disclaimer</h3>
              <p>
                FolioMax may provide tools, analytics, or educational content related to
                financial markets. However:
              </p>
              <ul className="clean-list">
                <li>We do not provide investment, legal, or financial advice.</li>
                <li>
                  Any trading or investment decisions you make are at your own risk.
                </li>
                <li>
                  Past performance is not indicative of future results, and you may lose capital.
                </li>
              </ul>
            </div>

            {/* 6. Intellectual Property */}
            <div className="policy-block" id="ip">
              <h3>6. Intellectual Property</h3>
              <p>
                All content, design, logos, and software on FolioMax are owned by us
                or our licensors and are protected by copyright and other IP laws.
              </p>
              <ul className="clean-list">
                <li>
                  You may use the platform solely for your personal or authorized business use.
                </li>
                <li>
                  You may not copy, modify, distribute, or create derivative works without
                  our written consent.
                </li>
              </ul>
            </div>

            {/* 7. Third-Party Links */}
            <div className="policy-block" id="thirdparty">
              <h3>7. Third-Party Links &amp; Services</h3>
              <p>
                Our Services may contain links or integrations with third-party platforms
                (such as brokers, payment gateways, or analytics tools).
              </p>
              <ul className="clean-list">
                <li>We do not control and are not responsible for third-party content.</li>
                <li>
                  Your use of any third-party service is subject to their own terms and policies.
                </li>
              </ul>
            </div>

            {/* 8. Limitation of Liability */}
            <div className="policy-block" id="liability">
              <h3>8. Limitation of Liability</h3>
              <p>
                To the fullest extent permitted by law, FolioMax is not liable for any
                indirect, incidental, or consequential damages arising from your use of
                the platform, including loss of profits, data, or trading losses.
              </p>
            </div>

            {/* 9. Termination */}
            <div className="policy-block" id="termination">
              <h3>9. Termination</h3>
              <p>
                We may suspend or terminate your access to the Services if you violate
                these Terms, misuse the platform, or engage in fraudulent or harmful activity.
              </p>
              <p>
                You may stop using FolioMax at any time. Some obligations (such as payment
                of outstanding fees or legal responsibilities) may continue after termination.
              </p>
            </div>

            {/* 10. Changes to Terms */}
            <div className="policy-block" id="changes">
              <h3>10. Changes to These Terms</h3>
              <p>
                We may update these Terms &amp; Conditions from time to time. When we do,
                we will update the &quot;Last updated&quot; date at the top of this page.
                Continued use of FolioMax after changes are posted means you accept
                the revised Terms.
              </p>
            </div>

            {/* 11. Contact */}
            <div className="policy-block" id="contact">
              <h3>11. Contact Us</h3>
              <p>If you have any questions about these Terms &amp; Conditions, contact us at:</p>
              <div className="contact-box">
                <p>
                  <strong>Email:</strong> support@foliomax.com
                </p>
                <p>
                  <strong>Location:</strong> Dulapally, Hyderabad, Telangana, India
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="col-lg-4 col-md-12">
            <aside className="side-nav">
              <h4>Quick Navigation</h4>
              <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#acceptance">Acceptance of Terms</a></li>
                <li><a href="#use">Use of FolioMax</a></li>
                <li><a href="#accounts">Accounts &amp; Security</a></li>
                <li><a href="#billing">Subscription &amp; Billing</a></li>
                <li><a href="#risk">Trading &amp; Risk</a></li>
                <li><a href="#ip">Intellectual Property</a></li>
                <li><a href="#thirdparty">Third-Party Links</a></li>
                <li><a href="#liability">Limitation of Liability</a></li>
                <li><a href="#termination">Termination</a></li>
                <li><a href="#changes">Changes to Terms</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="theme-btn btn-two"
                style={{ marginTop: "20px" }}
              >
                Back to Top
              </button>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TermsAndConditions;
