import { createClient } from "@supabase/supabase-js";
import { TempleInfo, BankAccount, Transaction, UserAccount } from "../types";

// User-provided Supabase credentials
const SUPABASE_URL = "https://qcuiclmntopdtgufwoib.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_K99oGStL2Ep_4uu2YBUK_g_dGog2_6J";

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseSyncData {
  templeInfo: TempleInfo;
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  users: UserAccount[];
}

export interface SupabaseStatus {
  connected: boolean;
  tablesExist: boolean;
  error?: string;
  details?: string;
}

// Check connection and check if required tables exist
export async function checkSupabaseConnection(): Promise<SupabaseStatus> {
  try {
    // 1. Simple query to test API connection
    const { data, error } = await supabase.from("temple_info").select("count").limit(1);
    
    if (error) {
      if (error.code === "PGRST116" || error.message.includes("does not exist") || error.code === "42P01") {
        return {
          connected: true,
          tablesExist: false,
          details: "เชื่อมต่อเซิร์ฟเวอร์สำเร็จ แต่ยังไม่ได้สร้างตารางในฐานข้อมูล (Relation does not exist)"
        };
      }
      return {
        connected: false,
        tablesExist: false,
        error: error.message,
        details: `เชื่อมต่อล้มเหลว (รหัสข้อผิดพลาด: ${error.code})`
      };
    }
    
    return {
      connected: true,
      tablesExist: true
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesExist: false,
      error: err.message || String(err),
      details: "ไม่สามารถเชื่อมต่ออินเทอร์เน็ตหรือบริการ Supabase ได้"
    };
  }
}

// Fetch entire database from Supabase
export async function fetchFromSupabase(): Promise<SupabaseSyncData | null> {
  try {
    // 1. Fetch Temple Info
    const { data: templeData, error: templeErr } = await supabase
      .from("temple_info")
      .select("*")
      .limit(1);

    if (templeErr) throw templeErr;
    if (!templeData || templeData.length === 0) {
      return null; // Database is empty
    }

    // Convert keys from snake_case to camelCase
    const info: TempleInfo = {
      name: templeData[0].name,
      address: templeData[0].address,
      abbotName: templeData[0].abbot_name,
      accountantName: templeData[0].accountant_name,
    };

    // 2. Fetch Bank Accounts
    const { data: bankData, error: bankErr } = await supabase
      .from("bank_accounts")
      .select("*");

    if (bankErr) throw bankErr;
    const bankAccounts: BankAccount[] = (bankData || []).map((b) => ({
      id: b.id,
      code: b.code,
      accountName: b.account_name,
      accountNo: b.account_no,
      bankName: b.bank_name,
      initialBalance: Number(b.initial_balance),
      currentBalance: Number(b.current_balance),
    }));

    // 3. Fetch Transactions
    const { data: txData, error: txErr } = await supabase
      .from("transactions")
      .select("*");

    if (txErr) throw txErr;
    const transactions: Transaction[] = (txData || []).map((t) => ({
      id: t.id,
      type: t.type,
      day: Number(t.day),
      month: Number(t.month),
      year: Number(t.year),
      documentNo: t.document_no || "-",
      description: t.description,
      code: t.code,
      amount: Number(t.amount),
      documentImage: t.document_image || undefined,
      bankAccountId: t.bank_account_id || undefined,
    }));

    // 4. Fetch Users
    const { data: userData, error: userErr } = await supabase
      .from("users")
      .select("*");

    if (userErr) throw userErr;
    const users: UserAccount[] = (userData || []).map((u) => ({
      username: u.username,
      password: u.password,
      role: u.role,
      canAdd: u.can_add,
      canEdit: u.can_edit,
      canDelete: u.can_delete,
    }));

    return {
      templeInfo: info,
      bankAccounts,
      transactions,
      users,
    };
  } catch (error) {
    console.error("Error fetching from Supabase:", error);
    throw error;
  }
}

// Save entire database to Supabase (utilizes upsert)
export async function saveToSupabase(data: SupabaseSyncData): Promise<void> {
  try {
    // 1. Save Temple Info
    const dbTempleInfo = {
      id: "main_temple",
      name: data.templeInfo.name,
      address: data.templeInfo.address,
      abbot_name: data.templeInfo.abbotName,
      accountant_name: data.templeInfo.accountantName,
      updated_at: new Date().toISOString()
    };
    const { error: templeErr } = await supabase
      .from("temple_info")
      .upsert(dbTempleInfo);
    if (templeErr) throw templeErr;

    // 2. Save Bank Accounts
    if (data.bankAccounts.length > 0) {
      const dbBankAccounts = data.bankAccounts.map((b) => ({
        id: b.id,
        code: b.code,
        account_name: b.accountName,
        account_no: b.accountNo,
        bank_name: b.bankName,
        initial_balance: b.initialBalance,
        current_balance: b.currentBalance,
        updated_at: new Date().toISOString()
      }));
      const { error: bankErr } = await supabase
        .from("bank_accounts")
        .upsert(dbBankAccounts);
      if (bankErr) throw bankErr;
    }

    // 3. Save Transactions
    if (data.transactions.length > 0) {
      const dbTransactions = data.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        day: t.day,
        month: t.month,
        year: t.year,
        document_no: t.documentNo === "-" ? null : t.documentNo,
        description: t.description,
        code: t.code,
        amount: t.amount,
        document_image: t.documentImage || null,
        bank_account_id: t.bankAccountId || null,
        updated_at: new Date().toISOString()
      }));

      // Upsert in chunks if transaction list is very large
      const CHUNK_SIZE = 100;
      for (let i = 0; i < dbTransactions.length; i += CHUNK_SIZE) {
        const chunk = dbTransactions.slice(i, i + CHUNK_SIZE);
        const { error: txErr } = await supabase
          .from("transactions")
          .upsert(chunk);
        if (txErr) throw txErr;
      }
    }

    // 4. Save Users
    if (data.users.length > 0) {
      const dbUsers = data.users.map((u) => ({
        username: u.username,
        password: u.password,
        role: u.role,
        can_add: u.canAdd,
        can_edit: u.canEdit,
        can_delete: u.canDelete,
        updated_at: new Date().toISOString()
      }));
      const { error: userErr } = await supabase
        .from("users")
        .upsert(dbUsers);
      if (userErr) throw userErr;
    }
  } catch (error) {
    console.error("Error saving to Supabase:", error);
    throw error;
  }
}

// SQL Script string for user convenience in Supabase SQL Editor
export const SUPABASE_SQL_SETUP = `-- 1. Create temple_info table
CREATE TABLE IF NOT EXISTS temple_info (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  abbot_name TEXT NOT NULL,
  accountant_name TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_no TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  initial_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  document_no TEXT,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  document_image TEXT,
  bank_account_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create users table
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  can_add BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for public access
ALTER TABLE temple_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for public access using anon key
CREATE POLICY "Allow public read temple_info" ON temple_info FOR SELECT USING (true);
CREATE POLICY "Allow public write temple_info" ON temple_info FOR ALL USING (true);

CREATE POLICY "Allow public read bank_accounts" ON bank_accounts FOR SELECT USING (true);
CREATE POLICY "Allow public write bank_accounts" ON bank_accounts FOR ALL USING (true);

CREATE POLICY "Allow public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public write transactions" ON transactions FOR ALL USING (true);

CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public write users" ON users FOR ALL USING (true);
`;
