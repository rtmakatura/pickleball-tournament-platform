// src/components/ui/LinkButtons.jsx
import React from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { Button } from './Button';
import { openInGoogleMaps, openDirections, openUrlSafely, formatWebsiteUrl, getDomainFromUrl } from '../../utils/linkUtils';

/**
 * LinkButtons Component - Displays Google Maps and Website link buttons
 * 
 * Props:
 * - location: string - Location/address for Google Maps
 * - website: string - Website URL
 * - size: string - Button size ('sm', 'md', 'lg')
 * - variant: string - Button variant
 * - showDirections: boolean - Whether to show directions button instead of location
 * - compact: boolean - Whether to show compact version with icons only
 * - className: string - Additional CSS classes
 */
const LinkButtons = ({
  location,
  website,
  size = 'sm',
  variant = 'outline',
  showDirections = false,
  compact = false,
  className = ''
}) => {
  const hasLocation = location && location.trim() !== '';
  const formattedWebsite = formatWebsiteUrl(website);
  const hasWebsite = formattedWebsite !== null;

  if (!hasLocation && !hasWebsite) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Google Maps Button */}
      {hasLocation && (
        <Button
          size={size}
          variant={variant}
          onClick={() => showDirections ? openDirections(location) : openInGoogleMaps(location)}
          title={showDirections ? `Get directions to ${location}` : `View ${location} on Google Maps`}
          className="flex items-center"
        >
          {showDirections ? (
            <Navigation className="h-4 w-4" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          {!compact && (
            <span className="ml-1">
              {showDirections ? 'Directions' : 'Maps'}
            </span>
          )}
        </Button>
      )}

      {/* Website Button */}
      {hasWebsite && (
        <Button
          size={size}
          variant={variant}
          onClick={() => openUrlSafely(website)}
          title={`Visit ${getDomainFromUrl(website)}`}
          className="flex items-center"
        >
          <ExternalLink className="h-4 w-4" />
          {!compact && (
            <span className="ml-1">Website</span>
          )}
        </Button>
      )}
    </div>
  );
};

/**
 * LocationButton Component - Just the Google Maps button
 */
export const LocationButton = ({
  location,
  size = 'sm',
  variant = 'outline',
  showDirections = false,
  compact = false,
  className = ''
}) => {
  const hasLocation = location && location.trim() !== '';

  if (!hasLocation) return null;

  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => showDirections ? openDirections(location) : openInGoogleMaps(location)}
      title={showDirections ? `Get directions to ${location}` : `View ${location} on Google Maps`}
      className={`flex items-center ${className}`}
    >
      {showDirections ? (
        <Navigation className="h-4 w-4" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      {!compact && (
        <span className="ml-1">
          {showDirections ? 'Directions' : 'Maps'}
        </span>
      )}
    </Button>
  );
};

/**
 * WebsiteButton Component - Just the website button
 */
export const WebsiteButton = ({
  website,
  size = 'sm',
  variant = 'outline',
  compact = false,
  customLabel = null,
  className = ''
}) => {
  const formattedWebsite = formatWebsiteUrl(website);
  const hasWebsite = formattedWebsite !== null;

  if (!hasWebsite) return null;

  const displayLabel = customLabel || (compact ? '' : 'Website');
  const buttonTitle = `Visit ${getDomainFromUrl(website)}`;

  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => openUrlSafely(website)}
      title={buttonTitle}
      className={`flex items-center ${className}`}
    >
      <ExternalLink className="h-4 w-4" />
      {displayLabel && (
        <span className="ml-1">{displayLabel}</span>
      )}
    </Button>
  );
};

/**
 * LinkText Component - Display clickable text links instead of buttons
 */
export const LinkText = ({
  location,
  website,
  showDirections = false,
  className = ''
}) => {
  const hasLocation = location && location.trim() !== '';
  const formattedWebsite = formatWebsiteUrl(website);
  const hasWebsite = formattedWebsite !== null;

  if (!hasLocation && !hasWebsite) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-4 text-sm ${className}`}>
      {/* Google Maps Link */}
      {hasLocation && (
        <button
          onClick={() => showDirections ? openDirections(location) : openInGoogleMaps(location)}
          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
          title={showDirections ? `Get directions to ${location}` : `View ${location} on Google Maps`}
        >
          {showDirections ? (
            <Navigation className="h-4 w-4 mr-1" />
          ) : (
            <MapPin className="h-4 w-4 mr-1" />
          )}
          {showDirections ? 'Get Directions' : 'View on Maps'}
        </button>
      )}

      {/* Website Link */}
      {hasWebsite && (
        <button
          onClick={() => openUrlSafely(website)}
          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
          title={`Visit ${getDomainFromUrl(website)}`}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          {getDomainFromUrl(website)}
        </button>
      )}
    </div>
  );
};

export default LinkButtons;