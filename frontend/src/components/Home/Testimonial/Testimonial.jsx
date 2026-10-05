import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Testimonial() {
  const testimonials = [
    {
      name: "Rohan Mehra",
      designation: "Director @ Kanha Securities",
      image: "/assets/images/resource/testimonial-1.png",
      title: "Experience like never before",
      feedback:
        "Foliomax delivers clean Excel-backed signals and trade notes — a trustworthy companion for active traders.",
      rating: 5,
    },
    {
      name: "Priya Kapoor",
      designation: "Founder, Banyan Advisory",
      image: "/assets/images/resource/testimonial-2.png",
      title: "Made simple and efficient!",
      feedback:
        "Their Excel workflows and watchlists made research faster; the platform helps balance conviction with risk.",
      rating: 5,
    },
    {
      name: "Arjun Singh",
      designation: "Equity Analyst, Verity Capital",
      image: "/assets/images/resource/testimonial-1.png",
      title: "Truly reliable platform!",
      feedback:
        "Foliomax gave me a smooth experience with accurate insights, timely alerts and concise model outputs.",
      rating: 5,
    },
  ];

  return (
    <section className="testimonial-section sec-pad">
      <div className="auto-container">
        {/* Section Header */}
        <div className="sec-title centred">
          <h6>Testimonials</h6>
          <h2>The Foliomax Success Stories.</h2>
        </div>

        {/* Header Box */}
        <div className="upper-box">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-12 col-sm-12 left-column">
              <div className="left-content">
                <h3>
                  <img
                    src="/assets/images/icons/icon-14.png"
                    alt="Trustpilot Icon"
                  />
                  Trustpilot
                </h3>
                <h6>
                  Best-rated <br />
                  4.9/5 <span>(Reviewed by 1.5 million traders.)</span>
                </h6>
              </div>
            </div>

            <div className="col-lg-6 col-md-12 col-sm-12 right-column">
              <div className="right-content">
                <h5>
                  <img
                    src="/assets/images/icons/icon-15.png"
                    alt="Share icon"
                  />
                  Real users. Real experiences. Real results
                </h5>
                {/* <div className="link">
                  <a href="/">
                    <i className="flaticon-right-arrow"></i>
                  </a>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Slider */}
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={30}
          slidesPerView={2}
          // pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={true}
          breakpoints={{
            0: { slidesPerView: 1 },
            768: { slidesPerView: 1 },
            992: { slidesPerView: 2 },
          }}
          className="testimonial-swiper"
        >
          {testimonials.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="testimonial-block-one">
                <div className="inner-box">
                  <div className="author-box">
                    <div className="icon-box">
                      <i className="flaticon-quotation"></i>
                    </div>

                    <figure className="thumb-box">
                      <img src={item.image} alt={item.name} />
                    </figure>

                    <h3>{item.name}</h3>
                    <span className="designation">{item.designation}</span>
                  </div>

                  <div className="text-box">
                    <h5>
                      {item.title}
                      <img
                        src="/assets/images/icons/icon-16.png"
                        alt="rating star"
                      />
                    </h5>
                    <p>{item.feedback}</p>

                    <ul className="rating">
                      {[...Array(item.rating)].map((_, i) => (
                        <li key={i}>
                          <i className="flaticon-rate-star-button"></i>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
