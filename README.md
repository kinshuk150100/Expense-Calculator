# Splitwise Expense Tracker

A full-stack expense tracking application built with Next.js, Express, and MySQL.

## Tech Stack

- **Frontend**: Next.js 14 (TypeScript), React, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL 8.0 (via Docker)
- **Authentication**: JWT with httpOnly cookies

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start MySQL Database

```bash
docker-compose up -d
```

This will start MySQL in a Docker container on port 3306.

### 3. Configure Environment Variables

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

# OpenAI Configuration (Optional)
OPENAI_API_KEY=
```

### 4. Start Development Servers

From the root directory:

```bash
npm run dev
```

This will start both frontend (port 3000) and backend (port 4000) servers.

Or start them separately:

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## Docker Commands

```bash
# Start MySQL
docker-compose up -d

# Stop MySQL
docker-compose down

# View MySQL logs
docker-compose logs -f mysql

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

## Database

The database schema is automatically initialized when the backend starts. The MySQL database includes:

- `users` - User accounts
- `expenses` - Expense records
- `custom_categories` - User-defined expense categories
- `salary_reminders` - Salary date reminders

## Project Structure

```
splitwise/
├── frontend/          # Next.js frontend application
├── backend/           # Express backend API
├── shared/            # Shared TypeScript types
├── docker-compose.yml # Docker configuration for MySQL
└── package.json       # Root package.json (monorepo)
```

## API Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user info
- `GET /expenses` - Get all expenses (paginated)
- `POST /expenses` - Create a new expense
- `PUT /expenses/:id` - Update an expense
- `GET /expenses/summary` - Get expense summary
- `GET /categories` - Get custom categories
- `POST /categories` - Add custom category
- `DELETE /categories/:categoryName` - Delete custom category
- `GET /salary` - Get salary reminder
- `POST /salary` - Set/update salary reminder
- `DELETE /salary` - Delete salary reminder

## Features

- ✅ User authentication (JWT with httpOnly cookies)
- ✅ Expense tracking with categories
- ✅ Monthly/yearly expense filtering
- ✅ Custom expense categories
- ✅ Salary reminder with days remaining
- ✅ Expense summary with category breakdown
- ✅ Responsive UI with Tailwind CSS
- ✅ Form validation with Yup and Formik
- ✅ Toast notifications
- ✅ Confirmation modals for destructive actions

## Development

The database schema is automatically created on first run. All tables use UUIDs (VARCHAR(36)) as primary keys and include proper indexes for performance.

## Production

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Use environment variables for all sensitive data
5. Consider using a managed MySQL service (e.g., AWS RDS, Google Cloud SQL)
