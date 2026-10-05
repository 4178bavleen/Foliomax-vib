// src/pages/excel-upload.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect, 
} from "react";

import * as XLSX from "xlsx";
import { FiEye, FiCopy, FiEdit, FiTrash2 } from "react-icons/fi";

type ServerFile = {
  id: string | number;
  name: string;
  url: string;
  size?: number;
  uploadedAt?: string;
  pageName?: string | null;
  isPremium?: boolean;
};

import Swal from "sweetalert2";

// ====== CONFIG ======
const API_BASE = import.meta.env.VITE_API_BASE || "https://api.foliomax.in";
const API = {
  UPLOAD: `${API_BASE}/foliomax/api/files/upload-excel`,
  LIST: `${API_BASE}/foliomax/api/files?type=excel`,
  DELETE: (id: string | number) =>
    `${API_BASE}/foliomax/api/files/${encodeURIComponent(String(id))}`,
  OVERWRITE: (id: string | number) =>
    `${API_BASE}/foliomax/api/files/${encodeURIComponent(String(id))}/overwrite`,
};
const MAX_FILE_SIZE_MB = 10;
const ACCEPT_EXT = [".xlsx", ".xls", ".csv"];

// Page options (includes No Page)
// const PAGE_OPTIONS = [
//   { value: "none", label: "No Page" },
//   { value: "stock-picker", label: "Stock Picker" },
//   { value: "calculator", label: "Calculator" },
//   { value: "investor", label: "Investor" },
// ];

// ====== VIRTUALIZATION TUNABLES ======
const ROW_HEIGHT = 36; // px per row
const EXTRA_BUFFER_ROWS = 8; // render a bit extra above/below

// visual tuning
const EST_COL_WIDTH = 140; // used to compute minWidth for wide tables
const CELL_MIN_WIDTH = 120;
const CELL_MAX_WIDTH = 300;

// helper - convert column index to A, B, ... Z, AA, AB...
const colLabel = (index: number) => {
  let label = "";
  let i = index + 1;
  while (i > 0) {
    const rem = (i - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    i = Math.floor((i - 1) / 26);
  }
  return label;
};

// ====== A super-fast cell that commits on blur/Enter ======
const Cell = React.memo(function Cell({
  r,
  c,
  value,
  onCommit,
  isFirstColumn,
}: {
  r: number;
  c: number;
  value: string;
  onCommit: (r: number, c: number, v: string) => void;
  isFirstColumn?: boolean;
}) {
  const [local, setLocal] = useState<string>(value ?? "");

  // sync if underlying value changes externally (e.g., addCol/addRow)
  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  const commit = useCallback(() => {
    if (local !== (value ?? "")) onCommit(r, c, local);
  }, [local, value, r, c, onCommit]);

  // styles so input respects ellipsis
  const tdStyle: React.CSSProperties = {
    height: ROW_HEIGHT,
    minWidth: CELL_MIN_WIDTH,
    maxWidth: CELL_MAX_WIDTH,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    outline: "none",
    border: "none",
    background: "transparent",
    padding: "0 4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  // sticky first column
  const tdClass = isFirstColumn
    ? "border px-2 py-1 sticky-col"
    : "border px-2 py-1";

  return (
    <td
      className={tdClass}
      style={{
        ...tdStyle,
        position: isFirstColumn ? "sticky" : undefined,
        left: isFirstColumn ? 0 : undefined,
        zIndex: isFirstColumn ? 2 : undefined,
        background: isFirstColumn ? "#fff" : undefined,
      }}
      title={String(value ?? "")}
    >
      <input
        className="w-full h-full outline-none"
        style={inputStyle}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit();
            // Move focus to next cell to feel spreadsheet-y
            const next = (
              e.currentTarget.parentElement?.nextElementSibling as HTMLElement
            )?.querySelector("input") as HTMLInputElement | null;
            if (next) next.focus();
          }
        }}
      />
    </td>
  );
});

const ExcelUploadPage: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Upload type: 'file' or 'drive'
  const [uploadType, setUploadType] = useState<'file' | 'drive'>('file');
  const [driveUrl, setDriveUrl] = useState<string>('');

  //  pageName selection (for tagging uploads)
  // const pageName = "none";
  const [isPremium, setIsPremium] = useState<boolean>(false);

  const [editing, setEditing] = useState<{
    file: ServerFile | null;
    rows: string[][];
  }>({
    file: null,
    rows: [],
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // --- Row virtualization state ---
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const [viewportH, setViewportH] = useState(600);
  const [scrollTop, setScrollTop] = useState(0);

  const acceptAttr = useMemo(() => ACCEPT_EXT.join(","), []);

  // ---- Helpers ----
  const validateFile = (f: File) => {
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPT_EXT.includes(ext))
      return `Only ${ACCEPT_EXT.join(", ")} files allowed.`;
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024)
      return `Max file size is ${MAX_FILE_SIZE_MB} MB.`;
    return null;
  };

  const readPreview = async (f: File) => {
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.SheetNames[0];
      if (!sheet) return setPreviewRows([]);
      const ws = wb.Sheets[sheet];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
      }) as any[][];
      setPreviewRows(rows.slice(0, 10));
    } catch (e) {
      console.error(e);
      setPreviewRows([]);
      setError("Could not read preview. The file may be corrupted.");
    }
  };

  const onFilesPicked = async (files: FileList | null) => {
    setError(null);
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validateFile(f);
    if (err) {
      setFile(null);
      setPreviewRows([]);
      setError(err);
      return;
    }
    setFile(f);
    await readPreview(f);
  };

  // ---- Drag & Drop ----
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    await onFilesPicked(e.dataTransfer.files);
  };

  // ---- Upload ----
  const upload = async () => {
    if (uploadType === 'file' && !file) return;
    if (uploadType === 'drive' && !driveUrl.trim()) {
      setError('Please enter a Google Drive/Sheets URL');
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const form = new FormData();
      
      if (uploadType === 'file') {
        if (!file) return;
        form.append("file", file);
      } else {
        form.append("driveUrl", driveUrl.trim());
      }

// ✅ PREMIUM FILES SHOULD ONLY GO TO SUBSCRIPTION
if (isPremium) {
  form.append("isPremium", "true");
  form.append("pageName", "subscription");
} else {
  form.append("pageName", "stock-picker");
}

      // use fetch so we can read JSON response (file id/url)
      const req = new Request(API.UPLOAD, {
        method: "POST",
        body: form,
      });

      // progress with fetch is cumbersome — keep a simple UX: show spinner + optimistic progress
      setProgress(8);

      const res = await fetch(req);
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const msg = json?.message || `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      // success — your controller returns { ok:true, file: { id, name, url, ... } }
      const fileRec = json?.file;
      if (!fileRec || !fileRec.id) {
        // still ok: refresh list and continue
        await fetchList();
        setFile(null);
        setPreviewRows([]);
        setIsPremium(false);
        setUploading(false);
        setProgress(100);
        return;
      }

      // optimistic progress
      setProgress(60);

      // put the new file into serverFiles list (so UI updates quickly)
      await fetchList();

      // OPTIONAL (recommended): call parse endpoint immediately and cache parsed JSON
      (async () => {
        try {
          const parseRes = await fetch(
            `${API_BASE}/foliomax/api/files/${encodeURIComponent(String(fileRec.id))}/parse`,
          );
          if (!parseRes.ok) return;
          const parsedJson = await parseRes.json();
          // store parsed snapshot so Foliopool can use sessionStorage cache
          try {
            sessionStorage.setItem(
              `parsed_file_${fileRec.id}`,
              JSON.stringify(parsedJson),
            );
          } catch (_) {
            /* ignore session errors */
          }
        } catch (_) {
          /* ignore parse errors */
        }
      })();

      // finished
      setFile(null);
      setDriveUrl('');
      setPreviewRows([]);
      setProgress(100);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      // small delay so progress bar shows completion
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 300);
    }
  };

  // ---- List / Delete ----
  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, { method: "GET" });
      if (!res.ok) {
        let msg = `Failed to fetch files (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = (await res.json()) as ServerFile[];
      setServerFiles(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || "Could not load uploaded files");
    }
  }, []);

  const deleteFile = async (id: string | number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This file will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",

      didOpen: () => {
        const el = document.querySelector(".swal2-container") as HTMLElement;
        if (el) el.style.zIndex = "99999999";
      },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(API.DELETE(id), { method: "DELETE" });

      if (!res.ok) {
        let msg = `Delete failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      await fetchList();

      Swal.fire({
        title: "Deleted!",
        text: "File has been deleted.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,

        didOpen: () => {
          const el = document.querySelector(".swal2-container") as HTMLElement;
          if (el) el.style.zIndex = "100000000";
        },
      });
    } catch (e: any) {
      setError(e.message || "Could not delete file");

      // ❌ ERROR ALERT
      Swal.fire({
        title: "Error",
        text: e.message || "Failed to delete file",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ====== EDITOR ======
  const maxCols = (rows: string[][]) =>
    rows.reduce((m, r) => Math.max(m, r?.length || 0), 0);

  const makeRect = (rows: any[][]): string[][] => {
    const width = rows.reduce((m, r) => Math.max(m, r?.length || 0), 0);
    return rows.map((r) => {
      const nr = [...(r || [])];
      while (nr.length < width) nr.push("");
      return nr.map((x) => (x == null ? "" : String(x)));
    });
  };

  const openEditor = async (f: ServerFile) => {
    try {
      setError(null);
      const resp = await fetch(f.url);
      if (!resp.ok) throw new Error(`Failed to download file (${resp.status})`);
      const buf = await resp.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.SheetNames[0];
      const ws = wb.Sheets[sheet];
      const rows =
        (XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]) || [];
      setEditing({ file: f, rows: makeRect(rows) }); // rectangularize ONCE
      // reset scroll
      setScrollTop(0);
      // measure viewport after modal opens
      requestAnimationFrame(() => {
        if (editorScrollRef.current) {
          setViewportH(editorScrollRef.current.clientHeight || 600);
          editorScrollRef.current.scrollTop = 0;
        }
      });
    } catch (e: any) {
      setError(e?.message || "Failed to open file for editing");
    }
  };

  const closeEditor = () => setEditing({ file: null, rows: [] });

  // Commit update (called by cells on blur/Enter)
  const commitCell = useCallback(
    (rIdx: number, cIdx: number, value: string) => {
      setEditing((prev) => {
        const rows = [...prev.rows];
        const row = [...(rows[rIdx] || [])];
        row[cIdx] = value;
        rows[rIdx] = row;
        return { ...prev, rows };
      });
    },
    [],
  );

  const addRow = () =>
    setEditing((prev) => {
      const width = maxCols(prev.rows) || 1;
      return {
        ...prev,
        rows: [...prev.rows, Array.from({ length: width }, () => "")],
      };
    });

  const addCol = () =>
    setEditing((prev) => {
      const width = (maxCols(prev.rows) || 0) + 1;
      const rows = prev.rows.map((r) => {
        const nr = [...r];
        while (nr.length < width) nr.push("");
        return nr;
      });
      if (rows.length === 0) rows.push(Array.from({ length: width }, () => ""));
      return { ...prev, rows };
    });

  const saveEdit = async () => {
    if (!editing.file) return;
    try {
      setSavingEdit(true);
      // rows already rectangular
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(editing.rows);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const ab = XLSX.write(wb, { type: "array", bookType: "xlsx" });

      const form = new FormData();
      const name = editing.file.name || "edited.xlsx";
      const fname = name.toLowerCase().endsWith(".xlsx")
        ? name
        : `${name}.xlsx`;

      form.append(
        "file",
        new File([ab], fname, {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );

      const res = await fetch(API.OVERWRITE(editing.file.id), {
        method: "PATCH",
        body: form,
      });
      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      closeEditor();
      await fetchList();
    } catch (e: any) {
      setError(e?.message || "Failed to save changes");
    } finally {
      setSavingEdit(false);
    }
  };

  // ====== ROW VIRTUALIZATION (no deps) ======
  // measure viewport height on resize
  useLayoutEffect(() => {
    const handler = () => {
      if (editorScrollRef.current) {
        setViewportH(editorScrollRef.current.clientHeight || 600);
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const onScroll = useCallback(() => {
    if (editorScrollRef.current) {
      setScrollTop(editorScrollRef.current.scrollTop);
    }
  }, []);

  const totalRows = editing.rows.length;
  const visibleCount = Math.max(
    1,
    Math.ceil(viewportH / ROW_HEIGHT) + EXTRA_BUFFER_ROWS,
  );
  const startRow = Math.max(
    0,
    Math.floor(scrollTop / ROW_HEIGHT) - EXTRA_BUFFER_ROWS,
  );
  const endRow = Math.min(totalRows, startRow + visibleCount);
  const topSpacer = startRow * ROW_HEIGHT;
  const bottomSpacer = (totalRows - endRow) * ROW_HEIGHT;

  // computed inner min-width to force horizontal scroll instead of shrinking
  const numCols = maxCols(editing.rows);
  const innerMinWidth = Math.max(900, numCols * EST_COL_WIDTH);

  // ---- UI ----
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Excel Upload</h1>
        <p className="text-sm text-gray-600">
          Upload .xlsx/.xls/.csv files. Max {MAX_FILE_SIZE_MB} MB. You can use
          the public URL on your frontend site.
        </p>
        <div className="text-xs text-gray-500 mt-1">
          API Base: <code>{API_BASE}</code>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Uploader */}
        <section className="col-span-12 lg:col-span-5">
          {/* Upload Type Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  uploadType === 'file'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setUploadType('file'); setError(null); }}
              >
                📁 Upload File
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  uploadType === 'drive'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => { setUploadType('drive'); setError(null); }}
              >
                🔗 Google Drive / Sheets Link
              </button>
            </div>

            {/* File Upload */}
            {uploadType === 'file' && (
              <div
                className={[
                  "rounded-xl border-2 border-dashed p-6 bg-white transition",
                  dragOver ? "border-gray-900 bg-gray-50" : "border-gray-300",
                ].join(" ")}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") inputRef.current?.click();
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-medium">Drag & drop your file</div>
                    <div className="text-sm text-gray-600">
                      or click to choose from your computer
                    </div>
                  </div>
                  <button
                    className="rounded-lg px-4 py-2 bg-black text-white"
                    onClick={() => inputRef.current?.click()}
                  >
                    Browse
                  </button>
                </div>

                {/* Page dropdown (non-breaking) */}
                <div className="mt-4">
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      id="premium-checkbox"
                    />
                    <label
                      htmlFor="premium-checkbox"
                      className="text-sm text-gray-700"
                    >
                      Mark as Premium (Subscription Required)
                    </label>
                  </div>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept={acceptAttr}
                  className="hidden"
                  onChange={(e) => onFilesPicked(e.target.files)}
                />

                {file && (
                  <div className="mt-4 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">{file.name}</div>
                        <div className="text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                      {!uploading ? (
                        <button
                          onClick={upload}
                          className="rounded-lg px-4 py-2 bg-gray-900 text-white"
                        >
                          Upload
                        </button>
                      ) : (
                        <div className="w-40">
                          <div className="h-2 w-full bg-gray-200 rounded">
                            <div
                              className="h-2 bg-gray-900 rounded"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="text-xs mt-1 text-gray-600">
                            {progress}%
                          </div>
                        </div>
                      )}
</div>
                  </div>
                )}

                {!!previewRows.length && (
                  <div className="mt-4 overflow-auto">
                    <div className="text-xs text-gray-600 mb-1">
                      Preview (first 10 rows of first sheet)
                    </div>
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                            {(previewRows[0] ?? []).map((h, i) => (
                              <th key={i} className="py-2 px-3">
                                {String(h ?? "")}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {previewRows.slice(1).map((row, r) => (
                            <tr key={r} className="hover:bg-gray-50 transition">
                              {row.map((cell, c) => (
                                <td key={c} className="py-2 px-3 text-gray-700">
                                  {String(cell ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {error && <div className="text-red-600 text-sm mt-3">{error}</div>}

            <div className="text-xs text-gray-500 mt-3">
              Allowed: {ACCEPT_EXT.join(", ")} 
            </div>
          </div>
            )}

            {uploadType === 'drive' && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Drive / Sheets Shareable Link
                  </label>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/FILE_ID/edit?usp=sharing"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Share the file with "Anyone with the link" (Viewer) or share with the service account email.
                    For Google Sheets, changes will be visible in real-time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={upload}
                  disabled={uploading || !driveUrl.trim()}
                  className="w-full rounded-lg px-4 py-2 bg-gray-900 text-white disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Drive Link'}
                </button>
              </div>
            )}

        </section>

        <section className="col-span-12 lg:col-span-7">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Uploaded Files</h2>
              <button
                onClick={fetchList}
                className="text-sm px-3 py-1.5 rounded-lg border"
              >
                Refresh
              </button>
            </div>

            {serverFiles.length === 0 ? (
              <div className="text-sm text-gray-600">
                No files uploaded yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  {/* HEADER */}
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">File</th>
                      <th className="py-3 px-4">Page</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Uploaded</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  {/* BODY */}
                  <tbody className="divide-y">
  {serverFiles.map((f) => {

    // ✅ PAGE LABEL LOGIC
    const pageLabel = f.isPremium
      ? "Subscription"
      : f.pageName === "stock-picker"
      ? "Stock Picker"
      : f.pageName === "calculator"
      ? "Calculator"
      : f.pageName === "investor"
      ? "Investor"
      : "Stock Picker";

    return (
      <tr key={f.id} className="hover:bg-gray-50 transition">

        {/* FILE */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">

            <span className="font-medium text-gray-800 truncate max-w-[220px]">
              {f.name}
            </span>

            {f.isPremium && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-600 font-medium">
                Premium
              </span>
            )}

          </div>
        </td>

        {/* PAGE */}
        <td className="py-3 px-4">
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              f.isPremium
                ? "bg-red-100 text-red-600"
                : "bg-purple-100 text-purple-600"
            }`}
          >
            {pageLabel}
          </span>
        </td>

        {/* SIZE */}
        <td className="py-3 px-4 text-gray-600">
          {f.size
            ? `${(f.size / (1024 * 1024)).toFixed(2)} MB`
            : "—"}
        </td>

        {/* DATE */}
        <td className="py-3 px-4 text-gray-600">
          {f.uploadedAt
            ? new Date(f.uploadedAt).toLocaleString()
            : "—"}
        </td>

        {/* ACTIONS */}
        <td className="py-3 px-4">
          <div className="flex justify-end items-center gap-2">

            {/* VIEW */}
            <a
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition"
              title="View"
            >
              <FiEye size={18} />
            </a>

            {/* COPY */}
            <button
              onClick={() =>
                navigator.clipboard.writeText(f.url)
              }
              className="p-2 rounded-lg hover:bg-green-100 text-gray-600 hover:text-green-600 transition"
              title="Copy URL"
            >
              <FiCopy size={18} />
            </button>

            {/* EDIT */}
            <button
              onClick={() => openEditor(f)}
              className="p-2 rounded-lg hover:bg-yellow-100 text-gray-600 hover:text-yellow-600 transition"
              title="Edit"
            >
              <FiEdit size={18} />
            </button>

            {/* DELETE */}
            <button
              onClick={() => deleteFile(f.id)}
              className="p-2 rounded-lg hover:bg-red-100 text-gray-600 hover:text-red-600 transition"
              title="Delete"
            >
              <FiTrash2 size={18} />
            </button>

          </div>
        </td>

      </tr>
    );
  })}
</tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Editor modal */}
      {editing.file && (
        <div className="fixed inset-0 z-50000000 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[90vw] max-w-6xl max-h-[85vh] rounded-xl border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Editing: {editing.file.name}</div>
              <div className="flex gap-2">
                <button onClick={addRow} className="px-3 py-1 border rounded">
                  + Row
                </button>
                <button onClick={addCol} className="px-3 py-1 border rounded">
                  + Column
                </button>
                <button
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="px-3 py-1 rounded bg-black text-white disabled:opacity-60"
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={closeEditor}
                  className="px-3 py-1 border rounded"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Virtualized rows container */}
            <div
              ref={editorScrollRef}
              onScroll={onScroll}
              className="overflow-auto border rounded"
              style={{ height: "60vh" }}
            >
              {/* inner wrapper ensures table has a min width and horizontal scroll appears */}
              <div style={{ minWidth: innerMinWidth, position: "relative" }}>
                {/* sticky header */}
                <table
                  className="min-w-full text-sm"
                  style={{
                    tableLayout: "fixed",
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        top: 0,
                        position: "sticky",
                        zIndex: 4,
                        background: "#fff",
                      }}
                    >
                      {Array.from({ length: numCols }).map((_, cIdx) => (
                        <th
                          key={cIdx}
                          style={{
                            minWidth: CELL_MIN_WIDTH,
                            maxWidth: CELL_MAX_WIDTH,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            padding: "8px",
                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                            textAlign: "left",
                          }}
                          title={colLabel(cIdx)}
                        >
                          {colLabel(cIdx)}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* top spacer for virtualization */}
                  <tbody>
                    <tr style={{ height: topSpacer }} />
                  </tbody>

                  <tbody>
                    {editing.rows.slice(startRow, endRow).map((row, idx) => {
                      const rIdx = startRow + idx;
                      return (
                        <tr key={rIdx} style={{ height: ROW_HEIGHT }}>
                          {row.map((cell, cIdx) => (
                            <Cell
                              key={cIdx}
                              r={rIdx}
                              c={cIdx}
                              value={cell}
                              onCommit={commitCell}
                              isFirstColumn={cIdx === 0}
                            />
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* bottom spacer */}
                  <tbody>
                    <tr style={{ height: bottomSpacer }} />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Tip: Editing commits on <b>blur</b> or <b>Enter</b>. Rows are
              virtualized for speed.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUploadPage;
