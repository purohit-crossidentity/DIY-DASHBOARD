/**
 * Dashboard Routes
 *
 * API endpoints for custom dashboard operations.
 */

import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// UTILITY ROUTES (must be before :id routes)
// ============================================

// GET /api/dashboards/users/all - Get all users for dropdown
router.get('/users/all', dashboardController.getAllUsers);

// GET /api/dashboards/widgets/all - Get all custom widgets for dropdown
router.get('/widgets/all', dashboardController.getAllCustomWidgets);

// GET /api/dashboards/widgets/predefined - Get predefined widgets list
router.get('/widgets/predefined', dashboardController.getPredefinedWidgets);

// POST /api/dashboards/delete-multiple - Delete multiple dashboards
router.post('/delete-multiple', dashboardController.deleteMultipleDashboards);

// GET /api/dashboards/user/:userId - Get dashboards for specific user
router.get('/user/:userId', dashboardController.getUserDashboards);

// ============================================
// DASHBOARD CRUD ROUTES
// ============================================

// GET /api/dashboards - Get all dashboards
router.get('/', dashboardController.getAllDashboards);

// GET /api/dashboards/:id - Get single dashboard
router.get('/:id', dashboardController.getDashboard);

// POST /api/dashboards - Create new dashboard
router.post('/', dashboardController.createDashboard);

// PUT /api/dashboards/:id - Update dashboard
router.put('/:id', dashboardController.updateDashboard);

// DELETE /api/dashboards/:id - Delete single dashboard
router.delete('/:id', dashboardController.deleteDashboard);

// ============================================
// USER ACCESS ROUTES
// ============================================

// POST /api/dashboards/:id/users - Add user to dashboard
router.post('/:id/users', dashboardController.addUserToDashboard);

// DELETE /api/dashboards/:id/users/:userId - Remove user from dashboard
router.delete('/:id/users/:userId', dashboardController.removeUserFromDashboard);

export default router;
