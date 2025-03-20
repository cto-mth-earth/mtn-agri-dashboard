"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  parseCSV,
  calculateMetrics,
  formatStateNameForFile,
} from "@/utils/cropCalendarUtils";
import SankeyDiagram from "@/components/crop-calendar/SankeyDiagram";
import MetricsDisplay from "@/components/crop-calendar/MetricsDisplay";

export default function StateCropCalendar() {
  const pathname = usePathname();
  const stateName = pathname
    .split("/")
    .pop()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Convert state name to the format used in the CSV files
        const stateFormatted = formatStateNameForFile(stateName);
        const response = await fetch(
          `/api/crop-calendar?state=${stateFormatted}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${stateName}`);
        }

        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        setData(parsedData);

        // Calculate metrics from the parsed data
        const calculatedMetrics = calculateMetrics(parsedData);
        setMetrics(calculatedMetrics);

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchData();
  }, [stateName]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left sidebar would go here if needed to match your layout */}

      <div className="flex-1">
        <div className="border-b border-gray-200 bg-white">
          <div className="px-4 py-4">
            <div className="flex items-center">
              <Link
                href="/crop-calendar"
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
                {stateName} Agricultural Flow
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
              {/* Metrics Display Component */}
              <MetricsDisplay metrics={metrics} />

              {/* Sankey Diagram Component */}
              {data && <SankeyDiagram data={data} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
