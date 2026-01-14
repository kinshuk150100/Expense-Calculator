import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

// Determine default path or use env
// Note: This script assumes it's run from the backend root directory where .env might be
const dbPath = process.env.DB_PATH || 'splitwise.db';

console.log(`Openning database at: ${dbPath}`);

try {
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });

    console.log('\n=== USERS ===');
    try {
        const users = db.prepare('SELECT id, name, email, createdAt FROM users').all();
        if (users.length === 0) {
            console.log('No users found.');
        } else {
            console.table(users);
        }
    } catch (e) {
        console.log('Users table not found or empty.');
    }

    console.log('\n=== EXPENSES ===');
    try {
        const expenses = db.prepare('SELECT id, amount, category, note, date FROM expenses').all();
        if (expenses.length === 0) {
            console.log('No expenses found.');
        } else {
            console.table(expenses);
        }
    } catch (e) {
        console.log('Expenses table not found or empty.');
    }
} catch (error: any) {
    if (error.code === 'SQLITE_CANTOPEN') {
        console.error(`Could not open database at ${dbPath}. Has it been created yet?`);
    } else {
        console.error('Error accessing database:', error);
    }
}
