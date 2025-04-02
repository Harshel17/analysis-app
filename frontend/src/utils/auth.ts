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
