import { NextResponse } from "next/server";
import Papa from "papaparse";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

// In-memory cache for state names
let stateNamesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

/**
 * API endpoint to retrieve available states from the country data CSV
 */
export async function GET() {
  try {
    console.log("Fetching available states...");

    // Check if we have a valid cache
    const now = Date.now();
    if (
      stateNamesCache &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_DURATION
    ) {
      console.log(
        "Returning cached state names, cache age:",
        Math.round((now - cacheTimestamp) / 1000),
        "seconds",
      );
      return NextResponse.json({
        states: stateNamesCache,
        source: "cache",
      });
    }

    // Path to the country data CSV based on your project structure
    const filePath = path.join(
      process.cwd(),
      "src",
      "data",
      "state-comparison",
      "country_crop_calender_MoAFWofIndia.csv",
    );

    console.log(`Trying to read file from: ${filePath}`);

    let csvContent;
    try {
      csvContent = await fs.readFile(filePath, "utf-8");
      console.log(`Successfully read file from: ${filePath}`);
    } catch (err) {
      console.error(`Error reading file: ${err.message}`);

      // Check if we have a stale cache we can fall back to
      if (stateNamesCache) {
        console.log("Returning stale cache as fallback");
        return NextResponse.json({
          states: stateNamesCache,
          source: "stale cache (file read error)",
        });
      }

      // Fallback to hardcoded states if file can't be read
      return NextResponse.json({
        states: ["BIHAR", "JHARKHAND", "ODISHA"],
        source: "hardcoded (CSV file not found)",
      });
    }

    console.log("Parsing CSV content...");

    // Parse the CSV to get state names
    const parseResult = await new Promise((resolve) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: (error) => {
          console.error("Error parsing CSV:", error);
          resolve({ data: [] });
        },
      });
    });

    console.log(`Found ${parseResult.data.length} rows in CSV`);

    // Check if we have the state_name column
    const sampleRow = parseResult.data[0] || {};
    let stateColumn = "state_name";

    if (!sampleRow.hasOwnProperty(stateColumn)) {
      // Try with capitalized column name
      if (sampleRow.hasOwnProperty("STATE_NAME")) {
        console.log("Found STATE_NAME column instead of state_name");
        stateColumn = "STATE_NAME";
      } else {
        // Look for any column that might contain state
        const possibleStateColumns = Object.keys(sampleRow).filter((key) =>
          key.toLowerCase().includes("state"),
        );

        if (possibleStateColumns.length > 0) {
          stateColumn = possibleStateColumns[0];
          console.log(`Using ${stateColumn} as state column`);
        } else if (stateNamesCache) {
          // Fall back to cache if we can't find a state column
          console.log("Could not find state column. Falling back to cache.");
          return NextResponse.json({
            states: stateNamesCache,
            source: "stale cache (no state column found)",
          });
        } else {
          console.error(
            "Could not find state column. Available columns:",
            Object.keys(sampleRow),
          );
          return NextResponse.json({
            states: ["BIHAR", "JHARKHAND", "ODISHA"],
            source: "hardcoded (state_name column not found in CSV)",
          });
        }
      }
    }

    // Extract unique state names
    const stateNames = [
      ...new Set(
        parseResult.data
          .map((row) => row[stateColumn])
          .filter(Boolean)
          .map((name) => name.toString().trim()),
      ),
    ].sort();

    console.log(`Found ${stateNames.length} unique states`);

    // Update the cache
    stateNamesCache = stateNames;
    cacheTimestamp = now;

    // Return the list of states
    return NextResponse.json({
      states: stateNames,
      source: filePath,
    });
  } catch (error) {
    console.error("Error fetching available states:", error);

    // Check if we have a cache we can fall back to
    if (stateNamesCache) {
      console.log("Error occurred, falling back to cache");
      return NextResponse.json({
        states: stateNamesCache,
        source: "stale cache (error fallback)",
        error: error.message,
      });
    }

    // Fallback to hardcoded states in case of any error
    return NextResponse.json({
      states: ["BIHAR", "JHARKHAND", "ODISHA"],
      source: "hardcoded (error occurred)",
      error: error.message,
    });
  }
}

/**
 * Handler for clearing the cache via API
 */
export async function POST() {
  // Clear the cache
  stateNamesCache = null;
  cacheTimestamp = null;

  // Revalidate the state comparisons page
  revalidatePath("/state-comparisons");

  return NextResponse.json({
    success: true,
    message: "State names cache cleared successfully",
  });
}
