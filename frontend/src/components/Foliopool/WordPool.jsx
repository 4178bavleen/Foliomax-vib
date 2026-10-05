import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const DEFAULT_LIMIT = 40;

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
    maxHeight: "55vh",
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

  iconBtnSmall: {
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 15,
  },

  emptyLi: {
    padding: "12px 10px",
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    background: "#f8fafc",
    borderRadius: 12,
  },

  content: { flex: 1 },

  emptyBlock: {
    padding: "16px 12px",
    color: "#64748b",
    fontSize: 14,
    background: "#f8fafc",
    borderRadius: 12,
  },

  paraBox: {
    padding: 16,
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e6eef0",
    marginTop: 16,
  },

  metaTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  smallMuted: {
    color: "#64748b",
    fontSize: 13,
  },
};

function safeJSONParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function WordPool() {
  const API = useMemo(
    () => ({
      LIST: `${API_BASE}/foliomax/files`,

      PDFS: `${API_BASE}/foliomax/public/pdf/public?tags=Stock%20Picker`,

      GETONE: (id) => `${API_BASE}/foliomax/files/${id}`,

      META: (id) => `${API_BASE}/foliomax/files/${id}/meta`,

      TEXT: (id, start = 0, limit = DEFAULT_LIMIT) =>
        `${API_BASE}/foliomax/files/${id}/text?start=${start}&limit=${limit}`,

      DELETE: (id) => `${API_BASE}/foliomax/files/${id}`,
    }),
    [API_BASE]
  );

  const [files, setFiles] = useState([]);
  const [pdfFiles, setPdfFiles] = useState([]);

  const [activePdf, setActivePdf] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [query, setQuery] = useState("");

  const [activeId, setActiveId] = useState(null);
  const [activeFileName, setActiveFileName] = useState("");

  const [meta, setMeta] = useState(null);
  const [paragraphs, setParagraphs] = useState([]);

  const [paraStart, setParaStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  const listAbortRef = useRef(null);
  const detailAbortRef = useRef(null);

  /* ---------------- FILTER ---------------- */

  const filtered = useMemo(() => {
    if (!query) return files;

    const q = query.toLowerCase().trim();

    return files.filter((x) =>
      (x.name || "").toLowerCase().includes(q)
    );
  }, [files, query]);

  /* ---------------- FETCH WORD FILES ---------------- */

  useEffect(() => {
    listAbortRef.current?.abort?.();

    const ac = new AbortController();

    listAbortRef.current = ac;

    let mounted = true;

    setLoadingList(true);
    setListError("");

    (async () => {
      try {
        const res = await fetch(API.LIST, {
          signal: ac.signal,
        });

        if (!res.ok) {
          throw new Error(
            `Failed to fetch files (${res.status})`
          );
        }

        const data = await res.json();

        console.log("WORD API:", data);

        if (!mounted) return;

        setFiles(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setListError(
            e?.message || "Could not load files"
          );
        }
      } finally {
        if (mounted) {
          setLoadingList(false);
        }
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [API.LIST]);

  /* ---------------- FETCH PDF FILES ---------------- */

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const res = await fetch(API.PDFS);

        if (!res.ok) {
          throw new Error("Failed to fetch PDFs");
        }

        const data = await res.json();

        console.log("PDF API:", data);

        setPdfFiles(
          Array.isArray(data)
            ? data
            : data?.files || data?.data || []
        );
      } catch (e) {
        console.error("PDF FETCH ERROR:", e);
      }
    };

    fetchPdfs();
  }, [API.PDFS]);

  /* ---------------- OPEN WORD FILE ---------------- */

  const openFile = useCallback(
    (id) => {
      setActivePdf(null);

      setActiveId(id);

      (async () => {
        try {
          const res = await fetch(API.GETONE(id));

          if (!res.ok) return;

          const j = await res.json();

          if (!j?.ok || !j?.file) return;

          setFiles((prev) => {
            const ix = prev.findIndex(
              (x) => String(x.id) === String(id)
            );

            if (ix === -1) {
              return [j.file, ...prev];
            }

            const cp = prev.slice();

            cp[ix] = {
              ...cp[ix],
              ...j.file,
            };

            return cp;
          });
        } catch {}
      })();
    },
    [API.GETONE]
  );

  /* ---------------- LOAD META + PARAGRAPHS ---------------- */

  useEffect(() => {
    if (!activeId) return;

    detailAbortRef.current?.abort?.();

    const ac = new AbortController();

    detailAbortRef.current = ac;

    let mounted = true;

    (async () => {
      setLoadingDetail(true);

      setDetailError("");

      setMeta(null);
      setParagraphs([]);

      setParaStart(0);
      setHasMore(false);

      try {
        const localFile = files.find(
          (f) => String(f.id) === String(activeId)
        );

        if (localFile) {
          setActiveFileName(localFile.name || "");
        }

        const cacheKey = `wordfile_${activeId}`;

        const cached = safeJSONParse(
          sessionStorage.getItem(cacheKey)
        );

        if (cached) {
          if (!mounted) return;

          setMeta(cached.meta || null);

          setParagraphs(
            Array.isArray(cached.paragraphs)
              ? cached.paragraphs
              : []
          );

          setParaStart(
            (cached.paragraphs || []).length
          );

          setHasMore(Boolean(cached.hasMore));

          setLoadingDetail(false);

          return;
        }

        const metaRes = await fetch(
          API.META(activeId),
          {
            signal: ac.signal,
          }
        );

        if (!metaRes.ok) {
          throw new Error(
            `Could not load meta (${metaRes.status})`
          );
        }

        const metaJson = await metaRes.json();

        const metaObj =
          metaJson?.meta || metaJson || null;

        const textRes = await fetch(
          API.TEXT(activeId, 0, DEFAULT_LIMIT),
          {
            signal: ac.signal,
          }
        );

        if (!textRes.ok) {
          throw new Error(
            `Could not load text (${textRes.status})`
          );
        }

        const tJson = await textRes.json();

        const paras = Array.isArray(
          tJson.paragraphs
        )
          ? tJson.paragraphs
          : [];

        const more =
          paras.length >= DEFAULT_LIMIT;

        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              meta: metaObj,
              paragraphs: paras,
              hasMore: more,
            })
          );
        } catch {}

        if (!mounted) return;

        setMeta(metaObj);

        setParagraphs(paras);

        setParaStart(paras.length);

        setHasMore(more);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setDetailError(
            e?.message || "Unable to open file"
          );
        }
      } finally {
        if (mounted) {
          setLoadingDetail(false);
        }
      }
    })();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [activeId, files, API.META, API.TEXT]);

  /* ---------------- LOAD MORE ---------------- */

  const loadMore = useCallback(async () => {
    if (!activeId) return;

    try {
      const res = await fetch(
        API.TEXT(
          activeId,
          paraStart,
          DEFAULT_LIMIT
        )
      );

      if (!res.ok) {
        setHasMore(false);
        return;
      }

      const j = await res.json();

      const moreParas = Array.isArray(
        j.paragraphs
      )
        ? j.paragraphs
        : [];

      setParagraphs((p) =>
        p.concat(moreParas)
      );

      setParaStart(
        (s) => s + moreParas.length
      );

      if (moreParas.length < DEFAULT_LIMIT) {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    }
  }, [activeId, paraStart, API.TEXT]);

  /* ---------------- RENDER ---------------- */

  return (
    <section
      className="account-details service-details"
      style={styles.section}
    >
      <div
        className="auto-container"
        style={styles.container}
      >
        <div
          className="row clearfix"
          style={styles.row}
        >
          {/* ---------- SIDEBAR ---------- */}

          <div
            className="col-lg-3"
            style={styles.sidebar}
          >
            <div
              className="default-sidebar"
              style={styles.stickySidebar}
            >
              <div
                className="sidebar-widget category-widget"
                style={styles.widget}
              >
                <div className="widget-title">
                  <h3 style={{ margin: 0 }}>
                    Word + PDF Pool
                  </h3>
                </div>

                <div style={{ marginTop: 12 }}>
                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery(e.target.value)
                    }
                    placeholder="Search files..."
                    style={styles.input}
                  />

                  <ul style={styles.list}>
                    {loadingList && (
                      <li style={styles.emptyLi}>
                        Loading files…
                      </li>
                    )}

                    {listError && (
                      <li style={styles.emptyLi}>
                        ⚠ {listError}
                      </li>
                    )}

                    {/* WORD FILES */}

                    {!loadingList &&
                      filtered.map((f) => (
                        <li
                          key={`word-${f.id}`}
                          style={{
                            marginBottom: 8,
                          }}
                        >
                          <button
                            onClick={() =>
                              openFile(f.id)
                            }
                            style={{
                              ...styles.fileBtn(
                                String(activeId) ===
                                  String(f.id)
                              ),
                              whiteSpace: "normal",
                              wordWrap:
                                "break-word",
                              overflowWrap:
                                "break-word",
                            }}
                          >
                            📄 {f.name}
                          </button>
                        </li>
                      ))}

                    {/* PDF FILES */}

                    {pdfFiles.map((pdf, idx) => (
                      <li
                        key={`pdf-${idx}`}
                        style={{
                          marginBottom: 8,
                        }}
                      >
                        <button
                          onClick={() => {
                            setActiveId(null);

                            setMeta(null);

                            setParagraphs([]);

                            setActivePdf(pdf);
                          }}
                          style={{
                            ...styles.fileBtn(
                              activePdf?.id ===
                                pdf.id
                            ),
                            whiteSpace:
                              "normal",
                            wordWrap:
                              "break-word",
                            overflowWrap:
                              "break-word",
                          }}
                        >
                          📕{" "}
                          {pdf.title ||
                            pdf.name ||
                            `PDF ${idx + 1}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- CONTENT ---------- */}

          <div
            className="col-lg-9"
            style={styles.content}
          >
            {!activeId && !activePdf && (
              <div style={styles.emptyBlock}>
                Select a Word or PDF file
              </div>
            )}

            {/* PDF VIEWER */}

            {activePdf && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  overflow: "hidden",
                  border:
                    "1px solid #e2e8f0",
                  height: "85vh",
                }}
              >
                <div
                  style={{
                    padding: 12,
                    borderBottom:
                      "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent:
                      "space-between",
                  }}
                >
                  <h3 style={{ margin: 0 }}>
                    {activePdf.title ||
                      activePdf.name}
                  </h3>

                  <button
                    onClick={() =>
                      setActivePdf(null)
                    }
                    style={
                      styles.iconBtnSmall
                    }
                  >
                    ×
                  </button>
                </div>

                <iframe
                  src={
                    activePdf.url ||
                    activePdf.pdfUrl ||
                    activePdf.fileUrl
                  }
                  title="PDF Viewer"
                  width="100%"
                  height="100%"
                  style={{
                    border: "none",
                  }}
                />
              </div>
            )}

            {/* WORD VIEWER */}

            {activeId && (
              <>
                {loadingDetail && (
                  <div style={styles.emptyBlock}>
                    Opening…
                  </div>
                )}

                {detailError &&
                  !loadingDetail && (
                    <div
                      style={styles.emptyBlock}
                    >
                      ⚠ {detailError}
                    </div>
                  )}

                {!loadingDetail &&
                  !detailError &&
                  meta && (
                    <>
                      <div
                        style={
                          styles.metaTopBar
                        }
                      >
                        <div>
                          <h2
                            style={{
                              margin:
                                "0 0 6px 0",
                            }}
                          >
                            {meta.title ||
                              activeFileName}
                          </h2>

                          <p
                            style={
                              styles.smallMuted
                            }
                          >
                            Chars:{" "}
                            {meta.charCount ??
                              "—"}{" "}
                            · Words:{" "}
                            {meta.wordCount ??
                              "—"}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveId(
                              null
                            );

                            setMeta(null);

                            setParagraphs(
                              []
                            );
                          }}
                          style={
                            styles.iconBtnSmall
                          }
                        >
                          ×
                        </button>
                      </div>

                      <div
                        style={styles.paraBox}
                      >
                        {paragraphs.length ===
                          0 && (
                          <div
                            style={
                              styles.smallMuted
                            }
                          >
                            No paragraphs
                            returned.
                          </div>
                        )}

                        {paragraphs.map(
                          (p, idx) => (
                            <p
                              key={idx}
                              style={{
                                marginTop:
                                  idx === 0
                                    ? 0
                                    : 12,
                              }}
                            >
                              {p}
                            </p>
                          )
                        )}

                        {hasMore && (
                          <button
                            onClick={
                              loadMore
                            }
                            style={{
                              marginTop: 14,
                              padding:
                                "8px 14px",
                              borderRadius: 8,
                              border:
                                "1px solid #e2e8f0",
                              background:
                                "#fff",
                            }}
                          >
                            Load more
                          </button>
                        )}
                      </div>
                    </>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}