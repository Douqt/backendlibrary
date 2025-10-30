// Import the mysql2 library with promise support
const mysql = require('mysql2/promise');
require('dotenv').config(); // Load environment variables from .env file

// Create a connection pool
// A pool allows multiple database queries to run at the same time
const pool = mysql.createPool({
  host: process.env.DB_HOST,       //Azure MySQL host
  user: process.env.DB_USER,       // database username
  password: process.env.DB_PASSWORD, //database password
  database: process.env.DB_NAME,   // Database name (library_db)
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,             // Max 10 simultaneous connections
  queueLimit: 0,
  ssl: { rejectUnauthorized: false, servername: null } // Accept self-signed SSL certificates
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully!');
    connection.release(); // Release the connection back to the pool
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    console.log('(This is okay if you haven\'t set up Azure MySQL yet)');
  });

// Export the pool so other files can use it
module.exports = pool;
