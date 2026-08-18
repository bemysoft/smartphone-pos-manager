import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Server, 
  Key, 
  User, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  HelpCircle,
  Eye,
  EyeOff,
  Save,
  Lock,
  ExternalLink
} from "lucide-react";
import { apiFetch } from "../lib/api";

interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  senderName: string;
  senderEmail: string;
  secure: boolean;
}

const PROVIDER_PRESETS = [
  {
    name: "Gmail / Workspace",
    icon: "🔴",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    note: "Gunakan App Password 16-karakter (2-Step Verification) dari Akun Google Anda."
  },
  {
    name: "Outlook / Office365",
    icon: "🔵",
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    note: "Memerlukan akun Microsoft/Office365 dengan fitur SMTP Auth diaktifkan."
  },
  {
    name: "Yahoo Mail",
    icon: "🟣",
    host: "smtp.mail.yahoo.com",
    port: 465,
    secure: true,
    note: "Gunakan App Password khusus dari Pengaturan Keamanan Yahoo."
  },
  {
    name: "Mailtrap Sandbox",
    icon: "📦",
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false,
    note: "Layanan pengujian email virtual aman tanpa mengirim email asli."
  },
  {
    name: "Custom cPanel / Webmail",
    icon: "🌐",
    host: "mail.domainanda.com",
    port: 465,
    secure: true,
    note: "Atur alamat host server webmail sesuai domain toko Anda."
  }
];

export default function SmtpConfig() {
  const [config, setConfig] = useState<SmtpSettings>({
    host: "",
    port: 587,
    user: "",
    pass: "",
    senderName: "POS Smartphone Store",
    senderEmail: "",
    secure: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [showTestModal, setShowTestModal] = useState(false);
  const [alertState, setAlertState] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });

  // Fetch current SMTP configuration
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/smtp/config");
      if (res.ok) {
        const data = await res.json();
        setConfig({
          host: data.host || "",
          port: Number(data.port) || 587,
          user: data.user || "",
          pass: data.pass || "",
          senderName: data.senderName || "POS Smartphone Store",
          senderEmail: data.senderEmail || data.user || "",
          secure: data.secure === true
        });
      }
    } catch (err) {
      console.error("Gagal memuat konfigurasi SMTP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (preset: typeof PROVIDER_PRESETS[0]) => {
    setConfig(prev => ({
      ...prev,
      host: preset.host,
      port: preset.port,
      secure: preset.secure
    }));
    setAlertState({
      type: "info",
      message: `Preset '${preset.name}' diterapkan (${preset.host}:${preset.port}). ${preset.note}`
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setAlertState({ type: null, message: "" });

    try {
      const res = await apiFetch("/api/smtp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertState({
          type: "success",
          message: "✅ Konfigurasi Server SMTP berhasil disimpan sebagai standar otomatis (default)!"
        });
      } else {
        setAlertState({
          type: "error",
          message: data.message || "Gagal menyimpan konfigurasi SMTP."
        });
      }
    } catch (err) {
      console.error(err);
      setAlertState({
        type: "error",
        message: "Terjadi kesalahan koneksi server saat menyimpan pengaturan SMTP."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.host || !config.user || !config.pass) {
      setAlertState({
        type: "error",
        message: "Lengkapi bidang Host, Username/Email, dan Password sebelum menguji koneksi."
      });
      return;
    }

    setIsTesting(true);
    setAlertState({ type: null, message: "" });

    try {
      const res = await apiFetch("/api/smtp/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          testRecipient: testRecipient.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertState({
          type: "success",
          message: data.message || "Koneksi SMTP Berhasil Tervalidasi!"
        });
        setShowTestModal(false);
      } else {
        setAlertState({
          type: "error",
          message: data.message || "Uji koneksi SMTP gagal."
        });
      }
    } catch (err: any) {
      console.error(err);
      setAlertState({
        type: "error",
        message: "Gagal terhubung ke server SMTP. Periksa kembali host, port, dan kata sandi."
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Memuat Pengaturan Server SMTP...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Mail className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Pengaturan Default Server SMTP Email
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Auto-Config
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Kelola kredensial akun server SMTP pengirim email secara terpusat. Setiap kali Anda mengubah nilai SMTP di halaman ini, sistem akan otomatis menggunakannya sebagai nilai default untuk klaim garansi, laporan bulanan, dan struk transaksi.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Send className="h-4 w-4" />
              Uji Koneksi & Tes Email
            </button>
          </div>
        </div>
      </div>

      {/* Alert Status Banner */}
      {alertState.message && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-start gap-3 transition-all animate-fade-in ${
          alertState.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200" 
            : alertState.type === "error"
            ? "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
            : "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200"
        }`}>
          {alertState.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : alertState.type === "error" ? (
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Zap className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">
            {alertState.message}
          </div>
        </div>
      )}

      {/* Provider Quick Presets */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Preset Penyedia Layanan Email (Quick Fill)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">
            Klik preset di bawah untuk pengisian otomatis host & port
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PROVIDER_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 hover:shadow-md ${
                config.host === preset.host 
                  ? "bg-primary-50/80 border-primary-500 dark:bg-primary-950/50 dark:border-primary-600 shadow-sm" 
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-lg">{preset.icon}</span>
                {config.host === preset.host && (
                  <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {preset.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                  {preset.host}:{preset.port}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Formulir Parameter Server SMTP
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Tersimpan Otomatis ke Database
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* SMTP Host */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-slate-400" /> Host Server SMTP <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={config.host}
              onChange={(e) => {
                let val = e.target.value;
                if (/^stmp\./i.test(val)) val = val.replace(/^stmp\./i, "smtp.");
                setConfig({ ...config, host: val });
              }}
              placeholder="e.g. smtp.gmail.com atau mail.domain.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400">
              Alamat domain/IP server keluar SMTP (contoh: <strong>smtp.gmail.com</strong>).
            </p>
          </div>

          {/* SMTP Port & Secure Checkbox */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-slate-400" /> Port SMTP <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={config.port}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  setConfig({ 
                    ...config, 
                    port: p,
                    secure: p === 465
                  });
                }}
                placeholder="587 atau 465"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all">
                <input
                  type="checkbox"
                  checked={config.secure}
                  onChange={(e) => setConfig({ ...config, secure: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                />
                <div className="leading-tight">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    SSL Encryption
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {config.secure ? "Secure Port 465 (SSL)" : "TLS Port 587 / STARTTLS"}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Username / Email SMTP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" /> Username / Alamat Email SMTP <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={config.user}
              onChange={(e) => setConfig({ 
                ...config, 
                user: e.target.value,
                senderEmail: config.senderEmail || e.target.value 
              })}
              placeholder="e.g. notifikasi@tokosmartphone.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400">
              Email yang digunakan untuk otentikasi login ke server SMTP.
            </p>
          </div>

          {/* Password / App Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-slate-400" /> Password / App Password SMTP <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={config.pass}
                onChange={(e) => setConfig({ ...config, pass: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-3.5 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Gunakan App Password (16 digit) jika Anda menggunakan 2-Step Verification pada Gmail/Outlook.
            </p>
          </div>

          {/* Nama Pengirim Header */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" /> Nama Pengirim (Sender Display Name)
            </label>
            <input
              type="text"
              value={config.senderName}
              onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
              placeholder="e.g. Smartphone Store POS Official"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400">
              Nama bisnis/toko yang akan muncul sebagai pengirim di kotak masuk penerima.
            </p>
          </div>

          {/* Email Pengirim Custom */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Pengirim (From Header)
            </label>
            <input
              type="email"
              value={config.senderEmail}
              onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
              placeholder="e.g. no-reply@tokosmartphone.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400">
              Alamat 'From' yang ditampilkan pada email. Kosongkan untuk menggunakan Username SMTP.
            </p>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-4 w-4 text-emerald-500" />
            <span>Kredensial tersimpan dengan enkripsi aman di server local/cloud.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="flex-1 sm:flex-none px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              Tes Koneksi
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-3 bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-primary-600/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Konfigurasi Default
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Accordion / Security Instructions Guide */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wider">
          <HelpCircle className="h-4 w-4 text-indigo-500" />
          Panduan Singkat: Cara Membuat App Password untuk Gmail & Outlook
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-rose-500">🔴</span> Panduan Google / Gmail:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              <li>Buka <strong className="text-slate-700 dark:text-slate-200">myaccount.google.com/security</strong>.</li>
              <li>Pastikan <strong className="text-slate-700 dark:text-slate-200">Verifikasi 2 Langkah (2-Step Verification)</strong> sudah diaktifkan.</li>
              <li>Cari menu <strong className="text-slate-700 dark:text-slate-200">Sandi Aplikasi (App Passwords)</strong> di kolom pencarian.</li>
              <li>Buat nama aplikasi misal <em>"POS Smartphone Store"</em> lalu salin 16 karakter kata sandi tanpa spasi.</li>
              <li>Tempelkan kata sandi 16 digit tersebut ke kolom <strong>Password SMTP</strong> di atas.</li>
            </ol>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-sky-500">🔵</span> Panduan Microsoft Outlook / Office 365:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              <li>Masuk ke halaman keamanan akun Microsoft Anda (<strong className="text-slate-700 dark:text-slate-200">account.microsoft.com/security</strong>).</li>
              <li>Pilih menu <strong className="text-slate-700 dark:text-slate-200">Opsi Keamanan Lanjutan (Advanced Security Options)</strong>.</li>
              <li>Di bawah seksi Sandi Aplikasi, klik <strong className="text-slate-700 dark:text-slate-200">Buat sandi aplikasi baru</strong>.</li>
              <li>Gunakan host <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">smtp.office365.com</code> dengan Port <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">587</code>.</li>
              <li>Pastikan admin domain Anda mengizinkan fitur <strong>Authenticated SMTP</strong> pada admin center.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Modal Test Connection & Send Email */}
      {showTestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Pengujian Koneksi Server SMTP
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verifikasi handshake socket dan kirim email simulasi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Target Host SMTP:</p>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {config.host || "smtp.gmail.com"}:{config.port} ({config.secure ? "SSL" : "TLS"})
                </p>
                <p className="text-[10px] text-slate-500">
                  Pengirim: {config.senderName} &lt;{config.senderEmail || config.user}&gt;
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Penerima Tes (Opsional)
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Masukkan email Anda (misal: nama@gmail.com)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Jika diisi, sistem akan mengirim email konfirmasi asli ke alamat ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                disabled={isTesting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menguji...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Mulai Uji Koneksi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
