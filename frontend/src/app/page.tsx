"use client";
import React, { useEffect, useState } from "react";
import styles from './home.module.css';
import Link from 'next/link';

export default function Home() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null; // ✅ prevent premature DOM calls

  return (
    <div className={styles.container}>
      {/* 🎥 Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className={styles.videoBackground}
      >
        <source src="/videos/crane.mp4" type="video/mp4" />
      </video>

      {/* Brand Title */}
      <div className={styles.brandText}>
        {"OAKHURST DEVELOPMENT".split("").map((char, index) => (
          <span
            key={index}
            className={styles.letter}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className={styles.buttonGroup}>
        <Link href="/create">
          <button className={`${styles.button} ${styles.startBtn}`}>Start Analysis</button>
        </Link>
        <Link href="/saved">
          <button className={`${styles.button} ${styles.savedBtn}`}>Saved Analysis</button>
        </Link>
      </div>

      {/* Auth Buttons */}
      <div className={styles.authButtons}>
        <Link href="/auth/login">
          <button className={`${styles.authButton} ${styles.loginBtn}`}>Login</button>
        </Link>
        <Link href="/auth/register">
          <button className={`${styles.authButton} ${styles.registerBtn}`}>Register</button>
        </Link>
      </div>
    </div>
  );
}
// trigger redeploy
