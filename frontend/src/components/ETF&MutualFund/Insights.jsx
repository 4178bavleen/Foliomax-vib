import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Insights.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function Insights() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [insights, setInsights] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeInsight, setActiveInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestedSlug = searchParams.get("insight");
  // Lets the category effect prefer a deep-linked insight over the first one,
  // without re-fetching whenever the query string changes.
  const requestedSlugRef = useRef(requestedSlug);
  requestedSlugRef.current = requestedSlug;

  // ================= FETCH CATEGORIES =================
  useEffect(() => {
    fetch(`${API_BASE}/foliomax/insights-categories`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.length) {
          setCategories(res.data);
          setActiveCategory(res.data[0].slug);
        }
      });
  }, []);

  // ================= FETCH INSIGHTS BY CATEGORY =================
  useEffect(() => {
    if (!activeCategory) return;

    setLoading(true);
    fetch(`${API_BASE}/foliomax/insights?category=${activeCategory}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          const list = res.data;
          setInsights(list);

          const slug = requestedSlugRef.current;
          const deepLinked = slug
            ? list.find((i) => i.slug === slug)
            : null;

          setActiveInsight(deepLinked || list[0] || null);
        }
      })
      .finally(() => setLoading(false));
  }, [activeCategory]);

  // ============ DEEP LINK: /etf-mutual-insights?insight=<slug> ============
  useEffect(() => {
    if (!requestedSlug) return;

    let cancelled = false;

    fetch(`${API_BASE}/foliomax/insights/${encodeURIComponent(requestedSlug)}`)
      .then((res) => res.json())
      .then((res) => {
        if (cancelled) return;

        const data = res && res.success ? res.data : null;
        if (!data) return;

        // Reveal the sidebar group that owns this insight so the reader has
        // working navigation context.
        if (data.category?.slug) setActiveCategory(data.category.slug);
        setActiveInsight(data);
        setLoading(false);
      })
      .catch(() => {
        /* leave the default first-insight view in place */
      });

    return () => {
      cancelled = true;
    };
  }, [requestedSlug]);

  const selectInsight = useCallback(
    (ins) => {
      setActiveInsight(ins);
      setSearchParams(
        ins?.slug ? { insight: ins.slug } : {},
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectCategory = useCallback(
    (slug) => {
      setActiveCategory(slug);
      setSearchParams({}, { replace: true });
    },
    [setSearchParams]
  );

  return (
    <section className="insights-page">
      <div className="container">
        <div className="layout">

          {/* ===== SIDEBAR ===== */}
          <aside className="sidebar">
            <h4 className="sidebar-title">Categories</h4>

            {categories.map((cat) => (
              <div key={cat.id} className="category-block">
<button
                  className={`category-btn ${
                    activeCategory === cat.slug ? "active" : ""
                  }`}
                  onClick={() => selectCategory(cat.slug)}
                >
                  {cat.name}
                </button>

                {activeCategory === cat.slug && (
                  <ul className="insight-list">
                    {insights.map((ins) => (
                      <li key={ins.id}>
                        <button
                          className={`insight-link ${
                            activeInsight?.id === ins.id ? "active" : ""
                          }`}
                          onClick={() => selectInsight(ins)}
                        >
                          {ins.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </aside>

          {/* ===== CONTENT ===== */}
          <main className="content">
            {loading && <p className="loading">Loading insights…</p>}

            {!loading && activeInsight && (
              <article className="insight-card">

                {/* Title */}
                <h1 className="insight-title">
                  {activeInsight.title}
                </h1>

                {/* Subtitle */}
                {activeInsight.shortDescription && (
                  <p className="insight-subtitle">
                    {activeInsight.shortDescription}
                  </p>
                )}

                {/* Meta */}
                <div className="insight-meta">
                  <span className="author-name">
                    {activeInsight.authorName || "Research Team"}
                  </span>
                  <span className="dot">•</span>
                  <span className="reading-time">
                    {activeInsight.readingTime || "5 min read"}
                  </span>
                </div>

                {/* Image */}
                {activeInsight.coverImage && (
                  <div className="image-wrapper">
                    <img
                      src={`${API_BASE}${activeInsight.coverImage}`}
                      alt={activeInsight.title}
                      className="insight-image"
                    />
                  </div>
                )}

                {/* Content */}
                <div
                  className="insight-content"
                  dangerouslySetInnerHTML={{
                    __html: activeInsight.content,
                  }}
                />
              </article>
            )}

            {!loading && !activeInsight && (
              <p className="empty">No insights available.</p>
            )}
          </main>

        </div>
      </div>
    </section>
  );
}

export default Insights;
