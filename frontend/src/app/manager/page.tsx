"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/app/components/navbar";
import config from "@/utils/config";
import { isManagerFromToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

interface AnalysisData {
  id: number;
  description: string;
  principal: number;
  ending_balance?: number | null;
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
  const [endingBalanceFilter, setEndingBalanceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

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

        const fetchedAnalyses = res.data;

        const withBalances = await Promise.all(
          fetchedAnalyses.map(async (a: AnalysisData) => {
            try {
              const balanceRes = await axios.get(
                `${config}/manager/ending-balance/${a.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return { ...a, ending_balance: balanceRes.data.ending_balance };
            } catch {
              return { ...a, ending_balance: null };
            }
          })
        );

        setAnalyses(withBalances);
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

    const endingBalanceMatch =
      endingBalanceFilter === "" ||
      (a.ending_balance ?? 0) <= parseFloat(endingBalanceFilter || "0");

    const dateMatch =
      dateFilter === "" ||
      new Date(a.created_at).toLocaleDateString() ===
        new Date(dateFilter).toLocaleDateString();

    return usernameMatch && principalMatch && endingBalanceMatch && dateMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-10 text-center">
          📊 Manager Dashboard
        </h1>

        {/* Filter Section */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="mr-2">🔎</span> Filter Analyses
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <input
              type="text"
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              placeholder="Filter by Username"
              className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="number"
              value={principalFilter}
              onChange={(e) => setPrincipalFilter(e.target.value)}
              placeholder="Principal < amount"
              className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="number"
              value={endingBalanceFilter}
              onChange={(e) => setEndingBalanceFilter(e.target.value)}
              placeholder="Ending Balance < amount"
              className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={() => {
                setUsernameFilter("");
                setPrincipalFilter("");
                setEndingBalanceFilter("");
                setDateFilter("");
              }}
              className="bg-gray-100 hover:bg-gray-200 border px-4 py-2 rounded-md text-sm text-gray-800 font-medium shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-blue-500 font-semibold">Fetching data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm md:text-base table-fixed border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase tracking-wide text-xs border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Principal</th>
                    <th className="px-4 py-3 text-left">Ending Balance</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  {filteredData.map((a, idx) => (
                    <tr
                      key={a.id}
                      className={`hover:bg-blue-50 transition duration-150 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">{a.id}</td>
                      <td className="px-4 py-3">{a.user?.username || "-"}</td>
                      <td className="px-4 py-3">{a.description}</td>
                      <td className="px-4 py-3 font-medium text-green-600">
                        {formatCurrency(a.principal)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-purple-700">
                        {formatCurrency(a.ending_balance)}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/manager/analysis/${a.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-lg shadow"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !error && (
              <p className="text-gray-600 mt-6 text-lg text-center">
                No analyses found matching your search.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
