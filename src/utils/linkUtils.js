// src/utils/linkUtils.js
// Utility functions for generating external links

/**
 * Generate a Google Maps link from a location string
 * @param {string} location - The location/address to map
 * @returns {string} - Google Maps URL
 */
export const generateGoogleMapsLink = (location) => {
  if (!location || typeof location !== 'string') {
    return null;
  }
  
  // Clean and encode the location for URL
  const encodedLocation = encodeURIComponent(location.trim());
  return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
};

/**
 * Generate a Google Maps directions link from a location string
 * @param {string} location - The destination location/address
 * @returns {string} - Google Maps directions URL
 */
export const generateDirectionsLink = (location) => {
  if (!location || typeof location !== 'string') {
    return null;
  }
  
  const encodedLocation = encodeURIComponent(location.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedLocation}`;
};

/**
 * Validate and format a website URL
 * @param {string} url - The website URL to validate
 * @returns {string|null} - Formatted URL or null if invalid
 */
export const formatWebsiteUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  const trimmedUrl = url.trim();
  if (trimmedUrl === '') {
    return null;
  }
  
  // Add https:// if no protocol is specified
  if (!trimmedUrl.match(/^https?:\/\//i)) {
    return `https://${trimmedUrl}`;
  }
  
  return trimmedUrl;
};

/**
 * Validate if a URL is properly formatted
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    new URL(formatWebsiteUrl(url));
    return true;
  } catch {
    return false;
  }
};

/**
 * Open a link in a new tab safely
 * @param {string} url - The URL to open
 * @param {string} fallbackMessage - Message to show if URL is invalid
 */
export const openLinkSafely = (url, fallbackMessage = 'Invalid link') => {
  if (!url) {
    alert(fallbackMessage);
    return;
  }
  
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Error opening link:', error);
    alert('Unable to open link');
  }
};

/**
 * Generate a share link for an event
 * @param {object} event - Event data (tournament or league)
 * @param {string} eventType - 'tournament' or 'league'
 * @returns {string} - Shareable text with event details
 */
export const generateShareText = (event, eventType) => {
  const eventLabel = eventType === 'tournament' ? 'Tournament' : 'League';
  const dateField = eventType === 'tournament' ? 'eventDate' : 'startDate';
  
  let shareText = `Check out this ${eventLabel}: ${event.name}`;
  
  if (event.location) {
    shareText += `\nLocation: ${event.location}`;
  }
  
  if (event[dateField]) {
    const date = event[dateField].seconds 
      ? new Date(event[dateField].seconds * 1000)
      : new Date(event[dateField]);
    shareText += `\nDate: ${date.toLocaleDateString()}`;
  }
  
  if (event.website) {
    shareText += `\nWebsite: ${event.website}`;
  }
  
  return shareText;
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {string} successMessage - Success message to show
 */
export const copyToClipboard = async (text, successMessage = 'Copied to clipboard!') => {
  try {
    await navigator.clipboard.writeText(text);
    // You could integrate with your app's notification system here
    console.log(successMessage);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      console.log(successMessage);
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
    }
    document.body.removeChild(textArea);
  }
};

/**
 * Extract domain from URL for display purposes
 * @param {string} url - The full URL
 * @returns {string} - The domain name
 */
export const extractDomain = (url) => {
  if (!url) return '';
  
  try {
    const formattedUrl = formatWebsiteUrl(url);
    const urlObj = new URL(formattedUrl);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/**
 * Check if location looks like a full address vs just a venue name
 * @param {string} location - Location string
 * @returns {boolean} - Whether it looks like a full address
 */
export const isFullAddress = (location) => {
  if (!location) return false;
  
  // Check for common address indicators
  const addressIndicators = [
    /\d+.*\w+.*st|street|ave|avenue|blvd|boulevard|rd|road|ln|lane|ct|court|dr|drive|way|circle|place/i,
    /,.*\w{2}\s*\d{5}/i, // State and ZIP
    /\d{5}/, // ZIP code
    /,.*[A-Z]{2}$/i // Ends with state code
  ];
  
  return addressIndicators.some(pattern => pattern.test(location));
};

/**
 * Enhance location for better mapping
 * @param {string} location - Original location string
 * @param {string} defaultCity - Default city to append if needed
 * @param {string} defaultState - Default state to append if needed
 * @returns {string} - Enhanced location string
 */
export const enhanceLocationForMapping = (location, defaultCity = 'Denver', defaultState = 'CO') => {
  if (!location) return '';
  
  // If it already looks like a full address, return as-is
  if (isFullAddress(location)) {
    return location;
  }
  
  // If it's just a venue name, enhance it with default city/state
  return `${location}, ${defaultCity}, ${defaultState}`;
};

export default {
  generateGoogleMapsLink,
  generateDirectionsLink,
  formatWebsiteUrl,
  isValidUrl,
  openLinkSafely,
  generateShareText,
  copyToClipboard,
  extractDomain,
  isFullAddress,
  enhanceLocationForMapping
};