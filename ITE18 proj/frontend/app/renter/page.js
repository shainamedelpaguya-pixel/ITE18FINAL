'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { getToken, removeToken, redirectByRole } from '@/lib/auth';
import Notification from '@/components/Notification';
import DashboardLayout from '@/components/DashboardLayout';

export default function RenterPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [myRentals, setMyRentals] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPaymentRental, setCurrentPaymentRental] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Rental form state
  const [rentalForm, setRentalForm] = useState({
    vehicle_id: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      const response = await api.get('/user');
      const userData = response.data;

      if (userData.role !== 'renter') {
        router.push(redirectByRole(userData.role));
        return;
      }

      setUser(userData);
    } catch (error) {
      removeToken();
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      showNotification('Failed to load vehicles', 'error');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    setRentalForm({ ...rentalForm, vehicle_id: vehicleId.toString() });
    showNotification(`Vehicle ${vehicleId} selected`, 'success', 2000);
  };

  const handleCreateRental = async (e) => {
    e.preventDefault();
    if (!rentalForm.vehicle_id || !rentalForm.start_date || !rentalForm.end_date) {
      showNotification('Please fill in all fields', 'warning');
      return;
    }

    try {
      const response = await api.post('/rentals/request', {
        vehicle_id: parseInt(rentalForm.vehicle_id, 10),
        start_date: rentalForm.start_date,
        end_date: rentalForm.end_date,
      });

      if (response.data) {
        showNotification('Rental request created successfully!', 'success');
        setRentalForm({ vehicle_id: '', start_date: '', end_date: '' });
        loadMyRentals();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Failed to create rental request',
        'error'
      );
    }
  };

  const loadMyRentals = async () => {
    setLoadingRentals(true);
    try {
      const userRes = await api.get('/user');
      const rentersRes = await api.get('/renterList');
      const rentalsRes = await api.get('/rentals');

      const renter = rentersRes.data.find((r) => r.email === userRes.data.email);
      if (!renter) {
        showNotification('No renter profile found', 'error');
        return;
      }

      const my = rentalsRes.data.filter((r) => r.renter_id === renter.renter_id);
      setMyRentals(my);
      showNotification(`Loaded ${my.length} rental(s)`, 'success', 2000);
    } catch (error) {
      showNotification('Failed to load rentals', 'error');
    } finally {
      setLoadingRentals(false);
    }
  };

  const handlePayRental = async (rentalId) => {
    try {
      const response = await api.get(`/rentals/${rentalId}`);
      setCurrentPaymentRental(response.data);
      setPaymentModalOpen(true);
    } catch (error) {
      showNotification('Failed to load rental details', 'error');
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentPaymentRental) {
      showNotification('No rental selected for payment', 'error');
      return;
    }

    setProcessingPayment(true);
    try {
      const response = await api.post(`/rentals/${currentPaymentRental.rental_id}/pay`, {
        method: paymentMethod,
      });

      if (response.data) {
        showNotification(`Payment processed successfully via ${paymentMethod}!`, 'success');
        setPaymentModalOpen(false);
        setCurrentPaymentRental(null);
        setPaymentMethod('cash');
        loadMyRentals();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Payment failed',
        'error'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelRental = async (rentalId) => {
    try {
      const response = await api.post(`/rentals/${rentalId}/cancel`, {});
      if (response.data) {
        showNotification('Rental cancelled successfully!', 'success');
        loadMyRentals();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Cancellation failed',
        'error'
      );
    }
  };

  const formatDateRange = (start, end) => {
    const startDate = new Date(start).toLocaleDateString();
    const endDate = new Date(end).toLocaleDateString();
    return `${startDate} - ${endDate}`;
  };

  const getStatusClass = (status) => {
    if (status === 'pending') return 'pending';
    if (status === 'approved') return 'approved';
    if (status === 'paid' || status === 'rented') return 'active';
    if (status === 'returned') return 'completed';
    return 'pending';
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `http://localhost:8000${imageUrl}`;
    return `http://localhost:8000/storage/vehicles/${imageUrl}`;
  };

  const navItems = [
    {
      section: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    },
    {
      section: 'vehicles',
      label: 'Browse Vehicles',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
      onClick: () => {
        const element = document.getElementById('section-vehicles');
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        fetchVehicles();
      },
    },
    {
      section: 'rentals',
      label: 'My Rentals',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      onClick: () => {
        const element = document.getElementById('section-rentals');
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        loadMyRentals();
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      <DashboardLayout navItems={navItems} title="Renter Dashboard" subtitle="Renter Dashboard">
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-title">Renter Dashboard</div>
          <div className="top-bar-actions">
            <button className="btn btn-secondary" onClick={fetchVehicles} disabled={loadingVehicles}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              <span>Refresh Vehicles</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Available Vehicles Card */}
          <div className="card" id="section-vehicles">
            <div className="card-header">
              <h2 className="card-title">Available Vehicles</h2>
              <div className="status-badge status-active">Ready to Rent</div>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Type</th>
                      <th>Model</th>
                      <th>License Plate</th>
                      <th>Daily Rate</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingVehicles ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                          Loading vehicles...
                        </td>
                      </tr>
                    ) : vehicles.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                          No vehicles available
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((v) => {
                        const imageUrl = getImageUrl(v.image_url);
                        return (
                          <tr key={v.vehicle_id}>
                            <td>
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={v.model}
                                  className="vehicle-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div
                                className="vehicle-image-placeholder"
                                style={{ display: imageUrl ? 'none' : 'flex' }}
                              >
                                No Image
                              </div>
                            </td>
                            <td>{v.type}</td>
                            <td>{v.model}</td>
                            <td>{v.plate_number}</td>
                            <td>₱{parseFloat(v.price_per_day || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td>
                              <span className={`status-badge status-${v.status === 'available' ? 'active' : 'pending'}`}>
                                {v.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleSelectVehicle(v.vehicle_id)}
                              >
                                Select
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

          {/* Create Rental Card */}
          <div className="card card-highlighted">
            <div className="card-header">
              <h2 className="card-title">Create New Rental</h2>
              <div className="status-badge status-pending">Booking Form</div>
            </div>
            <div className="card-content">
              <form className="rental-form" onSubmit={handleCreateRental}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="r_vehicle_id">
                      Vehicle ID
                    </label>
                    <input
                      className="form-input"
                      id="r_vehicle_id"
                      type="text"
                      placeholder="Enter vehicle ID"
                      value={rentalForm.vehicle_id}
                      onChange={(e) => setRentalForm({ ...rentalForm, vehicle_id: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="r_start">
                      Start Date
                    </label>
                    <input
                      className="form-input"
                      id="r_start"
                      type="date"
                      value={rentalForm.start_date}
                      onChange={(e) => setRentalForm({ ...rentalForm, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="r_end">
                      End Date
                    </label>
                    <input
                      className="form-input"
                      id="r_end"
                      type="date"
                      value={rentalForm.end_date}
                      onChange={(e) => setRentalForm({ ...rentalForm, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  <span>Create Rental Request</span>
                </button>
              </form>
            </div>
          </div>

          {/* My Rentals Card */}
          <div className="card" id="section-rentals">
            <div className="card-header">
              <h2 className="card-title">My Rental History</h2>
              <div className="status-badge status-approved">Personal Rentals</div>
            </div>
            <div className="card-content">
              <div className="rental-actions">
                <button className="btn btn-secondary" onClick={loadMyRentals} disabled={loadingRentals}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                  </svg>
                  <span>Load My Rentals</span>
                </button>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Rental ID</th>
                      <th style={{ textAlign: 'left' }}>Vehicle</th>
                      <th style={{ textAlign: 'left' }}>Duration</th>
                      <th style={{ textAlign: 'left' }}>Status</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRentals ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                          Loading rentals...
                        </td>
                      </tr>
                    ) : myRentals.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                          No rentals found
                        </td>
                      </tr>
                    ) : (
                      myRentals.map((r) => (
                        <tr key={r.rental_id}>
                          <td>#{r.rental_id}</td>
                          <td>Vehicle {r.vehicle_id}</td>
                          <td>{formatDateRange(r.start_date, r.end_date)}</td>
                          <td>
                            <span className={`status-badge status-${getStatusClass(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>₱{parseFloat(r.total_cost).toFixed(2)}</td>
                          <td className="table-actions">
                            {r.status === 'pending' && (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleCancelRental(r.rental_id)}
                              >
                                Cancel
                              </button>
                            )}
                            {r.status === 'approved' && (
                              <>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handlePayRental(r.rental_id)}
                                >
                                  Pay
                                </button>
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleCancelRental(r.rental_id)}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {(r.status === 'paid' || r.status === 'rented') && (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => handleCancelRental(r.rental_id)}
                              >
                                Cancel
                              </button>
                            )}
                            {(r.status === 'returned' || r.status === 'rejected' || r.status === 'cancelled' || !['pending', 'approved', 'paid', 'rented'].includes(r.status)) && (
                              <span style={{ 
                                color: 'var(--dark-charcoal)', 
                                opacity: 0.6, 
                                fontSize: 'var(--font-size-small)'
                              }}>
                                No actions available
                              </span>
                            )}
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

      {/* Payment Modal */}
      {paymentModalOpen && currentPaymentRental && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPaymentModalOpen(false);
              setCurrentPaymentRental(null);
              setPaymentMethod('cash');
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Select Payment Method</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setCurrentPaymentRental(null);
                  setPaymentMethod('cash');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-info">
                <div className="payment-amount">
                  <span className="payment-label">Total Amount:</span>
                  <span className="payment-value">
                    ₱{parseFloat(currentPaymentRental.total_cost).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="payment-methods">
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-method-card">
                    <div className="payment-method-icon">💵</div>
                    <div className="payment-method-info">
                      <div className="payment-method-name">Cash</div>
                      <div className="payment-method-desc">Pay with cash on pickup</div>
                    </div>
                  </div>
                </label>
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="payment_method"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-method-card">
                    <div className="payment-method-icon">💳</div>
                    <div className="payment-method-info">
                      <div className="payment-method-name">Card</div>
                      <div className="payment-method-desc">Credit or debit card</div>
                    </div>
                  </div>
                </label>
                <label className="payment-method-option">
                  <input
                    type="radio"
                    name="payment_method"
                    value="gcash"
                    checked={paymentMethod === 'gcash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-method-card">
                    <div className="payment-method-icon">📱</div>
                    <div className="payment-method-info">
                      <div className="payment-method-name">GCash</div>
                      <div className="payment-method-desc">Mobile wallet payment</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setCurrentPaymentRental(null);
                  setPaymentMethod('cash');
                }}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${processingPayment ? 'loading' : ''}`}
                onClick={handleConfirmPayment}
                disabled={processingPayment}
              >
                <span>Confirm Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
