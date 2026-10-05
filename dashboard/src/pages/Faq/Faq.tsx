import React, { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

type Category = {
  id: number | string;
  name: string;
  code?: string | null;
};

type FaqItem = {
  id: number | string;
  question: string;
  answer: string | null;
  categoryId: number | string;
  isPublished?: boolean;
  order?: number | null;
  metadata?: any;
  createdAt?: string | null;
};

const API_BASE = import.meta.env.VITE_API_BASE || "";
const API = {
  CATEGORIES: `${API_BASE}/foliomax/admin/faq-categories`,
  CREATE_CATEGORY: `${API_BASE}/foliomax/admin/faq-category`,
  UPDATE_CATEGORY: `${API_BASE}/foliomax/admin/faq-category`,
  CREATE_FAQ: `${API_BASE}/foliomax/admin/faq`,
  FAQS: `${API_BASE}/foliomax/admin/faqs`,
  DELETE_FAQ: `${API_BASE}/foliomax/admin/faq`,
};

const Faq: React.FC = () => {
  // categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // modal for managing categories
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // faq form
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [order, setOrder] = useState<string>("");
  const [metadata, setMetadata] = useState<string>("");

  const [submittingFaq, setSubmittingFaq] = useState(false);

  // faqs table
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [faqsError, setFaqsError] = useState<string | null>(null);

  // ===== Fetch categories =====
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(API.CATEGORIES + "?limit=500", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
      const payload = await res.json();
      const list: Category[] = Array.isArray(payload) ? payload : payload.data ?? [];
      setCategories(list);
    } catch (err: any) {
      const m = err?.message || "Could not load categories";
      toast.error(m);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // ===== Fetch faqs =====
  const fetchFaqs = useCallback(async () => {
    setLoadingFaqs(true);
    setFaqsError(null);
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(API.FAQS + "?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Failed to load faqs (${res.status})`);
      const payload = await res.json();
      const list: FaqItem[] = Array.isArray(payload) ? payload : payload.data ?? [];
      setFaqs(list);
    } catch (err: any) {
      const m = err?.message || "Could not load faqs";
      setFaqsError(m);
      toast.error(m);
    } finally {
      setLoadingFaqs(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchFaqs();
  }, [fetchCategories, fetchFaqs]);

  // ===== Create category =====
  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!categoryName.trim()) return toast.error("Category name is required");

    try {
      setCreatingCategory(true);
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(API.CREATE_CATEGORY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: categoryName.trim() }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create category");
      }

      const payload = await res.json();
      const created: Category = payload.data ?? payload;
      setCategories((p) => [created, ...p]);
      setCategoryName("");
      toast.success("Category created");
    } catch (err: any) {
      toast.error(err?.message || "Could not create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  // ===== Create FAQ =====
  const validateFaq = (): string | null => {
    if (!selectedCategoryId) return "Please select a category";
    if (!question.trim()) return "Question is required";
    return null;
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();

    const v = validateFaq();
    if (v) return toast.error(v);

    try {
      setSubmittingFaq(true);
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const payload = {
        question: question.trim(),
        answer: answer.trim() || null,
        categoryId: Number(selectedCategoryId),
        isPublished: Boolean(isPublished),
        order: order ? Number(order) : null,
        metadata: metadata ? JSON.parse(metadata) : null,
      };

      const res = await fetch(API.CREATE_FAQ, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create FAQ");
      }

      const pl = await res.json();
      const created: FaqItem = pl.data ?? pl;
      setFaqs((p) => [created, ...p]);
      // reset form
      setQuestion("");
      setAnswer("");
      setOrder("");
      setMetadata("");
      setIsPublished(true);
      toast.success("FAQ added");
    } catch (err: any) {
      toast.error(err?.message || "Could not add faq");
    } finally {
      setSubmittingFaq(false);
    }
  };

  // ===== Simple delete (optimistic) =====
  const handleDeleteFaq = async (id: number | string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      setFaqs((p) => p.filter((f) => String(f.id) !== String(id)));

      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API.DELETE_FAQ}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to delete faq (${res.status})`);
      }
      toast.success("FAQ deleted");
    } catch (err: any) {
      toast.error(err?.message || "Could not delete faq");
      fetchFaqs();
    }
  };

  // ===== Category modal actions =====
  const openCategoriesModal = () => setShowCategoriesModal(true);
  const closeCategoriesModal = () => {
    setShowCategoriesModal(false);
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const startEditCategory = (c: Category) => {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name);
  };

  const handleSaveEditedCategory = async () => {
    if (!editingCategoryId) return;
    if (!editingCategoryName.trim()) return toast.error("Name is required");

    try {
      setModalLoading(true);
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API.UPDATE_CATEGORY}/${editingCategoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingCategoryName.trim() }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to update category (${res.status})`);
      }
      const pl = await res.json();
      const updated: Category = pl.data ?? pl;
      setCategories((prev) =>
        prev.map((c) => (String(c.id) === String(updated.id) ? updated : c)),
      );
      toast.success("Category updated");
      setEditingCategoryId(null);
      setEditingCategoryName("");
    } catch (err: any) {
      toast.error(err?.message || "Could not update category");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number | string) => {
    if (!confirm("Delete this category? This will remove it permanently.")) return;
    try {
      setModalLoading(true);

      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // backend in your earlier code expected DELETE at CREATE_CATEGORY/:id (with optional ?soft)
      const res = await fetch(`${API.CREATE_CATEGORY}/${id}?soft=false`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to delete category (${res.status})`);
      }
      setCategories((p) => p.filter((c) => String(c.id) !== String(id)));
      toast.success("Category deleted");
    } catch (err: any) {
      toast.error(err?.message || "Could not delete category");
    } finally {
      setModalLoading(false);
    }
  };

  // Prepare table content to avoid nested ternary JSX
  let tableContent: React.ReactNode;
  if (loadingFaqs) {
    tableContent = <p className="text-sm text-gray-500">Loading...</p>;
  } else if (faqsError) {
    tableContent = <p className="text-sm text-red-500">{faqsError}</p>;
  } else {
    tableContent = (
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="py-2">#</th>
            <th className="py-2">Question</th>
            <th className="py-2">Category</th>
            <th className="py-2">Published</th>
            <th className="py-2">Created</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {faqs.map((f, idx) => {
            const cat = categories.find((c) => String(c.id) === String(f.categoryId));
            return (
              <tr key={f.id} className="border-t">
                <td className="py-3 pr-4">{idx + 1}</td>
                <td className="py-3 pr-4 max-w-md break-words">{f.question}</td>
                <td className="py-3 pr-4">{cat ? cat.name : String(f.categoryId)}</td>
                <td className="py-3 pr-4">{f.isPublished ? "Yes" : "No"}</td>
                <td className="py-3 pr-4">
                  {f.createdAt ? new Date(f.createdAt).toLocaleString() : "-"}
                </td>
                <td className="py-3 pr-4">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => navigator.clipboard?.writeText(f.question)}
                      className="text-xs px-2 py-1 rounded bg-gray-100"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(f.id)}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="px-6 py-6">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">FAQs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage categories and FAQs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: forms */}
        <div className="space-y-6">
          {/* Create Category */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium">Add Category</h2>
                <p className="text-sm text-gray-500 mt-1">Create a category for FAQs.</p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={openCategoriesModal}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
                >
                  Manage Categories
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="e.g. General Questions"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {creatingCategory ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>

          {/* Create FAQ */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-3">Add FAQ</h2>
            <form onSubmit={handleCreateFaq} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="">{loadingCategories ? "Loading..." : "Select a category"}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Answer (optional)</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order (optional)</label>
                  <input
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Published</label>
                  <select
                    value={isPublished ? "true" : "false"}
                    onChange={(e) => setIsPublished(e.target.value === "true")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Metadata (json)</label>
                  <input
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder='{ "tags": ["billing"] }'
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingFaq}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {submittingFaq ? "Saving..." : "Save FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: FAQ table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
          <h2 className="text-lg font-medium mb-3">All FAQs</h2>
          {tableContent}
        </div>
      </div>

      {/* Categories modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-5000000 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeCategoriesModal} />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Manage Categories</h3>
              <button onClick={closeCategoriesModal} className="text-sm text-gray-500">
                Close
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-auto">
              {modalLoading && <p className="text-sm">Working...</p>}

              {categories.length === 0 && <p className="text-sm text-gray-500">No categories found.</p>}

              <ul className="space-y-2">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between border rounded px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.code ?? ""}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {String(editingCategoryId) === String(c.id) ? (
                        <>
                          <input
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="text-sm rounded border px-2 py-1"
                          />
                          <button
                            onClick={handleSaveEditedCategory}
                            className="text-sm px-2 py-1 rounded bg-blue-600 text-white"
                            disabled={modalLoading}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryName("");
                            }}
                            className="text-sm px-2 py-1 rounded border"
                            disabled={modalLoading}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditCategory(c)}
                            className="text-sm px-2 py-1 rounded border bg-white"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="text-sm px-2 py-1 rounded bg-red-100 text-red-700"
                            disabled={modalLoading}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 border-t flex justify-end">
              <button onClick={closeCategoriesModal} className="px-4 py-2 rounded border">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faq;
