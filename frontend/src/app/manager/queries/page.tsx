"use client";

import { useState, useEffect } from "react";
import Navbar from "@/app/components/navbar";
import axios from "axios";
import config from "@/utils/config";
import styles from "./Queries.module.css";
import { toLocalDateTime } from "@/utils/date";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "username", label: "User" },
  { key: "description", label: "Description" },
  { key: "principal", label: "Principal" },
  { key: "ending_balance", label: "Ending Balance" },
  { key: "generated_at", label: "Generated At" },
];

export default function QueriesPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    username: "",
    description_contains: "",
    principal_gt: "",
    principal_lt: "",
    ending_balance_gt: "",
    ending_balance_lt: "",
    start_date: "",
    end_date: "",
  });

  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [activeSavedIndex, setActiveSavedIndex] = useState<number | null>(null);
  const [queryName, setQueryName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("savedQueries");
    if (saved) setSavedQueries(JSON.parse(saved));
  }, []);

  const handleChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const resetFilters = () => {
    setFilters({
      username: "",
      description_contains: "",
      principal_gt: "",
      principal_lt: "",
      ending_balance_gt: "",
      ending_balance_lt: "",
      start_date: "",
      end_date: "",
    });
    setResults([]);
    setError("");
  };

  const runQuery = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      (Object.keys(filters) as (keyof typeof filters)[]).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const res = await axios.get(`${config}/queries/analyses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResults(res.data);
      setPage(1);
      setError("");
    } catch (err) {
      console.error("Query failed", err);
      setError("⚠️ Failed to run query.");
    }
  };

  const saveCurrentQuery = () => {
    const updated = [...savedQueries, { ...filters, name: queryName || `Query ${savedQueries.length + 1}` }];
    setSavedQueries(updated);
    localStorage.setItem("savedQueries", JSON.stringify(updated));
    alert("✅ Query saved successfully!");
    setQueryName("");
  };

  const loadSavedQuery = (index: number) => {
    const q = savedQueries[index];
    const { name, ...pureFilters } = q;
    setFilters(pureFilters);
    setActiveSavedIndex(index);
  };

  const formatCurrency = (val: number) =>
    val?.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  const exportCSV = () => {
    const headers = COLUMNS.filter(c => selectedColumns.includes(c.key)).map(c => c.label);
    const rows = results.map((r: any) =>
      COLUMNS.filter(c => selectedColumns.includes(c.key)).map(c => {
        const val = c.key === "generated_at" ? toLocalDateTime(r[c.key]) : r[c.key];
        return typeof val === "number" ? formatCurrency(val) : val;
      })
    );
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "query_results.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const headers = COLUMNS.filter(c => selectedColumns.includes(c.key)).map(c => c.label);
    const rows = results.map((r: any) =>
      COLUMNS.filter(c => selectedColumns.includes(c.key)).map(c => {
        const val = c.key === "generated_at" ? toLocalDateTime(r[c.key]) : r[c.key];
        return typeof val === "number" ? `$${r[c.key].toLocaleString()}` : val;
      })
    );
    autoTable(doc, { head: [headers], body: rows });
    doc.save("query_results.pdf");
  };

  const paginatedResults = results.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.inner}>
        <h1 className={styles.heading}>🔍 Query Analyses</h1>

        <div className={styles.filters}>
          <input type="text" name="username" value={filters.username} onChange={handleChange} placeholder="Username" />
          <input type="text" name="description_contains" value={filters.description_contains} onChange={handleChange} placeholder="Description Contains" />
          <input type="number" name="principal_gt" value={filters.principal_gt} onChange={handleChange} placeholder="Principal >" />
          <input type="number" name="principal_lt" value={filters.principal_lt} onChange={handleChange} placeholder="Principal <" />
          <input type="number" name="ending_balance_gt" value={filters.ending_balance_gt} onChange={handleChange} placeholder="Balance >" />
          <input type="number" name="ending_balance_lt" value={filters.ending_balance_lt} onChange={handleChange} placeholder="Balance <" />
          <input type="date" name="start_date" value={filters.start_date} onChange={handleChange} />
          <input type="date" name="end_date" value={filters.end_date} onChange={handleChange} />
          <input type="text" value={queryName} onChange={(e) => setQueryName(e.target.value)} placeholder="Query Name" />
          <button onClick={runQuery}>Run Query</button>
          <button onClick={resetFilters} className={styles.resetBtn}>Reset Filters</button>
          <button onClick={saveCurrentQuery}>💾 Save Query</button>
          {results.length > 0 && (
            <>
              <button onClick={exportCSV}>⬇ Export CSV</button>
              <button onClick={exportPDF}>⬇ Export PDF</button>
            </>
          )}
        </div>

        {savedQueries.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <label>Saved Queries: </label>
            <select onChange={(e) => loadSavedQuery(Number(e.target.value))} value={activeSavedIndex ?? ""}>
              <option value="" disabled>Select saved query</option>
              {savedQueries.map((q, i) => (
                <option key={i} value={i}>
                  {q.name || `Query ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {COLUMNS.map((col) => (
          <label key={col.key} style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              checked={selectedColumns.includes(col.key)}
              onChange={() => toggleColumn(col.key)}
            /> {col.label}
          </label>
        ))}

        {error && <p className={styles.error}>{error}</p>}

        {paginatedResults.length > 0 ? (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  {COLUMNS.filter(c => selectedColumns.includes(c.key)).map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((r: any, idx: number) => (
                  <tr key={idx}>
                    {COLUMNS.filter(c => selectedColumns.includes(c.key)).map((col) => (
                      <td key={col.key}>
                        {col.key === "principal" || col.key === "ending_balance"
                          ? formatCurrency(r[col.key])
                          : col.key === "generated_at"
                          ? r[col.key] ? toLocalDateTime(r[col.key]) : "-"
                          : r[col.key]}
                      </td>
                    ))}
                    <td>
                      <button onClick={() => router.push(`/manager/analysis/${r.id}?from=queries`)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.pagination}>
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page}</span>
              <button disabled={page * pageSize >= results.length} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </>
        ) : (
          <p className={styles.noResults}>No results to show.</p>
        )}
      </div>
    </div>
  );
}
