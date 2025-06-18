// FINAL UPDATED page.tsx — Now renders side-by-side parameter layout in exports

"use client";

import { useEffect, useState, Fragment } from "react";
import Navbar from "@/app/components/navbar";
import styles from "./Reports.module.css";
import axios from "axios";
import config from "@/utils/config";
import { useRouter } from "next/navigation";
import { isManagerFromToken } from "@/utils/auth";
import { toLocalDateTime } from "@/utils/date";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BreakdownData {
  week: number;
  beginning_balance: number;
  additional_deposit: number;
  profit: number;
  withdrawal: number;
  tax_deduction: number;
  ending_balance: number;
  generated_at: string;
}

interface ReportData {
  id: number;
  username: string;
  description: string;
  principal: number;
  interest_week?: number;
  tax_rate?: number;
  projection_period?: number;
  deposit_frequency?: number;         // ✅ Fix this
  additional_deposit?: number;
  withdrawal_frequency?: number;      // ✅ Fix this
  regular_withdrawal?: number;
  ending_balance?: number;
  created_at: string;
  weekly_breakdown: BreakdownData[];
}


export default function ReportsPage() {
  const [username, setUsername] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [expandedReports, setExpandedReports] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTotals, setShowTotals] = useState(true);

  const reportsPerPage = 10;
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !isManagerFromToken()) {
      setError("❌ You are not authorized to view this page.");
    } else {
      fetchReports();  // <<< This will always load latest reports
    }
}, []);


  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const params = new URLSearchParams();
    if (username) params.append("username", username);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    try {
      setError(null);
      setLoading(true);
      setReports([]);

      const response = await axios.get(`${config}/manager/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReports(response.data);
      setCurrentPage(1);
    } catch (err) {
      setError("⚠️ Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

  const exportSingleCSV = (report: ReportData) => {
    let rows: string[][] = [];
    rows.push(["Analysis Criteria"]);
    rows.push([
      "Analysis ID", report.id.toString(),
      "Description", report.description
    ]);
    rows.push([
      "Principal", `$${report.principal.toLocaleString()}`,
      "Interest (weekly)", `${report.interest_week ?? "-"}%`
    ]);
    rows.push([
      "Projection Period", `${report.projection_period ?? "-"} weeks`,
      "Tax Rate", `${report.tax_rate ?? "-"}%`
    ]);
    rows.push([
      "Deposit Frequency", report.deposit_frequency?.toString() ?? "-",
      "Additional Deposit", `$${report.additional_deposit?.toLocaleString() ?? "-"}`
    ]);
    rows.push([
      "Regular Withdrawal", `$${report.regular_withdrawal?.toLocaleString() ?? "-"}`,
      "Withdrawal Frequency", report.withdrawal_frequency?.toString() ?? "-"
    ]);
    
    rows.push([
      "Ending Balance", `$${report.ending_balance?.toLocaleString() ?? "-"}`,
      "Created At", toLocalDateTime(report.created_at)
    ]);
    rows.push([]);

    rows.push(["Week", "Beginning", "Deposit", "Profit", "Withdrawal", "Tax", "Ending"]);
    report.weekly_breakdown.forEach((w) => {
      rows.push([
        w.week.toString(),
        w.beginning_balance.toFixed(2),
        w.additional_deposit.toFixed(2),
        w.profit.toFixed(2),
        w.withdrawal.toFixed(2),
        w.tax_deduction.toFixed(2),
        w.ending_balance.toFixed(2),
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${report.id}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const exportSinglePDF = (report: ReportData) => {
    const doc = new jsPDF();
    const margin = 14;
    let y = margin;
  
    doc.setFontSize(18);
    doc.text("Financial Report", margin, y);
    y += 10;
  
    // Box styling
    const boxHeight = 65;
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, y, 182, boxHeight, 4, 4, 'F');
  
    const labelFontSize = 11;
    const rowGap = 6;
    const labelX = margin + 6;
    const valueX = labelX + 55;
    const rightLabelX = margin + 100;
    const rightValueX = rightLabelX + 55;
    let rowY = y + 10;
  
    const safeValue = (val: any, prefix = "", suffix = "") => {
      if (val === null || val === undefined || val === "null" || val === "undefined") return "N/A";
      if (typeof val === "number" && isNaN(val)) return "N/A";
      if (typeof val === "number") return `${prefix}${val.toLocaleString()}${suffix}`;
      if (typeof val === "string" && val.trim() === "") return "N/A";
      return val.toString();
  };
  
    
  
    const leftParams = [
      ["Analysis ID", report.id.toString()],
      ["Principal", safeValue(report.principal, "$")],
      ["Projection Period", report.projection_period?.toString() ?? "N/A"],
      ["Deposit Frequency", report.deposit_frequency?.toString() ?? "N/A"],
      ["Regular Withdrawal", safeValue(report.regular_withdrawal, "$")],
      ["Ending Balance", safeValue(report.ending_balance, "$")],
    ];
  
    const rightParams = [
      ["Description", safeValue(report.description)],
      ["Interest (weekly)", safeValue(report.interest_week, "", "%")],
      ["Tax Rate", safeValue(report.tax_rate, "", "%")],
      ["Additional Deposit", safeValue(report.additional_deposit, "$")],
      ["Withdrawal Frequency", report.withdrawal_frequency?.toString() ?? "N/A"],
      ["Created At", toLocalDateTime(report.created_at)],
    ];
  
    doc.setFontSize(labelFontSize);
    for (let i = 0; i < leftParams.length; i++) {
      doc.setFont("helvetica", "bold");
      doc.text(leftParams[i][0] + ":", labelX, rowY);
      doc.setFont("helvetica", "normal");
      doc.text(leftParams[i][1], valueX, rowY);
  
      doc.setFont("helvetica", "bold");
      doc.text(rightParams[i][0] + ":", rightLabelX, rowY);
      doc.setFont("helvetica", "normal");
      doc.text(rightParams[i][1], rightValueX, rowY);
  
      rowY += rowGap;
    }
  
    // Weekly Breakdown Header
    y += boxHeight + 12;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Weekly Breakdown", margin, y);
    y += 6;
  
    const bodyRows = report.weekly_breakdown.map((w) => [
      w.week,
      `$${w.beginning_balance.toFixed(2)}`,
      `$${w.additional_deposit.toFixed(2)}`,
      `$${w.profit.toFixed(2)}`,
      `$${w.withdrawal.toFixed(2)}`,
      `$${w.tax_deduction.toFixed(2)}`,
      `$${w.ending_balance.toFixed(2)}`,
    ]);
  
    autoTable(doc, {
      startY: y,
      head: [["Week", "Beginning", "Deposit", "Profit", "Withdrawal", "Tax", "Ending"]],
      body: bodyRows,
      styles: { fontSize: 9, halign: "right" },
      headStyles: { fillColor: [0, 102, 204] },
      margin: { left: margin, right: margin },
    });
  
    doc.save(`report_${report.id}.pdf`);
  };
  
  

  const toggleExpand = (id: number) => {
    setExpandedReports((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };
  return (
    <div style={{ display: "flex", flexDirection: 'row'}}>
      <Navbar />
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <h1 className={styles.heading}>📄 Manager Reports</h1>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.card}>
  <h2 className={styles.title}>📊 Download or View Financial Report</h2>

  <div className={styles.searchBox}>
    <div className={styles.searchHeader}>
      <span className={styles.searchIcon}>🔍</span>
      <h3 className={styles.searchTitle}>Search Criteria</h3>
    </div>
    <div className={styles.searchFields}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={styles.input}
      />
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className={styles.input}
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className={styles.input}
      />
      <button onClick={fetchReports} className={styles.button}>
        🔎 Search
      </button>
    </div>
  </div>

  <div style={{ marginTop: "0.75rem" }}>
    <label>
      <input
        type="checkbox"
        checked={showTotals}
        onChange={() => setShowTotals(!showTotals)}
        style={{ marginRight: "0.5rem" }}
      />
      Show Totals Row
    </label>
  </div>
</div>



          {loading && <div className={styles.spinnerContainer}><div className={styles.spinner}></div><p>Loading reports...</p></div>}

          {!loading && currentReports.length > 0 && (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Description</th>
                    <th>Principal</th>
                    <th>Ending Balance</th>
                    <th>Created</th>
                    <th>Export CSV</th>
                    <th>Export PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReports.map((report) => (
                    <Fragment key={report.id}>
                      <tr>
                        <td>{report.id}</td>
                        <td>{report.username}</td>
                        <td>{report.description}</td>
                        <td>${report.principal.toLocaleString()}</td>
                        <td>${report.ending_balance?.toLocaleString() || "-"}</td>
                        <td>{toLocalDateTime(report.created_at)}</td>
                        <td>
                          <button className={styles.exportButton} onClick={() => exportSingleCSV(report)}>CSV</button>
                        </td>
                        <td>
                          <button className={styles.exportButton} onClick={() => exportSinglePDF(report)}>PDF</button>
                        </td>
                      </tr>
                      {expandedReports.includes(report.id) && (
                        <tr>
                          <td colSpan={8}>
                            <table className={styles.innerTable}>
                              <thead>
                                <tr>
                                  <th>Week</th>
                                  <th>Beginning</th>
                                  <th>Deposit</th>
                                  <th>Profit</th>
                                  <th>Withdrawal</th>
                                  <th>Tax</th>
                                  <th>Ending</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.weekly_breakdown.map((w, i) => (
                                  <tr key={i}>
                                    <td>{w.week}</td>
                                    <td>${w.beginning_balance.toFixed(2)}</td>
                                    <td>${w.additional_deposit.toFixed(2)}</td>
                                    <td>${w.profit.toFixed(2)}</td>
                                    <td>${w.withdrawal.toFixed(2)}</td>
                                    <td>${w.tax_deduction.toFixed(2)}</td>
                                    <td>${w.ending_balance.toFixed(2)}</td>
                                  </tr>
                                ))}
                                {showTotals && (
                                  <tr className={styles.totalRow}>
                                    <td><strong>Total</strong></td>
                                    <td>—</td>
                                    <td><strong>${report.weekly_breakdown.reduce((acc, w) => acc + w.additional_deposit, 0).toFixed(2)}</strong></td>
                                    <td><strong>${report.weekly_breakdown.reduce((acc, w) => acc + w.profit, 0).toFixed(2)}</strong></td>
                                    <td><strong>${report.weekly_breakdown.reduce((acc, w) => acc + w.withdrawal, 0).toFixed(2)}</strong></td>
                                    <td><strong>${report.weekly_breakdown.reduce((acc, w) => acc + w.tax_deduction, 0).toFixed(2)}</strong></td>
                                    <td>—</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              <div className={styles.pagination}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`${styles.pageButton} ${currentPage === i + 1 ? styles.activePage : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className={styles.noData}><p>📄 No reports found. Try different filters!</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
