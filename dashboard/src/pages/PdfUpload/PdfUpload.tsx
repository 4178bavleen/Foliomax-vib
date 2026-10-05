// src/pages/pdf-upload.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import ComponentCard from "../../components/common/ComponentCard";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

import { FiEye,  FiTrash2 } from "react-icons/fi";

type ServerPdf = {
  id: string | number;
  name: string;
  url: string;
  size?: number;
  uploadedAt?: string;
  tag?: string | null;
};

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.foliomax.in";

const API = {
  UPLOAD: `${API_BASE}/foliomax/admin/pdf/upload`,
  LIST: `${API_BASE}/foliomax/admin/pdf`,
  DELETE: (id: string | number) =>
    `${API_BASE}/foliomax/admin/pdf/${encodeURIComponent(String(id))}`,
};

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

const MAX_PDF_SIZE_MB = 50;

const TAG_OPTIONS = ["Stock Picker",  "Subscription"];

const PdfUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>(TAG_OPTIONS[0]);

  // ✅ FIX: unused variables renamed
  const [_error, setError] = useState<string | null>(null);
  const [_uploading, setUploading] = useState(false);
  const [_progress, setProgress] = useState(0);

  const [serverPdfs, setServerPdfs] = useState<ServerPdf[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const validateFile = (f: File) => {
    if (f.type !== "application/pdf") return "Only PDF files are allowed.";
    if (f.size > MAX_PDF_SIZE_MB * 1024 * 1024)
      return `Max file size is ${MAX_PDF_SIZE_MB} MB.`;
    return null;
  };

  const handlePickedFile = (file: File | null) => {
    setError(null);
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const err = validateFile(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles?.length) return;
    handlePickedFile(acceptedFiles[0]);
  }, [previewUrl]);

  // ✅ FIX: isDragActive renamed
  const { getRootProps, getInputProps, isDragActive: _isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false,
  });

  const upload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    const toastId = toast.loading("Uploading PDF...");

    try {
      const form = new FormData();
      form.append("file", selectedFile);

      if (title.trim()) form.append("title", title.trim());
      if (selectedTag) form.append("tags", JSON.stringify([selectedTag]));

      setProgress(10);

      const res = await fetch(API.UPLOAD, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });

      const text = await res.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok) {
        const msg = json?.message || `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      setProgress(80);
      await fetchList();

      setSelectedFile(null);
      setTitle("");

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      setProgress(100);
      toast.success("PDF uploaded successfully 🎉", { id: toastId });

    } catch (e: any) {
      toast.error(e?.message || "Upload failed", { id: toastId });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 400);
    }
  };

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, {
        method: "GET",
        headers: authHeaders(),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) throw new Error("Failed to fetch PDFs");

      const itemsRaw = Array.isArray(json)
        ? json
        : json?.data || json?.items || [];

      const normalized: ServerPdf[] = itemsRaw.map((r: any) => ({
        id: r.id,
        name: r.title ?? r.originalName ?? "untitled",
        url: r.url ??
          (r.storagePath
            ? `${API_BASE.replace(/\/$/, "")}/${String(r.storagePath).replace(/^\/+/, "")}`
            : null),
        size: r.sizeBytes ?? null,
        uploadedAt: r.uploadedAt ?? null,
        tag: r.tags ? (Array.isArray(r.tags) ? r.tags[0] : r.tags) : null,
      }));

      setServerPdfs(normalized);
    } catch (e: any) {
      setError(e?.message || "Could not load PDFs");
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const deletePdf = async (id: string | number) => {
    const result = await Swal.fire({
      title: "Delete this PDF?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    const toastId = toast.loading("Deleting...");

    try {
      const res = await fetch(API.DELETE(id), {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error("Delete failed");

      await fetchList();
      toast.success("Deleted successfully", { id: toastId });

    } catch (e: any) {
      toast.error(e?.message || "Delete failed", { id: toastId });
    }
  };

  const apiBaseDisplay = useMemo(() => API_BASE, []);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">PDF Upload</h1>
        <div className="text-xs text-gray-500 mt-1">
          API Base: <code>{apiBaseDisplay}</code>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-5">
          <ComponentCard title="PDF Dropzone">

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tag</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                {TAG_OPTIONS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div {...getRootProps()} className="rounded-xl border-dashed border p-7 bg-gray-50">
              <input {...getInputProps()} />
              <div className="text-center">
                <h4 className="font-semibold">Drag & Drop PDF Here</h4>
                <button onClick={open} className="mt-2 underline text-blue-500">
                  Browse File
                </button>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 border p-3 rounded">
                <div className="flex justify-between">
                  <div>
                    <div>{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                  <button onClick={upload} className="bg-black text-white px-4 py-2 rounded">
                    Upload
                  </button>
                </div>
              </div>
            )}
          </ComponentCard>
        </section>

        <section className="col-span-12 lg:col-span-7">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-3">Uploaded PDFs</h2>

            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Tag</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="space-y-2">
                {serverPdfs.map((v) => (
                  <tr
                    key={v.id}
                    className="bg-gray-50 hover:bg-blue-50 transition rounded-lg"
                  >
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {v.name}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                        {v.tag ?? "—"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">

                        <a
                          href={v.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 transition"
                        >
                          <FiEye size={16} />
                        </a>

                        {/* <button className="p-2 rounded-lg bg-gray-100 hover:bg-yellow-100 transition">
                          <FiEdit size={16} />
                        </button> */}

                        <button
                          onClick={() => deletePdf(v.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                        >
                          <FiTrash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </section>
      </div>
    </div>
  );
};

export default PdfUploadPage;