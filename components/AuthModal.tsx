"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Phone, Shield, ArrowRight, CheckCircle, RotateCcw, AlertTriangle } from "lucide-react";
import { User } from "@/types";
import { authService } from "@/services/authService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: "login" | "register" | "forgot" | "reset";
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(initialMode);
  
  // Form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [credential, setCredential] = useState(""); // login with username or email
  
  // Forgot / Reset password fields
  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Clear states
  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSimulatedCode(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential || !password) {
      setErrorMsg("Vui lòng điền đầy đủ tài khoản và mật khẩu.");
      return;
    }
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await authService.login(credential, password);
      setSuccessMsg("Đăng nhập thành công!");
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !phone || !password) {
      setErrorMsg("Vui lòng điền đầy đủ các trường thông tin đăng ký.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await authService.register({ username, phone, email, password });
      setSuccessMsg("Đăng ký tài khoản thành công! Đang tự động đăng nhập...");
      setTimeout(() => {
        onAuthSuccess(data.user);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrorMsg("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await authService.forgotPassword(resetEmail);
      if (data.code) {
        setSimulatedCode(data.code);
      }
      setSuccessMsg(data.message);
      // Advance to reset password input screen
      setTimeout(() => {
        setMode("reset");
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) {
      setErrorMsg("Vui lòng nhập mã xác nhận và mật khẩu mới.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await authService.resetPassword({ email: resetEmail, code: otpCode, newPassword });
      setSuccessMsg("Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới.");
      setSimulatedCode(null);
      setTimeout(() => {
        setMode("login");
        resetFormState();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div id="auth-modal-card" className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col relative animate-fade-in">
        
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full bg-black/10 hover:bg-black/20 transition-all cursor-pointer border-none"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
            <Shield className="h-5 w-5 text-white" />
          </div>
          
          {mode === "login" && (
            <>
              <h2 className="text-xl font-black">Chào mừng trở lại!</h2>
              <p className="text-white/80 text-xs mt-1">Đăng nhập tài khoản để đặt phòng và đánh giá phòng trọ.</p>
            </>
          )}
          {mode === "register" && (
            <>
              <h2 className="text-xl font-black">Tạo tài khoản mới</h2>
              <p className="text-white/80 text-xs mt-1">Hãy đăng ký tài khoản nhanh chóng để kết nối nhà trọ an toàn.</p>
            </>
          )}
          {mode === "forgot" && (
            <>
              <h2 className="text-xl font-black">Khôi phục mật khẩu</h2>
              <p className="text-white/80 text-xs mt-1">Hệ thống sẽ gửi mã xác thực tới hòm thư đã đăng ký.</p>
            </>
          )}
          {mode === "reset" && (
            <>
              <h2 className="text-xl font-black font-mono">Nhập mã xác nhận</h2>
              <p className="text-white/80 text-xs mt-1">Kiểm tra thông tin mã bảo mật để hoàn tất đổi mật khẩu.</p>
            </>
          )}
        </div>

        {/* Dynamic code feedback visualizer for simulated sandbox */}
        {simulatedCode && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 text-amber-900 text-xs flex flex-col gap-1 select-all animate-bounce">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>[Dự phòng] Mã xác thực khôi phục mật khẩu:</span>
            </div>
            <p className="mt-0.5">Mã bảo mật nhận được: <strong className="bg-amber-100 px-2 py-0.5 rounded font-mono text-sm tracking-widest text-amber-950 font-black">{simulatedCode}</strong></p>
            <span className="text-[10px] text-amber-700/80">Nhấn sao chép hoặc ghi nhớ để nhập vào bước tiếp theo.</span>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-5">
          {/* Status notices */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-2xl text-xs font-medium border border-red-100 flex items-start gap-1.5 leading-normal">
              <span className="font-bold shrink-0">Lỗi:</span>
              <p className="flex-1">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold border border-emerald-100 flex items-start gap-2 leading-relaxed">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="flex-1">{successMsg}</p>
            </div>
          )}

          {/* Form blocks */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold text-xs">Tên đăng nhập hoặc Email</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên đăng nhập hoặc email..."
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 font-bold text-xs font-sans">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail("");
                      resetFormState();
                      setMode("forgot");
                    }}
                    className="text-blue-600 hover:text-blue-800 text-[11px] font-bold cursor-pointer bg-transparent border-none p-0"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all border-none"
              >
                {loading ? "Đang xử lý..." : "Đăng Nhập"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="pt-2 text-center text-xs text-gray-500">
                Chưa có tài khoản đăng ký?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setMode("register");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold ml-1 cursor-pointer bg-transparent border-none"
                >
                  Đăng ký ngay
                </button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold text-xs">Tên đăng nhập</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: hoainguyen123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold text-xs">Số điện thoại liên lạc</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Nhập số điện thoại di động..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold text-xs">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="ví dụ: user@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold text-xs">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Tối thiểu 6 ký tự để bảo mật..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all border-none"
              >
                {loading ? "Đang tạo tài khoản..." : "Đăng Ký Tài Khoản"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="pt-2 text-center text-xs text-gray-500">
                Đã có tài khoản tồn tại?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setMode("login");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold ml-1 cursor-pointer bg-transparent border-none"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold text-xs">Nhập Email tài khoản cần khôi phục</label>
                <p className="text-[10px] text-gray-400 leading-normal">Nhập địa chỉ email quý khách đã sử dụng để đăng ký BestRoom. Mã bảo mật khôi phục gồm 6 chữ số sẽ xuất hiện tương ứng trên màn hình.</p>
                <div className="relative pt-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="Nhập email của bạn..."
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none bg-white focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3.5 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 border-none"
              >
                {loading ? "Đang gởi..." : "Gửi Mã Xác Nhận Khôi Phục"}
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <div className="pt-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setMode("login");
                  }}
                  className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer bg-transparent border-none"
                >
                  Quay lại Đăng nhập
                </button>
              </div>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-[11px] text-blue-800 space-y-1">
                <p>Khôi phục mật khẩu tài khoản:</p>
                <strong className="font-mono block truncate">{resetEmail}</strong>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold text-xs">Mã bảo mật gồm 6 chữ số</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Nhập mã 6 chữ số nhận được..."
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center text-base tracking-widest font-mono py-2.5 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-black"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold text-xs">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu mới tối thiểu 6 ký tự..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg cursor-pointer transition-all border-none"
              >
                {loading ? "Đang tiến hành đặt lại..." : "Xác Nhận Đặt Lại Mật Khẩu"}
              </button>

              <div className="pt-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setMode("login");
                  }}
                  className="text-slate-500 hover:text-slate-800 font-extrabold cursor-pointer bg-transparent border-none"
                >
                  Hủy và Quay lại Đăng Nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
