import { NextResponse } from "next/server";
import Papa from "papaparse";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

// In-memory cache for state data
const stateDataCache = new Map();
let cacheTimestamp = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

/**
 * API endpoint to fetch and process state comparison data
 */
export async function GET(request) {
  try {
    // Get the state parameter from the URL
    const { searchParams } = new URL(request.url);
    let state = searchParams.get("state");

    if (!state) {
      return NextResponse.json(
        { error: "State parameter is required" },
        { status: 400 },
      );
    }

    console.log(`Fetching comparison data for state: ${state}`);

    // Check if we have a valid cache for this state
    const now = Date.now();
    if (
      stateDataCache.has(state) &&
      cacheTimestamp &&
      now - cacheTimestamp < CACHE_DURATION
    ) {
      console.log(
        `Returning cached data for ${state}, cache age:`,
        Math.round((now - cacheTimestamp) / 1000),
        "seconds",
      );
      return NextResponse.json(stateDataCache.get(state));
    }

    // Path to the country data CSV based on your project structure
    const filePath = path.join(
      process.cwd(),
      "src",
      "data",
      "state-comparison",
      "country_crop_calender_MoAFWofIndia.csv",
    );

    console.log(`Reading CSV file from: ${filePath}`);

    // Read the CSV file
    let csvContent;
    try {
      csvContent = await fs.readFile(filePath, "utf-8");
      console.log(
        `Successfully read CSV file with size: ${csvContent.length} bytes`,
      );
    } catch (error) {
      console.error(`Error reading CSV file: ${error.message}`);
      return NextResponse.json(
        {
          error: `Error reading CSV file: ${error.message}`,
          data: createEmptyData(),
          metrics: createEmptyMetrics(),
        },
        { status: 500 },
      );
    }

    // Parse the CSV
    console.log("Parsing CSV content...");
    const parseResult = await new Promise((resolve) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: resolve,
        error: (error) => {
          console.error("Error parsing CSV:", error);
          resolve({ data: [] });
        },
      });
    });

    console.log(`CSV parsed, found ${parseResult.data.length} total rows`);

    if (parseResult.data.length === 0) {
      console.error("No data found in CSV");
      return NextResponse.json({
        error: "No data found in CSV",
        data: createEmptyData(),
        metrics: createEmptyMetrics(),
      });
    }

    // Identify state name column
    const sampleRow = parseResult.data[0];
    let stateColumn = "state_name";

    if (!sampleRow.hasOwnProperty(stateColumn)) {
      // Try with uppercase
      if (sampleRow.hasOwnProperty("STATE_NAME")) {
        stateColumn = "STATE_NAME";
        console.log("Using STATE_NAME column instead of state_name");
      } else {
        // Look for any column that might contain state
        const possibleStateColumns = Object.keys(sampleRow).filter((key) =>
          key.toLowerCase().includes("state"),
        );

        if (possibleStateColumns.length > 0) {
          stateColumn = possibleStateColumns[0];
          console.log(`Using ${stateColumn} as state column`);
        } else {
          console.error(
            "Could not find state column. Available columns:",
            Object.keys(sampleRow),
          );
          return NextResponse.json({
            error: "Could not find state column in CSV data",
            data: createEmptyData(),
            metrics: createEmptyMetrics(),
          });
        }
      }
    }

    // Handle state name format variations
    // If provided state is lowercase/titlecase but data has uppercase, convert to match
    const stateValues = [
      ...new Set(parseResult.data.map((row) => row[stateColumn])),
    ];
    console.log(
      `Found ${stateValues.length} unique state values:`,
      stateValues.slice(0, 5),
    );

    // Check if state exists in data, trying various formats
    let stateExists = false;
    let stateMatchingValue = state;

    // Check exact match
    if (stateValues.includes(state)) {
      stateExists = true;
    }
    // Check uppercase
    else if (stateValues.includes(state.toUpperCase())) {
      stateMatchingValue = state.toUpperCase();
      stateExists = true;
    }
    // Check lowercase
    else if (stateValues.includes(state.toLowerCase())) {
      stateMatchingValue = state.toLowerCase();
      stateExists = true;
    }
    // Check for state with spaces replaced by underscores
    else if (stateValues.includes(state.replace(/\s+/g, "_"))) {
      stateMatchingValue = state.replace(/\s+/g, "_");
      stateExists = true;
    }
    // Check for state with underscores replaced by spaces
    else if (stateValues.includes(state.replace(/_+/g, " "))) {
      stateMatchingValue = state.replace(/_+/g, " ");
      stateExists = true;
    }

    if (!stateExists) {
      console.error(
        `State "${state}" not found in data. Available states: ${stateValues.slice(0, 10).join(", ")}...`,
      );
      return NextResponse.json({
        error: `State "${state}" not found in data`,
        data: createEmptyData(),
        metrics: createEmptyMetrics(),
      });
    }

    console.log(`Filtering data for state: ${stateMatchingValue}`);

    // Filter data for the requested state
    const filteredData = parseResult.data.filter(
      (row) =>
        row[stateColumn] && row[stateColumn].toString() === stateMatchingValue,
    );

    console.log(
      `Found ${filteredData.length} rows for state ${stateMatchingValue}`,
    );

    if (filteredData.length === 0) {
      console.error(`No data found for state: ${stateMatchingValue}`);
      return NextResponse.json({
        error: `No data found for state: ${stateMatchingValue}`,
        data: createEmptyData(),
        metrics: createEmptyMetrics(),
      });
    }

    // Process the data into the format we need
    const data = processData(filteredData);

    // Calculate metrics
    const metrics = calculateMetrics(data);

    // Create result object
    const result = {
      data,
      metrics,
      state: stateMatchingValue,
      rowCount: filteredData.length,
    };

    // Store in cache
    stateDataCache.set(state, result);
    cacheTimestamp = now;

    // Return the processed data and metrics
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch comparison data: ${error.message}`,
        data: createEmptyData(),
        metrics: createEmptyMetrics(),
      },
      { status: 500 },
    );
  }
}

/**
 * Handler for clearing the state data cache via API
 */
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    if (state) {
      // Clear cache for specific state
      stateDataCache.delete(state);
      console.log(`Cache cleared for state: ${state}`);

      // Revalidate the specific state page
      revalidatePath(
        `/state-comparisons/${state.toLowerCase().replace(/\s+/g, "-")}`,
      );

      return NextResponse.json({
        success: true,
        message: `Cache cleared for state: ${state}`,
      });
    } else {
      // Clear all state data cache
      stateDataCache.clear();
      cacheTimestamp = null;
      console.log("All state data cache cleared");

      // Revalidate the comparison pages
      revalidatePath("/state-comparisons");

      return NextResponse.json({
        success: true,
        message: "All state data cache cleared",
      });
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * Process the raw data into a structured format for visualization
 * @param {Array} filteredData - Filtered CSV data for a state
 * @returns {Object} Structured data object
 */
function processData(filteredData) {
  const data = {
    state_name: [],
    district_name: [],
    crop_name: [],
    season_name: [],
    area: [],
    production: [],
    yield: [],
  };

  filteredData.forEach((row) => {
    // Find district column
    const districtColumn = findColumn(row, [
      "district_name",
      "DISTRICT_NAME",
      "district",
      "DISTRICT",
    ]);
    // Find crop column
    const cropColumn = findColumn(row, [
      "crop_name",
      "CROP_NAME",
      "crop",
      "CROP",
    ]);
    // Find season column
    const seasonColumn = findColumn(row, [
      "season_name",
      "SEASON_NAME",
      "season",
      "SEASON",
    ]);
    // Find area column
    const areaColumn = findColumn(row, [
      "area_in_hectares",
      "AREA_IN_HECTARES",
      "area",
      "AREA",
    ]);
    // Find production column
    const productionColumn = findColumn(row, [
      "production_in_tonnes",
      "PRODUCTION_IN_TONNES",
      "production",
      "PRODUCTION",
    ]);
    // Find yield column
    const yieldColumn = findColumn(row, [
      "yield_in_tonnes_per_hectare",
      "YIELD_IN_TONNES_PER_HECTARE",
      "yield",
      "YIELD",
    ]);

    // Find state column
    const stateColumn = findColumn(row, [
      "state_name",
      "STATE_NAME",
      "state",
      "STATE",
    ]);

    if (stateColumn && districtColumn && cropColumn && seasonColumn) {
      data.state_name.push(row[stateColumn]?.toString()?.trim() || "");
      data.district_name.push(row[districtColumn]?.toString()?.trim() || "");
      data.crop_name.push(row[cropColumn]?.toString()?.trim() || "");
      data.season_name.push(row[seasonColumn]?.toString()?.trim() || "");
      data.area.push(row[areaColumn] || 0);
      data.production.push(row[productionColumn] || 0);
      data.yield.push(row[yieldColumn] || 0);
    }
  });

  return data;
}

/**
 * Helper function to find a column in the data with possible variations in naming
 * @param {Object} row - Data row
 * @param {Array} possibleNames - Possible column names to look for
 * @returns {string|null} The found column name or null
 */
function findColumn(row, possibleNames) {
  for (const name of possibleNames) {
    if (row.hasOwnProperty(name)) {
      return name;
    }
  }
  return null;
}

/**
 * Calculate metrics from the processed data
 * @param {Object} data - Processed data object
 * @returns {Object} Calculated metrics
 */
function calculateMetrics(data) {
  // Calculate unique values
  const uniqueCrops = [...new Set(data.crop_name)];
  const uniqueDistricts = [...new Set(data.district_name)];
  const uniqueSeasons = [...new Set(data.season_name)];
  const totalRecords = data.crop_name.length;

  // Find most common crop
  const cropCounts = {};
  data.crop_name.forEach((crop) => {
    cropCounts[crop] = (cropCounts[crop] || 0) + 1;
  });

  let mostCommonCrop = "";
  let highestCount = 0;
  Object.entries(cropCounts).forEach(([crop, count]) => {
    if (count > highestCount) {
      highestCount = count;
      mostCommonCrop = crop;
    }
  });

  // Find primary season
  const seasonCounts = {};
  data.season_name.forEach((season) => {
    seasonCounts[season] = (seasonCounts[season] || 0) + 1;
  });

  let primarySeason = "";
  let highestSeasonCount = 0;
  Object.entries(seasonCounts).forEach(([season, count]) => {
    if (count > highestSeasonCount) {
      highestSeasonCount = count;
      primarySeason = season;
    }
  });

  // Calculate percentages
  const cropPercentage =
    totalRecords > 0 ? Math.round((highestCount / totalRecords) * 100) : 0;
  const seasonPercentage =
    totalRecords > 0
      ? Math.round((highestSeasonCount / totalRecords) * 100)
      : 0;

  return {
    totalCrops: uniqueCrops.length,
    totalDistricts: uniqueDistricts.length,
    totalSeasons: uniqueSeasons.length,
    totalRecords,
    mostCommonCrop,
    cropPercentage,
    primarySeason,
    seasonPercentage,
  };
}

/**
 * Create empty data structure for states with no data
 */
function createEmptyData() {
  return {
    state_name: [],
    district_name: [],
    crop_name: [],
    season_name: [],
    area: [],
    production: [],
    yield: [],
  };
}

/**
 * Create empty metrics for states with no data
 */
function createEmptyMetrics() {
  return {
    totalCrops: 0,
    totalDistricts: 0,
    totalSeasons: 0,
    totalRecords: 0,
    mostCommonCrop: "",
    cropPercentage: 0,
    primarySeason: "",
    seasonPercentage: 0,
  };
}
