"use client";
import React from "react";
import styles from './home.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* 🔐 Top-right corner auth buttons */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px'
      }}>
        <Link href="/auth/login">
          <button style={{
            padding: '6px 12px',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}>
            Login
          </button>
        </Link>
        <Link href="/auth/register">
          <button style={{
            padding: '6px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}>
            Register
          </button>
        </Link>
      </div>

      <div className={styles.brandBackground}>OAKHURST</div>
      <h1 className={styles.heading}>Welcome to Analysis App</h1>
      <div className={styles.buttonGroup}>
        <Link href="/create">
          <button className={`${styles.button} ${styles.startBtn}`}>Start Analysis</button>
        </Link>
        <Link href="/saved">
          <button className={`${styles.button} ${styles.savedBtn}`}>Saved Analysis</button>
        </Link>
      </div>
    </div>
  );
}
