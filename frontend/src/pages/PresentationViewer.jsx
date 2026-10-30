// src/pages/PresentationViewer.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Download,
  Lock,
  RotateCcw,
  AlertCircle,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import './PresentationViewer.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ensureHttps(url) {
  if (!url) return '';
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://')
  ) {
    return url.replace(/^http:\/\//i, 'https://');
  }
  return url;
}

export default function PresentationViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Meta & Status
  const [pptMeta, setPptMeta] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const viewerContainerRef = useRef(null);

  /* =========================================================
     1. FETCH PRESENTATION DATA & ACCESS
  ========================================================= */
  const loadPresentation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAccessDenied(false);

    const token =
      sessionStorage.getItem('foliomax_accessToken') ||
      localStorage.getItem('foliomax_accessToken');

    try {
      let res;
      let data;

      if (token) {
        res = await fetch(`${API_BASE}/foliomax/public/ppt/protected/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        data = await res.json().catch(() => ({}));
      }

      // Fallback to public endpoint
      if (!res || res.status === 401) {
        res = await fetch(`${API_BASE}/foliomax/public/ppt/${id}`);
        data = await res.json().catch(() => ({}));
      }

      if (res.status === 403 || (!data.ok && data.message === 'Subscription required')) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (!res.ok || (!data.ok && !data.url)) {
        throw new Error(data.message || 'Could not find presentation');
      }

      setPptMeta(data);

      const rawPptUrl = data.url.startsWith('http')
        ? data.url
        : `${API_BASE}/${data.url.replace(/^\/+/, '')}`;
      const resolvedPptUrl = ensureHttps(rawPptUrl);
      setFileUrl(resolvedPptUrl);

      // Resolve the direct PDF presentation URL
      if (data.pdfUrl) {
        const rawPdf = data.pdfUrl.startsWith('http')
          ? data.pdfUrl
          : `${API_BASE}/${data.pdfUrl.replace(/^\/+/, '')}`;
        setPdfUrl(ensureHttps(rawPdf));
        setIsPreparing(false);
      } else {
        setPdfUrl('');
        // Poll for conversion completion up to 5 times (every 3 seconds)
        if (pollCount < 5) {
          setIsPreparing(true);
          setTimeout(() => {
            setPollCount((prev) => prev + 1);
          }, 3000);
        } else {
          setIsPreparing(false);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('[PresentationViewer] Error:', err);
      setError(err.message || 'Unable to open presentation deck.');
      setLoading(false);
    }
  }, [id, pollCount]);

  useEffect(() => {
    loadPresentation();
  }, [loadPresentation]);

  /* =========================================================
     2. FULLSCREEN TOGGLE
  ========================================================= */
  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;

    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  /* =========================================================
     3. STATUS STATES (LOADING, ACCESS DENIED, ERROR)
  ========================================================= */
  if (loading) {
    return (
      <div className="pv-page-container">
        <div className="pv-state-card">
          <div className="pv-spinner" />
          <h2 className="pv-state-title">Opening Presentation...</h2>
          <p className="pv-state-subtitle">Loading presentation slides directly from server...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="pv-page-container">
        <div className="pv-locked-card">
          <div className="pv-locked-icon-wrapper">
            <Lock size={36} />
          </div>
          <h2 className="pv-locked-title">Subscription Required</h2>
          <p className="pv-locked-desc">
            This curated presentation deck is reserved for FolioMax premium members.
            Unlock subscription to access market research decks, financial models, and actionable investment insights.
          </p>
          <div className="pv-locked-actions">
            <Link to="/subscription" className="pv-btn pv-btn-primary">
              <Lock size={16} /> Unlock With Subscription
            </Link>
            <button
              type="button"
              className="pv-btn pv-btn-ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !fileUrl) {
    return (
      <div className="pv-page-container">
        <div className="pv-state-card">
          <div className="pv-error-icon-wrapper">
            <AlertCircle size={36} />
          </div>
          <h2 className="pv-state-title">Unable to Open Presentation</h2>
          <p className="pv-state-subtitle">{error || 'Presentation file could not be found.'}</p>
          <div className="pv-state-actions">
            <button
              type="button"
              className="pv-btn pv-btn-primary"
              onClick={loadPresentation}
            >
              <RotateCcw size={16} /> Try Again
            </button>
            <button
              type="button"
              className="pv-btn pv-btn-ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const presTitle = pptMeta?.name || pptMeta?.originalFilename || 'PowerPoint Presentation';

  /* =========================================================
     4. MAIN PRESENTATION VIEWER UI
  ========================================================= */
  return (
    <div
      className={`pv-page-container ${isFullscreen ? 'pv-fullscreen-mode' : ''}`}
      ref={viewerContainerRef}
    >
      {/* Top Breadcrumb & Actions Bar */}
      <div className="pv-nav-bar">
        <div className="pv-nav-left">
          <button
            type="button"
            className="pv-back-btn"
            onClick={() => navigate(-1)}
            title="Go back"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="pv-title-wrap">
            <span className="pv-brand-badge">
              <Monitor size={14} /> PPT
            </span>
            <h1 className="pv-page-title" title={presTitle}>
              {presTitle}
            </h1>
          </div>

          {pptMeta?.size && (
            <span className="pv-meta-badge pv-size-badge">
              {formatBytes(pptMeta.size)}
            </span>
          )}

          <span className="pv-meta-badge pv-fidelity-badge">
            <CheckCircle2 size={13} /> Original Presentation
          </span>
        </div>

        <div className="pv-nav-right">
          {fileUrl && (
            <a
              href={fileUrl}
              download={pptMeta?.originalFilename || `${presTitle}.pptx`}
              className="pv-btn pv-btn-ghost pv-download-action"
              title="Download original presentation file"
            >
              <Download size={15} />
              <span>Download PPTX</span>
            </a>
          )}

          <button
            type="button"
            className="pv-btn pv-btn-primary pv-fs-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Main Presentation Card */}
      <div className="pv-viewer-card">
        {/* Presentation Canvas Stage */}
        <div className="pv-canvas-stage">
          {pdfUrl ? (
            <iframe
              title={presTitle}
              className="pv-presentation-frame"
              src={`${pdfUrl}#toolbar=1&navpanes=1&view=Fit`}
            />
          ) : isPreparing ? (
            <div className="pv-preparing-container">
              <div className="pv-spinner-ring" />
              <h3 className="pv-preparing-title">Preparing Presentation Deck</h3>
              <p className="pv-preparing-desc">
                Generating high-fidelity slide preview from original presentation. This takes just a moment...
              </p>
            </div>
          ) : (
            <div className="pv-preparing-container">
              <div className="pv-ready-icon-wrap">
                <Monitor size={32} />
              </div>
              <h3 className="pv-preparing-title">High-Fidelity Preview Processing</h3>
              <p className="pv-preparing-desc">
                The slide preview is currently being processed on the server. You can download and open the original presentation directly.
              </p>
              <div className="pv-preparing-actions">
                {fileUrl && (
                  <a
                    href={fileUrl}
                    download={pptMeta?.originalFilename || `${presTitle}.pptx`}
                    className="pv-btn pv-btn-primary"
                  >
                    <Download size={16} />
                    <span>Download Presentation (.pptx)</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPollCount(0);
                    loadPresentation();
                  }}
                  className="pv-btn pv-btn-secondary"
                >
                  <RotateCcw size={16} />
                  <span>Check Preview Again</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
