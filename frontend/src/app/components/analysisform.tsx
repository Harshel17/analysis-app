"use client";
import React, { useState } from "react";
import BASE_URL from "../utils/config"; // or correct relative path



export default function AnalysisForm() {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
    
        console.log("Submitting form data:", formData);  // ✅ Debugging log
    
        try {
            const response = await fetch(`${BASE_URL}/analysis/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    description: formData.description,
                    principal: Number(formData.principal), 
                    interest_week: Number(formData.interest_week), 
                    projection_period: Number(formData.projection_period), 
                    tax_rate: Number(formData.tax_rate), 
                    additional_deposit: Number(formData.additional_deposit), 
                    deposit_frequency: Number(formData.deposit_frequency), 
                    regular_withdrawal: Number(formData.regular_withdrawal), 
                    withdrawal_frequency: Number(formData.withdrawal_frequency)
                }),
            });
    
            console.log("Response status:", response.status);  // ✅ Debugging log
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to submit analysis:", errorText);
                throw new Error("Failed to submit analysis: " + errorText);
            }
    
            const data = await response.json();
            console.log("Success:", data);
    
            // ✅ Clear form after successful submission
            setFormData({
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
    
            alert("Analysis submitted successfully!");
        } catch (error) {
            console.error("Error:", error);
            alert("Error submitting analysis. Please try again.");
        }
    };
    
    
    

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
                Create New Analysis
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black"
                />
                <input
                    type="number"
                    name="principal"
                    placeholder="Principal"
                    value={formData.principal}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black"
                />
                <input
                    type="number"
                    name="interest_week"
                    placeholder="Interest per Week"
                    value={formData.interest_week}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black"
                />
                <input
                    type="number"
                    name="projection_period"
                    placeholder="Projection Period (Weeks)"
                    value={formData.projection_period}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black"
                />
                <input
                    type="number"
                    name="tax_rate"
                    placeholder="Tax Rate (%)"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black"
                />
                <input
                    type="number"
                    name="additional_deposit"
                    placeholder="Additional Deposit"
                    value={formData.additional_deposit}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black"
                />
                <input
                    type="number"
                    name="deposit_frequency"
                    placeholder="Deposit Frequency (Weeks)"
                    value={formData.deposit_frequency}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black "
                />
                <input
                    type="number"
                    name="regular_withdrawal"
                    placeholder="Regular Withdrawal"
                    value={formData.regular_withdrawal}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black"
                />
                <input
                    type="number"
                    name="withdrawal_frequency"
                    placeholder="Withdrawal Frequency (Weeks)"
                    value={formData.withdrawal_frequency}
                    onChange={handleChange}
                    className="w-full p-2 border rounded text-black"
                />
                <button
                    type="submit"
                    className="w-full p-2 bg-blue-500 text-white rounded text-black"
                >
                    Submit
                </button>
            </form>
        </div>
    );
}
