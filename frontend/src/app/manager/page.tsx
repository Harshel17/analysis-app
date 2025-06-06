"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import styles from "./ManagerD.module.css";

export default function ManagerHub() {
  const router = useRouter();

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.sidebar}>
        <Navbar />
      </div>

      <div className={styles.mainContent}>
        <h1 className={styles.heading}>🛠 Manager Dashboard</h1>
        <p style={{ color: "#4B5563", marginBottom: "1rem" }}>
          Select a module to manage:
        </p>

        <div className={styles.iconGrid}>
          <div className={styles.iconCard} onClick={() => router.push("/manager/allanalysis")}>
            <div className={styles.iconCircle}>📊</div>
            <div className={styles.iconLabel}>Analysis</div>
          </div>

          <div className={styles.iconCard}>
            <div className={styles.iconCircle}>🛠️</div>
            <div className={styles.iconLabel}>Projects</div>
          </div>

          <div className={styles.iconCard}>
            <div className={styles.iconCircle}>🧪</div>
            <div className={styles.iconLabel}>Experiments</div>
          </div>
        </div>
      </div>
    </div>
  );
}
