import React, { useCallback, useEffect, useRef, useState } from "react";
import FeedCard from "./FeedCard";
import "./LearnFeed.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const PAGE_SIZE = 12;

function SkeletonGrid({ count = 6 }) {
  return (
    <div className="lfd-grid">
      {Array.from({ length: count }, (_, i) => (
        <div className="lfd-skeleton" key={i}>
          <div className="lfd-skeleton-media" />
          <div className="lfd-skeleton-body">
            <div className="lfd-skeleton-line" style={{ width: "35%" }} />
            <div className="lfd-skeleton-line" style={{ width: "90%" }} />
            <div className="lfd-skeleton-line" style={{ width: "65%", marginBottom: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * One chronological stream of everything published from the admin panel -
 * blogs, insights, videos and quizzes mixed together, newest first. Ordering
 * and pagination come from GET /foliomax/learn/feed.
 */
function LearnFeed() {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Guards against an out-of-order page response winning the race against a
  // newer "load more".
  const requestIdRef = useRef(0);

  const load = useCallback(async ({ cursor = null, append = false } = {}) => {
    const requestId = ++requestIdRef.current;

    if (append) setLoadingMore(true);
    else setLoading(true);

    setError(null);

    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);

    try {
      const res = await fetch(`${API_BASE}/foliomax/learn/feed?${params}`);
      const json = await res.json();

      if (requestId !== requestIdRef.current) return;

      if (!json.success) {
        throw new Error(json.message || "Could not load content");
      }

      const { items: pageItems, meta } = json.data;

      setItems((prev) => (append ? [...prev, ...pageItems] : pageItems));
      setNextCursor(meta?.nextCursor || null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Learn feed error:", err);
      setError(err.message || "Something went wrong while loading content.");
      if (!append) {
        setItems([]);
        setNextCursor(null);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    load({ cursor: nextCursor, append: true });
  };

  const isEmpty = !loading && !error && items.length === 0;

  return (
    // Rendered inside LearnWithUsMain's .lwu-container, so no second
    // container here - it would double the horizontal gutter.
    <section className="lfeed" id="learn-feed">
      {loading && <SkeletonGrid />}

      {!loading && error && (
        <div className="lwu-empty">
          <div className="lwu-empty-icon">⚠️</div>
          <h3>We couldn&apos;t load this just now</h3>
          <p>{error}</p>
          <button type="button" className="lfeed-retry" onClick={() => load()}>
            Try again
          </button>
        </div>
      )}

      {isEmpty && (
        <div className="lwu-empty">
          <div className="lwu-empty-icon">✨</div>
          <h3>Nothing here yet</h3>
          <p>Fresh learning content will show up here as soon as it&apos;s published.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="lfd-grid">
            {items.map((item, index) => (
              <FeedCard key={`${item.type}-${item.id}`} item={item} index={index} />
            ))}
          </div>

          {nextCursor ? (
            <div className="lfeed-more">
              <button
                type="button"
                className="lfeed-more-btn"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : (
            <p className="lfeed-end">You&apos;ve reached the end.</p>
          )}
        </>
      )}
    </section>
  );
}

export default LearnFeed;