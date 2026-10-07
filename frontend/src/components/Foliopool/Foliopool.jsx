// src/pages/Foliopool.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SheetViewer from "../../components/Foliopool/SheetViewer";
import WordPool from "../../components/Foliopool/WordPool"; 
/**
 * Vite config:
 *  - Dev proxy (recommended):
 *      server.proxy['/api']     -> http://localhost:4000
 *      server.proxy['/uploads'] -> http://localhost:4000
 *      Keep API_BASE = "" (relative)
 */
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.foliomax.in"; // "" uses proxy
const API = {
  LIST: `${API_BASE}/foliomax/api/files`,
  PARSE: (id) => `${API_BASE}/foliomax/api/files/${id}/parse`,
  SHEET_META: (id, sheet = 0) => `${API_BASE}/foliomax/api/files/${id}/sheets/${sheet}/meta`,
  SHEET_CSV: (id, sheet = 0, start = 0, limit = 200) =>
    `${API_BASE}/foliomax/api/files/${id}/sheets/${sheet}/csv?start=${start}&limit=${limit}`,
};

/* ---------- styles ---------- */
const styles = {
  section: { paddingBottom: 40 },
  container: { maxWidth: "1400px", marginInline: "auto" },
  row: { display: "flex", gap: 20 },
  sidebar: { flex: "0 0 290px", maxWidth: 290 },
  stickySidebar: { position: "sticky", top: 24 },
  widget: { padding: 16, borderRadius: 12, background: "#ecf7f5" },
  input: {
    width: "100%",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 10,
    outline: "none",
  },
  list: {
    display: "block",
    maxHeight: "60vh",
    overflowY: "auto",
    padding: 0,
    margin: 0,
    listStyle: "none",
  },
  fileBtn: (active) => ({
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    background: active ? "#0f172a" : "#fff",
    color: active ? "#fff" : "#0b1220",
    border: "1px solid #e6eef0",
    cursor: "pointer",
    fontSize: 14,
  }),
  emptyLi: {
    padding: "12px 10px",
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: 12,
  },
  content: { flex: "1 1 auto" },
  emptyBlock: {
    padding: "16px 12px",
    color: "#64748b",
    fontSize: 14,
    background: "#f8fafc",
    borderRadius: 12,
  },
  tabsWrap: {
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  tabs: { display: "flex", gap: 8 },
  tabBtn: (active) => ({
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: active ? "#0f172a" : "#fff",
    color: active ? "#fff" : "#334155",
    cursor: "pointer",
  }),
  iconBtn: {
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    fontSize: 16,
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};

const FileItem = React.memo(function FileItem({ f, activeId, onOpen }) {
  return (
    <li style={{ marginBottom: 8 }}>
      <button
        onClick={() => onOpen(f.id)}
        style={styles.fileBtn(String(activeId) === String(f.id))}
        title={f.name}
      >
        {f.name}
      </button>
    </li>
  );
});

const safeJSONParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

/* ---------- helpers to convert CSV row -> cell-objects and apply meta styles ---------- */
function csvRowToCellObjects(csvRow, rowIndex /* 0-based */, meta) {
  const sheetRowNum = rowIndex + 1;
  const cells = [];
  for (let c = 0; c < Math.max(1, csvRow.length); c++) {
    const sheetColNum = c + 1;
    const key = `${sheetRowNum},${sheetColNum}`;
    const style = (meta && meta.styles && meta.styles[key]) || null;
    const cellObj = {
      r: sheetRowNum,
      c: sheetColNum,
      value: csvRow[c] == null ? "" : csvRow[c],
      bg: style?.bg || null,
      color: style?.color || null,
      bold: !!(style && style.bold),
      italic: !!(style && style.italic),
      align: null,
      numFmt: null,
      isMerged: false,
      formula: null,
      rawType: null,
    };
    cells.push(cellObj);
  }
  return cells;
}

/* ---------- component ---------- */
export default function Foliopool() {
  const [files, setFiles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  // search
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const queryTimer = useRef(null);

  // active file/sheet state
  const [activeId, setActiveId] = useState(null);
  const [activeName, setActiveName] = useState("");
  const [sheets, setSheets] = useState([]); // normalized: { name, rows, merges, cols }
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  // fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // loading-more & hasMore state per sheet (object map keyed by sheetIndex)
  const [loadingMoreMap, setLoadingMoreMap] = useState({}); // { [sheetIndex]: boolean }
  const [hasMoreMap, setHasMoreMap] = useState({}); // { [sheetIndex]: boolean }

  const listAbortRef = useRef(null);
  const detailAbortRef = useRef(null);

  /* ---------- fetch file list (runs once) ---------- */
  useEffect(() => {
    listAbortRef.current?.abort?.();
    const ac = new AbortController();
    listAbortRef.current = ac;

    let mounted = true;
    setLoadingList(true);
    setListError("");

    (async () => {
      try {
        const res = await fetch(API.LIST, { signal: ac.signal });
        if (!res.ok) {
          let msg = `Failed to fetch files (${res.status})`;
          try {
            const j = await res.json();
            msg = j?.message || msg;
          } catch {}
          throw new Error(msg);
        }
        const data = await res.json();
        if (!mounted) return;
        setFiles(
  Array.isArray(data)
    ? data.filter((f) => !f.isPremium)
    : []
);
      } catch (e) {
        if (e?.name !== "AbortError") setListError(e?.message || "Could not load files");
      } finally {
        if (mounted) setLoadingList(false);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  /* ---------- debounced search input ---------- */
  useEffect(() => {
    if (queryTimer.current) clearTimeout(queryTimer.current);
    queryTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 200);
    return () => {
      if (queryTimer.current) clearTimeout(queryTimer.current);
    };
  }, [query]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return files;
    return files.filter((f) => (f.name || "").toLowerCase().includes(debouncedQuery));
  }, [files, debouncedQuery]);

  /* ---------- compute sheet height (normal view) ---------- */
  const computeSheetHeight = useCallback(() => {
    if (typeof window === "undefined") return 520;
    return Math.max(520, window.innerHeight - 240);
  }, []);
  const [sheetHeight, setSheetHeight] = useState(() =>
    typeof window === "undefined" ? 520 : computeSheetHeight()
  );
  useEffect(() => {
    let t = null;
    const onResize = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => setSheetHeight(computeSheetHeight()), 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (t) clearTimeout(t);
    };
  }, [computeSheetHeight]);

  // fullscreen height (no box, fill screen)
  const fullscreenHeight =
    typeof window === "undefined" ? 600 : window.innerHeight - 72; // header area

  /* ---------- open file (uses CSV chunk + meta) ---------- */
  const CHUNK = 200;
  const openFile = useCallback((id) => setActiveId(id), []);

  useEffect(() => {
    if (!activeId) return;

    const file = files.find((f) => String(f.id) === String(activeId));
    if (!file) return;

    detailAbortRef.current?.abort?.();
    const ac = new AbortController();
    detailAbortRef.current = ac;

    let mounted = true;
    (async () => {
      setLoadingDetail(true);
      setDetailError("");
      setSheets([]);
      setActiveName(file.name);
      setActiveSheetIndex(0);
      setLoadingMoreMap({});
      setHasMoreMap({});
      setIsFullscreen(false); // reset fullscreen when switching files

      try {
        const cacheKey = `foliopool_parsed_${activeId}`;
        const cached = safeJSONParse(sessionStorage.getItem(cacheKey));
        if (cached && Array.isArray(cached.sheets)) {
          if (!mounted) return;
          setSheets(cached.sheets);
          setLoadingDetail(false);
          return;
        }

        // 1) fetch meta (small) for sheet 0
        const metaRes = await fetch(API.SHEET_META(activeId, 0), { signal: ac.signal });
        let meta = null;
        if (metaRes.ok) {
          const mj = await metaRes.json();
          meta = mj?.meta || null;
        }

        // 2) fetch first chunk of CSV (start=0 includes header row)
        const csvRes = await fetch(API.SHEET_CSV(activeId, 0, 0, CHUNK), { signal: ac.signal });
        if (!csvRes.ok) {
          // fallback to full parse endpoint if CSV not present
          const pRes = await fetch(API.PARSE(activeId), { signal: ac.signal });
          if (!pRes.ok) {
            let msg = `Parse failed (${pRes.status})`;
            try {
              const j = await pRes.json();
              msg = j?.message || msg;
            } catch {}
            throw new Error(msg);
          }
          const j = await pRes.json();
          if (!j.ok || !Array.isArray(j.sheets)) throw new Error("Invalid parse response");
          const norm = j.sheets.map((s) => ({
            name: s.name || "Sheet",
            rows: s.rows,
            merges: s.merges || [],
            cols: s.cols || [],
          }));
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ sheets: norm }));
          } catch {}
          if (!mounted) return;
          setSheets(norm);
          setLoadingDetail(false);
          return;
        }

        const json = await csvRes.json();
        if (!json.ok || !Array.isArray(json.rows)) {
          throw new Error("Invalid CSV response");
        }

        const csvRows = json.rows;
        if (csvRows.length === 0) {
          throw new Error("CSV empty");
        }

        const convertedRows = csvRows.map((r, idx) => csvRowToCellObjects(r, idx, meta));

        const normSheet = {
          name: meta?.name || csvRows[0].join(" ") || "Sheet 1",
          rows: convertedRows,
          merges: meta?.merges || [],
          cols: meta?.cols || [],
        };

        const norm = [normSheet];
        const maybeHasMore = json.rows.length >= CHUNK;

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ sheets: norm }));
        } catch {}

        if (!mounted) return;
        setSheets(norm);
        setHasMoreMap({ 0: maybeHasMore });
      } catch (e) {
        if (e?.name !== "AbortError") setDetailError(e?.message || "Unable to open file");
      } finally {
        if (mounted) setLoadingDetail(false);
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [activeId, files]);

  /* ---------- load more rows for a sheet (appends) ---------- */
  const loadMoreRows = useCallback(
    async (sheetIndex = 0) => {
      if (!activeId) return;
      if (loadingMoreMap[sheetIndex]) return;
      if (hasMoreMap[sheetIndex] === false) return;

      const currentSheet = sheets[sheetIndex] || null;
      const currentRows =
        currentSheet && Array.isArray(currentSheet.rows) ? currentSheet.rows.length : 0;
      const start = currentRows;

      setLoadingMoreMap((m) => ({ ...(m || {}), [sheetIndex]: true }));

      try {
        const res = await fetch(API.SHEET_CSV(activeId, sheetIndex, start, CHUNK));
        if (!res.ok) {
          setHasMoreMap((m) => ({ ...(m || {}), [sheetIndex]: false }));
          return;
        }
        const j = await res.json();
        if (!j.ok || !Array.isArray(j.rows) || j.rows.length === 0) {
          setHasMoreMap((m) => ({ ...(m || {}), [sheetIndex]: false }));
          return;
        }

        const metaKey = `meta_${activeId}_${sheetIndex}`;
        let meta = sessionStorage.getItem(metaKey);
        meta = meta ? safeJSONParse(meta)?.meta || null : null;
        if (!meta) {
          const metaRes = await fetch(API.SHEET_META(activeId, sheetIndex));
          if (metaRes.ok) {
            const mj = await metaRes.json();
            meta = mj?.meta || null;
            try {
              sessionStorage.setItem(metaKey, JSON.stringify({ meta }));
            } catch {}
          }
        }

        const converted = j.rows.map((r, idx) =>
          csvRowToCellObjects(r, start + idx, meta)
        );

        setSheets((prev) => {
          const copy = prev.slice();
          const target = copy[sheetIndex]
            ? { ...copy[sheetIndex] }
            : { name: `Sheet ${sheetIndex + 1}`, rows: [], merges: [], cols: [] };
          target.rows = (target.rows || []).concat(converted);
          copy[sheetIndex] = target;

          try {
            const cacheKey = `foliopool_parsed_${activeId}`;
            const existing = safeJSONParse(sessionStorage.getItem(cacheKey));
            if (existing && Array.isArray(existing.sheets)) {
              const ex = existing;
              ex.sheets[sheetIndex] = target;
              sessionStorage.setItem(cacheKey, JSON.stringify(ex));
            } else {
              sessionStorage.setItem(cacheKey, JSON.stringify({ sheets: copy }));
            }
          } catch {}

          return copy;
        });

        if (j.rows.length < CHUNK) {
          setHasMoreMap((m) => ({ ...(m || {}), [sheetIndex]: false }));
        } else {
          setHasMoreMap((m) => ({ ...(m || {}), [sheetIndex]: true }));
        }
      } catch (e) {
        setHasMoreMap((m) => ({ ...(m || {}), [sheetIndex]: false }));
      } finally {
        setLoadingMoreMap((m) => ({ ...(m || {}), [sheetIndex]: false }));
      }
    },
    [activeId, sheets, loadingMoreMap, hasMoreMap]
  );

  /* ---------- stable UI callbacks ---------- */
  const onSetActiveSheet = useCallback((idx) => setActiveSheetIndex(idx), []);
  const onClearSelection = useCallback(() => {
    setActiveId(null);
    setSheets([]);
    setActiveName("");
    setDetailError("");
    setIsFullscreen(false);
  }, []);

  /* ---------- render ---------- */
  return (
    <section className="account-details service-details" style={styles.section}>
      <div className="auto-container" style={styles.container}>
        <div className="row clearfix" style={styles.row}>
          {/* LEFT: Sidebar */}
          <div className="col-lg-3 col-md-12 col-sm-12 sidebar-side" style={styles.sidebar}>
            <div className="account-sidebar default-sidebar" style={styles.stickySidebar}>
              <div className="sidebar-widget category-widget" style={styles.widget}>
                <div className="widget-title">
                  <h3 style={{ margin: 0 }}>Data Pool</h3>
                </div>

                <div className="widget-content" style={{ marginTop: 12 }}>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search files..."
                    style={styles.input}
                    aria-label="Search files"
                  />

                  <ul className="category-list clearfix" style={styles.list}>
                    {loadingList && <li style={styles.emptyLi}>Loading files…</li>}
                    {listError && !loadingList && (
                      <li style={styles.emptyLi}>⚠ {listError}</li>
                    )}
                    {!loadingList && !listError && filtered.length === 0 && (
                      <li style={styles.emptyLi}>No files</li>
                    )}

                    {!loadingList &&
                      !listError &&
                      filtered.map((f) => (
                        <FileItem
                          key={f.id}
                          f={f}
                          activeId={activeId}
                          onOpen={openFile}
                        />
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Content */}
          <div className="col-lg-9 col-md-12 col-sm-12 content-side" style={styles.content}>
            <div className="account-details-content" style={{ width: "100%" }}>
              <div className="content-one">
                {!activeId && (
                  <>
                    <p>Select a file from the left to preview it here.</p>
                    <figure className="image-box">
                      <img
                        src="assets/images/excel-files.jpg"
                        alt="intro"
                        style={{ maxWidth: "60%" }}
                      />
                    </figure>
                  </>
                )}
              </div>

              {activeId && (
                <div className="content-two" style={{ marginTop: 16 }}>
                  {loadingDetail && <div style={styles.emptyBlock}>Opening…</div>}
                  {detailError && !loadingDetail && (
                    <div style={styles.emptyBlock}>⚠ {detailError}</div>
                  )}

                  {!loadingDetail && !detailError && sheets.length > 0 && (
                    <>
                      <div className="text-box" style={styles.tabsWrap}>
                        <div>
                          <h2 className="file-title" style={{ margin: "0 0 6px 0" }}>{activeName}</h2>
                          {/* <p
                            style={{
                              color: "#64748b",
                              fontSize: 13,
                              margin: 0,
                            }}
                          >
                            ID: {String(activeId)}
                          </p> */}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          {/* <div style={styles.tabs}>
                            {sheets.map((s, idx) => (
                              <button
                                key={idx}
                                onClick={() => onSetActiveSheet(idx)}
                                style={styles.tabBtn(idx === activeSheetIndex)}
                                title={s.name}
                              >
                                {s.name || `Sheet ${idx + 1}`}
                              </button>
                            ))}
                          </div> */}

                          <div style={{ display: "flex", gap: 8 }}>
                            {/* icon only: ⛶ */}
                            <button
                              onClick={() => setIsFullscreen(true)}
                              style={styles.iconBtn}
                              title="Open in full screen"
                              aria-label="Open in full screen"
                            >
                              ⛶
                            </button>
                            {/* close icon: × */}
                            <button
                              onClick={onClearSelection}
                              style={styles.iconBtn}
                              title="Close file"
                              aria-label="Close file"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sheet viewer (normal view) */}
                      <div style={{ width: "100%" }}>
                        <SheetViewer
                          matrix={sheets[activeSheetIndex]}
                          height={sheetHeight}
                          onRequestMore={() => loadMoreRows(activeSheetIndex)}
                          isLoadingMore={!!loadingMoreMap[activeSheetIndex]}
                          hasMore={hasMoreMap[activeSheetIndex] !== false}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

          {/* ---------------- Word files (separate section) ---------------- */}
    <div className="auto-container" style={{ maxWidth: "1400px", marginInline: "auto", marginTop: 24 }}>
      <WordPool/>
    </div>


      {/* FULLSCREEN OVERLAY (no extra box, table fills screen) */}
      {isFullscreen && activeId && sheets.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#020617", // dark background
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 18px",
              borderBottom: "1px solid #111827",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 16, color: "#f9fafb" }}>
                {activeName}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                Sheet:{" "}
                {sheets[activeSheetIndex]?.name ||
                  `Sheet ${activeSheetIndex + 1}`}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {/* icon only */}
              <button
                onClick={() => setIsFullscreen(false)}
                style={{ ...styles.iconBtn, background: "#0f172a", color: "#e5e7eb" }}
                title="Exit full screen"
                aria-label="Exit full screen"
              >
                ⛶
              </button>
              <button
                onClick={onClearSelection}
                style={{ ...styles.iconBtn, background: "#b91c1c", color: "#f9fafb" }}
                title="Close file"
                aria-label="Close file"
              >
                ×
              </button>
            </div>
          </div>

          {/* sheet area filling the rest */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: "10px 18px 18px 18px",
            }}
          >
            <SheetViewer
              matrix={sheets[activeSheetIndex]}
              height={fullscreenHeight}
              onRequestMore={() => loadMoreRows(activeSheetIndex)}
              isLoadingMore={!!loadingMoreMap[activeSheetIndex]}
              hasMore={hasMoreMap[activeSheetIndex] !== false}
            />
          </div>
        </div>
      )}
    </section>
  );
}
