import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MdModeEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import EditModal from "./EditModal";
import { authHeaders } from "../../lib/authHeaders";

type BlogCategory = {
  id: number | string;
  name: string;
};

type Blog = {
  id: number | string;
  title: string;
  subtitle?: string | null;
  content: string;
  authorName: string;
  isPublished: boolean;
  uploadedAt?: string;
  categoryId: number | string;
  category?: BlogCategory;
};

const API_BASE = import.meta.env.VITE_API_BASE || "";

const API = {
  BLOGS: `${API_BASE}/foliomax/blogs/get`,
  CATEGORIES: `${API_BASE}/foliomax/blog-categories/get`,
  DELETE_BLOG: (id: Blog["id"]) =>
    `${API_BASE}/foliomax/blogs/delete/${id}`,
};

const AllBlog: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [openEdit, setOpenEdit] = useState(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    const res = await fetch(API.BLOGS);
    const json = await res.json();
    setBlogs(json.data || []);
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await fetch(API.CATEGORIES);
    const json = await res.json();
    setCategories(json.data || []);
  }, []);

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, [fetchBlogs, fetchCategories]);

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      if (categoryFilter !== "all" && String(b.categoryId) !== categoryFilter) {
        return false;
      }
      if (search.trim()) {
        const term = search.toLowerCase();
        return (
          b.title.toLowerCase().includes(term) ||
          b.authorName.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [blogs, search, categoryFilter]);

  const handleDelete = async (blog: Blog) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Blog?",
      text: `Are you sure you want to delete "${blog.title}"?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(API.DELETE_BLOG(blog.id), {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error("Delete failed");

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Blog deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchBlogs();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete blog. Please try again.",
      });
    }
  };

  return (
    <>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">All Blogs</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage all blog posts.
            </p>
          </div>
          <button
            onClick={fetchBlogs}
            className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 px-5 py-4 border-b border-gray-100">
            <div className="min-w-[160px]">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-64 ml-auto">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or author..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-5 overflow-auto">
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-500">
                Loading blogs...
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">
                No blogs found.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                    <th className="py-2 text-left">Category</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Title</th>
                    <th className="py-2 text-left">Subtitle</th>
                    <th className="py-2 text-left">Author</th>
                    <th className="py-2 text-left">Content</th>
                    <th className="py-2 text-left">Created</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlogs.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-100 hover:bg-gray-50/40"
                    >
                      <td className="py-3 font-medium text-gray-900">
                        {b.category?.name || "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            b.isPublished
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {b.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-900">{b.title}</td>
                      <td className="py-3 text-gray-600">
                        {b.subtitle || "—"}
                      </td>
                      <td className="py-3 text-gray-800">{b.authorName}</td>
                      <td className="py-3 text-xs text-gray-500">
                        <span className="line-clamp-2">{b.content}</span>
                      </td>
                      <td className="py-3 text-xs text-gray-500">
                        {b.uploadedAt
                          ? new Date(b.uploadedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditBlog(b);
                              setOpenEdit(true);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
                          >
                            <MdModeEdit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(b)}
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

      <EditModal
        open={openEdit}
        blog={editBlog}
        categories={categories}
        onClose={() => setOpenEdit(false)}
        onUpdated={fetchBlogs}
      />
    </>
  );
};

export default AllBlog;
