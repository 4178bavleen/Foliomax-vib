import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:3010",
  withCredentials: true, // keep true if your backend sets cookies
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
