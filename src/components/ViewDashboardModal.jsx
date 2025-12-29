/**
 * View/Edit Dashboard Modal
 *
 * Modal with tabs for viewing and editing a dashboard:
 * - General: Dashboard name and description
 * - Widgets: Select predefined and custom widgets
 * - Access: Manage user access
 */

import { useState, useEffect, useRef } from 'react';
import '../styles/ViewDashboardModal.css';

const ViewDashboardModal = ({ dashboard, predefinedWidgets, customWidgets, allUsers, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    dashboardName: '',
    dashboardDesc: '',
    selectedPredefinedWidgets: [],
    customWidgetIds: [],
    users: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddUserDropdown, setShowAddUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAddUserDropdown(false);
      }
    };

    if (showAddUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddUserDropdown]);

  // Initialize form data from dashboard
  useEffect(() => {
    if (dashboard) {
      // Parse widget_cfg to get selected predefined widgets
      let selectedPredefined = [];
      if (dashboard.widgetCfg && Array.isArray(dashboard.widgetCfg)) {
        selectedPredefined = dashboard.widgetCfg
          .filter(w => w.status === 'true' || w.status === true)
          .map(w => w.dwname);
      }

      // Get custom widget IDs
      const customIds = dashboard.customWidgets
        ? dashboard.customWidgets.map(w => w.id)
        : [];

      setFormData({
        dashboardName: dashboard.dashboard_name || '',
        dashboardDesc: dashboard.dashboard_desc || '',
        selectedPredefinedWidgets: selectedPredefined,
        customWidgetIds: customIds,
        users: dashboard.users || []
      });
    }
  }, [dashboard]);

  // General tab handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Widgets tab handlers
  const handlePredefinedWidgetToggle = (widgetName) => {
    setFormData(prev => ({
      ...prev,
      selectedPredefinedWidgets: prev.selectedPredefinedWidgets.includes(widgetName)
        ? prev.selectedPredefinedWidgets.filter(name => name !== widgetName)
        : [...prev.selectedPredefinedWidgets, widgetName]
    }));
  };

  const handleCustomWidgetToggle = (widgetId) => {
    setFormData(prev => ({
      ...prev,
      customWidgetIds: prev.customWidgetIds.includes(widgetId)
        ? prev.customWidgetIds.filter(id => id !== widgetId)
        : [...prev.customWidgetIds, widgetId]
    }));
  };

  // Access tab handlers
  const handleAddUser = (user) => {
    // Check if user already exists
    if (formData.users.some(u => u.userId === user.id)) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      users: [...prev.users, {
        userId: user.id,
        userName: user.userName,
        profile: user.profile
      }]
    }));
    setShowAddUserDropdown(false);
  };

  const handleRemoveUsers = () => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.filter(u => !selectedUsers.includes(u.userId))
    }));
    setSelectedUsers([]);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      setSelectedUsers(formData.users.map(u => u.userId));
    } else {
      setSelectedUsers([]);
    }
  };

  // Get available users (not already added)
  const availableUsers = allUsers.filter(
    user => !formData.users.some(u => u.userId === user.id)
  );

  // Save handler
  const handleSave = async () => {
    const newErrors = {};
    if (!formData.dashboardName.trim()) {
      newErrors.dashboardName = 'Dashboard name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('general');
      return;
    }

    setIsSubmitting(true);

    const result = await onUpdate(dashboard.id, {
      dashboardName: formData.dashboardName.trim(),
      dashboardDesc: formData.dashboardDesc.trim(),
      selectedPredefinedWidgets: formData.selectedPredefinedWidgets,
      customWidgetIds: formData.customWidgetIds,
      users: formData.users.map(u => u.userId)
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrors({ submit: result.error });
    }
  };

  // Render General Tab
  const renderGeneralTab = () => (
    <div className="tab-content">
      <div className="form-row">
        <label>Dashboard Name:</label>
        <input
          type="text"
          name="dashboardName"
          value={formData.dashboardName}
          onChange={handleChange}
          className={errors.dashboardName ? 'error' : ''}
        />
        {errors.dashboardName && (
          <span className="error-message">{errors.dashboardName}</span>
        )}
      </div>
      <div className="form-row">
        <label>Dashboard Description:</label>
        <input
          type="text"
          name="dashboardDesc"
          value={formData.dashboardDesc}
          onChange={handleChange}
        />
      </div>
    </div>
  );

  // Render Widgets Tab
  const renderWidgetsTab = () => (
    <div className="tab-content">
      <table className="widgets-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Widget</th>
          </tr>
        </thead>
        <tbody>
          {/* Predefined Widgets */}
          {predefinedWidgets.map(widgetName => (
            <tr
              key={widgetName}
              className={formData.selectedPredefinedWidgets.includes(widgetName) ? 'selected' : ''}
              onClick={() => handlePredefinedWidgetToggle(widgetName)}
            >
              <td>
                <input
                  type="checkbox"
                  checked={formData.selectedPredefinedWidgets.includes(widgetName)}
                  onChange={() => {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePredefinedWidgetToggle(widgetName);
                  }}
                />
              </td>
              <td>{widgetName}</td>
            </tr>
          ))}

          {/* Custom Widgets */}
          {customWidgets.map(widget => (
            <tr
              key={`custom-${widget.id}`}
              className={formData.customWidgetIds.includes(widget.id) ? 'selected' : ''}
              onClick={() => handleCustomWidgetToggle(widget.id)}
            >
              <td>
                <input
                  type="checkbox"
                  checked={formData.customWidgetIds.includes(widget.id)}
                  onChange={() => {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCustomWidgetToggle(widget.id);
                  }}
                />
              </td>
              <td>{widget.widget_name} (Custom)</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render Access Tab
  const renderAccessTab = () => (
    <div className="tab-content">
      <div className="access-actions">
        <div className="add-user-container" ref={dropdownRef}>
          <button
            className={`btn-add-user ${showAddUserDropdown ? 'active' : ''}`}
            onClick={() => setShowAddUserDropdown(!showAddUserDropdown)}
          >
            Add User
          </button>
          {showAddUserDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-header">Select User</div>
              {availableUsers.length === 0 ? (
                <div className="dropdown-item disabled">No users available</div>
              ) : (
                availableUsers.map(user => (
                  <div
                    key={user.id}
                    className="dropdown-item"
                    onClick={() => handleAddUser(user)}
                  >
                    <span className="user-name">{user.userName}</span>
                    <span className="user-profile">{user.profile}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button
          className="btn-delete-user"
          onClick={handleRemoveUsers}
          disabled={selectedUsers.length === 0}
        >
          Delete User
        </button>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedUsers.length === formData.users.length && formData.users.length > 0}
                onChange={handleSelectAllUsers}
              />
            </th>
            <th>#</th>
            <th>User</th>
            <th>Profile</th>
          </tr>
        </thead>
        <tbody>
          {formData.users.length === 0 ? (
            <tr>
              <td colSpan="4" className="no-data">No users assigned</td>
            </tr>
          ) : (
            formData.users.map((user, index) => (
              <tr key={user.userId}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.userId)}
                    onChange={() => handleSelectUser(user.userId)}
                  />
                </td>
                <td>{index + 1}</td>
                <td>{user.userName}</td>
                <td>{user.profile}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="view-dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Custom Dashboard</h2>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab ${activeTab === 'widgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('widgets')}
          >
            Widgets
          </button>
          <button
            className={`tab ${activeTab === 'access' ? 'active' : ''}`}
            onClick={() => setActiveTab('access')}
          >
            Access
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        {errors.submit && (
          <div className="submit-error">{errors.submit}</div>
        )}

        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'widgets' && renderWidgetsTab()}
        {activeTab === 'access' && renderAccessTab()}
      </div>
    </div>
  );
};

export default ViewDashboardModal;
