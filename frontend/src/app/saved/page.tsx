"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from './saved.module.css';
import config from '@/utils/config';
import { getUsernameFromToken } from "@/utils/auth";
import Navbar from "@/app/components/navbar";
import { useRouter } from "next/navigation";
import { toLocalDateTime } from "@/utils/date"; // ✅ Import local date util

type ResultRow = {
  week: number;
  beginning_balance: number;
  additional_deposit: number;
  interest: number;
  profit: number;
  withdrawal: number;
  ending_balance: number;
};

interface AnalysisData {
  id: number;
  description: string;
  principal: number;
  interest_week: number;
  projection_period: number;
  tax_rate: number;
  additional_deposit: number;
  deposit_frequency: number;
  regular_withdrawal: number;
  withdrawal_frequency: number;
  created_at?: string;
  updated_at?: string;
}

export default function SavedAnalysisPage() {
  const router = useRouter();

  const [searchId, setSearchId] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userAnalyses, setUserAnalyses] = useState<AnalysisData[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<"all" | "text" | "date">("all");
  const [filterText, setFilterText] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const name = getUsernameFromToken();
    if (name) setUsername(name);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${config}/saved-analysis`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setUserAnalyses(sorted);
      })
      .catch((err) => {
        console.error("Failed to load user's analyses", err);
        setError("Failed to load analyses");
      });
  }, []);

  const fetchResults = async () => {
    if (!searchId) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      return;
    }

    try {
      setError(null);
      setResults([]);

      const analysisResponse = await fetch(`${config}/analysis/${searchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!analysisResponse.ok) throw new Error("Failed to fetch analysis details");
      const analysisData = await analysisResponse.json();
      setAnalysisData(analysisData);

      const resultsResponse = await fetch(`${config}/permanent-results/${searchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resultsResponse.ok) throw new Error("No saved results found.");
      const resultsData = await resultsResponse.json();
      setResults(resultsData);
    } catch (error) {
      const err = error as Error;
      console.error("Error fetching data:", err);
      setError(err.message);
      setAnalysisData(null);
    }
  };

  const exportCSV = () => {
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `analysis_${searchId}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Saved Analysis Report", 20, 15);
    const tableData = results.map((row) => [
      row.week,
      formatCurrency(row.beginning_balance),
      formatCurrency(row.additional_deposit),
      formatCurrency(row.interest),
      formatCurrency(row.profit),
      formatCurrency(row.withdrawal),
      formatCurrency(row.ending_balance),
    ]);
    autoTable(doc, {
      startY: 20,
      head: [["Week", "Beginning", "Deposit", "Interest", "Profit", "Withdrawal", "Ending"]],
      body: tableData,
    });
    doc.save(`analysis_${Date.now()}.pdf`);
  };

  const formatCurrency = (value: number | undefined): string => {
    if (typeof value !== "number") return "$0.00";
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  return (
    <div className={styles.container}>
      <Navbar />

      <h2 className={styles.heading}>🔍 Search Saved Analysis</h2>

      {/* Search Box */}
      <div className={styles.searchBox}>
        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchResults()}
          placeholder="Enter Analysis ID"
          className={styles.input}
        />
        <button onClick={fetchResults} className={styles.button}>Search</button>
      </div>

      {/* Filter Options */}
      <div style={{ margin: "1rem 0", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <label><input type="radio" checked={filterMode === "all"} onChange={() => setFilterMode("all")} /> Show All</label>
        <label><input type="radio" checked={filterMode === "text"} onChange={() => setFilterMode("text")} /> Filter by Text</label>
        <label><input type="radio" checked={filterMode === "date"} onChange={() => setFilterMode("date")} /> Filter by Date</label>

        {filterMode === "text" && (
          <input
            type="text"
            placeholder="Search by ID or Description"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        )}

        {filterMode === "date" && (
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        )}
      </div>

      {/* Filtered List */}
      {userAnalyses.length > 0 && (
        <div className={styles.analysisList}>
          <h3 className={styles.listHeading}>📁 Your Analyses:</h3>
          {userAnalyses
            .filter((a) => {
              if (filterMode === "text") {
                return a.description.toLowerCase().includes(filterText.toLowerCase()) || String(a.id).includes(filterText);
              }
              if (filterMode === "date") {
                return a.created_at?.startsWith(filterDate);
              }
              return true;
            })
            .map((a) => (
              <div key={a.id} className={styles.card} onClick={() => setSearchId(String(a.id))}>
                <p><strong>ID:</strong> {a.id}</p>
                <p><strong>Description:</strong> {a.description}</p>
                <p><strong>Created:</strong> {a.created_at ? toLocalDateTime(a.created_at) : "-"}</p> {/* ✅ Local time */}
                <p><strong>Updated:</strong> {a.updated_at ? toLocalDateTime(a.updated_at) : "-"}</p> {/* ✅ Local time */}
              </div>
            ))}
        </div>
      )}

      {error && <div className={styles.error}>❌ {error}</div>}

      {/* Analysis Summary */}
      {analysisData && (
        <div className={styles.analysisBox}>
          <h3 className={styles.analysisTitle}>🔹 Analysis Parameters:</h3>
          <div className={styles.grid}>
            <p><strong>ID:</strong> {analysisData.id}</p>
            <p><strong>Description:</strong> {analysisData.description}</p>
            <p><strong>Principal:</strong> {formatCurrency(analysisData.principal)}</p>
            <p><strong>Interest Per Week:</strong> {analysisData.interest_week.toFixed(2)}%</p>
            <p><strong>Projection Period:</strong> {analysisData.projection_period} weeks</p>
            <p><strong>Tax Rate:</strong> {analysisData.tax_rate.toFixed(2)}%</p>
            <p><strong>Additional Deposit:</strong> {formatCurrency(analysisData.additional_deposit)}</p>
            <p><strong>Deposit Frequency:</strong> Every {analysisData.deposit_frequency} weeks</p>
            <p><strong>Regular Withdrawal:</strong> {formatCurrency(analysisData.regular_withdrawal)}</p>
            <p><strong>Withdrawal Frequency:</strong> Every {analysisData.withdrawal_frequency} weeks</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.exportButtons}>
          <button onClick={exportCSV} className={styles.exportCSV}>Export as CSV</button>
          <button onClick={exportAsPDF} className={styles.exportPDF}>Export as PDF</button>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
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
              {results.map((row, index) => (
                <tr key={index}>
                  <td>{row.week}</td>
                  <td className={styles.greenText}>{formatCurrency(row.beginning_balance)}</td>
                  <td className={styles.blueText}>{formatCurrency(row.additional_deposit)}</td>
                  <td className={styles.greenText}>{formatCurrency(row.interest)}</td>
                  <td className={styles.greenText}>{formatCurrency(row.profit)}</td>
                  <td className={styles.redText}>{formatCurrency(row.withdrawal)}</td>
                  <td className={styles.purpleText}>{formatCurrency(row.ending_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Button */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#e5e7eb",
            borderRadius: "6px",
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          ← Return to Previous Page
        </button>
      </div>
    </div>
  );
}
