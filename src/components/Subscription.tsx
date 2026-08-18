import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  Zap, 
  Shield, 
  Crown, 
  Building2, 
  Smartphone, 
  ArrowRight, 
  CreditCard, 
  Server, 
  Database,
  Edit2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Key, 
  QrCode, 
  Sparkles, 
  Clock, 
  Check, 
  Copy, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  Globe,
  Activity,
  CheckSquare
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { UserRole } from "../types";
import { apiFetch } from "../lib/api";
import MigrationRequest from "./MigrationRequest";

export default function Subscription({ userRole, currentUser }: { userRole?: UserRole; currentUser?: any }) {
  const [subTab, setSubTab] = useState<"plans" | "migration">("plans");
  const [isEditing, setIsEditing] = useState(false);
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // Midtrans Settings State
  const [showMidtransConfigModal, setShowMidtransConfigModal] = useState(false);
  const [midtransConfig, setMidtransConfig] = useState({
    clientKey: "",
    serverKey: "",
    isProduction: false
  });
  const [savingMidtrans, setSavingMidtrans] = useState(false);
  const [midtransMsg, setMidtransMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active Subscription State
  const [activeSub, setActiveSub] = useState<any>(null);

  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    plan: any | null;
    billingCycle: "monthly" | "yearly";
    orderId: string;
    qrisQrUrl: string;
    snapToken: string;
    redirectUrl: string;
    amount: number;
    loading: boolean;
    verifying: boolean;
    isSuccess: boolean;
    timeLeft: number;
  }>({
    isOpen: false,
    plan: null,
    billingCycle: "yearly",
    orderId: "",
    qrisQrUrl: "",
    snapToken: "",
    redirectUrl: "",
    amount: 0,
    loading: false,
    verifying: false,
    isSuccess: false,
    timeLeft: 900 // 15 mins
  });

  const defaultPlans = [
    {
      id: "basic",
      name: "Starter / Basic",
      description: "Cocok untuk toko baru atau konter kecil dengan 1 kasir.",
      icon: "Smartphone",
      priceMonthly: 149000,
      priceYearly: 1490000,
      features: [
        "1 Akun Kasir",
        "Katalog Produk & IMEI",
        "Transaksi POS Basic",
        "Struk Thermal Standar",
        "Laporan Penjualan Harian",
        "Support WhatsApp Jam Kerja"
      ],
      color: "blue",
      popular: false
    },
    {
      id: "pro",
      name: "Pro / Bisnis",
      description: "Untuk toko berkembang yang membutuhkan analitik dan AI.",
      icon: "Zap",
      priceMonthly: 299000,
      priceYearly: 2990000,
      features: [
        "Hingga 5 Akun (Kasir & Admin)",
        "Semua Fitur Basic",
        "Manajemen Promo & Diskon",
        "Modul Tukar Tambah / Buyback",
        "Asisten Gemini AI & Pembuat Poster",
        "Dashboard Analitik Lengkap",
        "Notifikasi Telegram/WA",
        "Support Prioritas 24/7"
      ],
      color: "emerald",
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Solusi lengkap untuk banyak cabang dan franchise.",
      icon: "Crown",
      priceMonthly: 799000,
      priceYearly: 7990000,
      features: [
        "Unlimited Akun & Role (RBAC)",
        "Semua Fitur Pro",
        "Multi-Cabang & Sinkronisasi",
        "Custom Domain & Whitelabel",
        "Akses API & Webhook",
        "Laporan Keuangan Audit Lengkap",
        "Dedicated Account Manager",
        "Cloud Storage Prioritas"
      ],
      color: "purple",
      popular: false
    }
  ];

  const [plans, setPlans] = useState<any[]>(defaultPlans);
  const [editPlans, setEditPlans] = useState<any[]>([]);

  // Initial Fetch Data
  useEffect(() => {
    fetchPlans();
    fetchMidtransConfig();
    fetchActiveSubscription();
  }, []);

  // Midtrans Sub-module State
  const [showServerKey, setShowServerKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showConfigSubModule, setShowConfigSubModule] = useState(true);
  const [webhookTesting, setWebhookTesting] = useState(false);

  // Real-time listener: Poll Midtrans / Server status when QRIS modal is active and pending
  useEffect(() => {
    let interval: any;
    if (paymentModal.isOpen && paymentModal.orderId && !paymentModal.isSuccess) {
      interval = setInterval(async () => {
        try {
          const res = await apiFetch(`/api/saas/subscription/check-status?orderId=${paymentModal.orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.subscription?.status === "ACTIVE") {
              setPaymentModal(prev => ({ ...prev, isSuccess: true, verifying: false }));
              setActiveSub(data.subscription);
            }
          }
        } catch (err) {
          console.error("Webhook listener polling error", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [paymentModal.isOpen, paymentModal.orderId, paymentModal.isSuccess]);

  // General background subscription listener: Runs every 15s to keep status (ACTIVE/EXPIRED) fresh
  useEffect(() => {
    const bgInterval = setInterval(async () => {
      try {
        const res = await apiFetch("/api/saas/subscription/check-status");
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            setActiveSub(data.subscription);
          }
        }
      } catch (err) {
        console.error("Background subscription check error", err);
      }
    }, 15000);
    return () => clearInterval(bgInterval);
  }, []);

  // Timer countdown for Payment Modal
  useEffect(() => {
    let timer: any;
    if (paymentModal.isOpen && paymentModal.timeLeft > 0 && !paymentModal.isSuccess) {
      timer = setInterval(() => {
        setPaymentModal(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paymentModal.isOpen, paymentModal.timeLeft, paymentModal.isSuccess]);

  const fetchPlans = async () => {
    try {
      const res = await apiFetch("/api/saas/plans");
      const data = await res.json();
      if (data && data.length > 0) {
        setPlans(data);
      }
    } catch (err) {
      console.error("Failed to fetch saas plans", err);
    }
  };

  const fetchMidtransConfig = async () => {
    try {
      const res = await apiFetch("/api/midtrans/config");
      if (res.ok) {
        const data = await res.json();
        setMidtransConfig({
          clientKey: data.clientKey || "SB-Mid-client-W_k8sH-j4",
          serverKey: data.serverKey || "SB-Mid-server-x8K2fL-p9",
          isProduction: data.isProduction || false
        });
      }
    } catch (err) {
      console.error("Failed to fetch Midtrans config", err);
    }
  };

  const fetchActiveSubscription = async () => {
    try {
      const res = await apiFetch("/api/saas/subscription/check-status");
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) {
          setActiveSub(data.subscription);
        }
      }
    } catch (err) {
      console.error("Failed to fetch active subscription", err);
    }
  };

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/subscription/webhook` : "/api/subscription/webhook";

  const handleCopyWebhookUrl = () => {
    try {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const handleTestWebhookPing = async () => {
    setWebhookTesting(true);
    try {
      const res = await apiFetch("/api/subscription/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: `SUB-TEST-${Date.now()}`,
          transaction_status: "settlement",
          fraud_status: "accept",
          status_code: "200",
          gross_amount: "299000"
        })
      });
      const data = await res.json();
      if (data.success) {
        setMidtransMsg({ type: "success", text: "⚡ Webhook listener (/api/subscription/webhook) aktif! Status akun otomatis diperbarui ke ACTIVE." });
        fetchActiveSubscription();
      } else {
        setMidtransMsg({ type: "error", text: "Pengujian webhook gagal." });
      }
    } catch (e) {
      setMidtransMsg({ type: "error", text: "Gagal terhubung ke endpoint webhook." });
    } finally {
      setWebhookTesting(false);
    }
  };

  const handleSaveMidtransConfig = async () => {
    setSavingMidtrans(true);
    setMidtransMsg(null);
    try {
      const res = await apiFetch("/api/midtrans/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(midtransConfig)
      });
      const data = await res.json();
      if (data.success) {
        setMidtransMsg({ type: "success", text: "Konfigurasi Midtrans Gateway berhasil disimpan!" });
        setTimeout(() => setShowMidtransConfigModal(false), 1200);
      } else {
        setMidtransMsg({ type: "error", text: data.message || "Gagal menyimpan konfigurasi Midtrans." });
      }
    } catch (err) {
      setMidtransMsg({ type: "error", text: "Terjadi kesalahan koneksi ke server." });
    } finally {
      setSavingMidtrans(false);
    }
  };

  const parseNumberInput = (val: any): number => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    
    let str = String(val).trim();
    if (str.includes(".") && str.includes(",")) {
      if (str.indexOf(".") < str.indexOf(",")) {
        str = str.replace(/\./g, "").replace(",", ".");
      } else {
        str = str.replace(/,/g, "");
      }
    } else if (str.includes(".")) {
      const parts = str.split(".");
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3)) {
        str = str.replace(/\./g, "");
      }
    } else if (str.includes(",")) {
      const parts = str.split(",");
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3)) {
        str = str.replace(/,/g, "");
      } else {
        str = str.replace(",", ".");
      }
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleEditClick = () => {
    setEditPlans(JSON.parse(JSON.stringify(plans)));
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      const cleanedPlans = editPlans.map((plan) => ({
        ...plan,
        priceMonthly: Math.round(parseNumberInput(plan.priceMonthly)),
        priceYearly: Math.round(parseNumberInput(plan.priceYearly))
      }));

      const res = await apiFetch("/api/saas/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedPlans)
      });
      const data = await res.json();
      if (data && data.success) {
        setPlans(data.plans);
        setIsEditing(false);
      } else {
        alert(data?.message || "Gagal menyimpan perubahan paket SaaS.");
      }
    } catch (err) {
      console.error("Failed to save plans", err);
      alert("Gagal menyimpan paket");
    }
  };

  // Open Midtrans Payment Modal & Request Charge
  const handleSelectPlan = async (plan: any) => {
    const rawPrice = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    const amount = Math.round(parseNumberInput(rawPrice));

    setPaymentModal({
      isOpen: true,
      plan,
      billingCycle,
      orderId: "",
      qrisQrUrl: "",
      snapToken: "",
      redirectUrl: "",
      amount,
      loading: true,
      verifying: false,
      isSuccess: false,
      timeLeft: 900
    });

    try {
      const res = await apiFetch("/api/saas/subscription/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          billingCycle,
          amount
        })
      });

      const data = await res.json();
      if (data.success) {
        setPaymentModal(prev => ({
          ...prev,
          orderId: data.orderId,
          qrisQrUrl: data.qrisQrUrl,
          snapToken: data.snapToken,
          redirectUrl: data.redirectUrl,
          loading: false
        }));
      } else {
        alert("Gagal membuat transaksi pembayaran Midtrans.");
        setPaymentModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    } catch (err) {
      console.error("Error creating Midtrans subscription charge", err);
      alert("Terjadi kesalahan jaringan.");
      setPaymentModal(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  // Verify / Simulate QRIS Scan Payment
  const handleVerifyPayment = async () => {
    setPaymentModal(prev => ({ ...prev, verifying: true }));

    try {
      const res = await apiFetch("/api/saas/subscription/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: paymentModal.orderId,
          planId: paymentModal.plan?.id,
          planName: paymentModal.plan?.name,
          billingCycle: paymentModal.billingCycle
        })
      });

      const data = await res.json();
      if (data.success) {
        setPaymentModal(prev => ({ ...prev, verifying: false, isSuccess: true }));
        setActiveSub(data.subscription);
      } else {
        alert(data.message || "Pembayaran belum terverifikasi.");
        setPaymentModal(prev => ({ ...prev, verifying: false }));
      }
    } catch (err) {
      console.error("Verification failed", err);
      setPaymentModal(prev => ({ ...prev, verifying: false }));
    }
  };

  const renderIcon = (iconName: string, colorClass: string) => {
    switch (iconName) {
      case "Smartphone": return <Smartphone className={`h-6 w-6 ${colorClass}`} />;
      case "Zap": return <Zap className={`h-6 w-6 ${colorClass}`} />;
      case "Crown": return <Crown className={`h-6 w-6 ${colorClass}`} />;
      default: return <CheckCircle className={`h-6 w-6 ${colorClass}`} />;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Subscription Status & Countdown Calculations
  const isSubActive = activeSub?.status === "ACTIVE" && new Date(activeSub.expiresAt || 0).getTime() > Date.now();
  const expiresAtMs = activeSub?.expiresAt ? new Date(activeSub.expiresAt).getTime() : 0;
  const remainingMs = Math.max(0, expiresAtMs - Date.now());
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const isApproachingExpiration = isSubActive && remainingDays <= 7;
  const isExpired = activeSub && (!isSubActive || activeSub.status === "EXPIRED" || remainingMs <= 0);

  const scrollToPlans = () => {
    const plansEl = document.getElementById("saas-pricing-plans");
    if (plansEl) {
      plansEl.scrollIntoView({ behavior: "smooth" });
    } else {
      const defaultPlan = plans[1] || plans[0];
      if (defaultPlan) handleSelectPlan(defaultPlan);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2 relative no-print overflow-x-auto">
        <button
          onClick={() => setSubTab("plans")}
          className={`relative pb-3 px-5 text-xs font-black tracking-tight cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === "plans" 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Crown className="h-4 w-4" />
          Paket Langganan SaaS & Billing
          {subTab === "plans" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
          )}
        </button>

        <button
          onClick={() => setSubTab("migration")}
          className={`relative pb-3 px-5 text-xs font-black tracking-tight cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === "migration" 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Database className="h-4 w-4" />
          Layanan Migrasi Data (CSV Import)
          <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
            Gratis Pro & Enterprise
          </span>
          {subTab === "migration" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
      </div>

      {subTab === "migration" ? (
        <MigrationRequest userRole={userRole} currentUser={currentUser} />
      ) : (
        <>
          {/* 🔴 EXPIRED STATUS ALERT & RENEW NOW CTA */}
          {isExpired && (
        <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-rose-500/30 text-rose-300 border border-rose-400/40 px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                  STATUS: EXPIRED / KEDALUWARSA
                </span>
                <span className="bg-white/10 text-slate-300 px-3 py-1 rounded-full text-xs font-bold">
                  Perlu Perpanjangan Lisensi
                </span>
              </div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                ⚠️ Masa Berlangganan Paket {activeSub.planName || "SaaS"} Telah Berakhir
              </h3>
              <p className="text-xs text-rose-200/90 leading-relaxed max-w-2xl">
                Akses akun Anda telah kedaluwarsa pada <strong className="text-white underline">{new Date(activeSub.expiresAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. Silakan lakukan perpanjangan langganan (Renew Now) sekarang untuk mengaktifkan kembali modul POS Kasir, Katalog, dan Integrasi Midtrans.
              </p>
            </div>

            <button
              onClick={scrollToPlans}
              className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black px-6 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-xl shadow-rose-900/50 transition-all hover:scale-105 shrink-0 cursor-pointer"
            >
              <Sparkles className="h-5 w-5" />
              Perbarui Sekarang (Renew Now)
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ APPROACHING EXPIRATION COUNTDOWN WARNING (<= 7 DAYS LEFT) */}
      {isApproachingExpiration && (
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/30 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                  Masa Berakhir: {remainingDays} Hari {remainingHours} Jam Tersisa
                </span>
                <span className="bg-amber-500/20 text-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                  Peringatan Kedaluwarsa
                </span>
              </div>
              <h3 className="text-xl font-black text-amber-100 flex items-center gap-2">
                ⏳ Masa Langganan Segera Berakhir dalam {remainingDays} Hari!
              </h3>
              <p className="text-xs text-amber-200/80 leading-relaxed max-w-2xl">
                Paket <strong>{activeSub.planName}</strong> Anda akan habis pada <strong>{new Date(activeSub.expiresAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>. Lakukan perpanjangan lisensi sebelum tanggal tersebut untuk menghindari penutupan otomatis layanan.
              </p>
            </div>

            <button
              onClick={scrollToPlans}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 shrink-0 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Perpanjang Sekarang (Renew Now)
            </button>
          </div>
        </div>
      )}

      {/* 🟢 ACTIVE SUBSCRIPTION BANNER */}
      {isSubActive && !isApproachingExpiration && (
        <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 rounded-3xl p-6 text-white border border-primary-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  STATUS: ACTIVE (AKTIF)
                </span>
                <span className="bg-primary-500/20 text-primary-300 border border-primary-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary-400" />
                  {remainingDays} Hari Tersisa
                </span>
              </div>
              <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Paket {activeSub.planName || "Pro / Bisnis"}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span>Berlaku s/d: <strong className="text-white">{new Date(activeSub.expiresAt || Date.now() + 365*24*3600*1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                <span>•</span>
                <span>Siklus: <strong className="text-white capitalize">{activeSub.billingCycle === 'yearly' ? 'Tahunan (Hemat 20%)' : 'Bulanan'}</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {userRole === UserRole.ADMIN && (
                <button
                  onClick={() => setShowMidtransConfigModal(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Key className="h-4 w-4 text-primary-400" />
                  Pengaturan Key Midtrans
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {[
              "Kasir POS IMEI",
              "Katalog Produk",
              "Tukar Tambah HP",
              "Asisten Gemini AI",
              "Analitik Finansial",
              "Struk WhatsApp API",
              "Garansi Resmi",
              "Multi Kasir & Role",
              "Pengaturan Promo",
              "Export PDF / Excel"
            ].map((moduleName, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-200 font-medium truncate">{moduleName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Gateway Configuration Sub-Module (For Admin Users) */}
      {userRole === UserRole.ADMIN && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Payment Gateway Configuration</h3>
                  <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    Sub-Modul Midtrans
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pengaturan API Server Key, Client Key, mode lingkungan, dan listener webhook otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Webhook Listener Active
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                midtransConfig.isProduction 
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
              }`}>
                {midtransConfig.isProduction ? 'Live Production' : 'Sandbox Mode'}
              </span>
            </div>
          </div>

          {midtransMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
              midtransMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' 
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
            }`}>
              {midtransMsg.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {midtransMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Client Key Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-primary-500" />
                Midtrans Client Key
              </label>
              <input 
                type="text"
                value={midtransConfig.clientKey}
                onChange={(e) => setMidtransConfig({ ...midtransConfig, clientKey: e.target.value })}
                placeholder="Misal: SB-Mid-client-XXXXX"
                className="w-full text-xs font-mono border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <p className="text-[10px] text-slate-400">Digunakan untuk frontend Snap JS & generator QRIS payment.</p>
            </div>

            {/* Server Key Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-primary-500" />
                  Midtrans Server Key
                </span>
                <button
                  type="button"
                  onClick={() => setShowServerKey(!showServerKey)}
                  className="text-[10px] text-primary-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showServerKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showServerKey ? "Sembunyikan" : "Tampilkan"}
                </button>
              </label>
              <div className="relative">
                <input 
                  type={showServerKey ? "text" : "password"}
                  value={midtransConfig.serverKey}
                  onChange={(e) => setMidtransConfig({ ...midtransConfig, serverKey: e.target.value })}
                  placeholder="Misal: SB-Mid-server-XXXXX"
                  className="w-full text-xs font-mono border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">Digunakan untuk otentikasi API charge & verifikasi transaksi server-to-server.</p>
            </div>
          </div>

          {/* Environment & Webhook URL Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Environment Toggle */}
            <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary-500" />
                  Mode Lingkungan (Environment)
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Pilih Sandbox untuk pengujian atau Live Production untuk transaksi riil.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setMidtransConfig({ ...midtransConfig, isProduction: false })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !midtransConfig.isProduction 
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                  }`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setMidtransConfig({ ...midtransConfig, isProduction: true })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    midtransConfig.isProduction 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                  }`}
                >
                  Production
                </button>
              </div>
            </div>

            {/* Webhook Notification URL display */}
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                  URL Callback Webhook Listener Midtrans
                </h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Realtime Notification Endpoint
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={webhookUrl}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-200 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyWebhookUrl}
                  className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedWebhook ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {copiedWebhook ? "Tersalin!" : "Salin URL"}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Daftarkan URL di atas pada dashboard Midtrans Merchant (<strong>Settings &gt; Configuration &gt; Payment Notification URL</strong>). Setiap kali pembayaran QRIS / E-wallet sukses, webhook listener ini akan memperbarui status akun tenant secara otomatis di database.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={handleTestWebhookPing}
              disabled={webhookTesting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {webhookTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
              Uji Simulasi Webhook Listener
            </button>

            <button
              type="button"
              onClick={handleSaveMidtransConfig}
              disabled={savingMidtrans}
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {savingMidtrans ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Konfigurasi Gateway
            </button>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div id="saas-pricing-plans" className="text-center space-y-4 py-6 relative">
        <div className="flex items-center justify-center gap-3 absolute top-6 right-0">
          {userRole === UserRole.ADMIN && !showMidtransConfigModal && (
            <button 
              onClick={() => setShowMidtransConfigModal(true)}
              className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
            >
              <Key className="h-4 w-4 text-primary-600" />
              Pengaturan Midtrans
            </button>
          )}

          {userRole === UserRole.ADMIN && !isEditing && (
            <button 
              onClick={handleEditClick}
              className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
            >
              <Edit2 className="h-4 w-4 text-slate-500" />
              Edit Harga Paket
            </button>
          )}
        </div>

        {isEditing && (
          <div className="absolute top-6 right-0 flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-white border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm"
            >
              <X className="h-4 w-4" />
              Batal
            </button>
            <button 
              onClick={handleSaveClick}
              className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-700 flex items-center gap-2 shadow-sm"
            >
              <Save className="h-4 w-4" />
              Simpan Paket
            </button>
          </div>
        )}

        <h2 className="text-3xl font-black text-slate-800 dark:text-white">Paket Layanan SaaS SmartPOS</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Tingkatkan operasional toko smartphone Anda dengan sistem kasir pintar berteknologi AI & QRIS Payment Midtrans otomatis. 
        </p>

        {/* Midtrans Status Indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <span className={`w-2 h-2 rounded-full ${midtransConfig.clientKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="font-semibold">
              Midtrans Payment Gateway: {midtransConfig.clientKey ? (midtransConfig.isProduction ? 'Live Production' : 'Sandbox Active') : 'Belum Konfigurasi'}
            </span>
          </div>
        </div>

        {/* Cycle Toggle */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>Bulanan</span>
          <button 
            onClick={() => setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")}
            className="w-14 h-7 bg-primary-600 rounded-full relative transition-colors cursor-pointer"
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${billingCycle === "yearly" ? "left-8" : "left-1"}`}></div>
          </button>
          <span className={`text-xs font-bold ${billingCycle === "yearly" ? "text-slate-800 dark:text-white" : "text-slate-400"} flex items-center gap-1.5`}>
            Tahunan
            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Hemat 20%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {(isEditing ? editPlans : plans).map((plan, planIndex) => (
          <div 
            key={plan.id}
            className={`bg-white dark:bg-slate-800 rounded-2xl border ${plan.popular ? 'border-primary-500 shadow-xl shadow-primary-500/10 relative transform md:-translate-y-4' : 'border-slate-200 dark:border-slate-700 shadow-sm'} p-6 flex flex-col justify-between`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary-500 to-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md">
                Paling Populer
              </div>
            )}
            
            <div>
              <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  plan.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' :
                  plan.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                  'bg-purple-50 text-purple-600 dark:bg-purple-900/30'
                }`}>
                  {renderIcon(plan.icon, plan.color === 'blue' ? 'text-blue-500' : plan.color === 'emerald' ? 'text-emerald-500' : 'text-purple-500')}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Paket</label>
                      <input 
                        type="text" 
                        value={plan.name}
                        onChange={(e) => {
                          const newPlans = [...editPlans];
                          newPlans[planIndex].name = e.target.value;
                          setEditPlans(newPlans);
                        }}
                        className="w-full text-sm font-bold border border-slate-300 rounded-lg px-3 py-2 mt-1 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi</label>
                      <textarea 
                        value={plan.description}
                        onChange={(e) => {
                          const newPlans = [...editPlans];
                          newPlans[planIndex].description = e.target.value;
                          setEditPlans(newPlans);
                        }}
                        className="w-full text-xs text-slate-600 border border-slate-300 rounded-lg px-3 py-2 mt-1 dark:bg-slate-700 dark:text-white"
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-8">{plan.description}</p>
                  </>
                )}
              </div>

              <div className="mb-6">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Harga Bulanan (Rp)</label>
                      <input 
                        type="text" 
                        value={plan.priceMonthly ?? ""}
                        onChange={(e) => {
                          const newPlans = [...editPlans];
                          newPlans[planIndex].priceMonthly = e.target.value;
                          setEditPlans(newPlans);
                        }}
                        className="w-full text-sm font-bold border border-slate-300 rounded-lg px-3 py-2 mt-1 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Harga Tahunan (Rp)</label>
                      <input 
                        type="text" 
                        value={plan.priceYearly ?? ""}
                        onChange={(e) => {
                          const newPlans = [...editPlans];
                          newPlans[planIndex].priceYearly = e.target.value;
                          setEditPlans(newPlans);
                        }}
                        className="w-full text-sm font-bold border border-slate-300 rounded-lg px-3 py-2 mt-1 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-slate-500">Rp</span>
                      <span className="text-3xl font-black text-slate-800 dark:text-white">
                        {billingCycle === "monthly" 
                          ? Math.round(parseNumberInput(plan.priceMonthly)).toLocaleString('id-ID')
                          : Math.round(parseNumberInput(plan.priceYearly) / 12).toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">/ bulan</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">
                        Ditagih Rp {Math.round(parseNumberInput(plan.priceYearly)).toLocaleString('id-ID')} / tahun
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3">
                <ul className="space-y-3">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                        plan.popular ? 'text-primary-500' : 'text-slate-400'
                      }`} />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  plan.popular 
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-600/20' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                }`}
              >
                <QrCode className="h-4 w-4" />
                Bayar via Midtrans QRIS
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Midtrans Config Modal */}
      {showMidtransConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">Pengaturan Key Midtrans Gateway</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Atur Client Key & Server Key untuk aktivasi otomatis via QRIS</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMidtransConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {midtransMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                midtransMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {midtransMsg.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {midtransMsg.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Midtrans Client Key
                </label>
                <input 
                  type="text"
                  value={midtransConfig.clientKey}
                  onChange={(e) => setMidtransConfig({ ...midtransConfig, clientKey: e.target.value })}
                  placeholder="Misal: SB-Mid-client-XXXXX atau Mid-client-YYYYY"
                  className="w-full text-xs font-mono border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Digunakan untuk frontend Snap JS & QRIS scanner.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Midtrans Server Key
                </label>
                <input 
                  type="password"
                  value={midtransConfig.serverKey}
                  onChange={(e) => setMidtransConfig({ ...midtransConfig, serverKey: e.target.value })}
                  placeholder="Misal: SB-Mid-server-XXXXX"
                  className="w-full text-xs font-mono border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Digunakan untuk server API charge & verifikasi transaksi otomatis.</p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Mode Lingkungan (Environment)</h4>
                  <p className="text-[10px] text-slate-500">Pilih Sandbox untuk pengujian atau Production untuk transaksi riil</p>
                </div>
                <button
                  onClick={() => setMidtransConfig({ ...midtransConfig, isProduction: !midtransConfig.isProduction })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    midtransConfig.isProduction 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {midtransConfig.isProduction ? 'Live Production' : 'Sandbox (Uji Coba)'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setShowMidtransConfigModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMidtransConfig}
                disabled={savingMidtrans}
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-primary-600/20 disabled:opacity-50"
              >
                {savingMidtrans ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Konfigurasi Midtrans
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment & QRIS Scan Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            {paymentModal.isSuccess ? (
              <div className="py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Pembayaran Berhasil!</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  Paket <strong>{paymentModal.plan?.name}</strong> telah <strong>Aktif Otomatis</strong>. Semua modul fitur SaaS telah dibuka.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold shadow-md"
                  >
                    Mulai Menggunakan Sistem POS
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="bg-primary-50 text-primary-600 text-[10px] font-bold px-3 py-1 rounded-full border border-primary-200">
                    Midtrans QRIS Auto-Activation
                  </span>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white pt-2">Scan QRIS untuk Langganan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paket {paymentModal.plan?.name} ({paymentModal.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-3 relative">
                  {paymentModal.loading ? (
                    <div className="h-60 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
                      <span className="text-xs text-slate-500">Membuat QRIS Midtrans...</span>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100 relative">
                        <img 
                          src={paymentModal.qrisQrUrl} 
                          alt="Midtrans QRIS Code" 
                          className="w-52 h-52 object-contain rounded-lg" 
                        />
                        <div className="absolute inset-0 border-2 border-primary-500 rounded-xl pointer-events-none opacity-20"></div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>Batas Waktu Scan: <strong className="text-amber-600 font-mono">{formatTime(paymentModal.timeLeft)}</strong></span>
                      </div>
                    </>
                  )}
                </div>

                {/* Amount & Order Info */}
                <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Pembayaran</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white">
                      Rp {(paymentModal?.amount ?? 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">No. Order</span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold">
                      {paymentModal.orderId || "SUB-MIDTRANS"}
                    </span>
                  </div>
                </div>

                {/* Verification & Simulation Button */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleVerifyPayment}
                    disabled={paymentModal.verifying || paymentModal.loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                  >
                    {paymentModal.verifying ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {paymentModal.verifying ? "Memverifikasi Pembayaran..." : "Uji Simulasi Scan / Cek Status Midtrans"}
                  </button>

                  <p className="text-[10px] text-slate-400 leading-tight">
                    Dapat di-scan menggunakan GoPay, ShopeePay, OVO, Dana, LinkAja, atau Mobile Banking (BCA, Mandiri, BRI, BNI). Modul akan aktif otomatis setelah terkonfirmasi.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">Pertanyaan yang Sering Diajukan (FAQ)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Info penting seputar layanan, penagihan Midtrans, dan dukungan.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary-500" />
              Bagaimana sistem penagihan (billing) bekerja?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Penagihan dilakukan secara otomatis melalui Midtrans QRIS / Snap Gateway sesuai siklus yang Anda pilih (bulanan atau tahunan). Setelah pembayaran terverifikasi, modul SaaS toko Anda langsung aktif secara real-time.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-primary-500" />
              Apakah ada dukungan migrasi data?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Ya, untuk pengguna paket Pro dan Enterprise, kami menyediakan layanan migrasi data gratis dari sistem lama Anda (Excel, aplikasi kasir lain) ke platform kami tanpa downtime.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-primary-500" />
              Bagaimana garansi uptime server (SLA)?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Kami menjamin SLA uptime sebesar 99.9%. Platform kami dibangun menggunakan arsitektur cloud serverless yang sangat andal dan auto-scaling untuk menangani lonjakan transaksi toko Anda.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary-500" />
              Bagaimana keamanan data pelanggan saya?
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Seluruh data dienkripsi dengan standar industri (AES-256) baik saat transit maupun tersimpan. Kami rutin melakukan backup berkala untuk mencegah kehilangan data operasional Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-slate-900 rounded-2xl p-8 text-center text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="text-left flex-1 space-y-2">
          <h4 className="text-lg font-bold">Butuh kustomisasi khusus?</h4>
          <p className="text-xs text-slate-300">
            Hubungi tim sales kami untuk paket enterprise kustom yang disesuaikan dengan kebutuhan unik bisnis Anda.
          </p>
        </div>
        <button className="bg-white text-slate-900 px-6 py-3 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-2 shrink-0">
          <Building2 className="h-4 w-4" />
          Hubungi Sales (Ricky Commedan)
        </button>
      </div>
      </>
      )}
    </div>
  );
}
