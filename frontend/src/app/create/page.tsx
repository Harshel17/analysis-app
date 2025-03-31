"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./create.module.css";
import config from '@/utils/config';


 // or correct relative path



export default function CreateAnalysis() {
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        description: "",
        principal: "",
        interest_week: "",
        projection_period: "",
        tax_rate: "",
        additional_deposit: "",
        deposit_frequency: "",
        regular_withdrawal: "",
        withdrawal_frequency: "",
    });

    const [newAnalysisId, setNewAnalysisId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
    
        // ✅ Define formattedData inside the function
        const formattedData = {
            description: formData.description || "Untitled Analysis",
            principal: parseFloat(formData.principal) || 0,
            interest_week: parseFloat(formData.interest_week) || 0,
            additional_deposit: parseFloat(formData.additional_deposit) || 0,
            deposit_frequency: parseInt(formData.deposit_frequency) || 1,
            regular_withdrawal: parseFloat(formData.regular_withdrawal) || 0,
            withdrawal_frequency: parseInt(formData.withdrawal_frequency) || 1,
            projection_period: parseInt(formData.projection_period) || 1,
            tax_rate: parseFloat(formData.tax_rate) || 0,
        };
    
        console.log("➡️ Sending to:", `${config}/api/analysis/`);
        console.log("➡️ Payload:", formattedData); // ✅ Debugging Log
    
        try {
            const response = await fetch(`${config}/api/analysis/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });
    
            const data = await response.json();
            console.log("API Response:", data);
    
            if (!response.ok || !data.id) {
                throw new Error("Failed to retrieve analysis ID");
            }
    
            setNewAnalysisId(data.id);  // ✅ Correctly store the ID
    
            // ✅ Redirect to results page
            setTimeout(() => {
                router.push(`/results?id=${data.id}`);
            }, 2000);
    
        } catch (error) {
            if (error instanceof Error) {
              console.error("Error:", error.message);
              setError(error.message);
            } else {
              console.error("Unknown error:", error);
              setError("Something went wrong.");
            }
          };
          
     };
    
    
 
    return (
        <div className={styles.container}>
  <h2 className={styles.title}>Create New Analysis</h2>

  {newAnalysisId !== null && (
    <div className={styles.success}>
      ✅ Analysis Created! <br />
      <span>ID: <strong>{String(newAnalysisId)}</strong></span>
      <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Redirecting to results...</p>
    </div>
  )}

  {error && (
    <div className={styles.error}>
      ❌ {error}
    </div>
  )}

  <form onSubmit={handleSubmit} className={styles.form}>
    <input name="description" placeholder="Description" value={formData.description} onChange={handleChange} className={styles.input} required />
    <input name="principal" type="number" placeholder="Principal" value={formData.principal} onChange={handleChange} className={styles.input} required />
    <input name="interest_week" type="number" placeholder="Interest per Week (%)" value={formData.interest_week} onChange={handleChange} className={styles.input} required />
    <input name="projection_period" type="number" placeholder="Projection Period (Weeks)" value={formData.projection_period} onChange={handleChange} className={styles.input} required />
    <input name="tax_rate" type="number" placeholder="Tax Rate (%)" value={formData.tax_rate} onChange={handleChange} className={styles.input} />
    <input name="additional_deposit" type="number" placeholder="Additional Deposit" value={formData.additional_deposit} onChange={handleChange} className={styles.input} />
    <input name="deposit_frequency" type="number" placeholder="Deposit Frequency (Weeks)" value={formData.deposit_frequency} onChange={handleChange} className={styles.input} required />
    <input name="regular_withdrawal" type="number" placeholder="Regular Withdrawal" value={formData.regular_withdrawal} onChange={handleChange} className={styles.input} />
    <input name="withdrawal_frequency" type="number" placeholder="Withdrawal Frequency (Weeks)" value={formData.withdrawal_frequency} onChange={handleChange} className={styles.input} required />

    <button type="submit" className={styles.button} disabled={isLoading}>
      {isLoading ? "Processing..." : "Start Analysis"}
    </button>
  </form>
</div>

    );
}
