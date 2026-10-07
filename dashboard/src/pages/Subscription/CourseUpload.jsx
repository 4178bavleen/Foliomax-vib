import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import ComponentCard from "../../components/common/ComponentCard";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { FiEdit, FiEye, FiTrash2, FiUpload } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE || "{{LOCAL_URL}}";

const API = {
  UPLOAD: `${API_BASE}/foliomax/admin/courses/upload`,
  LIST: `${API_BASE}/foliomax/admin/courses`,
  UPDATE: (id) => `${API_BASE}/foliomax/admin/courses/${id}`,
  DELETE: (id) => `${API_BASE}/foliomax/admin/courses/${id}`,
  PLANS: `${API_BASE}/foliomax/admin/subscription/all`,
};

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
});

const MAX_FILE_SIZE_MB = 200;
const MAX_THUMB_SIZE_MB = 5;

const FILE_EXTS = [
  ".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v", ".flv", ".wmv",
  ".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt",
  ".ppt", ".pptx", ".odp",
  ".xls", ".xlsx", ".csv", ".ods",
  ".zip", ".rar", ".7z",
];

const KIND_STYLES = {
  video: "bg-red-100 text-red-600",
  presentation: "bg-orange-100 text-orange-600",
  document: "bg-blue-100 text-blue-600",
  spreadsheet: "bg-green-100 text-green-600",
  archive: "bg-purple-100 text-purple-600",
  other: "bg-gray-100 text-gray-600",
};

const emptyForm = {
  title: "",
  description: "",
  category: "",
  duration: "",
  status: "active",
  sortOrder: "0",
  planId: "",
};

const CourseUpload = () => {
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editFileName, setEditFileName] = useState("");
  const [file, setFile] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [courses, setCourses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // ================= FETCH =================
  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, { headers: authHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Failed to load courses");
      setCourses(json?.data || []);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(API.PLANS, { headers: authHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error("Failed to load plans");
      setPlans(json?.data || []);
    } catch {
      setPlans([]);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchPlans();
  }, [fetchCourses, fetchPlans]);

  // ================= FILE PICKERS =================
  const onDropCourseFile = useCallback((accepted) => {
    const f = accepted?.[0];
    if (!f) return;
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!FILE_EXTS.includes(ext)) {
      toast.error(`File type not allowed (${ext})`);
      return;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Max file size is ${MAX_FILE_SIZE_MB} MB`);
      return;
    }
    setFile(f);
  }, []);

  const courseDrop = useDropzone({
    onDrop: onDropCourseFile,
    multiple: false,
  });

  const onDropThumb = useCallback((accepted) => {
    const f = accepted?.[0];
    if (!f) return;
    if (f.size > MAX_THUMB_SIZE_MB * 1024 * 1024) {
      toast.error(`Thumbnail must be under ${MAX_THUMB_SIZE_MB} MB`);
      return;
    }
    setThumb(f);
  }, []);

  const thumbDrop = useDropzone({
    onDrop: onDropThumb,
    accept: { "image/*": [] },
    multiple: false,
  });

  // ================= SUBMIT (CREATE / UPDATE) =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("Title is required");
    if (!editId && !file) return toast.error("Select a course file");

    setLoading(true);
    const toastId = toast.loading(editId ? "Updating course..." : "Uploading course...");

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("category", form.category.trim());
      fd.append("duration", form.duration);
      fd.append("status", form.status);
      fd.append("sortOrder", form.sortOrder);
      fd.append("planId", form.planId);

      if (file) fd.append("file", file);
      if (thumb) fd.append("thumbnail", thumb);

      const res = await fetch(editId ? API.UPDATE(editId) : API.UPLOAD, {
        method: editId ? "PUT" : "POST",
        headers: authHeaders(),
        body: fd,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Request failed");

      toast.success(editId ? "Course updated" : "Course uploaded", { id: toastId });

      resetForm();
      fetchCourses();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setEditFileName("");
    setFile(null);
    setThumb(null);
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setEditFileName(c.fileName || "");
    setForm({
      title: c.title || "",
      description: c.description || "",
      category: c.category || "",
      duration: c.duration ?? "",
      status: c.status || "active",
      sortOrder: String(c.sortOrder ?? 0),
      planId: c.planId != null ? String(c.planId) : "",
    });
    setFile(null);
    setThumb(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete course?",
      text: "The uploaded file will also be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;

    const toastId = toast.loading("Deleting...");
    try {
      const res = await fetch(API.DELETE(id), {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Delete failed");

      toast.success("Deleted", { id: toastId });
      if (editId === id) resetForm();
      fetchCourses();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  // ================= UI =================
  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Course Upload</h1>
        <p className="text-xs text-gray-500">
          Upload course material (video, PPT, documents & more) and optionally link it to a
          subscription plan.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* FORM */}
        <section className="col-span-12 lg:col-span-5">
          <ComponentCard title={editId ? "Edit Course" : "Upload Course"}>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="text-sm">Title *</label>
                <input
                  value={form.title}
                  onChange={setField("title")}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="e.g. Options Trading Masterclass"
                />
              </div>

              <div className="mb-3">
                <label className="text-sm">Description</label>
                <textarea
                  value={form.description}
                  onChange={setField("description")}
                  rows={3}
                  className="w-full border px-3 py-2 rounded resize-none"
                  placeholder="Short description shown to customers"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm">Category</label>
                  <input
                    value={form.category}
                    onChange={setField("category")}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Stocks"
                  />
                </div>
                <div>
                  <label className="text-sm">Duration (mins)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.duration}
                    onChange={setField("duration")}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-sm">Status</label>
                  <select
                    value={form.status}
                    onChange={setField("status")}
                    className="w-full border px-3 py-2 rounded bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Sort order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={setField("sortOrder")}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm">Plan</label>
                  <select
                    value={form.planId}
                    onChange={setField("planId")}
                    className="w-full border px-3 py-2 rounded bg-white"
                  >
                    <option value="">None (free)</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.duration}mo · ₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COURSE FILE */}
              <div className="mb-3">
                <label className="text-sm">
                  Course file {!editId && "*"}
                </label>
                <div
                  {...courseDrop.getRootProps()}
                  className="border-dashed border-2 p-5 rounded-xl text-center cursor-pointer hover:bg-gray-50"
                >
                  <input {...courseDrop.getInputProps()} />
                  {file ? (
                    <p className="text-sm font-medium text-green-600 break-all">
                      {file.name}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Drag & drop or{" "}
                      <span className="text-blue-500 underline">browse</span> — video, PPT,
                      PDF, Excel, ZIP...
                    </p>
                  )}
                </div>
                {editId && editFileName && !file && (
                  <p className="text-xs text-gray-400 mt-1">
                    Current file: {editFileName} (unchanged unless you pick a new one)
                  </p>
                )}
              </div>

              {/* THUMBNAIL */}
              <div className="mb-4">
                <label className="text-sm">Thumbnail (optional)</label>
                <div
                  {...thumbDrop.getRootProps()}
                  className="border-dashed border-2 p-4 rounded-xl text-center cursor-pointer hover:bg-gray-50"
                >
                  <input {...thumbDrop.getInputProps()} />
                  {thumb ? (
                    <p className="text-sm font-medium text-green-600 break-all">
                      {thumb.name}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Image (JPG, PNG, WEBP...) — max {MAX_THUMB_SIZE_MB}MB
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2 rounded disabled:opacity-50"
                >
                  <FiUpload />
                  {loading
                    ? "Saving..."
                    : editId
                    ? "Update Course"
                    : "Upload Course"}
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </ComponentCard>
        </section>

        {/* TABLE */}
        <section className="col-span-12 lg:col-span-7">
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-3">All Courses ({courses.length})</h2>

            {courses.length === 0 ? (
              <div className="text-sm text-gray-500 py-6 text-center">
                No courses yet — upload your first course.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-3">Course</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Mins</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Plan</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr
                        key={c.id}
                        className="bg-gray-50 hover:bg-blue-50 transition"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {c.thumbnailUrl ? (
                              <img
                                src={c.thumbnailUrl}
                                alt=""
                                className="w-10 h-10 rounded object-cover border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-200 border flex items-center justify-center text-[10px] text-gray-500">
                                {c.fileType || "?"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate max-w-[180px]">
                                {c.title}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">
                                {c.fileName}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-gray-600">
                          {c.category || "—"}
                        </td>

                        <td className="py-3 px-3">{c.duration ?? "—"}</td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              KIND_STYLES[c.fileKind] || KIND_STYLES.other
                            }`}
                          >
                            {c.fileKind || "other"}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {c.plan ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-600">
                              {c.plan.name}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                              Free
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              c.status === "active"
                                ? "bg-green-100 text-green-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => window.open(c.fileUrl, "_blank")}
                              className="p-2 rounded-lg bg-gray-100 hover:bg-blue-100 transition"
                              title="Open file"
                            >
                              <FiEye size={15} />
                            </button>
                            <button
                              onClick={() => handleEdit(c)}
                              className="p-2 rounded-lg bg-gray-100 hover:bg-yellow-100 transition"
                              title="Edit"
                            >
                              <FiEdit size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                              title="Delete"
                            >
                              <FiTrash2 size={15} />
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

export default CourseUpload;
