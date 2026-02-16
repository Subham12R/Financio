export interface User {
  id: number;
  email: string;
  username: string;
  password: string;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

export interface PortfolioItem {
  id: number;
  name: string;
  symbol: string;
  value: number;
  change: number;
  type: 'stock' | 'crypto' | 'other';
}

export interface Account {
  id: number;
  name: string;
  type: 'bank' | 'credit' | 'cash' | 'investment';
  balance: number;
  currency: string;
}

export type FinanceKind = 'income' | 'expense' | 'autopay';

export interface FinanceEntry {
  id: number;
  user_email: string;
  kind: FinanceKind;
  title: string;
  amount: number;
  category: string;
  entry_date: string;
  source_key?: string | null;
  created_at: string;
}

export interface GoalItem {
  id: number;
  user_email: string;
  name: string;
  current_amount: number;
  target_amount: number;
  target_date: string | null;
  created_at: string;
}

export type AutoPayCadence = '1d' | '7d' | '15d' | 'monthly';

export interface AutoPayPlan {
  id: number;
  user_email: string;
  title: string;
  amount: number;
  cadence: AutoPayCadence;
  start_date: string;
  next_payment_date: string;
  active: number;
  created_at: string;
}
