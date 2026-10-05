import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE || "{{LOCAL_URL}}";

const API = {
  CREATE: `${API_BASE}/foliomax/admin/subscription/create`,
  LIST: `${API_BASE}/foliomax/admin/subscription/all`,
  DELETE: (id) => `${API_BASE}/foliomax/admin/subscription/delete/${id}`,
  UPDATE: (id) => `${API_BASE}/foliomax/admin/subscription/update/${id}`, // ✅ added
};

const authHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
  "Content-Type": "application/json",
});

const Subscriptions = () => {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  // ✅ EDIT STATES
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // ================= FETCH =================
  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch(API.LIST, {
        headers: authHeaders(),
      });

      const json = await res.json();

      if (!res.ok) throw new Error("Failed to fetch subscriptions");

      setSubscriptions(json?.data || json || []);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // ================= CREATE =================
  const handleCreate = async () => {
    if (!name || !duration || !price) {
      return toast.error("All fields are required");
    }

    setLoading(true);
    const toastId = toast.loading("Creating subscription...");

    try {
      const res = await fetch(API.CREATE, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name,
          duration: Number(duration),
          price: Number(price),
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || "Failed to create");
      }

      toast.success("Subscription created", { id: toastId });

      setName("");
      setDuration("");
      setPrice("");

      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // ================= EDIT =================
  const handleEdit = (plan) => {
    setEditId(plan.id);
    setEditName(plan.name);
    setEditDuration(plan.duration);
    setEditPrice(plan.price);
  };

  // ================= UPDATE =================
  const handleUpdate = async () => {
    if (!editName || !editDuration || !editPrice) {
      return toast.error("All fields required");
    }

    const toastId = toast.loading("Updating...");

    try {
      const res = await fetch(API.UPDATE(editId), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          name: editName,
          duration: Number(editDuration),
          price: Number(editPrice),
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || "Update failed");
      }

      toast.success("Updated successfully", { id: toastId });

      setEditId(null);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete subscription?",
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

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Deleted", { id: toastId });
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  };

  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-semibold mb-6">Subscriptions</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* FORM */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Create Plan</h2>

            <div className="mb-3">
              <label className="text-sm">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border px-3 py-2 rounded"
                placeholder="3 Months"
              />
            </div>

            <div className="mb-3">
              <label className="text-sm">Duration (Months)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">All Plans</h2>

            {subscriptions.length === 0 ? (
              <div>No subscriptions found</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="space-y-2">
                    {subscriptions.map((s) => (
                      <tr
                        key={s.id}
                        className="bg-gray-50 hover:bg-blue-50 transition rounded-lg"
                      >
                        {/* NAME */}
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {editId === s.id ? (
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            s.name
                          )}
                        </td>

                        {/* DURATION */}
                        <td className="py-3 px-4">
                          {editId === s.id ? (
                            <input
                              type="number"
                              value={editDuration}
                              onChange={(e) =>
                                setEditDuration(e.target.value)
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-600">
                              {s.duration} months
                            </span>
                          )}
                        </td>

                        {/* PRICE */}
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {editId === s.id ? (
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            `₹ ${s.price}`
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            {editId === s.id ? (
                              <>
                                <button
                                  onClick={handleUpdate}
                                  className="px-3 py-1 bg-green-600 text-white rounded"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditId(null)}
                                  className="px-3 py-1 bg-gray-400 text-white rounded"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(s)}
                                  className="p-2 rounded-lg bg-gray-100 hover:bg-yellow-100 transition"
                                >
                                  <FiEdit size={16} />
                                </button>

                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

export default Subscriptions;