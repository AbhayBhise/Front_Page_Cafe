import React, { useState, useEffect } from 'react';

export const DemoBanner: React.FC = () => {
  const [isDemo, setIsDemo] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // If running on github.io or without a live backend connection
    const host = window.location.hostname;
    const isGithubPages = host.includes('github.io') || host.includes('pages.dev');
    if (isGithubPages) {
      setIsDemo(true);
    }
  }, []);

  if (!isDemo || dismissed) return null;

  return (
    <div
      className="alert alert-info border-0 rounded-0 mb-0 py-2 px-3 d-flex align-items-center justify-content-between"
      style={{
        backgroundColor: '#fff3cd',
        color: '#664d03',
        fontSize: '0.875rem',
        zIndex: 1030,
      }}
      role="alert"
    >
      <div className="d-flex align-items-center gap-2">
        <i className="bi bi-stars fs-6 text-warning" />
        <span>
          <strong>Live Preview Mode</strong> — Browsing interactive sample cafes, verified menus & table QR ordering. Multi-tenant live sync connects when running with Docker or API backend.
        </span>
      </div>
      <button
        type="button"
        className="btn-close btn-close-sm"
        aria-label="Close banner"
        onClick={() => setDismissed(true)}
      />
    </div>
  );
};

export default DemoBanner;

