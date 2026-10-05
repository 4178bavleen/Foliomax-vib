import React, { useEffect, useState, useCallback } from "react";
import { MdModeEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import { toast } from "react-hot-toast";

type Company = {
  id: number | string;
  name: string;
  createdAt?: string;
  status?: string; // "ACTIVE" | "INACTIVE" | "PENDING" | etc.
};

const API_BASE = import.meta.env.VITE_API_BASE || "";

const API = {
  ADD_COMPANY: `${API_BASE}/foliomax/companies/add`,
  GET_COMPANIES: `${API_BASE}/foliomax/companies/all-companies`,
  UPDATE_COMPANY: (id: Company["id"]) =>
    `${API_BASE}/foliomax/companies/update/${id}`,
  UPDATE_STATUS: (id: Company["id"]) =>
    `${API_BASE}/foliomax/companies/status/${id}`,
  DELETE_COMPANY: (id: Company["id"]) =>
    `${API_BASE}/foliomax/companies/delete/${id}`,
};

const AddCompany: React.FC = () => {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false); // form submit

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<Company["id"] | null>(null);
  const [rowActionLoadingId, setRowActionLoadingId] = useState<
    Company["id"] | null
  >(null);

  // ================= Fetch Companies List =================
  const fetchCompanies = useCallback(async () => {
    setListError(null);
    try {
      setLoadingCompanies(true);
      const res = await fetch(API.GET_COMPANIES, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch companies (${res.status})`);
      }

      const data = (await res.json()) as Company[] | { data: Company[] };
      const list = Array.isArray(data) ? data : data.data;
      setCompanies(list || []);
    } catch (err: any) {
      const msg = err?.message || "Could not load companies list.";
      setListError(msg);
      toast.error(msg);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // ================= Start Edit =================
  const handleStartEdit = (company: Company) => {
    setEditingId(company.id);
    setCompanyName(company.name || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setCompanyName("");
  };

  // ================= Submit Add / Update =================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = companyName.trim();
    if (!trimmed) {
      toast.error("Company name is required.");
      return;
    }

    try {
      setLoading(true);

      const isEditing = !!editingId;
      const url = isEditing
        ? API.UPDATE_COMPANY(editingId as Company["id"])
        : API.ADD_COMPANY;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save company.");
      }

      toast.success(
        isEditing ? "Company updated successfully." : "Company added successfully."
      );
      resetForm();
      await fetchCompanies();
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ================= Toggle Status =================
  const handleToggleStatus = async (company: Company) => {
    if (!company.id) return;

    const currentStatus = (company.status || "").toUpperCase();
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setRowActionLoadingId(company.id);
      const res = await fetch(API.UPDATE_STATUS(company.id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update status.");
      }

      toast.success(`Status changed to ${nextStatus}.`);
      await fetchCompanies();
    } catch (err: any) {
      toast.error(
        err?.message || "Could not update status. Please try again."
      );
    } finally {
      setRowActionLoadingId(null);
    }
  };

  // ================= Delete Company (Swal confirm + toast) =================
  const handleDeleteCompany = async (company: Company) => {
    if (!company.id) return;

    const result = await Swal.fire({
  icon: "warning",
  title: "Delete Company?",
  text: `Are you sure you want to delete "${company.name}"?`,
  showCancelButton: true,
  confirmButtonText: "Yes, Delete",
  cancelButtonText: "Cancel",
  reverseButtons: true,
  backdrop: "rgba(0,0,0,0.4)",

  didOpen: () => {
    const el = document.querySelector(".swal2-container") as HTMLElement;
    if (el) el.style.zIndex = "999999999";
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
      setRowActionLoadingId(company.id);
      const res = await fetch(API.DELETE_COMPANY(company.id), {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete company.");
      }

      if (editingId === company.id) {
        resetForm();
      }

      await fetchCompanies();

      toast.success(`"${company.name}" has been deleted.`);
    } catch (err: any) {
      toast.error(
        err?.message || "Could not delete company. Please try again."
      );
    } finally {
      setRowActionLoadingId(null);
    }
  };

  // ================= Render =================
  return (
    <div className="px-6 py-6">
      {/* react-hot-toast portal */}
     


      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add Company</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new company that you can use in your quizzes and projects.
          </p>
        </div>
      </div>

      {/* Main grid: left form + right table */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Add / Edit Company Form */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                             placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400">
                  This name will appear in the company list and quiz assignments.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancel edit
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2
                             text-sm font-medium text-white shadow-sm
                             hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && (
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
                  <span>
                    {editingId ? "Update Company" : "Save Company"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Companies Table */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Company List
              </h2>
              <button
                type="button"
                onClick={fetchCompanies}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>

            {listError && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {listError}
              </div>
            )}

            {loadingCompanies ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                Loading companies...
              </div>
            ) : companies.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-500">
                <p>No companies found yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add a company using the form on the left.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                      <th className="py-2 pr-4 text-left">Company Name</th>
                      <th className="py-2 pr-4 text-left">Created</th>
                      <th className="py-2 pr-4 text-left">Status</th>
                      <th className="py-2 pl-4 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => {
                      const isRowLoading = rowActionLoadingId === company.id;
                      const status = (company.status || "").toUpperCase();

                      return (
                        <tr
                          key={company.id}
                          className="border-b border-gray-100 last:border-0 hover:bg-gray-50/40"
                        >
                          <td className="py-3 pr-4 text-gray-900">
                            <span className="font-medium">{company.name}</span>
                          </td>
                          <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                            {company.createdAt
                              ? new Date(
                                  company.createdAt
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="py-3 pr-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(company)}
                              disabled={isRowLoading}
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                                status === "ACTIVE"
                                  ? "bg-green-50 text-green-700 border-green-100"
                                  : status === "PENDING"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              } disabled:opacity-60`}
                            >
                              {isRowLoading ? "Updating..." : status || "—"}
                            </button>
                          </td>
                          <td className="py-3 pl-4 pr-2">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(company)}
                                disabled={isRowLoading}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Edit company"
                              >
                                <MdModeEdit className="h-4 w-4" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCompany(company)}
                                disabled={isRowLoading}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Delete company"
                              >
                                {isRowLoading ? (
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
      </div>
    </div>
  );
};

export default AddCompany;
