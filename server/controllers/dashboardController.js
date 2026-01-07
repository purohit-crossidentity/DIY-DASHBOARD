/**
 * Dashboard Controller
 *
 * Handles HTTP request/response for dashboard operations.
 */

import Dashboard from '../models/Dashboard.js';

const dashboardController = {
  /**
   * GET /api/dashboards
   * Get all dashboards
   */
  async getAllDashboards(req, res) {
    try {
      const { tenant, subtenant } = req.user;
      console.log('DEBUG getAllDashboards - req.user:', req.user);
      console.log('DEBUG getAllDashboards - tenant:', tenant, 'subtenant:', subtenant);
      const dashboards = await Dashboard.getAll(tenant, subtenant);
      console.log('DEBUG getAllDashboards - returned rows:', dashboards.length);

      res.json({
        success: true,
        data: dashboards
      });
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboards',
        error: error.message
      });
    }
  },

  /**
   * GET /api/dashboards/:id
   * Get single dashboard with widgets and users
   */
  async getDashboard(req, res) {
    try {
      const { id } = req.params;
      const { tenant, subtenant } = req.user;

      const dashboard = await Dashboard.getById(id, tenant, subtenant);

      if (!dashboard) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found'
        });
      }

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard',
        error: error.message
      });
    }
  },

  /**
   * POST /api/dashboards
   * Create new dashboard
   */
  async createDashboard(req, res) {
    try {
      const { tenant, subtenant } = req.user;
      const { dashboardName, dashboardDesc, selectedPredefinedWidgets, customWidgetIds, users } = req.body;

      // Validation
      if (!dashboardName || dashboardName.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Dashboard name is required'
        });
      }

      const dashboardData = {
        dashboardName: dashboardName.trim(),
        dashboardDesc: dashboardDesc?.trim() || '',
        selectedPredefinedWidgets: selectedPredefinedWidgets || [],
        customWidgetIds: customWidgetIds || [],
        users: users || [],
        tenant,
        subtenant
      };

      const newDashboard = await Dashboard.create(dashboardData);

      res.status(201).json({
        success: true,
        message: 'Dashboard created successfully',
        data: newDashboard
      });
    } catch (error) {
      console.error('Error creating dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create dashboard',
        error: error.message
      });
    }
  },

  /**
   * PUT /api/dashboards/:id
   * Update dashboard
   */
  async updateDashboard(req, res) {
    try {
      const { id } = req.params;
      const { tenant, subtenant } = req.user;
      const { dashboardName, dashboardDesc, selectedPredefinedWidgets, customWidgetIds, users } = req.body;

      // Validation
      if (!dashboardName || dashboardName.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Dashboard name is required'
        });
      }

      const dashboardData = {
        dashboardName: dashboardName.trim(),
        dashboardDesc: dashboardDesc?.trim() || '',
        selectedPredefinedWidgets,
        customWidgetIds,
        users
      };

      const updated = await Dashboard.update(id, dashboardData, tenant, subtenant);

      res.json({
        success: true,
        message: 'Dashboard updated successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error updating dashboard:', error);

      if (error.message === 'Dashboard not found') {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update dashboard',
        error: error.message
      });
    }
  },

  /**
   * DELETE /api/dashboards/:id
   * Delete single dashboard
   */
  async deleteDashboard(req, res) {
    try {
      const { id } = req.params;
      const { tenant, subtenant } = req.user;

      const deleted = await Dashboard.delete(id, tenant, subtenant);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Dashboard not found'
        });
      }

      res.json({
        success: true,
        message: 'Dashboard deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete dashboard',
        error: error.message
      });
    }
  },

  /**
   * POST /api/dashboards/delete-multiple
   * Delete multiple dashboards
   */
  async deleteMultipleDashboards(req, res) {
    try {
      const { ids } = req.body;
      const { tenant, subtenant } = req.user;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide dashboard IDs to delete'
        });
      }

      const deletedCount = await Dashboard.deleteMultiple(ids, tenant, subtenant);

      res.json({
        success: true,
        message: `${deletedCount} dashboard(s) deleted successfully`,
        data: { deletedCount }
      });
    } catch (error) {
      console.error('Error deleting dashboards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete dashboards',
        error: error.message
      });
    }
  },

  /**
   * GET /api/dashboards/users/all
   * Get all users for dropdown
   */
  async getAllUsers(req, res) {
    try {
      const { tenant, subtenant } = req.user;
      const users = await Dashboard.getAllUsers(tenant, subtenant);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  },

  /**
   * GET /api/dashboards/widgets/all
   * Get all custom widgets for dropdown
   */
  async getAllCustomWidgets(req, res) {
    try {
      const { tenant, subtenant } = req.user;
      const widgets = await Dashboard.getAllCustomWidgets(tenant, subtenant);

      res.json({
        success: true,
        data: widgets
      });
    } catch (error) {
      console.error('Error fetching widgets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch widgets',
        error: error.message
      });
    }
  },

  /**
   * GET /api/dashboards/widgets/predefined
   * Get predefined widgets list
   */
  async getPredefinedWidgets(req, res) {
    try {
      const widgets = Dashboard.getPredefinedWidgets();

      res.json({
        success: true,
        data: widgets
      });
    } catch (error) {
      console.error('Error fetching predefined widgets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch predefined widgets',
        error: error.message
      });
    }
  },

  /**
   * POST /api/dashboards/:id/users
   * Add user to dashboard
   */
  async addUserToDashboard(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const { tenant, subtenant } = req.user;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const result = await Dashboard.addUser(id, userId, tenant, subtenant);

      if (result.alreadyExists) {
        return res.status(400).json({
          success: false,
          message: 'User already added to this dashboard'
        });
      }

      res.json({
        success: true,
        message: 'User added to dashboard successfully'
      });
    } catch (error) {
      console.error('Error adding user to dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add user to dashboard',
        error: error.message
      });
    }
  },

  /**
   * DELETE /api/dashboards/:id/users/:userId
   * Remove user from dashboard
   */
  async removeUserFromDashboard(req, res) {
    try {
      const { id, userId } = req.params;
      const { tenant, subtenant } = req.user;

      const removed = await Dashboard.removeUser(id, userId, tenant, subtenant);

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'User not found in dashboard'
        });
      }

      res.json({
        success: true,
        message: 'User removed from dashboard successfully'
      });
    } catch (error) {
      console.error('Error removing user from dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove user from dashboard',
        error: error.message
      });
    }
  },

  /**
   * GET /api/dashboards/user/:userId
   * Get dashboards for a specific user (User Console)
   */
  async getUserDashboards(req, res) {
    try {
      const { userId } = req.params;
      const { tenant, subtenant } = req.user;

      const dashboards = await Dashboard.getDashboardsForUser(userId, tenant, subtenant);

      res.json({
        success: true,
        data: dashboards
      });
    } catch (error) {
      console.error('Error fetching user dashboards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user dashboards',
        error: error.message
      });
    }
  }
};

export default dashboardController;
