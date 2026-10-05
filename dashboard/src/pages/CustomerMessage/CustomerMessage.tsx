import { useEffect, useMemo, useState } from "react";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  topic?: string | null;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | string;
  isRead: boolean;
  respondedBy?: string | null;
  response?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
};

// 🔥 BASE URLs
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const CONTACT_API = `${API_BASE}/foliomax/admin/contacts`;

export default function CustomerMessage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selected, setSelected] = useState<Contact | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ✅ Read token from sessionStorage (same as AuthContext)
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("accessToken")
      : null;

  // Headers for JSON requests
  const jsonHeaders = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  // Headers for non-JSON (CSV download)
  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  // ================================
  // Helper: Convert BigInt-safe values
  // ================================
  function convertItem(raw: any): Contact {
    return {
      ...raw,
      id: String(raw.id),
      createdAt: new Date(raw.createdAt).toISOString(),
      respondedAt: raw.respondedAt
        ? new Date(raw.respondedAt).toISOString()
        : null,
    };
  }

  function StatusBadge({ s }: { s: string }) {
    const map: any = {
      OPEN: "bg-blue-50 text-blue-700 border-blue-200",
      IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
      RESOLVED: "bg-green-50 text-green-700 border-green-200",
      CLOSED: "bg-gray-100 text-gray-600 border-gray-300",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded border ${map[s] || ""}`}>
        {s}
      </span>
    );
  }

  // ================================
  // Load list
  // ================================
  async function fetchList() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (query) params.set("q", query);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${CONTACT_API}?${params.toString()}`, {
        method: "GET",
        headers: jsonHeaders,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || "Failed loading messages");
      }

      setItems((json.data || []).map(convertItem));
      setTotalPages(json.meta?.pages || 1);
    } catch (err: any) {
      setError(err?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, query, statusFilter]);

  // ================================
  // Mark read + view detail
  // ================================
  function openDetail(item: Contact) {
    setSelected(item);
    setDetailOpen(true);

    if (!item.isRead) {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isRead: true } : it)),
      );

      fetch(`${CONTACT_API}/${item.id}`, {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ isRead: true }),
      }).catch(() => {});
    }
  }

  // ================================
  // Delete
  // ================================
  async function deleteItem(id: string) {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await fetch(`${CONTACT_API}/${id}`, {
        method: "DELETE",
        headers: jsonHeaders,
      });

      if (!res.ok) throw new Error("Delete failed");

      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch {
      setError("Delete failed");
    }
  }

  // ================================
  // Export CSV
  // ================================
  async function exportCsv() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${CONTACT_API}/export?${params.toString()}`, {
        method: "GET",
        headers: authHeaders,
      });

      if (!res.ok) throw new Error("CSV export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("CSV Export failed");
    }
  }

  // ================================
  // UI
  // ================================
  return (
    <div className="px-6 py-6">
      {/* ------- HEADER ------- */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Customer Messages
          </h1>
          <p className="text-sm text-gray-500">
            View, manage & respond to customer inquiries.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center rounded-full border border-green-200 px-4 py-2 text-xs font-medium text-green-700 hover:bg-green-50"
          >
            Export CSV
          </button>

          <button
            onClick={fetchList}
            className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ------ TABLE CARD ------ */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="font-medium text-xs text-gray-500 uppercase">
            Filters
          </div>

          <div className="flex gap-3 flex-wrap md:justify-end w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <input
              placeholder="Search name, email, topic, message..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs w-full md:w-64 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="p-5 overflow-auto">
          {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

          {loading ? (
            <div className="py-16 text-center text-gray-500">
              Loading messages...
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              No messages found.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="py-2 pr-4 text-left">#</th>
                  <th className="py-2 pr-4 text-left">Name</th>
                  <th className="py-2 pr-4 text-left">Email</th>
                  <th className="py-2 pr-4 text-left">Topic</th>
                  <th className="py-2 pr-4 text-left">Created</th>
                  <th className="py-2 pr-4 text-left">Status</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, idx) => (
                  <tr
                    key={it.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50"
                  >
                    <td className="py-3 pr-4">
                      {(page - 1) * limit + idx + 1}
                    </td>

                    <td className="py-3 pr-4">
                      <button
                        className="text-blue-600"
                        onClick={() => openDetail(it)}
                      >
                        {it.name}
                      </button>
                    </td>

                    <td className="py-3 pr-4">{it.email}</td>
                    <td className="py-3 pr-4">{it.topic || "—"}</td>

                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {new Date(it.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 pr-4">
                      <StatusBadge s={it.status} />
                    </td>

                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(it)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => deleteItem(it.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 text-red-500 hover:bg-red-50"
                        >
                          🗑️
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

      {/* ------ Pagination ------ */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border px-3 py-2 rounded-lg text-sm"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <button disabled={page === 1} onClick={() => setPage(1)}>
            « First
          </button>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            ‹ Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next ›
          </button>
          <button onClick={() => setPage(totalPages)}>Last »</button>
        </div>
      </div>

      {/* -------- Modal -------- */}
      {detailOpen && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-5000000 backdrop-blur-sm">
          <div className="bg-white max-w-2xl w-full rounded shadow p-4 relative">
            <button
              className="absolute right-3 top-3"
              onClick={() => setDetailOpen(false)}
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-2">
              Message from {selected.name}
            </h3>

            <div className="text-gray-600 text-sm mb-3">
              <div>Email: {selected.email}</div>
              <div>Phone: {selected.phone}</div>
              <div>City: {selected.city}</div>
              <div>Topic: {selected.topic}</div>
              <div>
                Received: {new Date(selected.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="mb-3">
              <h4 className="font-medium">Message</h4>
              <div className="border p-3 rounded bg-gray-50 whitespace-pre-line">
                {selected.message}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Response</label>
              <textarea
                id="responseBox"
                rows={5}
                defaultValue={selected.response ?? ""}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded"
                onClick={async () => {
                  const txt = (
                    document.getElementById(
                      "responseBox",
                    ) as HTMLTextAreaElement
                  ).value;

                  const res = await fetch(`${CONTACT_API}/${selected.id}`, {
                    method: "PATCH",
                    headers: jsonHeaders,
                    body: JSON.stringify({ response: txt }),
                  });

                  const json = await res.json();
                  const updated = convertItem(json.data);
                  setSelected(updated);
                  setItems((prev) =>
                    prev.map((it) =>
                      it.id === selected.id ? updated : it,
                    ),
                  );

                  alert("Response saved");
                }}
              >
                Save
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => setDetailOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
