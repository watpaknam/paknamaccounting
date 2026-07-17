import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import RecordForm from "./components/RecordForm";
import Reports from "./components/Reports";
import BuddhaIcon from "./components/BuddhaIcon";
import DatabaseManagement from "./components/DatabaseManagement";

import { 
  INITIAL_TEMPLE_INFO, 
  INITIAL_BANK_ACCOUNTS, 
  INITIAL_TRANSACTIONS,
  INITIAL_USERS
} from "./data";
import { TempleInfo, BankAccount, Transaction, UserAccount } from "./types";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  BarChart3, 
  LogOut,
  Building2,
  Database,
  Cloud,
  CloudOff,
  RefreshCw
} from "lucide-react";
import { fetchFromCloud, saveToCloud } from "./lib/firebase";
import { fetchFromSupabase, saveToSupabase, checkSupabaseConnection } from "./lib/supabase";

export default function App() {
  // Authentication State
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem("temple_username") || "";
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("temple_is_logged_in") === "true";
  });

  // Business States
  const [templeInfo, setTempleInfo] = useState<TempleInfo>(() => {
    const saved = localStorage.getItem("temple_info");
    const info = saved ? JSON.parse(saved) : INITIAL_TEMPLE_INFO;
    // Overwrite old cached values dynamically to reflect instructions instantly
    if (info.name === "วัดปากน้ำ" && (!info.address || info.address.includes("300 วัดปากน้ำ"))) {
      info.address = INITIAL_TEMPLE_INFO.address;
    }
    if (info.abbotName === "พระพรหมโมลี" || info.abbotName === "พระมหาธนพล เขมปญฺโญ" || (info.abbotName && info.abbotName.startsWith(".") && info.abbotName.length < INITIAL_TEMPLE_INFO.abbotName.length)) {
      info.abbotName = INITIAL_TEMPLE_INFO.abbotName;
    }
    if (info.accountantName === "พระครูปลัดสุวัฒนสมาธิคุณ" || (info.accountantName && info.accountantName.startsWith(".") && info.accountantName.length < INITIAL_TEMPLE_INFO.accountantName.length)) {
      info.accountantName = INITIAL_TEMPLE_INFO.accountantName;
    }
    return info;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem("temple_bank_accounts");
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("temple_transactions");
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // User Management State
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem("temple_users");
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  // Navigation View State
  const [currentView, setCurrentView] = useState<string>("dashboard");

  // Save states to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem("temple_info", JSON.stringify(templeInfo));
  }, [templeInfo]);

  useEffect(() => {
    localStorage.setItem("temple_bank_accounts", JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem("temple_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("temple_users", JSON.stringify(users));
  }, [users]);

  // Cloud Database Sync State
  const [cloudProvider, setCloudProvider] = useState<"firebase" | "supabase">(() => {
    return (localStorage.getItem("cloud_provider") as "firebase" | "supabase") || "supabase";
  });
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"checking" | "synced" | "syncing" | "error" | "offline">("checking");
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [hasLoadedInitialCloud, setHasLoadedInitialCloud] = useState(false);

  // Load from Cloud once on startup or when provider changes
  useEffect(() => {
    async function loadCloud() {
      try {
        setCloudSyncStatus("checking");
        let cloudData = null;

        if (cloudProvider === "supabase") {
          const status = await checkSupabaseConnection();
          if (status.connected) {
            if (status.tablesExist) {
              cloudData = await fetchFromSupabase();
            } else {
              // Tables do not exist yet. Running in offline/uninitialized state
              console.warn("Supabase tables not initialized yet.");
              setCloudSyncStatus("error");
              setHasLoadedInitialCloud(true);
              return;
            }
          } else {
            throw new Error(status.error || "Supabase connection failed");
          }
        } else {
          cloudData = await fetchFromCloud();
        }

        if (cloudData) {
          setTempleInfo(cloudData.templeInfo);
          setBankAccounts(cloudData.bankAccounts);
          setTransactions(cloudData.transactions);
          setUsers(cloudData.users);
          setLastCloudSync(new Date().toLocaleTimeString("th-TH"));
          setCloudSyncStatus("synced");
        } else {
          // Empty database on cloud! Push current states to initialize
          if (cloudProvider === "supabase") {
            await saveToSupabase({
              templeInfo,
              bankAccounts,
              transactions,
              users
            });
          } else {
            await saveToCloud({
              templeInfo,
              bankAccounts,
              transactions,
              users
            });
          }
          setLastCloudSync(new Date().toLocaleTimeString("th-TH"));
          setCloudSyncStatus("synced");
        }
      } catch (error) {
        console.error("Failed to sync on boot:", error);
        setCloudSyncStatus("error");
      } finally {
        setHasLoadedInitialCloud(true);
      }
    }
    loadCloud();
  }, [cloudProvider]);

  // Sync to Cloud automatically when states change (debounced 1.5s)
  useEffect(() => {
    if (!hasLoadedInitialCloud) return;

    const timer = setTimeout(async () => {
      try {
        setCloudSyncStatus("syncing");
        if (cloudProvider === "supabase") {
          const status = await checkSupabaseConnection();
          if (status.connected && status.tablesExist) {
            await saveToSupabase({
              templeInfo,
              bankAccounts,
              transactions,
              users
            });
            setLastCloudSync(new Date().toLocaleTimeString("th-TH"));
            setCloudSyncStatus("synced");
          } else {
            setCloudSyncStatus("error");
          }
        } else {
          await saveToCloud({
            templeInfo,
            bankAccounts,
            transactions,
            users
          });
          setLastCloudSync(new Date().toLocaleTimeString("th-TH"));
          setCloudSyncStatus("synced");
        }
      } catch (error) {
        console.error("Auto sync to Cloud failed:", error);
        setCloudSyncStatus("error");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [templeInfo, bankAccounts, transactions, users, hasLoadedInitialCloud, cloudProvider]);

  const handleManualCloudSync = async () => {
    try {
      setCloudSyncStatus("syncing");
      if (cloudProvider === "supabase") {
        const status = await checkSupabaseConnection();
        if (!status.connected) {
          throw new Error(status.details || "Cannot connect to Supabase");
        }
        if (!status.tablesExist) {
          throw new Error("ยังไม่ได้สร้างตารางในฐานข้อมูล Supabase กรุณาเข้าเมนูจัดการข้อมูลเพื่อสร้างตารางผ่านสคริปต์ SQL");
        }
        await saveToSupabase({
          templeInfo,
          bankAccounts,
          transactions,
          users
        });
      } else {
        await saveToCloud({
          templeInfo,
          bankAccounts,
          transactions,
          users
        });
      }
      setLastCloudSync(new Date().toLocaleTimeString("th-TH"));
      setCloudSyncStatus("synced");
      alert(`ซิงค์ข้อมูลขึ้นระบบคลาวด์ (${cloudProvider === "supabase" ? "Supabase" : "Firebase"}) เสร็จสมบูรณ์!`);
    } catch (error: any) {
      console.error("Manual sync failed:", error);
      setCloudSyncStatus("error");
      alert(`ไม่สามารถเชื่อมต่อคลาวด์ได้: ${error.message || "กรุณาตรวจสอบอินเทอร์เน็ต"}`);
    }
  };

  const handleSwitchProvider = (provider: "firebase" | "supabase") => {
    setCloudProvider(provider);
    localStorage.setItem("cloud_provider", provider);
    setCloudSyncStatus("checking");
  };

  const currentUser = users.find(u => u.username.toLowerCase() === username.toLowerCase()) || {
    username,
    role: "ผู้ดูแลระบบ (Admin)",
    canAdd: true,
    canEdit: true,
    canDelete: true
  };

  const handleAddUser = (newUser: UserAccount) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (uName: string, updatedFields: Partial<UserAccount>) => {
    setUsers(prev => prev.map(u => u.username === uName ? { ...u, ...updatedFields } : u));
  };

  const handleDeleteUser = (uName: string) => {
    setUsers(prev => prev.filter(u => u.username !== uName));
  };

  const handleImportBackup = (
    newTempleInfo: TempleInfo,
    newBankAccounts: BankAccount[],
    newTransactions: Transaction[],
    newUsers: UserAccount[]
  ) => {
    setTempleInfo(newTempleInfo);
    setBankAccounts(newBankAccounts);
    setTransactions(newTransactions);
    setUsers(newUsers);
  };

  const handleLogin = (user: string) => {
    setUsername(user);
    setIsLoggedIn(true);
    localStorage.setItem("temple_username", user);
    localStorage.setItem("temple_is_logged_in", "true");
  };

  const handleLogout = () => {
    setUsername("");
    setIsLoggedIn(false);
    localStorage.removeItem("temple_username");
    localStorage.removeItem("temple_is_logged_in");
    setCurrentView("dashboard");
  };

  // Transaction Event Handlers
  const handleAddTransaction = (newTx: Omit<Transaction, "id">) => {
    const txWithId: Transaction = {
      ...newTx,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
    };
    setTransactions(prev => [txWithId, ...prev]);
  };

  const handleUpdateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id === id) {
        return { ...tx, ...updatedFields };
      }
      return tx;
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // Bank Account Event Handlers
  const handleAddBankAccount = (newAcc: BankAccount) => {
    setBankAccounts(prev => [...prev, newAcc]);
  };

  const handleUpdateBankAccount = (id: string, updatedFields: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updatedFields } : acc));
  };

  const handleDeleteBankAccount = (id: string) => {
    setBankAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  // Temple Info Event Handlers
  const handleUpdateTempleInfo = (newInfo: TempleInfo) => {
    setTempleInfo(newInfo);
  };

  const handleRefreshData = () => {
    // Just simple reload state simulation to verify sync
    const savedTransactions = localStorage.getItem("temple_transactions");
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  };

  // Render logic based on auth and currentView state
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden" id="app-root">
      
      {/* Sidebar navigation */}
      <aside className="w-64 bg-gradient-to-b from-[#002d62] to-[#01142e] text-slate-300 flex flex-col shrink-0 no-print" id="app-sidebar">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#004899] to-sky-400 rounded-lg flex items-center justify-center text-white p-0.5 shrink-0 shadow-md shadow-sky-500/20">
            <BuddhaIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-white font-black leading-none text-sm tracking-tight">ระบบบัญชีวัด</h1>
            <p className="text-[10px] text-sky-300/80 mt-1 uppercase tracking-wider font-extrabold">มาตรฐานสำนักพุทธฯ</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" id="sidebar-nav">
          <div className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-widest">เมนูหลัก</div>
          <button 
            onClick={() => setCurrentView("dashboard")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-left ${
              currentView === "dashboard" 
                ? "bg-[#004899]/50 text-white border-l-4 border-sky-400 font-bold" 
                : "hover:bg-white/5 hover:text-white text-slate-300"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-sky-400 shrink-0" />
            <span>แผงควบคุม</span>
          </button>
          
          <button 
            onClick={() => setCurrentView("record")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-left ${
              currentView === "record" 
                ? "bg-[#004899]/50 text-white border-l-4 border-sky-400 font-bold" 
                : "hover:bg-white/5 hover:text-white text-slate-300"
            }`}
          >
            <BookOpen className="h-4 w-4 text-sky-400 shrink-0" />
            <span>สมุดบัญชีรายรับ-รายจ่าย</span>
          </button>
 
          <div className="text-[10px] font-bold text-slate-400 px-3 py-2 mt-4 uppercase tracking-widest">รายงานมาตรฐาน</div>
          <button 
            onClick={() => setCurrentView("report1")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-left ${
              currentView === "report1" 
                ? "bg-[#004899]/50 text-white border-l-4 border-sky-400 font-bold" 
                : "hover:bg-white/5 hover:text-white text-slate-300"
            }`}
          >
            <FileText className="h-4 w-4 text-sky-400 shrink-0" />
            <span>งบรายรับ-รายจ่าย</span>
          </button>
          <button 
            onClick={() => setCurrentView("report2")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-left ${
              currentView === "report2" 
                ? "bg-[#004899]/50 text-white border-l-4 border-sky-400 font-bold" 
                : "hover:bg-white/5 hover:text-white text-slate-300"
            }`}
          >
            <FileText className="h-4 w-4 text-sky-400 shrink-0" />
            <span>บัญชีเงินฝาก</span>
          </button>
          <button 
            onClick={() => setCurrentView("report3")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-left ${
              currentView === "report3" 
                ? "bg-[#004899]/50 text-white border-l-4 border-sky-400 font-bold" 
                : "hover:bg-white/5 hover:text-white text-slate-300"
            }`}
          >
            <BarChart3 className="h-4 w-4 text-sky-400 shrink-0" />
            <span>รายงานคงเหลือ</span>
          </button>
 
          <div className="text-[10px] font-bold text-slate-400 px-3 py-2 mt-4 uppercase tracking-widest font-sans">ผู้ดูแลระบบ (Admin)</div>
          <button 
            onClick={() => setCurrentView("database")} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer text-left ${
              currentView === "database" 
                ? "bg-[#004899]/50 text-white border-l-4 border-sky-400 font-bold" 
                : "hover:bg-white/5 hover:text-white text-slate-300"
            }`}
          >
            <Database className="h-4 w-4 text-sky-400 shrink-0" />
            <span>จัดการฐานข้อมูล</span>
          </button>
        </nav>
 
        <div className="p-4 border-t border-white/10 gap-2 flex flex-col shrink-0">
          <div className="bg-[#001736] border border-[#004899]/30 rounded-xl p-3.5 text-xs">
            <p className="text-slate-400">ผู้เข้าใช้งานในระบบ</p>
            <p className="text-white font-semibold mt-0.5">{username}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
 
      {/* Main content viewport */}
      <main className="flex-1 flex flex-col overflow-hidden" id="app-main">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 no-print" id="app-header">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#004899]" />
              <h2 className="text-base font-black text-[#004899]">{templeInfo.name}</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200/50">สถานะ: ปกติ</span>
            
            {/* Cloud Sync Status Badge */}
            {cloudSyncStatus === "checking" && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/50 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                <span>ตรวจสอบ {cloudProvider === "supabase" ? "Supabase" : "Firebase"}...</span>
              </span>
            )}
            {cloudSyncStatus === "synced" && (
              <span 
                onClick={handleManualCloudSync}
                title={`ซิงค์ข้อมูลล่าสุด: ${lastCloudSync || "-"}`}
                className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200/50 flex items-center gap-1 cursor-pointer hover:bg-sky-100 transition-colors"
              >
                <Cloud className="h-3 w-3 text-sky-500" />
                <span>เชื่อมต่อ {cloudProvider === "supabase" ? "Supabase" : "Firebase"} สำเร็จ (ซิงค์ {lastCloudSync || "-"})</span>
              </span>
            )}
            {cloudSyncStatus === "syncing" && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/50 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                <span>กำลังบันทึกข้อมูลขึ้น {cloudProvider === "supabase" ? "Supabase" : "Firebase"}...</span>
              </span>
            )}
            {cloudSyncStatus === "error" && (
              <span 
                onClick={handleManualCloudSync}
                title="คลิกเพื่อลองเชื่อมต่อใหม่อีกครั้ง"
                className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/50 flex items-center gap-1 cursor-pointer hover:bg-rose-100 transition-colors"
              >
                <CloudOff className="h-3 w-3 text-rose-500" />
                <span>บันทึกแบบออฟไลน์ ({cloudProvider === "supabase" ? "Supabase" : "Firebase"}) (คลิกเพื่อเชื่อมต่อใหม่)</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right text-xs">
              <p className="text-slate-500 font-medium">ปีงบประมาณ</p>
              <p className="font-extrabold text-slate-800">พ.ศ. 2569</p>
            </div>
            {currentView !== "record" && (
              <button 
                onClick={() => setCurrentView("record")} 
                className="bg-gradient-to-r from-[#004899] to-sky-500 hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-100 cursor-pointer"
              >
                บันทึกรายการใหม่
              </button>
            )}
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className={`flex-1 overflow-auto ${currentView === "dashboard" ? "bg-[#040e21]" : "bg-slate-50"}`} id="app-view-container">
          
          {currentView === "dashboard" && (
            <Dashboard
              templeInfo={templeInfo}
              bankAccounts={bankAccounts}
              transactions={transactions}
              username={username}
              onLogout={handleLogout}
              onNavigate={(view) => setCurrentView(view)}
              onRefresh={handleRefreshData}
            />
          )}

          {currentView === "record" && (
            <RecordForm
              bankAccounts={bankAccounts}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onBackToDashboard={() => setCurrentView("dashboard")}
              currentUser={currentUser}
            />
          )}

          {(currentView === "report1" || currentView === "report2" || currentView === "report3") && (
            <Reports
              reportType={currentView as "report1" | "report2" | "report3"}
              templeInfo={templeInfo}
              bankAccounts={bankAccounts}
              transactions={transactions}
              onBackToDashboard={() => setCurrentView("dashboard")}
            />
          )}

          {currentView === "database" && (
            <DatabaseManagement
              templeInfo={templeInfo}
              bankAccounts={bankAccounts}
              transactions={transactions}
              username={username}
              onUpdateTempleInfo={handleUpdateTempleInfo}
              onAddBankAccount={handleAddBankAccount}
              onUpdateBankAccount={handleUpdateBankAccount}
              onDeleteBankAccount={handleDeleteBankAccount}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onBackToDashboard={() => setCurrentView("dashboard")}
              onLogout={handleLogout}
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onImportBackup={handleImportBackup}
              cloudProvider={cloudProvider}
              onSwitchProvider={handleSwitchProvider}
            />
          )}

        </div>
      </main>

    </div>
  );
}
