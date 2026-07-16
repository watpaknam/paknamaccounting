export interface TempleInfo {
  name: string;
  address: string;
  abbotName: string; // เจ้าอาวาส
  accountantName: string; // ผู้จัดทำบัญชี / ไวยาวัจกร
}

export interface BankAccount {
  id: string; // e.g. "Bank01", "Bank02"
  code: string; // e.g. "Bank01"
  accountName: string; // ชื่อบัญชี เช่น วัดปากน้ำ-ทั่วไป
  accountNo: string; // เลขที่บัญชี เช่น 111-1-11111-1
  bankName: string; // ธนาคาร เช่น กรุงเทพ, กสิกรไทย
  initialBalance: number; // ยอดคงเหลือยกมา
  currentBalance: number; // ยอดเงินคงเหลือปัจจุบัน
}

export type TransactionType = 
  | "cash_in"       // รายรับ (เงินสดในมือ) เช่น ทำบุญค่าน้ำค่าไฟ
  | "cash_out"      // รายจ่าย (เงินสดในมือ) เช่น จ่ายเงินสดค่าซ่อมแซม
  | "bank_deposit"  // นำเงินสดในมือฝากเข้าบัญชีธนาคาร (ลดเงินสด เพิ่มเงินธนาคาร)
  | "bank_withdraw" // ถอนเงินสดจากบัญชีธนาคารมาเป็นเงินสดในมือ (เพิ่มเงินสด ลดเงินธนาคาร)
  | "direct_bank_in"  // เงินโอนเข้าบัญชีธนาคารโดยตรง (เพิ่มเงินธนาคาร โดยไม่ผ่านเงินสดในมือ)
  | "direct_bank_out"; // จ่ายเงินตัดโอนจากบัญชีธนาคารโดยตรง (ลดเงินธนาคาร โดยไม่ผ่านเงินสดในมือ)

export interface Transaction {
  id: string;
  type: TransactionType;
  day: number;
  month: number; // 1-12
  year: number;  // พ.ศ. เช่น 2569
  documentNo: string; // เลขที่เอกสาร
  description: string; // รายการ
  code: string; // รหัสรายรับ/รายจ่าย (ยร.1 - ยร.7, ยจ.1 - ยจ.6, Bank01 - Bank05)
  amount: number; // จำนวนเงิน (บาท)
  documentImage?: string; // รูปภาพเอกสารประกอบ (Base64 หรือ URL)
  bankAccountId?: string; // ไอดีบัญชีธนาคารที่เกี่ยวข้อง (สำหรับรายการโอน/ตัดโอน/ฝาก/ถอน)
}

export interface CodeDefinition {
  code: string;
  name: string;
  type: "income" | "expense";
  description?: string;
}

export interface UserSession {
  username: string;
  isLoggedIn: boolean;
}

export interface UserAccount {
  username: string;
  password?: string;
  role: string;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
