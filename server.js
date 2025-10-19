/**
 * Lisa's AI Meal Planner MVP - Express Server
 * Main server file with security middleware and configuration
 */

// Load environment variables first
require('dotenv').config();

// Import required packages
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Get PORT from environment or use default
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy - Required for Replit and other proxy environments
// This allows rate limiting and other middleware to work correctly
app.set('trust proxy', 1);

/**
 * MIDDLEWARE CONFIGURATION
 * Order matters! These are applied in sequence to every request.
 */

// 1. Helmet - Security headers to protect against common vulnerabilities
app.use(helmet());

// 2. CORS - Cross-Origin Resource Sharing configuration
app.use(cors({
  origin: NODE_ENV === 'production'
    ? ['https://replit.com', 'https://*.repl.co'] // Restrict in production
    : '*', // Allow all origins in development
  credentials: true
}));

// 3. Body parsers - Parse incoming JSON and URL-encoded data
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// 4. Rate limiting - Prevent abuse by limiting requests per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// 5. Static file serving - Serve frontend files from public/ directory
app.use(express.static('public'));

// 6. Request logging middleware (for debugging)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * ROUTES
 */

// Health check endpoint - Verify server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// Root endpoint - Basic info
app.get('/', (req, res) => {
  res.json({
    message: "Lisa's AI Meal Planner API",
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// API routes will be mounted here (in future tasks)
// app.use('/api', apiRoutes);

/**
 * ERROR HANDLING
 */

// 404 handler - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler - Catch all errors
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Don't expose error details in production
  const errorMessage = NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    error: errorMessage
  });
});

/**
 * SERVER STARTUP
 */

// Start the server
app.listen(PORT, () => {
  console.log('\n🚀 Server started successfully!');
  console.log(`📍 Environment: ${NODE_ENV}`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('\nPress Ctrl+C to stop the server\n');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use.`);
    console.error('Please stop the other server or use a different port.');
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Export app for testing purposes
module.exports = app;
