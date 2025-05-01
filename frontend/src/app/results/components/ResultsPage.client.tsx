"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from '../result.module.css'; // adjust if needed
import config from '@/utils/config';
import { getUsernameFromToken } from '@/utils/auth';
import Navbar from "@/app/components/navbar";
import { toLocalDateTime } from "@/utils/date";

type Analysis = {
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
};

type ResultRow = {
  week: number;
  beginning_balance: number;
  additional_deposit: number;
  interest: number;
  profit: number;
  withdrawal: number;
  ending_balance: number;
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const analysisId = searchParams.get("id");

  const [results, setResults] = useState<ResultRow[]>([]);
  const [analysisData, setAnalysisData] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedParameters, setUpdatedParameters] = useState<Partial<Analysis>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isMovingToPermanent, setIsMovingToPermanent] = useState(false);

  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const name = getUsernameFromToken();
    if (name) setUsername(name);
  }, []);

  useEffect(() => {
    if (analysisId) {
      fetchResults(analysisId);
    }
  }, [analysisId]);

  const formatCurrency = (value: number | undefined): string => {
    if (typeof value !== "number") return "$0.00";
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  const fetchResults = async (id: string) => {
    try {
      setError(null);
      const analysisResponse = await fetch(`${config}/analysis/${id}`);
      if (!analysisResponse.ok) throw new Error("Failed to fetch analysis details");
      const analysisData = await analysisResponse.json();
      setAnalysisData(analysisData);
      setUpdatedParameters({ ...analysisData });

      const resultsResponse = await fetch(`${config}/results/${id}`);
      if (!resultsResponse.ok) throw new Error("Failed to fetch results");
      const resultsData = await resultsResponse.json();
      setResults(resultsData);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error fetching data:", err);
      setError(err.message);
    }
  };

  const handleSaveUpdates = async () => {
    setIsSaving(true);
    try {
      setError(null);

      const response = await fetch(`${config}/update-analysis/${analysisId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedParameters),
      });

      if (!response.ok) throw new Error("Failed to update parameters");

      const data = await response.json();
      setAnalysisData(data);
      setIsEditing(false);

      const updatedResults = await fetch(`${config}/results/${analysisId}`);
      if (!updatedResults.ok) throw new Error("Failed to fetch updated results");

      const refreshed = await updatedResults.json();
      setResults(refreshed);
      alert("✅ Updates saved successfully!");
    } catch (error) {
      console.error("Error updating data:", error);
      setError("Failed to save updates.");
    }
    setIsSaving(false);
  };

  const handleMoveToPermanent = async () => {
    setIsMovingToPermanent(true);
    try {
      const response = await fetch(`${config}/move-to-permanent/${analysisId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to move analysis to permanent table");

      await response.json();
      alert("✅ Successfully moved to permanent table!");
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error fetching data:", err);
      setError(err.message);
    }
    setIsMovingToPermanent(false);
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <h2 className={styles.title}>Analysis Results</h2>

      {error && (
        <div className={styles.errorBox}>
          ❌ {error}
        </div>
      )}



      {analysisData && (
        <div className={styles.parametersBox}>
          <h3 className={styles.parametersHeader}>
            🔹 Analysis Parameters
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={styles.editButton}
            >
              {isEditing ? "Cancel Edit" : "Edit"}
            </button>
          </h3>

          <div className={styles.parametersGrid}>
  <p><strong>Analysis ID:</strong> {analysisId}</p>

  <p><strong>Description:</strong>
    {isEditing ? (
      <input
        type="text"
        value={updatedParameters.description}
        onChange={(e) => setUpdatedParameters(prev => ({
          ...prev,
          description: e.target.value
        }))}
        className={styles.editInput}
      />
    ) : (
      analysisData.description
    )}
  </p>

  <p><strong>Principal:</strong>
    {isEditing ? (
      <input
        type="number"
        value={updatedParameters.principal}
        onChange={(e) => setUpdatedParameters(prev => ({
          ...prev,
          principal: parseFloat(e.target.value) || 0
        }))}
        className={styles.editInput}
      />
    ) : (
      analysisData?.principal?.toFixed(2) || "Loading..."
    )}
  </p>

  <p><strong>Projection Period:</strong>
    {isEditing ? (
      <input
        type="number"
        value={updatedParameters.projection_period}
        onChange={(e) => setUpdatedParameters(prev => ({
          ...prev,
          projection_period: parseInt(e.target.value) || 1
        }))}
        className={styles.editInput}
      />
    ) : (
      `${analysisData.projection_period} weeks`
    )}
  </p>

  <p><strong>Tax Rate:</strong>
    {isEditing ? (
      <input
        type="number"
        value={updatedParameters.tax_rate}
        onChange={(e) => setUpdatedParameters(prev => ({
          ...prev,
          tax_rate: parseFloat(e.target.value) || 0
        }))}
        className={styles.editInput}
      />
    ) : (
      analysisData?.tax_rate?.toFixed(2) + "%" || "Loading..."
    )}
  </p>

  <p>
  <strong>Additional Deposit:</strong>
  {isEditing ? (
    <input
      type="number"
      value={updatedParameters.additional_deposit ?? ""}
      onChange={(e) =>
        setUpdatedParameters((prev) => ({
          ...prev,
          additional_deposit: parseFloat(e.target.value) || 0,
        }))
      }
      className={styles.editInput}
    />
  ) : (
    analysisData?.additional_deposit !== undefined
      ? `$${analysisData.additional_deposit.toFixed(2)}`
      : "Loading..."
  )}
</p>


  <p><strong>Interest Per Week:</strong>
    {isEditing ? (
      <input
        type="number"
        value={updatedParameters.interest_week}
        onChange={(e) => setUpdatedParameters(prev => ({
          ...prev,
          interest_week: parseFloat(e.target.value) || 0
        }))}
        className={styles.editInput}
      />
    ) : (
      `${analysisData.interest_week.toFixed(2)}%`
    )}
  </p>

  <p><strong>Deposit Frequency (weeks):</strong>
    {isEditing ? (
      <input
        type="number"
        value={updatedParameters.deposit_frequency}
        onChange={(e) => setUpdatedParameters(prev => ({
          ...prev,
          deposit_frequency: parseInt(e.target.value) || 1
        }))}
        className={styles.editInput}
      />
    ) : (
      `${analysisData.deposit_frequency}`
    )}
  </p>

  <p><strong>Regular Withdrawal:</strong>
    {isEditing ? (
      <input
        type="number"
        value={updatedParameters.regular_withdrawal}
        onChange={(e) => setUpdatedParameters(prev => ({
          ...prev,
          regular_withdrawal: parseFloat(e.target.value) || 0
        }))}
        className={styles.editInput}
      />
    ) : (
      `$${analysisData.regular_withdrawal.toFixed(2)}`
    )}
  </p>

  <p><strong>Withdrawal Frequency (weeks):</strong>
    {isEditing ? (
      <input
        type="number"
        value={updatedParameters.withdrawal_frequency}
        onChange={(e) => setUpdatedParameters(prev => ({
          ...prev,
          withdrawal_frequency: parseInt(e.target.value) || 1
        }))}
        className={styles.editInput}
      />
    ) : (
      `${analysisData.withdrawal_frequency}`
    )}
  </p>
</div>
<div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#4B5563" }}>
<p><strong>Created:</strong> {toLocalDateTime(analysisData?.created_at)}</p>


            <p><strong>Updated:</strong> {analysisData.updated_at ? toLocalDateTime(analysisData.updated_at) : "-"}</p>
          </div>

          {isEditing && (
            <button
              onClick={handleSaveUpdates}
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.actions}>
          <button
            onClick={handleMoveToPermanent}
            className={styles.permanentButton}
            disabled={isMovingToPermanent}
          >
            {isMovingToPermanent ? "Saving..." : "Save to Permanent Table"}
          </button>

          <button
            onClick={() => router.push("/saved")}
            className={styles.viewSavedButton}
          >
            View Saved Tables
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.tableContainer}>
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
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{result.week}</td>
                  <td className={styles.right}>{formatCurrency(result.beginning_balance)}</td>
                  <td className={styles.right}>{formatCurrency(result.additional_deposit)}</td>
                  <td className={styles.right}>{formatCurrency(result.interest)}</td>
                  <td className={styles.right}>{formatCurrency(result.profit)}</td>
                  <td className={styles.right}>{formatCurrency(result.withdrawal)}</td>
                  <td className={styles.right}>{formatCurrency(result.ending_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ✅ Return to Previous Page Button */}
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
