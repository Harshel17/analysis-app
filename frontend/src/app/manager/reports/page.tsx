// FINAL Updated Frontend: `page.tsx` for Reports (With Totals Toggle, Colored Row, and Exported Totals)

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
  ending_balance: number;
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
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTotals, setShowTotals] = useState(true);

  const reportsPerPage = 10;
  const selectedReports = reports.filter((r) => selectedReportIds.includes(r.id));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !isManagerFromToken()) {
      setError("❌ You are not authorized to view this page.");
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

  const toggleExpand = (id: number) => {
    setExpandedReports((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    if (selectedReportIds.length === 0) {
      alert("Please select at least one report.");
      return;
    }

    let allRows: string[][] = [];

    selectedReports.forEach((report) => {
      allRows.push(["ID", "Username", "Description", "Principal", "Ending Balance", "Created At"]);
      allRows.push([
        report.id.toString(),
        report.username,
        report.description,
        report.principal.toString(),
        report.ending_balance?.toString() ?? "-",
        toLocalDateTime(report.created_at),
      ]);
      allRows.push([]);

      allRows.push(["Week", "Beginning", "Deposit", "Profit", "Withdrawal", "Tax", "Ending"]);
      report.weekly_breakdown.forEach((w) => {
        allRows.push([
          w.week.toString(),
          w.beginning_balance.toFixed(2),
          w.additional_deposit.toFixed(2),
          w.profit.toFixed(2),
          w.withdrawal.toFixed(2),
          w.tax_deduction.toFixed(2),
          w.ending_balance.toFixed(2),
        ]);
      });

      if (showTotals) {
        const totals = {
          additional_deposit: report.weekly_breakdown.reduce((sum, w) => sum + w.additional_deposit, 0),
          profit: report.weekly_breakdown.reduce((sum, w) => sum + w.profit, 0),
          withdrawal: report.weekly_breakdown.reduce((sum, w) => sum + w.withdrawal, 0),
          tax_deduction: report.weekly_breakdown.reduce((sum, w) => sum + w.tax_deduction, 0),
        };
        allRows.push([
          "Total",
          "",
          totals.additional_deposit.toFixed(2),
          totals.profit.toFixed(2),
          totals.withdrawal.toFixed(2),
          totals.tax_deduction.toFixed(2),
          "",
        ]);
      }

      allRows.push([]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + allRows.map((r) => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_reports_export.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Financial Reports", 14, 15);

    selectedReports.forEach((report, index) => {
      if (index !== 0) doc.addPage();
      let y = 25;
      doc.text(`ID: ${report.id}`, 14, y), (y += 10);
      doc.text(`Username: ${report.username}`, 14, y), (y += 10);
      doc.text(`Description: ${report.description}`, 14, y), (y += 10);
      doc.text(`Principal: $${report.principal.toLocaleString()}`, 14, y), (y += 10);
      doc.text(`Ending Balance: $${report.ending_balance?.toLocaleString() || "-"}`, 14, y), (y += 10);
      doc.text(`Created At: ${toLocalDateTime(report.created_at)}`, 14, y), (y += 10);

      const bodyRows = report.weekly_breakdown.map((w) => [
        w.week,
        `$${w.beginning_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${w.additional_deposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${w.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${w.withdrawal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${w.tax_deduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${w.ending_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      ]);

      if (showTotals) {
        const totals = {
          additional_deposit: report.weekly_breakdown.reduce((sum, w) => sum + w.additional_deposit, 0),
          profit: report.weekly_breakdown.reduce((sum, w) => sum + w.profit, 0),
          withdrawal: report.weekly_breakdown.reduce((sum, w) => sum + w.withdrawal, 0),
          tax_deduction: report.weekly_breakdown.reduce((sum, w) => sum + w.tax_deduction, 0),
        };
        bodyRows.push([
          "Total",
          "",
          `$${totals.additional_deposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `$${totals.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `$${totals.withdrawal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `$${totals.tax_deduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          "",
        ]);
      }

      autoTable(doc, {
        startY: y + 10,
        head: [["Week", "Beginning", "Deposit", "Profit", "Withdrawal", "Tax", "Ending"]],
        body: bodyRows,
        styles: { fontSize: 9 },
      });
    });

    doc.save("financial_report.pdf");
  };

  const printTable = () => window.print();

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / reportsPerPage);

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.wrapper}>
        <h1 className={styles.heading}>📄 Manager Reports</h1>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.card}>
          <h2 className={styles.title}>📊 Download or View Financial Report</h2>
          <div className={styles.filters}>
            <input type="text" placeholder="Filter by Username" value={username} onChange={(e) => setUsername(e.target.value)} className={styles.input} />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={styles.input} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={styles.input} />
            <button onClick={exportCSV} className={styles.button} disabled={selectedReportIds.length === 0}>⬇ Export CSV</button>
            <button onClick={downloadPDF} className={styles.button} disabled={selectedReportIds.length === 0}>🧾 Export PDF</button>
            <button onClick={fetchReports} className={styles.button}>🔍 Search Reports</button>
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <label>
              <input type="checkbox" checked={showTotals} onChange={() => setShowTotals(!showTotals)} style={{ marginRight: "0.5rem" }} /> Show Totals Row
            </label>
          </div>
        </div>


        {loading && <div className={styles.spinnerContainer}><div className={styles.spinner}></div><p>Loading reports...</p></div>}

        {!loading && currentReports.length > 0 && (
          <div className={styles.tableContainer}>
            {selectedReportIds.length > 0 && (
              <div className={styles.selectionSummary}>
                <p>
                  ✅ <strong>Selected Analyses:</strong> {selectedReportIds.join(", ")}
                </p>
              </div>
            )}

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Description</th>
                  <th>Principal</th>
                  <th>Ending Balance</th>
                  <th>Created</th>
                  <th>View</th>
                  <th>Select</th>
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
                        <button onClick={() => toggleExpand(report.id)} className={styles.selectButton}>
                          {expandedReports.includes(report.id) ? "Hide" : "View"}
                        </button>
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedReportIds.includes(report.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReportIds((prev) => [...prev, report.id]);
                            } else {
                              setSelectedReportIds((prev) => prev.filter((id) => id !== report.id));
                            }
                          }}
                        />
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
                                  <td>${w.beginning_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td>${w.additional_deposit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td>${w.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td>${w.withdrawal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td>${w.tax_deduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td>${w.ending_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              ))}

                              {showTotals && (
                                <tr className={styles.totalRow}>
                                  <td><strong>Total</strong></td>
                                  <td>—</td>
                                  <td><strong>${report.weekly_breakdown.reduce((acc, w) => acc + w.additional_deposit, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                  <td><strong>${report.weekly_breakdown.reduce((acc, w) => acc + w.profit, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                  <td><strong>${report.weekly_breakdown.reduce((acc, w) => acc + w.withdrawal, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                  <td><strong>${report.weekly_breakdown.reduce((acc, w) => acc + w.tax_deduction, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
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
  );
}
