"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toSlug } from "@/utils/stringUtils";

export default function StateComparisons() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStates() {
      try {
        setLoading(true);
        // Fetch the list of available states from the API
        const response = await fetch("/api/comparison-states");

        if (!response.ok) {
          throw new Error("Failed to fetch available states");
        }

        const data = await response.json();
        setStates(data.states);
        setLoading(false);
      } catch (err) {
        console.error("Error loading states:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchStates();
  }, []);

  return (
    <div className="p-6 max-w-full bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-mtn-green-800 mb-6">
        State Comparisons
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mt-4 border-t-4 border-t-mtn-green-800">
        <h2 className="text-2xl font-semibold text-mtn-green-800 inline-block">
          Select a State
        </h2>
        <p className="text-slate-800 mt-4 font-poppins">
          Select a state to view its agricultural production data and compare
          crop patterns across regions.
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-600">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-4">
            {states.map((state) => {
              // Format state name with proper capitalization (e.g., "BIHAR" to "Bihar")
              const formattedState = state
                .toLowerCase()
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

              return (
                <Link
                  key={state}
                  href={`/state-comparisons/${toSlug(state)}`}
                  className="block bg-white shadow-md rounded-lg border-t-2 bg-green-50 border-t-mtn-green-800 hover:bg-green-200 transition duration-150"
                >
                  <div className="flex items-center justify-center h-20 p-2">
                    <span className="text-mtn-green-800 font-medium text-center">
                      {formattedState}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6 border-t-4 border-t-mtn-green-800">
        <h2 className="text-2xl font-semibold text-mtn-green-800 pb-2 mb-4 inline-block">
          About State Comparisons
        </h2>
        <p className="text-slate-800 mb-4 font-poppins">
          State comparison data is sourced from the Ministry of Agriculture &
          Farmers Welfare of India. The visualizations show how agricultural
          production flows from states through seasons and crops to districts.
        </p>
        <p className="text-slate-800 font-poppins">
          Select a state from the options above to explore detailed agricultural
          flow data using interactive Sankey diagrams that help identify
          patterns in crop cultivation.
        </p>
      </div>
    </div>
  );
}
