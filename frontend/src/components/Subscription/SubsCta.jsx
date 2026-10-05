import React from 'react'
import Subscriptions from './Subscriptions';

function SubsCta() {
  return (
    <>
     <section className="cta-style-two bg-color-1 centred">
  <div className="pattern-layer" style={{backgroundImage: 'url(assets/images/shape/shape-46.png)'}} />
  <div className="auto-container">
    <div className="inner-box">
      <h2>Subscription inquiry, Any questions?</h2>
      <p>Inquire with Confidence, Excel with Service.</p>
      <ul className="info-list">
        <li>
          <span>Mail us!</span>
          <h5><a href="mailto:sendmail@example.com">support@foliomax.in
</a></h5>
        </li>
        {/* <li>
          <span>Call us!</span>
          <h5><a href="tel:1800766123456">+91 88992 28718</a></h5>
        </li> */}
      </ul>
      <a href="/contact-us" className="theme-btn btn-two"><span>Contact Us</span></a>
    </div>
  </div>
</section>

    </>
  )
}

export default SubsCta