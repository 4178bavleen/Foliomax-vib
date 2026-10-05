// src/pages/Subscription/PdfUploadSubscriptionPage.jsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import ComponentCard from "../../components/common/ComponentCard";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { FiEye, FiTrash2, FiUpload, FiX } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.foliomax.in";

const API = {
  UPLOAD: `${API_BASE}/foliomax/admin/pdf/upload`,
  LIST: `${API_BASE}/foliomax/admin/pdf`,
  DELETE: (id) =>
    `${API_BASE}/foliomax/admin/pdf/${encodeURIComponent(String(id))}`,
};

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

const MAX_PDF_SIZE_MB = 50;
const FIXED_TAG = "Subscription";

const PdfUploadSubscriptionPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [serverPdfs, setServerPdfs] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState("");

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ================= VALIDATION =================
  const validateFile = (f) => {
    if (f.type !== "application/pdf") return "Only PDF files are allowed.";
    if (f.size > MAX_PDF_SIZE_MB * 1024 * 1024)
      return `Max file size is ${MAX_PDF_SIZE_MB} MB.`;
    return null;
  };

  // ================= FILE PICK =================
  const handlePickedFile = (file) => {
    if (!file) return;

    const err = validateFile(file);
    if (err) {
      toast.error(err);
      return;
    }

    setSelectedFile(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) handlePickedFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false,
  });

  // ================= UPLOAD =================
  const upload = async () => {
    if (!selectedFile) return toast.error("Select a PDF first");

    const toastId = toast.loading("Uploading...");

    try {
      const form = new FormData();
      form.append("file", selectedFile);
      if (title.trim()) form.append("title", title.trim());

      form.append("tags", JSON.stringify([FIXED_TAG]));

      const res = await fetch(API.UPLOAD, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Upload failed");

      await fetchList();

      setSelectedFile(null);
      setTitle("");
      setPreviewUrl(null);

      toast.success("Uploaded successfully 🚀", { id: toastId });

    } catch (e) {
      toast.error(e.message, { id: toastId });
    }
  };

  // ================= FETCH =================
  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, { headers: authHeaders() });
      const json = await res.json();

      const items = Array.isArray(json)
        ? json
        : json?.data || json?.items || [];

      const normalized = items.map((r) => ({
        id: r.id,
        name: r.title || r.originalName || "Untitled",
        url:
          r.url ||
          (r.storagePath
            ? `${API_BASE}/${r.storagePath}`
            : null),
        tag: Array.isArray(r.tags) ? r.tags[0] : r.tags,
      }));

      setServerPdfs(normalized);

    } catch {
      toast.error("Failed to load PDFs");
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ================= DELETE =================
  const deletePdf = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete PDF?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    const toastId = toast.loading("Deleting...");

    try {
      const res = await fetch(API.DELETE(id), {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error();

      await fetchList();
      toast.success("Deleted", { id: toastId });

    } catch {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const apiBaseDisplay = useMemo(() => API_BASE, []);

  // ================= UI =================
  return (
    <div className="w-full space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Subscription PDFs</h1>
        <p className="text-xs text-gray-500">{apiBaseDisplay}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* LEFT - UPLOAD */}
        <section className="col-span-12 lg:col-span-5">
          <ComponentCard title="Upload PDF">

            <input
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded"
            />

            <div
              {...getRootProps()}
              className="border-dashed border-2 p-8 rounded-xl text-center cursor-pointer hover:bg-gray-50"
            >
              <input {...getInputProps()} />
              <p className="font-medium">Drag & Drop PDF</p>
              <button onClick={open} className="text-blue-500 underline mt-2">
                Browse
              </button>
            </div>

            {selectedFile && (
              <div className="mt-4 flex justify-between items-center border p-3 rounded">
                <span>{selectedFile.name}</span>
                <button
                  onClick={upload}
                  className="flex items-center gap-1 bg-black text-white px-3 py-2 rounded"
                >
                  <FiUpload /> Upload
                </button>
              </div>
            )}

          </ComponentCard>
        </section>

        {/* RIGHT - LIST */}
        <section className="col-span-12 lg:col-span-7">
          <div className="bg-white border rounded-xl p-5">

            <h2 className="font-semibold mb-3">Uploaded PDFs</h2>

            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th>Tag</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {serverPdfs.map((pdf) => (
                  <tr key={pdf.id} className="border-t hover:bg-gray-50">

                    <td className="py-3">{pdf.name}</td>

                    <td>
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs">
                        {pdf.tag}
                      </span>
                    </td>

                    <td className="text-right space-x-2">

                      <button
                        onClick={() => {
                          setLoadingPreview(true);
                          setPdfPreviewUrl(pdf.url);
                        }}
                        className="p-2 bg-gray-100 rounded hover:bg-blue-100"
                      >
                        <FiEye />
                      </button>

                      <button
                        onClick={() => deletePdf(pdf.id)}
                        className="p-2 bg-red-100 text-red-600 rounded"
                      >
                        <FiTrash2 />
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </section>

      </div>

      {/* ================= PDF MODAL ================= */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">

          <div className="bg-white w-[90%] h-[90%] rounded-xl flex flex-col overflow-hidden">

            {/* HEADER */}
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="font-medium">PDF Preview</h3>
              <button
                onClick={() => setPdfPreviewUrl(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <FiX />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 relative">
              {loadingPreview && (
                <div className="absolute inset-0 flex items-center justify-center">
                  Loading...
                </div>
              )}

              <iframe
                src={`${pdfPreviewUrl}#toolbar=0`}
                className="w-full h-full"
                onLoad={() => setLoadingPreview(false)}
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PdfUploadSubscriptionPage;