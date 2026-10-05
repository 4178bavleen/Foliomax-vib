// src/utils/auth.js

/* ================================
   Get Stored Token
================================ */
export const getToken = () => {
  return (
    localStorage.getItem("foliomax_accessToken") ||
    sessionStorage.getItem("foliomax_accessToken")
  );
};

/* ================================
   Check If Logged In
================================ */
export const isLoggedIn = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Check expiry
    if (payload.exp * 1000 < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/* ================================
   Get User From Token
================================ */
export const getUser = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload; // should contain name, email etc if backend includes them
  } catch {
    return null;
  }
};

/* ================================
   Logout
================================ */
export const logout = () => {
  localStorage.removeItem("foliomax_accessToken");
  localStorage.removeItem("foliomax_refreshToken");
  sessionStorage.removeItem("foliomax_accessToken");
  sessionStorage.removeItem("foliomax_refreshToken");

  window.location.href = "/login";
};