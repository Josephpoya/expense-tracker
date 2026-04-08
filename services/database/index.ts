import * as SQLite from 'expo-sqlite';

// Open database
const db = SQLite.openDatabaseSync('expense_tracker.db');

// Initialize tables
export const initDatabase = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      base_currency TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      category_id INTEGER,
      amount REAL NOT NULL,
      transaction_type TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      currency TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      last_updated INTEGER NOT NULL
    );
  `);
  
  console.log('✅ Database initialized');
};

// Wallet operations
export const getWallets = async () => {
  return await db.getAllAsync('SELECT * FROM wallets ORDER BY created_at DESC');
};

export const addWallet = async (wallet: any) => {
  const result = await db.runAsync(
    'INSERT INTO wallets (name, type, base_currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    wallet.name, wallet.type, wallet.base_currency, Date.now(), Date.now()
  );
  return result.lastInsertRowId;
};

// Transaction operations
export const getTransactions = async () => {
  return await db.getAllAsync(`
    SELECT t.*, c.name as category_name, w.name as wallet_name 
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN wallets w ON t.wallet_id = w.id
    ORDER BY t.date DESC
  `);
};

export const addTransaction = async (transaction: any) => {
  const result = await db.runAsync(
    `INSERT INTO transactions 
     (wallet_id, category_id, amount, transaction_type, description, date, currency, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    transaction.wallet_id, transaction.category_id, transaction.amount,
    transaction.transaction_type, transaction.description, transaction.date,
    transaction.currency, Date.now(), Date.now()
  );
  return result.lastInsertRowId;
};

// Category operations
export const getCategories = async () => {
  return await db.getAllAsync('SELECT * FROM categories ORDER BY name');
};

// Seed default data
export const seedDefaultData = async () => {
  const categories = await getCategories();
  if (categories.length === 0) {
    await db.runAsync(`
      INSERT INTO categories (name, type, icon, created_at, updated_at) VALUES
      ('Food', 'expense', '🍔', ${Date.now()}, ${Date.now()}),
      ('Transport', 'expense', '🚗', ${Date.now()}, ${Date.now()}),
      ('Shopping', 'expense', '🛒', ${Date.now()}, ${Date.now()}),
      ('Entertainment', 'expense', '🎬', ${Date.now()}, ${Date.now()}),
      ('Bills', 'expense', '💡', ${Date.now()}, ${Date.now()}),
      ('Salary', 'income', '💰', ${Date.now()}, ${Date.now()}),
      ('Freelance', 'income', '💻', ${Date.now()}, ${Date.now()})
    `);
  }
  
  const wallets = await getWallets();
  if (wallets.length === 0) {
    await db.runAsync(
      'INSERT INTO wallets (name, type, base_currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      'Cash', 'cash', 'USD', Date.now(), Date.now()
    );
  }
};

export const db as default;