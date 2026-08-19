import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../lib/api";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  Users,
  Clock,
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Tag,
  CreditCard,
  MessageSquare,
  Copy,
  Check,
  TrendingUp,
  Info,
  CalendarDays,
  FileText,
  Sliders,
  BellRing,
  HelpCircle,
  Activity,
  Download,
  Shield,
  FileSpreadsheet,
  X
} from "lucide-react";
import { TenantDetailedRecord, SuperadminSubscriptionStats, TenantSubscriptionStatus } from "../types";
import TenantActivityLog from "./TenantActivityLog";
import TenantDataExport from "./TenantDataExport";
import SecurityHealthReport from "./SecurityHealthReport";
import TenantRegistrationModal from "./TenantRegistrationModal";
import { useLanguage } from "../contexts/LanguageContext";

interface TenantManagementProps {
  currentUser?: any;
  onNavigateToSmtp?: () => void;
  onNavigateToSubscription?: () => void;
}

export default function TenantManagement({ currentUser, onNavigateToSmtp, onNavigateToSubscription }: TenantManagementProps) {
  const { t } = useLanguage();
  const [activeSuperadminTab, setActiveSuperadminTab] = useState<"TENANTS_LIST" | "ACTIVITY_LOGS" | "DATA_EXPORT" | "SECURITY_HEALTH">("TENANTS_LIST");
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [tenants, setTenants] = useState<TenantDetailedRecord[]>([]);
  const [stats, setStats] = useState<SuperadminSubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Notification / Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Modal States
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetailedRecord | null>(null);

  // Broadcast Form State
  const [broadcastTarget, setBroadcastTarget] = useState<string>("ALL");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActionText, setBroadcastActionText] = useState("Perpanjang Paket Sekarang");
  const [broadcastActionUrl, setBroadcastActionUrl] = useState("https://nexuspos.id/subscription");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Single Reminder Form State
  const [customReminderNote, setCustomReminderNote] = useState("");
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Auto-reminder runner state
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  // Edit / Extend Form State
  const [editPlan, setEditPlan] = useState<string>("PRO");
  const [editExtendDays, setEditExtendDays] = useState<number | "">("");
  const [editCustomExpiry, setEditCustomExpiry] = useState<string>("");
  const [editIsTrial, setEditIsTrial] = useState<boolean>(false);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editOwnerName, setEditOwnerName] = useState<string>("");
  const [editOwnerEmail, setEditOwnerEmail] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Create Tenant Form State
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createOwnerName, setCreateOwnerName] = useState("");
  const [createOwnerEmail, setCreateOwnerEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("Admin#2026!");
  const [createPhone, setCreatePhone] = useState("");
  const [createPlan, setCreatePlan] = useState("PRO");
  const [createTrialDays, setCreateTrialDays] = useState<number>(14);
  const [createNotes, setCreateNotes] = useState("");
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        apiFetch("/api/tenants/admin/list"),
        apiFetch("/api/superadmin/subscription-stats")
      ]);

      if (listRes.ok) {
        const listData = await listRes.json();
        if (listData.success && Array.isArray(listData.tenants)) {
          setTenants(listData.tenants);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData);
        }
      }
    } catch (err: any) {
      console.error("Error loading tenant admin data:", err);
      showToast("Gagal memuat data tenant: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, []);

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.ownerName.toLowerCase().includes(q) ||
          t.ownerEmail.toLowerCase().includes(q) ||
          (t.phone && t.phone.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && t.status !== statusFilter) {
        return false;
      }

      // Plan filter
      if (planFilter !== "ALL" && t.subscriptionPlan !== planFilter) {
        return false;
      }

      return true;
    });
  }, [tenants, searchQuery, statusFilter, planFilter]);

  // Copy slug helper
  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Open Edit / Extend Modal
  const openEditModal = (t: TenantDetailedRecord) => {
    setSelectedTenant(t);
    setEditPlan(t.subscriptionPlan);
    setEditExtendDays("");
    setEditCustomExpiry(t.subscriptionExpiry ? t.subscriptionExpiry.split("T")[0] : "");
    setEditIsTrial(t.isTrial);
    setEditIsActive(t.isActive);
    setEditOwnerName(t.ownerName);
    setEditOwnerEmail(t.ownerEmail);
    setEditPhone(t.phone || "");
    setEditNotes(t.notes || "");
    setShowEditModal(true);
  };

  // Save Tenant Subscription Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      setIsSavingEdit(true);
      const res = await apiFetch("/api/tenants/admin/update-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          plan: editPlan,
          extendDays: editExtendDays ? Number(editExtendDays) : undefined,
          customExpiryDate: editCustomExpiry ? `${editCustomExpiry}T23:59:59.000Z` : undefined,
          isTrial: editIsTrial,
          isActive: editIsActive,
          ownerName: editOwnerName,
          ownerEmail: editOwnerEmail,
          phone: editPhone,
          notes: editNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Langganan berhasil diperbarui!", "success");
        setShowEditModal(false);
        fetchTenantData();
      } else {
        showToast(data.message || "Gagal memperbarui langganan", "error");
      }
    } catch (err: any) {
      showToast("Error update langganan: " + err.message, "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Single Reminder Modal
  const openReminderModal = (t: TenantDetailedRecord) => {
    setSelectedTenant(t);
    setCustomReminderNote(
      t.daysRemaining <= 0
        ? "Masa aktif toko Anda saat ini telah kedaluwarsa. Mohon segera melakukan perpanjangan paket agar layanan kasir dan sinkronisasi stok tetap aktif."
        : `Masa aktif paket ${t.subscriptionPlan} tersisa ${t.daysRemaining} hari lagi. Dapatkan diskon 10% jika memperpanjang paket tahunan sebelum jatuh tempo.`
    );
    setShowReminderModal(true);
  };

  // Send Single Reminder Email
  const handleSendReminder = async () => {
    if (!selectedTenant) return;
    try {
      setIsSendingReminder(true);
      const res = await apiFetch("/api/tenants/admin/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          customMessage: customReminderNote
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Email pengingat berhasil dikirim ke ${selectedTenant.ownerEmail}!`, "success");
        setShowReminderModal(false);
        fetchTenantData();
      } else {
        showToast(data.message || "Gagal mengirim email pengingat.", "error");
      }
    } catch (err: any) {
      showToast("Gagal mengirim email: " + err.message, "error");
    } finally {
      setIsSendingReminder(false);
    }
  };

  // Send Broadcast Email
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      showToast("Subjek dan isi pesan broadcast wajib diisi.", "error");
      return;
    }

    try {
      setIsBroadcasting(true);
      const res = await apiFetch("/api/tenants/admin/broadcast-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetGroup: broadcastTarget,
          subject: broadcastSubject,
          title: broadcastTitle,
          message: broadcastMessage,
          actionText: broadcastActionText,
          actionUrl: broadcastActionUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Broadcast email berhasil dikirim!", "success");
        setShowBroadcastModal(false);
        setBroadcastSubject("");
        setBroadcastTitle("");
        setBroadcastMessage("");
        fetchTenantData();
      } else {
        showToast(data.message || "Gagal mengirim broadcast.", "error");
      }
    } catch (err: any) {
      showToast("Error broadcast email: " + err.message, "error");
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Run Automated 7-Day Expiry Check & Trigger Reminders
  const handleRunAutoReminders = async () => {
    try {
      setIsAutoRunning(true);
      const res = await apiFetch("/api/tenants/admin/auto-trigger-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        if (data.remindedCount > 0) {
          showToast(
            `Automasi Selesai: Berhasil mengirim ${data.remindedCount} email pengingat ke toko yang jatuh tempo <= 7 hari!`,
            "success"
          );
        } else {
          showToast(
            `Automasi Selesai: Semua tenant yang akan jatuh tempo sudah mendapatkan email reminder dalam 24 jam terakhir.`,
            "info"
          );
        }
        fetchTenantData();
      } else {
        showToast(data.message || "Gagal menjalankan automasi reminder", "error");
      }
    } catch (err: any) {
      showToast("Error automasi reminder: " + err.message, "error");
    } finally {
      setIsAutoRunning(false);
    }
  };

  // Create New Tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createSlug || !createOwnerName || !createOwnerEmail) {
      showToast("Nama toko, slug, pemilik, dan email wajib diisi.", "error");
      return;
    }

    try {
      setIsCreatingTenant(true);
      const res = await apiFetch("/api/tenants/admin/create-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          slug: createSlug,
          ownerName: createOwnerName,
          ownerEmail: createOwnerEmail,
          password: createPassword,
          phone: createPhone,
          plan: createPlan,
          trialDays: createPlan === "TRIAL" ? createTrialDays : 30,
          notes: createNotes
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Tenant '${createName}' berhasil didaftarkan!`, "success");
        setShowCreateModal(false);
        // Reset form
        setCreateName("");
        setCreateSlug("");
        setCreateOwnerName("");
        setCreateOwnerEmail("");
        setCreatePhone("");
        setCreateNotes("");
        fetchTenantData();
      } else {
        showToast(data.message || "Gagal mendaftarkan tenant baru.", "error");
      }
    } catch (err: any) {
      showToast("Error buat tenant: " + err.message, "error");
    } finally {
      setIsCreatingTenant(false);
    }
  };

  // Format status badge
  const renderStatusBadge = (status: TenantSubscriptionStatus, daysRemaining: number) => {
    switch (status) {
      case "EXPIRING_SOON":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Jatuh Tempo ({daysRemaining} Hari)
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <XCircle className="h-3 w-3 shrink-0" />
            Kedaluwarsa ({Math.abs(daysRemaining)} Hari Lalu)
          </span>
        );
      case "TRIAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
            <Sparkles className="h-3 w-3 shrink-0" />
            Uji Coba ({daysRemaining} Hari)
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Aktif ({daysRemaining} Hari)
          </span>
        );
    }
  };

  // Format plan pill
  const renderPlanPill = (plan: string) => {
    switch (plan) {
      case "ENTERPRISE":
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            Enterprise
          </span>
        );
      case "PRO":
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            Pro Bisnis
          </span>
        );
      case "STARTER":
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Starter
          </span>
        );
      case "TRIAL":
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Free Trial
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
            {plan}
          </span>
        );
    }
  };

  const urgentTenants = useMemo(() => {
    return tenants.filter((t) => t.daysRemaining <= 7 && t.daysRemaining >= 0);
  }, [tenants]);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800"
                : toast.type === "error"
                ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800"
                : "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {toast.type === "error" && <AlertTriangle className="h-5 w-5 text-rose-600" />}
            {toast.type === "info" && <Info className="h-5 w-5 text-blue-600" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER & ACTION CONTROLS */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Manajemen Tenant & Lisensi SaaS
            </h2>
            <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full">
              Superadmin
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola pendaftaran toko retail, pantau masa aktif/trial, automasi pengingat jatuh tempo 7 hari, dan broadcast email massal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchTenantData}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Refresh data tenant"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleRunAutoReminders}
            disabled={isAutoRunning}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            title="Jalankan pengecekan dan kirim email pengingat ke toko yang jatuh tempo <= 7 hari"
          >
            <BellRing className={`h-4 w-4 ${isAutoRunning ? "animate-bounce" : ""}`} />
            <span>{isAutoRunning ? "Memproses..." : "Auto-Reminder (7 Hari)"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBroadcastSubject("[NexusPOS] Pengumuman Pembaruan Sistem & Promo Perpanjangan");
              setBroadcastTitle("Pemberitahuan Khusus Mitra Retail NexusPOS");
              setBroadcastMessage("Yth. Pemilik Toko,\n\nKami menginformasikan bahwa sistem NexusPOS telah meluncurkan fitur sinkronisasi offline dan pencatatan IMEI terbaru. Dapatkan potongan 15% untuk perpanjangan paket tahunan sebelum akhir bulan ini.");
              setShowBroadcastModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Mail className="h-4 w-4" />
            <span>Broadcast Email</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            title="Buka Wizard Registrasi Tenant Lengkap dengan Pemilihan Template Katalog"
          >
            <Sparkles className="h-4 w-4" />
            <span>Registrasi Wizard</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-primary-600/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tenant</span>
          </button>
        </div>
      </div>

      {/* SUPERADMIN NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveSuperadminTab("TENANTS_LIST")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSuperadminTab === "TENANTS_LIST"
              ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Daftar Toko & Lisensi</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeSuperadminTab === "TENANTS_LIST"
              ? "bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400"
              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}>
            {tenants.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSuperadminTab("ACTIVITY_LOGS")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSuperadminTab === "ACTIVITY_LOGS"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Audit Log Lintas Tenant</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono">
            Global
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSuperadminTab("DATA_EXPORT")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSuperadminTab === "DATA_EXPORT"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Backup & Ekspor Terenkripsi</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono">
            AES-256
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSuperadminTab("SECURITY_HEALTH")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSuperadminTab === "SECURITY_HEALTH"
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Kesehatan & Keamanan Sistem</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono">
            Active
          </span>
        </button>
      </div>

      {/* REAL-TIME STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tenants */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Tenant</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-mono">
            {stats?.totalTenants ?? tenants.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Toko terdaftar di platform</p>
        </div>

        {/* Active Tenants */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Tenant Aktif
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {stats?.activeTenants ?? tenants.filter(t => t.status === "ACTIVE").length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Lisensi berjalan normal</p>
        </div>

        {/* Trial Tenants */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Masa Trial (Uji Coba)
            </span>
            <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-2 font-mono">
            {stats?.trialTenants ?? tenants.filter(t => t.status === "TRIAL").length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Potensi upgrade ke Pro</p>
        </div>

        {/* Expiring Soon (<= 7 Days) */}
        <div className="bg-amber-50/70 dark:bg-amber-950/20 p-5 rounded-3xl border border-amber-200 dark:border-amber-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Jatuh Tempo &lt;= 7 Hari
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-2 font-mono">
            {stats?.expiringSoon7Days ?? urgentTenants.length}
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/70 mt-1">Butuh pengingat perpanjangan</p>
        </div>

        {/* Expired Tenants */}
        <div className="bg-rose-50/70 dark:bg-rose-950/20 p-5 rounded-3xl border border-rose-200 dark:border-rose-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Kedaluwarsa (Expired)
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-2 font-mono">
            {stats?.expiredTenants ?? tenants.filter(t => t.status === "EXPIRED").length}
          </div>
          <p className="text-[11px] text-rose-800/80 dark:text-rose-300/70 mt-1">Akses POS ditangguhkan</p>
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeSuperadminTab === "TENANTS_LIST" && (
        <div className="space-y-6">
          {/* URGENT 7-DAY EXPIRATION ALERT BANNER */}
          {urgentTenants.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300 dark:border-amber-700 rounded-3xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shrink-0 mt-0.5">
                <BellRing className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Perhatian Superadmin: {urgentTenants.length} Tenant Memasuki Periode Kritis Jatuh Tempo (&le; 7 Hari)!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Toko:{" "}
                  {urgentTenants.map((t, idx) => (
                    <span key={t.id} className="font-bold text-amber-700 dark:text-amber-300">
                      {t.name} ({t.daysRemaining} hari){idx < urgentTenants.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  . Segera kirimkan notifikasi tagihan agar langganan tidak terputus.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={handleRunAutoReminders}
                disabled={isAutoRunning}
                className="w-full md:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Kirim Pengingat ke Semua ({urgentTenants.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari toko, slug, pemilik, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-800 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: "ALL", label: "Semua" },
              { id: "ACTIVE", label: "Aktif" },
              { id: "EXPIRING_SOON", label: "Jatuh Tempo" },
              { id: "TRIAL", label: "Trial" },
              { id: "EXPIRED", label: "Expired" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Plan Selector */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Paket</option>
            <option value="ENTERPRISE">Enterprise</option>
            <option value="PRO">Pro Bisnis</option>
            <option value="STARTER">Starter</option>
            <option value="TRIAL">Trial</option>
          </select>
        </div>
      </div>

      {/* TENANT TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-4 px-6">Toko & Slug</th>
                <th className="py-4 px-5">Pemilik & Kontak</th>
                <th className="py-4 px-4 text-center">Paket SaaS</th>
                <th className="py-4 px-5">Status & Sisa Waktu</th>
                <th className="py-4 px-4 text-center">Data & Transaksi</th>
                <th className="py-4 px-6 text-right">Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                    <span>Memuat daftar tenant dan status langganan...</span>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold">Tidak ada tenant yang cocok dengan filter.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau status.</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const expiryDateObj = new Date(t.subscriptionExpiry);
                  const expiryFormatted = expiryDateObj.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  });

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Toko & Slug */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center font-extrabold text-sm shrink-0">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                              {t.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {t.slug}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopySlug(t.slug)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                title="Salin Slug Toko"
                              >
                                {copiedSlug === t.slug ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pemilik & Kontak */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{t.ownerName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {t.ownerEmail}
                        </div>
                        {t.phone && t.phone !== "-" && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>📞 {t.phone}</span>
                            <a
                              href={`https://wa.me/${t.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline font-bold text-[10px]"
                            >
                              (WhatsApp)
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Paket SaaS */}
                      <td className="py-4 px-4 text-center">
                        <div>{renderPlanPill(t.subscriptionPlan)}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {t.isTrial ? "Mode Uji Coba" : "Berlangganan"}
                        </div>
                      </td>

                      {/* Status & Sisa Waktu */}
                      <td className="py-4 px-5">
                        <div className="mb-1">{renderStatusBadge(t.status, t.daysRemaining)}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Jatuh Tempo: <strong>{expiryFormatted}</strong></span>
                        </div>
                        {t.lastReminderSentAt && (
                          <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5">
                            ✉️ Reminder: {new Date(t.lastReminderSentAt).toLocaleDateString("id-ID")}
                          </div>
                        )}
                      </td>

                      {/* Data & Transaksi */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-center" title="Total Produk">
                            <span className="block font-mono font-bold text-slate-800 dark:text-slate-200">
                              {t.totalProducts ?? 0}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase font-extrabold">Item</span>
                          </div>
                          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                          <div className="text-center" title="Total Transaksi">
                            <span className="block font-mono font-bold text-slate-800 dark:text-slate-200">
                              {t.totalTransactions ?? 0}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase font-extrabold">Order</span>
                          </div>
                        </div>
                      </td>

                      {/* Aksi Superadmin */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send Reminder Email */}
                          <button
                            type="button"
                            onClick={() => openReminderModal(t)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition-all cursor-pointer"
                            title="Kirim Email Tagihan / Pengingat"
                          >
                            <Mail className="h-4 w-4" />
                          </button>

                          {/* Edit / Extend Subscription */}
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
                            title="Edit Paket / Perpanjang Masa Aktif"
                          >
                            <span>Kelola</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Menampilkan <strong>{filteredTenants.length}</strong> dari <strong>{tenants.length}</strong> tenant terdaftar.
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> &le; 7 Hari
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Trial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Expired
            </span>
          </div>
        </div>
      </div>
      </div>
      )}

      {/* TAB: ACTIVITY LOGS */}
      {activeSuperadminTab === "ACTIVITY_LOGS" && (
        <TenantActivityLog onRefreshStats={fetchTenantData} />
      )}

      {/* TAB: DATA EXPORT */}
      {activeSuperadminTab === "DATA_EXPORT" && (
        <TenantDataExport tenants={tenants} onRefreshTenants={fetchTenantData} />
      )}

      {/* TAB: SECURITY HEALTH */}
      {activeSuperadminTab === "SECURITY_HEALTH" && (
        <SecurityHealthReport tenants={tenants} onRefreshTenants={fetchTenantData} />
      )}

      {/* MODAL: BROADCAST EMAIL */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowBroadcastModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Broadcast Email ke Tenant
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kirim pengumuman, promosi perpanjangan, atau instruksi operasional massal.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                {/* Target group */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Penerima Email
                  </label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="ALL">Semua Mitra Toko ({tenants.length} Tenant)</option>
                    <option value="EXPIRING_SOON">
                      Tenant Jatuh Tempo Segera (&le; 7 Hari) ({urgentTenants.length} Toko)
                    </option>
                    <option value="TRIAL">Tenant Masa Trial ({tenants.filter(t => t.status === "TRIAL").length} Toko)</option>
                    <option value="EXPIRED">Tenant Kedaluwarsa ({tenants.filter(t => t.status === "EXPIRED").length} Toko)</option>
                    <option value="ACTIVE">Tenant Aktif Normal ({tenants.filter(t => t.status === "ACTIVE").length} Toko)</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subjek Email
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="Contoh: [NexusPOS] Pembaruan Modul Stok IMEI & Promo Akhir Tahun"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Header Konten (Opsional)
                  </label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Contoh: Penawaran Khusus Perpanjangan Paket Lisensi Toko"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Isi Pesan Broadcast
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Tuliskan isi pesan pengumuman atau instruksi di sini..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-sans"
                  />
                </div>

                {/* Action CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Label Tombol Aksi
                    </label>
                    <input
                      type="text"
                      value={broadcastActionText}
                      onChange={(e) => setBroadcastActionText(e.target.value)}
                      placeholder="Contoh: Perpanjang Paket Sekarang"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Tautan URL Tombol
                    </label>
                    <input
                      type="text"
                      value={broadcastActionUrl}
                      onChange={(e) => setBroadcastActionUrl(e.target.value)}
                      placeholder="https://nexuspos.id/renew"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isBroadcasting ? "Mengirimkan Broadcast..." : "Kirim Broadcast Massal"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: SEND SINGLE REMINDER EMAIL */}
      <AnimatePresence>
        {showReminderModal && selectedTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowReminderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Kirim Email Pengingat Tagihan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kirim surat tagihan resmi ke pemilik toko {selectedTenant.name}.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Target info preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Toko:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedTenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Pemilik:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedTenant.ownerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paket & Status:</span>
                  <span>{renderStatusBadge(selectedTenant.status, selectedTenant.daysRemaining)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Jatuh Tempo:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {new Date(selectedTenant.subscriptionExpiry).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan / Pesan Khusus dari Superadmin
                </label>
                <textarea
                  rows={4}
                  value={customReminderNote}
                  onChange={(e) => setCustomReminderNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 leading-relaxed"
                  placeholder="Tambahkan pesan spesifik atau penawaran perpanjangan..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={isSendingReminder}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSendingReminder ? "Mengirim Email..." : "Kirim Email Sekarang"}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT / EXTEND SUBSCRIPTION */}
      <AnimatePresence>
        {showEditModal && selectedTenant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 overflow-hidden my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Kelola Lisensi: {selectedTenant.name}
                    </h3>
                    <p className="text-xs text-slate-500">Perpanjang masa aktif, ubah paket SaaS, atau atur status tenant.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Plan Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Pilihan Paket SaaS
                    </label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                    >
                      <option value="ENTERPRISE">ENTERPRISE (Multi-Outlet & Unlimited)</option>
                      <option value="PRO">PRO BISNIS (Fitur Lengkap POS & IMEI)</option>
                      <option value="STARTER">STARTER (1 Outlet Standar)</option>
                      <option value="TRIAL">TRIAL (Uji Coba Gratis)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mode Uji Coba (Trial)
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={editIsTrial}
                          onChange={(e) => setEditIsTrial(e.target.checked)}
                          className="h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                        />
                        <span>Tandai sebagai Masa Uji Coba</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Quick Extend Options */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Perpanjang Cepat Masa Aktif (+ Hari)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { days: 7, label: "+7 Hari" },
                      { days: 14, label: "+14 Hari (Trial)" },
                      { days: 30, label: "+30 Hari (1 Bln)" },
                      { days: 365, label: "+1 Tahun (365 Hr)" }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.days}
                        onClick={() => {
                          setEditExtendDays(opt.days);
                          setEditCustomExpiry("");
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                          editExtendDays === opt.days
                            ? "bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 border-primary-500 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Pick */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Atau Tetapkan Tanggal Jatuh Tempo Pasti
                  </label>
                  <input
                    type="date"
                    value={editCustomExpiry}
                    onChange={(e) => {
                      setEditCustomExpiry(e.target.value);
                      setEditExtendDays("");
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Owner details update */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nama Pemilik
                    </label>
                    <input
                      type="text"
                      value={editOwnerName}
                      onChange={(e) => setEditOwnerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Email Pemilik (Tagihan)
                    </label>
                    <input
                      type="email"
                      value={editOwnerEmail}
                      onChange={(e) => setEditOwnerEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Phone & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      No. Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Status Akun Tenant
                    </label>
                    <select
                      value={editIsActive ? "ACTIVE" : "SUSPENDED"}
                      onChange={(e) => setEditIsActive(e.target.value === "ACTIVE")}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="ACTIVE">Aktif (Dapat Login & Akses POS)</option>
                      <option value="SUSPENDED">Ditangguhkan / Kunci Akses</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Catatan Internal Superadmin
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Contoh: Toko upgrade ke Pro via transfer Bank BCA invoice #8891"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-primary-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE / REGISTER NEW TENANT */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 overflow-hidden my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary-50 dark:bg-primary-950/50 rounded-xl text-primary-600 dark:text-primary-400">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Tambah Toko Tenant Baru
                    </h3>
                    <p className="text-xs text-slate-500">Daftarkan toko retail baru dengan database terisolasi.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Toko
                    </label>
                    <input
                      type="text"
                      required
                      value={createName}
                      onChange={(e) => {
                        setCreateName(e.target.value);
                        if (!createSlug) {
                          setCreateSlug(
                            e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)
                          );
                        }
                      }}
                      placeholder="Contoh: Sentral Ponsel Medan"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ID Slug Toko
                    </label>
                    <input
                      type="text"
                      required
                      value={createSlug}
                      onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_"))}
                      placeholder="sentral_ponsel_medan"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Pemilik / PIC
                    </label>
                    <input
                      type="text"
                      required
                      value={createOwnerName}
                      onChange={(e) => setCreateOwnerName(e.target.value)}
                      placeholder="Ricky Commedan"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Pemilik (Login)
                    </label>
                    <input
                      type="email"
                      required
                      value={createOwnerEmail}
                      onChange={(e) => setCreateOwnerEmail(e.target.value)}
                      placeholder="owner@toko.com"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Password Login Admin
                    </label>
                    <input
                      type="text"
                      required
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Admin#2026!"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No. Telepon / WA
                    </label>
                    <input
                      type="text"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Paket Pendaftaran
                    </label>
                    <select
                      value={createPlan}
                      onChange={(e) => setCreatePlan(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="PRO">PRO BISNIS (Rekomendasi)</option>
                      <option value="ENTERPRISE">ENTERPRISE (Multi-Cabang)</option>
                      <option value="STARTER">STARTER</option>
                      <option value="TRIAL">TRIAL (Uji Coba)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Masa Aktif Awal (Hari)
                    </label>
                    <input
                      type="number"
                      value={createTrialDays}
                      onChange={(e) => setCreateTrialDays(Number(e.target.value))}
                      placeholder="14"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTenant}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-primary-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingTenant ? "Mendaftarkan..." : "Daftarkan Tenant"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: SELF-SERVICE & SUPERADMIN REGISTRATION WIZARD */}
      <TenantRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={(newTenant) => {
          showToast(`Tenant '${newTenant?.name || "baru"}' berhasil didaftarkan via Wizard!`, "success");
          fetchTenantData();
        }}
      />
    </div>
  );
}
