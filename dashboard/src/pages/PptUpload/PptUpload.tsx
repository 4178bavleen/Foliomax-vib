// src/pages/PptUpload/PptUpload.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import ComponentCard from "../../components/common/ComponentCard";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { FaFilePowerpoint } from "react-icons/fa";
import { FiCopy, FiTrash2, FiDownload } from "react-icons/fi";

export type ServerPpt = {
  id: string | number;
  name: string;
  url: string;
  size?: number;
  uploadedAt?: string;
  pageName?: string | null;
};

export const PPT_PAGE_OPTIONS = [
  { value: "learn-with-us", label: "Learn With Us" },
  { value: "subscription", label: "Subscription Page" },
];

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3010";

const API = {
  UPLOAD: `${API_BASE}/foliomax/admin/ppt/upload`,
  LIST: `${API_BASE}/foliomax/admin/ppt`,
  DELETE: (id: string | number) =>
    `${API_BASE}/foliomax/admin/ppt/${encodeURIComponent(String(id))}`,
};

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken") || ""}`,
});

const MAX_PPT_SIZE_MB = 50;

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

interface PptUploadPageProps {
  defaultPage?: "learn-with-us" | "subscription";
  fixedPage?: boolean;
}

const PptUploadPage: React.FC<PptUploadPageProps> = ({
  defaultPage = "learn-with-us",
  fixedPage = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [selectedPage, setSelectedPage] = useState<string>(
    fixedPage ? (defaultPage ?? "subscription") : defaultPage
  );
  const [activeTab, setActiveTab] = useState<string>(
    fixedPage ? (defaultPage ?? "subscription") : "all"
  );

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverPpts, setServerPpts] = useState<ServerPpt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (f: File) => {
    const validExtensions = [".ppt", ".pptx", ".odp", ".pps", ".ppsx"];
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return "Only presentation files (.ppt, .pptx, .odp, .pps, .ppsx) are allowed.";
    }
    if (f.size > MAX_PPT_SIZE_MB * 1024 * 1024) {
      return `Maximum file size allowed is ${MAX_PPT_SIZE_MB} MB.`;
    }
    return null;
  };

  const handlePickedFile = (file: File | null) => {
    setError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const err = validateFile(file);
    if (err) {
      setError(err);
      toast.error(err);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!title.trim()) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf("."));
      setTitle(nameWithoutExt);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles?.length) return;
    handlePickedFile(acceptedFiles[0]);
  }, [title]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": [".ppsx"],
      "application/vnd.oasis.opendocument.presentation": [".odp"],
    },
    multiple: false,
    noClick: true,
  });

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, {
        method: "GET",
        headers: authHeaders(),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) throw new Error("Failed to fetch presentations");

      const itemsRaw = Array.isArray(json)
        ? json
        : json?.data || json?.items || [];

      const normalized: ServerPpt[] = itemsRaw.map((r: any) => ({
        id: r.id,
        name: r.name ?? r.originalFilename ?? "Untitled Presentation",
        url: r.url ?? "",
        size: r.size ? Number(r.size) : undefined,
        uploadedAt: r.uploadedAt ?? null,
        pageName: r.pageName ?? null,
      }));

      setServerPpts(normalized);
    } catch (e: any) {
      console.error("fetchList error:", e);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const upload = async () => {
    if (!selectedFile) {
      toast.error("Please select a presentation file first.");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(15);

    const toastId = toast.loading("Uploading presentation...");

    try {
      const form = new FormData();
      form.append("file", selectedFile);

      if (title.trim()) form.append("title", title.trim());
      form.append("pageName", selectedPage);

      setProgress(40);

      const res = await fetch(API.UPLOAD, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        const msg = json?.message || json?.error || `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      setProgress(85);
      await fetchList();

      setSelectedFile(null);
      setTitle("");

      setProgress(100);
      toast.success("Presentation uploaded successfully 🎉", { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || "Upload failed", { id: toastId });
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 400);
    }
  };

  const deletePpt = async (id: string | number) => {
    const result = await Swal.fire({
      title: "Delete this presentation?",
      text: "This file will be permanently removed from the server.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
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
      toast.success("Presentation deleted successfully", { id: toastId });
    } catch (e: any) {
      toast.error(e?.message || "Delete failed", { id: toastId });
    }
  };

  const copyUrl = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("Presentation link copied to clipboard!");
  };

  const filteredPpts = useMemo(() => {
    if (activeTab === "all") return serverPpts;
    return serverPpts.filter((p) => p.pageName === activeTab);
  }, [serverPpts, activeTab]);

  const countLearnWithUs = useMemo(
    () => serverPpts.filter((p) => p.pageName === "learn-with-us").length,
    [serverPpts]
  );
  const countSubscription = useMemo(
    () => serverPpts.filter((p) => p.pageName === "subscription").length,
    [serverPpts]
  );

  const apiBaseDisplay = useMemo(() => API_BASE, []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FaFilePowerpoint className="text-[#D04423]" />
            {fixedPage ? "Subscription PPT Upload" : "PPT / Presentation Upload"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {fixedPage
              ? "Upload presentations to be shown directly on the Subscription page."
              : "Upload and manage PowerPoint presentations for the Learn With Us and Subscription pages."}
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
          API Base: <code className="font-mono text-brand-500">{apiBaseDisplay}</code>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Upload Form Card */}
        <section className="col-span-12 lg:col-span-5">
          <ComponentCard title={fixedPage ? "Upload Subscription PPT" : "Upload Presentation"}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Presentation Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fundamental Analysis Guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Page
                </label>
                {fixedPage ? (
                  <div className="w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-900/40 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-medium flex items-center justify-between">
                    <span>Subscription Page</span>
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded">
                      Fixed
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {PPT_PAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  Select which frontend page will display this presentation.
                </p>
              </div>

              <div
                {...getRootProps()}
                onClick={open}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? "border-brand-500 bg-brand-50/20 dark:bg-brand-950/20"
                    : "border-gray-300 dark:border-gray-700 hover:border-brand-400 bg-gray-50/50 dark:bg-gray-900/40"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mb-3 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-[#D04423]">
                    <FaFilePowerpoint size={24} />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {isDragActive ? "Drop the presentation here" : "Drag & Drop Presentation Here"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Supports .pptx, .ppt, .odp (up to {MAX_PPT_SIZE_MB}MB)
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                    className="mt-3 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Browse Local File
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              {selectedFile && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FaFilePowerpoint className="text-[#D04423] shrink-0" size={20} />
                      <div className="truncate">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatBytes(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={upload}
                      disabled={uploading}
                      className="shrink-0 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {uploading ? `Uploading (${progress}%)` : "Upload PPT"}
                    </button>
                  </div>

                  {uploading && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-brand-500 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </ComponentCard>
        </section>

        {/* Uploaded Presentations Table */}
        <section className="col-span-12 lg:col-span-7">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Uploaded Presentations
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total: {serverPpts.length} presentation{serverPpts.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                onClick={fetchList}
                className="text-xs self-start sm:self-auto text-gray-600 dark:text-gray-400 hover:text-brand-500 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg"
              >
                Refresh
              </button>
            </div>

            {/* Filter Tabs */}
            {!fixedPage && (
              <div className="flex items-center gap-1.5 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${
                    activeTab === "all"
                      ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  All ({serverPpts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("learn-with-us")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                    activeTab === "learn-with-us"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-500 hover:text-emerald-600 dark:text-gray-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Learn With Us ({countLearnWithUs})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("subscription")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                    activeTab === "subscription"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-500 hover:text-indigo-600 dark:text-gray-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Subscription ({countSubscription})
                </button>
              </div>
            )}

            {filteredPpts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-600 border border-dashed rounded-lg border-gray-200 dark:border-gray-800">
                <FaFilePowerpoint size={36} className="mx-auto mb-2 opacity-40 text-[#D04423]" />
                <p className="text-sm">No presentations found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activeTab === "all"
                    ? "Use the upload box on the left to add a PPT"
                    : `No presentations assigned to '${activeTab === "learn-with-us" ? "Learn With Us" : "Subscription"}' yet`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                      <th className="py-3 px-3">Presentation</th>
                      <th className="py-3 px-3">Page</th>
                      <th className="py-3 px-3">Size</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredPpts.map((ppt) => (
                      <tr
                        key={ppt.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                      >
                        <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">
                          <div className="flex items-center gap-2">
                            <FaFilePowerpoint className="text-[#D04423] shrink-0" size={18} />
                            <div className="truncate max-w-[180px] sm:max-w-xs" title={ppt.name}>
                              <p className="truncate font-medium">{ppt.name}</p>
                              {ppt.uploadedAt && (
                                <p className="text-[10px] text-gray-400">
                                  {new Date(ppt.uploadedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {ppt.pageName === "learn-with-us" ? (
                            <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                              Learn With Us
                            </span>
                          ) : ppt.pageName === "subscription" ? (
                            <span className="px-2.5 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium">
                              Subscription Page
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-medium">
                              {ppt.pageName || "General"}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatBytes(ppt.size)}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ppt.url && (
                              <>
                                <a
                                  href={ppt.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Download / View"
                                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition"
                                >
                                  <FiDownload size={14} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyUrl(ppt.url)}
                                  title="Copy Link"
                                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-green-100 dark:hover:bg-green-950/40 text-gray-600 dark:text-gray-400 hover:text-green-600 transition"
                                >
                                  <FiCopy size={14} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => deletePpt(ppt.id)}
                              title="Delete Presentation"
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PptUploadPage;
