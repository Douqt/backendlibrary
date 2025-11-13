// Import packages
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

// Import our files
const db = require('./config/db'); // Database connection
const errorHandler = require('./middleware/errorHandler');
const { initializeScheduler } = require('./jobs/notificationScheduler');


// Create Express app
const app = express();

// ===========================
// MIDDLEWARE (runs on every request)
// ===========================
// If nginx handles CORS, you can restrict/remove this later, but for now keep it simple:
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ===========================
// ROUTES
// ===========================
app.get('/', (req, res) => {
  res.json({
    message: 'Library Management API is running!',
    version: '1.0.0'
  });
});

app.use('/api/books', require('./routes/books'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/electronics', require('./routes/electronics'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/members', require('./routes/members'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/fines', require('./routes/fines'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin/report', require('./routes/admin_report'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/hold-requests', require('./routes/hold_requests'));
app.use('/api/events', require('./routes/events'));
app.use('/api/services', require('./routes/services'));
app.use('/api/reservations', require('./routes/reservations'));

// ===========================
// ERROR HANDLING
// ===========================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});
app.use(errorHandler);

// ===========================
// START SERVER (HTTP ONLY)
// ===========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize notification scheduler for due date reminders
  initializeScheduler();
  console.log('Notification scheduler initialized');
});
