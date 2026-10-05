// WordUploadPage with optional built-in mock APIs
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun } from "docx";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
type ServerFile = {
  id: number;
  name: string;
  url: string;
  size?: number;
  uploadedAt?: string | null;
  pageName?: string | null; // 👈 added
};

import { FiEye, FiCopy, FiEdit, FiTrash2 } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.foliomax.in";
const API = {
  UPLOAD: `${API_BASE}/foliomax/files/upload-word`,
  LIST: `${API_BASE}/foliomax/files?type=word`,
  DELETE: (id: string | number) =>
    `${API_BASE}/foliomax/files/${encodeURIComponent(String(id))}`,
  OVERWRITE: (id: string | number) =>
    `${API_BASE}/foliomax/files/${encodeURIComponent(String(id))}/overwrite`,
};
const MAX_FILE_SIZE_MB = 10;
const ACCEPT_EXT = [".docx", ".doc", ".rtf", ".txt"];

/**
 * Toggle NOTE:
 * - You can set VITE_USE_MOCK=true in your .env to default to mock mode,
 *   or toggle the switch in the UI.
 */
const DEFAULT_USE_MOCK = !!(import.meta.env.VITE_USE_MOCK === "true");

const STORAGE_META_KEY = "mock_word_files_meta_v1";

// 🔥 Page options (with No Page)
const PAGE_OPTIONS = [
  { value: "none", label: "No Page" },
  { value: "stock-picker", label: "Stock Picker" },
  { value: "calculator", label: "Calculator" },
  { value: "investor", label: "Investor" },
];

const WordUploadPage: React.FC = () => {
  const [useMock, setUseMock] = useState<boolean>(DEFAULT_USE_MOCK);

  // UI state
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const editingTextRef = useRef<HTMLTextAreaElement | null>(null);
  const [editing, setEditing] = useState<{ file: ServerFile | null; text: string }>(
    { file: null, text: "" }
  );
  const [savingEdit, setSavingEdit] = useState(false);

  const acceptAttr = useMemo(() => ACCEPT_EXT.join(","), []);

  //  pageName selection (for tagging uploads)
 const pageName = "none";

  // ---- Mock storage (in-memory + metadata persisted) ----
  const mockFileMap = useRef<Map<number, File>>(new Map());
  const nextIdRef = useRef<number>(Date.now() % 100000);

  useEffect(() => {
    if (!useMock) return;
    try {
      const raw = localStorage.getItem(STORAGE_META_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as ServerFile[];
        setServerFiles(arr);
        const maxId = arr.reduce((m, r) => Math.max(m, r.id), 0);
        nextIdRef.current = Math.max(nextIdRef.current, maxId + 1);
      } else {
        setServerFiles([]);
      }
    } catch {
      setServerFiles([]);
    }
    mockFileMap.current = new Map();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMock]);

  const persistMockMeta = (meta: ServerFile[]) => {
    try {
      localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
    } catch {
      // ignore
    }
  };

  // ---- Helpers ----
  const validateFile = (f: File) => {
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPT_EXT.includes(ext)) return `Only ${ACCEPT_EXT.join(", ")} files allowed.`;
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `Max file size is ${MAX_FILE_SIZE_MB} MB.`;
    return null;
  };

  const readPreview = async (f: File) => {
    setError(null);
    try {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if (ext === ".txt") {
        const txt = await f.text();
        setPreviewText(txt.split(/\r?\n/).slice(0, 20));
        return;
      }

      const buf = await f.arrayBuffer();
      try {
        const res = await mammoth.extractRawText({ arrayBuffer: buf } as any);
        const txt = res.value || "";
        setPreviewText(txt.split(/\r?\n/).slice(0, 20));
      } catch {
        setPreviewText(["(Could not extract preview)"]);
      }
    } catch (e) {
      console.error(e);
      setPreviewText([]);
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
      setPreviewText([]);
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

  // --------------------------
  // Real API wrappers
  // --------------------------
  const real_upload = async (f: File, pageNameParam?: string | null) => {
    const form = new FormData();
    form.append("file", f);
    if (pageNameParam && pageNameParam !== "none") {
      form.append("pageName", pageNameParam);
    }
    const res = await fetch(API.UPLOAD, { method: "POST", body: form });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(json?.message || `Upload failed (${res.status})`);
    return json.file as ServerFile;
  };

  const real_fetchList = async (): Promise<ServerFile[]> => {
    const res = await fetch(API.LIST, { method: "GET" });
    if (!res.ok) {
      let msg = `Failed to fetch files (${res.status})`;
      try { const j = await res.json(); msg = j?.message || msg; } catch {}
      throw new Error(msg);
    }
    return (await res.json()) as ServerFile[];
  };

  const real_delete = async (id: number) => {
    const res = await fetch(API.DELETE(id), { method: "DELETE" });
    if (!res.ok) {
      let msg = `Delete failed (${res.status})`;
      try { const j = await res.json(); msg = j?.message || msg; } catch {}
      throw new Error(msg);
    }
    return true;
  };

  const real_overwrite = async (id: number, f: File) => {
    const form = new FormData();
    form.append("file", f);
    const res = await fetch(API.OVERWRITE(id), { method: "PATCH", body: form });
    if (!res.ok) {
      let msg = `Save failed (${res.status})`;
      try { const j = await res.json(); msg = j?.message || msg; } catch {}
      throw new Error(msg);
    }
    return true;
  };

  // --------------------------
  // Mock API implementations
  // --------------------------
  const mock_upload = async (f: File, pageNameParam?: string | null): Promise<ServerFile> => {
    const id = nextIdRef.current++;
    const url = URL.createObjectURL(f);
    const rec: ServerFile = {
      id,
      name: f.name,
      url,
      size: f.size,
      uploadedAt: new Date().toISOString(),
      pageName: pageNameParam && pageNameParam !== "none" ? pageNameParam : null,
    };
    mockFileMap.current.set(id, f);
    const meta = [rec, ...serverFiles];
    setServerFiles(meta);
    persistMockMeta(meta);
    return rec;
  };

  const mock_fetchList = async (): Promise<ServerFile[]> => {
    return serverFiles;
  };

  const mock_delete = async (id: number) => {
    mockFileMap.current.delete(id);
    const meta = serverFiles.filter((s) => s.id !== id);
    setServerFiles(meta);
    persistMockMeta(meta);
    return true;
  };

  const mock_overwrite = async (id: number, f: File) => {
    if (!mockFileMap.current.has(id)) throw new Error("Not found");
    mockFileMap.current.set(id, f);
    const url = URL.createObjectURL(f);
    const meta = serverFiles.map((s) =>
      s.id === id
        ? {
            ...s,
            url,
            name: f.name,
            size: f.size,
            uploadedAt: new Date().toISOString(),
          }
        : s
    );
    setServerFiles(meta);
    persistMockMeta(meta);
    return true;
  };

  const mock_parse_getText = async (id: number): Promise<string> => {
    const f = mockFileMap.current.get(id);
    if (!f) throw new Error("File bytes not available in mock (re-upload to test editor).");
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (ext === ".txt") return await f.text();
    try {
      const buf = await f.arrayBuffer();
      if (ext === ".docx") {
        try {
          const r = await mammoth.extractRawText({ arrayBuffer: buf } as any);
          return r.value || "";
        } catch {
          // fallback
        }
      }
      const decoder = new TextDecoder();
      return decoder.decode(new Uint8Array(buf));
    } catch {
      return "";
    }
  };

  // --------------------------
  // Unified API functions (switch real/mock)
  // --------------------------
  const apiUpload = async (f: File, pageNameParam?: string | null) => {
    if (useMock) return mock_upload(f, pageNameParam);
    return real_upload(f, pageNameParam);
  };

  const apiFetchList = async () => {
    if (useMock) return mock_fetchList();
    return real_fetchList();
  };

  const apiDelete = async (id: number) => {
    if (useMock) return mock_delete(id);
    return real_delete(id);
  };

  const apiOverwrite = async (id: number, f: File) => {
    if (useMock) return mock_overwrite(id, f);
    return real_overwrite(id, f);
  };

  // ---- Upload UI action ----
  const upload = async () => {
  if (!file) {
    toast.error("Please select a file first.");
    return;
  }

  setError(null);
  setUploading(true);
  setProgress(0);

  const toastId = toast.loading("Uploading file...");

  try {
    setProgress(8);
    await apiUpload(file, pageName);

    const list = await apiFetchList();
    setServerFiles(Array.isArray(list) ? list : []);

    setFile(null);
    setPreviewText([]);

    setProgress(100);

    toast.success("File uploaded successfully 🎉", { id: toastId });

  } catch (e: any) {
    toast.error(e?.message || "Upload failed", { id: toastId });
  } finally {
    setTimeout(() => {
      setUploading(false);
      setProgress(0);
    }, 300);
  }
};

  // ---- List / Delete ----
  const fetchList = useCallback(async () => {
    try {
      const data = await apiFetchList();
      setServerFiles(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Could not load uploaded files");
    }
  }, [useMock]);

  const deleteFile = async (id: string | number) => {
  const result = await Swal.fire({
    title: "Delete this file?",
    text: "This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Yes, delete it",

    didOpen: () => {
      const el = document.querySelector(".swal2-container") as HTMLElement;
      if (el) el.style.zIndex = "999999999";
    }
  });

  if (!result.isConfirmed) return;

  const toastId = toast.loading("Deleting...");

  try {
    await apiDelete(Number(id));
    await fetchList();

    toast.success("Deleted successfully", { id: toastId });

  } catch (e: any) {
    toast.error(e?.message || "Could not delete file", { id: toastId });
  }
};

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ---- Editor ----
  const openEditor = async (f: ServerFile) => {
    try {
      setError(null);
      if (useMock) {
        const text = await mock_parse_getText(f.id);
        setEditing({ file: f, text });
        return;
      }

      const resp = await fetch(f.url);
      if (!resp.ok) throw new Error(`Failed to download file (${resp.status})`);
      const buf = await resp.arrayBuffer();

      let text = "";
      try {
        const r = await mammoth.extractRawText({ arrayBuffer: buf } as any);
        text = r.value || "";
      } catch {
        try {
          const decoder = new TextDecoder();
          text = decoder.decode(new Uint8Array(buf));
        } catch {
          text = "(Could not extract text for editing)";
        }
      }
      setEditing({ file: f, text });
    } catch (e: any) {
      setError(e?.message || "Failed to open file for editing");
    }
  };

  const closeEditor = () => setEditing({ file: null, text: "" });

  const saveEdit = async () => {
    if (!editing.file) return;
    try {
      setSavingEdit(true);
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: editing.text.split(/\r?\n/).map((line) =>
              new Paragraph({ children: [new TextRun(String(line))] })
            ),
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fname = editing.file.name?.toLowerCase().endsWith(".docx")
        ? editing.file.name
        : `${editing.file.name || "edited"}.docx`;

      const newFile = new File([blob], fname, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      await apiOverwrite(editing.file.id, newFile);

      closeEditor();
      await fetchList();
    } catch (e: any) {
      setError(e?.message || "Failed to save changes");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Word / Text Upload</h1>
          <p className="text-sm text-gray-600">
            Upload .docx/.doc/.rtf/.txt files. Max {MAX_FILE_SIZE_MB} MB.
          </p>
          <div className="text-xs text-gray-500 mt-1">
            API Base: <code>{API_BASE}</code>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm">Mock APIs</label>
          <input
            type="checkbox"
            checked={useMock}
            onChange={(e) => {
              setUseMock(e.target.checked);
              if (e.target.checked) {
                try {
                  const raw = localStorage.getItem(STORAGE_META_KEY);
                  if (raw) setServerFiles(JSON.parse(raw));
                } catch {}
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Uploader */}
        <section className="col-span-12 lg:col-span-5">
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

            {/* 🔥 Page dropdown */}
            {/* <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Tag (optional)
              </label>
              <select
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                {PAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose which page this Word file belongs to, or select{" "}
                <b>No Page</b> to leave it unassigned.
              </p>
            </div> */}

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

                {!!previewText.length && (
                  <div className="mt-4 overflow-auto">
                    <div className="text-xs text-gray-600 mb-1">
                      Preview (first lines)
                    </div>
                    <div className="text-sm border rounded p-2 max-h-36 overflow-auto whitespace-pre-wrap">
                      {previewText.join("\n")}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm mt-3">{error}</div>
            )}

            <div className="text-xs text-gray-500 mt-3">
              Allowed: {ACCEPT_EXT.join(", ")} • Max {MAX_FILE_SIZE_MB}MB
            </div>
          </div>
        </section>

        {/* Right: Uploaded files */}
        <section className="col-span-12 lg:col-span-7">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Uploaded Files</h2>
              <div className="flex gap-2">
                <button
                  onClick={fetchList}
                  className="text-sm px-3 py-1.5 rounded-lg border"
                >
                  Refresh
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(STORAGE_META_KEY);
                    mockFileMap.current.clear();
                    setServerFiles([]);
                  }}
                  className="text-sm px-3 py-1.5 rounded-lg border"
                >
                  Clear Mock
                </button>
              </div>
            </div>

            {serverFiles.length === 0 ? (
              <div className="text-sm text-gray-600">
                No files uploaded yet.
              </div>
            ) : (
              <div className="overflow-auto">
               <div className="overflow-hidden rounded-xl border border-gray-200">
  <table className="min-w-full text-sm">

    <thead>
      <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
        <th className="py-3 px-4">Name</th>
        <th className="py-3 px-4">Page</th>
        <th className="py-3 px-4">Size</th>
        <th className="py-3 px-4">Uploaded</th>
        <th className="py-3 px-4 text-right">Actions</th>
      </tr>
    </thead>

    <tbody className="space-y-1">
      {serverFiles.map((f) => {
        const pageLabel = f.pageName
          ? PAGE_OPTIONS.find((p) => p.value === f.pageName)?.label || f.pageName
          : "StocK Picker";

        return (
          <tr
            key={f.id}
            className="bg-gray-50 hover:bg-blue-50 transition rounded-lg"
          >

            {/* NAME */}
            <td className="py-3 px-4 font-medium text-gray-800">
              {f.name}
            </td>

            {/* PAGE */}
            {/* PAGE */}
<td className="py-3 px-4">
  <span
    className="
      inline-flex
      items-center
      px-3
      py-1
      rounded-full
      text-xs
      font-semibold
      bg-gradient-to-r
      from-violet-100
      to-purple-100
      text-violet-700
      border
      border-violet-200
      shadow-sm
      whitespace-nowrap
    "
  >
    {pageLabel}
  </span>
</td>

            {/* SIZE */}
            <td className="py-3 px-4">
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
              <div className="flex justify-end gap-2">

                {/* VIEW */}
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 transition"
                  title="View"
                >
                  <FiEye size={16} />
                </a>

                {/* COPY */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(f.url);
                    toast.success("Copied!");
                  }}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-green-100 transition"
                  title="Copy URL"
                >
                  <FiCopy size={16} />
                </button>

                {/* EDIT */}
                <button
                  onClick={() => openEditor(f)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-yellow-100 transition"
                  title="Edit"
                >
                  <FiEdit size={16} />
                </button>

                {/* DELETE */}
                <button
                  onClick={() => deleteFile(f.id)}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                  title="Delete"
                >
                  <FiTrash2 size={16} />
                </button>

              </div>
            </td>

          </tr>
        );
      })}
    </tbody>

  </table>
</div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Editor modal */}
      {editing.file && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-[90vw] max-w-4xl max-h-[85vh] rounded-xl border p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Editing: {editing.file.name}</div>
              <div className="flex gap-2">
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

            <textarea
              ref={editingTextRef}
              value={editing.text}
              onChange={(e) =>
                setEditing((p) => ({ ...p, text: e.target.value }))
              }
              className="flex-1 w-full p-2 border rounded resize-none"
            />

            <div className="text-xs text-gray-500 mt-2">
              Tip: Editing converts the text into a simple .docx on save.
              Complex formatting will be lost.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordUploadPage;
