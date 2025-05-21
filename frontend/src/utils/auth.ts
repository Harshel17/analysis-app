import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub?: string;
  username?: string;
  email?: string;
  user_id?: number;
  is_manager?: number;
  exp?: number;
}

export const getUsernameFromToken = (): string | null => {
  if (typeof window === "undefined") return null; // ✅ SSR-safe check

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    console.log("✅ Decoded Token:", decoded);
    return decoded.username || decoded.sub || null;
  } catch (e) {
    console.error("Token decode failed", e);
    return null;
  }
};

export const isManagerFromToken = (): boolean => {
  if (typeof window === "undefined") return false; // ✅ Prevent server execution

  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    return decoded.is_manager === 1;
  } catch (e) {
    console.error("Token decode failed", e);
    return false;
  }
};

