import Papa from "papaparse";
import Plotly from "plotly.js-dist-min";

/**
 * Parses CSV text into structured data for visualization
 * @param {string} csvText - Raw CSV text
 * @returns {Object} Structured data object
 */
export function parseCSV(csvText) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  // Filter out rows with missing essential data
  const filteredData = result.data.filter(
    (row) =>
      row.state_name && row.season_name && row.crop_name && row.district_name,
  );

  // Organize data for our needs
  const organizedData = {
    state_name: [],
    season_name: [],
    crop_name: [],
    district_name: [],
    area: [],
    production: [],
    yield: [],
  };

  filteredData.forEach((row) => {
    organizedData.state_name.push(row.state_name);
    organizedData.season_name.push(row.season_name);
    organizedData.crop_name.push(row.crop_name);
    organizedData.district_name.push(row.district_name);
    organizedData.area.push(row.area_in_hectares || 0);
    organizedData.production.push(row.production_in_tonnes || 0);
    organizedData.yield.push(row.yield_in_tonnes_per_hectare || 0);
  });

  return organizedData;
}

/**
 * Calculates key metrics from the crop calendar data
 * @param {Object} data - Parsed crop data
 * @returns {Object} Calculated metrics
 */
export function calculateMetrics(data) {
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
  const cropPercentage = Math.round((highestCount / totalRecords) * 100);
  const seasonPercentage = Math.round(
    (highestSeasonCount / totalRecords) * 100,
  );

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
 * Creates a Sankey diagram visualization with the provided data
 * @param {Object} data - Structured crop data
 * @param {HTMLElement} container - DOM element to render the chart in
 */
export function createSankeyDiagram(data, container) {
  // Define the columns for the Sankey diagram
  const columns = ["state_name", "season_name", "crop_name", "district_name"];

  // Create unique indices for values in each column
  const valueIndices = {};
  let currentIndex = 0;

  for (const col of columns) {
    // Get unique values
    const uniqueValues = [...new Set(data[col])];
    valueIndices[col] = {};

    // Assign indices
    for (let i = 0; i < uniqueValues.length; i++) {
      valueIndices[col][uniqueValues[i]] = currentIndex + i;
    }

    currentIndex += uniqueValues.length;
  }

  // Create sources, targets and values for Sankey diagram
  const sources = [];
  const targets = [];
  const values = [];
  const labels = [];
  const colors = [];

  // Define a pastel color map for different columns
  const pastelColorMap = {
    state_name: "rgba(174, 214, 241, 0.8)", // Pastel blue
    season_name: "rgba(169, 223, 191, 0.8)", // Pastel green
    crop_name: "rgba(250, 215, 160, 0.8)", // Pastel orange/yellow
    district_name: "rgba(215, 189, 226, 0.8)", // Pastel purple
  };

  // Collect all node labels and colors
  for (const col of columns) {
    const uniqueValues = [...new Set(data[col])];
    for (const val of uniqueValues) {
      labels.push(val);
      colors.push(pastelColorMap[col]);
    }
  }

  // Create links between columns and define link colors
  const linkColors = [];

  for (let i = 0; i < columns.length - 1; i++) {
    const colSource = columns[i];
    const colTarget = columns[i + 1];

    // Generate a color for links between these two column types
    const sourceColor = pastelColorMap[colSource];

    // Create a dictionary to aggregate production values for each source-target pair
    const pairProductions = {};

    for (let j = 0; j < data[colSource].length; j++) {
      const sourceVal = data[colSource][j];
      const targetVal = data[colTarget][j];
      const production = data.production[j] || 1; // Use 1 as default if no production data

      const pairKey = `${sourceVal}-${targetVal}`;
      if (!pairProductions[pairKey]) {
        pairProductions[pairKey] = {
          source: sourceVal,
          target: targetVal,
          value: 0,
        };
      }

      pairProductions[pairKey].value += production;
    }

    // Add aggregated production values to sources, targets and values
    for (const pairKey in pairProductions) {
      const pair = pairProductions[pairKey];

      // Only include pairs with positive production values
      if (pair.value > 0) {
        sources.push(valueIndices[colSource][pair.source]);
        targets.push(valueIndices[colTarget][pair.target]);
        values.push(pair.value);

        // Create link colors that match the source node but with more opacity
        const rgba = sourceColor.match(
          /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/,
        );
        if (rgba) {
          linkColors.push(`rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, 0.6)`);
        } else {
          linkColors.push(sourceColor);
        }
      }
    }
  }

  // Calculate positions for each column to ensure left-to-right flow
  const xPositions = [];
  for (let i = 0; i < columns.length; i++) {
    const uniqueVals = [...new Set(data[columns[i]])];
    for (let j = 0; j < uniqueVals.length; j++) {
      xPositions.push(i / (columns.length - 1));
    }
  }

  // Create the Sankey diagram
  const sankeyData = {
    type: "sankey",
    orientation: "h",
    node: {
      pad: 15,
      thickness: 20,
      line: {
        color: "white",
        width: 0.5,
      },
      label: labels,
      color: colors,
      x: xPositions,
      font: {
        size: 14,
        color: "#333",
      },
    },
    link: {
      source: sources,
      target: targets,
      value: values,
      color: linkColors,
    },
  };

  const layout = {
    title: {
      text: `Agricultural Flow: State → Season → Crop → District`,
      font: {
        size: 22,
      },
    },
    font: {
      size: 16,
    },
    autosize: true,
    margin: {
      l: 50,
      r: 50,
      t: 50,
      b: 50,
    },
    paper_bgcolor: "rgb(255, 255, 255)",
    plot_bgcolor: "rgb(255, 255, 255)",
  };

  Plotly.newPlot(container, [sankeyData], layout, { responsive: true });
}

/**
 * Formats state name to match CSV filename format
 * @param {string} stateName - User-facing state name
 * @returns {string} Formatted state name for CSV lookup
 */
export function formatStateNameForFile(stateName) {
  // Convert to uppercase and handle spaces
  return stateName.toUpperCase().replace(/\s+/g, "_");
}

/**
 * Get available states from the list of known state files
 * @returns {Array} List of available states
 */
export function getAvailableStates() {
  // These are the states we know have corresponding files
  return ["BIHAR", "JHARKHAND", "ODISHA"];
}
