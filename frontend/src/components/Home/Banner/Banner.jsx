import React from 'react'

function Banner() {
  return (
    <>
    <section className="banner-style-four">
  <div className="pattern-layer">
    <div className="pattern-1" style={{backgroundImage: 'url(assets/images/shape/shape-23.png)'}} />
    <div className="pattern-2" style={{backgroundImage: 'url(assets/images/shape/shape-24.png)'}} />
  </div>
  <div className="outer-container">
    <div className="inner-box">
      <div className="content-box">
        {/* <div className="video-btn">
          <a href="https://www.youtube.com/watch?v=nfP5N9Yc72A&t=28s" className="lightbox-image" data-caption><i className="flaticon-play-buttton" /></a>
        </div> */}
        <h2>Market Data Made Visual.<br/> Investment Decisions Made Simple. </h2>
        
        <p>Foliomax is a premier financial insights platform that bridges the gap between complex data and confident decisions.<br/>By transforming real-time NSE market information into intuitive visuals, we help you track trends and analyze stocks with total clarity.From projecting wealth via smart calculators to managing long-term goals, we provide the data-driven edge you need to succeed.
</p>
        <div className="list-inner">
          <div className="shape" style={{backgroundImage: 'url(assets/images/shape/shape-22.png)'}} />
          <ul className="list-style-two clearfix">
  <li>Portfolio Performance Tracking</li>
  <li>Risk & Volatility Assessment</li>
</ul>

        </div>
        {/* <div className="btn-box"><a href="" className="theme-btn btn-two"><span>Start Trading</span></a></div> */}
      </div>
      <div className="image-box">
        <figure className="image"><img src="assets/images/mockup-2.png" alt /></figure>
        <div className="image-content">
          <h6>Last Year Winnig Ratio</h6>
          <h3>84.65%</h3>
          <p><i className="flaticon-right-up" />+6.39%</p>
          <div className="bar"><img src="assets/images/icons/bar-3.png" alt /></div>
        </div>
        <div className="market-comparison">
          <h6>Market Comparison</h6>
          <figure className="chart"><img src="assets/images/icons/chart-1.png" alt /></figure>
          <ul className="list-item">
            <li>Option 1</li>
            <li>Option 2</li>
          </ul>
          <h5>Value</h5>
          <h3>$42,4670</h3>
        </div>
      </div>
    </div>
    <div className="rating-box centred">
      <div className="inner">
        <div className="icon-box"><img src="assets/images/icons/icon-46.png" alt /></div>
        <h3>Trustpilot</h3>
        <h5><i className="flaticon-rate-star-button" /><i className="flaticon-rate-star-button" />Best Rated<i className="flaticon-rate-star-button" /><i className="flaticon-rate-star-button" /></h5>
        <p>from 1.5 million traders</p>
        <span>4.9/5</span>
      </div>
    </div>
  </div>
</section>

    </>
  )
}

export default Banner