import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MdModeEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";

type Company = {
  id: number | string;
  name: string;
};

type Quiz = {
  id: number | string;
  companyId: number | string;
  companyName?: string;
  question: string;
  options: string[];
  correctIndex: number;
  note?: string | null;
  createdAt?: string;
  pageName?: string | null; // new
};

const API_BASE = import.meta.env.VITE_API_BASE || "";
const API = {
  COMPANIES: `${API_BASE}/foliomax/companies/all-companies`,
  QUIZZES: `${API_BASE}/foliomax/quizzes/all-quizzes`,
  DELETE_QUIZ: (id: Quiz["id"]) =>
    `${API_BASE}/foliomax/quizzes/delete/${id}`,
  UPDATE_QUIZ: (id: Quiz["id"]) =>
    `${API_BASE}/foliomax/quizzes/update/${id}`,
};

// Page options - keep these in sync with your backend allowed slugs
const PAGE_OPTIONS = [
  { value: "know-your-company", label: "Know Your Company" },
  { value: "knowdledge", label: "Knowdledge" },
  { value: "calculators", label: "Calculators" },
];

const PAGE_LABEL_MAP = PAGE_OPTIONS.reduce<Record<string, string>>((acc, p) => {
  acc[p.value] = p.label;
  return acc;
}, {});

// ========= Edit Quiz Modal (same form fields as Add) =========
type EditQuizModalProps = {
  quiz: Quiz;
  companies: Company[];
  onClose: () => void;
  onUpdated: () => void;
};

const EditQuizModal: React.FC<EditQuizModalProps> = ({
  quiz,
  companies,
  onClose,
  onUpdated,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    String(quiz.companyId || "")
  );
  const [question, setQuestion] = useState<string>(quiz.question || "");
  const [options, setOptions] = useState<string[]>(() => {
    const base = quiz.options || [];
    // Ensure always 4 options
    return [0, 1, 2, 3].map((i) => base[i] ?? "");
  });
  const [correctIndex, setCorrectIndex] = useState<string>(
    quiz.correctIndex !== null && quiz.correctIndex !== undefined
      ? String(quiz.correctIndex)
      : ""
  );
  const [note, setNote] = useState<string>(quiz.note || "");
  const [pageName, setPageName] = useState<string>(quiz.pageName || ""); // new
  const [submitting, setSubmitting] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const validateForm = (): string | null => {
    if (!selectedCompanyId) return "Please select a company.";
    if (!question.trim()) return "Question is required.";

    for (let i = 0; i < 4; i++) {
      if (!options[i]?.trim()) {
        return `Option ${i + 1} is required.`;
      }
    }

    if (correctIndex === "") {
      return "Please select the correct answer.";
    }

    // pageName optional but if provided ensure it's non-empty
    // (backend will validate exact slug)
    // if (!pageName) return "Please select a page."; // keep optional if you prefer

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      Swal.fire({
        icon: "warning",
        title: "Validation error",
        text: validationError,
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        companyId: selectedCompanyId,
        question: question.trim(),
        options: options.map((o) => o.trim()),
        correctIndex: Number(correctIndex),
        note: note.trim() || null,
      };

      // include pageName if user selected one (allow clearing with empty string -> omit)
      if (pageName !== undefined) {
        // if you want to allow clearing to null, send pageName: null when empty
        payload.pageName = pageName === "" ? null : pageName;
      }

      const res = await fetch(API.UPDATE_QUIZ(quiz.id), {
        method: "PATCH", // change to "PATCH" if your backend uses PATCH
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update quiz.");
      }

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Quiz updated successfully.",
        timer: 1400,
        showConfirmButton: false,
      });

      onUpdated(); // refresh list
      onClose(); // close modal
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-500000 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Quiz</h2>
            <p className="text-xs text-gray-500 mt-1">
              Update quiz details and save changes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        {/* Modal body (same form as Add) */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Company */}
          <div className="space-y-2">
            <label
              htmlFor="edit-company"
              className="block text-sm font-medium text-gray-700"
            >
              Company
            </label>
            <select
              id="edit-company"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Page selector */}
          <div className="space-y-2">
            <label htmlFor="edit-page" className="block text-sm font-medium text-gray-700">
              Page
            </label>
            <select
              id="edit-page"
              value={pageName ?? ""}
              onChange={(e) => setPageName(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="">(no page / general)</option>
              {PAGE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">Optional: choose page where this quiz appears.</p>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <label
              htmlFor="edit-question"
              className="block text-sm font-medium text-gray-700"
            >
              Question
            </label>
            <textarea
              id="edit-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="Type the quiz question here..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         placeholder:text-gray-400"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Options</span>
              <span className="text-xs text-gray-400">Provide exactly four options.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Option {idx + 1}
                  </label>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               placeholder:text-gray-400"
                    placeholder={`Enter option ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Correct answer + Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Correct answer */}
            <div className="space-y-2">
              <label
                htmlFor="edit-correctAnswer"
                className="block text-sm font-medium text-gray-700"
              >
                Correct Answer
              </label>
              <select
                id="edit-correctAnswer"
                value={correctIndex}
                onChange={(e) => setCorrectIndex(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           bg-white"
              >
                <option value="">Select correct option</option>
                {options.map((opt, idx) => (
                  <option key={idx} value={idx} disabled={!opt.trim()}>
                    {`Option ${idx + 1} - ${opt || "—"}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Choose which option is the correct answer.</p>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label
                htmlFor="edit-note"
                className="block text-sm font-medium text-gray-700"
              >
                Note / Explanation (optional)
              </label>
              <textarea
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add explanation or extra notes for this question..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2
                         text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2
                         text-sm font-medium text-white shadow-sm
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              <span>{submitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= Main list component =================
const AllQuizzes: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [rowActionLoadingId, setRowActionLoadingId] =
    useState<Quiz["id"] | null>(null);

  // NEW: state for edit modal
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // Filters
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [pageFilter, setPageFilter] = useState<string>("all"); // new
  const [search, setSearch] = useState<string>("");

  // ===== Fetch companies =====
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch(API.COMPANIES, { method: "GET" });
      if (!res.ok) throw new Error(`Failed to load companies (${res.status})`);
      const data = (await res.json()) as Company[] | { data: Company[] };
      const list = Array.isArray(data) ? data : data.data;
      setCompanies(list || []);
    } catch (err) {
      console.error("[AllQuizzes] companies error", err);
    }
  }, []);

  // ===== Fetch quizzes =====
  const fetchQuizzes = useCallback(async () => {
    setListError(null);
    try {
      setLoading(true);
      const res = await fetch(API.QUIZZES, { method: "GET" });
      if (!res.ok) throw new Error(`Failed to load quizzes (${res.status})`);

      const data = (await res.json()) as Quiz[] | { data: Quiz[] };
      let list = Array.isArray(data) ? data : data.data;
      if (!Array.isArray(list)) list = [];
      setQuizzes(list);
    } catch (err: any) {
      console.error(err);
      setListError(err?.message || "Could not load quizzes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Merge companyName from company list if missing
  const quizzesWithCompany = useMemo(() => {
    if (!companies.length) return quizzes;
    const map = new Map<string, string>();
    companies.forEach((c) => map.set(String(c.id), c.name));
    return quizzes.map((q) => ({
      ...q,
      companyName: q.companyName || map.get(String(q.companyId)) || "—",
    }));
  }, [quizzes, companies]);

  // ===== Apply filters =====
  const filteredQuizzes = useMemo(() => {
    return quizzesWithCompany.filter((q) => {
      if (companyFilter !== "all" && String(q.companyId) !== companyFilter) {
        return false;
      }
      if (pageFilter !== "all" && (q.pageName || "") !== pageFilter) {
        return false;
      }
      if (search.trim()) {
        const term = search.toLowerCase();
        const inQuestion = q.question?.toLowerCase().includes(term);
        const inOptions = q.options?.some((o) =>
          (o || "").toLowerCase().includes(term)
        );
        return inQuestion || inOptions;
      }
      return true;
    });
  }, [quizzesWithCompany, companyFilter, pageFilter, search]);

  const getCorrectAnswerText = (q: Quiz) => {
    if (!q.options || q.correctIndex == null) return "—";
    return q.options[q.correctIndex] ?? "—";
  };

  // ===== Actions =====
  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz); // open modal
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Quiz?",
      text: `Are you sure you want to delete this quiz?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      backdrop: "rgba(0,0,0,0.4)",

      didOpen: () => {
        // SweetAlert2 container class
        const swalContainer = document.querySelector(".swal2-container");
        if (swalContainer) {
          swalContainer.setAttribute("style", "z-index: 99999 !important;");
        }
      },

      customClass: {
        popup: "rounded-2xl",
        confirmButton:
          "swal2-confirm !bg-red-600 !text-white !px-5 !py-2.5 !rounded-lg !text-sm !font-semibold",
        cancelButton:
          "swal2-cancel !bg-gray-100 !text-gray-800 !px-5 !py-2.5 !rounded-lg !text-sm !font-medium",
      },
    });

    if (!result.isConfirmed) return;

    try {
      setRowActionLoadingId(quiz.id);
      const res = await fetch(API.DELETE_QUIZ(quiz.id), {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete quiz.");
      }

      await fetchQuizzes();

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Quiz has been deleted.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err?.message || "Could not delete quiz. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setRowActionLoadingId(null);
    }
  };

  return (
    <div className="px-6 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Quizzes</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and filter all quiz questions across companies.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchQuizzes}
          className="hidden sm:inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Card with filters + table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Header filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Filters
            </label>
          </div>
          <div className="flex flex-1 justify-end gap-3 flex-wrap">
            {/* Company filter */}
            <div className="min-w-[160px]">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           bg-white text-gray-700"
              >
                <option value="all">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Page filter */}
            <div className="min-w-[160px]">
              <select
                value={pageFilter}
                onChange={(e) => setPageFilter(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           bg-white text-gray-700"
              >
                <option value="all">All Pages</option>
                {PAGE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                {/* If there are quizzes with pageName not in PAGE_OPTIONS, consider showing them too:
                    You could dynamically derive available page names from `quizzes` and show them here. */}
              </select>
            </div>

            {/* Search question/options */}
            <div className="w-full md:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search question or options..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {listError && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {listError}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading quizzes...
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No quizzes found for the selected filters.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="py-2 pr-4 text-left">Company</th>
                    <th className="py-2 pr-4 text-left">Page</th> {/* new */}
                    <th className="py-2 pr-4 text-left">Question</th>
                    <th className="py-2 pr-4 text-left">Options</th>
                    <th className="py-2 pr-4 text-left">Correct Answer</th>
                    <th className="py-2 pr-4 text-left">Note</th>
                    <th className="py-2 pr-4 text-left whitespace-nowrap">Created</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuizzes.map((q) => {
                    const isRowLoading = rowActionLoadingId === q.id;
                    return (
                      <tr
                        key={q.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                      >
                        {/* Company */}
                        <td className="py-3 pr-4 align-top text-gray-900 whitespace-nowrap">
                          <span className="font-medium">{q.companyName || "—"}</span>
                        </td>

                        {/* Page */}
                        <td className="py-3 pr-4 align-top text-xs text-gray-600 whitespace-nowrap">
                          {q.pageName ? (
                            <span className="inline-flex items-center gap-2 rounded px-2 py-1 bg-gray-50 text-xs">
                              <span className="font-medium text-gray-800">
                                {PAGE_LABEL_MAP[q.pageName] ?? q.pageName}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">general</span>
                          )}
                        </td>

                        {/* Question */}
                        <td className="py-3 pr-4 align-top text-gray-800 max-w-md">
                          <p className="text-sm leading-snug">{q.question}</p>
                        </td>

                        {/* Options */}
                        <td className="py-3 pr-4 align-top text-gray-700">
                          <ul className="space-y-1 text-xs">
                            {q.options?.map((opt, idx) => {
                              const isCorrect = idx === q.correctIndex;
                              return (
                                <li
                                  key={idx}
                                  className={`flex items-start gap-2 ${
                                    isCorrect ? "font-semibold text-green-700" : "text-gray-600"
                                  }`}
                                >
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">
                                    {idx + 1}
                                  </span>
                                  <span className={`${isCorrect ? "bg-green-50 rounded px-1.5 py-0.5" : ""}`}>
                                    {opt || "—"}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </td>

                        {/* Correct Answer */}
                        <td className="py-3 pr-4 align-top text-gray-800 text-sm">
                          {getCorrectAnswerText(q)}
                        </td>

                        {/* Note */}
                        <td className="py-3 pr-4 align-top text-xs text-gray-500 max-w-xs">
                          {q.note ? <span className="line-clamp-3">{q.note}</span> : <span className="text-gray-400">—</span>}
                        </td>

                        {/* Created */}
                        <td className="py-3 pr-4 align-top text-xs text-gray-500 whitespace-nowrap">
                          {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-3 pr-4 align-top">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditQuiz(q)}
                              disabled={isRowLoading}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Edit quiz"
                            >
                              <MdModeEdit className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteQuiz(q)}
                              disabled={isRowLoading}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Delete quiz"
                            >
                              {isRowLoading ? (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                              ) : (
                                <MdDelete className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL MOUNT */}
      {editingQuiz && (
        <EditQuizModal
          quiz={editingQuiz}
          companies={companies}
          onClose={() => setEditingQuiz(null)}
          onUpdated={fetchQuizzes}
        />
      )}
    </div>
  );
};

export default AllQuizzes;
