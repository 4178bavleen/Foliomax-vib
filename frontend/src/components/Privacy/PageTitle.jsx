import React from 'react'

function PageTitle() {
  return (
    <>
    <section className="page-title">
  <div className="bg-layer" style={{backgroundImage: 'url(assets/images/bread-crumb.jpg)'}} />
  <div className="auto-container">
    <div className="content-box">
      <h1>Privacy Policy</h1>
      <ul className="bread-crumb clearfix">
        <li><a href="index.html">Home</a></li>
        <li><span>Privacy Policy</span></li>
      </ul>
    </div>
  </div>
</section>

    </>
  )
}

export default PageTitle