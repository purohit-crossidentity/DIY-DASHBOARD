/**
 * Authentication Controller
 *
 * Handles JWT token generation from tenant/subtenant URL parameters.
 * Maps tenant/subtenant codes to database IDs and issues JWT tokens.
 */

import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const authController = {
  /**
   * POST /api/auth/token
   * Generate JWT token from tenant/subtenant codes
   *
   * Body: { tenant: "CODE", subtenant: "CODE" }
   * Returns: { token, tenantId, subtenantId }
   */
  generateToken: async (req, res) => {
    try {
      const { tenant, subtenant } = req.body;

      // Validate input
      if (!tenant || !subtenant) {
        return res.status(400).json({
          success: false,
          message: 'Tenant and subtenant are required'
        });
      }

      // Look up tenant ID from tenant_id code
      const [tenantRows] = await pool.query(
        'SELECT id FROM cix_tenant WHERE tenant_id = ? AND status = ? LIMIT 1',
        [tenant, 'ACTIVE']
      );

      if (tenantRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Tenant '${tenant}' not found or inactive`
        });
      }

      const tenantId = tenantRows[0].id;

      // Look up subtenant ID from subtenant_id code
      const [subtenantRows] = await pool.query(
        'SELECT id FROM cix_subtenant WHERE subtenant_id = ? AND tenant = ? AND status = ? LIMIT 1',
        [subtenant, tenantId, 'ACTIVE']
      );

      if (subtenantRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Subtenant '${subtenant}' not found or inactive for tenant '${tenant}'`
        });
      }

      const subtenantId = subtenantRows[0].id;

      console.log(`Mapped: tenant '${tenant}' -> ID ${tenantId}, subtenant '${subtenant}' -> ID ${subtenantId}`);

      // Generate JWT token with tenant/subtenant context
      const token = jwt.sign(
        {
          tenant: tenantId,
          subtenant: subtenantId,
          tenantCode: tenant,
          subtenantCode: subtenant
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        data: {
          token,
          tenant: tenantId,
          subtenant: subtenantId
        }
      });
    } catch (error) {
      console.error('Token generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate token',
        error: error.message
      });
    }
  }
};

export default authController;
