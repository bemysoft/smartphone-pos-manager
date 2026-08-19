import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Smartphone, 
  UserCheck, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Building2, 
  PlusCircle, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Mail,
  User,
  Phone,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Shield,
  Zap,
  Store
} from "lucide-react";
import { Employee, UserRole } from "../types";
import { useLanguage, LanguageSwitchButton } from "../contexts/LanguageContext";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  employees: Employee[];
  loggedOutReason?: string | null;
  onBackToLanding?: () => void;
}

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  subscriptionPlan: string;
}

export default function Login({ onLoginSuccess, employees, loggedOutReason, onBackToLanding }: LoginProps) {
  const { t } = useLanguage();
  // View Modes: "LOGIN" | "REGISTER" | "FORGOT_PASSWORD"
  const [viewMode, setViewMode] = useState<"LOGIN" | "REGISTER" | "FORGOT_PASSWORD">("LOGIN");

  // State
  const [tenantList, setTenantList] = useState<TenantItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    return localStorage.getItem("tenantId") || "default";
  });

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Tenant Registration form state
  const [regStoreName, setRegStoreName] = useState("");
  const [regSlug, setRegSlug] = useState("");
  const [regOwnerName, setRegOwnerName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPlan, setRegPlan] = useState<"STARTER" | "PRO" | "ENTERPRISE">("PRO");
  const [regSuccessMsg, setRegSuccessMsg] = useState("");

  // Forgot Password state
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpStep, setFpStep] = useState<"REQUEST_OTP" | "ENTER_OTP">("REQUEST_OTP");
  const [fpSuccessMsg, setFpSuccessMsg] = useState("");
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await apiFetch("/api/tenants");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTenantList(data);
        }
      }
    } catch (e) {
      console.warn("Could not fetch tenant list:", e);
    }
  };

  const handleStoreNameChange = (val: string) => {
    setRegStoreName(val);
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setRegSlug(slug);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Masukkan email atau username akun Anda.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      localStorage.setItem("tenantId", selectedTenantId);

      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password || "any" 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.token) {
            localStorage.setItem("authToken", data.token);
          }
          if (data.user?.tenantId) {
            localStorage.setItem("tenantId", data.user.tenantId);
          }
          onLoginSuccess(data.user);
          setLoading(false);
          return;
        } else {
          setError(data.message || "Username atau kata sandi tidak sesuai.");
          setLoading(false);
          return;
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Email/Username atau Kata Sandi salah.");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend API unavailable, attempting client fallback login:", err);
    }

    // Client fallback login
    const lower = username.toLowerCase().trim();
    const foundEmp = employees.find(e => e.username?.toLowerCase() === lower || e.email?.toLowerCase() === lower);
    const fallbackUser = foundEmp || {
      id: `EMP-${Date.now()}`,
      username: lower,
      name: lower === "admin" ? "Super Admin" : username.trim(),
      role: lower === "admin" ? UserRole.ADMIN : lower === "manager1" ? UserRole.MANAGER : UserRole.CASHIER,
      email: lower.includes("@") ? lower : `${lower}@nexuspos.local`,
      tenantId: selectedTenantId
    };

    localStorage.setItem("tenantId", selectedTenantId);
    onLoginSuccess(fallbackUser);
    setLoading(false);
  };

  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regStoreName.trim() || !regSlug.trim() || !regOwnerName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError("Harap lengkapi semua kolom pendaftaran.");
      return;
    }

    setLoading(true);
    setError("");
    setRegSuccessMsg("");

    try {
      const response = await apiFetch("/api/tenants/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regStoreName.trim(),
          slug: regSlug.trim(),
          ownerName: regOwnerName.trim(),
          ownerEmail: regEmail.trim(),
          phone: regPhone.trim() || "-",
          password: regPassword,
          plan: regPlan
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
        localStorage.setItem("tenantId", regSlug.trim());
        setRegSuccessMsg(`Toko '${regStoreName}' berhasil didaftarkan! Mengalihkan ke sistem...`);
        
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200);
      } else {
        setError(data.message || "Gagal mendaftarkan toko. Silakan coba lagi.");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Terjadi kendala jaringan saat mendaftar: " + err.message);
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail.trim()) {
      setError("Masukkan alamat email yang terdaftar.");
      return;
    }

    setLoading(true);
    setError("");
    setFpSuccessMsg("");
    setDemoOtpHint(null);

    try {
      const response = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: fpEmail.trim(),
          tenantId: selectedTenantId
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFpStep("ENTER_OTP");
        setFpSuccessMsg(data.message || "Kode OTP 6-digit telah dikirim ke email Anda.");
        if (data.demoOtp) {
          setDemoOtpHint(data.demoOtp);
        }
      } else {
        setError(data.message || "Email tidak terdaftar pada sistem.");
      }
    } catch (err: any) {
      setError("Gagal meminta reset sandi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpOtp.trim() || !fpNewPassword.trim()) {
      setError("Masukkan kode OTP dan kata sandi baru.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fpEmail.trim(),
          otp: fpOtp.trim(),
          newPassword: fpNewPassword,
          tenantId: selectedTenantId
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFpSuccessMsg("Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.");
        setTimeout(() => {
          setViewMode("LOGIN");
          setFpStep("REQUEST_OTP");
          setPassword(fpNewPassword);
          setFpSuccessMsg("");
          setError("");
        }, 1800);
      } else {
        setError(data.message || "Kode OTP salah atau telah kedaluwarsa.");
      }
    } catch (err: any) {
      setError("Kesalahan reset sandi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-4 py-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Top Navbar: Back to Landing Page & Global Language Switcher */}
        <div className="flex justify-between items-center">
          {onBackToLanding ? (
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t("Kembali")}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <LanguageSwitchButton variant="pill" />
            <span className="text-[11px] font-medium text-slate-500 hidden sm:flex items-center gap-1">
              <Shield className="h-3 w-3 text-emerald-400" />
              SSL 256-Bit
            </span>
          </div>
        </div>

        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              NexusPOS <span className="text-blue-400">Cloud</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Platform Manajemen POS, Stok IMEI, & Servis Smartphone
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/50">
          
          {/* Status Alerts */}
          {loggedOutReason && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span className="leading-relaxed">{loggedOutReason}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 1: PURE SAAS LOGIN                     */}
          {/* ========================================== */}
          {viewMode === "LOGIN" && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-bold text-white">Masuk ke Akun Anda</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Masukkan email atau username untuk mengakses sistem toko Anda.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Bisnis atau Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="input-login-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin@tokosaya.com atau admin"
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("FORGOT_PASSWORD");
                        setError("");
                        setFpSuccessMsg("");
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer transition-colors"
                    >
                      Lupa Sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="input-login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 select-none">Ingat saya di perangkat ini</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Memverifikasi Sesi...
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Redirect */}
              <div className="mt-6 pt-5 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Belum memiliki akun toko?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("REGISTER");
                      setError("");
                    }}
                    className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer transition-colors"
                  >
                    Daftar Gratis 14 Hari
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: SAAS ONBOARDING (SIGN UP TOKO BARU) */}
          {/* ========================================== */}
          {viewMode === "REGISTER" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("LOGIN");
                    setError("");
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali ke Login
                </button>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Sparkles className="h-3 w-3" />
                  Trial 14 Hari
                </span>
              </div>

              <div className="mb-4">
                <h2 className="text-base font-bold text-white">Daftarkan Toko Baru</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mulai kelola inventori IMEI dan kasir toko smartphone Anda secara instan.
                </p>
              </div>

              {regSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{regSuccessMsg}</span>
                </div>
              )}

              <form className="space-y-3" onSubmit={handleRegisterTenant}>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Toko / Brand Usaha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Store className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regStoreName}
                      onChange={(e) => handleStoreNameChange(e.target.value)}
                      placeholder="Contoh: Sentral Phone Medan"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nama Pemilik / Admin
                    </label>
                    <input
                      type="text"
                      required
                      value={regOwnerName}
                      onChange={(e) => setRegOwnerName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Bisnis (Untuk Login)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="owner@tokosaya.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kata Sandi Akun
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Pilihan Paket Layanan
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "STARTER", name: "Starter", desc: "1 Cabang" },
                      { id: "PRO", name: "Pro", desc: "Multi-Outlet" },
                      { id: "ENTERPRISE", name: "Enterprise", desc: "Unlimited" }
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRegPlan(p.id as any)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          regPlan === p.id 
                            ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-xs" 
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Membuat Database Toko...
                    </>
                  ) : (
                    <>
                      <span>Mulai Coba Gratis 14 Hari</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  Sudah memiliki akun toko?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("LOGIN");
                      setError("");
                    }}
                    className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer transition-colors"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: FORGOT PASSWORD (RESET VIA OTP)     */}
          {/* ========================================== */}
          {viewMode === "FORGOT_PASSWORD" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("LOGIN");
                    setError("");
                    setFpSuccessMsg("");
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali ke Login
                </button>
                <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Pemulihan Akun
                </span>
              </div>

              <div className="mb-4">
                <h2 className="text-base font-bold text-white">Reset Kata Sandi</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {fpStep === "REQUEST_OTP" 
                    ? "Masukkan email terdaftar untuk menerima kode verifikasi OTP." 
                    : "Masukkan kode OTP 6-digit dan buat kata sandi baru Anda."}
                </p>
              </div>

              {fpSuccessMsg && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span>{fpSuccessMsg}</span>
                    {demoOtpHint && (
                      <div className="mt-1 text-[11px] text-amber-300 font-mono">
                        Kode OTP Demo: <strong>{demoOtpHint}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {fpStep === "REQUEST_OTP" ? (
                <form className="space-y-4" onSubmit={handleRequestOtp}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Terdaftar
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                        placeholder="nama@tokosaya.com"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Mengirim OTP...
                      </>
                    ) : (
                      "Kirim Kode Verifikasi"
                    )}
                  </button>
                </form>
              ) : (
                <form className="space-y-3.5" onSubmit={handleResetPassword}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kode OTP (6-Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-center text-base tracking-widest font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Menyimpan Sandi...
                      </>
                    ) : (
                      "Simpan Kata Sandi Baru"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
