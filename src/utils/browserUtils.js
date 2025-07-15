// src/utils/browserUtils.js

// Get comprehensive browser and device information
export const getBrowserInfo = () => {
  try {
    return {
      // Browser detection
      browser: getBrowserName(),
      version: getBrowserVersion(),
      
      // Operating system
      os: getOperatingSystem(),
      
      // Device information
      isMobile: isMobileDevice(),
      isTablet: isTabletDevice(),
      deviceType: getDeviceType(),
      
      // Screen information
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      
      // Browser capabilities
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Performance metrics (if available)
      connectionType: getConnectionType(),
      
      // User agent (for detailed debugging)
      userAgent: navigator.userAgent,
      
      // Current page info
      url: window.location.href,
      referrer: document.referrer || 'Direct',
      
      // Timestamp
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Error collecting browser info:', error);
    return {
      error: 'Failed to collect browser information',
      userAgent: navigator.userAgent || 'Unknown',
      timestamp: new Date().toISOString()
    };
  }
};

// Detect browser name
const getBrowserName = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return 'Chrome';
  } else if (userAgent.includes('firefox')) {
    return 'Firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'Safari';
  } else if (userAgent.includes('edg')) {
    return 'Edge';
  } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
    return 'Opera';
  } else if (userAgent.includes('msie') || userAgent.includes('trident')) {
    return 'Internet Explorer';
  } else {
    return 'Unknown';
  }
};

// Get browser version
const getBrowserVersion = () => {
  const userAgent = navigator.userAgent;
  let version = 'Unknown';
  
  try {
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      version = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      version = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      version = userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Edg')) {
      version = userAgent.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      version = userAgent.match(/(Opera|OPR)\/([0-9.]+)/)?.[2] || 'Unknown';
    }
  } catch (error) {
    console.warn('Error detecting browser version:', error);
  }
  
  return version;
};

// Detect operating system
const getOperatingSystem = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  if (userAgent.includes('Windows')) {
    return 'Windows';
  } else if (userAgent.includes('Mac') || platform.includes('Mac')) {
    return 'macOS';
  } else if (userAgent.includes('Linux')) {
    return 'Linux';
  } else if (userAgent.includes('Android')) {
    return 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return 'iOS';
  } else {
    return platform || 'Unknown';
  }
};

// Check if device is mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if device is tablet
const isTabletDevice = () => {
  return /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
};

// Get device type
const getDeviceType = () => {
  if (isTabletDevice()) {
    return 'Tablet';
  } else if (isMobileDevice()) {
    return 'Mobile';
  } else {
    return 'Desktop';
  }
};

// Get connection type (if available)
const getConnectionType = () => {
  try {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        return {
          effectiveType: connection.effectiveType || 'Unknown',
          downlink: connection.downlink || 'Unknown',
          rtt: connection.rtt || 'Unknown'
        };
      }
    }
    return 'Not available';
  } catch (error) {
    return 'Error detecting connection';
  }
};

// Get local storage availability
export const isLocalStorageAvailable = () => {
  try {
    const test = 'localStorage-test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

// Get session storage availability
export const isSessionStorageAvailable = () => {
  try {
    const test = 'sessionStorage-test';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

// Get memory information (if available)
export const getMemoryInfo = () => {
  try {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return 'Not available';
  } catch (error) {
    return 'Error getting memory info';
  }
};

// Format browser info for display
export const formatBrowserInfoForDisplay = (browserInfo) => {
  if (!browserInfo || browserInfo.error) {
    return 'Browser information not available';
  }
  
  const info = [
    `${browserInfo.browser} ${browserInfo.version}`,
    `${browserInfo.os}`,
    `${browserInfo.deviceType}`,
    `${browserInfo.screenResolution}`
  ];
  
  return info.filter(Boolean).join(' • ');
};

// Detect if user prefers reduced motion
export const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    return false;
  }
};

// Detect dark mode preference
export const prefersDarkMode = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    return false;
  }
};

// Get current page performance metrics
export const getPagePerformanceMetrics = () => {
  try {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        return {
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
          loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
          pageLoadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart)
        };
      }
    }
    return 'Not available';
  } catch (error) {
    return 'Error getting performance metrics';
  }
};