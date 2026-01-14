# How to Access MySQL Database

## Connection Details

- **Host:** `localhost` (or `127.0.0.1`)
- **Port:** `3306`
- **Database Name:** `splitwise`
- **Username:** `splitwise`
- **Password:** `splitwise123`
- **Connection String:** `mysql://splitwise:splitwise123@localhost:3306/splitwise`

## Option 1: MySQL Workbench (Recommended - Official MySQL Tool)

### Download:
- **Windows/Mac/Linux:** https://dev.mysql.com/downloads/workbench/
- Choose the version for your operating system

### Installation Steps:
1. Download MySQL Workbench
2. Install it (follow the installer)
3. Open MySQL Workbench
4. Click "+" to add a new connection
5. Enter connection details:
   - **Connection Name:** Splitwise Local
   - **Hostname:** `localhost`
   - **Port:** `3306`
   - **Username:** `splitwise`
   - **Password:** `splitwise123` (click "Store in Keychain" to save)
6. Click "Test Connection" to verify
7. Click "OK" to save
8. Double-click the connection to connect

## Option 2: DBeaver (Free, Cross-Platform)

### Download:
- **All Platforms:** https://dbeaver.io/download/
- Choose Community Edition (free)

### Installation Steps:
1. Download and install DBeaver
2. Open DBeaver
3. Click "New Database Connection" (plug icon)
4. Select "MySQL"
5. Enter connection details:
   - **Host:** `localhost`
   - **Port:** `3306`
   - **Database:** `splitwise`
   - **Username:** `splitwise`
   - **Password:** `splitwise123`
6. Click "Test Connection" (may prompt to download MySQL driver)
7. Click "Finish"

## Option 3: phpMyAdmin (Web-based)

### Download:
- **Docker:** `docker run --name phpmyadmin -d -e PMA_HOST=host.docker.internal -p 8080:80 phpmyadmin/phpmyadmin`
- Or install via XAMPP/WAMP/MAMP

### Access:
- Open browser: http://localhost:8080
- Login with:
  - **Server:** `host.docker.internal` (or `localhost`)
  - **Username:** `splitwise`
  - **Password:** `splitwise123`

## Option 4: Command Line (No Download Needed)

### Using Docker (Already Available):
```bash
# Access MySQL CLI directly
docker-compose exec mysql mysql -u splitwise -psplitwise123 splitwise

# Or from project root
cd /data/splitwise
docker-compose exec mysql mysql -u splitwise -psplitwise123 splitwise
```

### Using MySQL Client (If Installed):
```bash
mysql -h localhost -P 3306 -u splitwise -psplitwise123 splitwise
```

### Useful MySQL Commands:
```sql
-- Show all tables
SHOW TABLES;

-- View users table
SELECT * FROM users;

-- View expenses table
SELECT * FROM expenses LIMIT 10;

-- View custom categories
SELECT * FROM custom_categories;

-- View salary reminders
SELECT * FROM salary_reminders;

-- Exit
EXIT;
```

## Option 5: VS Code Extension (If Using VS Code)

### Extension:
- **Name:** MySQL (by Jun Han)
- **Install:** Search "MySQL" in VS Code Extensions

### Steps:
1. Install the MySQL extension
2. Click the MySQL icon in sidebar
3. Click "+" to add connection
4. Enter:
   - **Host:** `localhost`
   - **Port:** `3306`
   - **User:** `splitwise`
   - **Password:** `splitwise123`
   - **Database:** `splitwise`
5. Connect and browse tables

## Option 6: TablePlus (Mac/Windows - Beautiful UI)

### Download:
- **Mac/Windows:** https://tableplus.com/
- Free version available

### Steps:
1. Download and install TablePlus
2. Click "Create a new connection"
3. Select "MySQL"
4. Enter:
   - **Name:** Splitwise
   - **Host:** `localhost`
   - **Port:** `3306`
   - **User:** `splitwise`
   - **Password:** `splitwise123`
   - **Database:** `splitwise`
5. Click "Test" then "Connect"

## Quick Start (Recommended)

**For Beginners:** Use **MySQL Workbench** (official, user-friendly)
**For Developers:** Use **DBeaver** (powerful, free, cross-platform)
**For Quick Access:** Use **Command Line** via Docker (no installation needed)

## Troubleshooting

### Can't Connect?
1. Make sure MySQL container is running:
   ```bash
   docker-compose ps
   ```

2. If not running, start it:
   ```bash
   docker-compose up -d
   ```

3. Check if port 3306 is available:
   ```bash
   netstat -an | grep 3306
   ```

4. Verify connection from command line:
   ```bash
   docker-compose exec mysql mysql -u splitwise -psplitwise123 splitwise -e "SELECT 1;"
   ```

## Database Schema

The database contains these tables:
- `users` - User accounts
- `expenses` - Expense records
- `custom_categories` - User-defined categories
- `salary_reminders` - Salary date reminders

All tables use UUIDs (VARCHAR(36)) as primary keys.

