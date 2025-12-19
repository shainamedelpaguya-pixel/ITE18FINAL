'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getToken, removeToken, redirectByRole } from '@/lib/auth';
import Notification from '@/components/Notification';
import DashboardLayout from '@/components/DashboardLayout';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [profileResult, setProfileResult] = useState('');
  const [passwordResult, setPasswordResult] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const response = await api.get('/profile');
        const profile = response.data;
        setUser(profile);
        setProfileForm({
          name: profile.name || profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          position: profile.position || '',
        });
      } catch (error) {
        removeToken();
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const getProfilePictureUrl = () => {
    if (!user?.profile_picture) return null;
    const pic = user.profile_picture;
    if (pic.startsWith('http')) return pic;
    if (pic.startsWith('/')) return `http://localhost:8000${pic}`;
    return `http://localhost:8000/storage/${pic}`;
  };

  const getDashboardRoute = () => {
    if (!user) return '/auth';
    return redirectByRole(user.role);
  };

  const navItems = [
    {
      section: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      onClick: () => router.push(getDashboardRoute()),
    },
    {
      section: 'profile',
      label: 'Profile',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    },
  ];

  const loadProfile = async () => {
    try {
      const response = await api.get('/profile');
      const profile = response.data;
      setUser(profile);
      setProfileForm({
        name: profile.name || profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        position: profile.position || '',
      });
      setNotification({ message: 'Profile refreshed', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Failed to load profile', type: 'error' });
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileResult('');

    const data = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
    };

    if (profileForm.phone) {
      data.phone = profileForm.phone.trim();
    }

    if (profileForm.position) {
      data.position = profileForm.position.trim();
    }

    try {
      const response = await api.put('/profile', data);
      setProfileResult('Profile updated successfully!');
      setNotification({ message: 'Profile updated successfully', type: 'success' });
      
      // Reload profile
      setTimeout(() => {
        loadProfile();
      }, 500);
    } catch (error) {
      const errorMsg =
        error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(', ')
          : error.response?.data?.message || 'Failed to update profile';
      setProfileResult(errorMsg);
      setNotification({ message: errorMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordResult('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordResult('New passwords do not match');
      setNotification({ message: 'New passwords do not match', type: 'error' });
      setChangingPassword(false);
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordResult('Password must be at least 6 characters long');
      setNotification({ message: 'Password must be at least 6 characters', type: 'error' });
      setChangingPassword(false);
      return;
    }

    try {
      await api.put('/profile/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });
      setPasswordResult('Password changed successfully!');
      setNotification({ message: 'Password changed successfully', type: 'success' });
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      const errorMsg =
        error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(', ')
          : error.response?.data?.message || 'Failed to change password';
      setPasswordResult(errorMsg);
      setNotification({ message: errorMsg, type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const uploadPicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotification({ message: 'Please select an image file', type: 'error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotification({ message: 'Image size must be less than 2MB', type: 'error' });
      return;
    }

    setUploadingPicture(true);
    const formData = new FormData();
    formData.append('picture', file);

    try {
      const response = await api.post('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setNotification({ message: 'Profile picture uploaded successfully', type: 'success' });
      
      // Update profile
      if (response.data.profile_picture) {
        setUser({ ...user, profile_picture: response.data.profile_picture });
      } else {
        loadProfile();
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to upload picture',
        type: 'error',
      });
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deletePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setDeletingPicture(true);
    try {
      await api.delete('/profile/picture');
      setNotification({ message: 'Profile picture deleted successfully', type: 'success' });
      setUser({ ...user, profile_picture: null });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to delete picture',
        type: 'error',
      });
    } finally {
      setDeletingPicture(false);
    }
  };

  const getRoleBadgeClass = () => {
    if (!user?.role) return 'status-badge';
    if (user.role === 'manager') return 'status-badge status-approved';
    if (user.role === 'staff') return 'status-badge status-active';
    return 'status-badge status-pending';
  };

  const profilePictureUrl = getProfilePictureUrl();

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <DashboardLayout
        navItems={navItems}
        title="Profile Settings"
        subtitle="Profile Settings"
      >
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-title">Profile Settings</div>
          <div className="top-bar-actions">
            <button className="btn btn-secondary" onClick={loadProfile}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Profile Header Card */}
          <div className="card card-highlighted">
            <div className="card-header">
              <h2 className="card-title">Profile Information</h2>
              <div className={getRoleBadgeClass()}>
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
              </div>
            </div>
            <div className="card-content">
              <div className="profile-header">
                <div className="profile-picture-container">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile Picture"
                      className="profile-picture-large"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="profile-picture-placeholder-large"
                    style={{ display: profilePictureUrl ? 'none' : 'flex' }}
                  >
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div className="profile-picture-actions">
                    <label
                      htmlFor="profile_picture_input"
                      className={`btn btn-sm btn-primary ${uploadingPicture ? 'loading' : ''}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                      </svg>
                      <span>Upload</span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="profile_picture_input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={uploadPicture}
                      disabled={uploadingPicture}
                    />
                    {profilePictureUrl && (
                      <button
                        className={`btn btn-sm btn-outline ${deletingPicture ? 'loading' : ''}`}
                        onClick={deletePicture}
                        disabled={deletingPicture}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="profile-info">
                  <h1>{user.name || user.full_name || 'No Name'}</h1>
                  <p>{user.email || 'No Email'}</p>
                  <div className="profile-meta">
                    {user.phone && (
                      <span>📞 {user.phone}</span>
                    )}
                    {user.position && (
                      <span>💼 {user.position}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Personal Information</h2>
              <div className="status-badge status-active">Editable</div>
            </div>
            <div className="card-content">
              <form className="profile-form" onSubmit={updateProfile}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile_name_input">
                      Full Name
                    </label>
                    <input
                      className="form-input"
                      id="profile_name_input"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile_email_input">
                      Email Address
                    </label>
                    <input
                      className="form-input"
                      id="profile_email_input"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  {user.phone !== undefined && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile_phone_input">
                        Phone Number
                      </label>
                      <input
                        className="form-input"
                        id="profile_phone_input"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                      />
                    </div>
                  )}
                  {user.position !== undefined && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="profile_position_input">
                        Position
                      </label>
                      <input
                        className="form-input"
                        id="profile_position_input"
                        type="text"
                        value={profileForm.position}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, position: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className={`btn btn-primary ${saving ? 'loading' : ''}`}
                  disabled={saving}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                  </svg>
                  <span>Save Changes</span>
                </button>
              </form>
              {profileResult && (
                <div
                  className={`form-result ${
                    profileResult.includes('successfully') ? 'success' : 'error'
                  }`}
                >
                  {profileResult}
                </div>
              )}
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Change Password</h2>
              <div className="status-badge status-pending">Security</div>
            </div>
            <div className="card-content">
              <form className="profile-form" onSubmit={changePassword}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="current_password">
                      Current Password
                    </label>
                    <input
                      className="form-input"
                      id="current_password"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="new_password">
                      New Password
                    </label>
                    <input
                      className="form-input"
                      id="new_password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm_password">
                      Confirm New Password
                    </label>
                    <input
                      className="form-input"
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className={`btn btn-primary ${changingPassword ? 'loading' : ''}`}
                  disabled={changingPassword}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                  <span>Change Password</span>
                </button>
              </form>
              {passwordResult && (
                <div
                  className={`form-result ${
                    passwordResult.includes('successfully') ? 'success' : 'error'
                  }`}
                >
                  {passwordResult}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

