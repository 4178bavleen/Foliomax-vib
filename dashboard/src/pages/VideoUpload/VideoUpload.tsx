// src/pages/video-upload.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import ComponentCard from "../../components/common/ComponentCard";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { FiEye, FiCopy, FiTrash2 } from "react-icons/fi";

type ServerVideo = {
  id: string | number;
  name: string;
  url: string;
  size?: number;
  uploadedAt?: string;
  tag?: string | null;
};

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.foliomax.in";

const API = {
  UPLOAD: `${API_BASE}/foliomax/admin/video/upload`,
  LIST: `${API_BASE}/foliomax/admin/video`,
  GET: (id: string | number) =>
    `${API_BASE}/foliomax/admin/video/${encodeURIComponent(String(id))}`,
  DELETE: (id: string | number) =>
    `${API_BASE}/foliomax/admin/video/${encodeURIComponent(String(id))}`,
  OVERWRITE: (id: string | number) =>
    `${API_BASE}/foliomax/admin/video/${encodeURIComponent(String(id))}/overwrite`,
};

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

const MAX_VIDEO_SIZE_MB = 500; // tweak as you like

// Tag options
const TAG_OPTIONS = ["education", "training", "marketing", "other"];

// Dev helper: inject a test item using the uploaded file path in your history.
// Set to false for production.
const DEV_INJECT_TEST = false;
const DEV_TEST_URL = "/mnt/data/98d0c570-9365-4318-b475-29d013386eaf.png";

const VideoUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>(TAG_OPTIONS[0]);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverVideos, setServerVideos] = useState<ServerVideo[]>(
    DEV_INJECT_TEST
      ? [
          {
            id: "local-test-1",
            name: "Dev Test File (local)",
            url: DEV_TEST_URL,
            size: 0,
            uploadedAt: new Date().toISOString(),
            tag: TAG_OPTIONS[0],
          },
        ]
      : []
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ===== Helpers =====
  const validateFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      return "Only video files are allowed.";
    }
    if (f.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      return `Max file size is ${MAX_VIDEO_SIZE_MB} MB.`;
    }
    return null;
  };

  const handlePickedFile = (file: File | null) => {
   
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    const err = validateFile(file);
    if (err) {
      toast.error(err);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    // Preview using object URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ===== Dropzone =====
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    handlePickedFile(acceptedFiles[0]); // single file at a time
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "video/*": [],
    },
    multiple: false,
  });

  // ===== Upload logic =====
  const upload = async () => {
  if (!selectedFile) {
    toast.error("Please select a file first.");
    return;
  }

  
  setUploading(true);
  setProgress(0);

  const toastId = toast.loading("Uploading video...");

  try {
    const form = new FormData();
    form.append("file", selectedFile);

    if (selectedTag) {
      form.append("tags", JSON.stringify([selectedTag]));
    }

    setProgress(10);

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
      const msg = json?.message || `Upload failed (${res.status})`;
      throw new Error(msg);
    }

    setProgress(80);
    await fetchList();

    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setProgress(100);
    console.log("uploaded");
    toast.success("Upload successful 🎉", { id: toastId });
  } catch (e: any) {
    toast.error(e?.message || "Upload failed", { id: toastId });
  } finally {
    setTimeout(() => {
      setUploading(false);
      setProgress(0);
    }, 400);
  }
};



  // ===== List / Delete =====
  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, {
        method: "GET",
        headers: authHeaders(),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message || `Failed to fetch videos (${res.status})`;
        throw new Error(msg);
      }

      let itemsRaw: any[] = [];

      if (Array.isArray(json)) {
        itemsRaw = json;
      } else if (json && Array.isArray(json.data)) {
        // shape: { ok:true, data: [...], meta: {...} }
        itemsRaw = json.data;
      } else if (json && Array.isArray(json.items)) {
        itemsRaw = json.items;
      } else {
        itemsRaw = [];
      }

      const normalized: ServerVideo[] = itemsRaw.map((r: any) => {
        const id = r.id ?? r.videoId ?? r.fileId ?? null;
        const name = r.title ?? r.name ?? r.originalName ?? "untitled";
        const url =
          r.url ??
          (r.storagePath
            ? `${API_BASE.replace(/\/$/, "")}/${String(r.storagePath).replace(/^\/+/, "")}`
            : null) ??
          null;
        const size = r.sizeBytes ?? r.size ?? null;
        const uploadedAt = r.uploadedAt ?? r.createdAt ?? r.created_at ?? null;
        const tag = r.tags ? (Array.isArray(r.tags) ? r.tags[0] : r.tags) : (r.tag ?? null);

        return { id, name, url, size, uploadedAt, tag } as ServerVideo;
      });

      // if nothing returned and developer injection is enabled, keep dev item
      if (normalized.length === 0 && DEV_INJECT_TEST && serverVideos.length === 0) {
        setServerVideos([
          {
            id: "local-test-1",
            name: "Dev Test File (local)",
            url: DEV_TEST_URL,
            size: 0,
            uploadedAt: new Date().toISOString(),
            tag: TAG_OPTIONS[0],
          },
        ]);
        return;
      }

      setServerVideos(normalized);
    } catch (e: any) {
      console.error("fetchList error:", e);
      toast.error(e?.message || "Could not load uploaded videos");
    }
  }, [serverVideos.length]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const deleteVideo = async (id: string | number) => {
const result = await Swal.fire({
  title: "Delete this video?",
  text: "This action cannot be undone!",
  icon: "warning",
  showCancelButton: true,
  confirmButtonColor: "#d33",
  confirmButtonText: "Yes, delete it",

  didOpen: () => {
    const container = document.querySelector(".swal2-container") as HTMLElement;
    if (container) {
      container.style.zIndex = "999999999";
    }
  }
});

  if (!result.isConfirmed) return;

  const toastId = toast.loading("Deleting...");

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
      } catch {}
      throw new Error(msg);
    }

    await fetchList();
    toast.success("Deleted successfully", { id: toastId });
  } catch (e: any) {
    toast.error(e?.message || "Could not delete video", { id: toastId });
  }
};

  const apiBaseDisplay = useMemo(() => API_BASE, []);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Video Upload</h1>
        <p className="text-sm text-gray-600">
          Upload any video file (MP4, MOV, WEBM, etc.). You can use the public URL on your
          frontend site.
        </p>
        <div className="text-xs text-gray-500 mt-1">
          API Base: <code>{apiBaseDisplay}</code>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Dropzone + selected video preview */}
        <section className="col-span-12 lg:col-span-5">
          <ComponentCard title="Video Dropzone">
            {/* Tag selector above dropzone */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tag</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500">
              <div
                {...getRootProps()}
                className={`dropzone rounded-xl border-dashed border-gray-300 p-7 lg:p-10
                  ${
                    isDragActive
                      ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
                      : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                  }
                `}
              >
                {/* Hidden Input - let react-dropzone manage the ref */}
                <input {...getInputProps()} />

                <div className="dz-message flex flex-col items-center m-0!">
                  {/* Icon Container */}
                  <div className="mb-[22px] flex justify-center">
                    <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      {/* Simple video icon (play button) */}
                      <svg
                        className="fill-current"
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M4 3.5C4 2.67157 4.67157 2 5.5 2H18.5C19.3284 2 20 2.67157 20 3.5V20.5C20 21.3284 19.3284 22 18.5 22H5.5C4.67157 22 4 21.3284 4 20.5V3.5ZM10 8.26795V15.7321C10 16.2953 10.613 16.6306 11.0801 16.3214L16.0129 13.0893C16.4418 12.8066 16.4418 12.1934 16.0129 11.9107L11.0801 8.67863C10.613 8.36937 10 8.70472 10 8.26795Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Text Content */}
                  <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                    {isDragActive ? "Drop Videos Here" : "Drag & Drop Videos Here"}
                  </h4>

                  <span className="text-center mb-5 block w-full max-w-[320px] text-sm text-gray-700 dark:text-gray-400">
                    Drag and drop your video files here or browse from your computer.
                  </span>

                  <button
                    type="button"
                    onClick={open}
                    className="font-medium underline text-theme-sm text-brand-500"
                  >
                    Browse File
                  </button>
                </div>
              </div>
            </div>

            {/* Selected file summary + upload button */}
            {selectedFile && (
              <div className="mt-4 rounded-lg border p-3 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium break-all">{selectedFile.name}</div>
                    <div className="text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    <div className="text-xs text-gray-500">Type: {selectedFile.type || "—"}</div>
                    <div className="text-xs text-gray-500 mt-1">Tag: <b>{selectedTag}</b></div>
                  </div>
                  {!uploading ? (
                    <button
                      onClick={upload}
                      className="rounded-lg px-4 py-2 bg-black text-white text-sm"
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
                      <div className="text-xs mt-1 text-gray-600">{progress}%</div>
                    </div>
                  )}
                </div>

                {/* Preview player */}
                {previewUrl && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 mb-1">Preview</div>
                    <video src={previewUrl} controls className="w-full max-h-64 rounded border" />
                  </div>
                )}
              </div>
            )}

            

            <div className="text-xs text-gray-500 mt-3">
              Allowed: all <code>video/*</code> types • Max {MAX_VIDEO_SIZE_MB}MB
            </div>
          </ComponentCard>
        </section>

        {/* Right: Uploaded videos list */}
        <section className="col-span-12 lg:col-span-7">
          <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Uploaded Videos</h2>
              <button onClick={fetchList} className="text-sm px-3 py-1.5 rounded-lg border">
                Refresh
              </button>
            </div>

            {serverVideos.length === 0 ? (
              <div className="text-sm text-gray-600">No videos uploaded yet.</div>
            ) : (
              <div className="overflow-auto">
               <div className="overflow-hidden rounded-xl border border-gray-200">
  <table className="min-w-full text-sm">

    <thead>
      <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
        <th className="py-3 px-4">Name</th>
        <th className="py-3 px-4">Size</th>
        <th className="py-3 px-4">Uploaded</th>
        <th className="py-3 px-4">Tag</th>
        <th className="py-3 px-4 text-right">Actions</th>
      </tr>
    </thead>

    <tbody className="space-y-2">
      {serverVideos.map((v) => (
        <tr
          key={v.id}
          className="bg-gray-50 hover:bg-blue-50 transition rounded-lg"
        >

          {/* NAME */}
          <td className="py-3 px-4 font-medium text-gray-800 break-all">
            {v.name}
          </td>

          {/* SIZE */}
          <td className="py-3 px-4">
            {v.size
              ? `${(v.size / (1024 * 1024)).toFixed(2)} MB`
              : "—"}
          </td>

          {/* DATE */}
          <td className="py-3 px-4 text-gray-600">
            {v.uploadedAt
              ? new Date(v.uploadedAt).toLocaleString()
              : "—"}
          </td>

          {/* TAG */}
          <td className="py-3 px-4">
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
              {v.tag ?? "—"}
            </span>
          </td>

          {/* ACTIONS */}
          <td className="py-3 px-4">
            <div className="flex justify-end gap-2">

              {/* VIEW */}
              <a
                href={v.url}
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
                  navigator.clipboard.writeText(String(v.url));
                  toast.success("Copied!");
                }}
                className="p-2 rounded-lg bg-gray-100 hover:bg-green-100 transition"
                title="Copy URL"
              >
                <FiCopy size={16} />
              </button>

              {/* DELETE */}
              <button
                onClick={() => deleteVideo(v.id)}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                title="Delete"
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
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default VideoUploadPage;
