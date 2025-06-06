"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/app/components/navbar";
import config from "@/utils/config";
import { isManagerFromToken } from "@/utils/auth";
import { useRouter } from "next/navigation";
import styles from "./ManagerDashboard.module.css";
import { toLocalDateTime } from "@/utils/date";

interface AnalysisData {
  id: number;
  description: string;
  principal: number;
  created_at: string;
  user: {
    username: string;
  };
}

export default function ManagerDashboard() {
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [usernameFilter, setUsernameFilter] = useState("");
  const [principalFilter, setPrincipalFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token || !isManagerFromToken()) {
        setError("⚠️ You are not authorized to view this page.");
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${config}/manager/all-analyses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAnalyses(res.data);
      } catch (err) {
        console.error("Error fetching manager data:", err);
        setError("❌ Failed to fetch analyses. Check console for details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number | null | undefined): string =>
    typeof value === "number"
      ? value.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      : "-";

  const filteredData = analyses.filter((a) => {
    const usernameMatch = a.user?.username
      .toLowerCase()
      .includes(usernameFilter.toLowerCase());

    const principalMatch =
      principalFilter === "" ||
      a.principal <= parseFloat(principalFilter || "0");

    const dateMatch =
      dateFilter === "" ||
      new Date(a.created_at).toLocaleDateString() ===
        new Date(dateFilter).toLocaleDateString();

    return usernameMatch && principalMatch && dateMatch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={styles.pageWrapper}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <Navbar />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <h1 className={styles.heading}>📊 Manager Dashboard</h1>

        <div className={styles.filterBox}>
          <h2 className={styles.filterTitle}>🔎 Filter Analyses</h2>
          <div className={styles.filters}>
            <input
              type="text"
              value={usernameFilter}
              onChange={(e) => {
                setUsernameFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by Username"
              className={styles.input}
            />
            <input
              type="number"
              value={principalFilter}
              onChange={(e) => {
                setPrincipalFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Principal < amount"
              className={styles.input}
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.input}
            />
            <button
              onClick={() => {
                setUsernameFilter("");
                setPrincipalFilter("");
                setDateFilter("");
                setCurrentPage(1);
              }}
              className={styles.button}
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className={styles.tableBox}>
          {loading ? (
            <p>Loading...</p>
          ) : paginatedData.length > 0 ? (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Description</th>
                      <th>Principal</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((a) => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{a.user?.username || "-"}</td>
                        <td>{a.description}</td>
                        <td>{formatCurrency(a.principal)}</td>
                        <td>{toLocalDateTime(a.created_at)}</td>
                        <td>
                          <button
                            className={styles.actionBtn}
                            onClick={() =>
                              router.push(`/manager/analysis/${a.id}`)
                            }
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "20px",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  ⬅ Prev
                </button>

                {Array.from({ length: totalPages }, (_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`${styles.pageBtn} ${
                        currentPage === pageNum ? styles.activePage : ""
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  Next ➡
                </button>
              </div>
            </>
          ) : (
            <p>No results found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
