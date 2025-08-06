const UAParser = require('ua-parser-js');

class DeviceParser {
  // Parse user agent to extract device information
  static parseUserAgent(userAgent) {
    if (!userAgent) return {};
    
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    return {
      device_type: this.mapDeviceType(result.device.type),
      browser: result.browser.name || null,
      browser_version: result.browser.version || null,
      operating_system: result.os.name || null,
      os_version: result.os.version || null
    };
  }

  // Map device type to our standardized values
  static mapDeviceType(deviceType) {
    if (!deviceType) return 'desktop';
    
    const typeMap = {
      'mobile': 'mobile',
      'tablet': 'tablet',
      'console': 'other',
      'smarttv': 'other',
      'wearable': 'other',
      'embedded': 'other'
    };
    
    return typeMap[deviceType] || 'desktop';
  }

  // Extract screen resolution from client data
  static parseScreenResolution(screenData) {
    if (!screenData) return null;
    
    try {
      const { width, height } = screenData;
      if (width && height) {
        return `${width}x${height}`;
      }
    } catch (error) {
      console.warn('Error parsing screen resolution:', error);
    }
    
    return null;
  }

  // Validate geolocation data
  static validateGeolocation(geoData) {
    if (!geoData) return null;
    
    const { country, region, city, latitude, longitude } = geoData;
    
    // Basic validation
    if (latitude && (latitude < -90 || latitude > 90)) return null;
    if (longitude && (longitude < -180 || longitude > 180)) return null;
    
    return {
      country: country || null,
      region: region || null,
      city: city || null,
      latitude: latitude || null,
      longitude: longitude || null
    };
  }

  // Get device category based on screen size and user agent
  static getDeviceCategory(screenData, userAgent) {
    if (!screenData) return 'desktop';
    
    const { width, height } = screenData;
    const minDimension = Math.min(width, height);
    
    if (minDimension < 768) return 'mobile';
    if (minDimension < 1024) return 'tablet';
    return 'desktop';
  }
}

module.exports = DeviceParser; 