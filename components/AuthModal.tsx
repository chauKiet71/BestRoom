"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  RotateCcw,
  User as UserIcon,
  X,
} from "lucide-react";
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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [credential, setCredential] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  if (!isOpen) return null;

  const isRegister = mode === "register";

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSimulatedCode(null);
  };

  const switchMode = (nextMode: "login" | "register" | "forgot" | "reset") => {
    resetFormState();
    setMode(nextMode);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!credential || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
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

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username || !email || !phone || !password) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin đăng ký.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg("Vui lòng đồng ý với điều khoản sử dụng và chính sách bảo mật.");
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

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetEmail) {
      setErrorMsg("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await authService.forgotPassword(resetEmail);
      if (data.code) setSimulatedCode(data.code);
      setSuccessMsg(data.message);
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

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setTimeout(() => switchMode("login"), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const heading =
    mode === "login"
      ? ["Đăng nhập tài khoản", "Vui lòng nhập thông tin để đăng nhập"]
      : mode === "register"
        ? ["", ""]
        : mode === "forgot"
          ? ["Khôi phục mật khẩu", "Nhập email để nhận mã xác nhận"]
          : ["Nhập mã xác nhận", "Tạo mật khẩu mới cho tài khoản"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-white/80 p-4 backdrop-blur-md">
      <div
        id="auth-modal-card"
        className={`relative grid w-full origin-center scale-75 overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(37,99,235,0.16)] ${
          isRegister ? "max-w-6xl md:grid-cols-[0.72fr_1fr]" : "max-w-5xl md:grid-cols-[0.86fr_1.14fr]"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-blue-950 shadow-[0_8px_22px_rgba(15,23,42,0.10)] transition hover:bg-blue-50"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <aside className={`relative hidden overflow-hidden bg-white md:block ${isRegister ? "min-h-[780px]" : "min-h-[700px] border-r border-blue-100 bg-gradient-to-b from-white to-blue-50"}`}>
          <div className={`relative z-10 flex h-full flex-col px-12 ${isRegister ? "items-start pb-14 pt-40 text-left" : "items-center pb-12 pt-44 text-center"}`}>
            <img src="/bestroom-logo.png" alt="BestRoom" className={isRegister ? "h-20 w-auto object-contain" : "h-20 w-auto object-contain"} />

            {isRegister ? (
              <>
                <h2 className="mt-12 text-4xl font-black text-blue-950">Tạo tài khoản mới</h2>
                <p className="mt-6 max-w-sm text-lg font-medium leading-8 text-slate-500">
                  Đăng ký tài khoản để tìm phòng dễ dàng và quản lý thông tin tiện lợi hơn.
                </p>
                <div className="mt-auto w-full">
                  <div className="relative h-80 w-full overflow-hidden rounded-3xl bg-blue-50">
                    <img src="/section_banner1.png" alt="Đăng ký BestRoom" className="h-full w-full object-cover object-left" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-14 text-3xl font-black text-blue-950">Chào mừng trở lại!</h2>
                <p className="mt-6 max-w-xs text-lg font-medium leading-8 text-slate-500">
                  Đăng nhập để tiếp tục tìm phòng và trải nghiệm dịch vụ tốt nhất.
                </p>
                <div className="mt-auto w-full">
                  <div className="relative mx-auto h-72 max-w-sm overflow-hidden rounded-3xl bg-blue-50">
                    <img src="/section_banner1.png" alt="BestRoom bảo mật" className="h-full w-full object-cover object-left" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-50 to-transparent" />
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        <section className={isRegister ? "px-6 py-16 sm:px-12 md:px-16" : "px-6 py-20 sm:px-12 md:px-16"}>
          <div className={isRegister ? "mx-auto max-w-xl" : "mx-auto max-w-md"}>
            {!isRegister && (
              <div className="mb-10">
                <h2 className="text-3xl font-black text-blue-950">{heading[0]}</h2>
                <p className="mt-4 text-lg font-medium text-slate-500">{heading[1]}</p>
              </div>
            )}

            {simulatedCode && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Mã xác thực khôi phục mật khẩu
                </div>
                <p className="mt-2">Mã bảo mật: <strong className="font-mono text-base">{simulatedCode}</strong></p>
              </div>
            )}

            {errorMsg && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
                <strong>Lỗi:</strong> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-5 flex gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}

            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-7">
                <div>
                  <label className="mb-3 block text-base font-black text-blue-950">Email hoặc số điện thoại</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Nhập email hoặc số điện thoại"
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-base font-medium text-blue-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-base font-black text-blue-950">Mật khẩu</label>
                    <button type="button" onClick={() => switchMode("forgot")} className="text-base font-bold text-blue-600 hover:text-blue-800">
                      Quên mật khẩu?
                    </button>
                  </div>
                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    placeholder="Nhập mật khẩu"
                    show={showPassword}
                    onToggle={() => setShowPassword((value) => !value)}
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-base font-medium text-blue-950">
                  <span className={`grid h-6 w-6 place-items-center rounded-md ${remember ? "bg-blue-600 text-white" : "border border-slate-300 bg-white"}`}>
                    {remember && <Check className="h-4 w-4" />}
                  </span>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="sr-only" />
                  Ghi nhớ đăng nhập
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-16 w-full items-center justify-center gap-4 rounded-2xl bg-blue-600 text-lg font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 disabled:bg-slate-300"
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                  <ArrowRight className="h-7 w-7" />
                </button>

                <div className="flex items-center gap-6 pt-1 text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-base font-medium">Hoặc</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <p className="text-center text-base font-medium text-blue-950">
                  Chưa có tài khoản?
                  <button type="button" onClick={() => switchMode("register")} className="ml-3 font-black text-blue-600 hover:text-blue-800">
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            )}

            {mode === "register" && (
              <form onSubmit={handleRegister} className="space-y-5">
                <RegisterField icon={UserIcon} label="Tên đăng nhập" value={username} onChange={setUsername} placeholder="Nhập tên đăng nhập của bạn" />
                <RegisterField icon={Phone} label="Số điện thoại" value={phone} onChange={setPhone} placeholder="Nhập số điện thoại" type="tel" helper="Dùng để xác thực và liên hệ khi cần thiết" />
                <RegisterField icon={Mail} label="Email" value={email} onChange={setEmail} placeholder="Nhập địa chỉ email" type="email" helper="Dùng để nhận thông báo và khôi phục tài khoản" />
                <div>
                  <label className="mb-3 block text-base font-black text-blue-950">Mật khẩu</label>
                  <PasswordField value={password} onChange={setPassword} placeholder="Nhập mật khẩu" show={showPassword} onToggle={() => setShowPassword((value) => !value)} />
                  <p className="mt-2 text-sm font-medium text-slate-400">Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số</p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 pt-2 text-base font-medium leading-7 text-blue-950">
                  <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md ${acceptedTerms ? "bg-blue-600 text-white" : "border border-slate-300 bg-white"}`}>
                    {acceptedTerms && <Check className="h-4 w-4" />}
                  </span>
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="sr-only" />
                  <span>
                    Tôi đã đọc và đồng ý với <span className="font-medium text-blue-600">Điều khoản sử dụng</span>
                    <br />
                    và <span className="font-medium text-blue-600">Chính sách bảo mật</span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-16 w-full items-center justify-center gap-4 rounded-2xl bg-blue-600 text-lg font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 disabled:bg-slate-300"
                >
                  {loading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
                  <ArrowRight className="h-7 w-7" />
                </button>

                <p className="pt-4 text-center text-base font-medium text-blue-950">
                  Đã có tài khoản?
                  <button type="button" onClick={() => switchMode("login")} className="ml-3 font-black text-blue-600 hover:text-blue-800">
                    Đăng nhập
                  </button>
                </p>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <RegisterField icon={Mail} label="Email khôi phục" value={resetEmail} onChange={setResetEmail} placeholder="Nhập email của bạn" type="email" />
                <PrimaryButton loading={loading} text="Gửi mã xác nhận" loadingText="Đang gửi..." icon={RotateCcw} />
                <button type="button" onClick={() => switchMode("login")} className="w-full text-center text-base font-black text-slate-500 hover:text-blue-600">
                  Quay lại đăng nhập
                </button>
              </form>
            )}

            {mode === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
                  Tài khoản: <strong className="font-mono">{resetEmail}</strong>
                </div>
                <RegisterField label="Mã bảo mật" value={otpCode} onChange={setOtpCode} placeholder="Nhập mã 6 số" maxLength={6} />
                <RegisterField icon={Lock} label="Mật khẩu mới" value={newPassword} onChange={setNewPassword} placeholder="Nhập mật khẩu mới" type="password" />
                <PrimaryButton loading={loading} text="Xác nhận đặt lại mật khẩu" loadingText="Đang đặt lại..." />
                <button type="button" onClick={() => switchMode("login")} className="w-full text-center text-base font-black text-slate-500 hover:text-blue-600">
                  Hủy và quay lại đăng nhập
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function RegisterField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  helper,
  type = "text",
  maxLength,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helper?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-3 block text-base font-black text-blue-950">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
        <input
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className={`h-16 w-full rounded-2xl border border-slate-200 bg-white pr-5 text-base font-medium text-blue-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${Icon ? "pl-14" : "pl-5"}`}
        />
      </div>
      {helper && <p className="mt-2 text-sm font-medium text-slate-400">{helper}</p>}
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Lock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-14 text-base font-medium text-blue-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
      <button type="button" onClick={onToggle} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

function PrimaryButton({
  loading,
  text,
  loadingText,
  icon: Icon = ArrowRight,
}: {
  loading: boolean;
  text: string;
  loadingText: string;
  icon?: React.ElementType;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.20)] transition hover:bg-blue-700 disabled:bg-slate-300"
    >
      {loading ? loadingText : text}
      <Icon className="h-5 w-5" />
    </button>
  );
}
