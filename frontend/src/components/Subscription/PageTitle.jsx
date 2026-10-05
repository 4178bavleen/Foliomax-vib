import React from 'react'
import Subscriptions from './Subscriptions';

function PageTitle() {
  return (
    <>
    <section className="page-title">
  <div className="bg-layer" style={{backgroundImage: 'url(assets/images/background/page-title.jpg)'}} />
  <div className="auto-container">
    <div className="content-box">
      <h1>Subscriptions</h1>
      <ul className="bread-crumb clearfix">
        <li><a href="/">Home</a></li>
        <li>Subscription</li>
        <li><span>Overview</span></li>
      </ul>
    </div>
  </div>
</section>

    </>
  )
}

export default PageTitle