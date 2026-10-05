import React, { useEffect, useMemo, useState } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const TABS = [
  {
    key: "education",
    label: "Education",
  },
  {
    key: "training",
    label: "Training",
  },
  {
    key: "marketing",
    label: "Marketing",
  },
  {
    key: "other",
    label: "Other",
  },
];

function Vedios() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("education");

  // ---------------- FETCH VIDEOS ----------------

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_BASE}/foliomax/public/video/public?tags=${activeTab}`
        );

        const json = await res.json();

        console.log("VIDEOS:", json);

        if (json.ok && Array.isArray(json.data)) {
          setVideos(json.data);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [activeTab]);

  // ---------------- FORMAT TITLE ----------------

  const formatTitle = (title = "") => {
    return title
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // ---------------- DYNAMIC FONT SIZE ----------------

  const getTitleStyle = (title) => {
    const len = title.length;

    if (len <= 18) {
      return {
        fontSize: 34,
        lineHeight: 1.25,
      };
    }

    if (len <= 35) {
      return {
        fontSize: 28,
        lineHeight: 1.3,
      };
    }

    if (len <= 55) {
      return {
        fontSize: 22,
        lineHeight: 1.35,
      };
    }

    return {
      fontSize: 18,
      lineHeight: 1.4,
    };
  };

  return (
    <>
      <section className="course-section centred sec-pad">
        <div className="auto-container">

          {/* ---------------- TITLE ---------------- */}

          <div className="sec-title centred">
            <h6>Courses Offered</h6>
            <h2>Begin with these courses</h2>
          </div>

          {/* ---------------- TABS ---------------- */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 55,
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "13px 30px",
                  borderRadius: 999,
                  border:
                    activeTab === tab.key
                      ? "1px solid #324e31"
                      : "1px solid #e5e7eb",

                  background:
                    activeTab === tab.key
                      ? "#324e31"
                      : "#ffffff",

                  color:
                    activeTab === tab.key
                      ? "#ffffff"
                      : "#111827",

                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  transition: "0.3s ease",
                  boxShadow:
                    activeTab === tab.key
                      ? "0 8px 20px rgba(50,78,49,0.25)"
                      : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ---------------- LOADING ---------------- */}

          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: "50px 0",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Loading videos...
            </div>
          )}

          {/* ---------------- EMPTY ---------------- */}

          {!loading && videos.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "50px 0",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              No videos found
            </div>
          )}

          {/* ---------------- VIDEOS ---------------- */}

          {!loading && videos.length > 0 && (
            <Swiper
              modules={[Navigation]}
              navigation
              pagination={{ clickable: true }}
              spaceBetween={35}
              slidesPerView={1}
              breakpoints={{
                768: { slidesPerView: 2 },
                1200: { slidesPerView: 3 },
              }}
            >
              {videos.map((video) => {
                const rawTitle =
                  video.originalName ||
                  video.title ||
                  "Uploaded Video";

                const formattedTitle = formatTitle(rawTitle);

                return (
                  <SwiperSlide key={video.id}>
                    <div className="course-block-one">
                      <div
                        className="inner-box"
                        style={{
                          borderRadius: 24,
                          overflow: "hidden",
                          background: "#fff",
                          boxShadow:
                            "0 12px 35px rgba(0,0,0,0.06)",
                          transition: "0.3s ease",
                          height: "100%",
                        }}
                      >

                        {/* VIDEO */}

                        <div
                          className="image-box"
                          style={{
                            padding: 12,
                          }}
                        >
                          <video
                            src={video.url}
                            controls
                            style={{
                              width: "100%",
                              height: 250,
                              objectFit: "cover",
                              borderRadius: 18,
                              background: "#000",
                            }}
                          />
                        </div>

                        {/* TAG */}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: 8,
                          }}
                        >
                          <span
                            style={{
                              background: "#f3f4f6",
                              color: "#6b7280",
                              padding: "12px 26px",
                              borderRadius: 999,
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            📘 Uploaded Video
                          </span>
                        </div>

                        {/* CONTENT */}

                        <div
                          style={{
                            padding: "28px 24px 22px",
                            textAlign: "center",
                          }}
                        >

                          {/* TITLE */}

                          <h3
                            style={{
                              ...getTitleStyle(formattedTitle),

                              fontWeight: 800,

                              color: "#111827",

                              marginBottom: 24,

                              wordBreak: "break-word",

                              overflowWrap: "break-word",

                              minHeight: 110,

                              display: "-webkit-box",

                              WebkitLineClamp: 3,

                              WebkitBoxOrient: "vertical",

                              overflow: "hidden",
                            }}
                          >
                            {formattedTitle}
                          </h3>

                          {/* BUTTON */}

                          <a
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,

                              padding: "12px 22px",

                              borderRadius: 999,

                              background: "#324e31",

                              color: "#fff",

                              fontWeight: 700,

                              textDecoration: "none",

                              transition: "0.3s ease",
                            }}
                          >
                            ↪ WATCH
                          </a>

                        </div>

                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
        </div>
      </section>
    </>
  );
}

export default Vedios;