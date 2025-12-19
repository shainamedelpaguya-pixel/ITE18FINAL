'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getToken, removeToken, redirectByRole } from '@/lib/auth';
import Notification from '@/components/Notification';
import DashboardLayout from '@/components/DashboardLayout';

export default function UsersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState(false);

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
        loadUsers();
      } catch (error) {
        removeToken();
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    filterUsers();
  }, [users, activeTab, searchQuery]);

  const filterUsers = () => {
    let filtered = users;

    // Filter by tab
    if (activeTab === 'renters') {
      filtered = filtered.filter((u) => u.userType === 'renter');
    } else if (activeTab === 'staff') {
      filtered = filtered.filter((u) => u.userType === 'employee');
    }

    // Filter by search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.role.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const [rentersRes, employeesRes] = await Promise.all([
        api.get('/renters'),
        api.get('/employees'),
      ]);

      const renters = rentersRes.data || [];
      const employees = employeesRes.data || [];

      // Combine and format users
      const allUsers = [
        ...renters.map((r) => ({
          id: r.renter_id,
          name: r.full_name,
          email: r.email,
          phone: r.phone || '-',
          type: 'Renter',
          role: 'Renter',
          userType: 'renter',
          created: r.created_at,
        })),
        ...employees.map((e) => ({
          id: e.employee_id,
          name: e.full_name,
          email: e.username + '@system',
          phone: '-',
          type: 'Employee',
          role: e.role
            ? e.role.charAt(0).toUpperCase() + e.role.slice(1)
            : e.position || 'Staff',
          userType: 'employee',
          created: e.created_at,
        })),
      ];

      setUsers(allUsers);
    } catch (error) {
      setNotification({ message: 'Failed to load users', type: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const showUserDetails = async (userId, userType) => {
    setShowUserModal(true);
    setLoadingUserDetails(true);
    setUserDetailsError(false);
    setSelectedUser(null);

    try {
      const endpoint = userType === 'renter' ? `/renters/${userId}` : `/employees/${userId}`;
      const response = await api.get(endpoint);
      const userData = response.data;

      const details =
        userType === 'renter'
          ? {
              'Full Name': userData.full_name,
              Email: userData.email,
              Phone: userData.phone || 'N/A',
              Username: userData.username,
              'Account Created': new Date(userData.created_at).toLocaleDateString(),
            }
          : {
              'Full Name': userData.full_name,
              Position: userData.position || 'N/A',
              Role: userData.role
                ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                : 'Staff',
              Username: userData.username,
              'Last Login': userData.last_login
                ? new Date(userData.last_login).toLocaleDateString()
                : 'Never',
            };

      setSelectedUser({ ...userData, details, userType });
    } catch (error) {
      setUserDetailsError(true);
      setNotification({ message: 'Failed to load user details', type: 'error' });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const deleteUser = async (userId, userType) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const endpoint = userType === 'renter' ? `/renters/${userId}` : `/employees/${userId}`;
      await api.delete(endpoint);
      setNotification({ message: 'User deleted successfully', type: 'success' });
      setShowUserModal(false);
      loadUsers();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to delete user',
        type: 'error',
      });
    }
  };

  const navItems = [
    {
      section: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      onClick: () => router.push('/manager'),
    },
    {
      section: 'users',
      label: 'Users',
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    },
  ];

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
        title="User Management"
        subtitle="Manager Dashboard"
      >
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-title">User Management</div>
          <div className="top-bar-actions">
            <button className="btn btn-secondary" onClick={loadUsers} disabled={loadingUsers}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* User Management Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">User Management</h2>
              <div className="card-header-actions">
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
              </div>
            </div>
            <div className="card-content">
              <div className="user-tabs">
                <button
                  className={`user-tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Users
                </button>
                <button
                  className={`user-tab ${activeTab === 'renters' ? 'active' : ''}`}
                  onClick={() => setActiveTab('renters')}
                >
                  Renters
                </button>
                <button
                  className={`user-tab ${activeTab === 'staff' ? 'active' : ''}`}
                  onClick={() => setActiveTab('staff')}
                >
                  Staff & Managers
                </button>
              </div>
              <div className="table-container">
                <table className="table" id="users_table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Name</th>
                      <th style={{ textAlign: 'left' }}>Email</th>
                      <th style={{ textAlign: 'left' }}>Type</th>
                      <th style={{ textAlign: 'left' }}>Role/Position</th>
                      <th style={{ textAlign: 'left' }}>Phone</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={`${user.userType}-${user.id}`}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span
                              className={`status-badge status-${
                                user.userType === 'renter' ? 'pending' : 'active'
                              }`}
                            >
                              {user.type}
                            </span>
                          </td>
                          <td>{user.role}</td>
                          <td>{user.phone}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => showUserDetails(user.id, user.userType)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                </svg>
                                <span>View</span>
                              </button>
                              {user.userType === 'renter' && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`
                                      )
                                    ) {
                                      deleteUser(user.id, user.userType);
                                    }
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* User Details Modal */}
      {showUserModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') {
              setShowUserModal(false);
            }
          }}
        >
          <div className="modal-content user-details-modal">
            <div className="modal-header">
              <h2 className="modal-title">User Details</h2>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {loadingUserDetails ? (
                <div className="renter-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading user details...</p>
                </div>
              ) : userDetailsError ? (
                <div className="renter-error">
                  <p>Failed to load user details. Please try again.</p>
                </div>
              ) : selectedUser && selectedUser.details ? (
                <div className="user-details-grid">
                  {Object.entries(selectedUser.details).map(([label, value]) => (
                    <div key={label} className="user-detail-item">
                      <div className="user-detail-label">{label}</div>
                      <div className="user-detail-value">{value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              {selectedUser && selectedUser.userType === 'renter' && (
                <button
                  className="btn btn-outline"
                  onClick={() => deleteUser(selectedUser.id || selectedUser.renter_id, selectedUser.userType)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  <span>Delete User</span>
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setShowUserModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

