import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

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
  categoryId: number | string;
  image?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  blog: Blog | null;
  categories: BlogCategory[];
  onUpdated: () => void;
};

const API_BASE = import.meta.env.VITE_API_BASE || "";
const UPDATE_BLOG = (id: Blog["id"]) =>
  `${API_BASE}/foliomax/blogs/update/${id}`;

const EditModal: React.FC<Props> = ({
  open,
  onClose,
  blog,
  categories,
  onUpdated,
}) => {
  const [form, setForm] = useState<Blog | null>(blog);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(blog);
    setImageFile(null);
    setPreview(blog?.image || null);
  }, [blog]);

  if (!open || !form) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) =>
      prev
        ? {
            ...prev,
            [name]:
              type === "checkbox"
                ? !prev.isPublished
                : value,
          }
        : prev
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("subtitle", form.subtitle || "");
      fd.append("content", form.content);
      fd.append("authorName", form.authorName);
      fd.append("categoryId", String(form.categoryId));
      fd.append("isPublished", String(form.isPublished));

      if (imageFile) {
        fd.append("image", imageFile);
      }

      const res = await fetch(UPDATE_BLOG(form.id), {
        method: "PUT",
        body: fd,
      });

      if (!res.ok) throw new Error("Update failed");

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Blog updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });

      onUpdated();
      onClose();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update blog",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Blog</h2>

        <div className="space-y-3">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <input
            name="subtitle"
            value={form.subtitle || ""}
            onChange={handleChange}
            placeholder="Subtitle"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            rows={4}
            placeholder="Content"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />

          <select
            name="categoryId"
            value={String(form.categoryId)}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <div>
            <label className="text-sm font-medium">Blog Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm mt-1"
            />

            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 h-32 rounded-lg object-cover border"
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={handleChange}
            />
            Published
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white"
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
