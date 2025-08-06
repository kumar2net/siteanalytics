import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import RealtimeMetrics from './components/dashboard/RealtimeMetrics';
import HistoricalTrendsChart from './components/charts/HistoricalTrendsChart';
import './App.css';

function App() {
  return (
    <DashboardLayout>
      <div className="dashboard-content">
        {/* Page Header */}
        <div className="page-header">
          <h2 className="page-title">Analytics Overview</h2>
          <p className="page-description">
            Real-time website analytics and performance insights
          </p>
        </div>

        {/* Real-time Metrics */}
        <div className="section">
          <h3 className="section-title">Real-time Metrics</h3>
          <RealtimeMetrics refreshInterval={30000} />
        </div>

        {/* Historical Trends */}
        <div className="section">
          <h3 className="section-title">Historical Trends</h3>
          <HistoricalTrendsChart days={30} />
        </div>

        {/* System Status */}
        <div className="status-grid">
          <div className="status-card">
            <h3 className="status-title">System Status</h3>
            <div className="status-list">
              <div className="status-item">
                <span className="status-label">Backend API</span>
                <span className="status-badge online">Online</span>
              </div>
              <div className="status-item">
                <span className="status-label">ML API</span>
                <span className="status-badge online">Online</span>
              </div>
              <div className="status-item">
                <span className="status-label">Database</span>
                <span className="status-badge online">Connected</span>
              </div>
            </div>
          </div>

          <div className="status-card">
            <h3 className="status-title">Quick Actions</h3>
            <div className="action-list">
              <button className="action-button primary">
                View Demo Page
              </button>
              <button className="action-button secondary">
                API Documentation
              </button>
              <button className="action-button success">
                Train ML Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default App;
