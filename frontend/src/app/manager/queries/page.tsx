"use client";

import { useState } from "react";
import Navbar from "@/app/components/navbar";
import axios from "axios";
import config from "@/utils/config";
import styles from "./Queries.module.css";
import { toLocalDateTime } from "@/utils/date"; // ✅ Make sure this exists

export default function QueriesPage() {
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

  const handleChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      username: "",
      description_contains:"",
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
  
      // Fix here: limit to keys of `filters`
      (Object.keys(filters) as (keyof typeof filters)[]).forEach((key) => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
  
      const res = await axios.get(`${config}/queries/analyses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setResults(res.data);
      setError("");
    } catch (err) {
      console.error("Query failed", err);
      setError("⚠️ Failed to run query.");
    }
  };
  

  const formatCurrency = (val: number) =>
    val?.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.inner}>
        <h1 className={styles.heading}>🔍 Query Analyses</h1>

        {/* Filter Inputs */}
        <div className={styles.filters}>
          <input
            type="text"
            name="username"
            value={filters.username}
            onChange={handleChange}
            placeholder="Username"
          />
          <input
  type="text"
  name="description_contains"
  value={filters.description_contains}
  onChange={handleChange}
  placeholder="Description Contains"
/>

          <input
            type="number"
            name="principal_gt"
            value={filters.principal_gt}
            onChange={handleChange}
            placeholder="Principal >"
          />
          <input
            type="number"
            name="principal_lt"
            value={filters.principal_lt}
            onChange={handleChange}
            placeholder="Principal <"
          />
          <input
            type="number"
            name="ending_balance_gt"
            value={filters.ending_balance_gt}
            onChange={handleChange}
            placeholder="Balance >"
          />
          <input
            type="number"
            name="ending_balance_lt"
            value={filters.ending_balance_lt}
            onChange={handleChange}
            placeholder="Balance <"
          />
          <input
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleChange}
          />
          <input
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleChange}
          />
          <button onClick={runQuery}>Run Query</button>
          <button onClick={resetFilters} className={styles.resetBtn}>
            Reset Filters
          </button>
        </div>

        {/* Results */}
        {error && <p className={styles.error}>{error}</p>}

        {results.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Description</th>
                <th>Principal</th>
                <th>Ending Balance</th>
                <th>Generated At</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r: any, idx: number) => (
                <tr key={idx}>
                  <td>{r.id}</td>
                  <td>{r.username}</td>
                  <td>{r.description}</td>
                  <td>{formatCurrency(r.principal)}</td>
                  <td>{formatCurrency(r.ending_balance)}</td>
                  <td>{toLocalDateTime(r.generated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.noResults}>No results to show.</p>
        )}
      </div>
    </div>
  );
}
