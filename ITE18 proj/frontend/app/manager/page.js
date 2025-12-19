'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getToken, removeToken, redirectByRole } from '@/lib/auth';
import Notification from '@/components/Notification';
import DashboardLayout from '@/components/DashboardLayout';

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalRevenue: '₱0.00',
    activeRentals: 0,
    availableVehicles: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    monthlyRevenue: '₱0.00',
  });

  // Charts
  const revenueChartRef = useRef(null);
  const usageChartRef = useRef(null);
  const [revenueData, setRevenueData] = useState([]);
  const [usageData, setUsageData] = useState([]);

  // Tables
  const [activeRentals, setActiveRentals] = useState([]);
  const [historyRentals, setHistoryRentals] = useState([]);

  // Staff creation form
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Modals
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showRenterModal, setShowRenterModal] = useState(false);
  const [showRentalDetailsModal, setShowRentalDetailsModal] = useState(false);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const response = await api.get('/user');
        const userData = response.data;
        
        if (userData.role !== 'manager') {
          router.push(redirectByRole(userData.role));
          return;
        }

        setUser(userData);
        refreshAll();
      } catch (error) {
        removeToken();
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Draw bar chart
  const drawBar = (canvas, labels, values) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);
    ctx.clearRect(0, 0, w, h);
    
    if (values.length === 0) return;
    
    const max = Math.max(1, ...values);
    const pad = 24;
    const barW = (w - pad * 2) / Math.max(1, values.length);
    
    ctx.fillStyle = 'var(--deep-red)';
    values.forEach((v, i) => {
      const bh = (v / max) * (h - pad * 2);
      const x = pad + i * barW;
      const y = h - pad - bh;
      ctx.fillRect(x + 4, y, barW - 8, bh);
    });
    
    ctx.fillStyle = 'var(--dark-charcoal)';
    ctx.font = '12px Inter, system-ui, Arial';
    labels.forEach((l, i) => {
      const x = pad + i * barW + barW / 2;
      ctx.save();
      ctx.translate(x, h - 6);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(String(l), 0, 0);
      ctx.restore();
    });
  };

  // Load revenue chart
  const loadRevenue = async () => {
    try {
      const response = await api.get('/reports/revenue');
      const data = response.data;
      setRevenueData(data);
      
      if (revenueChartRef.current) {
        drawBar(
          revenueChartRef.current,
          data.map((r) => r.month),
          data.map((r) => Number(r.total))
        );
      }
      
      setNotification({
        message: `Revenue data loaded: ${data.length} months`,
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to load revenue data', type: 'error' });
    }
  };

  // Load usage chart
  const loadUsage = async () => {
    try {
      const response = await api.get('/reports/usage');
      const data = response.data;
      setUsageData(data);
      
      if (usageChartRef.current) {
        drawBar(
          usageChartRef.current,
          data.map((r) => r.vehicle_id),
          data.map((r) => Number(r.rentals_count))
        );
      }
      
      setNotification({
        message: `Usage data loaded: ${data.length} vehicles`,
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to load usage data', type: 'error' });
    }
  };

  // Load active rentals
  const loadActive = async () => {
    try {
      const response = await api.get('/reports/active');
      const data = response.data;
      setActiveRentals(data);
      
      setNotification({
        message: `Active rentals loaded: ${data.length} rentals`,
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to load active rentals', type: 'error' });
    }
  };

  // Load history
  const loadHistory = async () => {
    try {
      const response = await api.get('/reports/history');
      const data = response.data;
      setHistoryRentals(data);
      setHistoryCount(data.length);
      
      setNotification({
        message: `Rental history loaded: ${data.length} records`,
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to load rental history', type: 'error' });
    }
  };

  // Load quick stats
  const loadQuickStats = async () => {
    try {
      const [revenueRes, activeRes, vehiclesRes, rentalsRes, rentersRes, employeesRes] =
        await Promise.all([
          api.get('/reports/revenue'),
          api.get('/reports/active'),
          api.get('/vehicles'),
          api.get('/rentals'),
          api.get('/renters'),
          api.get('/employees'),
        ]);

      // Calculate Total Revenue (last 12 months)
      const revenueData = revenueRes.data;
      const totalRevenue = revenueData.reduce((sum, r) => sum + Number(r.total || 0), 0);
      
      // Calculate This Month Revenue
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyRevenue = revenueData
        .filter((r) => r.month === currentMonth)
        .reduce((sum, r) => sum + Number(r.total || 0), 0);

      // Count Active Rentals
      const activeData = activeRes.data;
      
      // Count Available Vehicles
      const vehiclesData = vehiclesRes.data;
      const availableCount = vehiclesData.filter((v) => v.status === 'available').length;

      // Count Pending Approvals
      const rentalsData = rentalsRes.data;
      const pendingCount = rentalsData.filter((r) => r.status === 'pending').length;

      // Count Total Users
      const rentersData = rentersRes.data;
      const employeesData = employeesRes.data;
      const totalUsers = (rentersData?.length || 0) + (employeesData?.length || 0);

      setStats({
        totalRevenue: `₱${totalRevenue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        activeRentals: activeData?.length || 0,
        availableVehicles: availableCount || 0,
        pendingApprovals: pendingCount || 0,
        totalUsers: totalUsers || 0,
        monthlyRevenue: `₱${monthlyRevenue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const refreshAll = async () => {
    setNotification({ message: 'Refreshing all data...', type: 'info' });
    await Promise.all([loadRevenue(), loadUsage(), loadActive(), loadHistory()]);
    loadQuickStats();
  };

  // Create staff account
  const createStaff = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      setNotification({ message: 'Please fill in all fields', type: 'warning' });
      return;
    }

    setCreatingStaff(true);
    try {
      const response = await api.post('/staff/create', staffForm);
      setNotification({
        message: `Staff account created successfully!`,
        type: 'success',
      });
      setStaffForm({ name: '', email: '', password: '', role: 'staff' });
    } catch (error) {
      const errorMsg =
        error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(', ')
          : error.response?.data?.message || 'Failed to create staff account';
      setNotification({ message: errorMsg, type: 'error' });
    } finally {
      setCreatingStaff(false);
    }
  };

  // Show renter details
  const showRenterDetails = async (renterId) => {
    try {
      const response = await api.get(`/renters/${renterId}`);
      setSelectedRenter(response.data);
      setShowRenterModal(true);
    } catch (error) {
      setNotification({ message: 'Failed to load renter details', type: 'error' });
    }
  };

  // Show rental details
  const showRentalDetails = (rental) => {
    setSelectedRental(rental);
    setShowRentalDetailsModal(true);
  };

  // Delete rental history
  const deleteRentalHistory = async (rentalId) => {
    if (!confirm('Are you sure you want to delete this rental record? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/rentals/${rentalId}`);
      setNotification({ message: 'Rental deleted successfully', type: 'success' });
      loadHistory();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to delete rental',
        type: 'error',
      });
    }
  };

  // Clear all history
  const clearAllHistory = async () => {
    try {
      const response = await api.delete('/reports/history/clear');
      setNotification({
        message: `All rental history cleared (${response.data.deleted_count || 0} records deleted)`,
        type: 'success',
      });
      setShowClearHistoryModal(false);
      loadHistory();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to clear history',
        type: 'error',
      });
    }
  };

  const formatDateRange = (start, end) => {
    const startDate = new Date(start).toLocaleDateString();
    const endDate = new Date(end).toLocaleDateString();
    return `${startDate} - ${endDate}`;
  };

  const navItems = [
    {
      section: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      onClick: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        refreshAll();
      },
    },
    {
      section: 'reports',
      label: 'Reports',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      onClick: () => {
        const element = document.getElementById('section-reports');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        loadRevenue();
      },
    },
    {
      section: 'analytics',
      label: 'Analytics',
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      onClick: () => {
        const element = document.getElementById('section-analytics');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        loadUsage();
      },
    },
    {
      section: 'history',
      label: 'History',
      icon: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
      onClick: () => {
        const element = document.getElementById('section-history');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        loadHistory();
      },
    },
    {
      section: 'users',
      label: 'Users',
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
      onClick: () => {
        router.push('/users');
      },
    },
  ];

  // Redraw charts when data changes
  useEffect(() => {
    if (revenueData.length > 0 && revenueChartRef.current) {
      drawBar(
        revenueChartRef.current,
        revenueData.map((r) => r.month),
        revenueData.map((r) => Number(r.total))
      );
    }
  }, [revenueData]);

  useEffect(() => {
    if (usageData.length > 0 && usageChartRef.current) {
      drawBar(
        usageChartRef.current,
        usageData.map((r) => r.vehicle_id),
        usageData.map((r) => Number(r.rentals_count))
      );
    }
  }, [usageData]);

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
        title="Manager Reports"
        subtitle="Manager Dashboard"
      >
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-title">Manager Reports</div>
          <div className="top-bar-actions">
            <button className="btn btn-secondary" onClick={refreshAll}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Quick Stats Dashboard */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-revenue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.38-1.9 1.38-1.39 0-2.24-.66-2.5-1.9H6.04c.26 2.22 1.86 3.2 3.96 3.66V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value">{stats.totalRevenue}</div>
                <div className="stat-period">Last 12 Months</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-rentals">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Active Rentals</div>
                <div className="stat-value">{stats.activeRentals}</div>
                <div className="stat-period">Currently Rented</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-vehicles">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Available Vehicles</div>
                <div className="stat-value">{stats.availableVehicles}</div>
                <div className="stat-period">Ready to Rent</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-pending">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Pending Approvals</div>
                <div className="stat-value">{stats.pendingApprovals}</div>
                <div className="stat-period">Awaiting Review</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-users">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-period">Renters + Staff</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-monthly">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">This Month Revenue</div>
                <div className="stat-value">{stats.monthlyRevenue}</div>
                <div className="stat-period">Current Month</div>
              </div>
            </div>
          </div>

          {/* Create Staff Account Card */}
          <div className="card card-highlighted">
            <div className="card-header">
              <h2 className="card-title">Create Staff Account</h2>
              <div className="status-badge status-pending">Manager Only</div>
            </div>
            <div className="card-content">
              <form
                className="staff-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  createStaff();
                }}
              >
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="staff_name">
                      Full Name
                    </label>
                    <input
                      className="form-input"
                      id="staff_name"
                      placeholder="Enter full name"
                      value={staffForm.name}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="staff_email">
                      Email Address
                    </label>
                    <input
                      className="form-input"
                      id="staff_email"
                      type="email"
                      placeholder="Enter email"
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="staff_password">
                      Password
                    </label>
                    <input
                      className="form-input"
                      id="staff_password"
                      type="password"
                      placeholder="Create password"
                      value={staffForm.password}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="staff_role">
                      Role
                    </label>
                    <select
                      className="form-select"
                      id="staff_role"
                      value={staffForm.role}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, role: e.target.value })
                      }
                      required
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingStaff}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  <span>{creatingStaff ? 'Creating...' : 'Create Staff Account'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Revenue Chart Card */}
          <div className="card" id="section-reports">
            <div className="card-header">
              <h2 className="card-title">Revenue Analysis</h2>
              <div className="status-badge status-active">Last 12 Months</div>
            </div>
            <div className="card-content">
              <div className="chart-container">
                <canvas ref={revenueChartRef} id="rev_chart"></canvas>
              </div>
            </div>
          </div>

          {/* Vehicle Usage Chart Card */}
          <div className="card" id="section-analytics">
            <div className="card-header">
              <h2 className="card-title">Vehicle Usage Statistics</h2>
              <div className="status-badge status-pending">Rental Count</div>
            </div>
            <div className="card-content">
              <div className="chart-container">
                <canvas ref={usageChartRef} id="usage_chart"></canvas>
              </div>
            </div>
          </div>

          {/* Active Rentals Table Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Active Rentals</h2>
              <div className="status-badge status-approved">Live Data</div>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table" id="active_table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Rental ID</th>
                      <th style={{ textAlign: 'left' }}>Vehicle</th>
                      <th style={{ textAlign: 'left' }}>Renter</th>
                      <th style={{ textAlign: 'left' }}>Status</th>
                      <th style={{ textAlign: 'left' }}>Duration</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRentals.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No active rentals
                        </td>
                      </tr>
                    ) : (
                      activeRentals.map((r) => {
                        const statusClass =
                          r.status === 'approved'
                            ? 'approved'
                            : r.status === 'paid' || r.status === 'rented'
                            ? 'active'
                            : 'pending';
                        return (
                          <tr key={r.rental_id}>
                            <td>#{r.rental_id}</td>
                            <td>Vehicle {r.vehicle_id}</td>
                            <td>Renter {r.renter_id}</td>
                            <td>
                              <span className={`status-badge status-${statusClass}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>{formatDateRange(r.start_date, r.end_date)}</td>
                            <td style={{ textAlign: 'right' }}>₱{parseFloat(r.total_cost).toFixed(2)}</td>
                            <td className="table-actions">
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => showRenterDetails(r.renter_id)}
                              >
                                View Renter
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Rental History Table Card */}
          <div className="card" id="section-history">
            <div className="card-header">
              <h2 className="card-title">Rental History</h2>
              <div className="card-header-actions">
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => setShowClearHistoryModal(true)}
                  disabled={historyCount === 0}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  <span>Clear All History</span>
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table" id="history_table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Rental ID</th>
                      <th style={{ textAlign: 'left' }}>Vehicle</th>
                      <th style={{ textAlign: 'left' }}>Renter</th>
                      <th style={{ textAlign: 'left' }}>Status</th>
                      <th style={{ textAlign: 'left' }}>Duration</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRentals.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No rental history found
                        </td>
                      </tr>
                    ) : (
                      historyRentals.map((r) => {
                        const statusClass =
                          r.status === 'returned'
                            ? 'completed'
                            : r.status === 'rejected'
                            ? 'error'
                            : r.status === 'cancelled'
                            ? 'pending'
                            : 'pending';
                        return (
                          <tr key={r.rental_id}>
                            <td>#{r.rental_id}</td>
                            <td>Vehicle {r.vehicle_id}</td>
                            <td>Renter {r.renter_id}</td>
                            <td>
                              <span className={`status-badge status-${statusClass}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>{formatDateRange(r.start_date, r.end_date)}</td>
                            <td style={{ textAlign: 'right' }}>₱{parseFloat(r.total_cost).toFixed(2)}</td>
                            <td className="table-actions">
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => showRentalDetails(r)}
                                title="View renter and approver details"
                                type="button"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                </svg>
                              </button>
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => deleteRentalHistory(r.rental_id)}
                                title="Delete this rental"
                                type="button"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Clear History Confirmation Modal */}
      {showClearHistoryModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') {
              setShowClearHistoryModal(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">⚠️ Clear All Rental History</h2>
              <button
                className="modal-close"
                onClick={() => setShowClearHistoryModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-message">
                <p className="warning-text">
                  Are you sure you want to delete <strong>ALL</strong> rental history?
                </p>
                <p className="warning-detail">
                  This action cannot be undone. All records with status "returned", "rejected", or
                  "cancelled" will be permanently deleted.
                </p>
                <div className="warning-count">
                  <span>
                    This will delete <strong>{historyCount}</strong> rental record(s)
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowClearHistoryModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={clearAllHistory}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                <span>Confirm Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renter Details Modal */}
      {showRenterModal && selectedRenter && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') {
              setShowRenterModal(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Renter Details</h2>
              <button className="modal-close" onClick={() => setShowRenterModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="renter-info">
                <div className="renter-info-item">
                  <div className="renter-info-label">Full Name</div>
                  <div className="renter-info-value">
                    {selectedRenter.full_name || 'N/A'}
                  </div>
                </div>
                <div className="renter-info-item">
                  <div className="renter-info-label">Email</div>
                  <div className="renter-info-value">{selectedRenter.email || 'N/A'}</div>
                </div>
                <div className="renter-info-item">
                  <div className="renter-info-label">Phone</div>
                  <div className="renter-info-value">{selectedRenter.phone || 'N/A'}</div>
                </div>
                <div className="renter-info-item">
                  <div className="renter-info-label">Account Created</div>
                  <div className="renter-info-value">
                    {selectedRenter.created_at
                      ? new Date(selectedRenter.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowRenterModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rental Details Modal */}
      {showRentalDetailsModal && selectedRental && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') {
              setShowRentalDetailsModal(false);
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Rental Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowRentalDetailsModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="rental-details-content">
                <div className="details-section">
                  <h3 className="details-section-title">Renter Information</h3>
                  <div className="details-info-item">
                    <div className="details-info-label">Full Name</div>
                    <div className="details-info-value">
                      {selectedRental.renter?.full_name || '-'}
                    </div>
                  </div>
                  <div className="details-info-item">
                    <div className="details-info-label">Email</div>
                    <div className="details-info-value">
                      {selectedRental.renter?.email || '-'}
                    </div>
                  </div>
                  <div className="details-info-item">
                    <div className="details-info-label">Phone</div>
                    <div className="details-info-value">
                      {selectedRental.renter?.phone || '-'}
                    </div>
                  </div>
                </div>
                <div className="details-section">
                  <h3 className="details-section-title">Approved By</h3>
                  <div className="details-info-item">
                    <div className="details-info-label">Full Name</div>
                    <div
                      className={`details-info-value ${
                        !selectedRental.approved_by?.full_name ? 'not-approved' : ''
                      }`}
                    >
                      {selectedRental.approved_by?.full_name || 'Not Approved'}
                    </div>
                  </div>
                  <div className="details-info-item">
                    <div className="details-info-label">Position</div>
                    <div className="details-info-value">
                      {selectedRental.approved_by?.position || 'N/A'}
                    </div>
                  </div>
                  <div className="details-info-item">
                    <div className="details-info-label">Role</div>
                    <div className="details-info-value">
                      {selectedRental.approved_by?.role
                        ? selectedRental.approved_by.role.charAt(0).toUpperCase() +
                          selectedRental.approved_by.role.slice(1)
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowRentalDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
