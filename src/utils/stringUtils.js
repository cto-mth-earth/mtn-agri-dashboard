/**
 * Converts a state name to a URL slug
 * @param {string} stateName - The state name to convert
 * @returns {string} The URL slug
 */
export function toSlug(stateName) {
  return stateName.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Formats a state name from a URL slug
 * @param {string} slug - The URL slug
 * @returns {string} The formatted state name
 */
export function formatStateNameFromSlug(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats a state name for the CSV file lookup
 * @param {string} stateName - The state name
 * @returns {string} The formatted name for the API
 */
export function formatStateNameForAPI(stateName) {
  return stateName.toUpperCase();
}
