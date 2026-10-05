// src/pages/AddBlog.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";

type BlogCategory = {
  id: number | string;
  name: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "";

const API = {
  CATEGORIES: `${API_BASE}/foliomax/blog-categories/get`,
  ADD_BLOG: `${API_BASE}/foliomax/blogs/create`,
};

const AddBlog: React.FC = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // ================= Fetch Categories =================
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(API.CATEGORIES);
      if (!res.ok) throw new Error("Failed to load categories");
      const json = await res.json();
      setCategories(json.data || []);
    } catch (err: any) {
      const msg = err?.message || "Could not fetch blog categories.";
      setCategoryError(msg);
      toast.error(msg);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ================= Validation =================
  const validateForm = (): string | null => {
    if (!categoryId) return "Please select a category.";
    if (!title.trim()) return "Title is required.";
    if (!authorName.trim()) return "Author name is required.";
    if (!content.trim()) return "Blog content is required.";
    return null;
  };

  // ================= Submit =================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("categoryId", categoryId);
      formData.append("title", title.trim());
      formData.append("subtitle", subtitle.trim());
      formData.append("authorName", authorName.trim());
      formData.append("content", content);
      formData.append("isPublished", String(isPublished));

      if (image) {
        formData.append("image", image);
      }

      const res = await fetch(API.ADD_BLOG, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create blog.");
      }

      toast.success("Blog published successfully.");

      setCategoryId("");
      setTitle("");
      setSubtitle("");
      setAuthorName("");
      setContent("");
      setImage(null);
      setIsPublished(true);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-6 py-6 flex justify-center">
      <div className="w-full max-w-5xl">
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
          <h1 className="text-2xl font-semibold text-gray-900">Add Blog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and publish a new blog post.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Blog Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">
                  {loadingCategories
                    ? "Loading categories..."
                    : "Select category"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categoryError && (
                <p className="text-xs text-red-500">{categoryError}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Blog title"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Subtitle (optional)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Short subtitle"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Author name"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Cover Image
              </label>

              <div
                className={`relative flex flex-col items-center justify-center
                w-full h-44 rounded-xl border-2 border-dashed
                ${
                  image
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
                }
                hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setImage(e.target.files?.[0] || null)
                  }
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                {!image ? (
                  <>
                    <p className="text-sm text-gray-600">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, JPEG (1200×630 recommended)
                    </p>
                  </>
                ) : (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Blog Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Write your blog content here..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Publish */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                Publish immediately
              </span>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white
                           hover:bg-blue-700 focus:ring-2 focus:ring-blue-500
                           disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Save Blog"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBlog;
