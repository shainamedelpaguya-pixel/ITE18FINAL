'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { getToken, removeToken, redirectByRole } from '@/lib/auth';
import Notification from '@/components/Notification';
import DashboardLayout from '@/components/DashboardLayout';

export default function VehiclesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [formMode, setFormMode] = useState('none'); // 'create', 'edit', 'none'
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState(''); // 'success', 'error', ''

  const [vehicleForm, setVehicleForm] = useState({
    vehicle_id: '',
    type: '',
    model: '',
    plate_number: '',
    price_per_day: '',
    status: 'available',
  });

  const fileInputRef = useRef(null);

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
        
        // Allow managers and staff to access vehicles page
        if (userData.role !== 'manager' && userData.role !== 'staff') {
          router.push(redirectByRole(userData.role));
          return;
        }

        setUser(userData);
        fetchVehicles();
      } catch (error) {
        removeToken();
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMins = Math.floor(diffTime / (1000 * 60));
          return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
        }
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      }
      
      if (diffDays < 7) {
        return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
    }
  };

  const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data || []);
    } catch (error) {
      setResult('Failed to load vehicles');
      setResultType('error');
      setNotification({ message: 'Failed to load vehicles', type: 'error' });
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadForEdit = async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      const v = response.data;
      setVehicleForm({
        vehicle_id: v.vehicle_id,
        type: v.type || '',
        model: v.model || '',
        plate_number: v.plate_number || '',
        price_per_day: v.price_per_day || '',
        status: v.status || 'available',
      });
      setFormMode('edit');
      setResult('');
      setResultType('');
    } catch (error) {
      setNotification({ message: 'Failed to load vehicle', type: 'error' });
    }
  };

  const deleteVehicle = async (id) => {
    if (!confirm(`Delete vehicle #${id}?`)) return;
    
    try {
      await api.delete(`/vehicles/${id}`);
      setResult(`Vehicle #${id} deleted successfully`);
      setResultType('success');
      setNotification({ message: 'Vehicle deleted successfully', type: 'success' });
      fetchVehicles();
    } catch (error) {
      setResult(error.response?.data?.message || 'Failed to delete vehicle');
      setResultType('error');
      setNotification({ message: 'Failed to delete vehicle', type: 'error' });
    }
  };

  const updateStatus = async (id, status) => {
    const newStatus = prompt('Enter new status (Available, Reserved, Rented, Under Maintenance)');
    if (!newStatus) return;

    try {
      await api.patch(`/vehicles/${id}/status`, { status: newStatus });
      setResult(`Vehicle #${id} status updated to ${newStatus}`);
      setResultType('success');
      setNotification({ message: 'Status updated successfully', type: 'success' });
      fetchVehicles();
    } catch (error) {
      setResult(error.response?.data?.message || 'Failed to update status');
      setResultType('error');
      setNotification({ message: 'Failed to update status', type: 'error' });
    }
  };

  const createVehicle = async () => {
    if (!vehicleForm.type || !vehicleForm.model || !vehicleForm.plate_number || !vehicleForm.price_per_day) {
      setResult('Please fill Type, Model, Plate, and Price/day');
      setResultType('error');
      return;
    }

    const formData = new FormData();
    formData.append('v_type', vehicleForm.type);
    formData.append('v_model', vehicleForm.model);
    formData.append('v_plate', vehicleForm.plate_number);
    formData.append('v_price', vehicleForm.price_per_day);
    formData.append('v_status', vehicleForm.status);

    if (fileInputRef.current?.files[0]) {
      formData.append('image', fileInputRef.current.files[0]);
    }

    try {
      const response = await api.post('/vehicles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult('Vehicle created successfully');
      setResultType('success');
      setNotification({ message: 'Vehicle created successfully', type: 'success' });
      fetchVehicles();
      setFormMode('none');
      setVehicleForm({
        vehicle_id: '',
        type: '',
        model: '',
        plate_number: '',
        price_per_day: '',
        status: 'available',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create vehicle';
      setResult(errorMsg);
      setResultType('error');
      setNotification({ message: errorMsg, type: 'error' });
    }
  };

  const updateVehicle = async () => {
    if (!vehicleForm.vehicle_id) {
      setResult('No vehicle selected for update');
      setResultType('error');
      return;
    }

    const formData = new FormData();
    formData.append('v_type', vehicleForm.type);
    formData.append('v_model', vehicleForm.model);
    formData.append('v_plate', vehicleForm.plate_number);
    formData.append('v_price', vehicleForm.price_per_day);
    formData.append('v_status', vehicleForm.status);
    formData.append('_method', 'PUT');

    if (fileInputRef.current?.files[0]) {
      formData.append('image', fileInputRef.current.files[0]);
    }

    try {
      await api.post(`/vehicles/${vehicleForm.vehicle_id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult('Vehicle updated successfully');
      setResultType('success');
      setNotification({ message: 'Vehicle updated successfully', type: 'success' });
      fetchVehicles();
      setFormMode('none');
      setVehicleForm({
        vehicle_id: '',
        type: '',
        model: '',
        plate_number: '',
        price_per_day: '',
        status: 'available',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update vehicle';
      setResult(errorMsg);
      setResultType('error');
      setNotification({ message: errorMsg, type: 'error' });
    }
  };

  const handleNewVehicle = () => {
    setVehicleForm({
      vehicle_id: '',
      type: '',
      model: '',
      plate_number: '',
      price_per_day: '',
      status: 'available',
    });
    setResult('');
    setResultType('');
    setFormMode('create');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setFormMode('none');
    setVehicleForm({
      vehicle_id: '',
      type: '',
      model: '',
      plate_number: '',
      price_per_day: '',
      status: 'available',
    });
    setResult('');
    setResultType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `http://localhost:8000${imageUrl}`;
    return `http://localhost:8000/storage/${imageUrl}`;
  };

  const navItems = [
    {
      section: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      onClick: () => {
        if (user?.role === 'staff') {
          router.push('/staff');
        } else if (user?.role === 'manager') {
          router.push('/manager');
        }
      },
    },
    {
      section: 'vehicles',
      label: 'Vehicles',
      icon: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
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
        title="Vehicles Management"
        subtitle={user?.role === 'staff' ? 'Staff Dashboard' : 'Manager Dashboard'}
      >
        <div className="vehicles-page" style={{ width: '100%', maxWidth: '100%' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Vehicles Admin</h1>
            <p className="vehicle-count">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={fetchVehicles} disabled={loadingVehicles}>
              Refresh
            </button>
            <button className="btn btn-primary" onClick={handleNewVehicle}>
              New Vehicle
            </button>
          </div>
        </div>

        <div className="table-container" style={{ width: '100%', maxWidth: '100%' }}>
          <table id="vehicles_table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>ID</th>
                <th style={{ textAlign: 'center' }}>Image</th>
                <th style={{ textAlign: 'center' }}>Type</th>
                <th style={{ textAlign: 'center' }}>Model</th>
                <th style={{ textAlign: 'center' }}>Plate Number</th>
                <th style={{ textAlign: 'center' }}>Price/Day</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Last Updated</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingVehicles ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                    Loading vehicles...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'rgba(66, 66, 66, 0.6)' }}>
                    <p style={{ margin: 0, fontSize: '16px' }}>No vehicles found</p>
                    <p style={{ margin: 'var(--spacing-sm) 0 0 0', fontSize: '14px' }}>
                      Click "New Vehicle" to add your first vehicle
                    </p>
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => {
                  const imageUrl = getImageUrl(v.image_url);
                  const status = v.status ? v.status.toLowerCase() : 'available';
                  
                  return (
                    <tr key={v.vehicle_id}>
                      <td className="vehicle-id" style={{ textAlign: 'center' }}>#{v.vehicle_id}</td>
                      <td className="vehicle-image" style={{ textAlign: 'center' }}>
                        {imageUrl ? (
                          <img
                            className="thumb"
                            src={imageUrl}
                            alt={v.model || 'Vehicle'}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="thumb-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
                          No Image
                        </div>
                      </td>
                      <td className="vehicle-type" style={{ textAlign: 'center' }}>{capitalize(v.type || 'N/A')}</td>
                      <td className="vehicle-model" style={{ textAlign: 'center' }} title={v.model || ''}>
                        {v.model && v.model.length > 30 ? v.model.substring(0, 30) + '...' : v.model || 'N/A'}
                      </td>
                      <td className="vehicle-plate" style={{ textAlign: 'center' }}>
                        {v.plate_number ? (
                          <span className="plate-number">{v.plate_number}</span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="vehicle-price" style={{ textAlign: 'center' }}>
                        <span className="price-amount">
                          ₱{parseFloat(v.price_per_day || 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td className="vehicle-status" style={{ textAlign: 'center' }}>
                        <span className={`status-badge-inline status-${status}`}>
                          {capitalize(v.status || 'available')}
                        </span>
                      </td>
                      <td className="vehicle-updated" style={{ textAlign: 'center' }}>
                        <small>{formatDate(v.updated_at || v.created_at)}</small>
                      </td>
                      <td className="table-actions" style={{ textAlign: 'center' }}>
                        <button
                          className="edit"
                          onClick={() => loadForEdit(v.vehicle_id)}
                          title="Edit vehicle"
                        >
                          Edit
                        </button>
                        <button
                          className="delete"
                          onClick={() => deleteVehicle(v.vehicle_id)}
                          title="Delete vehicle"
                        >
                          Delete
                        </button>
                        <button
                          className="status"
                          onClick={() => updateStatus(v.vehicle_id, v.status)}
                          title="Change status"
                        >
                          Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="form-card">
          <h2>Create / Edit Vehicle</h2>
          <form
            id="vehicle_form"
            onSubmit={(e) => {
              e.preventDefault();
              if (formMode === 'create') {
                createVehicle();
              } else if (formMode === 'edit') {
                updateVehicle();
              }
            }}
          >
            <input type="hidden" id="v_id" value={vehicleForm.vehicle_id} />
            
            <div className="form-group">
              <label htmlFor="v_type">Type</label>
              <input
                type="text"
                id="v_type"
                placeholder="e.g., Sedan, SUV, Truck"
                value={vehicleForm.type}
                onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="v_model">Model</label>
              <input
                type="text"
                id="v_model"
                placeholder="e.g., Toyota Corolla"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="v_plate">Plate Number</label>
              <input
                type="text"
                id="v_plate"
                placeholder="e.g., ABC-1234"
                value={vehicleForm.plate_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="v_price">Price per Day</label>
              <input
                type="number"
                id="v_price"
                step="0.01"
                placeholder="0.00"
                value={vehicleForm.price_per_day}
                onChange={(e) => setVehicleForm({ ...vehicleForm, price_per_day: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="v_status">Status</label>
              <select
                id="v_status"
                value={vehicleForm.status}
                onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="v_image">Vehicle Image</label>
              <input
                ref={fileInputRef}
                type="file"
                id="v_image"
                accept="image/*"
              />
            </div>

            <div className="form-actions">
              {formMode === 'create' && (
                <button type="submit" className="btn btn-primary">
                  Create Vehicle
                </button>
              )}
              {formMode === 'edit' && (
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              )}
              {formMode !== 'none' && (
                <button type="button" className="btn btn-outline" onClick={handleCancel}>
                  Cancel
                </button>
              )}
            </div>

            {result && (
              <div className={`v_result ${resultType}`}>{result}</div>
            )}
          </form>
        </div>
        </div>
      </DashboardLayout>
    </>
  );
}

