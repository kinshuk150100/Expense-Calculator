# Backend Server Status

## ✅ Backend is Running

The backend server is currently running and accessible at:
- **URL:** http://localhost:4000
- **Health Check:** http://localhost:4000/health
- **Status:** ✅ Operational

## Quick Test

You can verify the backend is running by executing:

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected"
  },
  "message": "Backend is running"
}
```

## If You Still See Connection Errors

1. **Clear browser cache** - Sometimes cached errors persist
2. **Hard refresh** - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
3. **Check browser console** - Look for specific error messages
4. **Verify frontend is running** - Make sure frontend is on port 3000
5. **Restart both servers** if needed:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

## Configuration

- **Backend Port:** 4000
- **Frontend Port:** 3000
- **CORS:** Enabled for http://localhost:3000
- **Database:** SQLite (./splitwise.db)
- **Rate Limit:** 20 auth attempts per 15 minutes

## Troubleshooting

If the backend stops responding:

1. Check if process is running:
   ```bash
   ps aux | grep "tsx watch"
   ```

2. Check if port is in use:
   ```bash
   lsof -i :4000
   ```

3. Restart the backend:
   ```bash
   cd backend
   npm run dev
   ```

