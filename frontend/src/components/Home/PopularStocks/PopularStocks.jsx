import React, { useEffect, useState } from "react";
import axios from "axios";
import StockTickerCard from "./StockTickerCard";
import "./popularStocks.css";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

// API base (Vite)
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function PopularStocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/popular-stock/yahoo-ticker`,
        {
          params: {
            symbols:
              "RELIANCE.NS," +
              "TCS.NS," +
              "INFY.NS," +
              "HDFCBANK.NS," +
              "ICICIBANK.NS," +
              "SBIN.NS," +
              "BHARTIARTL.NS," +
              "ITC.NS",
          },
        }
      );

      setStocks(res.data);
    } catch (error) {
      console.error("Market fetch failed:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="market-section">
      <div className="auto-container">
        <div className="sec-title">
          <h6>Market Overview</h6>
          <h2>Popular Indian Stocks</h2>
        </div>

        {loading ? (
          <p>Loading market data…</p>
        ) : (
          <Swiper
            modules={[Autoplay]}
            spaceBetween={20}
            slidesPerView={4}
            loop={true}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            breakpoints={{
              320: {
                slidesPerView: 1.2,
              },
              576: {
                slidesPerView: 2,
              },
              768: {
                slidesPerView: 3,
              },
              1024: {
                slidesPerView: 4,
              },
            }}
          >
            {stocks.map((stock) => (
              <SwiperSlide key={stock.symbol}>
                <StockTickerCard stock={stock} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
