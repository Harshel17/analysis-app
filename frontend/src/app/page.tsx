"use client";
import React from "react";
import styles from './home.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.container}>
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

