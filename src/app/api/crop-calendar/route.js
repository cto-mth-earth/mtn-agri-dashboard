import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

// Define available state files based on your actual file list
const AVAILABLE_STATE_FILES = [
  "BIHAR_crop_calender.csv",
  "JHARKHAND_crop_calender.csv",
  "ODISHA_crop_calender.csv",
];

// Country data file name
const COUNTRY_DATA_FILE = "country_crop_calender_MoAFWofIndia.csv";

export async function GET(request) {
  try {
    // Get the state name from the request query parameters
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json(
        { error: "State parameter is required" },
        { status: 400 },
      );
    }

    // Construct the path to the CSV file
    const dataDirectory = path.join(
      process.cwd(),
      "src/data/state_crop_calenders",
    );

    // Check if we have a dedicated file for this state
    const stateFile = `${state}_crop_calender.csv`;

    if (AVAILABLE_STATE_FILES.includes(stateFile)) {
      try {
        // Try to read the state-specific file
        const filePath = path.join(dataDirectory, stateFile);
        const fileContents = await fs.readFile(filePath, "utf8");

        return new NextResponse(fileContents, {
          headers: {
            "Content-Type": "text/csv",
          },
        });
      } catch (fileError) {
        console.error(`Error reading file for state ${state}:`, fileError);
        // Fall through to try the country data file
      }
    }

    // If we don't have a dedicated file or couldn't read it,
    // try to filter from the country file
    try {
      const countryFilePath = path.join(dataDirectory, COUNTRY_DATA_FILE);
      const countryFileContents = await fs.readFile(countryFilePath, "utf8");

      // Filter the country data for the requested state
      const lines = countryFileContents.split("\n");
      const headers = lines[0];

      // Get the header row to find the state_name column index
      const headerColumns = headers.split(",");
      const stateNameIndex = headerColumns.indexOf("state_name");

      if (stateNameIndex === -1) {
        return NextResponse.json(
          { error: "Could not find state_name column in country data" },
          { status: 500 },
        );
      }

      // Filter lines where the state_name column matches our requested state
      const filteredLines = lines.filter((line, index) => {
        if (index === 0) return true; // Keep headers

        const columns = line.split(",");
        if (columns.length <= stateNameIndex) return false;

        const lineState = columns[stateNameIndex].trim();
        // Match state name without underscore and case-insensitive
        return lineState.toUpperCase() === state.replace(/_/g, " ");
      });

      if (filteredLines.length <= 1) {
        // Only headers remain, no matching data
        return NextResponse.json(
          { error: `No data found for state: ${state}` },
          { status: 404 },
        );
      }

      const filteredCSV = filteredLines.join("\n");
      return new NextResponse(filteredCSV, {
        headers: {
          "Content-Type": "text/csv",
        },
      });
    } catch (countryFileError) {
      console.error("Error reading country data file:", countryFileError);
      return NextResponse.json(
        { error: `Data not available for state: ${state}` },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
