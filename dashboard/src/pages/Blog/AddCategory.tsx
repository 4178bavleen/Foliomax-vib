import React, { useEffect, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";

type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  createdAt?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "";

const API = {
  ADD_CATEGORY: `${API_BASE}/foliomax/blog-categories/create`,
  GET_CATEGORIES: `${API_BASE}/foliomax/blog-categories/get`,
};

const AddBlogCategory: React.FC = () => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // ================= Fetch Categories =================
  const fetchCategories = useCallback(async () => {
    setListError(null);
    try {
      setLoadingList(true);
      const res = await fetch(API.GET_CATEGORIES);
      if (!res.ok) throw new Error("Failed to fetch categories");

      const json = await res.json();
      setCategories(json.data || []);
    } catch (err: any) {
      const msg = err?.message || "Could not load categories";
      setListError(msg);
      toast.error(msg);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ================= Submit =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      toast.error("Category name and slug are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(API.ADD_CATEGORY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create category");
      }

      toast.success("Blog category added successfully");
      setName("");
      setSlug("");
      await fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-6">
      <Toaster
        position="top-center"
        toastOptions={{ duration: 2000 }}
        containerStyle={{
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Add Blog Category
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create blog categories used for organizing blog posts.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT FORM */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Investment"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. investment"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400">
                  Used in URLs (lowercase, hyphen separated)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm
                           font-medium text-white hover:bg-blue-700
                           disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Category"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT LIST */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Blog Categories
              </h2>
              <button
                onClick={fetchCategories}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200"
              >
                Refresh
              </button>
            </div>

            {/* ✅ USE listError (fixes TS6133) */}
            {listError && (
              <div className="mb-4 text-sm text-red-600 text-center">
                {listError}
              </div>
            )}

            {loadingList ? (
              <div className="text-sm text-gray-500 text-center py-10">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-10">
                No blog categories found.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500 uppercase">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Slug</th>
                    <th className="py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="py-3 font-medium text-gray-900">
                        {cat.name}
                      </td>
                      <td className="py-3 text-gray-600">{cat.slug}</td>
                      <td className="py-3 text-gray-500">
                        {cat.createdAt
                          ? new Date(cat.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBlogCategory;
