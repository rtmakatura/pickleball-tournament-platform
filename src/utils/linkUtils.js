// src/utils/linkUtils.js
// Utility functions for handling external links and maps

/**
 * Generate Google Maps URL for a location
 * @param {string} location - The location/address to search for
 * @returns {string} - Google Maps URL
 */
export const getGoogleMapsUrl = (location) => {
  if (!location || typeof location !== 'string' || location.trim() === '') {
    return null;
  }
  
  const encodedLocation = encodeURIComponent(location.trim());
  return `https://maps.google.com/maps?q=${encodedLocation}`;
};

/**
 * Format and validate website URL
 * @param {string} url - The website URL to format
 * @returns {string|null} - Formatted URL or null if invalid
 */
export const formatWebsiteUrl = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }
  
  let formattedUrl = url.trim();
  
  // Add protocol if missing
  if (!formattedUrl.match(/^https?:\/\//i)) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  // Basic URL validation
  try {
    new URL(formattedUrl);
    return formattedUrl;
  } catch (error) {
    return null;
  }
};

/**
 * Validate if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(formatWebsiteUrl(url));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get domain name from URL for display
 * @param {string} url - The URL to extract domain from
 * @returns {string} - Domain name or original URL if extraction fails
 */
export const getDomainFromUrl = (url) => {
  try {
    const formattedUrl = formatWebsiteUrl(url);
    if (!formattedUrl) return url;
    
    const urlObject = new URL(formattedUrl);
    return urlObject.hostname.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
};

/**
 * Open URL in new tab with security measures
 * @param {string} url - URL to open
 */
export const openUrlSafely = (url) => {
  const formattedUrl = formatWebsiteUrl(url);
  if (formattedUrl) {
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Open Google Maps for a location
 * @param {string} location - Location to open in maps
 */
export const openInGoogleMaps = (location) => {
  const mapsUrl = getGoogleMapsUrl(location);
  if (mapsUrl) {
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Generate directions URL from user's location to destination
 * @param {string} destination - Destination address
 * @returns {string|null} - Google Maps directions URL
 */
export const getDirectionsUrl = (destination) => {
  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    return null;
  }
  
  const encodedDestination = encodeURIComponent(destination.trim());
  return `https://maps.google.com/maps?daddr=${encodedDestination}`;
};

/**
 * Open directions in Google Maps
 * @param {string} destination - Destination address
 */
export const openDirections = (destination) => {
  const directionsUrl = getDirectionsUrl(destination);
  if (directionsUrl) {
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
  }
};

export default {
  getGoogleMapsUrl,
  formatWebsiteUrl,
  isValidUrl,
  getDomainFromUrl,
  openUrlSafely,
  openInGoogleMaps,
  getDirectionsUrl,
  openDirections
};