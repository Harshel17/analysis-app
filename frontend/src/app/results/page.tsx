import dynamic from "next/dynamic";

const ResultsPage = dynamic(() => import("./components/ResultsPage.client"), {
  ssr: false,
});

export default function ResultsPageWrapper() {
  return <ResultsPage />;
}
