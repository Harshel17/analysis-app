"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from './result.module.css';
import config from '@/utils/config';

 // or correct relative path


export default function ResultsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const analysisId = searchParams.get("id");

    const [results, setResults] = useState([]);
    const [analysisData, setAnalysisData] = useState<any>(null);

    const [error, setError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [updatedParameters, setUpdatedParameters] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isMovingToPermanent, setIsMovingToPermanent] = useState(false);

    useEffect(() => {
        if (analysisId) {
            fetchResults(analysisId);
        }
    }, [analysisId]);

    const fetchResults = async (id: string) => {

        if (!id) return;
        try {
            setError(null);

            const analysisResponse = await fetch(`${config}/api/analysis/${id}`);
            if (!analysisResponse.ok) throw new Error("Failed to fetch analysis details");
            const analysisData = await analysisResponse.json();
            setAnalysisData(analysisData);
            setUpdatedParameters({ ...analysisData });

            const resultsResponse = await fetch(`${config}/api/results/${id}`);
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
    
            const response = await fetch(`${config}/api/update-analysis/${analysisId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedParameters),
            });

            if (!response.ok) throw new Error("Failed to update parameters");
    
            const data = await response.json(); // ✅ Add this line
    
            console.log("Move to permanent response:", data);
    
            setAnalysisData(updatedParameters);
            setIsEditing(false);
    
            const updatedResults = await fetch(`${config}/api/results/${analysisId}`);
            if (!updatedResults.ok) throw new Error("Failed to fetch updated results");
    
            const refreshed = await updatedResults.json();
            setResults(refreshed);
            alert("✅ Updates saved successfully!");
        } catch (error) {
            const err = error as Error;
            console.error("error updating data:", err);
            setError(err.message);
        }
        setIsSaving(false);
    };
    
    const handleMoveToPermanent = async () => {
        setIsMovingToPermanent(true);
        try {
            const response = await fetch(`${config}/api/move-to-permanent/${analysisId}`, {
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
                        <p><strong>Description:</strong> {analysisData.description}</p>
                        <p><strong>Principal:</strong> ${analysisData.principal.toFixed(2)}</p>
                        <p><strong>Projection Period:</strong> {analysisData.projection_period} weeks</p>
                        <p><strong>Additional Deposit:</strong> 
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={updatedParameters.additional_deposit}
                                    onChange={(e) => setUpdatedParameters(prev => ({
                                        ...prev,
                                        additional_deposit: parseFloat(e.target.value) || 0
                                    }))}
                                    className={styles.editInput}
                                />
                            ) : (
                                `$${analysisData.additional_deposit.toFixed(2)}`
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
                                    <td>${result.beginning_balance.toFixed(2)}</td>
                                    <td>${result.additional_deposit.toFixed(2)}</td>
                                    <td>${result.interest.toFixed(2)}</td>
                                    <td>${result.profit.toFixed(2)}</td>
                                    <td>${result.withdrawal.toFixed(2)}</td>
                                    <td>${result.ending_balance.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
