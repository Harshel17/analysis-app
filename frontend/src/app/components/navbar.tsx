"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUsernameFromToken, isManagerFromToken } from "@/utils/auth";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const name = getUsernameFromToken();
    const managerStatus = isManagerFromToken();
    setUsername(name);
    setIsManager(managerStatus);
  }, []);

  return (
    <nav
      style={{
        backgroundColor: "#1f2937", // dark blue-gray
        color: "white",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* 👈 LEFT: App title + links underneath */}
      <div>
        <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
          📊 Analysis App
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none" }}>Home</Link>
          <Link href="/create" style={{ color: "#fff", textDecoration: "none" }}>Create</Link>
          <Link href="/saved" style={{ color: "#fff", textDecoration: "none" }}>Saved</Link>

          {isManager && (
            <>
              <Link href="/manager" style={{ color: "#22c55e", textDecoration: "none" }}>
                Manager Dashboard
              </Link>
              <Link href="/manager/reports" style={{ color: "#22c55e", textDecoration: "none" }}>
                Reports
              </Link>
              <Link href="/manager/queries" style={{ color: "#22c55e", textDecoration: "none" }}>
                Queries
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 👉 RIGHT: User + Logout */}
      {username && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            background: "#f3f4f6",
            color: "#111827",
            padding: "6px 10px",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: "bold"
          }}>
            👋 Welcome, {username}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/auth/login";
            }}
            style={{
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
