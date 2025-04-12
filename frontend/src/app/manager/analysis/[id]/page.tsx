"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import config from "@/utils/config";
import Navbar from "@/app/components/navbar";
import styles from "./AnalysisDetails.module.css";
import { toLocalDateTime } from "@/utils/date";


interface ResultRow {
  week: number;
  beginning_balance: number;
  additional_deposit: number;
  interest: number;
  profit: number;
  withdrawal: number;
  ending_balance: number;
  generated_at?: string;
}

interface AnalysisMetadata {
  id: number;
  description: string;
  principal: number;
  interest_week: number;
  projection_period: number;
  deposit_frequency: number;
  withdrawal_frequency: number;
}

export default function ManagerAnalysisDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<ResultRow[]>([]);
  const [meta, setMeta] = useState<AnalysisMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formatDate = (utcDate?: string): string =>
    utcDate ? new Date(utcDate).toLocaleString() : "-";
  

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        const [resultsRes, metaRes] = await Promise.all([
          axios.get(`${config}/analysis/permanent-results/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${config}/analysis/analysis/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setData(resultsRes.data);
        setMeta(metaRes.data);
      } catch (err) {
        setError("⚠️ Unable to fetch analysis data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const format = (val: number) =>
    val.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const handleExport = () => {
    const csvRows = [
      ["Week", "Begin", "Deposit", "Interest", "Profit", "Withdrawal", "Ending"],
      ...data.map((row) => [
        row.week,
        format(row.beginning_balance),
        format(row.additional_deposit),
        format(row.interest),
        format(row.profit),
        format(row.withdrawal),
        format(row.ending_balance),
      ]),
    ];

    const csv = csvRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis_${id}_results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.inner}>
        <button onClick={() => router.push("/manager")} className={styles.backBtn}>
          ← Return to Dashboard
        </button>

        <h1 className={styles.heading}>📊 Analysis Details</h1>

        {loading ? (
          <p className={styles.loading}>⏳ Loading...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <>
            {meta && (
              <>
                <h2 className={styles.subheading}>📌 Parameters</h2>
                <div className={styles.card}>
                  <div className={styles.cardRow}>
                    <span>Analysis ID:</span>
                    <span>{meta.id}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span>Description:</span>
                    <span>{meta.description}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span>Principal:</span>
                    <span className={styles.green}>{format(meta.principal)}</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span>Interest (weekly):</span>
                    <span>{meta.interest_week}%</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span>Projection Period:</span>
                    <span>{meta.projection_period} weeks</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span>Deposit Frequency:</span>
                    <span>Every {meta.deposit_frequency} weeks</span>
                  </div>
                  <div className={styles.cardRow}>
                    <span>Withdrawal Frequency:</span>
                    <span>Every {meta.withdrawal_frequency} weeks</span>
                  </div>
                </div>
              </>
            )}

            <div className={styles.breakdownHeader}>
              <h2 className={styles.subheading}>📉 Weekly Breakdown</h2>
              <button onClick={handleExport} className={styles.exportBtn}>
                ⬇ Export CSV
              </button>
            </div>
            {data.length > 0 && data[0].generated_at && (
 <p style={{ fontSize: "0.9rem", marginTop: "-1rem", marginBottom: "1rem", color: "#4B5563" }}>
 ⏱️ Generated At: <strong>{toLocalDateTime(data[0].generated_at)}</strong>
</p>

)}


            <div className={styles.tableWrapper}>
              <table className={styles.breakdownTable}>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Beginning Balance</th>
                    <th>Additional Deposit</th>
                    <th>Interest</th>
                    <th>Profit</th>
                    <th>Withdrawal</th>
                    <th>Ending Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}
                    >
                      <td>{row.week}</td>
                      <td className={styles.green}>{format(row.beginning_balance)}</td>
                      <td className={styles.blue}>{format(row.additional_deposit)}</td>
                      <td className={styles.emerald}>{format(row.interest)}</td>
                      <td className={styles.emerald}>{format(row.profit)}</td>
                      <td className={styles.red}>{format(row.withdrawal)}</td>
                      <td className={styles.purple}>{format(row.ending_balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
