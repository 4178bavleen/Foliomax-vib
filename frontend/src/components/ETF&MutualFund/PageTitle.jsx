import React from 'react'

function PageTitle() {
  return (
    <>
    <section className="page-title">
  <div className="bg-layer" style={{backgroundImage: 'url(assets/images/background/page-title.jpg)'}} />
  <div className="auto-container">
    <div className="content-box">
      <h1>ETF & Mutual Fund Insights</h1>
      <ul className="bread-crumb clearfix">
        <li><a href="index.html">Home</a></li>
        
        <li><span>About</span></li>
      </ul>
    </div>
  </div>
</section>

    </>
  )
}

export default PageTitle