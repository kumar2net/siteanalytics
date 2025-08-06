/**
 * Website Analytics Tracker
 * Version: 1.0.0
 * 
 * Usage:
 * 1. Include this script in your website
 * 2. Initialize with: SiteAnalytics.init('YOUR_API_ENDPOINT')
 * 3. Track page views automatically or manually
 */

(function() {
  'use strict';

  // Configuration
  let config = {
    apiEndpoint: null,
    visitorId: null,
    sessionId: null,
    autoTrack: true,
    trackTimeOnPage: true,
    debug: false
  };

  // Storage keys
  const STORAGE_KEYS = {
    VISITOR_ID: 'sa_visitor_id',
    SESSION_ID: 'sa_session_id',
    SESSION_START: 'sa_session_start'
  };

  // Session timeout (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  // Utility functions
  const utils = {
    log: function(message, data) {
      if (config.debug) {
        console.log('[SiteAnalytics]', message, data || '');
      }
    },

    generateId: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    getStorage: function(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },

    setStorage: function(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    },

    getReferrer: function() {
      return document.referrer || '';
    },

    getUserAgent: function() {
      return navigator.userAgent || '';
    },

    getPageUrl: function() {
      return window.location.href;
    },

    isNewSession: function() {
      const sessionStart = utils.getStorage(STORAGE_KEYS.SESSION_START);
      if (!sessionStart) return true;
      
      const sessionAge = Date.now() - parseInt(sessionStart);
      return sessionAge > SESSION_TIMEOUT;
    }
  };

  // Tracking functions
  const tracker = {
    startTime: Date.now(),
    pageStartTime: Date.now(),

    initSession: function() {
      // Get or create visitor ID
      let visitorId = utils.getStorage(STORAGE_KEYS.VISITOR_ID);
      if (!visitorId) {
        visitorId = utils.generateId();
        utils.setStorage(STORAGE_KEYS.VISITOR_ID, visitorId);
      }
      config.visitorId = visitorId;

      // Check if we need a new session
      if (utils.isNewSession()) {
        config.sessionId = utils.generateId();
        utils.setStorage(STORAGE_KEYS.SESSION_ID, config.sessionId);
        utils.setStorage(STORAGE_KEYS.SESSION_START, Date.now().toString());
      } else {
        config.sessionId = utils.getStorage(STORAGE_KEYS.SESSION_ID) || utils.generateId();
      }

      utils.log('Session initialized', {
        visitorId: config.visitorId,
        sessionId: config.sessionId
      });
    },

    trackPageView: function(customData = {}) {
      if (!config.apiEndpoint) {
        utils.log('API endpoint not configured');
        return;
      }

      const timeOnPage = config.trackTimeOnPage ? 
        Math.floor((Date.now() - this.pageStartTime) / 1000) : 0;

      const data = {
        page_url: utils.getPageUrl(),
        visitor_id: config.visitorId,
        session_id: config.sessionId,
        time_on_page: timeOnPage,
        referrer: utils.getReferrer(),
        user_agent: utils.getUserAgent(),
        ...customData
      };

      utils.log('Tracking page view', data);

      // Send tracking data
      fetch(config.apiEndpoint + '/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        utils.log('Page view tracked successfully', result);
      })
      .catch(error => {
        utils.log('Error tracking page view', error);
      });

      // Reset page start time
      this.pageStartTime = Date.now();
    },

    trackEvent: function(eventName, eventData = {}) {
      if (!config.apiEndpoint) {
        utils.log('API endpoint not configured');
        return;
      }

      const data = {
        page_url: utils.getPageUrl(),
        visitor_id: config.visitorId,
        session_id: config.sessionId,
        event_name: eventName,
        event_data: eventData,
        referrer: utils.getReferrer(),
        user_agent: utils.getUserAgent()
      };

      utils.log('Tracking event', data);

      // Send event data
      fetch(config.apiEndpoint + '/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        utils.log('Event tracked successfully', result);
      })
      .catch(error => {
        utils.log('Error tracking event', error);
      });
    }
  };

  // Event listeners
  const events = {
    setupPageTracking: function() {
      if (!config.autoTrack) return;

      // Track initial page view
      tracker.trackPageView();

      // Track page visibility changes
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
          tracker.pageStartTime = Date.now();
        } else if (document.visibilityState === 'hidden') {
          tracker.trackPageView();
        }
      });

      // Track before unload
      window.addEventListener('beforeunload', function() {
        tracker.trackPageView();
      });

      // Track navigation (for SPAs)
      let currentUrl = window.location.href;
      const observer = new MutationObserver(function() {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          setTimeout(() => tracker.trackPageView(), 100);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  };

  // Public API
  window.SiteAnalytics = {
    init: function(apiEndpoint, options = {}) {
      config = { ...config, ...options };
      config.apiEndpoint = apiEndpoint.replace(/\/$/, ''); // Remove trailing slash

      utils.log('Initializing SiteAnalytics', config);

      // Initialize session
      tracker.initSession();

      // Setup tracking
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', events.setupPageTracking);
      } else {
        events.setupPageTracking();
      }
    },

    track: function(customData) {
      tracker.trackPageView(customData);
    },

    trackEvent: function(eventName, eventData) {
      tracker.trackEvent(eventName, eventData);
    },

    getVisitorId: function() {
      return config.visitorId;
    },

    getSessionId: function() {
      return config.sessionId;
    },

    setDebug: function(enabled) {
      config.debug = enabled;
    }
  };

  // Auto-initialize if data attributes are present
  const script = document.currentScript;
  if (script && script.dataset.apiEndpoint) {
    const options = {};
    if (script.dataset.debug) options.debug = script.dataset.debug === 'true';
    if (script.dataset.autoTrack) options.autoTrack = script.dataset.autoTrack === 'true';
    
    window.SiteAnalytics.init(script.dataset.apiEndpoint, options);
  }

})(); 