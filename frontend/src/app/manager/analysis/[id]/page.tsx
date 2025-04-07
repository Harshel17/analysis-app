"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import config from "@/utils/config";
import Navbar from "@/app/components/navbar";

interface ResultRow {
  week: number;
  beginning_balance: number;
  additional_deposit: number;
  interest: number;
  profit: number;
  withdrawal: number;
  ending_balance: number;
}

interface AnalysisMetadata {
  id: number;
  description: string;
  principal: number;
  interest_week: number;
  projection_period: number;
  deposit_frequency: number;
  withdrawal_frequency: number;
}

export default function ManagerAnalysisDetails() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<ResultRow[]>([]);
  const [meta, setMeta] = useState<AnalysisMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        const [resultsRes, metaRes] = await Promise.all([
          axios.get(`${config}/analysis/permanent-results/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${config}/analysis/analysis/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setData(resultsRes.data);
        setMeta(metaRes.data);
      } catch (err) {
        setError("⚠️ Unable to fetch analysis data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const format = (val: number) =>
    val.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const handleExport = () => {
    const csvRows = [
      ["Week", "Begin", "Deposit", "Interest", "Profit", "Withdrawal", "Ending"],
      ...data.map((row) => [
        row.week,
        format(row.beginning_balance),
        format(row.additional_deposit),
        format(row.interest),
        format(row.profit),
        format(row.withdrawal),
        format(row.ending_balance),
      ]),
    ];

    const csv = csvRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis_${id}_results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 p-4">
      <Navbar />
      <div className="max-w-6xl mx-auto mt-8 px-4">
        <button
          onClick={() => router.push("/manager")}
          className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded shadow"
        >
          ← Return to Dashboard
        </button>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">📊 Analysis Details</h1>

        {loading ? (
          <p className="text-blue-600 text-lg font-medium animate-pulse">⏳ Loading...</p>
        ) : error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : (
          <>
            {meta && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">📌 Parameters</h2>
                <table className="w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-200 text-left">
                    <tr>
                      <th className="p-2 w-1/3">Field</th>
                      <th className="p-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="p-2 font-semibold">Analysis ID</td><td className="p-2">{meta.id}</td></tr>
                    <tr><td className="p-2 font-semibold">Description</td><td className="p-2">{meta.description}</td></tr>
                    <tr><td className="p-2 font-semibold">Principal</td><td className="p-2 text-green-700">{format(meta.principal)}</td></tr>
                    <tr><td className="p-2 font-semibold">Interest (weekly)</td><td className="p-2">{meta.interest_week}%</td></tr>
                    <tr><td className="p-2 font-semibold">Projection Period</td><td className="p-2">{meta.projection_period} weeks</td></tr>
                    <tr><td className="p-2 font-semibold">Deposit Frequency</td><td className="p-2">Every {meta.deposit_frequency} weeks</td></tr>
                    <tr><td className="p-2 font-semibold">Withdrawal Frequency</td><td className="p-2">Every {meta.withdrawal_frequency} weeks</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">📈 Weekly Breakdown</h2>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded shadow"
              >
                ⬇ Export CSV
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-300 bg-white shadow-lg mt-6">
            <table className="w-full table-auto text-center border-separate border-spacing-x-8 border-spacing-y-3">

    <thead className="bg-primary text-white uppercase tracking-wide">
      <tr>
        <th className="px-6 py-4">Week</th>
        <th className="px-6 py-4">Beginning Balance</th>
        <th className="px-6 py-4">Additional Deposit</th>
        <th className="px-6 py-4">Interest</th>
        <th className="px-6 py-4">Profit</th>
        <th className="px-6 py-4">Withdrawal</th>
        <th className="px-6 py-4">Ending Balance</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row, index) => (
        <tr
          key={index}
          className={`${
            index % 2 === 0 ? "bg-white" : "bg-blue-50"
          } hover:bg-blue-100 transition-colors duration-200`}
        >
          <td className="px-6 py-3 pr-10 text-gray-800">{row.week}</td>
          <td className="px-6 py-3 pr-10 text-green-700">{format(row.beginning_balance)}</td>
          <td className="px-6 py-3 pr-10 text-blue-700">{format(row.additional_deposit)}</td>
          <td className="px-6 py-3 pr-10 text-emerald-600">{format(row.interest)}</td>
          <td className="px-6 py-3 pr-10 text-emerald-600">{format(row.profit)}</td>
          <td className="px-6 py-3 pr-10 text-red-600">{format(row.withdrawal)}</td>
          <td className="px-6 py-3 pr-10 text-purple-700 font-semibold">{format(row.ending_balance)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


          </>
        )}
      </div>
    </div>
  );
}
