import React from 'react';
import { Link } from 'react-router-dom';
import LearnFeed from './LearnFeed';
import './LearnWithUs.css';

function LearnWithUsMain() {
  return (
    <div className="lwu-page">
      {/* Everything published from the admin panel, newest first */}
      <section className="lwu-section lwu-feed-heading" aria-labelledby="feed-heading">
        <div className="lwu-container">
          <div className="lwu-section-header">
            <h2 id="feed-heading">Latest from <span className="lwu-gradient-text">FolioMax</span></h2>
            <p>
              Every article, insight, video and quiz we publish — all in one
              place, sorted newest first.
            </p>
          </div>

          <LearnFeed />
        </div>
      </section>

      {/* CTA Section */}
      <section className="lwu-cta-section">
        <div className="lwu-container">
          <div className="lwu-cta-card">
            <div className="lwu-cta-content">
              <h2>Want to Contribute?</h2>
              <p>Share your financial expertise with our community. Write blogs, create quizzes, or contribute insights.</p>
            </div>
            <Link to="/contact-us" className="lwu-cta-btn">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LearnWithUsMain;