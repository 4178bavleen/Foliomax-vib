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
import Swal from "sweetalert2";

import { authHeaders } from "../../lib/authHeaders";

type ServerFile = {
  id: string | number;
  name: string;
  url: string;
  size?: number;
  uploadedAt?: string;
  pageName?: string | null;
  isPremium?: boolean;
  isDrive?: boolean;
  editable?: boolean;
};

type EditSheet = {
  name: string;
  rows: string[][];
};

type UploadFileRec = {
  id: string | number;
  name?: string;
  url?: string;
};

type UploadResponse = {
  ok?: boolean;
  message?: string;
  file?: UploadFileRec;
};

type ParseSheet = {
  name?: string;
  rows?: unknown[][];
};

const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : typeof e === "string" ? e : fallback;

type EditingState = {
  file: ServerFile | null;
  sheets: EditSheet[];
  activeSheet: number;
};

const EMPTY_EDITING: EditingState = { file: null, sheets: [], activeSheet: 0 };

// ====== CONFIG ======
const env = import.meta.env as unknown as Record<string, string | undefined>;
const API_BASE = env.VITE_API_BASE || "https://api.foliomax.in";
const API = {
  UPLOAD: `${API_BASE}/foliomax/api/files/upload-excel`,
  LIST: `${API_BASE}/foliomax/api/files`,
  PARSE: (id: string | number) =>
    `${API_BASE}/foliomax/api/files/${encodeURIComponent(String(id))}/parse`,
  DELETE: (id: string | number) =>
    `${API_BASE}/foliomax/api/files/${encodeURIComponent(String(id))}`,
  UPDATE_SHEET: (id: string | number, sheetIndex: number) =>
    `${API_BASE}/foliomax/api/files/${encodeURIComponent(
      String(id),
    )}/sheets/${sheetIndex}`,
};
const MAX_FILE_SIZE_MB = Number(env.VITE_MAX_UPLOAD_MB || 20);
const ACCEPT_EXT = [".xlsx", ".xls", ".csv"];

const PAGE_OPTIONS = [
  { value: "", label: "No Page" },
  { value: "learn-with-us", label: "Learn With Us" },
];

const pageLabelFor = (f: ServerFile) => {
  if (f.isPremium) return "Subscription";
  switch (f.pageName) {
    case "learn-with-us":
    case "stock-picker":
    case "calculator":
    case "investor":
      return "Learn With Us";
    default:
      return "No Page";
  }
};

// ====== VIRTUALIZATION TUNABLES ======
const ROW_HEIGHT = 36;
const EXTRA_BUFFER_ROWS = 8;

const EST_COL_WIDTH = 140;
const CELL_MIN_WIDTH = 120;
const CELL_MAX_WIDTH = 300;

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

const cellValue = (x: unknown): string => {
  if (x === null || x === undefined) return "";
  if (typeof x === "object") {
    const v = (x as { value?: unknown }).value;
    return v === null || v === undefined ? "" : String(v);
  }
  return String(x);
};

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

  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  const commit = useCallback(() => {
    if (local !== (value ?? "")) onCommit(r, c, local);
  }, [local, value, r, c, onCommit]);

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

  const tdClass = isFirstColumn ? "border px-2 py-1 sticky-col" : "border px-2 py-1";

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
  const [previewRows, setPreviewRows] = useState<unknown[][]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uploadType, setUploadType] = useState<"file" | "drive">("file");
  const [driveUrl, setDriveUrl] = useState<string>("");
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [pageChoice, setPageChoice] = useState<string>("learn-with-us");

  const [editing, setEditing] = useState<EditingState>(EMPTY_EDITING);
  const [savingEdit, setSavingEdit] = useState(false);

  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const [viewportH, setViewportH] = useState(600);
  const [scrollTop, setScrollTop] = useState(0);

  const acceptAttr = useMemo(() => ACCEPT_EXT.join(","), []);

  const resetUploadForm = () => {
    setFile(null);
    setPreviewRows([]);
    setDriveUrl("");
    setIsPremium(false);
    setPageChoice("learn-with-us");
  };

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
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
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

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    await onFilesPicked(e.dataTransfer.files);
  };

  const upload = async () => {
    if (uploadType === "file" && !file) return;
    if (uploadType === "drive" && !driveUrl.trim()) {
      setError("Please enter a Google Drive/Sheets URL");
      return;
    }
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const form = new FormData();

      if (uploadType === "file") {
        if (!file) return;
        form.append("file", file);
      } else {
        form.append("driveUrl", driveUrl.trim());
      }

      if (isPremium) {
        form.append("isPremium", "true");
        form.append("pageName", "subscription");
      } else if (pageChoice) {
        form.append("pageName", pageChoice);
      }

      setProgress(8);

      const res = await fetch(API.UPLOAD, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      const text = await res.text();
      let json: UploadResponse | null = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch { /* ignore */ }

      if (!res.ok) {
        const msg = json?.message || `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      setProgress(60);
      await fetchList();

      const fileRec = json?.file;
      if (fileRec?.id) {
        (async () => {
          try {
            const parseRes = await fetch(API.PARSE(fileRec.id), {
              headers: authHeaders(),
            });
            if (!parseRes.ok) return;
            const parsedJson = await parseRes.json();
            try {
              sessionStorage.setItem(
                `parsed_file_${fileRec.id}`,
                JSON.stringify(parsedJson),
              );
            } catch {
              /* ignore session errors */
            }
          } catch {
            /* ignore parse errors */
          }
        })();
      }

      resetUploadForm();
      setProgress(100);
    } catch (e) {
      setError(errMsg(e, "Upload failed"));
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 300);
    }
  };

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, { method: "GET" });
      if (!res.ok) {
        let msg = `Failed to fetch files (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      const data = (await res.json()) as ServerFile[];
      setServerFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(errMsg(e, "Could not load uploaded files"));
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
      const res = await fetch(API.DELETE(id), {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) {
        let msg = `Delete failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch { /* ignore */ }
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
    } catch (e) {
      const msg = errMsg(e, "Could not delete file");
      setError(msg);

      Swal.fire({
        title: "Error",
        text: msg,
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

  const makeRect = (rows: unknown[][]): string[][] => {
    const width = rows.reduce((m, r) => Math.max(m, r?.length || 0), 0);
    return rows.map((r) => {
      const nr: string[] = [];
      for (let c = 0; c < width; c++) nr.push(cellValue(r?.[c]));
      return nr;
    });
  };

  const openEditor = async (f: ServerFile) => {
    try {
      setError(null);
      const resp = await fetch(API.PARSE(f.id), { headers: authHeaders() });
      if (!resp.ok) throw new Error(`Failed to load file (${resp.status})`);
      const json = await resp.json();
      if (!json?.ok || !Array.isArray(json.sheets)) {
        throw new Error("Could not read sheets from this file");
      }

      const sheets: EditSheet[] = json.sheets.map(
        (s: ParseSheet, idx: number) => ({
          name: s?.name || `Sheet ${idx + 1}`,
          rows: makeRect(Array.isArray(s?.rows) ? s.rows : []),
        }),
      );

      if (sheets.length === 0) throw new Error("This file has no sheets");

      setEditing({ file: f, sheets, activeSheet: 0 });
      setScrollTop(0);
      requestAnimationFrame(() => {
        if (editorScrollRef.current) {
          setViewportH(editorScrollRef.current.clientHeight || 600);
          editorScrollRef.current.scrollTop = 0;
        }
      });
    } catch (e) {
      setError(errMsg(e, "Failed to open file for editing"));
    }
  };

  const closeEditor = () => setEditing(EMPTY_EDITING);

  const commitCell = useCallback((rIdx: number, cIdx: number, value: string) => {
    setEditing((prev) => {
      const sheet = prev.sheets[prev.activeSheet];
      if (!sheet) return prev;
      const rows = [...sheet.rows];
      const row = [...(rows[rIdx] || [])];
      row[cIdx] = value;
      rows[rIdx] = row;
      const sheets = [...prev.sheets];
      sheets[prev.activeSheet] = { ...sheet, rows };
      return { ...prev, sheets };
    });
  }, []);

  const addRow = () =>
    setEditing((prev) => {
      const sheet = prev.sheets[prev.activeSheet];
      if (!sheet) return prev;
      const width = maxCols(sheet.rows) || 1;
      const sheets = [...prev.sheets];
      sheets[prev.activeSheet] = {
        ...sheet,
        rows: [...sheet.rows, Array.from({ length: width }, () => "")],
      };
      return { ...prev, sheets };
    });

  const addCol = () =>
    setEditing((prev) => {
      const sheet = prev.sheets[prev.activeSheet];
      if (!sheet) return prev;
      const width = (maxCols(sheet.rows) || 0) + 1;
      const rows = sheet.rows.map((r) => {
        const nr = [...r];
        while (nr.length < width) nr.push("");
        return nr;
      });
      if (rows.length === 0)
        rows.push(Array.from({ length: width }, () => ""));
      const sheets = [...prev.sheets];
      sheets[prev.activeSheet] = { ...sheet, rows };
      return { ...prev, sheets };
    });

  const saveEdit = async () => {
    if (!editing.file) return;
    const sheet = editing.sheets[editing.activeSheet];
    if (!sheet) return;

    try {
      setSavingEdit(true);
      const res = await fetch(
        API.UPDATE_SHEET(editing.file.id, editing.activeSheet),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ rows: sheet.rows }),
        },
      );

      if (!res.ok) {
        let msg = `Save failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j?.message || msg;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      closeEditor();
      await fetchList();

      Swal.fire({
        title: "Saved!",
        text: `"${sheet.name}" was updated. Other sheets and formatting were kept.`,
        icon: "success",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      setError(errMsg(e, "Failed to save changes"));
    } finally {
      setSavingEdit(false);
    }
  };

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

  const activeSheet = editing.sheets[editing.activeSheet] ?? null;
  const activeRows = activeSheet?.rows ?? [];
  const totalRows = activeRows.length;
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

  const numCols = maxCols(activeRows);
  const innerMinWidth = Math.max(900, numCols * EST_COL_WIDTH);

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
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                uploadType === "file"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => {
                setUploadType("file");
                setError(null);
              }}
            >
              📁 Upload File
            </button>
            <button
              type="button"
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                uploadType === "drive"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => {
                setUploadType("drive");
                setError(null);
              }}
            >
              🔗 Google Drive / Sheets Link
            </button>
          </div>

          {uploadType === "file" && (
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
                  <div className="text-lg font-medium">
                    Drag & drop your file
                  </div>
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

              <div className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="page-select"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Page
                  </label>
                  <select
                    id="page-select"
                    value={isPremium ? "subscription" : pageChoice}
                    disabled={isPremium}
                    onChange={(e) => setPageChoice(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    {isPremium ? (
                      <option value="subscription">Subscription</option>
                    ) : (
                      PAGE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-2">
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
                              {cellValue(h)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewRows.slice(1).map((row, r) => (
                          <tr key={r} className="hover:bg-gray-50 transition">
                            {row.map((cell, c) => (
                              <td
                                key={c}
                                className="py-2 px-3 text-gray-700"
                              >
                                {cellValue(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm mt-3">{error}</div>
              )}

              <div className="text-xs text-gray-500 mt-3">
                Allowed: {ACCEPT_EXT.join(", ")}
              </div>
            </div>
          )}

          {uploadType === "drive" && (
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
                  Share the file with "Anyone with the link" (Viewer) or share
                  with the service account email. For Google Sheets, changes
                  will be visible in real-time.
                </p>
              </div>

              <div>
                <label
                  htmlFor="drive-page-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Page
                </label>
                <select
                  id="drive-page-select"
                  value={isPremium ? "subscription" : pageChoice}
                  disabled={isPremium}
                  onChange={(e) => setPageChoice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                  {isPremium ? (
                    <option value="subscription">Subscription</option>
                  ) : (
                    PAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  id="premium-checkbox-drive"
                />
                <label
                  htmlFor="premium-checkbox-drive"
                  className="text-sm text-gray-700"
                >
                  Mark as Premium (Subscription Required)
                </label>
              </div>

              <button
                type="button"
                onClick={upload}
                disabled={uploading || !driveUrl.trim()}
                className="w-full rounded-lg px-4 py-2 bg-gray-900 text-white disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Drive Link"}
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
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">File</th>
                      <th className="py-3 px-4">Page</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Uploaded</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {serverFiles.map((f) => {
                      const canEdit = f.editable !== false && !f.isDrive;

                      return (
                        <tr key={f.id} className="hover:bg-gray-50 transition">
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
                              {f.isDrive && (
                                <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-700 font-medium">
                                  Drive
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                f.isPremium
                                  ? "bg-red-100 text-red-600"
                                  : f.pageName
                                    ? "bg-purple-100 text-purple-600"
                                    : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {pageLabelFor(f)}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-gray-600">
                            {f.size
                              ? `${(f.size / (1024 * 1024)).toFixed(2)} MB`
                              : "—"}
                          </td>

                          <td className="py-3 px-4 text-gray-600">
                            {f.uploadedAt
                              ? new Date(f.uploadedAt).toLocaleString()
                              : "—"}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex justify-end items-center gap-2">
                              <a
                                href={f.url || undefined}
                                target="_blank"
                                rel="noreferrer"
                                aria-disabled={!f.url}
                                className={`p-2 rounded-lg transition ${
                                  f.url
                                    ? "hover:bg-blue-100 text-gray-600 hover:text-blue-600"
                                    : "text-gray-300 cursor-not-allowed pointer-events-none"
                                }`}
                                title={
                                  f.isDrive
                                    ? "Open in Google Drive"
                                    : "View"
                                }
                              >
                                <FiEye size={18} />
                              </a>

                              <button
                                onClick={() =>
                                  navigator.clipboard.writeText(f.url)
                                }
                                disabled={!f.url}
                                className={`p-2 rounded-lg transition ${
                                  f.url
                                    ? "hover:bg-green-100 text-gray-600 hover:text-green-600"
                                    : "text-gray-300 cursor-not-allowed"
                                }`}
                                title="Copy URL"
                              >
                                <FiCopy size={18} />
                              </button>

                              <button
                                onClick={() => openEditor(f)}
                                disabled={!canEdit}
                                className={`p-2 rounded-lg transition ${
                                  canEdit
                                    ? "hover:bg-yellow-100 text-gray-600 hover:text-yellow-600"
                                    : "text-gray-300 cursor-not-allowed"
                                }`}
                                title={
                                  canEdit
                                    ? "Edit"
                                    : "Drive files are edited in Google Drive"
                                }
                              >
                                <FiEdit size={18} />
                              </button>

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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[90vw] max-w-6xl max-h-[85vh] rounded-xl border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <div className="font-semibold">
                Editing: {editing.file.name}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addRow}
                  disabled={!activeSheet}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  + Row
                </button>
                <button
                  onClick={addCol}
                  disabled={!activeSheet}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  + Column
                </button>
                <button
                  onClick={saveEdit}
                  disabled={savingEdit || !activeSheet}
                  className="px-3 py-1 rounded bg-black text-white disabled:opacity-60"
                >
                  {savingEdit ? "Saving..." : "Save sheet"}
                </button>
                <button
                  onClick={closeEditor}
                  className="px-3 py-1 border rounded"
                >
                  Close
                </button>
              </div>
            </div>

            {editing.sheets.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {editing.sheets.map((s, idx) => (
                  <button
                    key={`${s.name}-${idx}`}
                    onClick={() => {
                      setEditing((prev) => ({
                        ...prev,
                        activeSheet: idx,
                      }));
                      setScrollTop(0);
                      requestAnimationFrame(() => {
                        if (editorScrollRef.current) {
                          editorScrollRef.current.scrollTop = 0;
                        }
                      });
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      idx === editing.activeSheet
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            <div
              ref={editorScrollRef}
              onScroll={onScroll}
              className="overflow-auto border rounded"
              style={{ height: "58vh" }}
            >
              <div style={{ minWidth: innerMinWidth, position: "relative" }}>
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

                  <tbody>
                    <tr style={{ height: topSpacer }} />
                  </tbody>

                  <tbody>
                    {activeRows.slice(startRow, endRow).map((row, idx) => {
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

                  <tbody>
                    <tr style={{ height: bottomSpacer }} />
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2 flex items-center justify-between gap-3 flex-wrap">
              <span>
                Tip: Editing commits on <b>blur</b> or <b>Enter</b>. Rows are
                virtualized for speed.
              </span>
              <span>
                {activeSheet?.name} — {totalRows.toLocaleString()} rows ×{" "}
                {numCols} cols
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelUploadPage;