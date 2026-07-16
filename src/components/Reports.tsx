import React, { useState } from "react";
import { 
  ArrowLeft, 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  Download, 
  Landmark, 
  Coins, 
  CoinsIcon, 
  Building2, 
  ArrowRight,
  FileText
} from "lucide-react";
import { TempleInfo, BankAccount, Transaction, CodeDefinition } from "../types";
import { 
  INCOME_CODES, 
  EXPENSE_CODES, 
  THAI_MONTHS 
} from "../data";

interface ReportsProps {
  reportType: "report1" | "report2" | "report3";
  templeInfo: TempleInfo;
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  onBackToDashboard: () => void;
}

export default function Reports({
  reportType,
  templeInfo,
  bankAccounts,
  transactions,
  onBackToDashboard
}: ReportsProps) {
  
  // States for Report 1
  const [r1Month, setR1Month] = useState<string>("7"); // Default July
  const [r1Year, setR1Year] = useState<number>(2569);
  const [r1Code, setR1Code] = useState<string>("all");

  // States for Report 2
  const [r2BankId, setR2BankId] = useState<string>("Bank01");
  const [r2StartDay, setR2StartDay] = useState<number>(1);
  const [r2StartMonth, setR2StartMonth] = useState<number>(1);
  const [r2EndDay, setR2EndDay] = useState<number>(31);
  const [r2EndMonth, setR2EndMonth] = useState<number>(12);
  const [r2Year, setR2Year] = useState<number>(2569);

  // States for Report 3
  const [r3Month, setR3Month] = useState<string>("all"); // "all" for whole year
  const [r3Year, setR3Year] = useState<number>(2569);

  const getThaiMonthLabel = (m: number) => {
    return THAI_MONTHS.find(item => item.value === m)?.label || m;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to export tables to Excel on client-side
  const handleExportXLS = (elementId: string, filename: string) => {
    const table = document.getElementById(elementId);
    if (!table) return;

    // Excel formatting meta tags
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Sheet1</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th { background-color: #f3f4f6; border: 1px solid #d1d5db; font-weight: bold; }
          td { border: 1px solid #e5e7eb; padding: 5px; }
        </style>
      </head>
      <body>
        ${table.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // CALCULATIONS & RENDERERS FOR EACH REPORT TYPE
  // -------------------------------------------------------------

  // === REPORT 1: บัญชีรายรับ - บัญชีรายจ่าย (เงินสด) ===
  const renderReport1 = () => {
    // Filter cash transactions
    // cash_in, cash_out, bank_deposit, bank_withdraw
    let r1Transactions = transactions.filter(tx => 
      tx.type === "cash_in" || 
      tx.type === "cash_out" || 
      tx.type === "bank_deposit" || 
      tx.type === "bank_withdraw"
    );

    // Apply month filter
    if (r1Month !== "all") {
      const monthNum = parseInt(r1Month);
      r1Transactions = r1Transactions.filter(tx => tx.month === monthNum);
    }
    // Apply year filter
    r1Transactions = r1Transactions.filter(tx => tx.year === r1Year);

    // Apply code filter
    if (r1Code !== "all") {
      r1Transactions = r1Transactions.filter(tx => tx.code === r1Code);
    }

    // Sort chronologically (by day)
    r1Transactions.sort((a, b) => a.day - b.day);

    // Calculate totals and running cash balance
    // Running balance starts at 0 or is calculated sequentially
    let totalIn = 0;
    let totalOut = 0;
    
    // Calculate initial running balance for transactions before the selected month if we are filtering by month
    let previousBalance = 0;
    if (r1Month !== "all") {
      const currentMonthInt = parseInt(r1Month);
      const priorTransactions = transactions.filter(tx => 
        (tx.type === "cash_in" || tx.type === "cash_out" || tx.type === "bank_deposit" || tx.type === "bank_withdraw") &&
        tx.year === r1Year && tx.month < currentMonthInt
      );
      previousBalance = priorTransactions.reduce((acc, tx) => {
        if (tx.type === "cash_in" || tx.type === "bank_withdraw") return acc + tx.amount;
        if (tx.type === "cash_out" || tx.type === "bank_deposit") return acc - tx.amount;
        return acc;
      }, 0);
    }

    let runningCash = previousBalance;

    const tableRows = r1Transactions.map(tx => {
      const isIncoming = tx.type === "cash_in" || tx.type === "bank_withdraw";
      const incomingAmount = isIncoming ? tx.amount : 0;
      const outgoingAmount = !isIncoming ? tx.amount : 0;

      totalIn += incomingAmount;
      totalOut += outgoingAmount;
      runningCash = runningCash + incomingAmount - outgoingAmount;

      return {
        ...tx,
        incomingAmount,
        outgoingAmount,
        currentRunning: runningCash
      };
    });

    return (
      <div className="space-y-6">
        
        {/* Filters Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm no-print space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>กรองช่วงเวลาและข้อมูลสำหรับรายงานแบบที่ 1</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">เลือกเดือน</label>
              <select
                value={r1Month}
                onChange={(e) => setR1Month(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 bg-white font-medium"
              >
                <option value="all">ทั้งหมด (ทั้งปี)</option>
                {THAI_MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">เลือกปี พ.ศ.</label>
              <input
                type="number"
                value={r1Year}
                onChange={(e) => setR1Year(parseInt(e.target.value) || 2569)}
                className="w-full rounded-xl border border-gray-200 p-2.5 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">กรองตามรหัส</label>
              <select
                value={r1Code}
                onChange={(e) => setR1Code(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 bg-white font-medium"
              >
                <option value="all">ทั้งหมด</option>
                <optgroup label="รหัสรายรับ">
                  {INCOME_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.code} - ถอนเงินสดจากบัญชี {b.accountName}</option>
                  ))}
                </optgroup>
                <optgroup label="รหัสรายจ่าย">
                  {EXPENSE_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.code} - นำเงินฝากบัญชี {b.accountName}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              onClick={() => handleExportXLS("report-1-print-area", `รายงานเงินสด_แบบที่1_พศ_${r1Year}`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>ส่งออกเป็น Excel (XLS)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>พิมพ์รายงาน (Print / PDF)</span>
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm print-container" id="report-1-print-area">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-bold text-gray-900 font-sans">แบบที่ 1 บัญชีรายรับ - บัญชีรายจ่าย</h2>
            <h3 className="text-base font-bold text-gray-800">{templeInfo.name}</h3>
            <p className="text-xs text-gray-500 font-medium">{templeInfo.address}</p>
            <p className="text-sm font-semibold text-gray-700">
              ประจำเดือน {r1Month === "all" ? "ทั้งหมด" : getThaiMonthLabel(parseInt(r1Month))} ปี พ.ศ. {r1Year}
            </p>
          </div>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-300">
                <th className="border border-gray-300 py-2.5 px-3 text-center w-24">วันที่</th>
                <th className="border border-gray-300 py-2.5 px-3 text-center w-28">เลขที่เอกสาร</th>
                <th className="border border-gray-300 py-2.5 px-3 text-left">รายการ</th>
                <th className="border border-gray-300 py-2.5 px-3 text-center w-16">รหัส</th>
                <th className="border border-gray-300 py-2.5 px-3 text-right w-32">รายรับ (เงินสด)</th>
                <th className="border border-gray-300 py-2.5 px-3 text-right w-32">รายจ่าย (เงินสด)</th>
                <th className="border border-gray-300 py-2.5 px-3 text-right w-32">คงเหลือเงินสดในมือ</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 font-sans">
              
              {/* Row for Brought Forward Balance if filtered by Month */}
              {r1Month !== "all" && (
                <tr className="bg-gray-50 font-semibold italic text-xs">
                  <td className="border border-gray-300 py-2 px-3 text-center">-</td>
                  <td className="border border-gray-300 py-2 px-3 text-center">-</td>
                  <td className="border border-gray-300 py-2 px-3 text-left">ยอดยกมาจากปีก่อน / เดือนก่อน</td>
                  <td className="border border-gray-300 py-2 px-3 text-center">-</td>
                  <td className="border border-gray-300 py-2 px-3 text-right">-</td>
                  <td className="border border-gray-300 py-2 px-3 text-right">-</td>
                  <td className="border border-gray-300 py-2 px-3 text-right">{formatCurrency(previousBalance)}</td>
                </tr>
              )}

              {tableRows.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/40">
                  <td className="border border-gray-300 py-2 px-3 text-center font-mono text-xs">
                    {tx.day}/{tx.month}/{tx.year}
                  </td>
                  <td className="border border-gray-300 py-2 px-3 text-center font-mono text-xs text-gray-500">
                    {tx.documentNo}
                  </td>
                  <td className="border border-gray-300 py-2 px-3 text-left">
                    <div>{tx.description}</div>
                    {tx.type === "bank_withdraw" && (
                      <span className="text-[10px] text-amber-600 block leading-tight no-print">
                        (เบิกถอนเงินฝากออกมาถือเป็นเงินสด)
                      </span>
                    )}
                    {tx.type === "bank_deposit" && (
                      <span className="text-[10px] text-blue-600 block leading-tight no-print">
                        (นำฝากเงินสดเข้าเก็บในธนาคาร)
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 py-2 px-3 text-center font-mono text-xs font-bold text-blue-700">
                    {tx.code}
                  </td>
                  <td className="border border-gray-300 py-2 px-3 text-right font-mono font-bold text-emerald-700">
                    {tx.incomingAmount > 0 ? formatCurrency(tx.incomingAmount) : "-"}
                  </td>
                  <td className="border border-gray-300 py-2 px-3 text-right font-mono font-bold text-rose-700">
                    {tx.outgoingAmount > 0 ? formatCurrency(tx.outgoingAmount) : "-"}
                  </td>
                  <td className="border border-gray-300 py-2 px-3 text-right font-mono font-bold">
                    {formatCurrency(tx.currentRunning)}
                  </td>
                </tr>
              ))}

              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="border border-gray-300 py-8 text-center text-gray-400 text-xs">
                    ไม่พบรายการบันทึกเงินสดในช่วงเวลาที่เลือก
                  </td>
                </tr>
              )}

              {/* Subtotal Row */}
              <tr className="bg-gray-100/70 font-bold border-t-2 border-gray-400">
                <td className="border border-gray-300 py-2.5 px-3 text-center" colSpan={3}>
                  รวมประจำรอบระยะเวลารายงานนี้
                </td>
                <td className="border border-gray-300 py-2.5 px-3 text-center">-</td>
                <td className="border border-gray-300 py-2.5 px-3 text-right font-mono text-emerald-800">
                  {formatCurrency(totalIn)}
                </td>
                <td className="border border-gray-300 py-2.5 px-3 text-right font-mono text-rose-800">
                  {formatCurrency(totalOut)}
                </td>
                <td className="border border-gray-300 py-2.5 px-3 text-right font-mono bg-blue-50/50">
                  {formatCurrency(runningCash)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signature Sections (Officially Compliant) */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 font-sans text-sm" id="report1-signatures">
            <div className="flex flex-col items-center text-center space-y-6">
              <p>ลงชื่อ...................................................... ผู้จัดทำบัญชี</p>
              <div className="space-y-0.5">
                <p className="font-semibold">({templeInfo.accountantName})</p>
                <p className="text-xs text-gray-500">ไวยาวัจกร / ผู้ได้รับมอบหมาย</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <p>ลงชื่อ...................................................... ผู้ตรวจสอบบัญชี</p>
              <div className="space-y-0.5">
                <p className="font-semibold">({templeInfo.abbotName})</p>
                <p className="text-xs text-gray-500">เจ้าอาวาส{templeInfo.name}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // === REPORT 2: บัญชีรายรับ-รายจ่าย (เงินฝากธนาคาร) ===
  const renderReport2 = () => {
    const selectedBank = bankAccounts.find(b => b.id === r2BankId);

    // Filter transactions involving this specific bank account
    // bank_deposit, bank_withdraw, direct_bank_in, direct_bank_out
    let r2Transactions = transactions.filter(tx => tx.bankAccountId === r2BankId);

    // Apply Year Filter
    r2Transactions = r2Transactions.filter(tx => tx.year === r2Year);

    // Sort chronologically (by day/month)
    r2Transactions.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

    // We can also calculate chronological prior balance
    // But since this is a demo, let's treat selectedBank.initialBalance as base and accumulate chronologically
    let runningBalance = selectedBank ? selectedBank.initialBalance : 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    const reportRows = r2Transactions.map(tx => {
      const isDeposit = tx.type === "bank_deposit" || tx.type === "direct_bank_in";
      const depositAmount = isDeposit ? tx.amount : 0;
      const withdrawAmount = !isDeposit ? tx.amount : 0;

      totalDeposits += depositAmount;
      totalWithdrawals += withdrawAmount;
      runningBalance = runningBalance + depositAmount - withdrawAmount;

      return {
        ...tx,
        depositAmount,
        withdrawAmount,
        currentRunning: runningBalance
      };
    });

    return (
      <div className="space-y-6">
        
        {/* Filters Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm no-print space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-500" />
            <span>กรองข้อมูลสำหรับรายงานบัญชีเงินฝากธนาคาร</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">เลือกบัญชีธนาคาร</label>
              <select
                value={r2BankId}
                onChange={(e) => setR2BankId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 bg-white font-medium"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>{b.code} - {b.accountName} ({b.accountNo})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">ปี พ.ศ.</label>
              <input
                type="number"
                value={r2Year}
                onChange={(e) => setR2Year(parseInt(e.target.value) || 2569)}
                className="w-full rounded-xl border border-gray-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              onClick={() => handleExportXLS("report-2-print-area", `รายงานบัญชีธนาคาร_${selectedBank?.code}_พศ_${r2Year}`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>ส่งออกเป็น Excel (XLS)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>พิมพ์รายงาน (Print / PDF)</span>
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm print-container" id="report-2-print-area">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-bold text-gray-900 font-sans">แบบที่ 2 รายงานบัญชีรายรับ-รายจ่าย (เงินฝากธนาคาร)</h2>
            <h3 className="text-base font-bold text-gray-800">{templeInfo.name}</h3>
            <p className="text-xs text-gray-500 font-medium">{templeInfo.address}</p>
            {selectedBank && (
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 max-w-lg mx-auto space-y-0.5 text-xs text-gray-700 mt-3 font-semibold font-sans">
                <p>ธนาคาร: {selectedBank.bankName} | รหัสบัญชี: {selectedBank.code}</p>
                <p>ชื่อบัญชี: {selectedBank.accountName} | เลขที่บัญชี: {selectedBank.accountNo}</p>
                <p className="text-gray-900">ประจำปี พ.ศ. {r2Year}</p>
              </div>
            )}
          </div>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-300">
                <th className="border border-gray-300 py-3 px-3 text-center w-24" rowSpan={2}>วันที่</th>
                <th className="border border-gray-300 py-2 px-3 text-center" colSpan={3}>รายการฝาก (Inflow)</th>
                <th className="border border-gray-300 py-2 px-3 text-center" colSpan={3}>รายการถอน (Outflow)</th>
                <th className="border border-gray-300 py-3 px-3 text-right w-32" rowSpan={2}>ยอดเงินคงเหลือ</th>
              </tr>
              <tr className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-300">
                <th className="border border-gray-300 py-1.5 px-2 text-left">รายการฝาก</th>
                <th className="border border-gray-300 py-1.5 px-2 text-center w-20">เลขที่เอกสาร</th>
                <th className="border border-gray-300 py-1.5 px-2 text-right w-24">จำนวนเงิน</th>
                <th className="border border-gray-300 py-1.5 px-2 text-left">รายการถอน</th>
                <th className="border border-gray-300 py-1.5 px-2 text-center w-20">เลขที่เอกสาร</th>
                <th className="border border-gray-300 py-1.5 px-2 text-right w-24">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="text-gray-800 font-sans">
              
              {/* Row 1: ยอดคงเหลือยกมาจากเดือนก่อน/ปีงบประมาณก่อน */}
              <tr className="bg-gray-50 font-semibold italic text-xs">
                <td className="border border-gray-300 py-2 px-3 text-center">-</td>
                <td className="border border-gray-300 py-2 px-3 text-left">ยอดคงเหลือยกมาจากเดือนก่อน / ปีก่อน</td>
                <td className="border border-gray-300 py-2 px-3 text-center">-</td>
                <td className="border border-gray-300 py-2 px-3 text-right font-mono">
                  {selectedBank ? formatCurrency(selectedBank.initialBalance) : "0.00"}
                </td>
                <td className="border border-gray-300 py-2 px-3 text-left">-</td>
                <td className="border border-gray-300 py-2 px-3 text-center">-</td>
                <td className="border border-gray-300 py-2 px-3 text-right font-mono">-</td>
                <td className="border border-gray-300 py-2 px-3 text-right font-mono">
                  {selectedBank ? formatCurrency(selectedBank.initialBalance) : "0.00"}
                </td>
              </tr>

              {reportRows.map((tx) => {
                const isDeposit = tx.depositAmount > 0;
                return (
                  <tr key={tx.id} className="hover:bg-gray-50/40 text-xs">
                    <td className="border border-gray-300 py-2 px-3 text-center font-mono">
                      {tx.day} {getThaiMonthLabel(tx.month)}
                    </td>
                    
                    {/* Deposits columns */}
                    <td className="border border-gray-300 py-2 px-2 text-left">
                      {isDeposit ? tx.description : "-"}
                    </td>
                    <td className="border border-gray-300 py-2 px-2 text-center font-mono text-[10px] text-gray-500">
                      {isDeposit ? tx.documentNo : "-"}
                    </td>
                    <td className="border border-gray-300 py-2 px-2 text-right font-mono font-semibold text-emerald-700">
                      {isDeposit ? formatCurrency(tx.amount) : "-"}
                    </td>

                    {/* Withdrawals columns */}
                    <td className="border border-gray-300 py-2 px-2 text-left">
                      {!isDeposit ? tx.description : "-"}
                    </td>
                    <td className="border border-gray-300 py-2 px-2 text-center font-mono text-[10px] text-gray-500">
                      {!isDeposit ? tx.documentNo : "-"}
                    </td>
                    <td className="border border-gray-300 py-2 px-2 text-right font-mono font-semibold text-rose-700">
                      {!isDeposit ? formatCurrency(tx.amount) : "-"}
                    </td>

                    {/* Running balance */}
                    <td className="border border-gray-300 py-2 px-3 text-right font-mono font-bold">
                      {formatCurrency(tx.currentRunning)}
                    </td>
                  </tr>
                );
              })}

              {reportRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="border border-gray-300 py-8 text-center text-gray-400 text-xs">
                    ไม่พบข้อมูลธุรกรรมผ่านทางบัญชีธนาคารนี้ในปี พ.ศ. {r2Year}
                  </td>
                </tr>
              )}

              {/* Subtotal Row */}
              <tr className="bg-gray-100/70 font-bold border-t border-gray-400 text-xs">
                <td className="border border-gray-300 py-2.5 px-3 text-center" colSpan={2}>
                  รวมประจำปี พ.ศ. {r2Year}
                </td>
                <td className="border border-gray-300 py-2.5 px-2 text-center">รวมฝาก</td>
                <td className="border border-gray-300 py-2.5 px-2 text-right font-mono text-emerald-800">
                  {formatCurrency(totalDeposits)}
                </td>
                <td className="border border-gray-300 py-2.5 px-2 text-center">รวมถอน</td>
                <td className="border border-gray-300 py-2.5 px-2 text-center">-</td>
                <td className="border border-gray-300 py-2.5 px-2 text-right font-mono text-rose-800">
                  {formatCurrency(totalWithdrawals)}
                </td>
                <td className="border border-gray-300 py-2.5 px-3 text-right font-mono bg-blue-50">
                  {formatCurrency(runningBalance)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signature Sections */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 font-sans text-sm" id="report2-signatures">
            <div className="flex flex-col items-center text-center space-y-6">
              <p>ลงชื่อ...................................................... ผู้จัดทำบัญชี</p>
              <div className="space-y-0.5">
                <p className="font-semibold">({templeInfo.accountantName})</p>
                <p className="text-xs text-gray-500">ไวยาวัจกร / ผู้ตรวจสอบการเงิน</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <p>ลงชื่อ...................................................... ผู้ตรวจสอบบัญชี</p>
              <div className="space-y-0.5">
                <p className="font-semibold">({templeInfo.abbotName})</p>
                <p className="text-xs text-gray-500">เจ้าอาวาส{templeInfo.name}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // === REPORT 3: รายงานเงินคงเหลือของวัด (แบบที่ 3) ===
  const renderReport3 = () => {
    // We need to calculate:
    // 1. Cash Remaining
    // 2. Dynamic Bank balances
    // 3. Grand Total
    // Optionally filters by year / month

    // Filter transaction array based on dates
    const filterTxByR3 = (tx: Transaction) => {
      let match = true;
      if (r3Month !== "all") {
        match = match && tx.month === parseInt(r3Month);
      }
      match = match && tx.year === r3Year;
      return match;
    };

    const r3Tx = transactions.filter(filterTxByR3);

    // Calculate Cash remaining for this context
    const cashRemaining = r3Tx.reduce((acc, tx) => {
      if (tx.type === "cash_in") return acc + tx.amount;
      if (tx.type === "cash_out") return acc - tx.amount;
      if (tx.type === "bank_deposit") return acc - tx.amount;
      if (tx.type === "bank_withdraw") return acc + tx.amount;
      return acc;
    }, 0);

    // Calculate details for each bank account
    const calculatedBankDetails = bankAccounts.map(bank => {
      const bankTx = r3Tx.filter(tx => tx.bankAccountId === bank.id);
      const changes = bankTx.reduce((acc, tx) => {
        if (tx.type === "bank_deposit" || tx.type === "direct_bank_in") return acc + tx.amount;
        if (tx.type === "bank_withdraw" || tx.type === "direct_bank_out") return acc - tx.amount;
        return acc;
      }, 0);
      return {
        ...bank,
        balance: bank.initialBalance + changes
      };
    });

    const bankRemainingSum = calculatedBankDetails.reduce((acc, b) => acc + b.balance, 0);
    const grandTotal = cashRemaining + bankRemainingSum;

    return (
      <div className="space-y-6">
        
        {/* Filters Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm no-print space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Coins className="h-4 w-4 text-purple-500" />
            <span>ตัวเลือกกรองรายงานสรุปเงินคงเหลือวัด</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">เลือกเดือน</label>
              <select
                value={r3Month}
                onChange={(e) => setR3Month(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 bg-white font-medium"
              >
                <option value="all">ทั้งปี (รวม 12 เดือน)</option>
                {THAI_MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">ปี พ.ศ.</label>
              <input
                type="number"
                value={r3Year}
                onChange={(e) => setR3Year(parseInt(e.target.value) || 2569)}
                className="w-full rounded-xl border border-gray-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              onClick={() => handleExportXLS("report-3-print-area", `รายงานเงินคงเหลือวัด_แบบที่3_พศ_${r3Year}`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>ส่งออกเป็น Excel (XLS)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>พิมพ์รายงาน (Print / PDF)</span>
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm print-container" id="report-3-print-area">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-bold text-gray-900 font-sans">รายงานเงินคงเหลือของวัด</h2>
            <h3 className="text-base font-bold text-gray-800">{templeInfo.name}</h3>
            <p className="text-xs text-gray-500 font-medium">{templeInfo.address}</p>
            <p className="text-sm font-semibold text-gray-700">
              ณ สิ้น{r3Month === "all" ? "ปี" : `เดือน ${getThaiMonthLabel(parseInt(r3Month))}`} พ.ศ. {r3Year}
            </p>
          </div>

          {/* Cards summary within report */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm">
            <div className="border border-emerald-100 bg-emerald-50/50 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1 text-xs">
                  <CoinsIcon className="h-4 w-4" /> เงินสดคงเหลือ
                </span>
                <p className="text-xs text-gray-500">จำนวนเงินสดคงเหลือถืออยู่ในมือวัด</p>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-4 font-mono">
                {formatCurrency(cashRemaining)}
              </p>
            </div>
            <div className="border border-blue-100 bg-blue-50/50 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="font-bold text-blue-800 flex items-center gap-1.5 mb-1 text-xs">
                  <Landmark className="h-4 w-4" /> เงินฝากธนาคารคงเหลือ
                </span>
                <p className="text-xs text-gray-500">ยอดเงินรวมทุกสมุดบัญชีธนาคาร</p>
              </div>
              <p className="text-2xl font-black text-blue-700 mt-4 font-mono">
                {formatCurrency(bankRemainingSum)}
              </p>
            </div>
          </div>

          {/* Detailed Bank balance listing */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2">รายละเอียดบัญชีธนาคาร</h4>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold text-xs border-b border-gray-300">
                  <th className="border border-gray-300 py-2 px-3 text-center w-24">รหัสบัญชี</th>
                  <th className="border border-gray-300 py-2 px-3 text-left">ธนาคาร</th>
                  <th className="border border-gray-300 py-2 px-3 text-left">ชื่อบัญชีเงินฝาก</th>
                  <th className="border border-gray-300 py-2 px-3 text-center w-36">เลขที่บัญชี</th>
                  <th className="border border-gray-300 py-2 px-3 text-right w-36">จำนวนเงินคงเหลือ</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 text-xs">
                {calculatedBankDetails.map(bank => (
                  <tr key={bank.id} className="hover:bg-gray-50/30">
                    <td className="border border-gray-300 py-2 px-3 text-center font-mono font-bold text-blue-700">{bank.code}</td>
                    <td className="border border-gray-300 py-2 px-3">{bank.bankName}</td>
                    <td className="border border-gray-300 py-2 px-3 font-semibold">{bank.accountName}</td>
                    <td className="border border-gray-300 py-2 px-3 text-center font-mono text-gray-500">{bank.accountNo}</td>
                    <td className="border border-gray-300 py-2 px-3 text-right font-mono font-bold text-gray-900">
                      {formatCurrency(bank.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Golden Grand Total summary panel */}
          <div className="mt-8 bg-sky-50 rounded-2xl p-6 border border-sky-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h4 className="font-extrabold text-sky-950 text-base">รวมเงินคงเหลือทั้งหมดของวัด</h4>
              <p className="text-xs text-sky-700 font-medium">รวมเงินสดในมือวัด ร่วมกับ เงินฝากทุกๆ บัญชีธนาคาร</p>
            </div>
            <p className="text-3xl font-black text-sky-950 font-mono">
              {formatCurrency(grandTotal)}
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 font-sans text-sm" id="report3-signatures">
            <div className="flex flex-col items-center text-center space-y-6">
              <p>ลงชื่อ...................................................... ผู้จัดทำบัญชี</p>
              <div className="space-y-0.5">
                <p className="font-semibold">({templeInfo.accountantName})</p>
                <p className="text-xs text-gray-500">ไวยาวัจกร / ผู้ได้รับมอบหมาย</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center space-y-6">
              <p>ลงชื่อ...................................................... ผู้ตรวจสอบบัญชี</p>
              <div className="space-y-0.5">
                <p className="font-semibold">({templeInfo.abbotName})</p>
                <p className="text-xs text-gray-500">เจ้าอาวาส{templeInfo.name}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="reports-component-root">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4 no-print" id="reports-top-header">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <FileText className="h-5 w-5 text-[#004899]" />
              <span>
                {reportType === "report1" && "แบบที่ 1 บัญชีรายรับ - รายจ่าย"}
                {reportType === "report2" && "แบบที่ 2 รายงานบัญชีรายรับ-รายจ่าย (เงินฝากธนาคาร)"}
                {reportType === "report3" && "แบบที่ 3 รายงานสรุปเงินคงเหลือวัด"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold">แบบรายงานมาตรฐานตามระเบียบสมาคมและมติมหาเถรสมาคม พศ.</p>
          </div>
        </div>
        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-gradient-to-r from-[#004899] to-sky-500 hover:opacity-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-100 cursor-pointer"
        >
          กลับหน้าหลัก
        </button>
      </div>

      {/* Report Render Choice */}
      {reportType === "report1" && renderReport1()}
      {reportType === "report2" && renderReport2()}
      {reportType === "report3" && renderReport3()}

    </div>
  );
}
