/**
 * Authentication Routes
 *
 * Defines API endpoints for JWT token generation.
 */

import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/token
 * Generate JWT token from tenant/subtenant codes
 *
 * Body: { tenant: "CODE", subtenant: "CODE" }
 */
router.post('/token', authController.generateToken);

export default router;
