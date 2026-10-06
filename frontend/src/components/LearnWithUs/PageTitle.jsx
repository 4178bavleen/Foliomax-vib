import React from 'react';
import './LearnWithUs.css';

function PageTitle() {
  return (
    <section className="page-title lwu-page-title">
      <div className="bg-layer" style={{ backgroundImage: 'url(/assets/images/background/page-title.jpg)' }} />
      <div className="bg-layer-overlay" />
      <div className="lwu-container">
        <div className="lwu-header">
          <h1>Learn <span className="lwu-gradient-text">With Us</span></h1>
          <p className="lwu-subtitle">
            Explore, learn, and improve your financial knowledge .
          </p>
          <ul className="lwu-breadcrumb">
            <li><a href="/">Home</a></li>
            <li><span>Learn With Us</span></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default PageTitle;