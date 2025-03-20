"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ComparisonMetricsDisplay from "@/components/comparison/ComparisonMetricsDisplay";
import ComparisonSankeyDiagram from "@/components/comparison/ComparisonSankeyDiagram";
import { formatStateNameFromSlug } from "@/utils/stringUtils";

export default function StateComparisonPage() {
  const pathname = usePathname();
  const stateSlug = pathname.split("/").pop();
  const stateName = formatStateNameFromSlug(stateSlug);

  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchComparisonData() {
      try {
        setLoading(true);
        // Fetch the data for the selected state from the API
        const response = await fetch(`/api/comparison-data?state=${stateName}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch comparison data for ${stateName}`);
        }

        const responseData = await response.json();
        setData(responseData.data);
        setMetrics(responseData.metrics);
        setLoading(false);
      } catch (err) {
        console.error("Error loading comparison data:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchComparisonData();
  }, [stateName]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="border-b border-gray-200 bg-white">
          <div className="px-4 py-4">
            <div className="flex items-center">
              <Link
                href="/state-comparisons"
                className="text-green-600 hover:text-green-800 mr-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-xl font-semibold text-gray-800">
                {stateName} Agricultural Production Data
              </h1>
            </div>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
              {error}
            </div>
          ) : (
            <>
              {/* Metrics Display */}
              <ComparisonMetricsDisplay metrics={metrics} />

              {/* Sankey Diagram or Empty State */}
              {data && data.state_name && data.state_name.length > 0 ? (
                <ComparisonSankeyDiagram data={data} />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-md text-center">
                  <h3 className="text-xl font-medium text-yellow-800 mb-2">
                    No Data Available
                  </h3>
                  <p className="text-yellow-700">
                    There is no agricultural data available for {stateName} in
                    our records.
                  </p>
                  <Link
                    href="/state-comparisons"
                    className="inline-block mt-4 px-4 py-2 bg-mtn-green-800 text-white rounded-md hover:bg-mtn-green-700"
                  >
                    Back to State Comparisons
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
