'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { removeToken } from '@/lib/auth';
import Notification from './Notification';

export default function DashboardLayout({ children, navItems, title, subtitle }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      removeToken();
      router.push('/auth');
    } catch (error) {
      setNotification({ message: 'Error during logout', type: 'error' });
    }
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    // Scroll to section if it exists on the page
    const element = document.getElementById(`section-${section}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getProfilePictureUrl = () => {
    if (!user?.profile_picture) return null;
    const pic = user.profile_picture;
    if (pic.startsWith('http')) return pic;
    if (pic.startsWith('/')) return `http://localhost:8000${pic}`;
    return `http://localhost:8000/storage/${pic}`;
  };

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="dashboard-layout">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Vehicle Rental</div>
            <div className="sidebar-subtitle">{subtitle || 'Dashboard'}</div>
          </div>

          <div className="sidebar-nav">
            {navItems.map((item) => (
              <a
                key={item.section}
                href="#"
                className={`nav-item ${activeSection === item.section ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.section);
                  if (item.onClick) item.onClick();
                }}
              >
                <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Profile Section */}
          <div className="sidebar-profile">
            <div className="sidebar-profile-header">
              <div className="sidebar-profile-picture">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="sidebar-profile-placeholder"
                  style={{
                    display: profilePictureUrl ? 'none' : 'flex',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--clean-white)',
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              <div className="sidebar-profile-info">
                <div className="sidebar-profile-name">
                  {user?.name || user?.full_name || 'Loading...'}
                </div>
                <div className="sidebar-profile-email">{user?.email || ''}</div>
                <div className="sidebar-profile-role">
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                </div>
              </div>
            </div>
            <Link href="/profile" className="sidebar-profile-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              </svg>
              <span>Edit Profile</span>
            </Link>
          </div>

          <div className="sidebar-footer">
            <div className="nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5z" />
              </svg>
              <span>Sign Out</span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </>
  );
}

