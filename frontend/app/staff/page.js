'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getToken, removeToken, redirectByRole } from '@/lib/auth';
import Notification from '@/components/Notification';
import DashboardLayout from '@/components/DashboardLayout';

export default function StaffPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [pendingRentals, setPendingRentals] = useState([]);
  const [approvedRentals, setApprovedRentals] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(false);

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
        
        // Check if user is staff or manager
        if (userData.role !== 'staff' && userData.role !== 'manager') {
          router.push(redirectByRole(userData.role));
          return;
        }

        setUser(userData);
        fetchAll();
      } catch (error) {
        removeToken();
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const formatDateRange = (start, end) => {
    const startDate = new Date(start).toLocaleDateString();
    const endDate = new Date(end).toLocaleDateString();
    return `${startDate} - ${endDate}`;
  };

  const fetchAll = async () => {
    setLoadingRentals(true);
    try {
      const response = await api.get('/rentals');
      const rentals = response.data;

      const pending = rentals.filter((r) => r.status === 'pending');
      const approved = rentals.filter((r) => ['approved', 'paid', 'rented'].includes(r.status));

      setPendingRentals(pending);
      setApprovedRentals(approved);
      
      setNotification({
        message: `Loaded ${pending.length} pending and ${approved.length} approved rentals`,
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to load rentals', type: 'error' });
    } finally {
      setLoadingRentals(false);
    }
  };

  const approve = async (id) => {
    try {
      const response = await api.post(`/rentals/${id}/approve`);
      setNotification({ message: 'Rental approved successfully!', type: 'success' });
      fetchAll();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to approve rental',
        type: 'error',
      });
    }
  };

  const rejectRental = async (id) => {
    try {
      const response = await api.post(`/rentals/${id}/reject`);
      setNotification({ message: 'Rental rejected successfully!', type: 'success' });
      fetchAll();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to reject rental',
        type: 'error',
      });
    }
  };

  const markReturned = async (id) => {
    try {
      const response = await api.post(`/rentals/${id}/return`);
      setNotification({ message: 'Rental marked as returned successfully!', type: 'success' });
      fetchAll();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Failed to mark rental as returned',
        type: 'error',
      });
    }
  };

  const navItems = [
    {
      section: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      onClick: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchAll();
      },
    },
    {
      section: 'rentals',
      label: 'Rentals',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      onClick: () => {
        const element = document.getElementById('section-rentals');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        fetchAll();
      },
    },
    {
      section: 'vehicles',
      label: 'Vehicles',
      icon: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
      onClick: () => {
        router.push('/vehicles');
      },
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
        title="Staff Dashboard"
        subtitle="Staff Dashboard"
      >
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-title">Staff Dashboard</div>
          <div className="top-bar-actions">
            <button className="btn btn-secondary" onClick={fetchAll} disabled={loadingRentals}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>Refresh Rentals</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Pending Rentals Card */}
          <div className="card" id="section-rentals">
            <div className="card-header">
              <h2 className="card-title">Pending Rental Requests</h2>
              <div className="status-badge status-pending">Awaiting Approval</div>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table" id="pending_table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Rental ID</th>
                      <th style={{ textAlign: 'left' }}>Renter</th>
                      <th style={{ textAlign: 'left' }}>Vehicle</th>
                      <th style={{ textAlign: 'left' }}>Duration</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                      <th style={{ textAlign: 'left' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRentals ? (
                      <tr>
                        <td colSpan="7" className="text-center">Loading...</td>
                      </tr>
                    ) : pendingRentals.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">No pending rentals</td>
                      </tr>
                    ) : (
                      pendingRentals.map((r) => (
                        <tr key={r.rental_id}>
                          <td>#{r.rental_id}</td>
                          <td>Renter {r.renter_id}</td>
                          <td>Vehicle {r.vehicle_id}</td>
                          <td>{formatDateRange(r.start_date, r.end_date)}</td>
                          <td style={{ textAlign: 'right' }}>₱{parseFloat(r.total_cost).toFixed(2)}</td>
                          <td>
                            <span className="status-badge status-pending">{r.status}</span>
                          </td>
                          <td className="table-actions">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => approve(r.rental_id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => rejectRental(r.rental_id)}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Approved Rentals Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Approved Rentals (Ready for Return)</h2>
              <div className="status-badge status-approved">Active Rentals</div>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table" id="approved_table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Rental ID</th>
                      <th style={{ textAlign: 'left' }}>Renter</th>
                      <th style={{ textAlign: 'left' }}>Vehicle</th>
                      <th style={{ textAlign: 'left' }}>Duration</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                      <th style={{ textAlign: 'left' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRentals ? (
                      <tr>
                        <td colSpan="7" className="text-center">Loading...</td>
                      </tr>
                    ) : approvedRentals.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">No approved rentals</td>
                      </tr>
                    ) : (
                      approvedRentals.map((r) => {
                        const statusClass =
                          r.status === 'approved'
                            ? 'approved'
                            : r.status === 'paid' || r.status === 'rented'
                            ? 'active'
                            : 'pending';
                        return (
                          <tr key={r.rental_id}>
                            <td>#{r.rental_id}</td>
                            <td>Renter {r.renter_id}</td>
                            <td>Vehicle {r.vehicle_id}</td>
                            <td>{formatDateRange(r.start_date, r.end_date)}</td>
                            <td style={{ textAlign: 'right' }}>₱{parseFloat(r.total_cost).toFixed(2)}</td>
                            <td>
                              <span className={`status-badge status-${statusClass}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="table-actions">
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => markReturned(r.rental_id)}
                              >
                                Mark Returned
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
    </>
  );
}
