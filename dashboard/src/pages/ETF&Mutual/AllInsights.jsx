import React, { useCallback, useEffect, useState } from "react";
import { MdModeEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import { authHeaders } from "../../lib/authHeaders";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const API = {
  INSIGHTS: `${API_BASE}/foliomax/insights`,
  CATEGORIES: `${API_BASE}/foliomax/insights-categories`,
  DELETE_INSIGHT: (id) => `${API_BASE}/foliomax/insights/${id}`,
};

const AllInsights = () => {
  const [insights, setInsights] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("all");

  // ================= Fetch Insights =================
  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);

      const url =
        categorySlug === "all"
          ? API.INSIGHTS
          : `${API.INSIGHTS}?category=${categorySlug}`;

      const res = await fetch(url);
      const json = await res.json();

      setInsights(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  // ================= Fetch Categories =================
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(API.CATEGORIES);
      const json = await res.json();
      setCategories(json.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ================= Search Filter =================
  const filteredInsights = insights.filter((i) => {
    if (!search.trim()) return true;

    const term = search.toLowerCase();
    return (
      i.title?.toLowerCase().includes(term) ||
      i.content?.toLowerCase().includes(term)
    );
  });

  // ================= Delete Insight =================
  const handleDelete = async (insight) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Insight?",
      text: `Are you sure you want to delete "${insight.title}"?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(API.DELETE_INSIGHT(insight.id), {
        method: "DELETE",
        headers: authHeaders(),
      });
      fetchInsights();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            All Insights
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage all insights.
          </p>
        </div>
        <button
          onClick={fetchInsights}
          className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 px-5 py-4 border-b border-gray-100">
          <div className="min-w-[200px]">
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-64 ml-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or content..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="p-5 overflow-auto">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading insights...
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No insights found.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                  <th className="py-2 text-left">Image</th>
                  <th className="py-2 text-left">Category</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Title</th>
                  <th className="py-2 text-left">Subtitle</th>
                  <th className="py-2 text-left">Content</th>
                  <th className="py-2 text-left">Created</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInsights.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-gray-100 hover:bg-gray-50/40"
                  >
                    {/* Image */}
                    <td className="py-3">
                      {i.coverImage ? (
                        <img
                          src={`${API_BASE}${i.coverImage}`}
                          alt={i.title}
                          className="h-12 w-16 rounded-md object-cover border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-16 flex items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 font-medium text-gray-900">
                      {i.category?.name || "—"}
                    </td>

                    {/* Status */}
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          i.isPublished
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {i.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-3 max-w-sm">{i.title}</td>

                    {/* Subtitle */}
                    <td className="py-3 max-w-sm">
                      {i.subtitle || "—"}
                    </td>

                    {/* Content */}
                    <td className="py-3 text-xs text-gray-500 max-w-xs">
                      <span className="line-clamp-2">{i.content}</span>
                    </td>

                    {/* Created */}
                    <td className="py-3 text-xs text-gray-500 whitespace-nowrap">
                      {i.createdAt
                        ? new Date(i.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100">
                          <MdModeEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(i)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-100 text-red-500 hover:bg-red-50"
                        >
                          <MdDelete className="h-4 w-4" />
                        </button>
                      </div>
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

export default AllInsights;
