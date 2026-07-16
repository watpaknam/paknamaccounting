import { TempleInfo, BankAccount, CodeDefinition, Transaction, UserAccount } from "./types";

export const INITIAL_TEMPLE_INFO: TempleInfo = {
  name: "วัดปากน้ำ",
  address: "เลขที่ 300 แขวงปากคลองภาษีเจริญ เขตภาษีเจริญ กรุงเทพมหานคร 10160",
  abbotName: "........................................................",
  accountantName: "................................................................................"
};

export const INCOME_CODES: CodeDefinition[] = [
  { code: "ยร.1", name: "บำรุงค่าน้ำ-ค่าไฟ", type: "income" },
  { code: "ยร.2", name: "บำรุงที่ธรณีสงฆ์", type: "income" },
  { code: "ยร.3", name: "บำรุงพระอาราม", type: "income" },
  { code: "ยร.4", name: "บำรุงศาสนศึกษา", type: "income" },
  { code: "ยร.5", name: "บำรุงศาสนศิลป์/ปฏิสังขรณ์", type: "income" },
  { code: "ยร.6", name: "เงินทำบุญถวายภัตตาหารเพล", type: "income" },
  { code: "ยร.7", name: "รายรับอื่น ๆ", type: "income" }
];

export const EXPENSE_CODES: CodeDefinition[] = [
  { code: "ยจ.1", name: "ค่าน้ำ-ค่าไฟ", type: "expense" },
  { code: "ยจ.2", name: "ค่าจ้างพนักงานของวัด", type: "expense" },
  { code: "ยจ.3", name: "ค่าจ้างพนักงานดูแลทั่วไปที่จัดรถ", type: "expense" },
  { code: "ยจ.4", name: "ค่าตอบแทนครูสอนพระปริยัติธรรม", type: "expense" },
  { code: "ยจ.5", name: "ค่าบูรณปฏิสังขรณ์", type: "expense" },
  { code: "ยจ.6", name: "ค่าใช้จ่ายอื่น ๆ", type: "expense" }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "Bank01",
    code: "Bank01",
    accountName: "วัดปากน้ำ-ทั่วไป",
    accountNo: "111-1-11111-1",
    bankName: "กรุงเทพ",
    initialBalance: 0,
    currentBalance: 0
  },
  {
    id: "Bank02",
    code: "Bank02",
    accountName: "วัดปากน้ำ-กฐิน",
    accountNo: "222-2-22222-2",
    bankName: "กรุงเทพ",
    initialBalance: 0,
    currentBalance: 0
  },
  {
    id: "Bank03",
    code: "Bank03",
    accountName: "วัดปากน้ำ-ผ้าป่า",
    accountNo: "333-3-33333-3",
    bankName: "กรุงเทพ",
    initialBalance: 0,
    currentBalance: 0
  },
  {
    id: "Bank04",
    code: "Bank04",
    accountName: "วัดปากน้ำ-มูลนิธิ",
    accountNo: "444-4-44444-4",
    bankName: "กรุงเทพ",
    initialBalance: 0,
    currentBalance: 0
  },
  {
    id: "Bank05",
    code: "Bank05",
    accountName: "วัดปากน้ำ-ดอกเบี้ยมูลนิธิ",
    accountNo: "555-5-55555-5",
    bankName: "กรุงเทพ",
    initialBalance: 0,
    currentBalance: 0
  }
];

// Seed transactions matching page 4 screenshot:
// 1. 16 July 2569 - ยร.2 (บำรุงที่ธรณีสงฆ์) - 5,200.00
// 2. 16 July 2569 - ยร.1 (บำรุงค่าน้ำ-ค่าไฟ) - 500.00
export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "d03e5a45-2555-4d26-98bc-378d8daf1b50",
    type: "cash_in",
    day: 16,
    month: 7,
    year: 2569,
    documentNo: "-",
    description: "บำรุงที่ธรณีสงฆ์",
    code: "ยร.2",
    amount: 5200,
    documentImage: ""
  },
  {
    id: "d486c860-6820-4f89-9f18-0b2d2e3e8214",
    type: "cash_in",
    day: 16,
    month: 7,
    year: 2569,
    documentNo: "-",
    description: "บำรุงค่าน้ำ-ค่าไฟ",
    code: "ยร.1",
    amount: 500,
    documentImage: ""
  }
];

export const THAI_MONTHS = [
  { value: 1, label: "มกราคม" },
  { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" },
  { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" },
  { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" },
  { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" },
  { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" },
  { value: 12, label: "ธันวาคม" }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    username: "krichabhak",
    password: "123456",
    role: "ผู้ดูแลระบบ (Admin)",
    canAdd: true,
    canEdit: true,
    canDelete: true
  },
  {
    username: "admin",
    password: "admin",
    role: "ผู้ดูแลระบบ (Admin)",
    canAdd: true,
    canEdit: true,
    canDelete: true
  }
];

