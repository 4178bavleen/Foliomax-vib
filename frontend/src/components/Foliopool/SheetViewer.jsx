import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

/* ---------------- helpers (UNCHANGED) ---------------- */
const cellToString = (cell) => {
  if (cell === null || cell === undefined) return "";
  if (typeof cell === "object") return String(cell.value ?? "");
  return String(cell);
};

function isCellObjectMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return false;
  const firstRow = matrix[0];
  if (!Array.isArray(firstRow) || firstRow.length === 0) return false;
  const cell = firstRow[0];
  return typeof cell === "object";
}

function hexToRgb(hex) {
  if (!hex) return null;
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000";
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.179 ? "#000" : "#fff";
}

const getColumnWidth = (headerName, defaultWidth) => {
  if (/name/i.test(headerName)) return 260;
  if (/industry/i.test(headerName)) return 220;
  return defaultWidth;
};


/* ---------------- pagination constants ---------------- */
const PAGE_SIZE = 10;
const ROW_HEIGHT = 40;

/* ---------------- component ---------------- */
export default function SheetViewer({
  matrix,
  columnWidth = 160,
  onRequestMore,
  isLoadingMore = false,
  hasMore = true,
}) {
  if (!matrix) return null;

  /* -------- normalize sheet -------- */
  const sheetObj = useMemo(() => {
    if (Array.isArray(matrix)) return { rows: matrix, merges: [], cols: [] };
    return {
      rows: matrix.rows || [],
      merges: matrix.merges || [],
      cols: matrix.cols || [],
    };
  }, [matrix]);

  const rawRows = sheetObj.rows;
  if (!rawRows.length) return null;

  const usesCellObjects = useMemo(
    () => isCellObjectMatrix(rawRows),
    [rawRows]
  );

  /* -------- header (NOT paginated) -------- */
  const header = useMemo(() => {
    const row = rawRows[0] || [];
    return row.map((cell, i) =>
      usesCellObjects
        ? String(cell?.value ?? `Column ${i + 1}`)
        : String(cell ?? `Column ${i + 1}`)
    );
  }, [rawRows, usesCellObjects]);

  const bodyRaw = useMemo(() => rawRows.slice(1), [rawRows]);

  /* -------- preprocess body rows -------- */
  const processedRows = useMemo(() => {
    return bodyRaw.map((row, rIdx) => {
      const cells = header.map((_, cIdx) => {
        const raw = row[cIdx];
        if (usesCellObjects && raw && typeof raw === "object") {
          return {
            text: String(raw.value ?? ""),
            lower: String(raw.value ?? "").toLowerCase(),
            bg: raw.bg || null,
            color: raw.color || (raw.bg ? getContrastColor(raw.bg) : null),
            bold: !!raw.bold,
            italic: !!raw.italic,
          };
        }
        const txt = cellToString(raw);
        return {
          text: txt,
          lower: txt.toLowerCase(),
          bg: null,
          color: null,
          bold: false,
          italic: false,
        };
      });

      return {
        cells,
        concat: cells.map((c) => c.lower).join("\u0001"),
      };
    });
  }, [bodyRaw, header.length, usesCellObjects]);

  /* ---------------- filters (UNCHANGED) ---------------- */
  const [globalQ, setGlobalQ] = useState("");
  const [colFilters, setColFilters] = useState(header.map(() => ""));

  useEffect(() => {
    setColFilters(header.map(() => ""));
  }, [header.length]);

  const filteredIndices = useMemo(() => {
    const gq = globalQ.trim().toLowerCase();
    const out = [];
    for (let i = 0; i < processedRows.length; i++) {
      const row = processedRows[i];
      if (gq && !row.concat.includes(gq)) continue;
      let ok = true;
      for (let c = 0; c < colFilters.length; c++) {
        const f = colFilters[c]?.toLowerCase();
        if (f && !row.cells[c].lower.includes(f)) {
          ok = false;
          break;
        }
      }
      if (ok) out.push(i);
    }
    return out;
  }, [processedRows, globalQ, colFilters]);

  /* ---------------- pagination (DATA ONLY) ---------------- */
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [globalQ, colFilters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIndices.length / PAGE_SIZE)
  );

  const paginatedIndices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredIndices.slice(start, start + PAGE_SIZE);
  }, [filteredIndices, page]);

  /* -------- fetch next chunk if needed -------- */
  useEffect(() => {
    if (page === totalPages && hasMore && !isLoadingMore) {
      onRequestMore?.();
    }
  }, [page, totalPages, hasMore, isLoadingMore, onRequestMore]);

  /* ---------------- render ---------------- */
  return (
    <div
      style={{
        background: "#ffffff",
        padding: 12,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          value={globalQ}
          onChange={(e) => setGlobalQ(e.target.value)}
          placeholder="Search all columns…"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: header.length * columnWidth }}>
          {/* Header (NOT paginated) */}
          <div style={{ display: "flex", background: "#f3f4f6" }}>
            {header.map((h, i) => (
  <div
    key={i}
    style={{
      width: getColumnWidth(h, columnWidth),
      padding: "10px 12px",
      fontWeight: 700,
      borderRight: "1px solid #e5e7eb",

      /* 🔒 STICKY FIRST COLUMN */
      position: i === 0 ? "sticky" : "relative",
      left: i === 0 ? 0 : "auto",
      zIndex: i === 0 ? 5 : 1,
      background: "#f3f4f6",

      whiteSpace: "normal",
      wordBreak: "break-word",
      lineHeight: "1.4",
      overflow: "hidden",
    }}
  >
    {h}
  </div>
))}

          </div>

          {/* Data rows (PAGINATED) */}
          {paginatedIndices.map((idx) => {
            const row = processedRows[idx];
            return (
             <div
  key={idx}
  style={{
    display: "flex",
    minHeight: ROW_HEIGHT,   // ✅ FIX
    borderBottom: "1px solid #e5e7eb",
    alignItems: "stretch",  // ✅ IMPORTANT for sticky cells
  }}
>

                {row.cells.map((c, ci) => (
  <div
    key={ci}
    style={{
      width: getColumnWidth(header[ci], columnWidth),
      padding: "8px 12px",

      /* 🔒 STICKY FIRST COLUMN */
      position: ci === 0 ? "sticky" : "relative",
      left: ci === 0 ? 0 : "auto",
      zIndex: ci === 0 ? 4 : 1,
      background: ci === 0 ? "#ffffff" : c.bg || "transparent",

      color: c.color || "#111827",
      fontWeight: c.bold ? 700 : 400,
      fontStyle: c.italic ? "italic" : "normal",

      whiteSpace: "normal",
      wordBreak: "break-word",
      lineHeight: "1.4",
    }}
    title={c.text}
  >
    {c.text}
  </div>
))}

              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 12,
        }}
      >
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          ◀ Prev
        </button>
        <span style={{ fontSize: 13 }}>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
