import React from "react";
import { 
  Building2, 
  Coins, 
  CreditCard, 
  PlusCircle, 
  FileText, 
  BarChart3, 
  CheckSquare, 
  LogOut, 
  RefreshCw,
  Landmark
} from "lucide-react";
import { TempleInfo, BankAccount, Transaction } from "../types";
import BuddhaIcon from "./BuddhaIcon";

interface DashboardProps {
  templeInfo: TempleInfo;
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  username: string;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  onRefresh: () => void;
}

export default function Dashboard({
  templeInfo,
  bankAccounts,
  transactions,
  username,
  onLogout,
  onNavigate,
  onRefresh
}: DashboardProps) {
  
  // Calculate Cash Balance
  // Cash In increases cash, Cash Out decreases cash
  // Bank Deposit decreases cash in hand, Bank Withdraw increases cash in hand
  const cashBalance = transactions.reduce((acc, tx) => {
    if (tx.type === "cash_in") return acc + tx.amount;
    if (tx.type === "cash_out") return acc - tx.amount;
    if (tx.type === "bank_deposit") return acc - tx.amount;
    if (tx.type === "bank_withdraw") return acc + tx.amount;
    return acc;
  }, 0);

  // Calculate Bank Balances
  // Bank Account Balance = InitialBalance + deposits + direct_bank_in - withdrawals - direct_bank_out
  const getAccountBalance = (account: BankAccount) => {
    const changes = transactions.reduce((acc, tx) => {
      if (tx.bankAccountId !== account.id) return acc;
      if (tx.type === "bank_deposit" || tx.type === "direct_bank_in") {
        return acc + tx.amount;
      }
      if (tx.type === "bank_withdraw" || tx.type === "direct_bank_out") {
        return acc - tx.amount;
      }
      return acc;
    }, 0);
    return account.initialBalance + changes;
  };

  const totalBankBalance = bankAccounts.reduce((acc, accObj) => {
    return acc + getAccountBalance(accObj);
  }, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const activeYear = transactions.length > 0 ? Math.max(...transactions.map(t => t.year)) : 2569;

  const totalIncomeYear = transactions.reduce((acc, tx) => {
    if (tx.year === activeYear && (tx.type === "cash_in" || tx.type === "direct_bank_in")) {
      return acc + tx.amount;
    }
    return acc;
  }, 0);

  const totalExpenseYear = transactions.reduce((acc, tx) => {
    if (tx.year === activeYear && (tx.type === "cash_out" || tx.type === "direct_bank_out")) {
      return acc + tx.amount;
    }
    return acc;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100" id="dashboard-container">
      
      {/* Temple Details Card (Corporate Navy Blue & Sky Gradient Header) */}
      <div className="bg-gradient-to-r from-[#002d62] to-[#004899] rounded-2xl border border-sky-900/30 p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-black/30" id="temple-info-card">
        <div className="bg-sky-400/10 text-sky-400 p-2 rounded-2xl shrink-0 flex items-center justify-center w-16 h-16 shadow-lg shadow-sky-500/10 border border-sky-400/20">
          <BuddhaIcon className="w-12 h-12 text-sky-400" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-1.5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
            <h2 className="text-[18px] font-black text-white tracking-tight">{templeInfo.name}</h2>
            <span className="inline-block px-3 py-1 rounded-full bg-sky-400/20 text-sky-300 text-xs font-black border border-sky-400/30">
              สถานะ: ปกติ
            </span>
          </div>
          <p className="text-sm md:text-base text-sky-200/80 font-semibold">{templeInfo.address}</p>
        </div>
      </div>

      {/* Summaries Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="summary-section-header">
        <div className="space-y-1">
          <h3 className="text-[18px] font-black text-white tracking-tight">แผงควบคุมระบบบัญชีวัด</h3>
          <p className="text-sm text-slate-400 font-medium">สรุปข้อมูลทางการเงินแบบเรียลไทม์จำแนกตามมาตรฐานสำนักงานพระพุทธศาสนาแห่งชาติ</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1c38] border border-sky-950 hover:bg-[#004899]/30 text-sky-300 hover:text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 text-sky-400" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Summaries Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="summary-cards-grid">
        <div className="bg-[#0a1c38] p-6 rounded-2xl border border-sky-950 shadow-xl relative overflow-hidden group">
          <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">ยอดเงินสดคงเหลือ</p>
          <p className="text-[20px] font-black mt-3 text-white">{formatCurrency(cashBalance)}</p>
          <div className="mt-3 text-xs text-green-400 font-extrabold flex items-center gap-1.5">
            <span>● มีประสิทธิภาพ</span>
            <span className="text-slate-500 font-medium">| ในมือวัด</span>
          </div>
        </div>

        <div className="bg-[#0a1c38] p-6 rounded-2xl border border-sky-950 shadow-xl relative overflow-hidden group">
          <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">เงินฝากธนาคาร (ทุกบัญชี)</p>
          <p className="text-[20px] font-black mt-3 text-white">{formatCurrency(totalBankBalance)}</p>
          <div className="mt-3 text-xs text-sky-400 font-bold">
            {bankAccounts.length} บัญชีเงินฝากวัด
          </div>
        </div>

        <div className="bg-[#0a1c38] p-6 rounded-2xl border border-sky-950 shadow-xl relative overflow-hidden group">
          <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">รายรับสะสม (ปีนี้)</p>
          <p className="text-[20px] font-black mt-3 text-sky-400">{formatCurrency(totalIncomeYear)}</p>
          <div className="mt-3 text-xs text-slate-400 font-bold">
            รวมเงินทำบุญและเงินอุดหนุน
          </div>
        </div>

        <div className="bg-[#0a1c38] p-6 rounded-2xl border border-sky-950 shadow-xl relative overflow-hidden group">
          <p className="text-xs sm:text-sm text-slate-400 font-extrabold uppercase tracking-wider">รายจ่ายสะสม (ปีนี้)</p>
          <p className="text-[20px] font-black mt-3 text-rose-400">{formatCurrency(totalExpenseYear)}</p>
          <div className="mt-3 text-xs text-slate-400 font-bold">
            ค่าน้ำ-ค่ายาและค่าบูรณปฏิสังขรณ์
          </div>
        </div>
      </div>

      {/* Main Section Content Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-details-split">
        
        {/* Left Section (2 cols width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bank Account Details table */}
          <div className="bg-[#0a1c38] rounded-2xl border border-sky-950 shadow-xl overflow-hidden" id="bank-accounts-details">
            <div className="px-6 py-4.5 border-b border-sky-950 flex items-center justify-between bg-black/10">
              <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                <Landmark className="h-5 w-5 text-sky-400 shrink-0" />
                <span>บัญชีธนาคารผูกพันวัด ({bankAccounts.length} บัญชี)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-black/20 text-slate-400 font-bold uppercase tracking-wider">
                  <tr className="border-b border-sky-950">
                    <th className="py-4 px-6 text-xs sm:text-sm">รหัสบัญชี</th>
                    <th className="py-4 px-6 text-xs sm:text-sm">ธนาคาร</th>
                    <th className="py-4 px-6 text-xs sm:text-sm">ชื่อบัญชี</th>
                    <th className="py-4 px-6 text-xs sm:text-sm">เลขที่บัญชี</th>
                    <th className="py-4 px-6 text-right text-xs sm:text-sm">ยอดเงินคงเหลือ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-950/40 text-slate-300 font-semibold">
                  {bankAccounts.map((account) => {
                    const bal = getAccountBalance(account);
                    return (
                      <tr key={account.id} className="hover:bg-sky-900/10 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-sky-400">{account.code}</td>
                        <td className="py-4 px-6 font-bold text-white">{account.bankName}</td>
                        <td className="py-4 px-6">{account.accountName}</td>
                        <td className="py-4 px-6 font-mono text-slate-400">{account.accountNo}</td>
                        <td className="py-4 px-6 text-right font-black text-white">{formatCurrency(bal)}</td>
                      </tr>
                    );
                  })}
                  {bankAccounts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        ไม่พบข้อมูลบัญชีธนาคาร
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-[#0a1c38] rounded-2xl border border-sky-950 shadow-xl overflow-hidden" id="recent-transactions">
            <div className="px-6 py-4.5 border-b border-sky-950 flex items-center justify-between bg-black/10">
              <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                <Coins className="h-5 w-5 text-sky-400 shrink-0" />
                <span>รายการบัญชีรับ-จ่ายล่าสุด (ปีงบประมาณ พ.ศ. {activeYear})</span>
              </h3>
              <button 
                onClick={() => onNavigate("record")} 
                className="text-xs sm:text-sm text-sky-400 font-extrabold hover:text-sky-300 hover:underline cursor-pointer"
              >
                ดูทั้งหมด / จัดการข้อมูล
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-black/20 text-slate-400 font-bold uppercase tracking-wider">
                  <tr className="border-b border-sky-950">
                    <th className="py-4 px-6 text-xs sm:text-sm">วัน/เดือน/ปี</th>
                    <th className="py-4 px-6 text-xs sm:text-sm">เลขที่เอกสาร</th>
                    <th className="py-4 px-6 text-xs sm:text-sm">คำอธิบายรายการ</th>
                    <th className="py-4 px-6 text-xs sm:text-sm">รหัสหมวดหมู่</th>
                    <th className="py-4 px-6 text-right text-xs sm:text-sm">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-950/40 text-slate-300">
                  {transactions.slice(0, 5).map((tx) => {
                    const isIncoming = tx.type === "cash_in" || tx.type === "bank_withdraw" || tx.type === "direct_bank_in";
                    return (
                      <tr key={tx.id} className="hover:bg-sky-900/10 transition-colors font-medium">
                        <td className="py-4 px-6 font-mono text-slate-400">{tx.day}/{tx.month}/{tx.year}</td>
                        <td className="py-4 px-6 font-mono text-slate-500">{tx.documentNo}</td>
                        <td className="py-4 px-6 font-semibold text-white">{tx.description}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded text-xs font-black ${
                            isIncoming 
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}>
                            {tx.code}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-right font-bold text-sm sm:text-base ${
                          isIncoming ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {isIncoming ? "+ " : "- "}{new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2 }).format(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        ไม่พบข้อมูลธุรกรรมล่าสุด
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Section (1 col width) */}
        <div className="space-y-6">
          
          {/* Budget progress by fund */}
          <div className="bg-[#0a1c38] p-6 rounded-2xl border border-sky-950 shadow-xl" id="funds-card">
            <h3 className="font-extrabold mb-5 text-sm sm:text-base text-white">วัตถุประสงค์งบประมาณและเงินกองทุน</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-300 font-medium">กองทุนบูรณะปฏิสังขรณ์</span>
                  <span className="font-black text-white">75%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full">
                  <div className="bg-sky-400 h-2.5 rounded-full shadow-sm shadow-sky-500/30" style={{ width: "75%" }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-300 font-medium">กองทุนเผยแผ่ศาสนธรรม</span>
                  <span className="font-black text-white">40%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full">
                  <div className="bg-emerald-500 h-2.5 rounded-full shadow-sm shadow-emerald-500/30" style={{ width: "40%" }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-300 font-medium">กองทุนการศึกษาสงฆ์</span>
                  <span className="font-black text-white">92%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full">
                  <div className="bg-blue-500 h-2.5 rounded-full shadow-sm shadow-blue-500/30" style={{ width: "92%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status Banner (Demeter Gradient) */}
          <div className="bg-gradient-to-br from-[#004899] to-sky-500 rounded-2xl p-6 text-white shadow-xl shadow-sky-950/20" id="verify-banner">
            <h3 className="font-black text-sm sm:text-base mb-2">การตรวจสอบบัญชีวัด</h3>
            <p className="text-xs sm:text-sm opacity-95 leading-relaxed mb-5">
              สมุดบัญชีรายรับ-รายจ่ายได้รับการตรวจสอบความสมดุลและความถูกต้องทางวินัยการคลัง โดยกรรมการวัดและไวยาวัจกร สถานะเรียบร้อยพร้อมจัดพิมพ์แบบรายงาน พศ.
            </p>
            <button 
              onClick={() => onNavigate("report3")}
              className="w-full bg-white text-[#004899] hover:bg-slate-100 text-xs sm:text-sm font-black py-3 rounded-xl transition-all cursor-pointer shadow-md"
            >
              ดูรายงานเงินคงเหลือวัด
            </button>
          </div>

        </div>

      </div>

      {/* Main Menu Shortcuts Quick Action Links */}
      <div className="space-y-4" id="main-menu-section">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">ทางลัดการจัดทำบัญชีวัด</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <button
            onClick={() => onNavigate("record")}
            className="flex flex-col items-center justify-center p-6 bg-[#0a1c38]/50 hover:bg-[#0a1c38] border border-sky-950 text-slate-100 rounded-2xl transition-all shadow-lg hover:shadow-xl group text-center h-44 cursor-pointer"
          >
            <div className="bg-gradient-to-tr from-[#004899] to-sky-500 text-white p-3.5 rounded-2xl shadow-sm mb-3.5 group-hover:scale-110 transition-transform">
              <PlusCircle className="h-6.5 w-6.5" />
            </div>
            <span className="font-black text-sm sm:text-base block">บันทึกข้อมูล</span>
            <span className="text-xs text-slate-400 mt-1">รับ-จ่ายเงินสด / จัดการบัญชี</span>
          </button>

          <button
            onClick={() => onNavigate("report1")}
            className="flex flex-col items-center justify-center p-6 bg-[#0a1c38]/50 hover:bg-[#0a1c38] border border-sky-950 text-slate-100 rounded-2xl transition-all shadow-lg hover:shadow-xl group text-center h-44 cursor-pointer"
          >
            <div className="bg-sky-950 text-sky-400 p-3.5 rounded-2xl shadow-sm mb-3.5 group-hover:scale-110 transition-transform">
              <FileText className="h-6.5 w-6.5" />
            </div>
            <span className="font-black text-sm sm:text-base block">แบบรายงานที่ 1</span>
            <span className="text-xs text-slate-400 mt-1">บัญชีรายรับ-รายจ่าย (เงินสด)</span>
          </button>

          <button
            onClick={() => onNavigate("report2")}
            className="flex flex-col items-center justify-center p-6 bg-[#0a1c38]/50 hover:bg-[#0a1c38] border border-sky-950 text-slate-100 rounded-2xl transition-all shadow-lg hover:shadow-xl group text-center h-44 cursor-pointer"
          >
            <div className="bg-sky-950 text-sky-400 p-3.5 rounded-2xl shadow-sm mb-3.5 group-hover:scale-110 transition-transform">
              <FileText className="h-6.5 w-6.5" />
            </div>
            <span className="font-black text-sm sm:text-base block">แบบรายงานที่ 2</span>
            <span className="text-xs text-slate-400 mt-1">บัญชีรายรับ-รายจ่าย (ธนาคาร)</span>
          </button>

          <button
            onClick={() => onNavigate("report3")}
            className="flex flex-col items-center justify-center p-6 bg-[#0a1c38]/50 hover:bg-[#0a1c38] border border-sky-950 text-slate-100 rounded-2xl transition-all shadow-lg hover:shadow-xl group text-center h-44 cursor-pointer"
          >
            <div className="bg-sky-950 text-sky-400 p-3.5 rounded-2xl shadow-sm mb-3.5 group-hover:scale-110 transition-transform">
              <BarChart3 className="h-6.5 w-6.5" />
            </div>
            <span className="font-black text-sm sm:text-base block">แบบรายงานที่ 3</span>
            <span className="text-xs text-slate-400 mt-1">รายงานสรุปเงินคงเหลือประจำปี</span>
          </button>

        </div>
      </div>

    </div>
  );
}
