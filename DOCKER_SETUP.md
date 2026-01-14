# Docker Setup Guide

## Quick Start

1. **Start MySQL Database:**
   ```bash
   docker-compose up -d
   ```

2. **Verify Database is Running:**
   ```bash
   docker-compose ps
   ```

3. **View Database Logs:**
   ```bash
   docker-compose logs -f mysql
   ```

4. **Install Dependencies:**
   ```bash
   npm install
   ```

5. **Start Backend (will auto-create schema):**
   ```bash
   npm run dev:backend
   ```

## Database Connection

The backend will automatically:
- Connect to MySQL using environment variables
- Create all necessary tables and indexes
- Set up foreign key constraints
- Generate UUIDs for primary keys

## Environment Variables

Make sure your `backend/.env` file includes:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=splitwise
MYSQL_PASSWORD=splitwise123
MYSQL_DATABASE=splitwise
```

## Useful Commands

### Stop Database
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v
```

### Access MySQL CLI
```bash
docker-compose exec mysql mysql -u splitwise -psplitwise123 splitwise
```

### Backup Database
```bash
docker-compose exec mysql mysqldump -u splitwise -psplitwise123 splitwise > backup.sql
```

### Restore Database
```bash
docker-compose exec -T mysql mysql -u splitwise -psplitwise123 splitwise < backup.sql
```

## Troubleshooting

### Database Connection Failed
- Ensure Docker is running: `docker ps`
- Check if MySQL container is running: `docker-compose ps`
- Verify environment variables in `backend/.env`
- Check logs: `docker-compose logs mysql`

### Port Already in Use
If port 3306 is already in use, change it in `docker-compose.yml`:
```yaml
ports:
  - "3307:3306"  # Use 3307 instead
```
Then update `MYSQL_PORT=3307` in your `.env` file.

### Reset Database
To completely reset the database:
```bash
docker-compose down -v
docker-compose up -d
```
The schema will be recreated on next backend startup.

### MySQL Authentication Error
If you see authentication errors, the MySQL container might need to be recreated:
```bash
docker-compose down -v
docker-compose up -d
```
