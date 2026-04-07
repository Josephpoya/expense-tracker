import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import Expense from './models/Expense';

const adapter = new SQLiteAdapter({
  schema,
  dbname: 'budgettracker',
  jsi: false,           // ← Changed to false (fixes the crash)
});

export const database = new Database({
  adapter,
  modelClasses: [Expense],
});