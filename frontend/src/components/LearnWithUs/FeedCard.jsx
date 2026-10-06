import React from "react";
import { Link } from "react-router-dom";
import "./FeedCard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const TYPE_META = {
  BLOG: { label: "Blog", cta: "Read Blog", icon: "📝" },
  INSIGHT: { label: "Insight", cta: "Read Insight", icon: "📰" },
  VIDEO: { label: "Video", cta: "Watch Now", icon: "🎬" },
  QUIZ: { label: "Quiz", cta: "Start Quiz", icon: "🧠" },
};

function resolveMedia(src) {
  if (!src) return null;
  if (/^(https?:)?\/\//i.test(src)) return src;
  return `${API_BASE}${src}`;
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function FeedMedia({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.BLOG;
  const thumbnail = resolveMedia(item.thumbnail);
  const isVideo = item.type === "VIDEO";
  const source = isVideo ? resolveMedia(item.href) : null;

  return (
    <div className={`lfd-media lfd-media--${item.type.toLowerCase()}`}>
      {isVideo && source ? (
        <video
          className="lfd-media-video"
          src={source}
          muted
          preload="metadata"
          playsInline
          poster={thumbnail || undefined}
          aria-hidden="true"
        />
      ) : thumbnail ? (
        <img
          className="lfd-media-img"
          src={thumbnail}
          alt={item.title || meta.label}
          loading="lazy"
        />
      ) : (
        <span className="lfd-media-placeholder" aria-hidden="true">
          {meta.icon}
        </span>
      )}

      <span className="lfd-type-badge">{meta.label}</span>

      {isVideo && (
        <span className="lfd-play" aria-hidden="true">
          ▶
        </span>
      )}
    </div>
  );
}

function FeedCard({ item, index = 0 }) {
  const meta = TYPE_META[item.type] || TYPE_META.BLOG;
  const date = formatDate(item.publishedAt);

  const secondary =
    item.type === "INSIGHT"
      ? item.meta?.readingTime || "5 min read"
      : item.type === "QUIZ"
        ? `${item.meta?.questionCount || 0} question${
            (item.meta?.questionCount || 0) === 1 ? "" : "s"
          }`
        : null;

  const body = (
    <>
      <FeedMedia item={item} />

      <div className="lfd-body">
        {item.category?.name && (
          <span className="lfd-category">{item.category.name}</span>
        )}

        <h3 className="lfd-title">{item.title}</h3>

        {item.excerpt && <p className="lfd-excerpt">{item.excerpt}</p>}

        <div className="lfd-meta">
          {item.authorName && <span>{item.authorName}</span>}
          {item.authorName && secondary && (
            <span className="lfd-dot" aria-hidden="true">
              •
            </span>
          )}
          {secondary && <span>{secondary}</span>}
          {(item.authorName || secondary) && date && (
            <span className="lfd-dot" aria-hidden="true">
              •
            </span>
          )}
          {date && (
            <time dateTime={item.publishedAt}>{date}</time>
          )}
        </div>

        <span className="lfd-cta">{meta.cta} →</span>
      </div>
    </>
  );

  const className = `lfd-card lfd-card--${item.type.toLowerCase()}`;
  const style = { animationDelay: `${Math.min(index, 12) * 70}ms` };

  if (item.external) {
    return (
      <a
        className={className}
        style={style}
        href={resolveMedia(item.href) || "#"}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    );
  }

  return (
    <Link className={className} style={style} to={item.href}>
      {body}
    </Link>
  );
}

export default FeedCard;