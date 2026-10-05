import React, { useEffect, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const API = {
  GET_CATEGORIES: `${API_BASE}/foliomax/insights-categories`,
  ADD_INSIGHT: `${API_BASE}/foliomax/insights`,
};

const AddInsight = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // REQUIRED FIELDS
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState(""); // ETF | MF | BOTH
  const [content, setContent] = useState("");

  // OPTIONAL FIELDS
  const [shortDescription, setShortDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [readingTime, setReadingTime] = useState("");
  const [image, setImage] = useState(null);
  const [isFeatured, setIsFeatured] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ================= AUTO SLUG =================
  useEffect(() => {
    if (!title) {
      setSlug("");
      return;
    }
    setSlug(
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  }, [title]);

  // ================= FETCH CATEGORIES =================
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(API.GET_CATEGORIES);
      const json = await res.json();
      setCategories(json.data || []);
    } catch {
      toast.error("Could not load categories");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ================= VALIDATION =================
  const validateForm = () => {
    if (!categoryId) return "Please select a category";
    if (!title.trim()) return "Title is required";
    if (!slug.trim()) return "Slug is required";
    if (!type) return "Insight type is required";
    if (!content.trim()) return "Content is required";
    return null;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
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
      formData.append("slug", slug);
      formData.append("type", type); // ✅ ENUM SAFE
      formData.append("content", content);
      formData.append("shortDescription", shortDescription.trim());
      formData.append("authorName", authorName.trim());
      formData.append("readingTime", readingTime.trim());
      formData.append("isFeatured", String(isFeatured));

      if (image) {
        formData.append("coverImage", image); // ✅ multer-safe
      }

      const res = await fetch(API.ADD_INSIGHT, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      toast.success("Insight created successfully");

      // Reset
      setCategoryId("");
      setTitle("");
      setSlug("");
      setType("");
      setContent("");
      setShortDescription("");
      setAuthorName("");
      setReadingTime("");
      setImage(null);
      setIsFeatured(false);
    } catch (err) {
      toast.error(err.message || "Failed to create insight");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-6 py-6 max-w-4xl">
      <Toaster position="top-center" />

      <h1 className="text-2xl font-semibold mb-6">Add Insight</h1>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl border">

        {/* Category */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">
            {loadingCategories ? "Loading..." : "Select category"}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border px-3 py-2 rounded"
        />

        {/* Slug */}
        <input
          value={slug}
          readOnly
          className="w-full border px-3 py-2 rounded bg-gray-100"
        />

        {/* Type */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">Select Insight Type</option>
          <option value="ETF">ETF</option>
          <option value="MF">Mutual Fund</option>
          <option value="BOTH">Both</option>
        </select>

        {/* Short Description */}
        <textarea
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Short description"
          rows={3}
          className="w-full border px-3 py-2 rounded"
        />

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Insight content"
          rows={8}
          className="w-full border px-3 py-2 rounded"
        />

        {/* Author + Time */}
        <div className="grid grid-cols-2 gap-4">
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name"
            className="border px-3 py-2 rounded"
          />
          <input
            value={readingTime}
            onChange={(e) => setReadingTime(e.target.value)}
            placeholder="Reading time (e.g. 5 min)"
            className="border px-3 py-2 rounded"
          />
        </div>

        {/* Image */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />

        {/* Featured */}
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Featured Insight
        </label>

        <button
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {submitting ? "Saving..." : "Save Insight"}
        </button>
      </form>
    </div>
  );
};

export default AddInsight;
