"use client";
import dynamic from "next/dynamic";
import { getUsernameFromToken } from "@/utils/auth"; 
import { toLocalDateTime } from "@/utils/date";

const ResultsPage = dynamic(() => import("./components/ResultsPage.client"), {
  ssr: false,
});

export default function ResultsPageWrapper() {
  return <ResultsPage />;
}
