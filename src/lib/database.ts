import * as SQLite from 'expo-sqlite';
import type { AutoPayCadence, AutoPayPlan, FinanceEntry, FinanceKind, GoalItem } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

const getToday = () => new Date().toISOString().slice(0, 10);

const getMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const getCurrentMonthKey = () => getMonthKey(new Date());

const addDays = (dateStr: string, days: number) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const addCadence = (dateStr: string, cadence: AutoPayCadence) => {
  if (cadence === '1d') return addDays(dateStr, 1);
  if (cadence === '7d') return addDays(dateStr, 7);
  if (cadence === '15d') return addDays(dateStr, 15);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

const ensureFinanceEntriesColumns = async (database: SQLite.SQLiteDatabase) => {
  const cols = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(finance_entries)`);
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('source_key')) {
    await database.execAsync(`ALTER TABLE finance_entries ADD COLUMN source_key TEXT;`);
  }
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('ledger.db');
  return db;
};

export const initDatabase = async (): Promise<void> => {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      value REAL NOT NULL,
      change REAL NOT NULL,
      type TEXT NOT NULL
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL,
      currency TEXT DEFAULT 'USD'
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS finance_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      name TEXT NOT NULL,
      current_amount REAL NOT NULL,
      target_amount REAL NOT NULL,
      target_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      month_key TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_email, month_key)
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS autopay_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      cadence TEXT NOT NULL,
      start_date TEXT NOT NULL,
      next_payment_date TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_finance_entries_user_date
    ON finance_entries (user_email, entry_date);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_goals_user
    ON goals (user_email);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_budgets_user_month
    ON budgets (user_email, month_key);
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_autopay_user_next
    ON autopay_plans (user_email, active, next_payment_date);
  `);

  await ensureFinanceEntriesColumns(database);
};

export const getSetting = async (key: string): Promise<string | null> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result?.value ?? null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
};

export const deleteSetting = async (key: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM settings WHERE key = ?',
    [key]
  );
};

export const createUser = async (
  email: string,
  username: string,
  password: string
): Promise<number> => {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
    [email, username, password]
  );
  return result.lastInsertRowId;
};

export const getUserByEmail = async (email: string) => {
  const database = await getDatabase();
  return database.getFirstAsync(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
};

export const getUserByUsername = async (username: string) => {
  const database = await getDatabase();
  return database.getFirstAsync(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
};

export const getUserByPassword = async (email: string, password: string) => {
  const database = await getDatabase();
  const user = await database.getFirstAsync(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password]
  );
  return !!user;
};

export const updateUserPassword = async (
  email: string,
  nextPassword: string
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE users
     SET password = ?
     WHERE email = ?`,
    [nextPassword, email]
  );
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

const getSixMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
};

export const cleanupSeededDemoData = async (userEmail: string): Promise<void> => {
  const database = await getDatabase();
  const entries = await database.getAllAsync<{ title: string }>(
    'SELECT title FROM finance_entries WHERE user_email = ?',
    [userEmail]
  );

  const distinctTitles = Array.from(new Set(entries.map((x) => x.title)));
  const demoTitles = new Set(['Salary', 'Groceries', 'Utilities', 'Subscriptions']);
  const onlyDemoEntries =
    distinctTitles.length > 0 &&
    distinctTitles.every((title) => demoTitles.has(title));

  const goals = await database.getAllAsync<{ name: string; target_amount: number }>(
    'SELECT name, target_amount FROM goals WHERE user_email = ?',
    [userEmail]
  );
  const onlyDemoGoals =
    goals.length > 0 &&
    goals.every((goal) => goal.name === 'Trip to Japan' && goal.target_amount === 5000);

  if (onlyDemoEntries) {
    await database.runAsync(
      'DELETE FROM finance_entries WHERE user_email = ?',
      [userEmail]
    );
  }

  if (onlyDemoGoals) {
    await database.runAsync(
      'DELETE FROM goals WHERE user_email = ?',
      [userEmail]
    );
  }
};

export const seedUserFinanceData = async (userEmail: string): Promise<void> => {
  const database = await getDatabase();
  const hasEntries = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM finance_entries WHERE user_email = ?',
    [userEmail]
  );
  const hasGoals = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM goals WHERE user_email = ?',
    [userEmail]
  );

  if ((hasEntries?.count ?? 0) === 0 || (hasGoals?.count ?? 0) === 0) return;
};

export const addFinanceEntry = async (input: {
  userEmail: string;
  kind: FinanceKind;
  title: string;
  amount: number;
  category: string;
  entryDate?: string;
  sourceKey?: string | null;
}): Promise<number> => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO finance_entries
     (user_email, kind, title, amount, category, entry_date, source_key)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userEmail,
      input.kind,
      input.title,
      input.amount,
      input.category,
      input.entryDate ?? getToday(),
      input.sourceKey ?? null,
    ]
  );
  return result.lastInsertRowId;
};

export const getFinanceEntriesByKind = async (
  userEmail: string,
  kind: FinanceKind,
  limit = 12
): Promise<FinanceEntry[]> => {
  const database = await getDatabase();
  return database.getAllAsync<FinanceEntry>(
    `SELECT *
     FROM finance_entries
     WHERE user_email = ? AND kind = ?
     ORDER BY entry_date DESC, id DESC
     LIMIT ?`,
    [userEmail, kind, limit]
  );
};

export const deleteFinanceEntry = async (
  userEmail: string,
  entryId: number
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `DELETE FROM finance_entries
     WHERE id = ? AND user_email = ?`,
    [entryId, userEmail]
  );
};

export const createAutopayPlan = async (input: {
  userEmail: string;
  title: string;
  amount: number;
  cadence: AutoPayCadence;
  startDate: string;
}): Promise<number> => {
  const database = await getDatabase();
  const nextPaymentDate = addCadence(input.startDate, input.cadence);
  const planResult = await database.runAsync(
    `INSERT INTO autopay_plans
     (user_email, title, amount, cadence, start_date, next_payment_date, active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [input.userEmail, input.title, input.amount, input.cadence, input.startDate, nextPaymentDate]
  );

  const planId = planResult.lastInsertRowId;
  await addFinanceEntry({
    userEmail: input.userEmail,
    kind: 'expense',
    title: input.title,
    amount: input.amount,
    category: 'autopay',
    entryDate: input.startDate,
    sourceKey: `autopay:${planId}:${input.startDate}`,
  });

  return planId;
};

export const processAutopayPlans = async (userEmail: string): Promise<void> => {
  const database = await getDatabase();
  const today = getToday();
  const plans = await database.getAllAsync<AutoPayPlan>(
    `SELECT *
     FROM autopay_plans
     WHERE user_email = ? AND active = 1`,
    [userEmail]
  );

  for (const plan of plans) {
    let dueDate = plan.next_payment_date;
    while (dueDate <= today) {
      const sourceKey = `autopay:${plan.id}:${dueDate}`;
      const existing = await database.getFirstAsync<{ id: number }>(
        `SELECT id
         FROM finance_entries
         WHERE user_email = ? AND source_key = ?
         LIMIT 1`,
        [userEmail, sourceKey]
      );

      if (!existing) {
        await addFinanceEntry({
          userEmail,
          kind: 'expense',
          title: plan.title,
          amount: plan.amount,
          category: 'autopay',
          entryDate: dueDate,
          sourceKey,
        });
      }

      dueDate = addCadence(dueDate, plan.cadence);
    }

    if (dueDate !== plan.next_payment_date) {
      await database.runAsync(
        `UPDATE autopay_plans
         SET next_payment_date = ?
         WHERE id = ? AND user_email = ?`,
        [dueDate, plan.id, userEmail]
      );
    }
  }
};

export const getAutopayPlans = async (userEmail: string): Promise<AutoPayPlan[]> => {
  const database = await getDatabase();
  return database.getAllAsync<AutoPayPlan>(
    `SELECT *
     FROM autopay_plans
     WHERE user_email = ? AND active = 1
     ORDER BY next_payment_date ASC, created_at DESC`,
    [userEmail]
  );
};

export const removeAutopayPlan = async (userEmail: string, planId: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE autopay_plans
     SET active = 0
     WHERE id = ? AND user_email = ?`,
    [planId, userEmail]
  );
};

export const getGoals = async (userEmail: string): Promise<GoalItem[]> => {
  const database = await getDatabase();
  return database.getAllAsync<GoalItem>(
    `SELECT *
     FROM goals
     WHERE user_email = ?
     ORDER BY created_at DESC`,
    [userEmail]
  );
};

export const addGoal = async (input: {
  userEmail: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  targetDate?: string | null;
}): Promise<number> => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO goals
     (user_email, name, current_amount, target_amount, target_date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.userEmail,
      input.name,
      input.currentAmount,
      input.targetAmount,
      input.targetDate ?? null,
    ]
  );
  return result.lastInsertRowId;
};

export const deleteGoal = async (userEmail: string, goalId: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `DELETE FROM goals
     WHERE id = ? AND user_email = ?`,
    [goalId, userEmail]
  );
};

export const addToGoalProgress = async (input: {
  userEmail: string;
  goalId: number;
  amount: number;
}): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE goals
     SET current_amount = MAX(0, current_amount + ?)
     WHERE id = ? AND user_email = ?`,
    [input.amount, input.goalId, input.userEmail]
  );
};

export const upsertBudget = async (input: {
  userEmail: string;
  amount: number;
  monthKey?: string;
}): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO budgets (user_email, month_key, amount)
     VALUES (?, ?, ?)
     ON CONFLICT(user_email, month_key)
     DO UPDATE SET amount = excluded.amount`,
    [input.userEmail, input.monthKey ?? getCurrentMonthKey(), input.amount]
  );
};

export const getBudgetOverview = async (userEmail: string): Promise<{
  currentMonthKey: string;
  currentBudget: number;
  totalBudget: number;
  savingsToDate: number;
}> => {
  const database = await getDatabase();
  const currentMonthKey = getCurrentMonthKey();

  const currentBudgetRow = await database.getFirstAsync<{ amount: number }>(
    `SELECT amount
     FROM budgets
     WHERE user_email = ? AND month_key = ?
     LIMIT 1`,
    [userEmail, currentMonthKey]
  );

  const totalBudgetRow = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM budgets
     WHERE user_email = ?`,
    [userEmail]
  );

  const savingsRow = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(b.amount - COALESCE(e.total, 0)), 0) AS total
     FROM budgets b
     LEFT JOIN (
       SELECT strftime('%Y-%m', entry_date) AS ym, SUM(amount) AS total
       FROM finance_entries
       WHERE user_email = ? AND kind = 'expense'
       GROUP BY ym
     ) e ON e.ym = b.month_key
     WHERE b.user_email = ?`,
    [userEmail, userEmail]
  );

  return {
    currentMonthKey,
    currentBudget: currentBudgetRow?.amount ?? 0,
    totalBudget: totalBudgetRow?.total ?? 0,
    savingsToDate: savingsRow?.total ?? 0,
  };
};

export const getFinanceSummary = async (userEmail: string) => {
  const database = await getDatabase();
  const range = getMonthRange();

  const monthTotals = await database.getAllAsync<{ kind: FinanceKind; total: number }>(
    `SELECT kind, COALESCE(SUM(amount), 0) AS total
     FROM finance_entries
     WHERE user_email = ? AND entry_date >= ? AND entry_date < ?
     GROUP BY kind`,
    [userEmail, range.start, range.end]
  );

  const totals = {
    income: 0,
    expense: 0,
    autopay: 0,
  };

  for (const row of monthTotals) {
    if (row.kind in totals) {
      totals[row.kind] = row.total;
    }
  }

  const savings = Math.max(0, totals.income - totals.expense - totals.autopay);

  return {
    month: new Date().toLocaleString('en-US', { month: 'long' }),
    income: totals.income,
    expense: totals.expense,
    autopay: totals.autopay,
    savings,
  };
};

export const getAvailableMoney = async (userEmail: string): Promise<number> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(
        SUM(
          CASE
            WHEN kind = 'income' THEN amount
            ELSE -amount
          END
        ), 0
      ) AS total
     FROM finance_entries
     WHERE user_email = ?`,
    [userEmail]
  );
  return row?.total ?? 0;
};

export const getMonthlyTotals = async (
  userEmail: string,
  kind: FinanceKind,
  months = 6
): Promise<Array<{ month: string; total: number }>> => {
  const database = await getDatabase();
  const start = getSixMonthStart();

  const rows = await database.getAllAsync<{ ym: string; total: number }>(
    `SELECT strftime('%Y-%m', entry_date) AS ym, COALESCE(SUM(amount), 0) AS total
     FROM finance_entries
     WHERE user_email = ? AND kind = ? AND entry_date >= ?
     GROUP BY ym`,
    [userEmail, kind, start]
  );

  const rowMap = new Map(rows.map((r) => [r.ym, r.total]));
  const output: Array<{ month: string; total: number }> = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(d);
    output.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      total: rowMap.get(key) ?? 0,
    });
  }

  return output;
};

export const getDynamicScore = async (userEmail: string): Promise<number> => {
  const [incomeSeries, expenseSeries, autopaySeries] = await Promise.all([
    getMonthlyTotals(userEmail, 'income'),
    getMonthlyTotals(userEmail, 'expense'),
    getMonthlyTotals(userEmail, 'autopay'),
  ]);

  const income = incomeSeries.reduce((sum, row) => sum + row.total, 0);
  const expense = expenseSeries.reduce((sum, row) => sum + row.total, 0);
  const autopay = autopaySeries.reduce((sum, row) => sum + row.total, 0);
  const outflow = expense + autopay;

  if (income <= 0) return 500;

  const savingsRate = Math.max(0, (income - outflow) / income);
  const expenseRatio = outflow / income;
  const positiveMonths = incomeSeries.filter((_, idx) => {
    const monthIncome = incomeSeries[idx].total;
    const monthOutflow = expenseSeries[idx].total + autopaySeries[idx].total;
    return monthIncome - monthOutflow >= 0;
  }).length;
  const consistency = positiveMonths / incomeSeries.length;

  const raw = 540 + savingsRate * 180 + consistency * 100 - expenseRatio * 70;
  return Math.max(300, Math.min(850, Math.round(raw)));
};
