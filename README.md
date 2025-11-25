# Library Database Management System

A comprehensive full-stack library management system built with MySQL, Node.js/Express, and React. This project implements a multi-branch library system with member management, catalog operations, loan tracking, fines, holds, reservations, and notifications.

## Table of Contents
- [Project Architecture](#project-architecture)
- [Technologies Used](#technologies-used)
- [File Structure & Descriptions](#file-structure--descriptions)
- [Key Features](#key-features)
- [Installation Instructions](#installation-instructions)
- [Testing Credentials](#testing-credentials)
- [Troubleshooting](#troubleshooting)

## Project Architecture

This is a three-tier full-stack application consisting of:

### Database Layer
- **MySQL 8.x** database with complex schema
- 20+ tables supporting library operations
- Business logic implemented via triggers and stored procedures
- Views for reporting and analytics
- Soft delete functionality for data integrity

### Backend Layer
- **Node.js/Express 5.1.0** RESTful API server
- 23 API route handlers for different entities
- Service layer for business logic
- Middleware for error handling and request processing
- Scheduled jobs for notifications
- Email service integration

### Frontend Layer
- **React 19.1.1** Single Page Application
- **Vite 7.1.12** for fast development and building
- **Tailwind CSS 3.4.17** for responsive styling
- Component-based architecture with routing
- Real-time notifications and toast messages

## Technologies Used

### Database
- MySQL 8.x (Azure MySQL Server)
- SQL triggers and stored procedures
- Database views for complex queries

### Backend
- Node.js (CommonJS modules)
- Express 5.1.0 - Web framework
- mysql2 - MySQL client with Promise support
- node-cron - Task scheduling
- nodemailer - Email notifications
- cors - Cross-origin resource sharing
- dotenv - Environment variable management

### Frontend
- React 19.1.1 - UI library
- Vite 7.1.12 - Build tool with Hot Module Replacement
- React Router DOM 7.9.5 - Client-side routing
- Axios 1.13.2 - HTTP client
- Tailwind CSS 3.4.17 - Utility-first CSS
- Lucide React - Icon library
- Recharts - Data visualization
- Sonner - Toast notifications

## File Structure & Descriptions

### Root Level Files

#### Database Files
- **`Basic_HW2.sql`** (38KB) - Main database schema file containing:
  - All table definitions (branches, members, staff, books, movies, articles, electronics, loans, fines, payments, hold_requests, reservations, events, services, notifications, etc.)
  - Triggers for automated business logic (loan validation, fine calculation, hold queue management, notification creation)
  - Stored procedures (admin_delete_item_copy, fulfill_hold_and_create_loan, approve_member_type_change, etc.)
  - Initial database views

- **`dummy_data.sql`** (14KB) - Sample data for testing and development:
  - 4 library branches
  - 6 member accounts with authentication
  - 5 publishers, 10 authors, 8 directors
  - Books, movies, articles, and electronic devices inventory
  - Sample loans, fines, payments, and hold requests
  - Events, services, and reservations

#### Configuration Files
- **`package.json`** - Root project metadata (CommonJS configuration)
- **`.env`** - Environment variables for database connection (not in repository)
- **`.gitignore`** - Git ignore rules for node_modules, .env files, etc.
- **`README.md`** - This documentation file

### Backend Directory (`/backend/`)

#### Core Server Files
- **`server.js`** (91 lines) - Main Express application entry point:
  - Initializes Express with CORS middleware
  - Loads all API route modules
  - Starts notification scheduler for background jobs
  - Configures to run on port 5000 (or environment variable)

- **`package.json`** - Backend dependencies and scripts:
  - `npm start` - Run production server
  - `npm run dev` - Run development server with nodemon

#### Configuration (`/backend/config/`)
- **`db.js`** - MySQL connection pool configuration with Azure SSL support

#### Middleware (`/backend/middleware/`)
- **`asyncHandler.js`** - Wrapper for async route handlers to catch errors
- **`errorHandler.js`** - Global error handling middleware

#### Routes (`/backend/routes/`)
23 API route files implementing RESTful endpoints:
- **`admin_report.js`** - Admin dashboard and reporting endpoints
- **`articles.js`** - Article catalog CRUD operations
- **`auth.js`** - Member and staff authentication
- **`authors.js`** - Author management
- **`books.js`** - Book catalog management and search
- **`branches.js`** - Library branch operations
- **`directors.js`** - Movie director data
- **`electronics.js`** - Electronic device rental management
- **`events.js`** - Library event management and registration
- **`fines.js`** - Fine calculation and management
- **`hold_requests.js`** - Hold queue system with priority scoring
- **`loans.js`** - Checkout, return, and renewal operations
- **`member_type_requests.js`** - Member type upgrade request workflow
- **`members.js`** - Member account management
- **`movies.js`** - Movie catalog management
- **`notifications.js`** - In-app notification system
- **`payments.js`** - Payment processing and history
- **`publishers.js`** - Publisher data management
- **`reservations.js`** - Room reservation system
- **`services.js`** - Library service management
- **`staff.js`** - Staff account management

#### Services (`/backend/services/`)
Business logic layer:
- **`backgroundJobService.js`** - Background task management
- **`emailService.js`** - Email notification delivery via nodemailer
- **`fineService.js`** - Fine calculation and processing logic
- **`notificationService.js`** - Notification creation and delivery
- **`priorityQueueService.js`** - Hold queue priority calculation

#### Jobs (`/backend/jobs/`)
- **`notificationScheduler.js`** - Cron job for sending due date reminders

#### Migrations (`/backend/migrations/`)
Database schema evolution files (apply in order):
1. **`add_soft_delete_to_books.sql`** - Soft delete for books table
2. **`add_soft_delete_to_loans.sql`** - Soft delete for loans table
3. **`add_soft_delete_to_members.sql`** - Soft delete for members table
4. **`create_notifications_table.sql`** - In-app notification system
5. **`create_notification_logs_table.sql`** - Notification delivery tracking
6. **`create_member_type_change_requests.sql`** - Member type upgrade workflow
7. **`add_type_change_notification_types.sql`** - Additional notification types
8. **`create_approve_type_change_procedure.sql`** - Stored procedure for approvals
9. **`add_hold_available_notifications.sql`** - Hold ready notifications
10. **`update_availability_triggers.sql`** - Enhanced availability tracking
11. **`update_hold_queue_trigger.sql`** - Improved hold queue logic

#### Database Views
- **`create_views.sql`** - Basic views for common queries
- **`create_reports_views.sql`** - Admin reporting views
- **`migrate.js`** - Automated migration runner script

#### Other Backend Files
- **`.env`** - Backend environment variables (not in repository)
- **`certs/`** - SSL certificates for Azure MySQL connection
- **`server.log`** - Server activity logs

### Frontend Directory (`/web/`)

#### Configuration Files
- **`package.json`** - Frontend dependencies and build scripts:
  - `npm run dev` - Start Vite development server
  - `npm run build` - Build for production
  - `npm run preview` - Preview production build

- **`vite.config.js`** - Vite build tool configuration
- **`tailwind.config.js`** - Tailwind CSS customization (colors, animations)
- **`eslint.config.js`** - ESLint rules for React code quality
- **`postcss.config.js`** - PostCSS configuration for Tailwind
- **`nginx.conf`** - Nginx reverse proxy configuration for deployment
- **`.env.local`** - Frontend environment variables (API URL)
- **`index.html`** - HTML entry point

#### Source Code (`/web/src/`)
- **`main.jsx`** - React application entry point
- **`App.jsx`** (89KB) - Main application component with React Router configuration
- **`App.css`** - Application-specific styles
- **`index.css`** - Global styles and Tailwind directives
- **`config.js`** - API endpoint configuration

#### Components (`/web/src/components/`)
17 React components implementing the UI:
- **`AddItems.jsx`** - Admin interface for adding catalog items
- **`AdminSUMM_Report.jsx`** - Admin dashboard with reports and analytics
- **`Categories.jsx`** - Catalog browsing by category (books, movies, articles, electronics)
- **`Checkout.jsx`** - Checkout and loan management interface
- **`FeaturedBooks.jsx`** - Featured items display component
- **`Footer.jsx`** - Application footer
- **`Header.jsx`** - Navigation header with user menu
- **`Hero.jsx`** - Landing page hero section
- **`LoginModal.jsx`** - Login dialog component
- **`NotificationBell.jsx`** - Notification center dropdown
- **`PaymentHistory.jsx`** - Payment history view
- **`PaymentModal.jsx`** - Payment processing dialog
- **`Profile.jsx`** - Member profile page with loans, holds, fines
- **`SignIn.jsx`** - Sign in form
- **`Signup.jsx`** - Member registration form
- **`Staff.jsx`** - Staff dashboard interface
- **`ui/`** - Reusable UI components directory

#### Build Output
- **`dist/`** - Production build output (generated by `npm run build`)
- **`public/`** - Static assets directory

## Key Features

### Member Features
- Browse catalog by category (books, movies, articles, electronics)
- Search and filter items
- Check out items (respecting loan limits by member type)
- View active loans and due dates
- Place holds on checked-out items
- Pay fines (full or partial payments)
- View payment history
- Reserve study rooms, meeting rooms, conference rooms
- Register for library events
- Receive notifications for due dates and holds

### Staff Features
- All member features
- Process checkouts and returns
- Manage fines and payments
- View member accounts
- Approve hold queue items
- Manage events and services
- View staff reports

### Admin Features
- All staff features
- Add/edit/delete catalog items
- Manage inventory across branches
- View comprehensive reports:
  - Biweekly loan activity
  - Fine collection reports
  - Member summary statistics
  - Staff performance reports
- Approve member type change requests
- System-wide analytics with data visualization

### System Features
- Multi-branch library support
- Member types with different loan limits:
  - Local: 3 items
  - Student: 5 items
  - Faculty: 10 items
- Automatic fine calculation for overdue items
- Hold queue with priority scoring based on:
  - Member type (faculty > student > local)
  - Request date (earlier requests prioritized)
- Email notifications for:
  - Due date reminders
  - Hold availability
  - Type change approvals
- Soft delete functionality to preserve data integrity
- Audit trails for payments and loans

## Installation Instructions

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** >= 20.19.0 ([Download](https://nodejs.org/))
- **MySQL** 8.x ([Download](https://dev.mysql.com/downloads/mysql/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Step 1: Clone the Repository

```bash
git clone https://github.com/orjass2016/Library_DB_Project.git
cd Library_DB_Project
```

### Step 2: Database Setup

#### A. Create the Database and Import Schema

Connect to your MySQL server and create the database:

```bash
# Connect to MySQL
mysql -u root -p

# Create the database
CREATE DATABASE library_db;
exit;

# Import the main schema
mysql -u root -p library_db < Basic_HW2.sql
```

#### B. Load Sample Data (Optional but Recommended)

```bash
mysql -u root -p library_db < dummy_data.sql
```

This will populate the database with sample data for testing, including:
- 4 library branches
- 6 member accounts
- Catalog items (books, movies, articles, electronics)
- Sample transactions

#### C. Apply Database Migrations

Run each migration file in order:

```bash
cd backend

# Apply migrations in sequence
mysql -u root -p library_db < migrations/add_soft_delete_to_books.sql
mysql -u root -p library_db < migrations/add_soft_delete_to_loans.sql
mysql -u root -p library_db < migrations/add_soft_delete_to_members.sql
mysql -u root -p library_db < migrations/create_notifications_table.sql
mysql -u root -p library_db < migrations/create_notification_logs_table.sql
mysql -u root -p library_db < migrations/create_member_type_change_requests.sql
mysql -u root -p library_db < migrations/add_type_change_notification_types.sql
mysql -u root -p library_db < migrations/create_approve_type_change_procedure.sql
mysql -u root -p library_db < migrations/add_hold_available_notifications.sql
mysql -u root -p library_db < migrations/update_availability_triggers.sql
mysql -u root -p library_db < migrations/update_hold_queue_trigger.sql
```

Alternatively, use the automated migration script:

```bash
node migrate.js
```

#### D. Create Database Views

```bash
# Create basic views
mysql -u root -p library_db < create_views.sql

# Create reporting views
mysql -u root -p library_db < create_reports_views.sql
```

### Step 3: Backend Setup

#### A. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install all required packages:
- Express, mysql2, cors, dotenv, node-cron, nodemailer, and more

#### B. Configure Environment Variables

Create a `.env` file in the `/backend/` directory:

```bash
# Create the .env file
touch .env
```

Add the following configuration (adjust values for your setup):

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=library_db
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (for notifications)
# If using Gmail, enable "App Passwords" in Google Account settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Library System <your_email@gmail.com>
```

**Important Notes:**
- Replace `your_mysql_password` with your actual MySQL root password
- For email notifications, use Gmail App Passwords (not your regular password)
- Never commit the `.env` file to version control

#### C. Start the Backend Server

```bash
# Development mode (with auto-reload on file changes)
npm run dev

# OR Production mode
npm start
```

You should see:
```
Database connected successfully!
Server is running on port 5000
Notification scheduler initialized
```

The backend API is now running at `http://localhost:5000`

### Step 4: Frontend Setup

#### A. Install Frontend Dependencies

Open a new terminal window/tab (keep backend running):

```bash
cd web
npm install
```

This will install React, Vite, Tailwind CSS, and all other frontend dependencies.

#### B. Configure Frontend Environment Variables

Create a `.env.local` file in the `/web/` directory:

```bash
# Create the .env.local file
touch .env.local
```

Add the API URL configuration:

```env
# API Base URL
VITE_API_URL=http://localhost:5000
```

#### C. Start the Frontend Development Server

```bash
npm run dev
```

You should see:
```
VITE v7.1.12  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

The frontend is now running at `http://localhost:5173` (or similar port)

#### D. Build for Production (Optional)

To create a production-optimized build:

```bash
npm run build

# Preview the production build
npm run preview
```

Production files will be in `/web/dist/`

### Step 5: Verify Installation

#### Test Backend API

Open a new terminal and test the API:

```bash
curl http://localhost:5000/
```

Expected response:
```json
{"message": "Library Management API is running!", "version": "1.0.0"}
```

#### Test Database Connection

Check the backend terminal for:
- "Database connected successfully!"
- "Notification scheduler initialized"

If you see errors, check your `.env` configuration.

#### Test Frontend Application

1. Open your web browser to `http://localhost:5173`
2. You should see the Library Management System homepage
3. Click on "Sign In" in the navigation header
4. Try logging in with sample credentials (see [Testing Credentials](#testing-credentials))

### Step 6: Verify Features

After successful login, test these features:

**As a Member:**
- Browse catalog by category
- Search for items
- Check out an available item
- View your profile and active loans
- Place a hold on a checked-out item

**As Staff/Admin:**
- Login with staff credentials
- Access the Staff Dashboard
- View member accounts and reports
- Process checkouts and returns

## Testing Credentials

The `dummy_data.sql` file includes several test accounts:

### Member Accounts
| Username | Password | Member Type | Email |
|----------|----------|-------------|-------|
| `alicej` | `pass1` | Student | alice.johnson@example.com |
| `bobsmith` | `pass2` | Faculty | bob.smith@example.com |
| `charlie` | `pass3` | Local | charlie.davis@example.com |

### Staff Accounts
| Username | Password | Role | Email |
|----------|----------|------|-------|
| `ellenb` | `adminpass` | Admin | ellen.brown@example.com |
| `fionaw` | `staffpass` | Staff | fiona.white@example.com |

## Troubleshooting

### Database Connection Issues

**Problem:** Backend shows "Database connection failed"

**Solutions:**
- Verify MySQL server is running: `sudo systemctl status mysql` (Linux) or check Activity Monitor/Task Manager
- Check `.env` file has correct credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- Test MySQL connection manually: `mysql -u root -p library_db`
- Ensure MySQL port 3306 is not blocked by firewall
- For Azure MySQL: Verify SSL certificates are in `/backend/certs/` directory

### Backend Won't Start

**Problem:** "Error: Cannot find module" or "Port already in use"

**Solutions:**
- Ensure all dependencies are installed: `cd backend && npm install`
- Check if port 5000 is already in use: `lsof -i :5000` (Mac/Linux) or `netstat -ano | findstr :5000` (Windows)
- Kill the process using port 5000, or change PORT in `.env` file
- Verify `.env` file exists in `/backend/` directory
- Check Node.js version: `node --version` (should be >= 20.19.0)

### Frontend Shows API Errors

**Problem:** Network errors or "Failed to fetch" in browser console

**Solutions:**
- Verify backend is running on port 5000
- Check CORS configuration in `backend/server.js`
- Verify `VITE_API_URL` in `/web/.env.local` is set to `http://localhost:5000`
- Clear browser cache and reload
- Check browser console for specific error messages

### Migration Errors

**Problem:** SQL syntax errors or duplicate column errors

**Solutions:**
- Ensure migrations are run in the correct order (numbered list above)
- Check MySQL version: `mysql --version` (requires 8.x for some features)
- If migration was partially applied, manually check what succeeded and continue
- Verify `Basic_HW2.sql` was imported before running migrations
- For duplicate errors, the migration may have already been applied

### Email Notifications Not Sending

**Problem:** No email notifications received

**Solutions:**
- Verify EMAIL_* variables in `.env` are configured correctly
- For Gmail: Enable "App Passwords" in Google Account settings
- Check spam/junk folder
- Review `backend/server.log` for email errors
- Test email configuration with a simple nodemailer test script

### Login Not Working

**Problem:** "Invalid credentials" error with correct username/password

**Solutions:**
- Verify `dummy_data.sql` was loaded: `mysql -u root -p library_db -e "SELECT * FROM authentication;"`
- Check authentication table has data
- Ensure passwords in database match test credentials (they are plaintext in dummy data)
- Check browser console for specific API error responses

## Additional Notes

### Development Workflow

- Backend runs on **port 5000** with nodemon for auto-reload
- Frontend dev server on **port 5173** with Vite HMR (Hot Module Replacement)
- Database changes require both schema updates and corresponding migrations
- Test changes with dummy data before modifying schema

### Production Deployment Considerations

- **Backend:** Deploy to Node.js hosting (Azure App Service, Heroku, AWS EC2)
- **Frontend:** Build static files (`npm run build`) and deploy to:
  - Static hosting: Netlify, Vercel, GitHub Pages
  - CDN: AWS S3 + CloudFront, Azure Static Web Apps
- **Database:** Currently configured for Azure MySQL Server
- **Domain:** Project uses librarydb.duckdns.org (DuckDNS)
- **Environment:** Update all `.env` variables for production (secure secrets, production database URL)

### Git Workflow

Current branch: `elvins_branch`
Main branch: `main`

Workflow:
1. Make changes in feature branch
2. Test thoroughly with both backend and frontend running
3. Commit changes: `git add . && git commit -m "Description"`
4. Push to GitHub: `git push origin elvins_branch`
5. Create Pull Request to merge into `main`

---

## Support

For issues or questions about this project:
- Check this README first
- Review error messages in terminal/browser console
- Verify all installation steps were completed
- Check MySQL and Node.js are running

## License

This project is an academic assignment for database systems course.

---

**Project Repository:** https://github.com/orjass2016/Library_DB_Project

**Last Updated:** November 2025
