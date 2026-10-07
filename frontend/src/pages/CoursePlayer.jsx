import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Lock,
  Download,
  Clock,
  Layers,
  Tag,
  CheckCircle2,
  FileText,
  Video,
  Presentation,
  FileSpreadsheet,
  FileArchive,
  File,
  AlertCircle,
  LogIn,
} from "lucide-react";
import "./CoursePlayer.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.foliomax.in";

const KIND_ICONS = {
  video: Video,
  presentation: Presentation,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  archive: FileArchive,
  other: File,
};

const EMBEDDABLE_DOCS = ["pdf", "txt", "csv", "rtf", "html"];

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getToken() {
  return (
    sessionStorage.getItem("foliomax_accessToken") ||
    localStorage.getItem("foliomax_accessToken")
  );
}

export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [accessUrl, setAccessUrl] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | locked-login | locked-plan | error
  const [errorMsg, setErrorMsg] = useState("");
  const playerRef = useRef(null);

  /* ================= FETCH + ACCESS RESOLUTION ================= */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus("loading");
      try {
        const res = await fetch(`${API_BASE}/foliomax/courses/${id}`);
        const data = await res.json().catch(() => null);

        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          throw new Error(data?.message || "Course not found");
        }

        const c = data.course;
        setCourse(c);

        // 🆓 Free course — public URL already included
        if (!c.planId) {
          setAccessUrl(c.fileUrl);
          setStatus("ready");
          return;
        }

        // 🔒 Plan-linked course — resolve access server-side
        const token = getToken();
        if (!token) {
          setStatus("locked-login");
          return;
        }

        const pr = await fetch(`${API_BASE}/foliomax/courses/${id}/protected`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const pd = await pr.json().catch(() => null);
        if (cancelled) return;

        if (pr.ok && pd?.ok && pd.url) {
          setAccessUrl(pd.url);
          setStatus("ready");
        } else if (pr.status === 403) {
          setStatus("locked-plan");
        } else if (pr.status === 401) {
          setStatus("locked-login");
        } else {
          throw new Error(pd?.message || "Unable to access this course");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ================= UNLOCK / LOGIN ACTIONS ================= */
  const handleUnlock = () => {
    if (!getToken()) {
      localStorage.setItem("redirectAfterLogin", "/subscription");
      navigate("/login");
      return;
    }
    navigate("/subscription");
  };

  const handleStartLearning = () => {
    if (status === "locked-login" || status === "locked-plan") {
      handleUnlock();
      return;
    }
    playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const vid = playerRef.current?.querySelector("video");
    if (vid) vid.play().catch(() => {});
  };

  /* ================= STATES ================= */
  if (status === "loading") {
    return (
      <div className="cp-page">
        <div className="cp-loading">
          <div className="cp-spinner" />
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (status === "error" || !course) {
    return (
      <div className="cp-page">
        <div className="cp-state">
          <AlertCircle size={44} />
          <h2>Unable to load course</h2>
          <p>{errorMsg || "Course not found"}</p>
          <Link to="/subscription" className="cp-btn cp-btn-primary">
            <ArrowLeft size={16} /> Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const isLocked = status === "locked-login" || status === "locked-plan";
  const KindIcon = KIND_ICONS[course.fileKind] || File;
  const isVideo = course.fileKind === "video";
  const isEmbed =
    !isVideo && EMBEDDABLE_DOCS.includes((course.fileType || "").toLowerCase());

  /* ================= PLAYER BODY ================= */
  const renderPlayer = () => {
    if (isLocked) {
      return (
        <div className="cp-player cp-player-locked">
          <div className="cp-lock-overlay">
            <div className="cp-lock-circle">
              <Lock size={30} />
            </div>
            <h3>
              {status === "locked-login"
                ? "Login to access this course"
                : "This course is included in the subscription"}
            </h3>
            <p>
              {status === "locked-login"
                ? "Sign in with your FolioMax account to continue."
                : `Unlock ${course.plan?.name || "the plan"} plan to start learning instantly.`}
            </p>
            <button className="cp-btn cp-btn-accent" onClick={handleUnlock}>
              {status === "locked-login" ? (
                <>
                  <LogIn size={16} /> Login & Unlock
                </>
              ) : (
                <>
                  <Lock size={16} /> Unlock Now
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="cp-player cp-player-video">
          <video
            key={accessUrl}
            controls
            preload="metadata"
            poster={course.thumbnailUrl || undefined}
            src={accessUrl}
          >
            Your browser does not support video playback.
          </video>
        </div>
      );
    }

    if (isEmbed) {
      return (
        <div className="cp-player cp-player-doc">
          <iframe
            key={accessUrl}
            title={course.title}
            src={`${accessUrl}#toolbar=1`}
          />
        </div>
      );
    }

    // Office / archive files — download card
    return (
      <div className="cp-player cp-player-download">
        <div className="cp-dl-card">
          <span className={`cp-kind-icon cp-kind-${course.fileKind}`}>
            <KindIcon size={40} />
          </span>
          <h3>{course.fileName}</h3>
          <p>
            {(course.fileType || "").toUpperCase()} material
            {course.fileSize ? ` • ${formatBytes(course.fileSize)}` : ""}
          </p>
          <a
            href={accessUrl}
            download
            className="cp-btn cp-btn-accent"
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} /> Download Material
          </a>
        </div>
      </div>
    );
  };

  /* ================= PAGE ================= */
  return (
    <div className="cp-page">
      {/* ---------- HERO ---------- */}
      <header className="cp-hero">
        <div className="cp-container">
          <Link to="/subscription" className="cp-back">
            <ArrowLeft size={15} /> All courses
          </Link>

          <div className="cp-hero-grid">
            <div className="cp-hero-text">
              <div className="cp-chips">
                {course.category && (
                  <span className="cp-chip cp-chip-solid">
                    <Tag size={12} /> {course.category}
                  </span>
                )}
                <span className="cp-chip">{course.fileKind} course</span>
                <span className="cp-chip">
                  {course.plan ? course.plan.name : "Free"}
                </span>
              </div>

              <h1>{course.title}</h1>

              <p className="cp-hero-desc">
                {course.description ||
                  "A curated FolioMax learning resource. Learn at your own pace and apply it to your investments."}
              </p>

              <div className="cp-hero-meta">
                {course.duration && (
                  <span>
                    <Clock size={14} /> {course.duration} mins
                  </span>
                )}
                <span>
                  <Layers size={14} /> 1 lecture
                </span>
                {course.plan && (
                  <span>
                    <Lock size={14} /> Subscription plan
                  </span>
                )}
              </div>

              <button
                className="cp-btn cp-btn-accent cp-hero-cta"
                onClick={handleStartLearning}
              >
                {isLocked ? (
                  <>
                    <Lock size={16} /> Unlock Now
                  </>
                ) : (
                  <>
                    <Play size={16} /> Start Learning
                  </>
                )}
              </button>
            </div>

            {course.thumbnailUrl && (
              <div className="cp-hero-thumb">
                <img src={course.thumbnailUrl} alt={course.title} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="cp-container cp-main">
        <div className="cp-content">
          {/* PLAYER */}
          <div ref={playerRef} id="cp-player">
            {renderPlayer()}
          </div>

          {/* ABOUT */}
          <section className="cp-card">
            <h2>About this course</h2>
            <p className="cp-about-text">
              {course.description ||
                "This course material is exclusively available on FolioMax. Work through it whenever suits you — the resource unlocks instantly once you have access."}
            </p>

            <h3>What you&apos;ll get</h3>
            <ul className="cp-bullets">
              <li>
                <CheckCircle2 size={17} /> Expert-curated {course.fileKind} learning
                material
              </li>
              {course.category && (
                <li>
                  <CheckCircle2 size={17} /> Focused on {course.category}
                </li>
              )}
              {course.duration && (
                <li>
                  <CheckCircle2 size={17} /> {course.duration} mins of focused content
                </li>
              )}
              <li>
                <CheckCircle2 size={17} /> Instant access after unlock
              </li>
              <li>
                <CheckCircle2 size={17} /> Learn at your own pace, anytime
              </li>
            </ul>
          </section>

          {/* COURSE CONTENT */}
          <section className="cp-card">
            <div className="cp-sec-head">
              <div>
                <h2>Course content</h2>
                <p className="cp-sec-sub">1 section • 1 lecture</p>
              </div>
            </div>

            <div className="cp-accordion">
              <div className="cp-acc-header">
                <span>
                  Section 1 — {course.title}
                </span>
                <span className="cp-acc-meta">
                  {course.duration ? `${course.duration} mins` : "Self-paced"}
                </span>
              </div>

              <div className="cp-acc-row">
                <span className={`cp-acc-icon cp-kind-${course.fileKind}`}>
                  <KindIcon size={18} />
                </span>
                <div className="cp-acc-info">
                  <p className="cp-acc-title">
                    {course.fileName || course.title}
                  </p>
                  <p className="cp-acc-sub">
                    {(course.fileType || "").toUpperCase()}
                    {course.fileSize ? ` • ${formatBytes(course.fileSize)}` : ""}
                  </p>
                </div>
                {isLocked ? (
                  <button
                    className="cp-acc-action"
                    onClick={handleUnlock}
                    title="Unlock"
                  >
                    <Lock size={15} />
                  </button>
                ) : isVideo ? (
                  <button
                    className="cp-acc-action"
                    onClick={handleStartLearning}
                    title="Play"
                  >
                    <Play size={15} />
                  </button>
                ) : isEmbed ? (
                  <button
                    className="cp-acc-action"
                    onClick={handleStartLearning}
                    title="View"
                  >
                    <Play size={15} />
                  </button>
                ) : (
                  <a
                    className="cp-acc-action"
                    href={accessUrl}
                    download
                    title="Download"
                  >
                    <Download size={15} />
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ---------- SIDEBAR ---------- */}
        <aside className="cp-sidebar">
          <div className="cp-side-card">
            {course.thumbnailUrl && (
              <div className="cp-side-thumb">
                <img src={course.thumbnailUrl} alt="" />
                {!isLocked && isVideo && (
                  <button
                    className="cp-side-play"
                    onClick={handleStartLearning}
                    aria-label="Play"
                  >
                    <Play size={22} fill="#fff" />
                  </button>
                )}
                {isLocked && (
                  <span className="cp-side-lock">
                    <Lock size={22} />
                  </span>
                )}
              </div>
            )}

            <div className="cp-side-body">
              <h3>
                {course.plan
                  ? `Included with ${course.plan.name}`
                  : "Free course"}
              </h3>

              {course.plan ? (
                <p className="cp-side-price">
                  ₹{course.plan.price}
                  <span> • {course.plan.duration} month access</span>
                </p>
              ) : (
                <p className="cp-side-price">
                  ₹0 <span>• open to everyone</span>
                </p>
              )}

              <button
                className="cp-btn cp-btn-accent cp-btn-block"
                onClick={isLocked ? handleUnlock : handleStartLearning}
              >
                {isLocked ? (
                  status === "locked-login" ? (
                    <>
                      <LogIn size={16} /> Login to watch
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Subscribe to watch
                    </>
                  )
                ) : (
                  <>
                    <Play size={16} /> Start Learning
                  </>
                )}
              </button>

              {!isLocked && (
                <a
                  className="cp-btn cp-btn-ghost cp-btn-block"
                  href={accessUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={16} /> Download material
                </a>
              )}

              <ul className="cp-side-meta">
                <li>
                  <Clock size={15} />
                  {course.duration ? `${course.duration} mins` : "Self-paced"}
                </li>
                <li>
                  <Layers size={15} />1 lecture ({course.fileKind})
                </li>
                <li>
                  <Tag size={15} />
                  {course.category || "General"}
                </li>
                <li>
                  <Lock size={15} />
                  {course.plan ? "Subscription required" : "Free access"}
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
