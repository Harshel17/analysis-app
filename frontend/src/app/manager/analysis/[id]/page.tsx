"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  tax_rate: number;
  additional_deposit: number;
  regular_withdrawal: number;
}

export default function ManagerAnalysisDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<ResultRow[]>([]);
  const [meta, setMeta] = useState<AnalysisMetadata | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedMeta, setEditedMeta] = useState<AnalysisMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromQuery, setFromQuery] = useState<string | null>(null);

useEffect(() => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get("from");
    setFromQuery(from);
  }
}, []);


const backLink = fromQuery === "queries" ? "/manager/queries" : "/manager";


  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const format = (val: number) =>
    val.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const fetchMetadataAndResults = async () => {
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
      setEditedMeta(metaRes.data);
    } catch (err) {
      setError("⚠️ Unable to fetch analysis data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadataAndResults();
  }, [id]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedMeta) {
      setEditedMeta({ ...editedMeta, [e.target.name]: e.target.value });
    }
  };

  const handleSaveChanges = async () => {
    try {
      await axios.post(
        `${config}/analysis/update-analysis/${id}`,
        {
          description: editedMeta?.description,
          principal: Number(editedMeta?.principal),
          interest_week: Number(editedMeta?.interest_week),
          projection_period: Number(editedMeta?.projection_period),
          tax_rate: Number(editedMeta?.tax_rate),
          additional_deposit: Number(editedMeta?.additional_deposit),
          deposit_frequency: Number(editedMeta?.deposit_frequency),
          regular_withdrawal: Number(editedMeta?.regular_withdrawal),
          withdrawal_frequency: Number(editedMeta?.withdrawal_frequency),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      await axios.post(
        `${config}/analysis/move-to-permanent/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // ✅ Clear old results
      setData([]);
  
      // ✅ Then refetch fresh
      await fetchMetadataAndResults();
  
      alert("✅ Changes saved and recalculated successfully!");
      setEditMode(false);
    } catch (err) {
      alert("🚨 Failed to save changes. Please try again.");
    }
  };
  

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.inner}>
      <button onClick={() => router.push(backLink)} className={styles.backBtn}>
  ← Return to {fromQuery === "queries" ? "Queries" : "Dashboard"}
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
                <div className={styles.breakdownHeader}>
                  <h2 className={styles.subheading}>📌 Parameters</h2>
                  <button
                    className={styles.editButton}
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? "Cancel" : "Edit"}
                  </button>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardRow}>
                    <span>Analysis ID:</span><span>{meta.id}</span>
                  </div>

                  {editMode ? (
                    <>
                      {[
                        "description",
                        "principal",
                        "interest_week",
                        "projection_period",
                        "tax_rate",
                        "deposit_frequency",
                        "additional_deposit",
                        "regular_withdrawal",
                        "withdrawal_frequency",
                      ].map((field) => (
                        <div key={field} className={styles.cardRow}>
                          <span>{field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}:</span>
                          <input
                            name={field}
                            type={field.includes("description") ? "text" : "number"}
                            value={(editedMeta as any)?.[field] ?? ""}
                            onChange={handleChange}
                          />
                        </div>
                      ))}
                      <button className={styles.saveButton} onClick={handleSaveChanges}>
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.cardRow}><span>Description:</span><span>{meta.description}</span></div>
                      <div className={styles.cardRow}><span>Principal:</span><span className={styles.green}>{format(meta.principal)}</span></div>
                      <div className={styles.cardRow}><span>Interest (weekly):</span><span>{meta.interest_week}%</span></div>
                      <div className={styles.cardRow}><span>Projection Period:</span><span>{meta.projection_period} weeks</span></div>
                      <div className={styles.cardRow}><span>Tax Rate:</span><span>{meta.tax_rate}%</span></div>
                      <div className={styles.cardRow}><span>Deposit Frequency:</span><span>Every {meta.deposit_frequency} weeks</span></div>
                      <div className={styles.cardRow}><span>Additional Deposit:</span><span>{format(meta.additional_deposit)}</span></div>
                      <div className={styles.cardRow}><span>Regular Withdrawal:</span><span>{format(meta.regular_withdrawal)}</span></div>
                      <div className={styles.cardRow}><span>Withdrawal Frequency:</span><span>Every {meta.withdrawal_frequency} weeks</span></div>
                    </>
                  )}
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
                    <tr key={idx} className={idx % 2 === 0 ? styles.rowEven : styles.rowOdd}>
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
