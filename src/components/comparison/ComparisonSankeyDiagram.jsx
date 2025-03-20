"use client";

import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

export default function ComparisonSankeyDiagram({ data }) {
  const sankeyContainerRef = useRef(null);

  useEffect(() => {
    if (!data || !sankeyContainerRef.current) return;

    // Store a reference to the current container element
    const container = sankeyContainerRef.current;

    // Define the columns for the Sankey diagram in the desired order (left to right)
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
      state_name: "rgba(174, 214, 241, 0.8)", // Pastel blue for state
      season_name: "rgba(169, 223, 191, 0.8)", // Pastel green for seasons
      crop_name: "rgba(250, 215, 160, 0.8)", // Pastel orange for crops
      district_name: "rgba(215, 189, 226, 0.8)", // Pastel purple for districts
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

    // Get container and render the diagram
    Plotly.newPlot(container, [sankeyData], layout, {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
    });

    // Cleanup function to prevent memory leaks
    return () => {
      Plotly.purge(container);
    };
  }, [data]);

  if (!data) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-md shadow-sm p-4">
      <div ref={sankeyContainerRef} className="w-full h-[75vh]"></div>
    </div>
  );
}
