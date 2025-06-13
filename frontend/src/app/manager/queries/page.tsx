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

const WEEKLY_RESULT_COLUMNS = [
  { key: "week", label: "Week" },
  { key: "beginning_balance", label: "Beginning Balance" },
  { key: "additional_deposit", label: "Additional Deposit" },
  { key: "interest", label: "Interest" },
  { key: "profit", label: "Profit" },
  { key: "withdrawal", label: "Withdrawal" },
  { key: "ending_balance", label: "Ending Balance" },
];

const fieldOptions = ["username", "description", "principal", "ending_balance", "created_at"];
const operatorOptions: Record<string, string[]> = {
  username: ["Equals", "Contains"],
  description: ["Contains"],
  principal: ["=", ">", "<", ">=", "<="],
  ending_balance: ["=", ">", "<", ">=", "<="],
  created_at: ["Between"],
};

type FilterRow = {
  field: string;
  operator: string;
  value: string;
};

export default function QueriesPage() {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterRow[]>([{ field: "username", operator: "Equals", value: "" }]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [queryName, setQueryName] = useState("");
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [activeSavedIndex, setActiveSavedIndex] = useState<number | null>(null);

  const [selectedMainCols, setSelectedMainCols] = useState(COLUMNS.map(c => c.key));
  const [selectedWeeklyCols, setSelectedWeeklyCols] = useState(WEEKLY_RESULT_COLUMNS.map(c => c.key));

  useEffect(() => {
    const saved = localStorage.getItem("savedQueries");
    if (saved) setSavedQueries(JSON.parse(saved));
  }, []);

  const handleFieldChange = (index: number, field: string) => {
    const updated = [...filters];
    updated[index].field = field;
    updated[index].operator = operatorOptions[field][0];
    updated[index].value = "";
    setFilters(updated);
  };

  const handleOperatorChange = (index: number, operator: string) => {
    const updated = [...filters];
    updated[index].operator = operator;
    setFilters(updated);
  };

  const handleValueChange = (index: number, value: string) => {
    const updated = [...filters];
    updated[index].value = value;
    setFilters(updated);
  };

  const toggleColumn = (key: string, type: "main" | "weekly") => {
    if (type === "main") {
      setSelectedMainCols(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
    } else {
      setSelectedWeeklyCols(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
    }
  };

  const addFilter = () => setFilters([...filters, { field: "username", operator: "Equals", value: "" }]);

  const removeFilter = (index: number) => {
    const updated = filters.filter((_, i) => i !== index);
    setFilters(updated);
  };

  const runQuery = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      filters.forEach(({ field, operator, value }) => {
        if (!value) return;

        if (field === "created_at" && operator === "Between") {
          const [start, end] = value.split(",");
          if (start) params.append("start_date", start);
          if (end) params.append("end_date", end);
          return;
        }

        let key = field;
        if (["Contains", "Equals"].includes(operator)) {
          if (operator === "Contains") key += "_contains";
        } else {
          key += `_${operator}`;
        }

        params.append(key, value);
      });

      const res = await axios.get(`${config}/queries/analyses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResults(res.data);
      setPage(1);
      setError("");
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to fetch query results.");
    }
  };

  const resetFilters = () => {
    setFilters([{ field: "username", operator: "Equals", value: "" }]);
    setResults([]);
    setError("");
  };

  const saveCurrentQuery = () => {
    const updated = [...savedQueries, { filters, name: queryName || `Query ${savedQueries.length + 1}` }];
    setSavedQueries(updated);
    localStorage.setItem("savedQueries", JSON.stringify(updated));
    alert("✅ Query saved!");
    setQueryName("");
  };

  const loadSavedQuery = (index: number) => {
    const q = savedQueries[index];
    setFilters(q.filters);
    setActiveSavedIndex(index);
  };

  const exportCSV = () => {
    const headers = COLUMNS.filter(c => selectedMainCols.includes(c.key)).map(c => c.label);
    const rows = results.map((r: any) =>
      COLUMNS.filter(c => selectedMainCols.includes(c.key)).map(c => {
        const val = c.key === "generated_at" ? toLocalDateTime(r[c.key]) : r[c.key];
        return typeof val === "number" ? `$${val.toLocaleString()}` : val;
      })
    );
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "query_results.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const headers = COLUMNS.filter(c => selectedMainCols.includes(c.key)).map(c => c.label);
    const rows = results.map((r: any) =>
      COLUMNS.filter(c => selectedMainCols.includes(c.key)).map(c => {
        const val = c.key === "generated_at" ? toLocalDateTime(r[c.key]) : r[c.key];
        return typeof val === "number" ? `$${val.toLocaleString()}` : val;
      })
    );
    autoTable(doc, { head: [headers], body: rows });
    doc.save("query_results.pdf");
  };

  const paginatedResults = results.slice((page - 1) * pageSize, page * pageSize);

  const handleView = (id: number) => {
    const cols = selectedWeeklyCols.join(",");
    router.push(`/manager/analysis/${id}?from=queries&cols=${cols}`);
  };

  const formatCurrency = (val: number) =>
    val?.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
  <Navbar />
  <div className={styles.inner}>
        <h1 className={styles.heading}>🔍 Query Analyses</h1>

        <div className={styles.criteriaBox}>
          <h2>Search Criteria</h2>
          {filters.map((filter, index) => (
            <div key={index} className={styles.filterRow}>
              <select value={filter.field} onChange={e => handleFieldChange(index, e.target.value)}>
                {fieldOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <select value={filter.operator} onChange={e => handleOperatorChange(index, e.target.value)}>
                {operatorOptions[filter.field].map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>

              {filter.field === "created_at" && filter.operator === "Between" ? (
                <>
                  <input
                    type="date"
                    onChange={e => handleValueChange(index, `${e.target.value},${filter.value.split(",")[1] || ""}`)}
                  />
                  <input
                    type="date"
                    onChange={e => handleValueChange(index, `${filter.value.split(",")[0] || ""},${e.target.value}`)}
                  />
                </>
              ) : (
                <input
                  type={["principal", "ending_balance"].includes(filter.field) ? "number" : "text"}
                  value={filter.value}
                  onChange={e => handleValueChange(index, e.target.value)}
                />
              )}
              <button onClick={() => removeFilter(index)}>❌</button>
            </div>
          ))}
          <button onClick={addFilter}>+ Add Filter</button>
        </div>

        <div className={styles.actionRow}>
          <input type="text" value={queryName} onChange={e => setQueryName(e.target.value)} placeholder="Query Name" />
          <button onClick={runQuery}>Run Query</button>
          <button onClick={resetFilters}>Reset</button>
          <button onClick={saveCurrentQuery}>💾 Save</button>
          {results.length > 0 && (
            <>
              <button onClick={exportCSV}>⬇ Export CSV</button>
              <button onClick={exportPDF}>⬇ Export PDF</button>
            </>
          )}
        </div>

        {savedQueries.length > 0 && (
  <div style={{ margin: "1.5rem 0" }}>
    <label><strong>🔖 Load Saved Query: </strong></label>
    <select
      value={activeSavedIndex ?? ""}
      onChange={(e) => loadSavedQuery(Number(e.target.value))}
      style={{ marginLeft: "10px", padding: "5px" }}
    >
      <option value="" disabled>Select a saved query</option>
      {savedQueries.map((q, i) => (
        <option key={i} value={i}>
          {q.name || `Query ${i + 1}`}
        </option>
      ))}
    </select>
  </div>
)}


<section className={styles.boxSection}>
  <h3>Select Main Table Columns</h3>
  <div className={styles.checkboxGroup}>
    {COLUMNS.map((col) => (
      <label key={col.key}>
        <input
          type="checkbox"
          checked={selectedMainCols.includes(col.key)}
          onChange={() => toggleColumn(col.key, "main")}
        />
        {col.label}
      </label>
    ))}
  </div>
</section>

<section className={styles.boxSection}>
  <h3>Select Weekly Breakdown Columns</h3>
  <div className={styles.checkboxGroup}>
    {WEEKLY_RESULT_COLUMNS.map((col) => (
      <label key={col.key}>
        <input
          type="checkbox"
          checked={selectedWeeklyCols.includes(col.key)}
          onChange={() => toggleColumn(col.key, "weekly")}
        />
        {col.label}
      </label>
    ))}
  </div>
</section>


        {error && <p className={styles.error}>{error}</p>}

        {paginatedResults.length > 0 ? (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  {COLUMNS.filter(c => selectedMainCols.includes(c.key)).map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((r: any, idx: number) => (
                  <tr key={idx}>
                    {COLUMNS.filter(c => selectedMainCols.includes(c.key)).map(col => (
                      <td key={col.key}>
                        {col.key === "generated_at"
                          ? toLocalDateTime(r[col.key])
                          : typeof r[col.key] === "number"
                          ? formatCurrency(r[col.key])
                          : r[col.key]}
                      </td>
                    ))}
                    <td>
                      <button onClick={() => handleView(r.id)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>Page {page}</span>
              <button disabled={page * pageSize >= results.length} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </>
        ) : (
          <p className={styles.noResults}>No results to show.</p>
        )}
      </div>
    </div>
  );
}
