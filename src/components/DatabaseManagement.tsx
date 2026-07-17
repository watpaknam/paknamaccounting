import React, { useState } from "react";
import { 
  Database, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Check, 
  AlertTriangle, 
  Building, 
  Search,
  Filter,
  CreditCard,
  User,
  ArrowLeft,
  Key,
  LogOut,
  LogIn,
  Download,
  Upload,
  Cloud,
  CloudOff,
  RefreshCw,
  Copy,
  FileCode
} from "lucide-react";
import { TempleInfo, BankAccount, Transaction, TransactionType, UserAccount } from "../types";
import { INCOME_CODES, EXPENSE_CODES } from "../data";
import { SUPABASE_SQL_SETUP, checkSupabaseConnection, saveToSupabase, fetchFromSupabase, SUPABASE_URL, SUPABASE_ANON_KEY, updateSupabaseConfig, resetSupabaseConfig } from "../lib/supabase";

interface DatabaseManagementProps {
  templeInfo: TempleInfo;
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  username: string;
  onUpdateTempleInfo: (info: TempleInfo) => void;
  onAddBankAccount: (account: BankAccount) => void;
  onUpdateBankAccount: (id: string, updated: Partial<BankAccount>) => void;
  onDeleteBankAccount: (id: string) => void;
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onUpdateTransaction: (id: string, updated: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onBackToDashboard: () => void;
  onLogout: () => void;
  users: UserAccount[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (username: string, updated: Partial<UserAccount>) => void;
  onDeleteUser: (username: string) => void;
  onImportBackup: (
    templeInfo: TempleInfo,
    bankAccounts: BankAccount[],
    transactions: Transaction[],
    users: UserAccount[]
  ) => void;
  cloudProvider?: "firebase" | "supabase";
  onSwitchProvider?: (provider: "firebase" | "supabase") => void;
}

export default function DatabaseManagement({
  templeInfo,
  bankAccounts,
  transactions,
  username,
  onUpdateTempleInfo,
  onAddBankAccount,
  onUpdateBankAccount,
  onDeleteBankAccount,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onBackToDashboard,
  onLogout,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onImportBackup,
  cloudProvider = "supabase",
  onSwitchProvider
}: DatabaseManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<"transactions" | "bank" | "temple" | "auth" | "cloud">("transactions");

  // Custom Supabase connection credentials
  const [dbUrl, setDbUrl] = useState(() => localStorage.getItem("supabase_url") || SUPABASE_URL);
  const [dbKey, setDbKey] = useState(() => localStorage.getItem("supabase_anon_key") || SUPABASE_ANON_KEY);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);

  const handleSaveCredentials = () => {
    if (!dbUrl.trim() || !dbKey.trim()) {
      alert("กรุณากรอกข้อมูล Supabase URL และ Anon / Publishable Key ให้ครบถ้วน");
      return;
    }
    updateSupabaseConfig(dbUrl, dbKey);
    setIsEditingCredentials(false);
    triggerAlert("บันทึกข้อมูลและอัปเดตการซิงค์ Supabase เรียบร้อยแล้ว!");
  };

  const handleResetCredentials = () => {
    if (window.confirm("คุณต้องการล้างการตั้งค่าข้อมูลเชื่อมต่อนี้และกลับไปใช้ค่าเริ่มต้นระบบใช่หรือไม่?")) {
      resetSupabaseConfig();
      setDbUrl(SUPABASE_URL);
      setDbKey(SUPABASE_ANON_KEY);
      setIsEditingCredentials(false);
      triggerAlert("รีเซ็ตค่าเริ่มต้นระบบเชื่อมต่อ Supabase สำเร็จ!");
    }
  };

  // Supabase Sync & Connection State
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<{
    tested: boolean;
    connecting: boolean;
    connected: boolean;
    tablesExist: boolean;
    error?: string;
    details?: string;
  }>({
    tested: false,
    connecting: false,
    connected: false,
    tablesExist: false
  });

  const [syncingAction, setSyncingAction] = useState<"push" | "pull" | null>(null);

  const handleTestSupabase = async () => {
    setSupabaseTestStatus(prev => ({ ...prev, connecting: true }));
    try {
      const status = await checkSupabaseConnection();
      setSupabaseTestStatus({
        tested: true,
        connecting: false,
        connected: status.connected,
        tablesExist: status.tablesExist,
        error: status.error,
        details: status.details
      });
      if (status.connected) {
        if (status.tablesExist) {
          triggerAlert("เชื่อมต่อ Supabase สำเร็จและพบคอนฟิกตารางสมบูรณ์!");
        } else {
          triggerAlert("เชื่อมต่อสำเร็จ แต่ยังไม่ได้สร้างตารางโครงสร้างหลัก");
        }
      } else {
        alert(`เชื่อมต่อล้มเหลว: ${status.error || "กรุณาตรวจสอบอินเทอร์เน็ต"}`);
      }
    } catch (err: any) {
      setSupabaseTestStatus({
        tested: true,
        connecting: false,
        connected: false,
        tablesExist: false,
        error: err.message || String(err),
        details: "เกิดข้อผิดพลาดในการตรวจสอบ"
      });
    }
  };

  const handleForcePushSupabase = async () => {
    if (!window.confirm("⚠️ ยืนยันการส่งออกข้อมูลขึ้นคลาวด์:\n\nคุณต้องการบันทึกข้อมูลในเครื่องนี้ทั้งหมดไปทับบนฐานข้อมูล Supabase ใช่หรือไม่? ข้อมูลเก่าใน Supabase จะถูกแทนที่ทั้งหมด")) {
      return;
    }
    setSyncingAction("push");
    try {
      await saveToSupabase({
        templeInfo,
        bankAccounts,
        transactions,
        users
      });
      triggerAlert("อัปโหลดและเขียนทับข้อมูลบน Supabase คลาวด์สำเร็จ!");
    } catch (error: any) {
      console.error(error);
      alert(`อัปโหลดล้มเหลว: ${error.message || "กรุณาตรวจสอบโครงสร้างตารางและการเชื่อมต่อ"}`);
    } finally {
      setSyncingAction(null);
    }
  };

  const handleForcePullSupabase = async () => {
    if (!window.confirm("⚠️ ยืนยันการกู้คืนข้อมูลลงเครื่อง:\n\nคุณต้องการนำข้อมูลใน Supabase คลาวด์ทั้งหมดมาเขียนทับข้อมูลในเครื่องนี้ใช่หรือไม่? ข้อมูลประวัติและรายการในเครื่องขณะนี้จะสูญหายทันที")) {
      return;
    }
    setSyncingAction("pull");
    try {
      const data = await fetchFromSupabase();
      if (data) {
        onImportBackup(
          data.templeInfo,
          data.bankAccounts,
          data.transactions,
          data.users
        );
        triggerAlert("ดึงข้อมูลและเขียนทับระบบสำเร็จ!");
      } else {
        alert("ไม่พบข้อมูลเดิมบนคลาวด์ Supabase (ฐานข้อมูลยังว่างเปล่า)");
      }
    } catch (error: any) {
      console.error(error);
      alert(`ดึงข้อมูลล้มเหลว: ${error.message || "กรุณาตรวจสอบโครงสร้างตารางและการเชื่อมต่อ"}`);
    } finally {
      setSyncingAction(null);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    triggerAlert("คัดลอกรหัสสคริปต์ SQL เรียบร้อยแล้ว!");
  };
  
  // User Management State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "เจ้าหน้าที่บันทึกข้อมูล (Editor)",
    canAdd: true,
    canEdit: false,
    canDelete: false
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim()) {
      alert("กรุณากรอกชื่อผู้ใช้งาน");
      return;
    }
    
    const existing = users.find(u => u.username.toLowerCase() === userForm.username.trim().toLowerCase());
    if (existing) {
      alert("ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว");
      return;
    }

    onAddUser({
      username: userForm.username.trim(),
      password: userForm.password.trim() || "123456",
      role: userForm.role,
      canAdd: userForm.canAdd,
      canEdit: userForm.canEdit,
      canDelete: userForm.canDelete
    });

    setIsAddingUser(false);
    setUserForm({
      username: "",
      password: "",
      role: "เจ้าหน้าที่บันทึกข้อมูล (Editor)",
      canAdd: true,
      canEdit: false,
      canDelete: false
    });
    triggerAlert("เพิ่มบัญชีผู้ใช้งานเรียบร้อยแล้ว");
  };

  const handleUpdateUserPermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onUpdateUser(editingUser.username, {
      role: userForm.role,
      canAdd: userForm.canAdd,
      canEdit: userForm.canEdit,
      canDelete: userForm.canDelete,
      ...(userForm.password.trim() ? { password: userForm.password.trim() } : {})
    });

    setEditingUser(null);
    setUserForm({
      username: "",
      password: "",
      role: "เจ้าหน้าที่บันทึกข้อมูล (Editor)",
      canAdd: true,
      canEdit: false,
      canDelete: false
    });
    triggerAlert("อัปเดตสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว");
  };

  const handleDeleteUser = (uName: string) => {
    if (uName.toLowerCase() === "krichabhak" || uName.toLowerCase() === "admin") {
      alert("ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (Master Admin) ได้");
      return;
    }
    if (uName.toLowerCase() === username.toLowerCase()) {
      alert("ไม่สามารถลบบัญชีที่คุณกำลังใช้งานเข้าสู่ระบบอยู่ได้");
      return;
    }
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ "${uName}" ออกจากระบบ?`)) {
      onDeleteUser(uName);
      triggerAlert("ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว");
    }
  };
  
  // Search & Filter state for transactions
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("all");
  
  // Modals / Editor states
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [isAddingBank, setIsAddingBank] = useState(false);
  
  // Transaction Form states (Both Add & Edit)
  const [txForm, setTxForm] = useState({
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: 2569,
    type: "cash_in" as TransactionType,
    documentNo: "-",
    description: "",
    code: "ยร.1",
    amount: 0,
    bankAccountId: ""
  });

  // Bank Form states
  const [bankForm, setBankForm] = useState({
    code: "",
    accountName: "",
    accountNo: "",
    bankName: "กรุงไทย",
    initialBalance: 0
  });

  // Temple Form state
  const [templeForm, setTempleForm] = useState<TempleInfo>({ ...templeInfo });
  const [templeSaveSuccess, setTempleSaveSuccess] = useState(false);

  // Success alert messages
  const [alertMsg, setAlertMsg] = useState("");

  const triggerAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(""), 3000);
  };

  // Backup & Restore states/refs
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleExportBackup = () => {
    try {
      const backupData = {
        backupVersion: 1,
        exportDate: new Date().toISOString(),
        templeInfo,
        bankAccounts,
        transactions,
        users
      };
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      const safeTempleName = templeInfo.name.replace(/[^a-zA-Z0-9\u0E00-\u0E7F]/g, "_");
      const formattedDate = new Date().toISOString().split("T")[0];
      
      link.href = url;
      link.download = `temple_backup_${safeTempleName}_${formattedDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerAlert("ส่งออกไฟล์สำรองข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Backup export error:", error);
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูลสำรอง");
    }
  };

  const processBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonText = event.target?.result as string;
        const parsed = JSON.parse(jsonText);
        
        // Basic structures validation
        if (!parsed || typeof parsed !== "object") {
          throw new Error("ข้อมูล JSON ไม่ถูกต้อง");
        }
        
        if (!parsed.templeInfo || typeof parsed.templeInfo !== "object" || !parsed.templeInfo.name) {
          throw new Error("โครงสร้างข้อมูลวัด (templeInfo) ไม่ถูกต้องหรือไม่มีชื่อวัด");
        }
        
        if (!parsed.bankAccounts || !Array.isArray(parsed.bankAccounts)) {
          throw new Error("โครงสร้างข้อมูลบัญชีธนาคาร (bankAccounts) ไม่ถูกต้อง");
        }
        
        if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
          throw new Error("โครงสร้างข้อมูลธุรกรรม (transactions) ไม่ถูกต้อง");
        }
        
        if (!parsed.users || !Array.isArray(parsed.users)) {
          throw new Error("โครงสร้างข้อมูลผู้ใช้งาน (users) ไม่ถูกต้อง");
        }
        
        const confirmMessage = `⚠️ คำเตือนระบบบัญชี:\n\nการกู้คืนข้อมูลจากไฟล์สำรองนี้จะ "เขียนทับ/ล้างข้อมูลปัจจุบันทั้งหมด" ในเครื่องของคุณ\n\n- ข้อมูลวัด: ${parsed.templeInfo.name}\n- บัญชีธนาคาร: ${parsed.bankAccounts.length} บัญชี\n- รายการธุรกรรม: ${parsed.transactions.length} รายการ\n- ผู้ใช้ในระบบ: ${parsed.users.length} คน\n\nท่านต้องการยืนยันที่จะกู้คืนข้อมูลนี้หรือไม่?`;
        
        if (window.confirm(confirmMessage)) {
          onImportBackup(
            parsed.templeInfo,
            parsed.bankAccounts,
            parsed.transactions,
            parsed.users
          );
          triggerAlert("กู้คืนข้อมูลและบัญชีสำเร็จแล้ว");
          
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } catch (error: any) {
        console.error("Import error:", error);
        alert(`ไม่สามารถนำเข้าข้อมูลได้: ${error.message || "รูปแบบไฟล์ไม่ถูกต้อง"}`);
      }
    };
    reader.onerror = () => {
      alert("เกิดข้อผิดพลาดขณะอ่านไฟล์");
    };
    reader.readAsText(file);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processBackupFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        processBackupFile(file);
      } else {
        alert("กรุณาใช้ไฟล์นามสกุล .json เท่านั้น");
      }
    }
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxForm({
      day: tx.day,
      month: tx.month,
      year: tx.year,
      type: tx.type,
      documentNo: tx.documentNo || "-",
      description: tx.description,
      code: tx.code,
      amount: tx.amount,
      bankAccountId: tx.bankAccountId || ""
    });
    setIsAddingTx(false);
  };

  const handleOpenAddTx = () => {
    setIsAddingTx(true);
    setEditingTx(null);
    setTxForm({
      day: new Date().getDate(),
      month: new Date().getMonth() + 1,
      year: 2569,
      type: "cash_in",
      documentNo: "-",
      description: "",
      code: "ยร.1",
      amount: 0,
      bankAccountId: bankAccounts[0]?.id || ""
    });
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (txForm.amount <= 0) {
      alert("กรุณากรอกจำนวนเงินมากกว่า 0 บาท");
      return;
    }

    if (isAddingTx) {
      onAddTransaction({
        type: txForm.type,
        day: Number(txForm.day),
        month: Number(txForm.month),
        year: Number(txForm.year),
        documentNo: txForm.documentNo,
        description: txForm.description,
        code: txForm.code,
        amount: Number(txForm.amount),
        bankAccountId: txForm.bankAccountId || undefined
      });
      setIsAddingTx(false);
      triggerAlert("เพิ่มธุรกรรมเรียบร้อยแล้ว");
    } else if (editingTx) {
      onUpdateTransaction(editingTx.id, {
        type: txForm.type,
        day: Number(txForm.day),
        month: Number(txForm.month),
        year: Number(txForm.year),
        documentNo: txForm.documentNo,
        description: txForm.description,
        code: txForm.code,
        amount: Number(txForm.amount),
        bankAccountId: txForm.bankAccountId || undefined
      });
      setEditingTx(null);
      triggerAlert("แก้ไขธุรกรรมเรียบร้อยแล้ว");
    }
  };

  const handleDeleteTx = (id: string) => {
    if (window.confirm("คุณต้องการลบรายการธุรกรรมนี้ใช่หรือไม่?")) {
      onDeleteTransaction(id);
      triggerAlert("ลบธุรกรรมเรียบร้อยแล้ว");
    }
  };

  // Bank Account operations
  const handleOpenAddBank = () => {
    setIsAddingBank(true);
    setEditingBank(null);
    setBankForm({
      code: `Bank0${bankAccounts.length + 1}`,
      accountName: "",
      accountNo: "",
      bankName: "กรุงไทย",
      initialBalance: 0
    });
  };

  const handleOpenEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    setIsAddingBank(false);
    setBankForm({
      code: bank.code,
      accountName: bank.accountName,
      accountNo: bank.accountNo,
      bankName: bank.bankName,
      initialBalance: bank.initialBalance
    });
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.accountName || !bankForm.accountNo) {
      alert("กรุณากรอกข้อมูลชื่อและเลขบัญชีให้ครบถ้วน");
      return;
    }

    if (isAddingBank) {
      const newBankId = `bank-${Date.now()}`;
      onAddBankAccount({
        id: newBankId,
        code: bankForm.code,
        accountName: bankForm.accountName,
        accountNo: bankForm.accountNo,
        bankName: bankForm.bankName,
        initialBalance: Number(bankForm.initialBalance),
        currentBalance: Number(bankForm.initialBalance)
      });
      setIsAddingBank(false);
      triggerAlert("เพิ่มบัญชีธนาคารเรียบร้อยแล้ว");
    } else if (editingBank) {
      onUpdateBankAccount(editingBank.id, {
        code: bankForm.code,
        accountName: bankForm.accountName,
        accountNo: bankForm.accountNo,
        bankName: bankForm.bankName,
        initialBalance: Number(bankForm.initialBalance)
      });
      setEditingBank(null);
      triggerAlert("แก้ไขบัญชีธนาคารเรียบร้อยแล้ว");
    }
  };

  const handleDeleteBank = (id: string) => {
    if (window.confirm("คุณต้องการลบบัญชีธนาคารนี้ใช่หรือไม่? ยอดเงินและประวัติที่เกี่ยวข้องอาจคลาดเคลื่อนได้")) {
      onDeleteBankAccount(id);
      triggerAlert("ลบบัญชีธนาคารเรียบร้อยแล้ว");
    }
  };

  const handleSaveTempleInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTempleInfo(templeForm);
    setTempleSaveSuccess(true);
    setTimeout(() => setTempleSaveSuccess(false), 3000);
    triggerAlert("อัปเดตข้อมูลวัดเรียบร้อยแล้ว");
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(txSearch.toLowerCase()) || 
                          tx.code.toLowerCase().includes(txSearch.toLowerCase()) ||
                          (tx.documentNo && tx.documentNo.toLowerCase().includes(txSearch.toLowerCase()));
    if (txTypeFilter === "all") return matchesSearch;
    return tx.type === txTypeFilter && matchesSearch;
  });

  const getThaiMonthName = (mNum: number) => {
    const names = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return names[mNum - 1] || "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="db-management-root">
      
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4" id="db-header">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-[#004899]" />
              <span>ศูนย์จัดการข้อมูลระบบและฐานข้อมูลวัด</span>
            </h1>
            <p className="text-xs text-slate-500">จัดการข้อมูลธุรกรรม บัญชีธนาคาร และการเข้าถึงระบบได้โดยตรง</p>
          </div>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-gradient-to-r from-[#004899] to-sky-500 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-100 cursor-pointer"
        >
          กลับหน้าหลัก
        </button>
      </div>

      {/* Alert toast if active */}
      {alertMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#002d62] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-sky-500/20 animate-bounce-short">
          <Check className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-semibold">{alertMsg}</span>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto flex flex-row gap-1 select-none" id="db-sub-tabs">
        <button
          onClick={() => setActiveSubTab("transactions")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "transactions" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>จัดการรายการบัญชี ({transactions.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("bank")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "bank" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>จัดการบัญชีธนาคาร ({bankAccounts.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("temple")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "temple" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>ตั้งค่าข้อมูลวัด</span>
        </button>
        <button
          onClick={() => setActiveSubTab("auth")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "auth" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>บัญชีผู้ใช้งาน & ระบบ</span>
        </button>
        <button
          onClick={() => setActiveSubTab("cloud")}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "cloud" 
              ? "bg-[#004899] text-white shadow-sm shadow-sky-100" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Cloud className="h-3.5 w-3.5" />
          <span>ตั้งค่า Cloud & Supabase Sync</span>
        </button>
      </div>

      {/* Main Tab Area */}
      <div className="space-y-6">
        
        {/* TAB 1: TRANSACTIONS MANAGEMENT */}
        {activeSubTab === "transactions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="db-transactions-view">
            
            {/* List and Filters column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-800">รายการธุรกรรมทั้งหมด</h3>
                  <button
                    onClick={handleOpenAddTx}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>เพิ่มธุรกรรมใหม่</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อรายการ รหัส หรือเลขเอกสาร..."
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      className="pl-9 pr-3 py-1.5 block w-full rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 whitespace-nowrap"><Filter className="h-3.5 w-3.5 inline mr-1" />ประเภท:</span>
                    <select
                      value={txTypeFilter}
                      onChange={(e) => setTxTypeFilter(e.target.value)}
                      className="p-1.5 block w-full rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-100 focus:border-amber-500 bg-white"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="cash_in">รายรับ (เงินสด)</option>
                      <option value="cash_out">รายจ่าย (เงินสด)</option>
                      <option value="direct_bank_in">โอนเข้าธนาคารโดยตรง</option>
                      <option value="direct_bank_out">โอนจ่ายจากธนาคาร</option>
                      <option value="bank_deposit">ฝากเงินสดเข้าธนาคาร</option>
                      <option value="bank_withdraw">ถอนเงินธนาคารมาเป็นเงินสด</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Transactions Table container */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                        <th className="p-3">วันที่</th>
                        <th className="p-3">ประเภท/รหัส</th>
                        <th className="p-3">รายละเอียด</th>
                        <th className="p-3 text-right">จำนวนเงิน</th>
                        <th className="p-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                            ไม่พบรายการธุรกรรมตามเงื่อนไขค้นหา
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50/70 transition-all font-medium">
                            <td className="p-3 whitespace-nowrap text-slate-500">
                              {tx.day} {getThaiMonthName(tx.month)} {tx.year}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700">{tx.code}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded w-max mt-0.5 ${
                                  tx.type.includes("in") || tx.type === "bank_deposit" 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : "bg-rose-50 text-rose-700"
                                }`}>
                                  {tx.type === "cash_in" && "รับ (สด)"}
                                  {tx.type === "cash_out" && "จ่าย (สด)"}
                                  {tx.type === "direct_bank_in" && "โอนเข้า"}
                                  {tx.type === "direct_bank_out" && "โอนจ่าย"}
                                  {tx.type === "bank_deposit" && "ฝากธนาคาร"}
                                  {tx.type === "bank_withdraw" && "ถอนเงินสด"}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 max-w-[200px] truncate text-slate-800 font-semibold">
                              <p className="truncate">{tx.description}</p>
                              {tx.documentNo && tx.documentNo !== "-" && (
                                <span className="text-[10px] text-slate-400">เลขเอกสาร: {tx.documentNo}</span>
                              )}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap font-bold text-slate-900">
                              {tx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditTx(tx)}
                                  className="p-1 hover:bg-amber-100 text-amber-700 rounded transition-colors cursor-pointer"
                                  title="แก้ไข"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTx(tx.id)}
                                  className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                                  title="ลบ"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Editing / Adding panel column */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
              <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                {isAddingTx && <span className="text-green-600">➕ เพิ่มธุรกรรมใหม่</span>}
                {editingTx && <span className="text-amber-600">📝 แก้ไขรายการบัญชี</span>}
                {!isAddingTx && !editingTx && <span className="text-slate-400">เลือกรายการเพื่อแก้ไขหรือคลิกปุ่มด้านซ้าย</span>}
              </h3>

              {(isAddingTx || editingTx) ? (
                <form onSubmit={handleSaveTx} className="space-y-4 pt-4 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">วันที่</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={txForm.day}
                        onChange={(e) => setTxForm(prev => ({ ...prev, day: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">เดือน</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        required
                        value={txForm.month}
                        onChange={(e) => setTxForm(prev => ({ ...prev, month: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">ปี พ.ศ.</label>
                      <input
                        type="number"
                        required
                        value={txForm.year}
                        onChange={(e) => setTxForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">ประเภทประเภทธุรกรรม *</label>
                    <select
                      value={txForm.type}
                      onChange={(e) => {
                        const newType = e.target.value as TransactionType;
                        setTxForm(prev => ({ 
                          ...prev, 
                          type: newType,
                          code: newType.includes("in") ? "ยร.1" : "ยจ.1"
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                    >
                      <option value="cash_in">รายรับ (เงินสดในมือ)</option>
                      <option value="cash_out">รายจ่าย (เงินสดในมือ)</option>
                      <option value="direct_bank_in">เงินโอนเข้าบัญชีโดยตรง</option>
                      <option value="direct_bank_out">โอนจ่ายออกจากธนาคาร</option>
                      <option value="bank_deposit">ฝากเงินสดเข้าบัญชีธนาคาร</option>
                      <option value="bank_withdraw">ถอนเงินฝากธนาคารมาเป็นเงินสด</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">รหัสบัญชีสำนักพุทธฯ</label>
                      <select
                        value={txForm.code}
                        onChange={(e) => setTxForm(prev => ({ ...prev, code: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white font-semibold"
                      >
                        {(txForm.type.includes("in") || txForm.type === "bank_deposit") ? (
                          INCOME_CODES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)
                        ) : (
                          EXPENSE_CODES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">เลขที่เอกสาร</label>
                      <input
                        type="text"
                        value={txForm.documentNo}
                        onChange={(e) => setTxForm(prev => ({ ...prev, documentNo: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* Show bank selection dropdown if it involves bank operations */}
                  {txForm.type !== "cash_in" && txForm.type !== "cash_out" && (
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">บัญชีธนาคารวัดที่เกี่ยวข้อง *</label>
                      <select
                        value={txForm.bankAccountId}
                        onChange={(e) => setTxForm(prev => ({ ...prev, bankAccountId: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                        required
                      >
                        <option value="">-- กรุณาเลือกบัญชี --</option>
                        {bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>{b.bankName} - {b.accountName} ({b.accountNo})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">ชื่อรายการ / คำอธิบาย *</label>
                    <textarea
                      required
                      value={txForm.description}
                      onChange={(e) => setTxForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="เช่น ค่าบำรุงวัดอุโบสถถวายจตุปัจจัย..."
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">จำนวนเงิน (บาท) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={txForm.amount || ""}
                      onChange={(e) => setTxForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>บันทึกข้อมูล</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTx(false);
                        setEditingTx(null);
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Database className="h-10 w-10 text-slate-200 mx-auto" />
                  <p className="text-xs font-semibold">กรุณาคลิกเลือกแก้ไขจากตารางฝั่งซ้าย</p>
                  <p className="text-[11px]">หรือกดปุ่ม "เพิ่มธุรกรรมใหม่" เพื่อสร้างรายการ</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BANK ACCOUNTS MANAGEMENT */}
        {activeSubTab === "bank" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="db-bank-view">
            
            {/* List column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">รายชื่อบัญชีธนาคารทั้งหมดของวัด</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">ใช้ระบุคู่กับรายการเงินฝาก ถอน โอนเงินเข้า-ออก</p>
                </div>
                <button
                  onClick={handleOpenAddBank}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>เพิ่มบัญชีธนาคาร</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bankAccounts.map(b => (
                  <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                    <div className="space-y-2 pl-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{b.code}</span>
                        <span className="text-xs font-bold text-slate-800">{b.bankName}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{b.accountName}</h4>
                        <p className="text-xs text-slate-500 font-mono tracking-wider mt-0.5">{b.accountNo}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400">เงินยกมาเริ่มแรก</p>
                          <p className="font-bold text-slate-700">{b.initialBalance.toLocaleString("th-TH")}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">ยอดเงินปัจจุบัน</p>
                          <p className="font-extrabold text-amber-700">{b.currentBalance.toLocaleString("th-TH")}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100 pl-2">
                      <button
                        onClick={() => handleOpenEditBank(b)}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-amber-100 hover:text-amber-700 text-slate-600 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>แก้ไขข้อมูล</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBank(b.id)}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-600 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>ลบออก</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editing / Adding Bank account column */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
              <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100">
                {isAddingBank && <span className="text-green-600">➕ เพิ่มบัญชีธนาคารวัด</span>}
                {editingBank && <span className="text-amber-600">📝 แก้ไขบัญชีธนาคาร</span>}
                {!isAddingBank && !editingBank && <span className="text-slate-400">จัดการข้อมูลบัญชีธนาคาร</span>}
              </h3>

              {(isAddingBank || editingBank) ? (
                <form onSubmit={handleSaveBank} className="space-y-4 pt-4 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">รหัสบัญชี (Code) *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น Bank01"
                      value={bankForm.code}
                      onChange={(e) => setBankForm(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">ชื่อธนาคาร *</label>
                    <select
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white font-semibold"
                    >
                      <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                      <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                      <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                      <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                      <option value="ธนาคารออมสิน">ธนาคารออมสิน</option>
                      <option value="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร">ธ.ก.ส.</option>
                      <option value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต (ttb)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">ชื่อบัญชี *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น วัดปากน้ำ-บำรุงเสนาสนะ"
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm(prev => ({ ...prev, accountName: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">เลขที่บัญชี *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น 111-1-11111-1"
                      value={bankForm.accountNo}
                      onChange={(e) => setBankForm(prev => ({ ...prev, accountNo: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">ยอดเงินคงเหลือยกมาเริ่มแรก (บาท) *</label>
                    <input
                      type="number"
                      required
                      value={bankForm.initialBalance || ""}
                      onChange={(e) => setBankForm(prev => ({ ...prev, initialBalance: Number(e.target.value) }))}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>บันทึกบัญชี</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingBank(false);
                        setEditingBank(null);
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <CreditCard className="h-10 w-10 text-slate-200 mx-auto" />
                  <p className="text-xs font-semibold">คลิกเลือกแก้ไขรายละเอียดบัญชี</p>
                  <p className="text-[11px]">หรือกดปุ่ม "เพิ่มบัญชีธนาคาร" ด้านบนได้ทันที</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TEMPLE INFO SETTINGS */}
        {activeSubTab === "temple" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto" id="db-temple-form">
            <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-amber-600" />
              <span>แก้ไขรายละเอียดข้อมูลพื้นฐานของวัด</span>
            </h3>

            <form onSubmit={handleSaveTempleInfo} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">ชื่อวัด *</label>
                <input
                  type="text"
                  required
                  value={templeForm.name}
                  onChange={(e) => setTempleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">ที่ตั้ง / ที่อยู่ติดต่อวัด *</label>
                <textarea
                  required
                  rows={2}
                  value={templeForm.address}
                  onChange={(e) => setTempleForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">ชื่อเจ้าอาวาส / ผู้ดูแลหลัก *</label>
                  <input
                    type="text"
                    required
                    value={templeForm.abbotName}
                    onChange={(e) => setTempleForm(prev => ({ ...prev, abbotName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ใช้พิมพ์ในวงเล็บท้ายเอกสารรายงานรับจ่าย</p>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">ชื่อไวยาวัจกร / ผู้ส่งบัญชีตรวจสอบ *</label>
                  <input
                    type="text"
                    required
                    value={templeForm.accountantName}
                    onChange={(e) => setTempleForm(prev => ({ ...prev, accountantName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ใช้พิมพ์ในวงเล็บท้ายเอกสารรายงานแบบที่ 1, 2, 3</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {templeSaveSuccess && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 animate-fadeIn text-[11px]">
                    <Check className="h-4 w-4" /> บันทึกการเปลี่ยนแปลงสำเร็จ!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-amber-200 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>บันทึกข้อมูลวัด</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: USERS & AUTHENTICATION */}
        {activeSubTab === "auth" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start" id="db-auth-panel">
            
            {/* Col 1: Current Session Info & Backup */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Current Session Info */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-[#004899]" />
                  <span>สถานะผู้ใช้งานปัจจุบัน</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>ผู้ล็อกอินคนปัจจุบัน:</span>
                      <span className="font-bold text-slate-800">{username}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>ระดับสิทธิ์ / บทบาท:</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#004899] text-[9px] font-bold uppercase">
                        {users.find(u => u.username.toLowerCase() === username.toLowerCase())?.role || "ผู้ดูแลระบบ (Admin)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>สิทธิ์ เพิ่ม / แก้ไข / ลบ:</span>
                      <div className="flex gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${users.find(u => u.username.toLowerCase() === username.toLowerCase())?.canAdd ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>เพิ่ม</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${users.find(u => u.username.toLowerCase() === username.toLowerCase())?.canEdit ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-400"}`}>แก้ไข</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${users.find(u => u.username.toLowerCase() === username.toLowerCase())?.canDelete ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-400"}`}>ลบ</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>สถานะระบบบัญชี:</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">● ใช้งานแบบ Offline-Local</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">ดำเนินการเข้า-ออกระบบ</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>ออกจากระบบ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("คุณกำลังดำเนินการเพื่อสลับบัญชีใหม่? ระบบจะนำไปยังหน้าต่างเข้าสู่ระบบหลัก")) {
                            onLogout();
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>สลับบัญชี (Login)</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100/50 text-xs text-amber-800 space-y-1.5">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-amber-600" /> คำแนะนำการบริหารสิทธิ์:
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      สิทธิ์การใช้งานจะถูกบันทึกในเครื่อง หากเปลี่ยนสิทธิ์ของผู้บันทึก จะมีผลในการสกัดกั้นการ เพิ่ม แก้ไข หรือ ลบ รายการธุรกรรมในหน้าจัดทำเอกสารและรายการบันทึกทันที
                    </p>
                  </div>
                </div>
              </div>

              {/* Backup & Restore Panel */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-[#004899]" />
                  <span>สำรองข้อมูลและกู้คืนฐานข้อมูล</span>
                </h3>
                
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  เนื่องจากระบบทำงานแบบ Offline-Local ข้อมูลทั้งหมดจะจัดเก็บในเครื่องของท่านเพื่อความปลอดภัย ท่านควรส่งออกข้อมูลเก็บสำรองไว้เสมอเพื่อป้องกันการสูญหาย
                </p>

                <div className="space-y-3 pt-2 text-xs">
                  {/* Export Button */}
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sky-50 hover:bg-sky-100 text-[#004899] border border-sky-200 rounded-lg font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="h-4 w-4 text-[#004899]" />
                    <span>ส่งออกข้อมูลสำรอง (Export JSON)</span>
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[9px] uppercase font-bold tracking-wider">กู้คืนระบบ (Import)</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all space-y-2 select-none ${
                      isDragging 
                        ? "border-[#004899] bg-sky-50/50" 
                        : "border-slate-200 hover:border-[#004899] hover:bg-slate-50/50"
                    }`}
                  >
                    <Upload className={`h-8 w-8 mx-auto transition-transform duration-200 ${isDragging ? "text-[#004899] scale-110 animate-pulse" : "text-slate-400"}`} />
                    <div className="space-y-1">
                      <p className="font-bold text-slate-700 text-xs">ลากไฟล์สำรอง (.json) มาวางที่นี่</p>
                      <p className="text-[10px] text-slate-400">หรือคลิกเพื่อเลือกไฟล์จากอุปกรณ์ของท่าน</p>
                    </div>
                  </div>

                  {/* Hidden Input File */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              </div>

            </div>

            {/* Col 2 & 3: Users List and Editor */}
            <div className="space-y-6 lg:col-span-2">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#004899]" />
                    <span>จัดการบัญชีผู้ใช้และการเข้าสิทธิ์ ({users.length})</span>
                  </h3>
                  
                  {!isAddingUser && !editingUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingUser(true);
                        setEditingUser(null);
                        setUserForm({
                          username: "",
                          password: "",
                          role: "เจ้าหน้าที่บันทึกข้อมูล (Editor)",
                          canAdd: true,
                          canEdit: false,
                          canDelete: false
                        });
                      }}
                      className="px-3.5 py-1.5 bg-[#004899] hover:bg-opacity-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>เพิ่มผู้ใช้งานใหม่</span>
                    </button>
                  )}
                </div>

                {/* Adding or Editing Form */}
                {(isAddingUser || editingUser) && (
                  <form onSubmit={editingUser ? handleUpdateUserPermissions : handleSaveUser} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <h4 className="text-xs font-bold text-[#004899]">
                        {editingUser ? `แก้ไขบัญชีผู้ใช้: ${editingUser.username}` : "เพิ่มบัญชีผู้ใช้งานใหม่"}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingUser(false);
                          setEditingUser(null);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {!editingUser && (
                        <div>
                          <label className="block text-slate-600 mb-1 font-bold">ชื่อผู้ใช้งาน (Username) *</label>
                          <input
                            type="text"
                            required
                            placeholder="เช่น abbot_watpaknam"
                            value={userForm.username}
                            onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value.replace(/\s+/g, '') }))}
                            className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-600 mb-1 font-bold">
                          รหัสผ่าน {editingUser ? "(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)" : "*"}
                        </label>
                        <input
                          type="password"
                          required={!editingUser}
                          placeholder={editingUser ? "เปลี่ยนรหัสผ่านใหม่" : "เช่น 123456"}
                          value={userForm.password}
                          onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 mb-1 font-bold">ตำแหน่ง / บทบาทของผู้ใช้ *</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => {
                            const selectedRole = e.target.value;
                            let canAdd = true;
                            let canEdit = false;
                            let canDelete = false;
                            
                            if (selectedRole === "ผู้ดูแลระบบ (Admin)" || selectedRole === "ไวยาวัจกร (Accountant)") {
                              canAdd = true;
                              canEdit = true;
                              canDelete = true;
                            } else if (selectedRole === "เจ้าหน้าที่บันทึกข้อมูล (Editor)") {
                              canAdd = true;
                              canEdit = true;
                              canDelete = false;
                            } else if (selectedRole === "ผู้ดูอย่างเดียว (Viewer)") {
                              canAdd = false;
                              canEdit = false;
                              canDelete = false;
                            }
                            
                            setUserForm(prev => ({ 
                              ...prev, 
                              role: selectedRole,
                              canAdd,
                              canEdit,
                              canDelete
                            }));
                          }}
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold bg-white cursor-pointer"
                        >
                          <option value="ผู้ดูแลระบบ (Admin)">ผู้ดูแลระบบ (Admin) - ทำงานได้เต็มระบบ</option>
                          <option value="ไวยาวัจกร (Accountant)">ไวยาวัจกร/ผู้จัดทำบัญชี - ทำงานได้เต็มระบบ</option>
                          <option value="เจ้าอาวาส (Abbot)">เจ้าอาวาส - ตรวจสอบและดูข้อมูล</option>
                          <option value="เจ้าหน้าที่บันทึกข้อมูล (Editor)">เจ้าหน้าที่บันทึกข้อมูล (Editor) - เพิ่ม/แก้ไขได้</option>
                          <option value="ผู้ดูอย่างเดียว (Viewer)">ผู้ดูอย่างเดียว (Viewer)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <label className="block text-slate-700 text-xs font-bold mb-1">กำหนดระดับสิทธิ์ความปลอดภัยการแก้ไข:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={userForm.canAdd}
                            onChange={(e) => setUserForm(prev => ({ ...prev, canAdd: e.target.checked }))}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>มีสิทธิ์เพิ่มข้อมูล</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={userForm.canEdit}
                            onChange={(e) => setUserForm(prev => ({ ...prev, canEdit: e.target.checked }))}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>มีสิทธิ์แก้ไขข้อมูล</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={userForm.canDelete}
                            onChange={(e) => setUserForm(prev => ({ ...prev, canDelete: e.target.checked }))}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>มีสิทธิ์ลบข้อมูล</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingUser(false);
                          setEditingUser(null);
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-sky-100"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>{editingUser ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มผู้ใช้"}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Users List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500">
                        <th className="py-3 px-3 font-bold">ชื่อผู้ใช้งาน</th>
                        <th className="py-3 px-3 font-bold">บทบาท/ตำแหน่ง</th>
                        <th className="py-3 px-3 font-bold text-center">สิทธิ์การใช้งาน</th>
                        <th className="py-3 px-3 font-bold text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => {
                        const isMasterAdmin = u.username.toLowerCase() === "krichabhak" || u.username.toLowerCase() === "admin";
                        const isSelf = u.username.toLowerCase() === username.toLowerCase();
                        
                        return (
                          <tr key={u.username} className="hover:bg-slate-50/60 transition-all">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-800">{u.username}</span>
                              {isSelf && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-sky-50 text-[#004899] font-bold text-[9px] border border-sky-200/50">คุณ</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-500">
                              {u.role}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex gap-1 justify-center">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${u.canAdd ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-slate-100 text-slate-300"}`}>เพิ่ม</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${u.canEdit ? "bg-amber-50 text-amber-700 border border-amber-200/50" : "bg-slate-100 text-slate-300"}`}>แก้ไข</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${u.canDelete ? "bg-rose-50 text-rose-700 border border-rose-200/50" : "bg-slate-100 text-slate-300"}`}>ลบ</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUser(u);
                                    setIsAddingUser(false);
                                    setUserForm({
                                      username: u.username,
                                      password: "",
                                      role: u.role,
                                      canAdd: u.canAdd,
                                      canEdit: u.canEdit,
                                      canDelete: u.canDelete
                                    });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-all cursor-pointer"
                                  title="แก้ไขสิทธิ์"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.username)}
                                  disabled={isMasterAdmin || isSelf}
                                  className={`p-1.5 rounded transition-all ${
                                    isMasterAdmin || isSelf 
                                      ? "text-slate-200 cursor-not-allowed" 
                                      : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  }`}
                                  title={isMasterAdmin ? "ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้" : isSelf ? "ไม่สามารถลบบัญชีของตนเองได้" : "ลบผู้ใช้"}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLOUD & SUPABASE SYNC */}
        {activeSubTab === "cloud" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn" id="db-cloud-panel">
            
            {/* Column 1: Connection & Active Provider Selector */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Cloud Provider Switcher */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                  <Cloud className="h-4 w-4 text-[#004899]" />
                  <span>เลือกผู้ให้บริการ Cloud หลัก</span>
                </h3>
                
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ระบบจัดเตรียมโมดูลเชื่อมต่อระบบคลาวด์ไว้สองประเภท ท่านสามารถสลับไปมาระหว่างคลาวด์ได้ตามวัตถุประสงค์ (ฐานข้อมูลในแต่ละคลาวด์จะถูกบันทึกแยกกัน)
                </p>

                <div className="space-y-2.5 pt-1.5">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    cloudProvider === "supabase" 
                      ? "border-[#004899] bg-sky-50/20" 
                      : "border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="cloud_provider"
                      checked={cloudProvider === "supabase"}
                      onChange={() => onSwitchProvider?.("supabase")}
                      className="mt-1 text-[#004899] focus:ring-[#004899]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Supabase Cloud Database (แนะนำ)</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">ทำงานบนระบบฐานข้อมูล PostgreSQL ประสิทธิภาพสูง เหมาะกับข้อมูลเชิงสัมพันธ์</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    cloudProvider === "firebase" 
                      ? "border-[#004899] bg-sky-50/20" 
                      : "border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input
                      type="radio"
                      name="cloud_provider"
                      checked={cloudProvider === "firebase"}
                      onChange={() => onSwitchProvider?.("firebase")}
                      className="mt-1 text-[#004899] focus:ring-[#004899]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Firebase Firestore Cloud</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">ทำงานบนระบบ NoSQL ของ Google สำหรับบันทึกเอกสารที่เน้นความเร็วและการเข้ากันได้สูง</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Supabase Connection Status Panel */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-[#004899]" />
                    <span>ตรวจสอบการเชื่อมต่อ Supabase</span>
                  </h3>
                  {!isEditingCredentials ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingCredentials(true)}
                      className="text-[10px] font-bold text-[#004899] hover:underline cursor-pointer"
                    >
                      แก้ไขข้อมูลเชื่อมต่อ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingCredentials(false)}
                      className="text-[10px] font-bold text-slate-400 hover:underline cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>

                <div className="space-y-3.5 text-xs">
                  {isEditingCredentials ? (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supabase URL:</span>
                        <input
                          type="text"
                          value={dbUrl}
                          onChange={(e) => setDbUrl(e.target.value)}
                          placeholder="https://your-project.supabase.co"
                          className="w-full font-mono text-[11px] p-2 rounded-lg border border-slate-200 focus:border-[#004899] focus:ring-1 focus:ring-[#004899] outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Anon / Publishable Key:</span>
                        <textarea
                          rows={3}
                          value={dbKey}
                          onChange={(e) => setDbKey(e.target.value)}
                          placeholder="eyJhbGciOi..."
                          className="w-full font-mono text-[10px] p-2 rounded-lg border border-slate-200 focus:border-[#004899] focus:ring-1 focus:ring-[#004899] outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleResetCredentials}
                          className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          รีเซ็ตค่าเริ่มต้น
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCredentials}
                          className="py-1.5 bg-[#004899] hover:bg-[#002d62] text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          บันทึกการตั้งค่า
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supabase URL:</span>
                        <p className="font-mono text-[10px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 truncate" title={dbUrl}>
                          {dbUrl}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anon / Publishable Key:</span>
                        <p className="font-mono text-[10px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 truncate" title={dbKey}>
                          {dbKey.substring(0, 15)}...{dbKey.substring(dbKey.length - 8)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-1.5">
                    {supabaseTestStatus.connecting ? (
                      <div className="flex items-center gap-2 justify-center py-2.5 bg-slate-50 rounded-lg text-slate-500 font-bold border border-slate-200">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#004899]" />
                        <span>กำลังตรวจสอบเซิร์ฟเวอร์...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleTestSupabase}
                        className="w-full py-2.5 bg-[#004899] hover:bg-[#002d62] text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-sky-100 cursor-pointer"
                      >
                        ทดสอบการเชื่อมต่อ (Test Connection)
                      </button>
                    )}
                  </div>

                  {supabaseTestStatus.tested && (
                    <div className={`p-3.5 rounded-xl border text-xs space-y-1 animate-fadeIn ${
                      supabaseTestStatus.connected 
                        ? supabaseTestStatus.tablesExist
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                      <div className="flex items-start gap-1.5 font-bold">
                        {supabaseTestStatus.connected ? (
                          supabaseTestStatus.tablesExist ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>เชื่อมต่อสำเร็จ สมบูรณ์พร้อมใช้งาน</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                              <span>เชื่อมต่อสำเร็จ แต่ยังไม่มีโครงสร้างตาราง</span>
                            </>
                          )
                        ) : (
                          <>
                            <CloudOff className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <span>การเชื่อมต่อล้มเหลว</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] leading-relaxed font-medium mt-1">
                        {supabaseTestStatus.connected 
                          ? supabaseTestStatus.tablesExist
                            ? "การเชื่อมต่อกับ Supabase สำเร็จ และพบคอนฟิกตารางโครงสร้างธุรกรรม บัญชีธนาคาร และผู้ใช้ เรียบร้อยแล้ว ระบบจะซิงค์ข้อมูลให้คุณโดยอัตโนมัติ"
                            : "เซิร์ฟเวอร์ตอบรับการเชื่อมต่อแล้ว แต่ยังไม่มีตารางประวัติธุรกรรมในระบบ กรุณาใช้สคริปต์ SQL ด้านขวาเพื่อสร้างโครงสร้างตารางก่อนใช้งาน"
                          : supabaseTestStatus.details || "กรุณาตรวจสอบอินเทอร์เน็ต รหัสผ่าน และการตั้งค่าของ Supabase"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Column 2 & 3: SQL Script Setup & Synchronization Buttons */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Manual Synchronization Tools */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-[#004899]" />
                  <span>เครื่องมือเขียนทับ/กู้คืนระบบผ่าน Supabase คลาวด์</span>
                </h3>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  สำหรับกรณีที่ต้องการผลักดันฐานข้อมูลล่าสุดขึ้นไปบน Supabase เป็นค่าเริ่มต้น หรือต้องการดึงฐานข้อมูลเก่าใน Supabase มาแทนที่ข้อมูลบนอุปกรณ์นี้โดยทันที
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  {/* Push Current Data */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Upload className="h-4 w-4 text-[#004899]" />
                        <span>ส่งออกข้อมูลขึ้น Cloud (Push)</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                        บันทึกโครงสร้างและยอดธุรกรรม/ข้อมูลวัดในอุปกรณ์ของคุณขณะนี้ไปจัดเก็บบน Supabase เพื่อสร้างเป็นข้อมูลสำรองชุดล่าสุด (จะบันทึกทับข้อมูลเดิมบนคลาวด์ทั้งหมด)
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      disabled={syncingAction !== null}
                      onClick={handleForcePushSupabase}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#004899] to-sky-600 text-white rounded-lg font-bold transition-all hover:opacity-95 cursor-pointer disabled:opacity-50"
                    >
                      {syncingAction === "push" ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>กำลังอัปโหลด...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>ผลักข้อมูลขึ้น Supabase (Force Push)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pull Current Data */}
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Download className="h-4 w-4 text-emerald-600" />
                        <span>ดึงข้อมูลลงจาก Cloud (Pull)</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                        ดึงข้อมูลธุรกรรม บัญชีธนาคาร ข้อมูลวัด และรายชื่อผู้ใช้งานระบบจากคลาวด์มาเขียนทับข้อมูลในเครื่องขณะนี้ทั้งหมด เพื่อทำการซิงค์ระบบหรือเปลี่ยนเครื่องทำงาน
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      disabled={syncingAction !== null}
                      onClick={handleForcePullSupabase}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {syncingAction === "pull" ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                          <span>กำลังดาวน์โหลด...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>ดึงข้อมูลจาก Supabase (Force Pull)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* SQL Schema Setup Box */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <FileCode className="h-4 w-4 text-amber-600" />
                      <span>ขั้นตอนจัดเตรียมโครงสร้างฐานข้อมูล (Database Schema Setup)</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">จำเป็นต้องรันสคริปต์ด้านล่างนี้ในช่อง SQL Editor ของ Supabase เพียงครั้งแรกครั้งเดียว</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySQL}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer animate-none"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>คัดลอกรหัส SQL (Copy Code)</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-900 text-slate-200 font-mono rounded-xl border border-slate-800 overflow-hidden relative">
                  <div className="absolute top-2 right-2 text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                    PostgreSQL
                  </div>
                  <pre className="text-[10px] max-h-72 overflow-y-auto leading-relaxed select-all cursor-pointer scrollbar-thin">
                    {SUPABASE_SQL_SETUP}
                  </pre>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100/50 text-xs text-amber-800 space-y-2">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> ทำความเข้าใจเกี่ยวกับนโยบายความปลอดภัย (RLS):
                  </p>
                  <ul className="list-disc pl-5 text-[11px] leading-relaxed space-y-1">
                    <li>สคริปต์ด้านบนได้เปิดใช้งาน Row Level Security (RLS) และสร้างนโยบายความปลอดภัยการเข้าถึงแบบสาธารณะผ่าน <strong>Anonymous (anon) Key</strong> เพื่อความสะดวกสบายในการบันทึกและกู้คืนข้อมูลแบบ Real-time</li>
                    <li>ท่านสามารถแก้ไขนโยบายการเชื่อมต่อ RLS ภายหลังในเมนู Database ของ Supabase ได้หากต้องการเพิ่มความเข้มงวดความปลอดภัย</li>
                  </ul>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
