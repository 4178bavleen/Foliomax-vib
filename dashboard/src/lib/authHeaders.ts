// lib/authHeaders.ts
// Shared Authorization header for dashboard fetch() calls.
//
// The shared axios instance (src/context/api.tsx) sets this automatically, but
// most admin pages call fetch() directly, so they need to pass it explicitly.
export const authHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${sessionStorage.getItem("accessToken") ?? ""}`,
});