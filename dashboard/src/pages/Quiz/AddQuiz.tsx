// src/pages/AddQuiz.tsx
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
type Company = {
  id: number | string;
  name: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "";
const API = {
  COMPANIES: `${API_BASE}/foliomax/companies/all-companies`,
  ADD_QUIZ: `${API_BASE}/foliomax/quizzes/add`,
};

const PAGE_OPTIONS = [
  { value: "know-your-company", label: "Know Your Company" },
  { value: "knowdledge", label: "Knowdledge" },
  { value: "calculators", label: "Calculators" },
];

const AddQuiz: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [pageName, setPageName] = useState<string>(""); // new page selector
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<string>(""); // "0" | "1" | "2" | "3"
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ===== Fetch Companies for dropdown =====
  const fetchCompanies = useCallback(async () => {
    setCompanyError(null);
    try {
      setLoadingCompanies(true);
      const res = await fetch(API.COMPANIES, { method: "GET" });
      if (!res.ok) {
        throw new Error(`Failed to load companies (${res.status})`);
      }
      const data = (await res.json()) as Company[] | { data: Company[] };
      const list = Array.isArray(data) ? data : data.data;
      setCompanies(list || []);
    } catch (err: any) {
      const msg = err?.message || "Could not fetch companies.";
      setCompanyError(msg);
      toast.error(msg);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // ===== Helpers =====
  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const validateForm = (): string | null => {
    if (!selectedCompanyId) return "Please select a company.";
    if (!pageName) return "Please select a page to show this quiz on.";
    if (!question.trim()) return "Question is required.";

    for (let i = 0; i < 4; i++) {
      if (!options[i]?.trim()) {
        return `Option ${i + 1} is required.`;
      }
    }

    if (correctIndex === "") {
      return "Please select the correct answer.";
    }

    return null;
  };

  // ===== Submit Quiz =====
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const validationError = validateForm();
  if (validationError) {
    toast.error(validationError);
    return;
  }

  // ✅ Swal confirm before creating quiz
  const result = await Swal.fire({
    title: "Create Quiz?",
    text: "Do you want to save this quiz?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Save",
    cancelButtonText: "Cancel",

    didOpen: () => {
      const el = document.querySelector(".swal2-container") as HTMLElement;
      if (el) el.style.zIndex = "999999999";
    }
  });

  if (!result.isConfirmed) return;

  const toastId = toast.loading("Saving quiz...");

  try {
    setSubmitting(true);

    const payload = {
      companyId: selectedCompanyId,
      pageName,
      question: question.trim(),
      options: options.map((o) => o.trim()),
      correctIndex: Number(correctIndex),
      note: note.trim() || null,
    };

    const res = await fetch(API.ADD_QUIZ, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to create quiz.");
    }

    toast.success("Quiz created successfully 🎉", { id: toastId });

    // reset
    setSelectedCompanyId("");
    setPageName("");
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectIndex("");
    setNote("");

  } catch (err: any) {
    toast.error(err?.message || "Something went wrong.", { id: toastId });
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="px-6 py-6">
      {/* If you don't already have a global Toaster, keep this here */}
      

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add Quiz</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new quiz question and attach it to a company.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm max-w-4xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company dropdown */}
          <div className="space-y-2">
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700"
            >
              Company
            </label>
            <select
              id="company"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="">
                {loadingCompanies ? "Loading companies..." : "Select a company"}
              </option>
              {companies.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            {companyError && (
              <p className="text-xs text-red-500 mt-1">{companyError}</p>
            )}
          </div>

          {/* Page dropdown (new) */}
          <div className="space-y-2">
            <label
              htmlFor="pageName"
              className="block text-sm font-medium text-gray-700"
            >
              Show on page
            </label>
            <select
              id="pageName"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white"
            >
              <option value="">Select page</option>
              {PAGE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Choose where this quiz will appear on the site.</p>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <label
              htmlFor="question"
              className="block text-sm font-medium text-gray-700"
            >
              Question
            </label>
            <textarea
              id="question"
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
                htmlFor="correctAnswer"
                className="block text-sm font-medium text-gray-700"
              >
                Correct Answer
              </label>
              <select
                id="correctAnswer"
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
                htmlFor="note"
                className="block text-sm font-medium text-gray-700"
              >
                Note / Explanation (optional)
              </label>
              <textarea
                id="note"
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

          {/* Submit */}
          <div className="flex justify-end">
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
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              <span>{submitting ? "Saving..." : "Save Quiz"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuiz;
