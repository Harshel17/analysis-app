"use client";
import React, { useState } from "react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from './saved.module.css';
import config from '@/utils/config';

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
  description: string;
  principal: number;
  interest_week: number;
  projection_period: number;
  tax_rate: number;
  additional_deposit: number;
  deposit_frequency: number;
  regular_withdrawal: number;
  withdrawal_frequency: number;
}

export default function SavedAnalysisPage() {
  const [searchId, setSearchId] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch Analysis Parameters & Results
  const fetchResults = async () => {
    if (!searchId) return;

    try {
      setError(null);
      setResults([]);

      const analysisResponse = await fetch(`${config}/analysis/${searchId}`);
      if (!analysisResponse.ok) throw new Error("Failed to fetch analysis details");
      const analysisData = await analysisResponse.json();
      setAnalysisData(analysisData);

      const resultsResponse = await fetch(`${config}/permanent-results/${searchId}`);
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

  // ✅ Export as CSV
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

  // ✅ Export as PDF
  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Saved Analysis Report", 20, 15);

    const tableData = results.map((row) => [
      row.week,
      `$${row.beginning_balance.toFixed(2)}`,
      `$${row.additional_deposit.toFixed(2)}`,
      `$${row.interest.toFixed(2)}`,
      `$${row.profit.toFixed(2)}`,
      `$${row.withdrawal.toFixed(2)}`,
      `$${row.ending_balance.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 20,
      head: [["Week", "Beginning", "Deposit", "Interest", "Profit", "Withdrawal", "Ending"]],
      body: tableData,
    });

    doc.save(`analysis_${Date.now()}.pdf`);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>🔍 Search Saved Analysis</h2>

      <div className={styles.searchBox}>
        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchResults()}
          placeholder="Enter Analysis ID"
          className={styles.input}
        />
        <button onClick={fetchResults} className={styles.button}>
          Search
        </button>
      </div>

      {error && (
        <div className={styles.error}>❌ {error}</div>
      )}

      {analysisData && (
        <div className={styles.analysisBox}>
          <h3 className={styles.analysisTitle}>🔹 Analysis Parameters:</h3>
          <div className={styles.grid}>
            <p><strong>Description:</strong> {analysisData.description}</p>
            <p><strong>Principal:</strong> ${Number(analysisData.principal).toFixed(2)}</p>
            <p><strong>Interest Per Week:</strong> {Number(analysisData.interest_week).toFixed(2)}%</p>
            <p><strong>Projection Period:</strong> {analysisData.projection_period} weeks</p>
            <p><strong>Tax Rate:</strong> {Number(analysisData.tax_rate).toFixed(2)}%</p>
            <p><strong>Additional Deposit:</strong> ${Number(analysisData.additional_deposit).toFixed(2)}</p>
            <p><strong>Deposit Frequency:</strong> Every {analysisData.deposit_frequency} weeks</p>
            <p><strong>Regular Withdrawal:</strong> ${Number(analysisData.regular_withdrawal).toFixed(2)}</p>
            <p><strong>Withdrawal Frequency:</strong> Every {analysisData.withdrawal_frequency} weeks</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.exportButtons}>
          <button onClick={exportCSV} className={styles.exportCSV}>
            Export as CSV
          </button>
          <button onClick={exportAsPDF} className={styles.exportPDF}>
            Export as PDF
          </button>
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
                  <td className={styles.greenText}>${row.beginning_balance.toFixed(2)}</td>
                  <td className={styles.blueText}>${row.additional_deposit.toFixed(2)}</td>
                  <td className={styles.greenText}>${row.interest.toFixed(2)}</td>
                  <td className={styles.greenText}>${row.profit.toFixed(2)}</td>
                  <td className={styles.redText}>${row.withdrawal.toFixed(2)}</td>
                  <td className={styles.purpleText}>${row.ending_balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
