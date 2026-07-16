import React, { useState, useRef } from "react";
import { 
  ArrowLeft, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Upload, 
  FileImage, 
  X, 
  Filter, 
  RefreshCw,
  Eye,
  Check
} from "lucide-react";
import { 
  Transaction, 
  TransactionType, 
  BankAccount, 
  CodeDefinition,
  UserAccount
} from "../types";
import { 
  INCOME_CODES, 
  EXPENSE_CODES, 
  THAI_MONTHS 
} from "../data";

interface RecordFormProps {
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onUpdateTransaction: (id: string, tx: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onBackToDashboard: () => void;
  currentUser?: UserAccount;
}

type ActiveTab = 
  | "cash_record" 
  | "cash_edit" 
  | "bank_in_record" 
  | "bank_in_edit" 
  | "bank_out_record" 
  | "bank_out_edit";

export default function RecordForm({
  bankAccounts,
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onBackToDashboard,
  currentUser
}: RecordFormProps) {
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("cash_record");

  // Form states
  const [day, setDay] = useState<number>(new Date().getDate());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(2569); // Default to current Buddhist Year in mockup
  const [documentNo, setDocumentNo] = useState<string>("-");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [incomeCode, setIncomeCode] = useState<string>("");
  const [expenseCode, setExpenseCode] = useState<string>("");
  const [selectedBankId, setSelectedBankId] = useState<string>("Bank01");
  const [base64Image, setBase64Image] = useState<string>("");

  // Filter States for tabular logs
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number>(2569);

  // Edit modal states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDay, setEditDay] = useState<number>(16);
  const [editMonth, setEditMonth] = useState<number>(7);
  const [editYear, setEditYear] = useState<number>(2569);
  const [editDocumentNo, setEditDocumentNo] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editCode, setEditCode] = useState<string>("");
  const [editBankAccountId, setEditBankAccountId] = useState<string>("");
  const [editBase64Image, setEditBase64Image] = useState<string>("");

  // Preview Modal States
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // File Upload Handlers
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);
  const fileInputRefEdit = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "create" | "edit") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          if (target === "create") {
            setBase64Image(reader.result);
          } else {
            setEditBase64Image(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submissions
  const handleSaveCashIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && !currentUser.canAdd) {
      alert("ขออภัย คุณไม่มีสิทธิ์เพิ่มข้อมูลธุรกรรมในระบบนี้");
      return;
    }
    if (!description.trim()) return alert("กรุณาระบุรายการรับ");
    if (!incomeCode) return alert("กรุณาเลือกรหัสรายรับ");
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return alert("กรุณาระบุจำนวนเงินให้ถูกต้อง");

    // Determine type: if it starts with Bank, it's a bank withdraw (เพิ่มเงินสด ลดธนาคาร)
    const isBankWithdraw = incomeCode.startsWith("Bank");
    const txType: TransactionType = isBankWithdraw ? "bank_withdraw" : "cash_in";
    const bankAccountId = isBankWithdraw ? incomeCode : undefined;

    onAddTransaction({
      type: txType,
      day,
      month,
      year,
      documentNo: documentNo || "-",
      description: description.trim(),
      code: incomeCode,
      amount: numAmount,
      documentImage: base64Image,
      bankAccountId
    });

    // Reset Form
    setDescription("");
    setAmount("");
    setBase64Image("");
    setIncomeCode("");
    alert("บันทึกรายการรับสำเร็จ");
  };

  const handleSaveCashExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && !currentUser.canAdd) {
      alert("ขออภัย คุณไม่มีสิทธิ์เพิ่มข้อมูลธุรกรรมในระบบนี้");
      return;
    }
    if (!description.trim()) return alert("กรุณาระบุรายการจ่าย");
    if (!expenseCode) return alert("กรุณาเลือกรหัสรายจ่าย");
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return alert("กรุณาระบุจำนวนเงินให้ถูกต้อง");

    // Determine type: if it starts with Bank, it's a bank deposit (ลดเงินสด เพิ่มธนาคาร)
    const isBankDeposit = expenseCode.startsWith("Bank");
    const txType: TransactionType = isBankDeposit ? "bank_deposit" : "cash_out";
    const bankAccountId = isBankDeposit ? expenseCode : undefined;

    onAddTransaction({
      type: txType,
      day,
      month,
      year,
      documentNo: documentNo || "-",
      description: description.trim(),
      code: expenseCode,
      amount: numAmount,
      documentImage: base64Image,
      bankAccountId
    });

    // Reset Form
    setDescription("");
    setAmount("");
    setBase64Image("");
    setExpenseCode("");
    alert("บันทึกรายการจ่ายสำเร็จ");
  };

  const handleSaveBankIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && !currentUser.canAdd) {
      alert("ขออภัย คุณไม่มีสิทธิ์เพิ่มข้อมูลธุรกรรมในระบบนี้");
      return;
    }
    if (!description.trim()) return alert("กรุณาระบุรายการโอน");
    if (!incomeCode) return alert("กรุณาเลือกรหัสรายรับ");
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return alert("กรุณาระบุจำนวนเงินให้ถูกต้อง");

    onAddTransaction({
      type: "direct_bank_in",
      day,
      month,
      year,
      documentNo: documentNo || "-",
      description: description.trim(),
      code: incomeCode,
      amount: numAmount,
      documentImage: base64Image,
      bankAccountId: selectedBankId
    });

    setDescription("");
    setAmount("");
    setBase64Image("");
    setIncomeCode("");
    alert("บันทึกการโอนเข้าบัญชีธนาคารสำเร็จ");
  };

  const handleSaveBankOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && !currentUser.canAdd) {
      alert("ขออภัย คุณไม่มีสิทธิ์เพิ่มข้อมูลธุรกรรมในระบบนี้");
      return;
    }
    if (!description.trim()) return alert("กรุณาระบุรายการตัดโอน");
    if (!expenseCode) return alert("กรุณาเลือกรหัสรายจ่าย");
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return alert("กรุณาระบุจำนวนเงินให้ถูกต้อง");

    onAddTransaction({
      type: "direct_bank_out",
      day,
      month,
      year,
      documentNo: documentNo || "-",
      description: description.trim(),
      code: expenseCode,
      amount: numAmount,
      documentImage: base64Image,
      bankAccountId: selectedBankId
    });

    setDescription("");
    setAmount("");
    setBase64Image("");
    setExpenseCode("");
    alert("บันทึกรายการตัดโอนบัญชีธนาคารสำเร็จ");
  };

  // Open Edit Dialog
  const handleOpenEdit = (tx: Transaction) => {
    if (currentUser && !currentUser.canEdit) {
      alert("ขออภัย คุณไม่มีสิทธิ์แก้ไขข้อมูลในระบบนี้");
      return;
    }
    setEditingTransaction(tx);
    setEditDay(tx.day);
    setEditMonth(tx.month);
    setEditYear(tx.year);
    setEditDocumentNo(tx.documentNo);
    setEditAmount(tx.amount.toString());
    setEditDescription(tx.description);
    setEditCode(tx.code);
    setEditBankAccountId(tx.bankAccountId || "");
    setEditBase64Image(tx.documentImage || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser && !currentUser.canEdit) {
      alert("ขออภัย คุณไม่มีสิทธิ์แก้ไขข้อมูลธุรกรรมในระบบนี้");
      return;
    }
    if (!editingTransaction) return;
    if (!editDescription.trim()) return alert("กรุณาระบุรายละเอียด");
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) return alert("กรุณาระบุจำนวนเงินให้ถูกต้อง");

    // Dynamic type adjustments when editing
    let updatedType = editingTransaction.type;
    let updatedBankAccountId = editBankAccountId || undefined;

    if (editingTransaction.type === "cash_in" || editingTransaction.type === "bank_withdraw") {
      updatedType = editCode.startsWith("Bank") ? "bank_withdraw" : "cash_in";
      updatedBankAccountId = editCode.startsWith("Bank") ? editCode : undefined;
    } else if (editingTransaction.type === "cash_out" || editingTransaction.type === "bank_deposit") {
      updatedType = editCode.startsWith("Bank") ? "bank_deposit" : "cash_out";
      updatedBankAccountId = editCode.startsWith("Bank") ? editCode : undefined;
    }

    onUpdateTransaction(editingTransaction.id, {
      type: updatedType,
      day: editDay,
      month: editMonth,
      year: editYear,
      documentNo: editDocumentNo || "-",
      description: editDescription.trim(),
      code: editCode,
      amount: numAmount,
      bankAccountId: updatedBankAccountId,
      documentImage: editBase64Image
    });

    setEditingTransaction(null);
    alert("แก้ไขรายการสำเร็จ");
  };

  const getThaiMonthLabel = (m: number) => {
    return THAI_MONTHS.find(item => item.value === m)?.label || m;
  };

  // Filter dynamic list based on tabs
  const getFilteredTransactions = () => {
    let filtered = transactions;

    // Filter by Tab Type Grouping
    if (activeTab === "cash_edit") {
      filtered = transactions.filter(tx => 
        tx.type === "cash_in" || 
        tx.type === "cash_out" || 
        tx.type === "bank_deposit" || 
        tx.type === "bank_withdraw"
      );
    } else if (activeTab === "bank_in_edit") {
      filtered = transactions.filter(tx => tx.type === "direct_bank_in");
    } else if (activeTab === "bank_out_edit") {
      filtered = transactions.filter(tx => tx.type === "direct_bank_out");
    }

    // Secondary state filters (Type, Month, Year)
    if (filterType !== "all") {
      if (filterType === "in") {
        filtered = filtered.filter(tx => tx.type === "cash_in" || tx.type === "bank_withdraw" || tx.type === "direct_bank_in");
      } else if (filterType === "out") {
        filtered = filtered.filter(tx => tx.type === "cash_out" || tx.type === "bank_deposit" || tx.type === "direct_bank_out");
      }
    }

    if (filterMonth !== "all") {
      const targetMonthInt = parseInt(filterMonth);
      filtered = filtered.filter(tx => tx.month === targetMonthInt);
    }

    if (filterYear) {
      filtered = filtered.filter(tx => tx.year === filterYear);
    }

    return filtered;
  };

  const clearForm = () => {
    setDescription("");
    setAmount("");
    setIncomeCode("");
    setExpenseCode("");
    setBase64Image("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn" id="record-form-container">
      
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4" id="record-header">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900">ระบบบัญชีรับจ่ายเงินสำหรับวัด</h1>
            <p className="text-xs text-slate-500">ลงบันทึกธุรกรรม รับ-จ่ายเงินสด บัญชีเงินฝากวัด และเงินหมุนเวียนหลัก</p>
          </div>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-gradient-to-r from-[#004899] to-sky-500 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-100 cursor-pointer"
        >
          กลับหน้าหลัก
        </button>
      </div>

      {/* Tabs Navigation menu */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex flex-row gap-1 select-none" id="record-tabs">
        <button
          onClick={() => { setActiveTab("cash_record"); clearForm(); }}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "cash_record" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          + บันทึกรับ-จ่าย (เงินสดในมือ)
        </button>
        <button
          onClick={() => setActiveTab("cash_edit")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "cash_edit" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          📝 แก้ไขรับ-จ่าย (เงินสดในมือ)
        </button>
        <button
          onClick={() => { setActiveTab("bank_in_record"); clearForm(); }}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "bank_in_record" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          ⇄ บันทึกการโอน (เข้าบัญชีโดยตรง)
        </button>
        <button
          onClick={() => setActiveTab("bank_in_edit")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "bank_in_edit" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          📝 แก้ไข (เข้าบัญชีโดยตรง)
        </button>
        <button
          onClick={() => { setActiveTab("bank_out_record"); clearForm(); }}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "bank_out_record" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          🏦 ตัดโอนจากบัญชีธนาคาร (ถอนเงินออก)
        </button>
        <button
          onClick={() => setActiveTab("bank_out_edit")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "bank_out_edit" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          📝 แก้ไข (ถอนเงินออก)
        </button>
      </div>

      {/* Date-Month-Year selection shared widget for record inputs */}
      {(activeTab === "cash_record" || activeTab === "bank_in_record" || activeTab === "bank_out_record") && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4" id="record-date-picker">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">วันที่ *</label>
            <select
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-sky-100 focus:border-[#004899] bg-white font-medium cursor-pointer"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">เดือน *</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-sky-100 focus:border-[#004899] bg-white font-medium cursor-pointer"
            >
              {THAI_MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">ปี พ.ศ. *</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-sky-100 focus:border-[#004899] bg-white font-semibold"
              placeholder="พ.ศ. เช่น 2569"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">เลขที่เอกสาร</label>
            <input
              type="text"
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-sky-100 focus:border-[#004899] bg-white font-semibold"
              placeholder="เลขที่เอกสาร หรือ -"
            />
          </div>
        </div>
      )}

      {/* RENDER ACTIVE TAB VIEW CONTENT */}

      {/* 1. CASH RECORD TAB (Left/Right Layout) */}
      {activeTab === "cash_record" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="cash-record-views">
          
          {/* LEFT: บันทึกรายการรับ (รับเงินสด / ถอนเงินจากธนาคาร) */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm space-y-6" id="cash-record-in">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>บันทึกรายการรับ (รับเงินสด / ถอนเงินจากธนาคาร)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">ใช้สำหรับเงินสดในมือที่วัดได้รับ หรือเงินที่เบิกถอนเป็นเงินสดมาจากธนาคาร</p>
            </div>

            <form onSubmit={handleSaveCashIncome} className="space-y-4">
              
              {/* Document attachment component */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">รูปภาพเอกสารหลักฐาน</label>
                <div 
                  onClick={() => fileInputRef1.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all text-center"
                >
                  <input
                    type="file"
                    ref={fileInputRef1}
                    onChange={(e) => handleFileChange(e, "create")}
                    accept="image/*"
                    className="hidden"
                  />
                  {base64Image ? (
                    <div className="space-y-2">
                      <img src={base64Image} alt="Voucher Preview" className="h-20 object-contain mx-auto rounded border border-gray-200" />
                      <span className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                        <Check className="h-3 w-3" /> แนบภาพสำเร็จ (คลิกเพื่อเปลี่ยน)
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs font-semibold">แนบภาพหลักฐานใบเสร็จ/ใบอนุโมทนาบัตร</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">รายการรับ *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  placeholder="ระบุชื่อผู้บริจาค หรือรายการรับอย่างละเอียด"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">รหัสรายรับ *</label>
                <select
                  required
                  value={incomeCode}
                  onChange={(e) => setIncomeCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  <option value="">-- เลือกรหัสรายรับ --</option>
                  <optgroup label="รหัสรายรับมาตรฐานทางสำนักพุทธฯ">
                    {INCOME_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="หรือ รายการถอนเงินจากธนาคารมาเป็นเงินสดในมือ">
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - ถอนเงินจากบัญชีเงินฝาก {b.accountName} ({b.accountNo})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">จำนวนเงิน (บาท) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-bold"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={clearForm}
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 transition-colors"
                >
                  ล้างข้อมูล
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: บันทึกรายการจ่าย (จ่ายเงินสด / เอาเงินสดฝากเข้าธนาคาร) */}
          <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm space-y-6" id="cash-record-out">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                <span>บันทึกรายการจ่าย (จ่ายเงินสด / เอาเงินสดฝากเข้าธนาคาร)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">ใช้สำหรับเงินสดในมือที่วัดจ่ายออก หรือเอาเงินสดที่มีไปฝากธนาคาร</p>
            </div>

            <form onSubmit={handleSaveCashExpense} className="space-y-4">
              
              {/* Document attachment component */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">รูปภาพเอกสารหลักฐาน</label>
                <div 
                  onClick={() => fileInputRef2.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all text-center"
                >
                  <input
                    type="file"
                    ref={fileInputRef2}
                    onChange={(e) => handleFileChange(e, "create")}
                    accept="image/*"
                    className="hidden"
                  />
                  {base64Image ? (
                    <div className="space-y-2">
                      <img src={base64Image} alt="Voucher Preview" className="h-20 object-contain mx-auto rounded border border-gray-200" />
                      <span className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                        <Check className="h-3 w-3" /> แนบภาพสำเร็จ (คลิกเพื่อเปลี่ยน)
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs font-semibold">แนบภาพหลักฐานใบสำคัญรับเงิน/ใบเสร็จรับเงิน</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">รายการจ่าย *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  placeholder="ระบุผู้รับเงิน หรือรายละเอียดการจ่ายเงินสด"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">รหัสรายจ่าย *</label>
                <select
                  required
                  value={expenseCode}
                  onChange={(e) => setExpenseCode(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                >
                  <option value="">-- เลือกรหัสรายจ่าย --</option>
                  <optgroup label="รหัสรายจ่ายมาตรฐานทางสำนักพุทธฯ">
                    {EXPENSE_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="หรือ รายการนำเงินสดฝากเข้าบัญชีธนาคาร">
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - นำเงินสดฝากเข้าบัญชีเงินฝาก {b.accountName} ({b.accountNo})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">จำนวนเงิน (บาท) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-bold"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={clearForm}
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 transition-colors"
                >
                  ล้างข้อมูล
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* 2. DIRECT BANK TRANSFER IN RECORD */}
      {activeTab === "bank_in_record" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6" id="bank-in-record-view">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>บันทึกการโอนเงินเข้าบัญชีธนาคารโดยตรง (Electronic Inflow)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">ใช้สำหรับเมื่อมีเงินโอนเข้าบัญชีเงินฝากวัดโดยตรง ไม่ผ่านกระบวนการรับจ่ายเงินสด เช่น ทำบุญผ่าน QR Code หรือ ดอกเบี้ยธนาคาร</p>
          </div>

          <form onSubmit={handleSaveBankIn} className="space-y-4 max-w-2xl">
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">เลือกบัญชีธนาคารปลายทาง *</label>
              <select
                required
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.accountName} ({b.accountNo} - {b.bankName})</option>
                ))}
              </select>
            </div>

            {/* Document attachment component */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">รูปภาพสลิปหลักฐานโอนเงิน</label>
              <div 
                onClick={() => fileInputRef3.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all text-center"
              >
                <input
                  type="file"
                  ref={fileInputRef3}
                  onChange={(e) => handleFileChange(e, "create")}
                  accept="image/*"
                  className="hidden"
                />
                {base64Image ? (
                  <div className="space-y-2">
                    <img src={base64Image} alt="Voucher Preview" className="h-20 object-contain mx-auto rounded border border-gray-200" />
                    <span className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> แนบภาพสำเร็จ (คลิกเพื่อเปลี่ยน)
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs font-semibold">แนบหลักฐานสลิปการโอนเงินธนาคาร</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">รายการโอนเข้า *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                placeholder="เช่น เงินทำบุญทอดผ้าป่าโอนผ่านบัญชี, ดอกเบี้ยรับประจำปี"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">รหัสรายรับ *</label>
              <select
                required
                value={incomeCode}
                onChange={(e) => setIncomeCode(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              >
                <option value="">-- เลือกรหัสรายรับ --</option>
                {INCOME_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">จำนวนเงินโอน (บาท) *</label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-bold"
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={clearForm}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 transition-colors"
              >
                ล้างข้อมูล
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-colors"
              >
                บันทึกบัญชีโอนเข้า
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. DIRECT BANK TRANSFER OUT RECORD */}
      {activeTab === "bank_out_record" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6" id="bank-out-record-view">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse"></span>
              <span>บันทึกรายการตัดโอนจากบัญชีธนาคาร (Electronic Outflow)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">ใช้สำหรับบันทึกค่าใช้จ่ายที่จ่ายโอนออกจากบัญชีธนาคารของวัดโดยตรง หรือค่าธรรมเนียมธนาคาร</p>
          </div>

          <form onSubmit={handleSaveBankOut} className="space-y-4 max-w-2xl">
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">เลือกบัญชีธนาคารต้นทาง *</label>
              <select
                required
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.accountName} ({b.accountNo} - {b.bankName})</option>
                ))}
              </select>
            </div>

            {/* Document attachment component */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">รูปภาพสลิปถอน/ตัดจ่ายเงิน</label>
              <div 
                onClick={() => fileInputRef3.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all text-center"
              >
                <input
                  type="file"
                  ref={fileInputRef3}
                  onChange={(e) => handleFileChange(e, "create")}
                  accept="image/*"
                  className="hidden"
                />
                {base64Image ? (
                  <div className="space-y-2">
                    <img src={base64Image} alt="Voucher Preview" className="h-20 object-contain mx-auto rounded border border-gray-200" />
                    <span className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> แนบภาพสำเร็จ (คลิกเพื่อเปลี่ยน)
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs font-semibold">แนบหลักฐานสลิปการถอนหรือการโอนจ่าย</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">รายการจ่ายตัดโอน *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                placeholder="เช่น จ่ายค่าช่างบูรณปฏิสังขรณ์โอนตรง, ค่าธรรมเนียมสมุดรายปี"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">รหัสรายจ่าย *</label>
              <select
                required
                value={expenseCode}
                onChange={(e) => setExpenseCode(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              >
                <option value="">-- เลือกรหัสรายจ่าย --</option>
                {EXPENSE_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">จำนวนเงินจ่าย (บาท) *</label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-bold"
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={clearForm}
                className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 transition-colors"
              >
                ล้างข้อมูล
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-colors"
              >
                บันทึกบัญชีตัดโอน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. LIST & EDIT TAB (SHARED LAYOUT FOR LOGS OR EDITS) */}
      {(activeTab === "cash_edit" || activeTab === "bank_in_edit" || activeTab === "bank_out_edit") && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6" id="logs-view-table">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-500" />
                <span>
                  {activeTab === "cash_edit" && "ข้อมูลบัญชีทั้งหมด (เงินสดในมือ)"}
                  {activeTab === "bank_in_edit" && "ข้อมูลการโอนเข้าบัญชีธนาคารโดยตรง"}
                  {activeTab === "bank_out_edit" && "ข้อมูลการตัดจ่ายโอนออกจากธนาคาร"}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">คุณสามารถคัดกรอง ค้นหา ลบ หรือแก้ไขข้อมูลรายการเดินบัญชีได้จากตารางด้านล่าง</p>
            </div>
          </div>

          {/* Filters widget */}
          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 flex flex-wrap gap-4 items-end text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ประเภท</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-gray-200 p-2 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="in">รายรับ (Inflow)</option>
                <option value="out">รายจ่าย (Outflow)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">เดือน</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="rounded-lg border border-gray-200 p-2 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">ทั้งหมด</option>
                {THAI_MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ปี พ.ศ.</label>
              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value) || 2569)}
                className="w-24 rounded-lg border border-gray-200 p-2 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setFilterType("all");
                setFilterMonth("all");
                setFilterYear(2569);
              }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>รีเซ็ต</span>
            </button>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100/50 text-gray-500 font-bold text-xs border-b border-gray-100">
                  <th className="py-3 px-4">วันที่</th>
                  {activeTab !== "cash_edit" && <th className="py-3 px-4">บัญชีธนาคาร</th>}
                  <th className="py-3 px-4">เลขที่เอกสาร</th>
                  <th className="py-3 px-4">รายการ</th>
                  <th className="py-3 px-4">รหัส</th>
                  <th className="py-3 px-4 text-right">จำนวนเงิน (บาท)</th>
                  <th className="py-3 px-4 text-center">เอกสาร</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {getFilteredTransactions().map((tx) => {
                  const isIncoming = tx.type === "cash_in" || tx.type === "bank_withdraw" || tx.type === "direct_bank_in";
                  const bankObj = bankAccounts.find(b => b.id === tx.bankAccountId);

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {tx.day} {getThaiMonthLabel(tx.month)} {tx.year}
                      </td>
                      {activeTab !== "cash_edit" && (
                        <td className="py-3.5 px-4 font-semibold text-xs text-blue-700">
                          {bankObj ? `${bankObj.code} (${bankObj.accountName})` : "-"}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-gray-500 text-xs font-mono">{tx.documentNo}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{tx.description}</div>
                        {tx.type === "bank_withdraw" && (
                          <span className="inline-block bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5">
                            เบิกถอนเงินจาก {bankObj?.accountName || "ธนาคาร"} เข้าเป็นเงินสดในมือ
                          </span>
                        )}
                        {tx.type === "bank_deposit" && (
                          <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5">
                            ฝากเงินสดเข้าบัญชี {bankObj?.accountName || "ธนาคาร"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                        {tx.code}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold ${
                        isIncoming ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {isIncoming ? "+" : "-"}{new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {tx.documentImage ? (
                          <button
                            onClick={() => setPreviewImage(tx.documentImage!)}
                            className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span>ดูรูป</span>
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขรายการ"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (currentUser && !currentUser.canDelete) {
                                alert("ขออภัย คุณไม่มีสิทธิ์ลบข้อมูลธุรกรรมในระบบนี้");
                                return;
                              }
                              if (confirm("คุณแน่ใจว่าต้องการลบรายการบัญชีนี้หรือไม่?")) {
                                onDeleteTransaction(tx.id);
                                alert("ลบรายการบัญชีสำเร็จ");
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="ลบรายการ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {getFilteredTransactions().length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                      ไม่พบข้อมูลรายการบัญชีในตัวกรองนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER EDIT TRANSACTIONS POPUP MODAL */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" id="edit-transaction-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-4">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                <span>แก้ไขรายการบัญชี</span>
              </h3>
              <button 
                onClick={() => setEditingTransaction(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">วันที่ *</label>
                  <select
                    value={editDay}
                    onChange={(e) => setEditDay(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">เดือน *</label>
                  <select
                    value={editMonth}
                    onChange={(e) => setEditMonth(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                  >
                    {THAI_MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">ปี พ.ศ. *</label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(parseInt(e.target.value) || 2569)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">เลขที่เอกสาร</label>
                <input
                  type="text"
                  value={editDocumentNo}
                  onChange={(e) => setEditDocumentNo(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                />
              </div>

              {/* Edit Image attachments */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">รูปภาพหลักฐาน</label>
                <div 
                  onClick={() => fileInputRefEdit.current?.click()}
                  className="border border-dashed border-gray-200 hover:border-blue-400 rounded-lg p-2 flex items-center justify-center cursor-pointer hover:bg-gray-50 text-center text-xs"
                >
                  <input
                    type="file"
                    ref={fileInputRefEdit}
                    onChange={(e) => handleFileChange(e, "edit")}
                    accept="image/*"
                    className="hidden"
                  />
                  {editBase64Image ? (
                    <div className="flex items-center gap-2">
                      <img src={editBase64Image} alt="Voucher Edit Preview" className="h-8 object-contain rounded border border-gray-200" />
                      <span className="text-emerald-600 font-semibold">เปลี่ยนภาพแนบ</span>
                    </div>
                  ) : (
                    <div className="text-gray-400 flex items-center gap-1.5">
                      <Upload className="h-4 w-4" />
                      <span>อัปโหลดภาพหลักฐานการชำระเงิน/รับเงิน</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียดรายการ *</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">รหัสรายการ *</label>
                <select
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                >
                  {/* Categorize based on receipt/expense */}
                  {(editingTransaction.type === "cash_in" || editingTransaction.type === "bank_withdraw" || editingTransaction.type === "direct_bank_in") ? (
                    <>
                      <optgroup label="รหัสรายรับ">
                        {INCOME_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                      </optgroup>
                      {(editingTransaction.type === "cash_in" || editingTransaction.type === "bank_withdraw") && (
                        <optgroup label="ถอนเงินธนาคาร">
                          {bankAccounts.map(b => (
                            <option key={b.id} value={b.id}>{b.code} - ถอนเงินจากบัญชีเงินฝาก {b.accountName}</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    <>
                      <optgroup label="รหัสรายจ่าย">
                        {EXPENSE_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                        ))}
                      </optgroup>
                      {(editingTransaction.type === "cash_out" || editingTransaction.type === "bank_deposit") && (
                        <optgroup label="นำฝากธนาคาร">
                          {bankAccounts.map(b => (
                            <option key={b.id} value={b.id}>{b.code} - นำเงินสดฝากเข้าบัญชีเงินฝาก {b.accountName}</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
              </div>

              {(editingTransaction.type === "direct_bank_in" || editingTransaction.type === "direct_bank_out") && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">เลือกบัญชีธนาคารโอน *</label>
                  <select
                    required
                    value={editBankAccountId}
                    onChange={(e) => setEditBankAccountId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 p-2 text-xs"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - {b.accountName} ({b.accountNo})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">จำนวนเงิน *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-600 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* RENDER DOCUMENT IMAGE PREVIEW POPUP */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" id="preview-image-modal">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 relative space-y-3">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <FileImage className="h-4 w-4 text-blue-500" />
              <span>ภาพหลักฐานเอกสารแนบ</span>
            </h3>
            <div className="flex justify-center bg-gray-50 p-2 rounded-xl">
              <img 
                src={previewImage} 
                alt="Full Document Attachment" 
                className="max-h-[70vh] object-contain rounded-lg shadow-sm" 
              />
            </div>
            <div className="text-center">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                ปิดหน้าต่างนี้
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
