/**
 * View/Edit Dashboard Modal
 *
 * Modal with tabs for viewing and editing a dashboard:
 * - General: Dashboard name and description
 * - Widgets: Select predefined and custom widgets
 * - Manage Access: Manage access rules (users, profiles, roles)
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../styles/ViewDashboardModal.css';

const ViewDashboardModal = ({ dashboard, customWidgets, allUsers, allRoles = [], onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    dashboardName: '',
    dashboardDesc: '',
    selectedWidgetIds: [],
    accessRules: [] // Array of {id, ruleType, condition, details, userIds}
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access tab state
  const [selectedRules, setSelectedRules] = useState([]);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [ruleSearchTerm, setRuleSearchTerm] = useState('');
  const [ruleFilters, setRuleFilters] = useState(['all']); // 'all', 'user', 'role', 'profile'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);

  // Add Rule Modal state
  const [addRuleTab, setAddRuleTab] = useState('users');
  const [addRuleSearchTerm, setAddRuleSearchTerm] = useState('');
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);
  const [selectedProfilesToAdd, setSelectedProfilesToAdd] = useState([]);
  const [selectedRolesToAdd, setSelectedRolesToAdd] = useState([]);

  // Rule Users Popup state (for viewing users in Profile/Role rules)
  const [showRuleUsersPopup, setShowRuleUsersPopup] = useState(false);
  const [selectedRuleForUsers, setSelectedRuleForUsers] = useState(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize form data from dashboard
  useEffect(() => {
    if (dashboard) {
      const widgetIds = dashboard.customWidgets
        ? dashboard.customWidgets.map(w => w.id)
        : [];

      // Smart grouping: detect Profile and Role rules from user assignments
      const dashboardUserIds = new Set((dashboard.users || []).map(u => u.userId));
      const existingRules = [];
      const assignedUserIds = new Set();
      let ruleIdCounter = Date.now();

      // First, try to detect complete Profile assignments
      const profileGroups = {};
      allUsers.forEach(user => {
        if (!profileGroups[user.profile]) {
          profileGroups[user.profile] = { total: [], assigned: [] };
        }
        profileGroups[user.profile].total.push(user);
        if (dashboardUserIds.has(user.id)) {
          profileGroups[user.profile].assigned.push(user);
        }
      });

      // Create Profile rules for profiles where ALL users are assigned
      Object.entries(profileGroups).forEach(([profileName, { total, assigned }]) => {
        if (assigned.length > 0 && assigned.length === total.length) {
          // All users from this profile are assigned - create a Profile rule
          existingRules.push({
            id: `profile-${profileName}-${ruleIdCounter++}`,
            ruleType: 'Profile',
            condition: profileName,
            details: `${assigned.length} user(s)`,
            userIds: assigned.map(u => u.id)
          });
          assigned.forEach(u => assignedUserIds.add(u.id));
        }
      });

      // Second, try to detect complete Role assignments
      allRoles.forEach(role => {
        if (role.members && role.members.length > 0) {
          const roleUserIds = role.members.map(m => m.userId);
          const assignedFromRole = roleUserIds.filter(uid =>
            dashboardUserIds.has(uid) && !assignedUserIds.has(uid)
          );

          // If all role members (not already assigned via profile) are present
          const unassignedRoleMembers = roleUserIds.filter(uid => !assignedUserIds.has(uid));
          if (unassignedRoleMembers.length > 0 &&
              assignedFromRole.length === unassignedRoleMembers.length) {
            existingRules.push({
              id: `role-${role.id}-${ruleIdCounter++}`,
              ruleType: 'Role',
              condition: role.roleName,
              details: `${assignedFromRole.length} user(s) - ${role.roleType}`,
              userIds: assignedFromRole
            });
            assignedFromRole.forEach(uid => assignedUserIds.add(uid));
          }
        }
      });

      // Finally, create User rules for remaining individual users
      (dashboard.users || []).forEach((user, index) => {
        if (!assignedUserIds.has(user.userId)) {
          existingRules.push({
            id: `user-${user.userId}-${index}`,
            ruleType: 'User',
            condition: user.userName,
            details: user.profile || 'N/A',
            userIds: [user.userId]
          });
          assignedUserIds.add(user.userId);
        }
      });

      setFormData({
        dashboardName: dashboard.dashboard_name || '',
        dashboardDesc: dashboard.dashboard_desc || '',
        selectedWidgetIds: widgetIds,
        accessRules: existingRules
      });
    }
  }, [dashboard, allUsers, allRoles]);

  // General tab handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Widgets tab handlers
  const handleWidgetToggle = (widgetId) => {
    setFormData(prev => ({
      ...prev,
      selectedWidgetIds: prev.selectedWidgetIds.includes(widgetId)
        ? prev.selectedWidgetIds.filter(id => id !== widgetId)
        : [...prev.selectedWidgetIds, widgetId]
    }));
  };

  const handleSelectAllWidgets = (e) => {
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        selectedWidgetIds: customWidgets.map(w => w.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedWidgetIds: []
      }));
    }
  };

  // Get unique profiles from all users
  const availableProfiles = [...new Set(allUsers.map(u => u.profile))].filter(Boolean);

  // Filter profiles by search term
  const filteredProfiles = availableProfiles.filter(profile =>
    profile.toLowerCase().includes(addRuleSearchTerm.toLowerCase())
  );

  // Filter roles by search term
  const filteredRoles = allRoles.filter(role =>
    role.roleName.toLowerCase().includes(addRuleSearchTerm.toLowerCase())
  );

  // Get user IDs already covered by existing rules
  const getExistingUserIds = () => {
    const userIds = new Set();
    formData.accessRules.forEach(rule => {
      rule.userIds.forEach(id => userIds.add(id));
    });
    return userIds;
  };

  // Get available users (not already added)
  const availableUsers = allUsers.filter(
    user => !getExistingUserIds().has(user.id)
  );

  // Filter available users by search term
  const filteredAvailableUsers = availableUsers.filter(user =>
    user.userName.toLowerCase().includes(addRuleSearchTerm.toLowerCase()) ||
    user.profile.toLowerCase().includes(addRuleSearchTerm.toLowerCase())
  );

  // Handle filter change
  const handleFilterChange = (filter) => {
    if (filter === 'all') {
      setRuleFilters(['all']);
    } else {
      let newFilters = ruleFilters.filter(f => f !== 'all');
      if (newFilters.includes(filter)) {
        newFilters = newFilters.filter(f => f !== filter);
      } else {
        newFilters.push(filter);
      }
      if (newFilters.length === 0) {
        newFilters = ['all'];
      }
      setRuleFilters(newFilters);
    }
  };

  // Filter and search access rules
  const getFilteredRules = () => {
    let filtered = formData.accessRules;

    // Apply type filter
    if (!ruleFilters.includes('all')) {
      filtered = filtered.filter(rule =>
        ruleFilters.includes(rule.ruleType.toLowerCase())
      );
    }

    // Apply search
    if (ruleSearchTerm.trim()) {
      const searchLower = ruleSearchTerm.toLowerCase();
      filtered = filtered.filter(rule => {
        // Basic search on rule properties
        if (
          rule.condition.toLowerCase().includes(searchLower) ||
          rule.ruleType.toLowerCase().includes(searchLower) ||
          rule.details.toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        // For Profile and Role rules, also search within user names
        if (rule.ruleType === 'Profile' || rule.ruleType === 'Role') {
          const matchingUser = rule.userIds.some(userId => {
            const user = allUsers.find(u => u.id === userId);
            return user && user.userName.toLowerCase().includes(searchLower);
          });
          if (matchingUser) return true;
        }

        return false;
      });
    }

    return filtered;
  };

  // Add Access Rules handler
  const handleAddRules = () => {
    const existingUserIds = getExistingUserIds();
    const newRules = [];
    let ruleIdCounter = Date.now();

    if (addRuleTab === 'users') {
      // Add individual user rules
      selectedUsersToAdd.forEach(userId => {
        const user = allUsers.find(u => u.id === userId);
        if (user) {
          newRules.push({
            id: `user-${userId}-${ruleIdCounter++}`,
            ruleType: 'User',
            condition: user.userName,
            details: user.profile || 'N/A',
            userIds: [userId]
          });
        }
      });
    } else if (addRuleTab === 'profiles') {
      // Add profile rules
      selectedProfilesToAdd.forEach(profile => {
        const usersInProfile = allUsers.filter(u => u.profile === profile && !existingUserIds.has(u.id));
        if (usersInProfile.length > 0) {
          newRules.push({
            id: `profile-${profile}-${ruleIdCounter++}`,
            ruleType: 'Profile',
            condition: profile,
            details: `${usersInProfile.length} user(s)`,
            userIds: usersInProfile.map(u => u.id)
          });
        }
      });
    } else if (addRuleTab === 'roles') {
      // Add role rules
      selectedRolesToAdd.forEach(roleId => {
        const role = allRoles.find(r => r.id === roleId);
        if (role && role.members) {
          const newMembers = role.members.filter(m => !existingUserIds.has(m.userId));
          if (newMembers.length > 0) {
            newRules.push({
              id: `role-${roleId}-${ruleIdCounter++}`,
              ruleType: 'Role',
              condition: role.roleName,
              details: `${newMembers.length} user(s) - ${role.roleType}`,
              userIds: newMembers.map(m => m.userId)
            });
          }
        }
      });
    }

    setFormData(prev => ({
      ...prev,
      accessRules: [...prev.accessRules, ...newRules]
    }));

    // Reset modal state
    setSelectedUsersToAdd([]);
    setSelectedProfilesToAdd([]);
    setSelectedRolesToAdd([]);
    setAddRuleSearchTerm('');
    setAddRuleTab('users');
    setShowAddRuleModal(false);
  };

  // Delete selected rules
  const handleDeleteRules = () => {
    setFormData(prev => ({
      ...prev,
      accessRules: prev.accessRules.filter(rule => !selectedRules.includes(rule.id))
    }));
    setSelectedRules([]);
  };

  // Handle clicking on a Profile/Role rule to view users
  const handleViewRuleUsers = (rule) => {
    if (rule.ruleType === 'Profile' || rule.ruleType === 'Role') {
      setSelectedRuleForUsers(rule);
      setShowRuleUsersPopup(true);
    }
  };

  // Get users for the selected rule
  const getRuleUsers = () => {
    if (!selectedRuleForUsers) return [];
    return selectedRuleForUsers.userIds.map(userId => {
      const user = allUsers.find(u => u.id === userId);
      return user || { id: userId, userName: `User-${userId}`, profile: 'Unknown' };
    });
  };

  // Toggle rule selection
  const handleToggleRule = (ruleId) => {
    setSelectedRules(prev =>
      prev.includes(ruleId)
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  // Select all visible rules
  const handleSelectAllRules = (e) => {
    const filteredRules = getFilteredRules();
    if (e.target.checked) {
      setSelectedRules(filteredRules.map(r => r.id));
    } else {
      setSelectedRules([]);
    }
  };

  // Toggle handlers for add modal
  const handleToggleUserToAdd = (userId) => {
    setSelectedUsersToAdd(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleToggleProfileToAdd = (profile) => {
    setSelectedProfilesToAdd(prev =>
      prev.includes(profile)
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    );
  };

  const handleToggleRoleToAdd = (roleId) => {
    setSelectedRolesToAdd(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

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

    // Collect all unique user IDs from all rules
    const allUserIds = new Set();
    formData.accessRules.forEach(rule => {
      rule.userIds.forEach(id => allUserIds.add(id));
    });

    const result = await onUpdate(dashboard.id, {
      dashboardName: formData.dashboardName.trim(),
      dashboardDesc: formData.dashboardDesc.trim(),
      customWidgetIds: formData.selectedWidgetIds,
      users: Array.from(allUserIds)
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
      {customWidgets.length === 0 ? (
        <p className="no-widgets">No widgets available. Please configure widgets in the Custom Widgets layer first.</p>
      ) : (
        <table className="widgets-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={customWidgets.length > 0 && formData.selectedWidgetIds.length === customWidgets.length}
                  onChange={handleSelectAllWidgets}
                  title="Select All"
                />
              </th>
              <th>Widget</th>
            </tr>
          </thead>
          <tbody>
            {customWidgets.map(widget => (
              <tr
                key={widget.id}
                className={formData.selectedWidgetIds.includes(widget.id) ? 'selected' : ''}
                onClick={() => handleWidgetToggle(widget.id)}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={formData.selectedWidgetIds.includes(widget.id)}
                    onChange={() => {}}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWidgetToggle(widget.id);
                    }}
                  />
                </td>
                <td>{widget.widget_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Render Add Rule Modal
  const renderAddRuleModal = () => {
    const existingUserIds = getExistingUserIds();

    const selectedCount = addRuleTab === 'users'
      ? selectedUsersToAdd.length
      : addRuleTab === 'profiles'
        ? selectedProfilesToAdd.length
        : selectedRolesToAdd.length;

    const usersFromProfiles = addRuleTab === 'profiles' && selectedProfilesToAdd.length > 0
      ? allUsers.filter(u => selectedProfilesToAdd.includes(u.profile) && !existingUserIds.has(u.id)).length
      : 0;

    const usersFromRoles = addRuleTab === 'roles' && selectedRolesToAdd.length > 0
      ? (() => {
          const uniqueUserIds = new Set();
          selectedRolesToAdd.forEach(roleId => {
            const role = allRoles.find(r => r.id === roleId);
            if (role && role.members) {
              role.members.forEach(member => {
                if (!existingUserIds.has(member.userId)) {
                  uniqueUserIds.add(member.userId);
                }
              });
            }
          });
          return uniqueUserIds.size;
        })()
      : 0;

    const searchPlaceholder = addRuleTab === 'users'
      ? 'Search users...'
      : addRuleTab === 'profiles'
        ? 'Search profiles...'
        : 'Search roles...';

    const getButtonText = () => {
      if (addRuleTab === 'users') {
        return `Add ${selectedUsersToAdd.length} Rule(s)`;
      } else if (addRuleTab === 'profiles') {
        return `Add ${selectedProfilesToAdd.length} Rule(s) (${usersFromProfiles} users)`;
      } else {
        return `Add ${selectedRolesToAdd.length} Rule(s) (${usersFromRoles} users)`;
      }
    };

    return (
      <div className="add-user-modal-overlay" onClick={() => setShowAddRuleModal(false)}>
        <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
          <div className="add-user-modal-header">
            <h3>Add Access Rule</h3>
            <button className="close-btn" onClick={() => setShowAddRuleModal(false)}>×</button>
          </div>

          <div className="add-user-modal-tabs">
            <button
              className={`add-user-tab ${addRuleTab === 'users' ? 'active' : ''}`}
              onClick={() => {
                setAddRuleTab('users');
                setAddRuleSearchTerm('');
              }}
            >
              User
            </button>
            <button
              className={`add-user-tab ${addRuleTab === 'profiles' ? 'active' : ''}`}
              onClick={() => {
                setAddRuleTab('profiles');
                setAddRuleSearchTerm('');
              }}
            >
              Profile
            </button>
            <button
              className={`add-user-tab ${addRuleTab === 'roles' ? 'active' : ''}`}
              onClick={() => {
                setAddRuleTab('roles');
                setAddRuleSearchTerm('');
              }}
            >
              Role
            </button>
          </div>

          <div className="add-user-modal-search">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={addRuleSearchTerm}
              onChange={(e) => setAddRuleSearchTerm(e.target.value)}
            />
          </div>

          <div className="add-user-modal-list">
            {addRuleTab === 'users' ? (
              filteredAvailableUsers.length === 0 ? (
                <div className="no-users-available">No users available</div>
              ) : (
                filteredAvailableUsers.map(user => (
                  <div
                    key={user.id}
                    className={`user-item ${selectedUsersToAdd.includes(user.id) ? 'selected' : ''}`}
                    onClick={() => handleToggleUserToAdd(user.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsersToAdd.includes(user.id)}
                      onChange={() => {}}
                    />
                    <span className="user-name">{user.userName}</span>
                    <span className="user-profile">{user.profile}</span>
                  </div>
                ))
              )
            ) : addRuleTab === 'profiles' ? (
              filteredProfiles.length === 0 ? (
                <div className="no-users-available">No profiles available</div>
              ) : (
                filteredProfiles.map(profile => {
                  const userCount = allUsers.filter(u => u.profile === profile).length;
                  const newUserCount = allUsers.filter(u => u.profile === profile && !existingUserIds.has(u.id)).length;
                  return (
                    <div
                      key={profile}
                      className={`user-item ${selectedProfilesToAdd.includes(profile) ? 'selected' : ''}`}
                      onClick={() => handleToggleProfileToAdd(profile)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProfilesToAdd.includes(profile)}
                        onChange={() => {}}
                      />
                      <span className="user-name">{profile}</span>
                      <span className="user-profile">{newUserCount} new / {userCount} total users</span>
                    </div>
                  );
                })
              )
            ) : (
              filteredRoles.length === 0 ? (
                <div className="no-users-available">No roles available</div>
              ) : (
                filteredRoles.map(role => {
                  const newUserCount = role.members ? role.members.filter(m => !existingUserIds.has(m.userId)).length : 0;
                  return (
                    <div
                      key={role.id}
                      className={`user-item ${selectedRolesToAdd.includes(role.id) ? 'selected' : ''}`}
                      onClick={() => handleToggleRoleToAdd(role.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRolesToAdd.includes(role.id)}
                        onChange={() => {}}
                      />
                      <span className="user-name">{role.roleName}</span>
                      <span className={`role-type-badge ${role.roleType.toLowerCase()}`}>{role.roleType}</span>
                      <span className="user-profile">{newUserCount} new / {role.memberCount} total</span>
                    </div>
                  );
                })
              )
            )}
          </div>

          <div className="add-user-modal-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                setShowAddRuleModal(false);
                setSelectedUsersToAdd([]);
                setSelectedProfilesToAdd([]);
                setSelectedRolesToAdd([]);
                setAddRuleSearchTerm('');
                setAddRuleTab('users');
              }}
            >
              Cancel
            </button>
            <button
              className="btn-add"
              onClick={handleAddRules}
              disabled={selectedCount === 0}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Manage Access Tab
  const renderAccessTab = () => {
    const filteredRules = getFilteredRules();
    const allSelected = filteredRules.length > 0 && selectedRules.length === filteredRules.length;

    const getFilterLabel = () => {
      if (ruleFilters.includes('all')) return 'All';
      return ruleFilters.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ');
    };

    return (
      <div className="tab-content">
        <div className="access-actions">
          <button
            className="btn-add-rule"
            onClick={() => setShowAddRuleModal(true)}
          >
            Add Access Rule
          </button>
          <button
            className="btn-delete-rule"
            onClick={handleDeleteRules}
            disabled={selectedRules.length === 0}
          >
            Delete Access Rule
          </button>
        </div>

        <div className="access-toolbar">
          <div className="filter-dropdown-container" ref={filterDropdownRef}>
            <button
              className="filter-dropdown-btn"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <span className="filter-icon">&#9660;</span>
              Filter: {getFilterLabel()}
            </button>
            {showFilterDropdown && (
              <div className="filter-dropdown-menu">
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={ruleFilters.includes('all')}
                    onChange={() => handleFilterChange('all')}
                  />
                  All
                </label>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={ruleFilters.includes('user')}
                    onChange={() => handleFilterChange('user')}
                  />
                  User
                </label>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={ruleFilters.includes('role')}
                    onChange={() => handleFilterChange('role')}
                  />
                  Role
                </label>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={ruleFilters.includes('profile')}
                    onChange={() => handleFilterChange('profile')}
                  />
                  Profile
                </label>
              </div>
            )}
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search rules..."
              value={ruleSearchTerm}
              onChange={(e) => setRuleSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="rules-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAllRules}
                />
              </th>
              <th>Rule Type</th>
              <th>Rule Condition</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No access rules configured</td>
              </tr>
            ) : (
              filteredRules.map((rule) => {
                const isClickable = rule.ruleType === 'Profile' || rule.ruleType === 'Role';
                return (
                  <tr
                    key={rule.id}
                    className={`${selectedRules.includes(rule.id) ? 'selected' : ''} ${isClickable ? 'clickable-rule' : ''}`}
                    onClick={() => isClickable && handleViewRuleUsers(rule)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRules.includes(rule.id)}
                        onChange={() => handleToggleRule(rule.id)}
                      />
                    </td>
                    <td>
                      <span className={`rule-type-badge ${rule.ruleType.toLowerCase()}`}>
                        {rule.ruleType}
                      </span>
                    </td>
                    <td>{rule.condition}</td>
                    <td>
                      {rule.details}
                      {isClickable && <span className="view-users-hint"> (click to view users)</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
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
              Manage Access
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

      {showAddRuleModal && createPortal(renderAddRuleModal(), document.body)}

      {showRuleUsersPopup && selectedRuleForUsers && createPortal(
        <div className="add-user-modal-overlay" onClick={() => setShowRuleUsersPopup(false)}>
          <div className="add-user-modal rule-users-popup" onClick={(e) => e.stopPropagation()}>
            <div className="add-user-modal-header">
              <h3>
                <span className={`rule-type-badge ${selectedRuleForUsers.ruleType.toLowerCase()}`}>
                  {selectedRuleForUsers.ruleType}
                </span>
                {selectedRuleForUsers.condition}
              </h3>
              <button className="close-btn" onClick={() => setShowRuleUsersPopup(false)}>×</button>
            </div>

            <div className="rule-users-info">
              {selectedRuleForUsers.userIds.length} user(s) in this {selectedRuleForUsers.ruleType.toLowerCase()}
            </div>

            <div className="add-user-modal-list rule-users-list">
              {getRuleUsers().map(user => (
                <div key={user.id} className="user-item">
                  <span className="user-name">{user.userName}</span>
                  <span className="user-profile">{user.profile}</span>
                </div>
              ))}
            </div>

            <div className="add-user-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowRuleUsersPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ViewDashboardModal;
