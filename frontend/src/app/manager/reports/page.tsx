"use client";

import { useEffect, useState } from "react";
import Navbar from "@/app/components/navbar";
import styles from "./Reports.module.css";
import axios from "axios";
import config from "@/utils/config";
import { useRouter } from "next/navigation";
import { isManagerFromToken } from "@/utils/auth";
import { toLocalDateTime } from "@/utils/date";


export default function ReportsPage() {
  const [username, setUsername] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !isManagerFromToken()) {
      setError("❌ You are not authorized to view this page.");
    }
  }, [])


  const downloadCSV = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const params = new URLSearchParams();

if (username) params.append("username", username);
if (startDate) params.append("start_date", startDate);
if (endDate) params.append("end_date", endDate);

// 👇 Automatically grab the browser timezone
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
params.append("timezone", timezone);


    try {
      const response = await axios.get(
        `${config}/manager/reports/financial?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "financial_report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("⚠️ Failed to download report.");
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />

      <div className={styles.wrapper}>
        <h1 className={styles.heading}>📄 Manager Reports</h1>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.card}>
          <h2 className={styles.title}>📊 Download Financial Report</h2>

          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Filter by Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
            />
            <input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.input}
            />
            <input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.input}
            />
            <button onClick={downloadCSV} className={styles.button}>
              ⬇ Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
