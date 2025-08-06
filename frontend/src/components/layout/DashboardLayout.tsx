import React from 'react';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">
              Website Analytics Dashboard
            </h1>
          </div>
          <div className="header-right">
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span className="status-text">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-text">
            Website Analytics System - Phase 3 Dashboard
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout; 