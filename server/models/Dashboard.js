/**
 * Dashboard Model
 *
 * Database operations for Custom Dashboard feature.
 *
 * Tables used:
 * - idx2_dashboard: Main dashboard (name, desc, widget_cfg JSON)
 * - idx2_dashboard_widget_map: Links dashboards to custom widgets
 * - idx2_dashboard_user_map: Links dashboards to users (access control)
 * - idx_users: User information
 * - idx_identity_profile: Profile names
 * - idx_identity_profile_attrcfg: Profile attribute config (display_attr)
 */

import { pool } from '../config/db.js';

// Predefined system widgets (stored in widget_cfg JSON)
const PREDEFINED_WIDGETS = [
  "Identity Distribution",
  "Role Distribution",
  "Orphan Account Distribution",
  "Tickets",
  "Cloud Resource Distribution",
  "Blocked Requests",
  "Overdue Approvals",
  "Overdue Reviews",
  "Overdue Campaigns",
  "Login",
  "Forgot Password",
  "Single Sign On",
  "Access Map"
];

const Dashboard = {
  /**
   * Get all dashboards for tenant/subtenant
   */
  async getAll(tenant, subtenant) {
    console.log('DEBUG Dashboard.getAll - tenant:', tenant, 'type:', typeof tenant);
    console.log('DEBUG Dashboard.getAll - subtenant:', subtenant, 'type:', typeof subtenant);
    const query = `
      SELECT id, dashboard_name, dashboard_desc, widget_cfg
      FROM idx2_dashboard
      WHERE tenant = ? AND subtenant = ?
      ORDER BY id DESC
    `;
    console.log('DEBUG Dashboard.getAll - executing query with params:', [tenant, subtenant]);
    const [rows] = await pool.execute(query, [tenant, subtenant]);
    console.log('DEBUG Dashboard.getAll - query returned:', rows.length, 'rows');
    return rows;
  },

  /**
   * Get single dashboard by ID with widgets and users
   */
  async getById(id, tenant, subtenant) {
    // 1. Get dashboard basic info
    const dashboardQuery = `
      SELECT id, dashboard_name, dashboard_desc, widget_cfg
      FROM idx2_dashboard
      WHERE id = ? AND tenant = ? AND subtenant = ?
    `;
    const [dashboards] = await pool.execute(dashboardQuery, [id, tenant, subtenant]);

    if (dashboards.length === 0) {
      return null;
    }

    const dashboard = dashboards[0];

    // 2. Parse widget_cfg JSON (predefined widgets)
    let widgetCfg = [];
    if (dashboard.widget_cfg) {
      try {
        widgetCfg = typeof dashboard.widget_cfg === 'string'
          ? JSON.parse(dashboard.widget_cfg)
          : dashboard.widget_cfg;
      } catch (e) {
        console.error('Error parsing widget_cfg:', e);
        widgetCfg = [];
      }
    }

    // 3. Get custom widgets linked to this dashboard
    const customWidgetsQuery = `
      SELECT w.id, w.widget_name, w.widget_desc, w.widget_url,
             w.widget_chart, w.widget_filter
      FROM idx2_dashboard_widget_map dwm
      JOIN idx2_dashboard_widget w ON dwm.widget = w.id
      WHERE dwm.dashboard = ? AND dwm.tenant = ? AND dwm.subtenant = ?
    `;
    const [customWidgets] = await pool.execute(customWidgetsQuery, [id, tenant, subtenant]);

    // 4. Get users assigned to this dashboard
    const usersQuery = `
      SELECT
        dum.id as mapping_id,
        dum.user as user_id,
        u.profile as profile_id,
        u.userAttrs,
        ip.profile_name
      FROM idx2_dashboard_user_map dum
      JOIN idx_users u ON dum.user = u.id AND dum.tenant = u.tenant AND dum.subtenant = u.subtenant
      JOIN idx_identity_profile ip ON u.profile = ip.id AND u.tenant = ip.tenant AND u.subtenant = ip.subtenant
      WHERE dum.dashboard = ? AND dum.tenant = ? AND dum.subtenant = ?
    `;
    const [usersRaw] = await pool.execute(usersQuery, [id, tenant, subtenant]);

    // 5. Process users to get display names
    const users = await Promise.all(usersRaw.map(async (user) => {
      const displayName = await this.getUserDisplayName(user.user_id, user.profile_id, user.userAttrs, tenant, subtenant);
      return {
        id: user.mapping_id,
        userId: user.user_id,
        userName: displayName,
        profile: user.profile_name
      };
    }));

    return {
      ...dashboard,
      widgetCfg,
      customWidgets,
      users
    };
  },

  /**
   * Get user display name from userAttrs JSON using display_attr config
   */
  async getUserDisplayName(userId, profileId, userAttrs, tenant, subtenant) {
    try {
      // Get the display_attr for this profile
      const attrCfgQuery = `
        SELECT display_attr
        FROM idx_identity_profile_attrcfg
        WHERE profile = ? AND tenant = ? AND subtenant = ?
      `;
      const [attrCfg] = await pool.execute(attrCfgQuery, [profileId, tenant, subtenant]);

      if (attrCfg.length === 0) {
        return `User ${userId}`;
      }

      const displayAttrId = attrCfg[0].display_attr.toString();

      // Parse userAttrs JSON
      let attrs = [];
      if (userAttrs) {
        try {
          attrs = typeof userAttrs === 'string' ? JSON.parse(userAttrs) : userAttrs;
        } catch (e) {
          return `User ${userId}`;
        }
      }

      // Find the display attribute value
      const displayAttr = attrs.find(attr =>
        attr.attrId === displayAttrId ||
        attr.attrId === parseInt(displayAttrId) ||
        attr.attrId.toString() === displayAttrId
      );

      if (displayAttr && displayAttr.attrVal) {
        return displayAttr.attrVal;
      }

      // Fallback: return first non-empty attribute value
      for (const attr of attrs) {
        if (attr.attrVal && attr.attrVal.length > 0) {
          return attr.attrVal;
        }
      }

      return `User ${userId}`;
    } catch (error) {
      console.error('Error getting user display name:', error);
      return `User ${userId}`;
    }
  },

  /**
   * Create new dashboard
   */
  async create(dashboardData) {
    const { dashboardName, dashboardDesc, selectedPredefinedWidgets, customWidgetIds, users, tenant, subtenant } = dashboardData;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Build widget_cfg JSON for predefined widgets
      const widgetCfg = PREDEFINED_WIDGETS.map(widgetName => ({
        dwname: widgetName,
        status: selectedPredefinedWidgets && selectedPredefinedWidgets.includes(widgetName) ? "true" : "false"
      }));

      // 2. Insert dashboard
      const insertDashboardQuery = `
        INSERT INTO idx2_dashboard (tenant, subtenant, dashboard_name, dashboard_desc, widget_cfg)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [dashboardResult] = await connection.execute(insertDashboardQuery, [
        tenant,
        subtenant,
        dashboardName,
        dashboardDesc || '',
        JSON.stringify(widgetCfg)
      ]);

      const dashboardId = dashboardResult.insertId;

      // 3. Insert custom widget mappings if provided
      if (customWidgetIds && customWidgetIds.length > 0) {
        const widgetMapQuery = `
          INSERT INTO idx2_dashboard_widget_map (tenant, subtenant, dashboard, widget)
          VALUES (?, ?, ?, ?)
        `;
        for (const widgetId of customWidgetIds) {
          await connection.execute(widgetMapQuery, [tenant, subtenant, dashboardId, widgetId]);
        }
      }

      // 4. Insert user access mappings if provided
      if (users && users.length > 0) {
        const userMapQuery = `
          INSERT INTO idx2_dashboard_user_map (tenant, subtenant, dashboard, user)
          VALUES (?, ?, ?, ?)
        `;
        for (const userId of users) {
          await connection.execute(userMapQuery, [tenant, subtenant, dashboardId, userId]);
        }
      }

      await connection.commit();
      return { id: dashboardId, dashboardName, dashboardDesc };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Update dashboard
   */
  async update(id, dashboardData, tenant, subtenant) {
    const { dashboardName, dashboardDesc, selectedPredefinedWidgets, customWidgetIds, users } = dashboardData;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Verify dashboard exists
      const [existing] = await connection.execute(
        'SELECT id FROM idx2_dashboard WHERE id = ? AND tenant = ? AND subtenant = ?',
        [id, tenant, subtenant]
      );

      if (existing.length === 0) {
        throw new Error('Dashboard not found');
      }

      // 2. Build widget_cfg JSON
      const widgetCfg = PREDEFINED_WIDGETS.map(widgetName => ({
        dwname: widgetName,
        status: selectedPredefinedWidgets && selectedPredefinedWidgets.includes(widgetName) ? "true" : "false"
      }));

      // 3. Update dashboard basic info
      const updateQuery = `
        UPDATE idx2_dashboard
        SET dashboard_name = ?, dashboard_desc = ?, widget_cfg = ?
        WHERE id = ? AND tenant = ? AND subtenant = ?
      `;
      await connection.execute(updateQuery, [
        dashboardName,
        dashboardDesc || '',
        JSON.stringify(widgetCfg),
        id,
        tenant,
        subtenant
      ]);

      // 4. Update custom widget mappings
      if (customWidgetIds !== undefined) {
        await connection.execute(
          'DELETE FROM idx2_dashboard_widget_map WHERE dashboard = ? AND tenant = ? AND subtenant = ?',
          [id, tenant, subtenant]
        );

        if (customWidgetIds.length > 0) {
          const widgetMapQuery = `
            INSERT INTO idx2_dashboard_widget_map (tenant, subtenant, dashboard, widget)
            VALUES (?, ?, ?, ?)
          `;
          for (const widgetId of customWidgetIds) {
            await connection.execute(widgetMapQuery, [tenant, subtenant, id, widgetId]);
          }
        }
      }

      // 5. Update user access mappings
      if (users !== undefined) {
        await connection.execute(
          'DELETE FROM idx2_dashboard_user_map WHERE dashboard = ? AND tenant = ? AND subtenant = ?',
          [id, tenant, subtenant]
        );

        if (users.length > 0) {
          const userMapQuery = `
            INSERT INTO idx2_dashboard_user_map (tenant, subtenant, dashboard, user)
            VALUES (?, ?, ?, ?)
          `;
          for (const userId of users) {
            await connection.execute(userMapQuery, [tenant, subtenant, id, userId]);
          }
        }
      }

      await connection.commit();
      return { id, dashboardName, dashboardDesc };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Delete dashboard
   */
  async delete(id, tenant, subtenant) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete widget mappings
      await connection.execute(
        'DELETE FROM idx2_dashboard_widget_map WHERE dashboard = ? AND tenant = ? AND subtenant = ?',
        [id, tenant, subtenant]
      );

      // Delete user mappings
      await connection.execute(
        'DELETE FROM idx2_dashboard_user_map WHERE dashboard = ? AND tenant = ? AND subtenant = ?',
        [id, tenant, subtenant]
      );

      // Delete dashboard
      const [result] = await connection.execute(
        'DELETE FROM idx2_dashboard WHERE id = ? AND tenant = ? AND subtenant = ?',
        [id, tenant, subtenant]
      );

      await connection.commit();
      return result.affectedRows > 0;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Delete multiple dashboards
   */
  async deleteMultiple(ids, tenant, subtenant) {
    if (!ids || ids.length === 0) return 0;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const placeholders = ids.map(() => '?').join(',');

      // Delete widget mappings
      await connection.execute(
        `DELETE FROM idx2_dashboard_widget_map WHERE dashboard IN (${placeholders}) AND tenant = ? AND subtenant = ?`,
        [...ids, tenant, subtenant]
      );

      // Delete user mappings
      await connection.execute(
        `DELETE FROM idx2_dashboard_user_map WHERE dashboard IN (${placeholders}) AND tenant = ? AND subtenant = ?`,
        [...ids, tenant, subtenant]
      );

      // Delete dashboards
      const [result] = await connection.execute(
        `DELETE FROM idx2_dashboard WHERE id IN (${placeholders}) AND tenant = ? AND subtenant = ?`,
        [...ids, tenant, subtenant]
      );

      await connection.commit();
      return result.affectedRows;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Get all users for dropdown (to assign to dashboards)
   */
  async getAllUsers(tenant, subtenant) {
    const query = `
      SELECT
        u.id,
        u.profile as profile_id,
        u.userAttrs,
        u.status,
        ip.profile_name
      FROM idx_users u
      JOIN idx_identity_profile ip ON u.profile = ip.id AND u.tenant = ip.tenant AND u.subtenant = ip.subtenant
      WHERE u.tenant = ? AND u.subtenant = ?
      AND (u.isdeleted = '0' OR u.isdeleted IS NULL OR u.isdeleted = 0)
      AND u.status = 'ACTIVE'
      ORDER BY ip.profile_name, u.id
    `;
    const [users] = await pool.execute(query, [tenant, subtenant]);

    // Process to get display names
    const processedUsers = await Promise.all(users.map(async (user) => {
      const displayName = await this.getUserDisplayName(user.id, user.profile_id, user.userAttrs, tenant, subtenant);
      return {
        id: user.id,
        userName: displayName,
        profile: user.profile_name,
        status: user.status
      };
    }));

    return processedUsers;
  },

  /**
   * Get all custom widgets for dropdown
   */
  async getAllCustomWidgets(tenant, subtenant) {
    const query = `
      SELECT id, widget_name, widget_desc, widget_url, widget_chart, widget_filter
      FROM idx2_dashboard_widget
      WHERE tenant = ? AND subtenant = ?
      ORDER BY widget_name
    `;
    const [widgets] = await pool.execute(query, [tenant, subtenant]);
    return widgets;
  },

  /**
   * Get predefined widgets list
   */
  getPredefinedWidgets() {
    return PREDEFINED_WIDGETS;
  },

  /**
   * Add user to dashboard
   */
  async addUser(dashboardId, userId, tenant, subtenant) {
    // Check if mapping already exists
    const [existing] = await pool.execute(
      'SELECT id FROM idx2_dashboard_user_map WHERE dashboard = ? AND user = ? AND tenant = ? AND subtenant = ?',
      [dashboardId, userId, tenant, subtenant]
    );

    if (existing.length > 0) {
      return { alreadyExists: true };
    }

    const query = `
      INSERT INTO idx2_dashboard_user_map (tenant, subtenant, dashboard, user)
      VALUES (?, ?, ?, ?)
    `;
    await pool.execute(query, [tenant, subtenant, dashboardId, userId]);
    return { success: true };
  },

  /**
   * Remove user from dashboard
   */
  async removeUser(dashboardId, userId, tenant, subtenant) {
    const [result] = await pool.execute(
      'DELETE FROM idx2_dashboard_user_map WHERE dashboard = ? AND user = ? AND tenant = ? AND subtenant = ?',
      [dashboardId, userId, tenant, subtenant]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get dashboards for a specific user (User Console)
   */
  async getDashboardsForUser(userId, tenant, subtenant) {
    const query = `
      SELECT d.id, d.dashboard_name, d.dashboard_desc, d.widget_cfg
      FROM idx2_dashboard d
      JOIN idx2_dashboard_user_map dum ON d.id = dum.dashboard
      WHERE dum.user = ? AND dum.tenant = ? AND dum.subtenant = ?
      ORDER BY d.dashboard_name
    `;
    const [rows] = await pool.execute(query, [userId, tenant, subtenant]);
    return rows;
  }
};

export default Dashboard;
