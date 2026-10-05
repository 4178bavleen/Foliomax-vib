import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000"; 
// Example: "http://localhost:4000"

const api = axios.create({
  baseURL: `${API_URL}/foliomax`, 
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("foliomax_accessToken") || 
                sessionStorage.getItem("foliomax_accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =================== GET PROFILE ===================
export const getProfile = async () => {
  const res = await api.get("/profile/me");
  return res.data;
};

// =================== UPDATE BASIC DETAILS ===================
export const updateProfile = async (payload) => {
  const res = await api.put("/profile/update", payload);
  return res.data;
};

// =================== UPLOAD PROFILE IMAGE ===================
export const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await api.post("/profile/upload-profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

export default {
  getProfile,
  updateProfile,
  uploadProfileImage,
};
