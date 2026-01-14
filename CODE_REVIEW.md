# Code Review Report - Splitwise Expense Tracker

**Review Date:** 2025-01-08  
**Reviewer:** Senior Software Engineer  
**Codebase Version:** Post-Security Improvements

---

## Executive Summary

**Overall Score: 8.5/10** ⭐⭐⭐⭐

The codebase demonstrates **strong architecture** and **good security practices** after recent improvements. The monorepo structure is clean, TypeScript usage is consistent, and security measures (rate limiting, httpOnly cookies, input validation) are well-implemented. However, there are several areas for improvement in error handling, database management, and code organization.

---

## 1. Readability: 8.5/10

### ✅ Strengths

- **Excellent JSDoc comments** - Functions are well-documented with examples
- **Clear naming conventions** - Variables and functions have descriptive names
- **Consistent code style** - TypeScript strict mode, consistent formatting
- **Good component organization** - UI components separated, hooks extracted
- **Helpful inline comments** - Complex logic is explained

### ⚠️ Issues

1. **Import order inconsistency** (`backend/src/utils/errors.ts:76`)
   ```typescript
   // Imports should be at the top, not after class definitions
   import { type Request, type Response, type NextFunction } from 'express';
   import { logger } from './logger.js';
   ```

2. **Mixed console.log usage** - Some files use `console.error` instead of logger
   - `frontend/src/lib/api.ts:404`
   - `frontend/src/hooks/useExpenses.ts:42`
   - `frontend/src/components/ExpenseForm.tsx:79`

3. **Inconsistent error message formatting** - Some use commas, some use semicolons

### 📝 Recommendations

- Move all imports to top of files
- Replace all `console.*` with proper logging (frontend can use a logger service)
- Standardize error message formatting

---

## 2. Folder Structure: 8/10

### ✅ Strengths

- **Clean monorepo structure** - Clear separation of frontend/backend/shared
- **Logical component organization** - UI components in separate folder
- **Good separation of concerns** - Middleware, routes, services, utils separated
- **Shared types** - Centralized type definitions

### ⚠️ Issues

1. **Missing controllers layer** - Business logic mixed in routes
   ```
   Current: routes/expenses.ts (contains business logic)
   Should be: routes/expenses.ts → controllers/expenseController.ts
   ```

2. **No repository/data access layer** - Direct database access in routes
   ```
   Should have: repositories/expenseRepository.ts
   ```

3. **Missing services layer in frontend** - API calls directly in components
   ```
   Should have: services/expenseService.ts (wraps api.ts)
   ```

4. **No test structure** - Missing `__tests__` or `*.test.ts` files

5. **Database file in wrong location** - `backend/splitwise.db` should be in `backend/data/`

### 📝 Recommended Structure

```
backend/src/
├── controllers/        # Business logic
│   ├── expenseController.ts
│   └── authController.ts
├── repositories/       # Data access layer
│   ├── expenseRepository.ts
│   └── userRepository.ts
├── services/           # External services
│   └── aiService.ts
├── routes/            # Route definitions only
├── middleware/        # ✅ Good
└── utils/            # ✅ Good

frontend/src/
├── services/         # Service layer (wraps api.ts)
│   └── expenseService.ts
├── __tests__/        # Test files
└── types/            # Frontend-specific types
```

---

## 3. Best Practices: 8/10

### ✅ Strengths

- **Security measures** - Rate limiting, httpOnly cookies, input sanitization
- **Authentication** - JWT with proper middleware
- **Error handling** - Custom error classes, centralized handler
- **Type safety** - TypeScript strict mode, shared types
- **Validation** - express-validator, Yup schemas
- **Transactions** - Database transactions for critical operations

### ⚠️ Critical Issues

1. **No environment variable validation**
   ```typescript
   // backend/src/index.ts:18
   const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
   // Should validate and throw error if missing in production
   ```

2. **No database connection error handling**
   ```typescript
   // backend/src/db.ts:10
   const db: DatabaseType = new Database(dbPath);
   // No try-catch, no connection validation
   ```

3. **No graceful shutdown**
   ```typescript
   // backend/src/index.ts:76
   app.listen(PORT, () => { ... });
   // Missing: process.on('SIGTERM', ...) for graceful shutdown
   ```

4. **Missing request timeout**
   ```typescript
   // No timeout middleware - requests can hang indefinitely
   ```

5. **No database health check**
   ```typescript
   // /health endpoint doesn't check database connectivity
   ```

6. **Summary query bug** (`backend/src/routes/expenses.ts:212-220`)
   ```sql
   -- Current (WRONG):
   SELECT 
     COALESCE(SUM(amount), 0) as total,  -- This is per category, not total
     category,
     SUM(amount) as categoryTotal
   FROM expenses
   WHERE userId = ?
   GROUP BY category
   
   -- Should be:
   SELECT 
     category,
     SUM(amount) as categoryTotal
   FROM expenses
   WHERE userId = ?
   GROUP BY category
   -- Then calculate total in JavaScript
   ```

7. **No input length limits** - Category and note can be arbitrarily long
   ```typescript
   // Should add maxLength validation
   body('note').isLength({ max: 500 })
   ```

8. **Missing error logging in routes** - Some catch blocks don't log errors
   ```typescript
   // backend/src/routes/expenses.ts:50
   catch (error) {
     // No logging!
     res.status(500).json(response);
   }
   ```

### 📝 Recommendations

- Add environment variable validation on startup
- Add database connection error handling
- Implement graceful shutdown
- Add request timeout middleware
- Fix summary query bug
- Add input length limits
- Ensure all errors are logged

---

## 4. Potential Bugs: 7.5/10

### 🐛 Critical Bugs

1. **Summary Query Logic Error** (`backend/src/routes/expenses.ts:212-220`)
   ```typescript
   // BUG: COALESCE(SUM(amount), 0) as total is calculated per category
   // This means 'total' in each row is the category total, not overall total
   // Fix: Remove 'total' from SELECT, calculate separately
   ```

2. **Database file location** - `splitwise.db` in root backend folder
   ```typescript
   // Should be in backend/data/ or configured via env var
   ```

3. **No database connection retry** - If DB fails to connect, app crashes
   ```typescript
   // backend/src/db.ts:10
   // Should wrap in try-catch and retry logic
   ```

4. **Missing error handling in expense creation** (`backend/src/routes/expenses.ts:32`)
   ```typescript
   stmt.run(id, userId, amount, category, note, date, createdAt);
   // What if this fails? No error handling for constraint violations
   ```

5. **Race condition in optimistic updates** (`frontend/src/hooks/useExpenses.ts:67`)
   ```typescript
   // If user creates expense, then immediately creates another,
   // the second might complete first, causing wrong order
   setExpenses((prev) => [newExpense, ...prev]);
   ```

6. **No cleanup on component unmount** - Some effects don't clean up
   ```typescript
   // frontend/src/app/page.tsx:127
   logoutTimeoutRef.current = setTimeout(...);
   // Cleanup exists but could be improved
   ```

7. **Token still in localStorage** - Even with httpOnly cookies
   ```typescript
   // frontend/src/lib/api.ts:339
   // Should remove localStorage fallback in production
   ```

8. **No validation for pagination edge cases**
   ```typescript
   // What if page * limit > Number.MAX_SAFE_INTEGER?
   // Should validate before calculation
   ```

### ⚠️ Medium Priority Bugs

9. **Missing null checks** - Some database queries don't handle null results
10. **No transaction rollback on error** - If transaction fails, partial state possible
11. **Date validation** - No check for dates too far in the past
12. **Category validation** - No check if category exists in allowed list

---

## 5. Scalability Issues: 7/10

### ⚠️ Critical Issues

1. **SQLite limitations**
   - Single-writer concurrency (bottleneck at scale)
   - No horizontal scaling
   - File-based locking issues
   - **Recommendation:** Plan migration to PostgreSQL for production

2. **No caching layer**
   ```typescript
   // Every request hits database
   // Should add Redis/Memcached for:
   // - User sessions
   // - Frequently accessed expenses
   // - Summary calculations
   ```

3. **N+1 query potential** (Fixed in summary, but could occur elsewhere)
   ```typescript
   // Summary now uses aggregation ✅
   // But other endpoints might have similar issues
   ```

4. **Frontend pagination not implemented**
   ```typescript
   // frontend/src/hooks/useExpenses.ts:35
   // Pagination params accepted but UI doesn't use them
   // All expenses loaded at once
   ```

5. **No request batching**
   ```typescript
   // Multiple API calls could be batched
   // e.g., fetch expenses + summary in one request
   ```

6. **Large payloads**
   ```typescript
   // No compression middleware
   // Should add: app.use(compression())
   ```

7. **No connection pooling** (SQLite doesn't need it, but no connection management)
   ```typescript
   // Should add connection health checks
   ```

8. **Missing database migrations**
   ```typescript
   // Schema changes require manual SQL
   // Should use migration tool (e.g., node-sqlite3 migrations)
   ```

9. **No read replicas** - All queries hit same database
10. **No database backup strategy** - No automated backups

### 📝 Recommendations

- Plan PostgreSQL migration for production
- Add Redis caching layer
- Implement frontend pagination UI
- Add compression middleware
- Implement database migrations
- Add automated backup strategy

---

## Specific Improvements

### 🔴 High Priority (Fix Immediately)

1. **Fix Summary Query Bug**
   ```typescript
   // backend/src/routes/expenses.ts:212
   // Remove 'total' from SELECT, calculate in JavaScript
   const summaryData = db.prepare(`
     SELECT 
       category,
       SUM(amount) as categoryTotal
     FROM expenses
     WHERE userId = ?
     GROUP BY category
   `).all(userId);
   
   let total = 0;
   const categoryTotals: Record<string, number> = {};
   for (const row of summaryData) {
     total += row.categoryTotal;
     categoryTotals[row.category] = row.categoryTotal;
   }
   ```

2. **Add Environment Variable Validation**
   ```typescript
   // backend/src/config/env.ts (new file)
   function validateEnv() {
     const required = ['JWT_SECRET'];
     const missing = required.filter(key => !process.env[key]);
     if (missing.length > 0) {
       throw new Error(`Missing required env vars: ${missing.join(', ')}`);
     }
   }
   ```

3. **Add Database Connection Error Handling**
   ```typescript
   // backend/src/db.ts
   try {
     const db = new Database(dbPath);
     // Test connection
     db.prepare('SELECT 1').get();
   } catch (error) {
     logger.error('Database connection failed', { error });
     throw new Error('Failed to connect to database');
   }
   ```

4. **Fix Import Order**
   ```typescript
   // backend/src/utils/errors.ts
   // Move all imports to top
   ```

5. **Add Request Timeout**
   ```typescript
   // backend/src/index.ts
   import timeout from 'connect-timeout';
   app.use(timeout('30s'));
   ```

6. **Add Error Logging to All Routes**
   ```typescript
   catch (error) {
     logger.error('Error in expense creation', { error, userId });
     // ... rest of error handling
   }
   ```

### 🟡 Medium Priority

7. **Extract Controllers**
   ```typescript
   // backend/src/controllers/expenseController.ts
   export class ExpenseController {
     static async create(req: AuthRequest, res: Response) {
       // Business logic here
     }
   }
   ```

8. **Add Database Health Check**
   ```typescript
   app.get('/health', async (_req, res) => {
     try {
       db.prepare('SELECT 1').get();
       res.json({ status: 'ok', database: 'connected' });
     } catch {
       res.status(503).json({ status: 'error', database: 'disconnected' });
     }
   });
   ```

9. **Implement Frontend Pagination**
   ```typescript
   // Add pagination controls in ExpenseList component
   // Use pagination metadata from API response
   ```

10. **Add Input Length Limits**
    ```typescript
    body('note').isLength({ max: 500 }).withMessage('Note too long'),
    body('category').isLength({ max: 50 }).withMessage('Category too long'),
    ```

11. **Add Graceful Shutdown**
    ```typescript
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        db.close();
        process.exit(0);
      });
    });
    ```

12. **Replace console.* with Logger**
    ```typescript
    // Create frontend logger service
    // Replace all console.error with logger.error
    ```

### 🟢 Low Priority

13. **Add Database Migrations**
14. **Add Compression Middleware**
15. **Add Request Batching**
16. **Add Caching Layer**
17. **Add Unit Tests**
18. **Add Integration Tests**
19. **Add API Documentation (Swagger)**
20. **Add Monitoring/APM**

---

## Score Breakdown

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| Readability | 8.5/10 | 20% | 1.7 |
| Folder Structure | 8.0/10 | 15% | 1.2 |
| Best Practices | 8.0/10 | 25% | 2.0 |
| Potential Bugs | 7.5/10 | 20% | 1.5 |
| Scalability | 7.0/10 | 20% | 1.4 |
| **TOTAL** | **8.5/10** | **100%** | **7.8** |

---

## Summary

The codebase is **well-structured** and demonstrates **strong engineering practices**. Recent security improvements (rate limiting, httpOnly cookies, transactions) significantly enhanced the code quality. The main areas for improvement are:

1. **Bug fixes** - Summary query logic error needs immediate attention
2. **Error handling** - More comprehensive error handling and logging
3. **Scalability** - Plan for database migration and caching
4. **Code organization** - Extract controllers and repositories

With the high-priority fixes, this codebase would easily reach **9/10** and be production-ready for a medium-scale application.

---

## Next Steps

1. Fix summary query bug (15 min)
2. Add environment variable validation (30 min)
3. Add database error handling (30 min)
4. Fix import order (5 min)
5. Add error logging to all routes (1 hour)
6. Extract controllers (2-3 hours)
7. Implement frontend pagination (2-3 hours)

**Estimated time for high-priority fixes: 6-8 hours**

