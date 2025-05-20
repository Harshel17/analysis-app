"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from './saved.module.css';
import config from '@/utils/config';
import { getUsernameFromToken, isManagerFromToken } from "@/utils/auth";
import Navbar from "@/app/components/navbar";
import { useRouter } from "next/navigation";
import { toLocalDateTime } from "@/utils/date";

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

interface User {
  id: number;
  username: string;
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
  const [userList, setUserList] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");

  const isManager = isManagerFromToken();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
  
    const fetchAnalyses = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
    
      try {
        setError(null); // clear previous errors
        let url = "";
    
        if (selectedUser && selectedUser.trim() !== "") {
          url = `${config}/saved-analysis?username=${selectedUser}`;
        } else if (isManager) {
          url = `${config}/saved-analysis`; // get all for manager
        } else {
          url = `${config}/saved-analysis`; // regular user
        }
    
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        if (!res.ok) throw new Error(`Failed with status ${res.status}`);
        const data = await res.json();
    
        if (Array.isArray(data)) {
          const sorted = [...data].sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setUserAnalyses(sorted);
        } else {
          console.error("Unexpected response (not array):", data);
          setUserAnalyses([]);
        }
      } catch (err) {
        console.error("❌ Failed to load analyses:", err);
        setUserAnalyses([]);
        // Don't show error unless user actually clicks Search or filters
        if (selectedUser || !isManager) {
          setError("Failed to load analyses");
        }
      }
    };
    
  
    fetchAnalyses();
  }, [selectedUser]);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !isManager) return;

    fetch(`${config}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUserList(data))
      .catch((err) => console.error("Failed to load users", err));
  }, []);

  const fetchResults = async () => {
    if (!searchId) return;
    const token = localStorage.getItem("token");
    if (!token) return setError("Not authenticated");

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
    <div className={styles.pageWrapper}>
      <Navbar />
      <div className={`${styles.container} ${styles.withSidebar}`}>
        <h2 className={styles.heading}>🔍 Search Saved Analysis</h2>

        {isManager && (
          <div style={{ marginBottom: "1rem" }}>
            <label><strong>Filter by User: </strong></label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #ccc", marginLeft: "1rem" }}
            >
              <option value="">-- Select User --</option>
              {userList.map((user) => (
                <option key={user.id} value={user.username}>{user.username}</option>
              ))}
            </select>
          </div>
        )}

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

        {userAnalyses.length > 0 && (
          <div className={styles.analysisList}>
            <h3 className={styles.listHeading}>📁 Your Analyses:</h3>
            {userAnalyses.filter((a) => {
  if (filterMode === "text") {
    return a.description.toLowerCase().includes(filterText.toLowerCase()) || String(a.id).includes(filterText);
  }
  if (filterMode === "date") {
    return a.created_at?.startsWith(filterDate);
  }
  return true;
}).map((a) => (
              <div key={a.id} className={styles.card} onClick={() => setSearchId(String(a.id))}>
                <p><strong>ID:</strong> {a.id}</p>
                <p><strong>Description:</strong> {a.description}</p>
                <p><strong>Created:</strong> {a.created_at ? toLocalDateTime(a.created_at) : "-"}</p>
                <p><strong>Updated:</strong> {a.updated_at ? toLocalDateTime(a.updated_at) : "-"}</p>
              </div>
            ))}
          </div>
        )}

        {error && <div className={styles.error}>❌ {error}</div>}

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
    </div>
  );
}
