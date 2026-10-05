import React, { useEffect, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const API = {
  ADD_CATEGORY: `${API_BASE}/foliomax/insights-categories`,
  GET_CATEGORIES: `${API_BASE}/foliomax/insights-categories`,
};

const AddInsightCategory = () => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("");

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // ================= AUTO SLUG =================
  useEffect(() => {
    if (!name) {
      setSlug("");
      return;
    }
    setSlug(
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  }, [name]);

  // ================= FETCH CATEGORIES =================
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await fetch(API.GET_CATEGORIES);
      if (!res.ok) throw new Error("Failed to fetch categories");

      const json = await res.json();
      setCategories(json.data || []);
    } catch (err) {
      toast.error(err?.message || "Could not load categories");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim() || !type) {
      toast.error("Name, slug and type are required.");
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
          type, // ✅ ENUM SAFE (ETF | MF | BOTH)
          description: description.trim() || null,
          order: order === "" ? 0 : Number(order),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create category");

      toast.success("Insight category added successfully");

      // Reset
      setName("");
      setSlug("");
      setType("");
      setDescription("");
      setOrder("");

      fetchCategories();
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-6">
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Add Insight Category
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create categories for ETF & Mutual Fund insights.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT FORM */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  readOnly
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              {/* Type (ENUM SAFE) */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Category Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="ETF">ETF</option>
                  <option value="MF">Mutual Fund</option>
                  <option value="BOTH">Both (ETF + MF)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Order */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Display Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Category"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT LIST */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Insight Categories
            </h2>

            {loadingList ? (
              <div className="text-sm text-gray-500 text-center py-10">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-10">
                No categories found.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-500">
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Slug</th>
                    <th className="py-2 text-left">Type</th>
                    <th className="py-2 text-left">Order</th>
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
                      <td className="py-3 text-gray-600">{cat.type}</td>
                      <td className="py-3 text-gray-500">{cat.order ?? 0}</td>
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

export default AddInsightCategory;
