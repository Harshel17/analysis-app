"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getUsernameFromToken, isManagerFromToken } from "@/utils/auth";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setUsername(getUsernameFromToken());
    setIsManager(isManagerFromToken());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/auth/login";
  };

  return (
    <>
      {/* Top navbar */}
      <div className={styles.navHeader}>
        <div className={styles.logoWrapper}>
          <div className={styles.hamburger} onClick={() => setIsOpen(!isOpen)}>
            ☰
          </div>
          <div className={styles.logo}>📊 Analysis App</div>
        </div>

        {username && (
  <div className={styles.topRightUser}>
    👋 {username}
    <button className={styles.logoutButton} onClick={handleLogout}>
      Logout
    </button>
  </div>
)}


      </div>

      {/* Sidebar Drawer */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <nav className={styles.links}>
          <Link href="/" className={styles.link} onClick={() => setIsOpen(false)}>Home</Link>
          <Link href="/create" className={styles.link} onClick={() => setIsOpen(false)}>Create</Link>
          <Link href="/saved" className={styles.link} onClick={() => setIsOpen(false)}>Saved</Link>

          {isManager && (
            <>
              <Link href="/manager" className={styles.managerLink} onClick={() => setIsOpen(false)}>Manager Dashboard</Link>
              <Link href="/manager/reports" className={styles.managerLink} onClick={() => setIsOpen(false)}>Reports</Link>
              <Link href="/manager/queries" className={styles.managerLink} onClick={() => setIsOpen(false)}>Queries</Link>
            </>
          )}
        </nav>

        {/* ✅ Only Logout stays in sidebar */}
        <div className={styles.userSection}>
          <button className={styles.logout} onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </>
  );
}
