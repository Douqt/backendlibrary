// Import packages
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

// Import our files
const db = require('./config/db'); // Database connection
const errorHandler = require('./middleware/errorHandler');

// Create Express app
const app = express();

// ===========================
// MIDDLEWARE (runs on every request)
// ===========================
app.use(cors()); // Allow requests from React app
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({extended:true})); // Parse form data

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ===========================
// ROUTES
// ===========================

// Test route - confirms server is running
app.get('/', (req, res) => {
  res.json({
    message: 'Library Management API is running!',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/books', require('./routes/books'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/electronics', require('./routes/electronics'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/members', require('./routes/members'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fines', require('./routes/fines'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/staff', require('./routes/staff'));

// ===========================
// ERROR HANDLING
// ===========================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ===========================
// START SERVER
// ===========================
const PORT = process.env.PORT || 5000;
const https = require('https');
const fs = require('fs');

// For development, generate self-signed certificate
// Run: openssl req -nodes -new -x509 -keyout server.key -out server.cert
const key = fs.readFileSync('./server.key');
const cert = fs.readFileSync('./server.cert');

const server = https.createServer({ key, cert }, app);

server.listen(PORT, () => {
  console.log(`server running on port ${PORT} with HTTPS`);
  console.log(`https://localhost:${PORT}`);
  console.log(`environment: ${process.env.NODE_ENV || 'development'}`);
});
