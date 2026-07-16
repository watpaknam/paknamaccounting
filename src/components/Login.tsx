import React, { useState } from "react";
import { BookOpen, Lock, User, AlertCircle } from "lucide-react";
import { INITIAL_USERS } from "../data";
import { UserAccount } from "../types";

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("krichabhak");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    // Simple demo auth timeout
    setTimeout(() => {
      setIsLoading(false);
      const savedUsers = localStorage.getItem("temple_users");
      const usersList: UserAccount[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
      
      const foundUser = usersList.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && 
               (u.password === password || (!u.password && password === "123456"))
      );

      if (foundUser) {
        onLoginSuccess(foundUser.username);
      } else {
        setError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8" id="login-container">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-200" id="login-card">
        
        <div className="text-center" id="login-header">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-[#004899] to-sky-400 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-100 text-white animate-bounce-short">
            <BookOpen className="h-9 w-9" />
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-[#004899] font-sans">
            ระบบบัญชีรายรับ-รายจ่ายของวัด
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            มาตรฐานสำนักงานพระพุทธศาสนาแห่งชาติ
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} id="login-form">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm" id="login-error">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md" id="login-fields">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                ชื่อผู้ใช้งาน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none sm:text-sm transition-all font-medium"
                  placeholder="ชื่อผู้ใช้งาน"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none sm:text-sm transition-all font-medium"
                  placeholder="รหัสผ่าน"
                />
              </div>
            </div>
          </div>

          <div id="login-button-container">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[#004899] to-sky-500 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all shadow-md shadow-sky-200 disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>

          <div className="text-center text-xs text-slate-400 mt-4" id="login-tip">
            <p>บัญชีทดสอบ: <span className="font-semibold text-slate-500">krichabhak</span> / รหัสผ่าน: <span className="font-semibold text-slate-500">123456</span></p>
            <p className="mt-1">หรือบัญชีผู้ใช้อื่นที่มีสิทธิ์ตามระบบที่คุณเพิ่มขึ้นใหม่</p>
          </div>
        </form>
      </div>
    </div>
  );
}
