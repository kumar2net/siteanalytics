import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../services/api';
import './RealtimeMetrics.css';

interface RealtimeMetricsProps {
  refreshInterval?: number;
}

const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({ refreshInterval = 30000 }) => {
  const [metrics, setMetrics] = useState({
    current_visitors: 0,
    today_visits: 0,
    today_views: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const data = await analyticsApi.getRealtimeMetrics();
      setMetrics(data);
    } catch (err) {
      setError('Failed to fetch real-time metrics');
      console.error('Error fetching real-time metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="metric-card loading">
            <div className="loading-placeholder"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-text">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-grid">
      {/* Current Visitors */}
      <div className="metric-card">
        <div className="metric-content">
          <div className="metric-icon visitors">
            👥
          </div>
          <div className="metric-info">
            <p className="metric-label">Current Visitors</p>
            <p className="metric-value">{metrics.current_visitors}</p>
          </div>
        </div>
      </div>

      {/* Today's Visits */}
      <div className="metric-card">
        <div className="metric-content">
          <div className="metric-icon visits">
            📊
          </div>
          <div className="metric-info">
            <p className="metric-label">Today's Visits</p>
            <p className="metric-value">{metrics.today_visits}</p>
          </div>
        </div>
      </div>

      {/* Today's Views */}
      <div className="metric-card">
        <div className="metric-content">
          <div className="metric-icon views">
            👁️
          </div>
          <div className="metric-info">
            <p className="metric-label">Today's Views</p>
            <p className="metric-value">{metrics.today_views}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeMetrics; 