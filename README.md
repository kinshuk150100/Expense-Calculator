# 💰 Splitwise Expense Tracker

A modern, full-stack expense tracking application built with Next.js, Express, and MySQL. Track your daily expenses, analyze spending patterns, and get AI-powered insights to manage your finances better.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Development](#-development)
- [Production Deployment](#-production-deployment)
- [Additional Resources](#-additional-resources)

---

## ✨ Features

### 🔐 Authentication & Security

- **User Registration & Login**
  - Secure user registration with email validation
  - JWT-based authentication with httpOnly cookies
  - Password hashing using bcrypt
  - Session management with automatic token refresh
  - Protected routes with authentication middleware

- **Security Features**
  - Rate limiting on authentication endpoints
  - Input sanitization to prevent XSS attacks
  - SQL injection prevention with parameterized queries
  - CORS protection
  - Request logging and error tracking

### 💸 Expense Management

- **Add Expenses**
  - Quick expense entry form with validation
  - Support for 8 default categories: Food, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Other
  - Custom category creation (user-specific)
  - Amount validation (positive numbers, max 6 digits)
  - Date selection (past dates only)
  - Note/description field (max 200 characters)
  - Real-time form validation with Yup and Formik

- **View & Filter Expenses**
  - List all expenses sorted by date (newest first)
  - Month and year filtering with dropdown selectors
  - Filter by specific month (January - December)
  - Filter by specific year (2000 - current year)
  - "All Months" and "All Years" options to show all expenses
  - Responsive expense cards with category badges
  - Color-coded category badges for easy identification

- **Edit Expenses**
  - In-place editing with modal interface
  - Update amount, category, note, and date
  - Same validation rules as creation
  - Optimistic UI updates

### 📊 Analytics & Insights

- **Monthly Summary**
  - Total expenses for selected month/year
  - Expense count
  - Category-wise breakdown with percentages
  - Visual progress bars for each category
  - Color-coded category visualization
  - Dynamic title based on selected period

- **Expense Summary**
  - Overall spending totals
  - Category-wise totals
  - RESTful API endpoint for programmatic access

- **AI-Powered Insights** (Optional)
  - Analyze spending patterns using OpenAI API
  - Get overspending alerts by category
  - Receive savings suggestions
  - Identify spending trends
  - Personalized recommendations
  - Falls back to mock insights if OpenAI API key is not configured

### 🏷️ Custom Categories

- **User-Specific Categories**
  - Create unlimited custom categories
  - Categories are isolated per user (not shared)
  - Add categories on-the-fly from expense form
  - Delete custom categories
  - Categories persist in database
  - Alphabetically sorted display

### 💰 Salary Reminder

- **Salary Date Tracking**
  - Set your salary credit date (day of month, 1-31)
  - Edit salary date anytime
  - Delete salary reminder
  - Automatic calculation of days remaining until next salary
  - Visual alerts:
    - 🔴 Red: 3 days or less remaining
    - 🟠 Orange: 4-7 days remaining
    - 🟢 Green: More than 7 days remaining
  - Special messages for today and tomorrow
  - Handles edge cases (e.g., 31st day in months with fewer days)

### 🎨 User Interface

- **Modern Design**
  - Clean, responsive UI with Tailwind CSS
  - Mobile-first design approach
  - Gradient cards and buttons
  - Smooth animations and transitions
  - Loading states with spinners
  - Empty states with helpful messages

- **User Experience**
  - Toast notifications for all actions (success/error)
  - Confirmation modals for destructive actions (delete, logout)
  - Loading indicators during API calls
  - Error handling with user-friendly messages
  - Optimistic UI updates
  - Form auto-reset after successful submission

- **Accessibility**
  - Semantic HTML
  - ARIA labels for screen readers
  - Keyboard navigation support
  - Focus management
  - Color contrast compliance

### 🔧 Technical Features

- **Monorepo Architecture**
  - Workspace-based project structure
  - Shared TypeScript types package
  - Independent frontend and backend builds
  - Unified development scripts

- **Type Safety**
  - Full TypeScript coverage
  - Shared type definitions
  - Type-safe API calls
  - Compile-time error checking

- **Database**
  - MySQL 8.0 with Docker
  - Automatic schema initialization
  - UUID primary keys
  - Proper indexes for performance
  - Foreign key constraints
  - Connection pooling

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Management**: Formik + Yup
- **State Management**: React Context API
- **HTTP Client**: Fetch API
- **Notifications**: react-hot-toast
- **Icons**: SVG icons

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL 8.0
- **ORM/Query**: mysql2 (raw SQL with connection pooling)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit
- **Logging**: Custom logger utility
- **AI Integration**: OpenAI API (optional)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: MySQL 8.0 container
- **Package Management**: npm workspaces

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher
- **npm** 9 or higher
- **Docker** and **Docker Compose**
- **Git** (optional, for cloning)

---

## 🚀 Quick Start

### 1. Clone the Repository (if applicable)

```bash
git clone <repository-url>
cd splitwise
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (frontend, backend, shared).

### 3. Start MySQL Database

```bash
docker-compose up -d
```

This starts MySQL in a Docker container on port 3306.

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Backend Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Database Configuration (MySQL)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=splitwise
MYSQL_PASSWORD=splitwise123
MYSQL_DATABASE=splitwise

# OpenAI Configuration (Optional - for AI insights)
OPENAI_API_KEY=your-openai-api-key-here
```

> **Note**: Change `JWT_SECRET` to a strong random string in production!

### 5. Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts both:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000

Or start them separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### 6. Access the Application

1. Open http://localhost:3000 in your browser
2. Register a new account or login
3. Start tracking your expenses!

---

## 📁 Project Structure

```
splitwise/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   │   ├── page.tsx     # Home page (expense tracker)
│   │   │   ├── login/       # Login page
│   │   │   └── register/   # Registration page
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Reusable UI components
│   │   │   ├── ExpenseForm.tsx
│   │   │   ├── ExpenseList.tsx
│   │   │   ├── MonthlySummary.tsx
│   │   │   ├── DateFilter.tsx
│   │   │   ├── SalaryReminder.tsx
│   │   │   └── AIInsights.tsx
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useExpenses.ts
│   │   ├── lib/            # Utilities and API client
│   │   │   └── api.ts
│   │   ├── schemas/        # Validation schemas
│   │   │   └── expenseSchema.ts
│   │   └── utils/          # Helper functions
│   │       └── formatters.ts
│   └── package.json
│
├── backend/                  # Express backend API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   │   ├── auth.ts      # Authentication routes
│   │   │   ├── expenses.ts  # Expense CRUD routes
│   │   │   ├── categories.ts # Custom category routes
│   │   │   ├── salary.ts    # Salary reminder routes
│   │   │   └── ai.ts        # AI insights route
│   │   ├── middleware/      # Express middleware
│   │   │   ├── auth.ts      # JWT authentication
│   │   │   ├── validation.ts # Input validation
│   │   │   ├── rateLimiter.ts # Rate limiting
│   │   │   └── requestLogger.ts # Request logging
│   │   ├── services/        # Business logic services
│   │   │   └── aiService.ts # OpenAI integration
│   │   ├── utils/           # Utility functions
│   │   │   ├── sanitize.ts  # Input sanitization
│   │   │   └── logger.ts    # Logging utility
│   │   ├── config/          # Configuration
│   │   │   └── env.ts       # Environment variables
│   │   ├── db.ts            # Database connection & schema
│   │   └── index.ts         # Express app entry point
│   └── package.json
│
├── shared/                   # Shared TypeScript types
│   ├── types/
│   │   └── index.ts         # Type definitions
│   └── package.json
│
├── docker-compose.yml        # Docker Compose configuration
├── package.json              # Root package.json (monorepo)
└── README.md                 # This file
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:4000/api
```

### Authentication

All endpoints except `/auth/register` and `/auth/login` require authentication via JWT token in httpOnly cookie.

### Endpoints

#### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login user | No |
| `POST` | `/auth/logout` | Logout user | Yes |
| `GET` | `/auth/me` | Get current user info | Yes |

#### Expenses

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/expenses` | Get all expenses (paginated) | Yes |
| `POST` | `/expenses` | Create a new expense | Yes |
| `PUT` | `/expenses/:id` | Update an expense | Yes |
| `GET` | `/expenses/summary` | Get expense summary | Yes |

**Query Parameters for GET /expenses:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

#### Categories

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/categories` | Get custom categories | Yes |
| `POST` | `/categories` | Add custom category | Yes |
| `DELETE` | `/categories/:categoryName` | Delete custom category | Yes |

#### Salary Reminder

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/salary` | Get salary reminder | Yes |
| `POST` | `/salary` | Set/update salary reminder | Yes |
| `DELETE` | `/salary` | Delete salary reminder | Yes |

#### AI Insights

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/ai/insights` | Get AI-powered insights | Yes |

### Request/Response Examples

#### Create Expense

**Request:**
```json
POST /api/expenses
{
  "amount": 150.50,
  "category": "Food",
  "note": "Lunch at restaurant",
  "date": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "amount": 150.50,
    "category": "Food",
    "note": "Lunch at restaurant",
    "date": "2024-01-15",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Expense created successfully"
}
```

#### Get Expenses (Paginated)

**Request:**
```
GET /api/expenses?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expenses": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## 🗄️ Database Schema

The database schema is automatically initialized when the backend starts. All tables use UUIDs (VARCHAR(36)) as primary keys.

### Tables

#### `users`
- `id` (VARCHAR(36), PRIMARY KEY)
- `name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `password` (TEXT, NOT NULL) - bcrypt hashed
- `createdAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

#### `expenses`
- `id` (VARCHAR(36), PRIMARY KEY)
- `userId` (VARCHAR(36), FOREIGN KEY → users.id, ON DELETE CASCADE)
- `amount` (DECIMAL(10, 2), NOT NULL)
- `category` (VARCHAR(50), NOT NULL)
- `note` (VARCHAR(500), NOT NULL)
- `date` (DATE, NOT NULL)
- `createdAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

#### `custom_categories`
- `id` (VARCHAR(36), PRIMARY KEY)
- `userId` (VARCHAR(36), FOREIGN KEY → users.id, ON DELETE CASCADE)
- `categoryName` (VARCHAR(50), NOT NULL)
- `createdAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- UNIQUE constraint on (userId, categoryName)

#### `salary_reminders`
- `id` (VARCHAR(36), PRIMARY KEY)
- `userId` (VARCHAR(36), FOREIGN KEY → users.id, ON DELETE CASCADE)
- `salaryDate` (TINYINT, NOT NULL) - Day of month (1-31)
- `createdAt` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updatedAt` (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
- UNIQUE constraint on userId (one reminder per user)

### Indexes

- `idx_users_email` on `users(email)`
- `idx_expenses_userId` on `expenses(userId)`
- `idx_expenses_category` on `expenses(category)`
- `idx_expenses_date` on `expenses(date)`
- `idx_custom_categories_userId` on `custom_categories(userId)`
- `idx_salary_reminders_userId` on `salary_reminders(userId)`

---

## 💻 Development

### Available Scripts

#### Root Level (Monorepo)

```bash
# Start both frontend and backend in development mode
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev:backend

# Build all workspaces
npm run build

# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend

# Start production servers
npm start

# Lint all workspaces
npm run lint
```

#### Frontend

```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

#### Backend

```bash
cd backend
npm run dev      # Start development server (with watch mode)
npm run build    # Compile TypeScript
npm start        # Start production server
```

### Docker Commands

```bash
# Start MySQL container
docker-compose up -d

# Stop MySQL container
docker-compose down

# View MySQL logs
docker-compose logs -f mysql

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Restart MySQL container
docker-compose restart mysql
```

### Database Access

See [DATABASE_ACCESS.md](./DATABASE_ACCESS.md) for detailed instructions on accessing the MySQL database.

**Quick Access:**
```bash
docker-compose exec mysql mysql -u splitwise -psplitwise123 splitwise
```

### Code Structure

- **Frontend**: Component-based architecture with custom hooks and contexts
- **Backend**: RESTful API with route-based organization
- **Shared Types**: Centralized type definitions for type safety across frontend and backend
- **Validation**: Yup schemas on frontend, express-validator on backend
- **Error Handling**: Centralized error handling with user-friendly messages

---

## 🚀 Production Deployment

### Prerequisites

1. Set `NODE_ENV=production`
2. Use a strong, random `JWT_SECRET`
3. Configure proper CORS origins
4. Use environment variables for all sensitive data
5. Set up a managed MySQL service (e.g., AWS RDS, Google Cloud SQL, Azure Database)

### Environment Variables

**Backend `.env` (Production):**

```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-frontend-domain.com

JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d

MYSQL_HOST=<your-mysql-host>
MYSQL_PORT=3306
MYSQL_USER=<your-mysql-user>
MYSQL_PASSWORD=<strong-password>
MYSQL_DATABASE=splitwise

OPENAI_API_KEY=<your-openai-key> # Optional
```

### Build Steps

1. **Build all workspaces:**
   ```bash
   npm run build
   ```

2. **Start production servers:**
   ```bash
   npm start
   ```

   Or use a process manager like PM2:
   ```bash
   pm2 start backend/dist/index.js --name splitwise-backend
   pm2 start frontend/.next/start.js --name splitwise-frontend
   ```

### Security Checklist

- ✅ Use strong `JWT_SECRET` (32+ characters, random)
- ✅ Enable HTTPS
- ✅ Configure CORS properly
- ✅ Use environment variables (never commit secrets)
- ✅ Enable rate limiting
- ✅ Use parameterized SQL queries (already implemented)
- ✅ Sanitize all user inputs (already implemented)
- ✅ Use httpOnly cookies for JWT (already implemented)
- ✅ Set secure cookie flags in production
- ✅ Regular security updates for dependencies

### Database Migration

The schema is automatically created on first run. For production:

1. Connect to your MySQL instance
2. The backend will automatically create tables on startup
3. Ensure proper backups are configured

---

## 📚 Additional Resources

- [DATABASE_ACCESS.md](./DATABASE_ACCESS.md) - Guide to accessing the MySQL database
- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Detailed Docker setup instructions
- [CODE_REVIEW.md](./CODE_REVIEW.md) - Code review and security audit notes

---

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

---

## 📝 License

This project is private and proprietary.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [MySQL](https://www.mysql.com/)
- Containerized with [Docker](https://www.docker.com/)

---

**Made with ❤️ for better expense tracking**
