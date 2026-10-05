import React, { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import "quill/dist/quill.snow.css";

/* ================= TYPES ================= */

type SiteContentItem = {
  id: number | string;
  key: string;
  value: string;
  pageName?: string | null;
  updatedAt?: string;
};

/* ================= API ================= */

const API_BASE = import.meta.env.VITE_API_BASE || "";

const API = {
  LIST: `${API_BASE}/foliomax/admin/content`,
  UPSERT: `${API_BASE}/foliomax/admin/content`,
};

/* ================= QUILL CONFIG ================= */

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "blockquote"],
    ["clean"],
  ],
};

/* ================= COMPONENT ================= */

const SiteContent: React.FC = () => {
  const [items, setItems] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // form
  const [keyName, setKeyName] = useState("");
  const [pageName, setPageName] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= FIXED QUILL (SAFE LOAD) ================= */

  const [quillData, setQuillData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    import("react-quilljs").then(({ useQuill }) => {
      if (!mounted) return;

      const q = useQuill({
        theme: "snow",
        modules: quillModules,
      });

      setQuillData(q);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const quill = quillData?.quill;
  const quillRef = quillData?.quillRef;

  /* ================= SYNC ================= */

  useEffect(() => {
    if (!quill) return;

    quill.root.innerHTML = value || "";

    quill.on("text-change", () => {
      setValue(quill.root.innerHTML);
    });
  }, [quill]);

  useEffect(() => {
    if (quill && quill.root.innerHTML !== value) {
      quill.root.innerHTML = value || "";
    }
  }, [value, quill]);

  /* ================= FETCH ================= */

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(API.LIST, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load site content");
      const payload = await res.json();
      setItems(payload.data ?? []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  /* ================= SAVE ================= */

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyName.trim()) return toast.error("Key is required");
    if (!value.trim()) return toast.error("Content is required");

    try {
      setSaving(true);
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(API.UPSERT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: keyName.trim(),
          value,
          pageName: pageName.trim() || null,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to save content");
      }

      toast.success("Content saved");
      setKeyName("");
      setPageName("");
      setValue("");
      fetchContent();
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="px-6 py-6">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Site Content</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage About, Privacy, Terms, Disclaimer and other CMS content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Add / Update Content</h2>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Key
              </label>
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="about.mission"
              />
            </div>

            {/* Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Page (optional)
              </label>
              <input
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="about"
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>

              <div className="border rounded-lg bg-white">
                {quillRef ? (
                  <div ref={quillRef} />
                ) : (
                  <p className="p-3 text-sm text-gray-400">
                    Loading editor...
                  </p>
                )}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Content"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Table (UNCHANGED) */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
          <h2 className="text-lg font-medium mb-3">All Content</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2">Key</th>
                  <th className="py-2">Page</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-3 pr-4 font-mono text-xs">{c.key}</td>
                    <td className="py-3 pr-4">{c.pageName || "-"}</td>
                    <td className="py-3 pr-4">
                      {c.updatedAt
                        ? new Date(c.updatedAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteContent;