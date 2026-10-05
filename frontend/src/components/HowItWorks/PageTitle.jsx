import React from 'react'

function PageTitle() {
  return (
    <>
    <section className="page-title">
  <div className="bg-layer" style={{backgroundImage: 'url(assets/images/background/page-title.jpg)'}} />
  <div className="auto-container">
    <div className="content-box">
      <h1>How It Works</h1>
      <ul className="bread-crumb clearfix">
        <li><a href="index.html">Home</a></li>
        <li>About</li>
        <li><span>How It Works</span></li>
      </ul>
    </div>
  </div>
</section>

    </>
  )
}

export default PageTitle