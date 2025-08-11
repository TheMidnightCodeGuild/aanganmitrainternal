const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    // You can add additional health checks here
    // For example, check database connection, external services, etc.
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Maintenance mode endpoint (optional)
router.get('/health/maintenance', (req, res) => {
  res.status(503).json({
    status: 'maintenance',
    message: 'Service is under maintenance',
    estimatedCompletion: '2024-01-01T12:00:00Z',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;