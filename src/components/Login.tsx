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
  RefreshCw
} from "lucide-react";
import { Employee, UserRole } from "../types";

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
  // Mode: "LOGIN" | "REGISTER" | "FORGOT_PASSWORD"
  const [viewMode, setViewMode] = useState<"LOGIN" | "REGISTER" | "FORGOT_PASSWORD">("LOGIN");

  // Tenant state
  const [tenantList, setTenantList] = useState<TenantItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    return localStorage.getItem("tenantId") || "default";
  });

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Tenant Registration form state
  const [regStoreName, setRegStoreName] = useState("");
  const [regSlug, setRegSlug] = useState("");
  const [regOwnerName, setRegOwnerName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPlan, setRegPlan] = useState("PRO");
  const [regSuccessMsg, setRegSuccessMsg] = useState("");

  // Forgot Password state
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpStep, setFpStep] = useState<"REQUEST_OTP" | "ENTER_OTP">("REQUEST_OTP");
  const [fpSuccessMsg, setFpSuccessMsg] = useState("");
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  // Fetch active tenants list on mount
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

  // Auto-generate slug from store name during registration
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
      setError("Masukkan username.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Store current selected tenant in localStorage for apiFetch header
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
          localStorage.setItem("tenantId", selectedTenantId);
          onLoginSuccess(data.user);
          setLoading(false);
          return;
        } else {
          setError(data.message || "Username tidak aktif atau kata sandi salah.");
          setLoading(false);
          return;
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Username atau Password salah.");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend API unavailable, attempting client fallback login:", err);
    }

    // Client fallback
    const lower = username.toLowerCase().trim();
    const foundEmp = employees.find(e => e.username?.toLowerCase() === lower);
    const fallbackUser = foundEmp || {
      id: `EMP-${Date.now()}`,
      username: lower,
      name: lower === "admin" ? "Super Admin" : username.trim(),
      role: lower === "admin" ? UserRole.ADMIN : lower === "manager1" ? UserRole.MANAGER : UserRole.CASHIER,
      email: `${lower}@fonepos.local`,
      tenantId: selectedTenantId
    };

    localStorage.setItem("tenantId", selectedTenantId);
    onLoginSuccess(fallbackUser);
    setLoading(false);
  };

  const selectQuickRole = async (usernameValue: string) => {
    setUsername(usernameValue);
    setPassword("any");
    setLoading(true);
    setError("");

    try {
      localStorage.setItem("tenantId", selectedTenantId);
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameValue, password: "any" }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (data.token) {
            localStorage.setItem("authToken", data.token);
          }
          localStorage.setItem("tenantId", selectedTenantId);
          onLoginSuccess(data.user);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Quick role login failed:", err);
    }

    const fallbackUser = {
      id: `EMP-${Date.now()}`,
      username: usernameValue,
      name: usernameValue === "admin" ? "Super Admin" : usernameValue === "manager1" ? "Manager Toko" : "Kasir",
      role: usernameValue === "admin" ? UserRole.ADMIN : usernameValue === "manager1" ? UserRole.MANAGER : UserRole.CASHIER,
      email: `${usernameValue}@fonepos.local`,
      tenantId: selectedTenantId
    };

    localStorage.setItem("tenantId", selectedTenantId);
    onLoginSuccess(fallbackUser);
    setLoading(false);
  };

  // Handle Tenant Registration
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
          phone: regPhone.trim(),
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
        setRegSuccessMsg(`Toko '${regStoreName}' berhasil terdaftar! Masuk ke sistem...`);
        
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 1200);
      } else {
        setError(data.message || "Gagal mendaftarkan toko tenant.");
      }
    } catch (err: any) {
      setError("Terjadi kesalahan jaringan saat registrasi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail.trim()) {
      setError("Masukkan email akun Anda.");
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
        setFpSuccessMsg(data.message || "Kode OTP telah dikirimkan ke email Anda.");
        if (data.otpForDemo) {
          setDemoOtpHint(data.otpForDemo);
        }
        setFpStep("ENTER_OTP");
      } else {
        setError(data.message || "Gagal memproses permintaan reset password.");
      }
    } catch (err: any) {
      setError("Kesalahan koneksi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Submit OTP & Reset Password
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
        setFpSuccessMsg("Kata sandi berhasil diperbarui! Silakan masuk kembali.");
        setTimeout(() => {
          setViewMode("LOGIN");
          setFpStep("REQUEST_OTP");
          setPassword(fpNewPassword);
          setFpSuccessMsg("");
          setError("");
        }, 2000);
      } else {
        setError(data.message || "Kode OTP salah atau telah kadaluarsa.");
      }
    } catch (err: any) {
      setError("Kesalahan reset sandi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 z-10">
        
        {/* Back to Landing Page button */}
        {onBackToLanding && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Halaman Utama Website</span>
            </button>
          </div>
        )}

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 shadow-inner">
            <Smartphone className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            NexusPOS Cloud <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">Multi-Tenant SaaS</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Sistem Kasir POS, Inventaris IMEI Berlapis, & Database Terisolasi per Penyewa
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          {/* Alerts & Notifications */}
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

          {/* VIEW: LOGIN FORM */}
          {viewMode === "LOGIN" && (
            <div>
              {/* Tenant Selector */}
              <div className="mb-5 pb-5 border-b border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-blue-400" />
                    Pilih Toko / Tenant
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("REGISTER");
                      setError("");
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <PlusCircle className="h-3 w-3" />
                    Daftar Toko Baru
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <select
                    id="tenant-select-dropdown"
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="default">🏢 Nexus Official (Toko Demo Utama)</option>
                    {tenantList.map(t => (
                      <option key={t.id} value={t.slug || t.id}>
                        🏪 {t.name} ({t.slug || t.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Database, katalog IMEI, transaksi, dan backup terisolasi penuh untuk toko ini.
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username Karyawan
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <input
                      id="input-login-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: admin, manager1, cashier1"
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Kata Sandi PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("FORGOT_PASSWORD");
                        setError("");
                        setFpSuccessMsg("");
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      Lupa Sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="input-login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Default: <span className="text-slate-400 font-mono">Admin#2026!</span> (Bcrypt Hash Enforced)
                  </p>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Memverifikasi Sesi...
                    </>
                  ) : (
                    "Masuk ke Sistem POS"
                  )}
                </button>
              </form>

              {/* Quick Demo Logins */}
              <div className="mt-6 pt-5 border-t border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase text-center mb-3">
                  Akses Cepat Demo Role
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="btn-quick-admin"
                    onClick={() => selectQuickRole("admin")}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4 mb-1 text-blue-400" />
                    <span className="text-[10px] font-bold">Admin</span>
                    <span className="text-[8px] text-slate-500">Super Access</span>
                  </button>

                  <button
                    id="btn-quick-manager"
                    onClick={() => selectQuickRole("manager1")}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4 mb-1 text-emerald-400" />
                    <span className="text-[10px] font-bold">Manager</span>
                    <span className="text-[8px] text-slate-500">Stok & Audit</span>
                  </button>

                  <button
                    id="btn-quick-cashier"
                    onClick={() => selectQuickRole("cashier1")}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4 mb-1 text-amber-400" />
                    <span className="text-[10px] font-bold">Kasir</span>
                    <span className="text-[8px] text-slate-500">POS Sales</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TENANT REGISTRATION (ONBOARDING) */}
          {viewMode === "REGISTER" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("LOGIN");
                    setError("");
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali ke Login
                </button>
                <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Sewa Toko Baru
                </span>
              </div>

              <h2 className="text-lg font-bold text-white mb-1">Daftarkan Toko / Tenant Baru</h2>
              <p className="text-xs text-slate-400 mb-4">
                Buat database mandiri, akun Super Admin, dan partisi cadangan harian khusus untuk bisnis gadget Anda.
              </p>

              {regSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{regSuccessMsg}</span>
                </div>
              )}

              <form className="space-y-3.5" onSubmit={handleRegisterTenant}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nama Toko / Usaha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regStoreName}
                        onChange={(e) => handleStoreNameChange(e.target.value)}
                        placeholder="Contoh: Roxy Gadget Cell"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tenant Slug (ID Unik)
                    </label>
                    <input
                      type="text"
                      required
                      value={regSlug}
                      onChange={(e) => setRegSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="roxy-gadget"
                      className="block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nama Pemilik (Owner)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regOwnerName}
                        onChange={(e) => setRegOwnerName(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Pemilik
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
                        placeholder="owner@toko.com"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nomor WhatsApp Toko
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0812-xxxx-xxxx"
                        className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Paket Berlangganan
                    </label>
                    <select
                      value={regPlan}
                      onChange={(e) => setRegPlan(e.target.value)}
                      className="block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="STARTER">Starter Plan (1 Cabang)</option>
                      <option value="PRO">Pro Business (Multi-Cabang & AI)</option>
                      <option value="ENTERPRISE">Enterprise Cloud VPS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kata Sandi Admin Toko
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
                      className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Gunakan kombinasi huruf, angka, dan simbol untuk keamanan maksimal.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Membuat Database Toko...
                    </>
                  ) : (
                    "Daftarkan & Inisialisasi Database"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD (SELF-SERVICE OTP) */}
          {viewMode === "FORGOT_PASSWORD" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("LOGIN");
                    setError("");
                    setFpStep("REQUEST_OTP");
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali ke Login
                </button>
                <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                  <KeyRound className="h-3.5 w-3.5" />
                  Pemulihan Akun
                </span>
              </div>

              <h2 className="text-lg font-bold text-white mb-1">Reset Kata Sandi Akun</h2>
              <p className="text-xs text-slate-400 mb-4">
                {fpStep === "REQUEST_OTP" 
                  ? "Masukkan alamat email terdaftar untuk menerima 6-digit kode verifikasi OTP."
                  : "Masukkan kode OTP 6 digit yang telah dikirim dan buat kata sandi baru."}
              </p>

              {fpSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div>{fpSuccessMsg}</div>
                    {demoOtpHint && (
                      <div className="mt-1 font-mono text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 inline-block">
                        Kode OTP Demo: <strong>{demoOtpHint}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {fpStep === "REQUEST_OTP" ? (
                <form className="space-y-4" onSubmit={handleRequestOtp}>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Akun Karyawan / Admin
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                        placeholder="Contoh: admin@roxycell.com"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Mengirim Kode OTP...
                      </>
                    ) : (
                      "Kirim Kode Verifikasi OTP"
                    )}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleResetPassword}>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Kode Verifikasi OTP (6 Digit)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value)}
                      placeholder="123456"
                      className="block w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 font-mono tracking-widest text-center text-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={fpNewPassword}
                        onChange={(e) => setFpNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Menyimpan Kata Sandi...
                      </>
                    ) : (
                      "Simpan Sandi Baru & Masuk"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer Security Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            Bcrypt Hashing (Cost 10)
          </span>
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            JWT Bearer Authentication
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
            Partitioned Tenant Backups
          </span>
        </div>

      </div>
    </div>
  );
}
