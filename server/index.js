/**
 * Express Server - Main Entry Point
 *
 * Custom Dashboard Backend API Server
 * Handles CRUD operations for dashboard configurations.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/db.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// ===========================================
// MIDDLEWARE
// ===========================================

// Enable CORS for React frontend
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ===========================================
// ROUTES
// ===========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Custom Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Dashboard routes (protected)
app.use('/api/dashboards', dashboardRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// ===========================================
// START SERVER
// ===========================================

const startServer = async () => {
  // Test database connection
  await testConnection();

  // Start Express server
  app.listen(PORT, () => {
    console.log(`
================================================
   Custom Dashboard Backend API
================================================
   Server running on: http://localhost:${PORT}
   Health check: /api/health
   Dashboard API: /api/dashboards
================================================
    `);
  });
};

startServer();
