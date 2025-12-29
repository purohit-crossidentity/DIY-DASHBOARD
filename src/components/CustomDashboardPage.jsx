/**
 * Custom Dashboard Page
 *
 * Main admin page for managing custom dashboards.
 * Features: List dashboards, Add, Edit, Delete
 */

import { useState, useEffect, useCallback } from 'react';
import { getValidAuthToken } from '../utils/auth';
import AddDashboardModal from './AddDashboardModal';
import ViewDashboardModal from './ViewDashboardModal';
import IAMHeaderCanvas from './IAMHeaderCanvas';
import '../styles/CustomDashboardPage.css';

const API_BASE_URL = 'http://localhost:5001/api';

const CustomDashboardPage = () => {
  const [dashboards, setDashboards] = useState([]);
  const [predefinedWidgets, setPredefinedWidgets] = useState([]);
  const [customWidgets, setCustomWidgets] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDashboards, setSelectedDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, ids: [] });

  // Fetch all dashboards
  const fetchDashboards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getValidAuthToken();

      const response = await fetch(`${API_BASE_URL}/dashboards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboards');
      }

      const result = await response.json();
      if (result.success) {
        setDashboards(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch dashboards');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch predefined widgets
  const fetchPredefinedWidgets = useCallback(async () => {
    try {
      const token = await getValidAuthToken();
      const response = await fetch(`${API_BASE_URL}/dashboards/widgets/predefined`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPredefinedWidgets(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching predefined widgets:', err);
    }
  }, []);

  // Fetch custom widgets
  const fetchCustomWidgets = useCallback(async () => {
    try {
      const token = await getValidAuthToken();
      const response = await fetch(`${API_BASE_URL}/dashboards/widgets/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCustomWidgets(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching custom widgets:', err);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const token = await getValidAuthToken();
      const response = await fetch(`${API_BASE_URL}/dashboards/users/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUsers(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  // Load all data on mount
  useEffect(() => {
    let isMounted = true;

    const loadAllData = async () => {
      if (!isMounted) return;

      // Fetch all data in parallel - token mutex prevents race condition
      await Promise.all([
        fetchDashboards(),
        fetchPredefinedWidgets(),
        fetchCustomWidgets(),
        fetchUsers()
      ]);
    };

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, [fetchDashboards, fetchPredefinedWidgets, fetchCustomWidgets, fetchUsers]);

  // Create new dashboard
  const handleCreateDashboard = async (dashboardData) => {
    try {
      const token = await getValidAuthToken();

      const response = await fetch(`${API_BASE_URL}/dashboards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dashboardData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create dashboard');
      }

      setIsAddModalOpen(false);
      fetchDashboards();
      return { success: true };
    } catch (err) {
      console.error('Error creating dashboard:', err);
      return { success: false, error: err.message };
    }
  };

  // Update dashboard
  const handleUpdateDashboard = async (id, dashboardData) => {
    try {
      const token = await getValidAuthToken();

      const response = await fetch(`${API_BASE_URL}/dashboards/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dashboardData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update dashboard');
      }

      setIsViewModalOpen(false);
      setSelectedDashboard(null);
      fetchDashboards();
      return { success: true };
    } catch (err) {
      console.error('Error updating dashboard:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete dashboards
  const handleDelete = async () => {
    try {
      const token = await getValidAuthToken();
      const idsToDelete = confirmModal.ids;

      const response = await fetch(`${API_BASE_URL}/dashboards/delete-multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: idsToDelete })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete dashboards');
      }

      setSelectedDashboards([]);
      setConfirmModal({ isOpen: false, ids: [] });
      fetchDashboards();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting dashboards:', err);
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDashboards(dashboards.map(d => d.id));
    } else {
      setSelectedDashboards([]);
    }
  };

  const handleSelectDashboard = (id) => {
    setSelectedDashboards(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // View/Edit dashboard
  const handleViewDashboard = async (id) => {
    try {
      const token = await getValidAuthToken();

      const response = await fetch(`${API_BASE_URL}/dashboards/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSelectedDashboard(result.data);
        setIsViewModalOpen(true);
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard details');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard:', err);
    }
  };

  return (
    <div className="custom-dashboard-page">
      <IAMHeaderCanvas title="Custom Dashboard" />

      {error && (
        <div className="error-container">
          <span>{error}</span>
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      <div className="dashboard-actions">
        <button
          className="btn btn-add"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Custom Dashboard
        </button>
        <button
          className="btn btn-delete"
          onClick={() => setConfirmModal({ isOpen: true, ids: selectedDashboards })}
          disabled={selectedDashboards.length === 0}
        >
          Delete Custom Dashboard
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading dashboards...</div>
      ) : (
        <div className="dashboard-table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedDashboards.length === dashboards.length && dashboards.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>#</th>
                <th>Dashboard Name</th>
                <th>Dashboard Description</th>
              </tr>
            </thead>
            <tbody>
              {dashboards.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">
                    No dashboards found. Click "Add Custom Dashboard" to create one.
                  </td>
                </tr>
              ) : (
                dashboards.map((dashboard, index) => (
                  <tr
                    key={dashboard.id}
                    className={selectedDashboards.includes(dashboard.id) ? 'selected' : ''}
                    onClick={() => handleViewDashboard(dashboard.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedDashboards.includes(dashboard.id)}
                        onChange={() => handleSelectDashboard(dashboard.id)}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>{dashboard.dashboard_name}</td>
                    <td>{dashboard.dashboard_desc || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Dashboard Modal */}
      {isAddModalOpen && (
        <AddDashboardModal
          predefinedWidgets={predefinedWidgets}
          customWidgets={customWidgets}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateDashboard}
        />
      )}

      {/* View/Edit Dashboard Modal */}
      {isViewModalOpen && selectedDashboard && (
        <ViewDashboardModal
          dashboard={selectedDashboard}
          predefinedWidgets={predefinedWidgets}
          customWidgets={customWidgets}
          allUsers={users}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedDashboard(null);
          }}
          onUpdate={handleUpdateDashboard}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete {confirmModal.ids.length} dashboard(s)?
              This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmModal({ isOpen: false, ids: [] })}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDashboardPage;
