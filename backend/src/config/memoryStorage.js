// In-memory storage for serverless environment
class MemoryStorage {
  constructor() {
    this.pageVisits = [];
    this.dailyMetrics = new Map();
    this.visitors = new Set();
    this.sessions = new Set();
  }

  // Add page visit
  addPageVisit(data) {
    const visit = {
      id: Date.now() + Math.random(),
      page_url: data.page_url,
      visitor_id: data.visitor_id,
      session_id: data.session_id,
      timestamp: new Date().toISOString(),
      time_on_page: data.time_on_page || 0,
      referrer: data.referrer || '',
      user_agent: data.user_agent || '',
      ip_address: data.ip_address || '',
      created_at: new Date().toISOString()
    };

    this.pageVisits.push(visit);
    this.visitors.add(data.visitor_id);
    this.sessions.add(data.session_id);

    // Keep only last 1000 visits to prevent memory issues
    if (this.pageVisits.length > 1000) {
      this.pageVisits = this.pageVisits.slice(-1000);
    }

    return visit;
  }

  // Get real-time metrics
  getRealtimeMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentVisits = this.pageVisits.filter(visit => 
      new Date(visit.timestamp) > oneHourAgo
    );

    const activeVisitors = new Set(recentVisits.map(v => v.visitor_id)).size;
    const pageViews24h = this.pageVisits.filter(visit => 
      new Date(visit.timestamp) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    ).length;

    const avgTimeOnPage = this.pageVisits.length > 0 
      ? this.pageVisits.reduce((sum, visit) => sum + (visit.time_on_page || 0), 0) / this.pageVisits.length
      : 0;

    return {
      active_visitors: activeVisitors,
      page_views_24h: pageViews24h,
      avg_time_on_page: Math.round(avgTimeOnPage)
    };
  }

  // Get daily metrics
  getDailyMetrics(days = 7) {
    const metrics = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayVisits = this.pageVisits.filter(visit => 
        visit.timestamp.startsWith(dateStr)
      );

      const uniqueVisitors = new Set(dayVisits.map(v => v.visitor_id)).size;
      const pageViews = dayVisits.length;
      const avgTime = dayVisits.length > 0 
        ? dayVisits.reduce((sum, visit) => sum + (visit.time_on_page || 0), 0) / dayVisits.length
        : 0;

      metrics.push({
        date: dateStr,
        unique_visitors: uniqueVisitors,
        page_views: pageViews,
        avg_time_on_page: Math.round(avgTime)
      });
    }

    return metrics.reverse();
  }

  // Get top pages
  getTopPages(limit = 5, startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const filteredVisits = this.pageVisits.filter(visit => {
      const visitDate = new Date(visit.timestamp);
      return visitDate >= start && visitDate <= end;
    });

    const pageCounts = {};
    filteredVisits.forEach(visit => {
      pageCounts[visit.page_url] = (pageCounts[visit.page_url] || 0) + 1;
    });

    return Object.entries(pageCounts)
      .map(([page_url, unique_visitors]) => ({ page_url, unique_visitors }))
      .sort((a, b) => b.unique_visitors - a.unique_visitors)
      .slice(0, limit);
  }

  // Get total stats
  getStats() {
    return {
      total_visits: this.pageVisits.length,
      total_visitors: this.visitors.size,
      total_sessions: this.sessions.size
    };
  }

  // Get geolocation data (placeholder - returns empty array for now)
  getGeolocation(startDate, endDate, limit = 20) {
    // For now, return empty array since we don't have geolocation data in memory storage
    return [];
  }

  // Get device breakdown (placeholder - returns default data)
  getDeviceBreakdown(startDate, endDate) {
    // Return default device breakdown
    return [
      {
        device_type: 'Unknown',
        unique_visitors: this.visitors.size.toString(),
        page_views: this.pageVisits.length.toString(),
        percentage: '100.00'
      }
    ];
  }

  // Get browser breakdown (placeholder - returns default data)
  getBrowserBreakdown(startDate, endDate) {
    // Return default browser breakdown
    return [
      {
        browser: 'Unknown',
        unique_visitors: this.visitors.size.toString(),
        page_views: this.pageVisits.length.toString(),
        percentage: '100.00'
      }
    ];
  }

  // Get OS breakdown (placeholder - returns default data)
  getOSBreakdown(startDate, endDate) {
    // Return default OS breakdown
    return [
      {
        operating_system: 'Unknown',
        unique_visitors: this.visitors.size.toString(),
        page_views: this.pageVisits.length.toString(),
        percentage: '100.00'
      }
    ];
  }
}

// Create singleton instance
const memoryStorage = new MemoryStorage();

module.exports = memoryStorage; 