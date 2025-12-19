'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setToken, removeToken, redirectByRole } from '@/lib/auth';
import Notification from '@/components/Notification';

export default function AuthPage() {
  const router = useRouter();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  // Registration form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('api_token') : null;
      if (token) {
        try {
          const response = await api.get('/user');
          if (response.data.role) {
            router.push(redirectByRole(response.data.role));
          }
        } catch (error) {
          removeToken();
        }
      }
    };
    checkAuth();
  }, [router]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regData.name || !regData.email || !regData.password) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/register', regData);
      if (response.data.token) {
        setToken(response.data.token);
        showNotification('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          const userRole = response.data.user?.role;
          router.push(redirectByRole(userRole));
        }, 1500);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Registration failed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      showNotification('Please enter email and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/login', loginData);
      if (response.data.token) {
        setToken(response.data.token);
        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          const userRole = response.data.user?.role;
          router.push(redirectByRole(userRole));
        }, 1500);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Login failed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGetUser = async () => {
    try {
      const response = await api.get('/user');
      showNotification(`Welcome, ${response.data.name}! Role: ${response.data.role}`, 'success');
    } catch (error) {
      showNotification('Not authenticated', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      removeToken();
      showNotification('Logged out successfully', 'success');
      setLoginData({ email: '', password: '' });
    } catch (error) {
      showNotification('Network error during logout', 'error');
    }
  };

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="auth-container">
        <div className="auth-header">
          <h1>GoMo</h1>
          <p>Professional vehicle rental management platform</p>
        </div>

        <div className="auth-content">
          {/* Registration Card */}
          <div className="auth-card auth-card-register">
            <div className="card-header">
              <h2>Create Account</h2>
              <div className="status-badge status-pending">New User</div>
            </div>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg_name">
                  Full Name
                </label>
                <input
                  className="form-input"
                  id="reg_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg_email">
                  Email Address
                </label>
                <input
                  className="form-input"
                  id="reg_email"
                  type="email"
                  placeholder="Enter your email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg_password">
                  Password
                </label>
                <input
                  className="form-input"
                  id="reg_password"
                  type="password"
                  placeholder="Create a secure password"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-info">
                <p className="info-text">
                  Public registration is available for renters only. Staff and manager accounts must be created by administrators.
                </p>
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                <span>Create Account</span>
              </button>
            </form>
          </div>

          {/* Login Card */}
          <div className="auth-card">
            <div className="card-header">
              <h2>Sign In</h2>
              <div className="status-badge status-active">Existing User</div>
            </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="login_email">
                  Email Address
                </label>
                <input
                  className="form-input"
                  id="login_email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login_password">
                  Password
                </label>
                <input
                  className="form-input"
                  id="login_password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                <span>Sign In</span>
              </button>
            </form>
          </div>

          {/* Account Actions Card */}
          <div className="auth-card card-highlighted">
            <div className="card-header">
              <h2>Account Actions</h2>
              <div className="status-badge status-completed">Authenticated</div>
            </div>

            <div className="auth-actions">
              <button className="btn btn-secondary" onClick={handleGetUser}>
                <span>Get User Info</span>
              </button>
              <button className="btn btn-outline" onClick={handleLogout}>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          <p>&copy; 2024 Vehicle Rental System. Professional vehicle management platform.</p>
        </div>
      </div>
    </>
  );
}

