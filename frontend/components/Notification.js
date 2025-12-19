'use client';

import { useEffect, useState } from 'react';

export default function Notification({ message, type = 'info', duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
  const statusText = type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info';
  const borderColor = type === 'success' ? '#28a745' : type === 'error' ? 'var(--deep-red)' : type === 'warning' ? '#ffc107' : 'var(--warm-beige)';

  return (
    <div
      className="notification"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'var(--clean-white)',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-lg)',
        padding: 'var(--spacing-md) var(--spacing-lg)',
        maxWidth: '400px',
        animation: isVisible ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{statusText}</div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>{message}</div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            opacity: 0.6,
            padding: 0,
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.target.style.opacity = 1)}
          onMouseLeave={(e) => (e.target.style.opacity = 0.6)}
        >
          ×
        </button>
      </div>
    </div>
  );
}

