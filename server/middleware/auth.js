/**
 * JWT Authentication Middleware
 *
 * Verifies JWT tokens and extracts tenant/subtenant context.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Middleware to authenticate JWT token
 * Extracts tenant/subtenant from token and adds to req.user
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add tenant/subtenant context to request
    req.user = {
      tenant: decoded.tenant,
      subtenant: decoded.subtenant,
      tenantCode: decoded.tenantCode,
      subtenantCode: decoded.subtenantCode
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
