"use client";
import dynamic from "next/dynamic";
import { getUsernameFromToken } from "@/utils/auth"; 

const ResultsPage = dynamic(() => import("./components/ResultsPage.client"), {
  ssr: false,
});

export default function ResultsPageWrapper() {
  return <ResultsPage />;
}
