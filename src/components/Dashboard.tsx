import { apiFetch, safeResponseJson, fetchJson } from '../lib/api';
import React, { useState, useEffect, useMemo } from "react";
import SalesPerformanceReport from "./SalesPerformanceReport";
import { AnimatePresence, motion } from "motion/react";
import { 
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  Banknote, 
  Smartphone, 
  RefreshCw, 
  AlertTriangle, 
  Database, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  ArrowRight,
  PlusCircle,
  Plus,
  Bell, 
  Mail, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  Sparkles,
  Percent,
  Megaphone,
  Tag,
  Zap,
  Play,
  Send,
  Coins,
  Printer,
  History,
  StickyNote,
  FileText,
  Users,
  Target,
  Edit3,
  Calendar,
  CalendarDays,
  Clock,
  Sliders,
  UserCheck,
  Download,
  LayoutGrid,
  BarChart3,
  Building2,
  PieChart as PieChartIcon
} from "lucide-react";
import { Product, Transaction, Buyback, BackupLog, SalesTarget, SuperadminSubscriptionStats } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// Reusable Growth Trend Sparkline SVG Component
function SparklineChart({ data, color = "#6366f1", height = 28 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * 100;
      const y = 88 - ((val - min) / range) * 72; // keep 10% padding
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const cleanColor = color.replace("#", "");
  const gradientId = `spark-grad-${cleanColor}-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="w-20 sm:w-24 shrink-0 relative overflow-hidden" style={{ height: `${height}px` }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill={`url(#${gradientId})`} />
        <polyline fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    </div>
  );
}

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  buybacks: Buyback[];
  userRole: string;
  currentUser?: any;
  onNavigate?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
}

export default function Dashboard({ products, transactions, buybacks, userRole, currentUser, onNavigate, onTabChange }: DashboardProps) {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [activePromosCount, setActivePromosCount] = useState<number>(0);
  const [midtransConfig, setMidtransConfig] = useState({
    clientKey: "SB-Mid-client-W_k8sH-j4",
    serverKey: "SB-Mid-server-x8K2fL-p9",
    isProduction: false
  });
  const [showConfigSuccess, setShowConfigSuccess] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toastNotification, setToastNotification] = useState<any | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [migrationRequests, setMigrationRequests] = useState<any[]>([]);

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("app_purchase_orders");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [salesTargets, setSalesTargets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [dashboardSuppliers, setDashboardSuppliers] = useState<any[]>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingTargets, setEditingTargets] = useState<{ userId: string, amount: number }[]>([]);

  const [storeAccent, setStoreAccent] = useState(() => localStorage.getItem("storeAccent") || "blue");
  
  // New features state
  const [shiftNote, setShiftNote] = useState(() => localStorage.getItem("dashboardShiftNote") || "");
  // Date Range Filter state for Dashboard
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [dashboardDatePreset, setDashboardDatePreset] = useState<"all" | "today" | "this_week" | "this_month" | "custom">("all");
  const [printStartDate, setPrintStartDate] = useState("");
  const [printEndDate, setPrintEndDate] = useState("");

  // Monthly Target state for Manager
  const [monthlyTargetAmount, setMonthlyTargetAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("monthlyRevenueTarget");
      return saved ? Number(saved) : 100000000; // Default Rp 100 Juta
    } catch {
      return 100000000;
    }
  });

  const [monthlyUnitTargetAmount, setMonthlyUnitTargetAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("monthlyUnitTarget");
      return saved ? Number(saved) : 30; // Default 30 Unit Smartphone
    } catch {
      return 30;
    }
  });

  const [showMonthlyTargetModal, setShowMonthlyTargetModal] = useState(false);
  const [targetInputVal, setTargetInputVal] = useState("");
  const [unitTargetInputVal, setUnitTargetInputVal] = useState("");

  // Target Penjualan Kategori Produk States
  const DEFAULT_CATEGORY_TARGETS: Record<string, number> = {
    "iPhone": 50000000,
    "Android": 35000000,
    "Aksesoris": 15000000,
    "Sparepart & Service": 8000000,
    "Tablet & Laptop": 12000000
  };

  const [categoryTargets, setCategoryTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`category_targets_${currentMonthStr}`);
      if (saved) return JSON.parse(saved);
      const fallback = localStorage.getItem("category_targets");
      if (fallback) return JSON.parse(fallback);
    } catch {
      // fallback
    }
    return DEFAULT_CATEGORY_TARGETS;
  });

  const [showCategoryTargetModal, setShowCategoryTargetModal] = useState(false);
  const [editingCategoryTargets, setEditingCategoryTargets] = useState<Record<string, number>>({});
  const [targetViewMode, setTargetViewMode] = useState<"employee" | "category" | "report">("employee");
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`category_targets_${currentMonthStr}`, JSON.stringify(categoryTargets));
      localStorage.setItem("category_targets", JSON.stringify(categoryTargets));
    } catch (e) {}
  }, [categoryTargets, currentMonthStr]);

  useEffect(() => {
    localStorage.setItem("monthlyRevenueTarget", monthlyTargetAmount.toString());
  }, [monthlyTargetAmount]);

  useEffect(() => {
    localStorage.setItem("monthlyUnitTarget", monthlyUnitTargetAmount.toString());
  }, [monthlyUnitTargetAmount]);

  useEffect(() => {
    localStorage.setItem("storeAccent", storeAccent);
  }, [storeAccent]);

  useEffect(() => {
    localStorage.setItem("dashboardShiftNote", shiftNote);
  }, [shiftNote]);

  // State for monthly smartphone chart view mode
  const [smartphoneMetricView, setSmartphoneMetricView] = useState<"units" | "revenue">("units");
  const [revenueTrendPeriod, setRevenueTrendPeriod] = useState<"DAILY" | "WEEKLY">("DAILY");

  // Layout Optimizer constants & states
  const DEFAULT_MODULE_FREQUENCIES: Record<string, number> = {
    kpi_metrics: 85,
    low_stock_banner: 75,
    targets_employee: 60,
    smartphone_trend_12m: 70,
    daily_sales_30d: 65,
    category_profitability: 68,
    brand_sticky_notes: 40,
    cashier_leaderboard: 50,
    ai_promo_optimizer: 45,
    store_budget_config: 30,
    system_logs: 25,
    whatsapp_config: 20,
    cloud_backup_midtrans: 18
  };

  const DASHBOARD_MODULE_METADATA = [
    { id: "kpi_metrics", name: "Ringkasan KPI & Omzet Utama", category: "Analitik" },
    { id: "low_stock_banner", name: "Peringatan Batas Minimum Stok", category: "Operasional" },
    { id: "targets_employee", name: "Target Karyawan & Sales Performance", category: "Kinerja Sales" },
    { id: "smartphone_trend_12m", name: "Grafik Tren Penjualan Smartphone 12 Bulan", category: "Analitik" },
    { id: "daily_sales_30d", name: "Grafik Penjualan Harian 30 Hari & Rata-rata", category: "Analitik" },
    { id: "category_profitability", name: "Profitabilitas Per Kategori (Donut Chart)", category: "Analitik" },
    { id: "brand_sticky_notes", name: "Rasio Merek HP & Catatan Shift Operasional", category: "Operasional" },
    { id: "cashier_leaderboard", name: "Target Penjualan Bulanan & Leaderboard", category: "Kinerja Sales" },
    { id: "ai_promo_optimizer", name: "AI Promo & Pricing Optimizer", category: "Marketing & AI" },
    { id: "system_logs", name: "Ringkasan Aktivitas Sistem POS", category: "Operasional" },
    { id: "store_budget_config", name: "Target Omzet Toko & Budgeting", category: "Manajemen" },
    { id: "whatsapp_config", name: "Integrasi WhatsApp & Email Automation", category: "Sistem & Integrasi" },
    { id: "cloud_backup_midtrans", name: "Cloud Backup & Payment Gateway Midtrans", category: "Sistem & Integrasi" },
  ];

  const [isLayoutOptimizerActive, setIsLayoutOptimizerActive] = useState<boolean>(() => {
    const saved = localStorage.getItem("isLayoutOptimizerActive");
    return saved !== null ? saved === "true" : true;
  });

  const [moduleUsageCounts, setModuleUsageCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("dashboard_module_usage_counts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_MODULE_FREQUENCIES;
  });

  const [showLayoutOptimizerModal, setShowLayoutOptimizerModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("isLayoutOptimizerActive", isLayoutOptimizerActive.toString());
  }, [isLayoutOptimizerActive]);

  useEffect(() => {
    localStorage.setItem("dashboard_module_usage_counts", JSON.stringify(moduleUsageCounts));
  }, [moduleUsageCounts]);

  const incrementModuleUsage = (moduleId: string) => {
    setModuleUsageCounts(prev => ({
      ...prev,
      [moduleId]: (prev[moduleId] || 0) + 1
    }));
  };

  const orderedModuleIds = React.useMemo(() => {
    const allIds = DASHBOARD_MODULE_METADATA.map(m => m.id);
    if (!isLayoutOptimizerActive) {
      return allIds; // default static order
    }
    return [...allIds].sort((a, b) => (moduleUsageCounts[b] || 0) - (moduleUsageCounts[a] || 0));
  }, [isLayoutOptimizerActive, moduleUsageCounts]);


  // WhatsApp configuration & message logs states
  const [waConfig, setWaConfig] = useState({
    instanceId: "WA-NEXUS-2026",
    token: "token_nexus_9981a",
    gateway: "FoneWA MPWA",
    isConnected: true
  });
  const [waLogs, setWaLogs] = useState<any[]>([]);
  const [waSuccess, setWaSuccess] = useState(false);

  // AI Promo Simulation & Forecaster states
  const [promoType, setPromoType] = useState("CASHBACK");
  const [targetBrand, setTargetBrand] = useState("All");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  // CRM Campaign Launch states
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState<number | null>(null);
  const [editableTemplate, setEditableTemplate] = useState("");

  // Superadmin SaaS Statistics & Reminder automation states
  const [superadminStats, setSuperadminStats] = useState<SuperadminSubscriptionStats | null>(null);
  const [isLoadingSuperadminStats, setIsLoadingSuperadminStats] = useState(false);
  const [autoReminderRan, setAutoReminderRan] = useState(false);

  const fetchSuperadminStats = async () => {
    try {
      setIsLoadingSuperadminStats(true);
      const res = await apiFetch("/api/superadmin/subscription-stats");
      if (res.ok) {
        const data = await res.json();
        setSuperadminStats(data);
      }
    } catch (e) {
      console.error("Error fetching superadmin subscription stats:", e);
    } finally {
      setIsLoadingSuperadminStats(false);
    }
  };

  useEffect(() => {
    fetchSuperadminStats();
    if (!autoReminderRan) {
      apiFetch("/api/tenants/admin/auto-trigger-reminders", { method: "POST" })
        .then(r => r.json())
        .then(() => setAutoReminderRan(true))
        .catch(err => console.error("Error auto-triggering reminders:", err));
    }
  }, []);

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSimulating(true);
    setLaunchSuccess(null);
    
    let customConfig = null;
    try {
      const saved = localStorage.getItem("fonepos_ai_config");
      if (saved) {
        customConfig = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const res = await apiFetch("/api/promo/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoType, discountPercent, targetBrand, customConfig }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data);
        setEditableTemplate(data.whatsappTemplate);
      }
    } catch (err) {
      console.error("Gagal menjalankan simulasi promo:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!simulationResult) return;
    setIsLaunching(true);
    try {
      const res = await apiFetch("/api/promo/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoType,
          targetBrand,
          discountPercent,
          messageTemplate: editableTemplate
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLaunchSuccess(data.count);
        fetchDashboardData(); // Update WA Logs in UI
        setTimeout(() => setLaunchSuccess(null), 8000);
      }
    } catch (err) {
      console.error("Gagal meluncurkan promo campaign:", err);
    } finally {
      setIsLaunching(false);
    }
  };

  // Fetch Backups, Midtrans, WhatsApp, and Notifications from server
  const fetchDashboardData = async () => {
    try {
      const targetData = await fetchJson<any[]>("/api/targets");
      if (Array.isArray(targetData)) {
        setSalesTargets(targetData);
      }

      try {
        const savedPOs = localStorage.getItem("app_purchase_orders");
        if (savedPOs) setPurchaseOrders(JSON.parse(savedPOs));
      } catch (e) {}

      const empData = await fetchJson<any[]>("/api/employees");
      if (Array.isArray(empData)) {
        setEmployees(empData);
      }

      const bData = await fetchJson<any[]>("/api/backup/logs");
      if (Array.isArray(bData)) {
        setBackups(bData);
      }

      const mData = await fetchJson<any>("/api/midtrans/config");
      if (mData && mData.clientKey) {
        setMidtransConfig(prev => ({
          ...prev,
          clientKey: mData.clientKey,
          isProduction: mData.isProduction
        }));
      }

      // Fetch WhatsApp Config and Logs
      const waData = await fetchJson<any>("/api/whatsapp/config");
      if (waData) {
        if (waData.config) {
          setWaConfig(waData.config);
        }
        if (waData.logs && Array.isArray(waData.logs)) {
          setWaLogs(waData.logs);
        }
      }

      const nData = await fetchJson<any[]>("/api/notifications");
      if (Array.isArray(nData)) {
        setNotifications(prev => {
          if (prev && prev.length > 0 && nData.length > prev.length) {
            const currentIds = new Set(prev.map((n: any) => n.id));
            const newNotifs = nData.filter((n: any) => !currentIds.has(n.id));
            const activeAlert = newNotifs.find((n: any) => n.type === "STOCK_ALERT" || n.type.startsWith("STOCK_ALERT_") || n.type === "MIGRATION_STATUS_CHANGE");
            if (activeAlert) {
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.15);
              } catch (_) {}
              setToastNotification(activeAlert);
              setTimeout(() => setToastNotification(null), 8000);
            }
          }
          return nData;
        });
      }

      // Fetch Migration Requests for Admin Notification Badges
      const migData = await fetchJson<any[]>("/api/migration-requests");
      if (Array.isArray(migData)) {
        setMigrationRequests(migData);
      }

      // Fetch Suppliers for Debt Due Date Reminders
      const splData = await fetchJson<any[]>("/api/suppliers");
      if (Array.isArray(splData)) {
        setDashboardSuppliers(splData);
      }
      
      const actData = await fetchJson<any[]>("/api/employees/activities");
      if (Array.isArray(actData)) {
        setRecentActivities(actData.slice(0, 5));
      }
    } catch (err: any) {
      if (err?.message && err.message !== "Failed to fetch") {
        console.warn("Info sinkronisasi data dasbor:", err);
      }
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, [products, transactions, buybacks]);

  
  // Target Penjualan Calculation
  const currentTargets = salesTargets.filter((t: any) => t.month === currentMonthStr);
  const salesPerUser: Record<string, number> = {};
  
  transactions.forEach(t => {
    if (t.paymentStatus === "PAID" && t.date.startsWith(currentMonthStr)) {
      if (!salesPerUser[t.cashierId]) {
        salesPerUser[t.cashierId] = 0;
      }
      salesPerUser[t.cashierId] += t.totalAmount;
    }
  });

  const debtReminders = useMemo(() => {
    if (!dashboardSuppliers || dashboardSuppliers.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dashboardSuppliers
      .map((s: any) => {
        const remDebt = s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
        if (remDebt <= 0) return null;

        let diffDays = 999;
        if (s.debtDueDate) {
          const due = new Date(s.debtDueDate);
          due.setHours(0, 0, 0, 0);
          diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          supplier: s,
          remainingDebt: remDebt,
          dueDate: s.debtDueDate || "",
          diffDays
        };
      })
      .filter((item: any) => item !== null && item.diffDays <= 7)
      .sort((a: any, b: any) => a.diffDays - b.diffDays);
  }, [dashboardSuppliers]);

  const handleSaveTargets = async () => {
    try {
      const res = await apiFetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targets: editingTargets.map(t => ({
            userId: t.userId,
            month: currentMonthStr,
            targetAmount: t.amount
          }))
        })
      });
      if (res.ok) {
        setShowTargetModal(false);
        fetchDashboardData();
      }
    } catch (e) {
      console.error("Failed to save targets", e);
    }
  };

  // Handle configuration submit
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch("/api/midtrans/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(midtransConfig),
      });
      const data = await response.json();
      if (data.success) {
        setShowConfigSuccess(true);
        setTimeout(() => setShowConfigSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle WhatsApp gateway configuration submit
  const handleSaveWaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waConfig),
      });
      const data = await response.json();
      if (data.success) {
        setWaSuccess(true);
        setTimeout(() => setWaSuccess(false), 3000);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger manual cloud backup simulation
  const handleTriggerBackup = async () => {
    setIsBackupLoading(true);
    try {
      const response = await apiFetch("/api/backup/trigger", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        // Reload backup logs
        const bRes = await apiFetch("/api/backup/logs");
        const bData = await bRes.json();
        setBackups(bData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const applyDashboardDateFilter = (dateString: string) => {
    if (!dateString) return true;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return true;

    if (dashboardDatePreset === "custom" || printStartDate || printEndDate) {
      if (printStartDate) {
        const startD = new Date(printStartDate);
        startD.setHours(0, 0, 0, 0);
        if (d < startD) return false;
      }
      if (printEndDate) {
        const endD = new Date(printEndDate);
        endD.setHours(23, 59, 59, 999);
        if (d > endD) return false;
      }
      return true;
    }

    if (dashboardDatePreset === "all") return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dashboardDatePreset === "today") {
      return d >= today;
    } else if (dashboardDatePreset === "this_week") {
      const dayOfWeek = today.getDay();
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      return d >= firstDay;
    } else if (dashboardDatePreset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return d >= firstDay;
    }
    return true;
  };

  const applyEmployeeFilter = (t: Transaction) => {
    if (selectedEmployeeId === "ALL") return true;
    if (t.cashierId === selectedEmployeeId) return true;
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (emp && (t.cashierName === emp.name || t.cashierId === emp.username)) return true;
    return false;
  };

  const applyEmployeeBuybackFilter = (b: Buyback) => {
    if (selectedEmployeeId === "ALL") return true;
    if ((b as any).cashierId === selectedEmployeeId) return true;
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (emp && ((b as any).cashierName === emp.name || (b as any).cashierId === emp.username)) return true;
    return false;
  };

  // Filter data by date range preset, custom date inputs, and selected employee
  const filteredTransactions = transactions
    .filter(t => applyDashboardDateFilter(t.date))
    .filter(t => applyEmployeeFilter(t));
    
  const filteredBuybacks = buybacks
    .filter(b => applyDashboardDateFilter(b.date))
    .filter(b => applyEmployeeBuybackFilter(b));

  // Target Bulanan Calculations
  const currentMonthName = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const currentMonthPaidTransactions = transactions
    .filter(t => t.paymentStatus === "PAID" && t.date && t.date.startsWith(currentMonthStr));

  const currentMonthTotalRevenue = currentMonthPaidTransactions
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const currentMonthSoldUnits = currentMonthPaidTransactions
    .reduce((sum, t) => sum + (t.items ? t.items.length : 0), 0);

  const targetAchievedPercent = monthlyTargetAmount > 0
    ? Math.round((currentMonthTotalRevenue / monthlyTargetAmount) * 1000) / 10
    : 0;

  const unitTargetAchievedPercent = monthlyUnitTargetAmount > 0
    ? Math.round((currentMonthSoldUnits / monthlyUnitTargetAmount) * 1000) / 10
    : 0;

  const remainingTarget = Math.max(monthlyTargetAmount - currentMonthTotalRevenue, 0);
  const remainingUnitTarget = Math.max(monthlyUnitTargetAmount - currentMonthSoldUnits, 0);

  // Run-Rate Projection & Daily Required Stats
  const targetDateNow = new Date();
  const currentDayOfMonth = targetDateNow.getDate();
  const totalDaysInMonth = new Date(targetDateNow.getFullYear(), targetDateNow.getMonth() + 1, 0).getDate();
  const remainingDaysInMonth = Math.max(totalDaysInMonth - currentDayOfMonth, 1);

  const projectedRevenue = currentDayOfMonth > 0 ? Math.round((currentMonthTotalRevenue / currentDayOfMonth) * totalDaysInMonth) : 0;
  const projectedRevenuePercent = monthlyTargetAmount > 0 ? Math.round((projectedRevenue / monthlyTargetAmount) * 100) : 0;

  const dailyRevenueNeeded = remainingTarget > 0 ? Math.ceil(remainingTarget / remainingDaysInMonth) : 0;
  const dailyUnitsNeeded = remainingUnitTarget > 0 ? Math.ceil(remainingUnitTarget / remainingDaysInMonth) : 0;

  // KPI Calculations
  const totalRevenue = filteredTransactions
    .filter(t => t.paymentStatus === "PAID")
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalBuybackCost = filteredBuybacks
    .reduce((sum, b) => sum + b.priceBuy, 0);

  // Estimasi HPP dari barang baru yang terjual + barang bekas yang dibeli lalu terjual
  let hppEstimated = 0;
  filteredTransactions.filter(t => t.paymentStatus === "PAID").forEach(t => {
    t.items.forEach(item => {
      // Find purchase cost
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        hppEstimated += prod.priceBuy;
      } else {
        // Fallback default
        hppEstimated += Math.floor(item.priceSell * 0.85);
      }
    });
  });

  const netProfit = totalRevenue - hppEstimated;

  const lowStockCount = products.filter(p => p.stock <= p.minStockAlert).length;
  const totalItemsCount = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalInventoryCost = products.reduce((sum, p) => sum + ((p.priceBuy ?? 0) * (p.stock ?? 0)), 0);
  const totalInventoryRetail = products.reduce((sum, p) => sum + ((p.priceSell ?? 0) * (p.stock ?? 0)), 0);

  // Brand sales ratio
  const brandSales: Record<string, number> = {};
  filteredTransactions.filter(t => t.paymentStatus === "PAID").forEach(t => {
    t.items.forEach(item => {
      brandSales[item.brand] = (brandSales[item.brand] || 0) + 1;
    });
  });

  const maxBrandSales = Math.max(...Object.values(brandSales), 1);

  // Prepare daily sales chart data
  const dailySales: Record<string, number> = {};
  filteredTransactions.filter(t => t.paymentStatus === "PAID").forEach(t => {
    const dateStr = new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    dailySales[dateStr] = (dailySales[dateStr] || 0) + t.totalAmount;
  });

  const chartDays = Object.keys(dailySales).slice(-7); // Last 7 days
  const chartValues = chartDays.map(day => dailySales[day]);
  const maxChartValue = Math.max(...chartValues, 1000000);

  // Recharts weekly daily transaction revenue & volume comparison data
  const currentWeekChartData = React.useMemo(() => {
    const days: { day: string; dateStr: string; Revenue: number; Profit: number; Transactions: number; Volume: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
      
      let dayRev = 0;
      let dayProfit = 0;
      let dayCount = 0;
      let dayVol = 0;
      
      filteredTransactions.forEach(t => {
        if (t.paymentStatus === "PAID" && t.date.startsWith(dateKey)) {
          dayRev += t.totalAmount;
          dayCount += 1;
          t.items.forEach(item => {
            const qty = item.quantity || 1;
            dayVol += qty;
            const prod = products.find(p => p.id === item.productId);
            const hpp = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
            dayProfit += ((item.priceSell - hpp) * qty);
          });
        }
      });

      days.push({
        day: dayLabel,
        dateStr: dateKey,
        Revenue: dayRev,
        Profit: dayProfit,
        Transactions: dayCount,
        Volume: dayVol
      });
    }
    return days;
  }, [filteredTransactions, products]);

  // Recharts Daily Revenue Trend Data (Last 14 days)
  const dailyRevenueLineData = React.useMemo(() => {
    const data: { label: string; dateStr: string; Revenue: number; Profit: number; Transactions: number; Target: number }[] = [];
    const today = new Date();
    const dailyTarget = Math.round((monthlyTargetAmount || 150000000) / 30);

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      let rev = 0;
      let profit = 0;
      let txCount = 0;

      filteredTransactions.forEach((t) => {
        if (t.paymentStatus === "PAID" && t.date && t.date.startsWith(dateKey)) {
          rev += t.totalAmount;
          txCount += 1;
          t.items.forEach((item) => {
            const qty = item.quantity || 1;
            const prod = products.find((p) => p.id === item.productId);
            const hpp = prod ? prod.priceBuy : Math.floor((item.priceSell || 0) * 0.85);
            profit += (item.priceSell - hpp) * qty;
          });
        }
      });

      data.push({
        label,
        dateStr: dateKey,
        Revenue: rev,
        Profit: profit,
        Transactions: txCount,
        Target: dailyTarget,
      });
    }
    return data;
  }, [filteredTransactions, products, monthlyTargetAmount]);

  // Recharts Weekly Revenue Trend Data (Last 8 weeks)
  const weeklyRevenueLineData = React.useMemo(() => {
    const weeks: { label: string; dateStr: string; Revenue: number; Profit: number; Transactions: number; Target: number }[] = [];
    const today = new Date();
    const weeklyTarget = Math.round((monthlyTargetAmount || 150000000) / 4);

    for (let i = 7; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(today.getDate() - i * 7 - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Sunday

      const startStr = start.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];
      const label = `Minggu ${8 - i}`;
      const rangeLabel = `${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;

      let rev = 0;
      let profit = 0;
      let txCount = 0;

      filteredTransactions.forEach((t) => {
        if (t.paymentStatus === "PAID" && t.date) {
          const tDate = t.date.split("T")[0];
          if (tDate >= startStr && tDate <= endStr) {
            rev += t.totalAmount;
            txCount += 1;
            t.items.forEach((item) => {
              const qty = item.quantity || 1;
              const prod = products.find((p) => p.id === item.productId);
              const hpp = prod ? prod.priceBuy : Math.floor((item.priceSell || 0) * 0.85);
              profit += (item.priceSell - hpp) * qty;
            });
          }
        }
      });

      weeks.push({
        label,
        dateStr: rangeLabel,
        Revenue: rev,
        Profit: profit,
        Transactions: txCount,
        Target: weeklyTarget,
      });
    }
    return weeks;
  }, [filteredTransactions, products, monthlyTargetAmount]);

  // Monthly smartphone sales trend data (12 months)
  const monthlySmartphoneChartData = React.useMemo(() => {
    const months: {
      month: string;
      fullMonthName: string;
      yearMonth: string;
      unitsTotal: number;
      unitsBaru: number;
      unitsBekas: number;
      revenue: number;
      profit: number;
    }[] = [];

    const now = new Date();
    // 12 months (11 months back to current month)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const yearMonth = `${year}-${String(monthNum).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      const fullMonthName = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

      let unitsTotal = 0;
      let unitsBaru = 0;
      let unitsBekas = 0;
      let revenue = 0;
      let profit = 0;

      // Filter transactions for this month
      transactions.forEach(t => {
        if (t.paymentStatus === "PAID" && t.date) {
          const tDate = new Date(t.date);
          const tYear = tDate.getFullYear();
          const tMonthNum = tDate.getMonth() + 1;
          const tYearMonth = `${tYear}-${String(tMonthNum).padStart(2, '0')}`;

          if (tYearMonth === yearMonth) {
            t.items.forEach(item => {
              const prod = products.find(p => p.id === item.productId);
              // Smartphone criteria: type BARU/BEKAS or has imei or category contains Smartphone/HP
              const isSmartphone = 
                item.type === "BARU" || 
                item.type === "BEKAS" || 
                !!item.imei || 
                (prod && (prod.category === "Smartphone" || prod.category?.toLowerCase().includes("hp") || prod.category?.toLowerCase().includes("smartphone")));

              if (isSmartphone) {
                unitsTotal += 1;
                if (item.type === "BEKAS") {
                  unitsBekas += 1;
                } else {
                  unitsBaru += 1;
                }
                revenue += (item.priceSell || 0);
                const hpp = prod ? prod.priceBuy : Math.floor((item.priceSell || 0) * 0.85);
                profit += ((item.priceSell || 0) - hpp);
              }
            });
          }
        }
      });

      months.push({
        month: monthLabel,
        fullMonthName,
        yearMonth,
        unitsTotal,
        unitsBaru,
        unitsBekas,
        revenue,
        profit
      });
    }

    return months;
  }, [transactions, products]);

  // Summary statistics for 12 months smartphone sales
  const smartphone12MonthSummary = React.useMemo(() => {
    const totalUnits = monthlySmartphoneChartData.reduce((sum, d) => sum + d.unitsTotal, 0);
    const totalBaru = monthlySmartphoneChartData.reduce((sum, d) => sum + d.unitsBaru, 0);
    const totalBekas = monthlySmartphoneChartData.reduce((sum, d) => sum + d.unitsBekas, 0);
    const totalRevenue = monthlySmartphoneChartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalProfit = monthlySmartphoneChartData.reduce((sum, d) => sum + d.profit, 0);
    const avgUnitsPerMonth = (totalUnits / 12).toFixed(1);

    // Peak month
    const peakMonthObj = monthlySmartphoneChartData.reduce((prev, curr) => (curr.unitsTotal > prev.unitsTotal ? curr : prev), monthlySmartphoneChartData[0] || { month: '-', unitsTotal: 0 });

    return {
      totalUnits,
      totalBaru,
      totalBekas,
      totalRevenue,
      totalProfit,
      avgUnitsPerMonth,
      peakMonth: peakMonthObj.month,
      peakUnits: peakMonthObj.unitsTotal
    };
  }, [monthlySmartphoneChartData]);

  // MoM Growth Metrics & Sparkline Trend comparison (Current Month vs Previous Month)
  const momGrowthData = React.useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-indexed

    const curMonthKey = `${curYear}-${String(curMonth + 1).padStart(2, "0")}`;

    const prevDate = new Date(curYear, curMonth - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();
    const prevMonthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;

    const calcNetProfitForTxs = (txs: typeof transactions) => {
      let rev = 0;
      let hpp = 0;
      txs.forEach(t => {
        rev += (t.totalAmount || 0);
        t.items?.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          hpp += prod ? prod.priceBuy : Math.floor((item.priceSell || 0) * 0.85);
        });
      });
      return rev - hpp;
    };

    // Current & previous month paid transactions
    const curTx = transactions.filter(t => t.paymentStatus === "PAID" && t.date && t.date.startsWith(curMonthKey));
    const prevTx = transactions.filter(t => t.paymentStatus === "PAID" && t.date && t.date.startsWith(prevMonthKey));

    const curRev = curTx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const prevRev = prevTx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const revGrowth = prevRev > 0 ? Math.round(((curRev - prevRev) / prevRev) * 1000) / 10 : (curRev > 0 ? 100 : 0);

    // Buybacks
    const curBb = buybacks.filter(b => b.date && b.date.startsWith(curMonthKey));
    const prevBb = buybacks.filter(b => b.date && b.date.startsWith(prevMonthKey));
    const curBbCost = curBb.reduce((sum, b) => sum + (b.priceBuy || 0), 0);
    const prevBbCost = prevBb.reduce((sum, b) => sum + (b.priceBuy || 0), 0);
    const bbGrowth = prevBbCost > 0 ? Math.round(((curBbCost - prevBbCost) / prevBbCost) * 1000) / 10 : (curBbCost > 0 ? 100 : 0);

    // Profit
    const curProfit = calcNetProfitForTxs(curTx);
    const prevProfit = calcNetProfitForTxs(prevTx);
    const profitGrowth = prevProfit > 0 ? Math.round(((curProfit - prevProfit) / prevProfit) * 1000) / 10 : (curProfit > 0 ? 100 : 0);

    // Sparklines for last 6 months
    const revSparkline: number[] = [];
    const bbSparkline: number[] = [];
    const profitSparkline: number[] = [];
    const stockUnitsSparkline: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const mTx = transactions.filter(t => t.paymentStatus === "PAID" && t.date && t.date.startsWith(mKey));
      const mBb = buybacks.filter(b => b.date && b.date.startsWith(mKey));

      const mRev = mTx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const mBbCost = mBb.reduce((sum, b) => sum + (b.priceBuy || 0), 0);
      const mProf = calcNetProfitForTxs(mTx);
      const mUnits = mTx.reduce((sum, t) => sum + (t.items ? t.items.length : 0), 0);

      revSparkline.push(mRev);
      bbSparkline.push(mBbCost);
      profitSparkline.push(mProf);
      stockUnitsSparkline.push(mUnits);
    }

    return {
      curRev,
      prevRev,
      revGrowth,
      revSparkline,
      curBbCost,
      prevBbCost,
      bbGrowth,
      bbSparkline,
      curProfit,
      prevProfit,
      profitGrowth,
      profitSparkline,
      stockUnitsSparkline
    };
  }, [transactions, buybacks, products]);

  // Category Profitability Data calculation for Donut Chart Widget
  const categoryProfitabilityData = React.useMemo(() => {
    let hpBaruRev = 0, hpBaruCost = 0;
    let hpBekasRev = 0, hpBekasCost = 0;
    let aksesorisRev = 0, aksesorisCost = 0;
    let sparepartRev = 0, sparepartCost = 0;

    filteredTransactions.filter(t => t.paymentStatus === "PAID").forEach(t => {
      (t.items || []).forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.name === item.name);
        const sell = item.priceSell || 0;
        let cost = prod ? (prod.priceBuy || 0) : Math.round(sell * 0.8);
        if (prod?.purchasedImeisHistory && item.imei) {
          const hist = prod.purchasedImeisHistory.find(h => h.imei === item.imei);
          if (hist && hist.purchasePrice) cost = hist.purchasePrice;
        }

        const itemType = (item.type || (prod ? prod.type : "BARU")) as string;
        const prodCategory = (prod?.category || "").toLowerCase();
        const nameLower = (item.name || "").toLowerCase();

        const isBaru = itemType === "BARU" || prodCategory.includes("baru") || prodCategory === "hp baru";
        const isBekas = itemType === "BEKAS" || prodCategory.includes("bekas") || prodCategory === "hp bekas";
        const isAksesoris = prodCategory.includes("aksesoris") || prodCategory.includes("accessories") || nameLower.includes("casing") || nameLower.includes("charger") || nameLower.includes("tempered") || nameLower.includes("headset") || nameLower.includes("cable") || nameLower.includes("kabel");

        if (isBaru) {
          hpBaruRev += sell;
          hpBaruCost += cost;
        } else if (isBekas) {
          hpBekasRev += sell;
          hpBekasCost += cost;
        } else if (isAksesoris) {
          aksesorisRev += sell;
          aksesorisCost += cost;
        } else {
          sparepartRev += sell;
          sparepartCost += cost;
        }
      });
    });

    let p1 = Math.max(0, hpBaruRev - hpBaruCost);
    let p2 = Math.max(0, hpBekasRev - hpBekasCost);
    let p3 = Math.max(0, aksesorisRev - aksesorisCost);
    let p4 = Math.max(0, sparepartRev - sparepartCost);
    let totalProf = p1 + p2 + p3 + p4;

    // Fallback estimation from product inventory if no paid transaction yet
    if (totalProf === 0 && products.length > 0) {
      products.forEach(p => {
        const sell = (p.priceSell || 0) * Math.max(1, p.stock || 1);
        const cost = (p.priceBuy || 0) * Math.max(1, p.stock || 1);
        const cat = (p.category || "").toLowerCase();
        if (p.type === "BARU" || cat.includes("baru")) {
          hpBaruRev += sell; hpBaruCost += cost;
        } else if (p.type === "BEKAS" || cat.includes("bekas")) {
          hpBekasRev += sell; hpBekasCost += cost;
        } else if (cat.includes("aksesoris")) {
          aksesorisRev += sell; aksesorisCost += cost;
        } else {
          sparepartRev += sell; sparepartCost += cost;
        }
      });
      p1 = Math.max(0, hpBaruRev - hpBaruCost);
      p2 = Math.max(0, hpBekasRev - hpBekasCost);
      p3 = Math.max(0, aksesorisRev - aksesorisCost);
      p4 = Math.max(0, sparepartRev - sparepartCost);
      totalProf = p1 + p2 + p3 + p4;
    }

    const denom = totalProf || 1;

    return [
      {
        category: "HP Baru",
        revenue: hpBaruRev,
        cost: hpBaruCost,
        profit: p1,
        marginPct: hpBaruRev > 0 ? ((p1 / hpBaruRev) * 100).toFixed(1) : "0.0",
        profitSharePct: ((p1 / denom) * 100).toFixed(1),
        color: "#10B981", // Emerald
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200"
      },
      {
        category: "HP Bekas",
        revenue: hpBekasRev,
        cost: hpBekasCost,
        profit: p2,
        marginPct: hpBekasRev > 0 ? ((p2 / hpBekasRev) * 100).toFixed(1) : "0.0",
        profitSharePct: ((p2 / denom) * 100).toFixed(1),
        color: "#F59E0B", // Amber
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200"
      },
      {
        category: "Aksesoris",
        revenue: aksesorisRev,
        cost: aksesorisCost,
        profit: p3,
        marginPct: aksesorisRev > 0 ? ((p3 / aksesorisRev) * 100).toFixed(1) : "0.0",
        profitSharePct: ((p3 / denom) * 100).toFixed(1),
        color: "#6366F1", // Indigo
        badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200"
      },
      {
        category: "Sparepart & Service",
        revenue: sparepartRev,
        cost: sparepartCost,
        profit: p4,
        marginPct: sparepartRev > 0 ? ((p4 / sparepartRev) * 100).toFixed(1) : "0.0",
        profitSharePct: ((p4 / denom) * 100).toFixed(1),
        color: "#8B5CF6", // Purple
        badgeBg: "bg-purple-50 text-purple-700 border-purple-200"
      }
    ];
  }, [filteredTransactions, products]);

  // New Summary metrics for today
  const todayDateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const totalSalesToday = dailySales[todayDateStr] || 0;
  
  let totalTransactionsToday = 0;
  let grossProfitToday = 0;
  let promoDiscountToday = 0;
  filteredTransactions.filter(t => t.paymentStatus === "PAID").forEach(t => {
    const dateStr = new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    if (dateStr === todayDateStr) {
      totalTransactionsToday += 1;
      promoDiscountToday += (t.promoDiscount || 0);
      t.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const itemHpp = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
        grossProfitToday += (item.priceSell - itemHpp);
      });
    }
  });

  // Calculation for Category Target Performance
  const categorySalesPerformance = React.useMemo(() => {
    const cats = Object.keys(categoryTargets);
    const result: Record<string, {
      category: string;
      targetAmount: number;
      realizedRevenue: number;
      unitsSold: number;
      achievementPct: number;
      shortfall: number;
      contributionPct: number;
      dailyPaceNeeded: number;
    }> = {};

    let totalRealized = 0;
    const totalCategoryTargetSum = Object.values(categoryTargets).reduce((a: number, b: number) => Number(a || 0) + Number(b || 0), 0);
    const remDays = Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate());

    // Initialize
    cats.forEach(c => {
      result[c] = {
        category: c,
        targetAmount: categoryTargets[c] || 0,
        realizedRevenue: 0,
        unitsSold: 0,
        achievementPct: 0,
        shortfall: 0,
        contributionPct: 0,
        dailyPaceNeeded: 0
      };
    });

    // Categorize paid transactions in current month
    currentMonthPaidTransactions.forEach(t => {
      (t.items || []).forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.name === item.name);
        const sellPrice = item.priceSell || 0;
        const brandLower = (item.brand || prod?.brand || "").toLowerCase();
        const catLower = (prod?.category || "").toLowerCase();
        const nameLower = (item.name || "").toLowerCase();

        let matchedCat = "Android";

        if (brandLower.includes("apple") || nameLower.includes("iphone") || catLower.includes("iphone") || catLower.includes("apple")) {
          matchedCat = "iPhone";
        } else if (
          catLower.includes("aksesoris") || catLower.includes("accessories") || 
          nameLower.includes("casing") || nameLower.includes("charger") || nameLower.includes("tempered") || 
          nameLower.includes("kabel") || nameLower.includes("cable") || nameLower.includes("headset") || nameLower.includes("powerbank")
        ) {
          matchedCat = "Aksesoris";
        } else if (
          catLower.includes("service") || catLower.includes("sparepart") || 
          nameLower.includes("lcd") || nameLower.includes("baterai") || nameLower.includes("servis")
        ) {
          matchedCat = "Sparepart & Service";
        } else if (
          catLower.includes("tablet") || catLower.includes("ipad") || catLower.includes("laptop") || nameLower.includes("macbook")
        ) {
          matchedCat = "Tablet & Laptop";
        } else {
          matchedCat = "Android";
        }

        if (!result[matchedCat]) {
          result[matchedCat] = {
            category: matchedCat,
            targetAmount: categoryTargets[matchedCat] || 0,
            realizedRevenue: 0,
            unitsSold: 0,
            achievementPct: 0,
            shortfall: 0,
            contributionPct: 0,
            dailyPaceNeeded: 0
          };
        }

        result[matchedCat].realizedRevenue += sellPrice;
        result[matchedCat].unitsSold += 1;
        totalRealized += sellPrice;
      });
    });

    // Final calculations per category
    const targetSum = Number(totalCategoryTargetSum) || 0;
    Object.keys(result).forEach(c => {
      const item = result[c];
      item.achievementPct = item.targetAmount > 0 ? Math.min(100, Math.round((item.realizedRevenue / item.targetAmount) * 100)) : (item.realizedRevenue > 0 ? 100 : 0);
      item.shortfall = Math.max(0, item.targetAmount - item.realizedRevenue);
      item.contributionPct = targetSum > 0 ? Math.round((item.targetAmount / targetSum) * 100) : 0;
      item.dailyPaceNeeded = item.shortfall > 0 ? Math.ceil(item.shortfall / remDays) : 0;
    });

    return {
      categoriesList: Object.values(result),
      totalCategoryTargetSum,
      totalRealized
    };
  }, [categoryTargets, currentMonthPaidTransactions, products, remainingDaysInMonth]);

  const handleDownloadPDF = async () => {
    setIsPdfGenerating(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const today = new Date().toLocaleDateString("id-ID", { dateStyle: "full" });
      const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
      const empFilterLabel = selectedEmployeeId === "ALL" ? "Semua Karyawan" : (selectedEmp?.name || "Karyawan Terpilih");
      const datePresetLabel = 
        dashboardDatePreset === "all" ? "Semua Waktu" :
        dashboardDatePreset === "today" ? "Hari Ini" :
        dashboardDatePreset === "this_week" ? "Minggu Ini" :
        dashboardDatePreset === "this_month" ? "Bulan Ini" :
        `Custom (${printStartDate || 'Awal'} s/d ${printEndDate || 'Akhir'})`;

      // 1. Header & Title Block
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 32, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SMARTPHONE POS & INVENTORY MANAGEMENT SYSTEM", 14, 14);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("LAPORAN RINGKASAN PERFORMANCE KPI, TARGET KATEGORI & DOKUMEN ARSIP MANAJER", 14, 22);

      // Meta Info Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 36, 182, 22, 3, 3, "FD");

      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.text("Tanggal Cetak:", 18, 44);
      doc.setFont("helvetica", "normal");
      doc.text(today, 45, 44);

      doc.setFont("helvetica", "bold");
      doc.text("Filter Periode:", 18, 52);
      doc.setFont("helvetica", "normal");
      doc.text(datePresetLabel, 45, 52);

      doc.setFont("helvetica", "bold");
      doc.text("Filter Karyawan:", 115, 44);
      doc.setFont("helvetica", "normal");
      doc.text(empFilterLabel, 145, 44);

      doc.setFont("helvetica", "bold");
      doc.text("Pencapaian Target Toko:", 115, 52);
      doc.setFont("helvetica", "normal");
      doc.text(`${targetAchievedPercent}% (${remainingTarget > 0 ? 'Sisa Rp ' + remainingTarget.toLocaleString("id-ID") : 'Tercapai 100% 🎉'})`, 155, 52);

      // Section 1: KPI Summary Table
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("1. Ringkasan Indikator Kinerja Utama (KPI Toko)", 14, 66);

      const kpiRows = [
        ["Total Omset / Pendapatan", `Rp ${(totalRevenue ?? 0).toLocaleString("id-ID")}`, "Target Bulanan Toko", `Rp ${(monthlyTargetAmount ?? 0).toLocaleString("id-ID")}`],
        ["Estimasi Laba Kotor (Profit)", `Rp ${(netProfit ?? 0).toLocaleString("id-ID")}`, "Margin Laba Estimasi", `${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0"}%`],
        ["Pencapaian Target Omset Toko", `${targetAchievedPercent}% (${momGrowthData.revGrowth >= 0 ? '+' : ''}${momGrowthData.revGrowth}% MoM)`, "Proyeksi Pendapatan Akhir Bulan", `Rp ${(projectedRevenue ?? 0).toLocaleString("id-ID")}`],
        ["Total Unit HP Terjual", `${currentMonthSoldUnits} Unit`, "Target Unit Smartphone Toko", `${monthlyUnitTargetAmount} Unit (${unitTargetAchievedPercent}%)`],
        ["Total Biaya Buyback", `Rp ${(totalBuybackCost ?? 0).toLocaleString("id-ID")}`, "Transaksi Buyback Aktif", `${filteredBuybacks.length} Transaksi`],
        ["Total Transaksi Terbayar", `${filteredTransactions.filter(t => t.paymentStatus === "PAID").length} Transaksi`, "Stok Kritis (< Threshold)", `${lowStockCount} Tipe Smartphone`]
      ];

      autoTable(doc, {
        startY: 70,
        head: [["Indikator KPI", "Realisasi", "Parameter Acuan / Target", "Status / Catatan"]],
        body: kpiRows,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.2 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 50 },
          1: { fontStyle: "bold", textColor: [16, 185, 129] },
          2: { fontStyle: "normal" },
          3: { fontStyle: "bold", textColor: [79, 70, 229] }
        }
      });

      let currentY = (doc as any).lastAutoTable?.finalY || 135;

      // Section 2: Target Penjualan Spesifik Per Kategori Produk Table
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("2. Evaluasi Target Penjualan Spesifik Per Kategori Produk", 14, currentY + 8);

      const categoryRows = categorySalesPerformance.categoriesList.map((cat, idx) => [
        (idx + 1).toString(),
        cat.category,
        `Rp ${cat.targetAmount.toLocaleString("id-ID")}`,
        `Rp ${cat.realizedRevenue.toLocaleString("id-ID")}`,
        `${cat.unitsSold} Unit`,
        `${cat.achievementPct}%`,
        cat.shortfall === 0 ? "Tercapai 🎉" : `Sisa Rp ${cat.shortfall.toLocaleString("id-ID")}`,
        `${cat.contributionPct}%`
      ]);

      categoryRows.push([
        "-",
        "TOTAL KATEGORI PRODUK",
        `Rp ${categorySalesPerformance.totalCategoryTargetSum.toLocaleString("id-ID")}`,
        `Rp ${categorySalesPerformance.totalRealized.toLocaleString("id-ID")}`,
        "-",
        categorySalesPerformance.totalCategoryTargetSum > 0 ? `${Math.round((categorySalesPerformance.totalRealized / categorySalesPerformance.totalCategoryTargetSum) * 100)}%` : "0%",
        "-",
        "100%"
      ]);

      autoTable(doc, {
        startY: currentY + 12,
        head: [["No", "Kategori Produk", "Target (Rp)", "Realisasi Omzet", "Unit Terjual", "% Target", "Sisa Target", "Kontribusi"]],
        body: categoryRows,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 7.5, cellPadding: 2 },
        didParseCell: (data) => {
          if (data.row.index === categoryRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });

      currentY = (doc as any).lastAutoTable?.finalY || 180;

      // Section 3: Employee Performance & Target Evaluation Table
      if (currentY > 210) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("3. Evaluasi Kinerja Target Pendapatan Individual Karyawan", 14, currentY + 8);

      const employeeRows = employees.map((emp, index) => {
        const target = currentTargets.find(t => t.userId === emp.id);
        const targetAmount = target ? target.targetAmount : 0;
        const achieved = salesPerUser[emp.id] || 0;
        const percentage = targetAmount > 0 ? ((achieved / targetAmount) * 100).toFixed(1) + "%" : "Belum Set";
        const statusStr = targetAmount === 0 ? "Belum Diatur" : (achieved >= targetAmount ? "Melampaui Target 🎉" : (achieved >= targetAmount * 0.5 ? "Progres Bagus 📈" : "Perlu Pacu Omzet ⚡"));
        
        return [
          (index + 1).toString(),
          emp.name,
          emp.role || "Kasir",
          `Rp ${(achieved ?? 0).toLocaleString("id-ID")}`,
          targetAmount > 0 ? `Rp ${(targetAmount ?? 0).toLocaleString("id-ID")}` : "Rp 0",
          percentage,
          statusStr
        ];
      });

      autoTable(doc, {
        startY: currentY + 12,
        head: [["No", "Nama Karyawan", "Role", "Realisasi Penjualan", "Target Pendapatan", "% Achieved", "Status Kinerja"]],
        body: employeeRows,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 7.5, cellPadding: 2 }
      });

      currentY = (doc as any).lastAutoTable?.finalY || 210;

      // Add Page for Chart Images captured via html2canvas
      doc.addPage();
      currentY = 15;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("4. Visualisasi Grafik Tren Penjualan & Profitabilitas Per Kategori", 14, currentY);

      // Capture Sales Trend Chart with html2canvas
      const trendElem = document.getElementById("pdf-sales-trend-chart");
      if (trendElem) {
        try {
          const canvas = await html2canvas(trendElem, { scale: 1.8, useCORS: true, logging: false });
          const imgData = canvas.toDataURL("image/png");
          doc.addImage(imgData, "PNG", 14, currentY + 5, 182, 75);
          currentY += 85;
        } catch (e) {
          console.error("Error capturing trend chart:", e);
        }
      }

      // Capture Profitability Donut Chart with html2canvas
      const donutElem = document.getElementById("pdf-profitability-donut-chart");
      if (donutElem) {
        try {
          const canvas = await html2canvas(donutElem, { scale: 1.8, useCORS: true, logging: false });
          const imgData = canvas.toDataURL("image/png");
          doc.addImage(imgData, "PNG", 14, currentY + 5, 182, 85);
          currentY += 95;
        } catch (e) {
          console.error("Error capturing donut chart:", e);
        }
      }

      // Manager Signatures Block
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Dokumen resmi ini di-generate otomatis oleh Sistem POS & Inventaris Smartphone.", 14, currentY + 10);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Disetujui / Diarsipkan Oleh:", 135, currentY + 10);
      doc.text("Manager Operasional Toko", 135, currentY + 26);
      doc.line(135, currentY + 27, 185, currentY + 27);

      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Halaman ${i} dari ${pageCount} - Arsip Laporan POS Smartphone`, 14, 287);
      }

      doc.save(`Laporan_Ringkasan_KPI_Manager_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Error generating PDF summary:", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleQuickNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (onTabChange) {
      onTabChange(tab);
    } else {
      const tabIdMap: Record<string, string> = {
        POS: "tab-pos",
        INVENTORY: "tab-inventory",
        BUYBACK: "tab-buyback",
        PURCHASE: "tab-purchase",
        CONTACTS: "tab-contacts"
      };
      const elementId = tabIdMap[tab] || `tab-${tab.toLowerCase()}`;
      const tabBtn = document.getElementById(elementId);
      if (tabBtn) {
        tabBtn.click();
      }
    }
  };

  const getAccentClass = (type: "bg" | "text" | "border" | "bg-soft") => {
    switch (storeAccent) {
      case "indigo": return type === "bg" ? "bg-indigo-600" : type === "text" ? "text-indigo-600" : type === "border" ? "border-indigo-200/80" : "bg-indigo-50";
      case "emerald": return type === "bg" ? "bg-emerald-600" : type === "text" ? "text-emerald-600" : type === "border" ? "border-emerald-200/80" : "bg-emerald-50";
      case "rose": return type === "bg" ? "bg-rose-600" : type === "text" ? "text-rose-600" : type === "border" ? "border-rose-200/80" : "bg-rose-50";
      case "amber": return type === "bg" ? "bg-amber-600" : type === "text" ? "text-amber-600" : type === "border" ? "border-amber-200/80" : "bg-amber-50";
      default: return type === "bg" ? "bg-primary-600" : type === "text" ? "text-primary-600" : type === "border" ? "border-primary-200/80" : "bg-primary-50";
    }
  };

  const getChartGradientClass = () => {
    switch(storeAccent) {
      case 'indigo': return 'from-indigo-600 via-indigo-500 to-primary-400';
      case 'emerald': return 'from-emerald-600 via-emerald-500 to-teal-400';
      case 'rose': return 'from-rose-600 via-rose-500 to-pink-400';
      case 'amber': return 'from-amber-600 via-amber-500 to-yellow-400';
      default: return 'from-primary-600 via-blue-500 to-cyan-400';
    }
  };

  // Sales Targets Logic
  const [targets, setTargets] = useState<any[]>([]);
  const [newTarget, setNewTarget] = useState({ userId: "", targetAmount: 0, month: new Date().toISOString().slice(0, 7) });

  const fetchTargets = async () => {
    try {
      const res = await apiFetch("/api/targets");
      if (res.ok) {
        const data = await res.json();
        setTargets(data.filter((t: any) => t.month === newTarget.month));
      }
    } catch (e) {
      console.warn("Notice fetching targets:", e);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [newTarget.month]);

  const addTarget = async () => {
    try {
      await apiFetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets: [newTarget] })
      });
      setShowTargetModal(false);
      fetchTargets();
    } catch (e) {
      console.error("Error adding target:", e);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-zinc-800 transition"
        >
          <Download size={16} /> Unduh Laporan PDF
        </button>
      </div>

      <div id="dashboard-content" className="space-y-6">
      {/* Superadmin SaaS & Tenant Overview Cards */}
      {(userRole === "ADMIN" || currentUser?.role === "ADMIN") && (
        <div className="space-y-4">
          {/* Automated Expiration Alert Banner (7 Days Warning) */}
          {superadminStats && (superadminStats.expiringIn7Days > 0 || superadminStats.expiredTenants > 0) && (
            <div className="bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/30 dark:border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-amber-500 text-white uppercase">
                      Peringatan Superadmin
                    </span>
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                      Sistem Otomatisasi Reminder Aktif
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {superadminStats.expiringIn7Days} Tenant Memasuki &le; 7 Hari Jatuh Tempo {superadminStats.expiredTenants > 0 ? `& ${superadminStats.expiredTenants} Telah Berakhir` : ''}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Notifikasi dasbor dan pengingat email otomatis telah disiapkan untuk dikirim ke pemilik outlet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleQuickNavigate("TENANTS")}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Mail className="h-4 w-4" /> Kelola & Kirim Pengingat
              </button>
            </div>
          )}

          {/* 3 Real-Time Superadmin Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Total Tenant Aktif */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Tenant Aktif
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {superadminStats?.activeTenants ?? 0}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    / {superadminStats?.totalTenants ?? 0} Toko Terdaftar
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Berlangganan & Aktif
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Building2 className="h-6 w-6" />
              </div>
            </div>

            {/* Card 2: Tenant Jatuh Tempo Bulan Ini */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Jatuh Tempo Bulan Ini
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                    {superadminStats?.expiringThisMonth ?? 0}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    ({superadminStats?.expiringIn7Days ?? 0} dalam &le; 7 hari)
                  </span>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Perlu Follow Up / Reminder
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>

            {/* Card 3: Tenant Periode Trial */}
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Periode Trial (Uji Coba)
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {superadminStats?.trialTenants ?? 0}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Toko Masa Trial
                  </span>
                </div>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Potensi Konversi Berbayar
                </p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Smartphone className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Targets Section */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Target Karyawan
          </h3>
          <button 
            onClick={() => setShowTargetModal(true)}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
          >
            + Set Target
          </button>
        </div>
        <div className="space-y-3">
          {targets.map((t, idx) => (
            <div key={t.id || t.userId || `target-item-${idx}`} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <span className="font-medium text-sm">{t.userId}</span>
              <div className="flex-1 mx-4 h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '60%' }}></div>
              </div>
              <span className="text-sm font-semibold">Rp {t.targetAmount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Tren Penjualan 7 Hari Terakhir
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.entries(dailySales).map(([name, total]) => ({ name, total }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${val / 1000}k`} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px' }} />
              <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Toast Notification for Real-Time Alert */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence>
          {toastNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="pointer-events-auto bg-slate-900 border border-amber-500/30 text-white rounded-2xl p-4 shadow-xl flex gap-3 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <div className="shrink-0 p-2 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-extrabold tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-xs uppercase">
                    STOK KRITIS
                  </span>
                  <span className="text-[8px] text-slate-400">Real-Time</span>
                </div>
                <h4 className="font-bold text-xs text-slate-100 mt-1">{toastNotification.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toastNotification.message}</p>
              </div>
              <button
                onClick={() => setToastNotification(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white cursor-pointer transition-colors text-xs"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Real-Time Migration Phase Status Notification Badge Widget for Admin/Manager */}
      {migrationRequests.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-800/60 no-print space-y-3 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                <Database className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-200 flex items-center gap-2">
                  Notifikasi Pemantauan Migrasi Data Toko
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    REAL-TIME UPDATES
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300">
                  Status & fase migrasi otomatis diperbarui setiap kali tim technical memperbarui progres.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-300">
                Total Permohonan: <strong className="text-white font-mono">{migrationRequests.length}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {migrationRequests.slice(0, 3).map((item, idx) => {
              const phase = item.currentPhase || (item.status === "Completed" ? "Completed" : "Mapping");
              return (
                <div key={item.id || `mig-item-${idx}`} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 space-y-2 relative group hover:border-indigo-500/60 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <FileText className="h-3 w-3 text-slate-400" />
                        {item.fileName} ({item.recordCount || 0} baris)
                      </p>
                    </div>

                    {/* Phase Badge */}
                    {phase === "Mapping" && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                        Phase: Mapping
                      </span>
                    )}
                    {phase === "Uploading" && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                        Phase: Uploading
                      </span>
                    )}
                    {phase === "Verification" && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                        Phase: Verification
                      </span>
                    )}
                    {phase === "Completed" && (
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase shrink-0 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <p className="line-clamp-1 italic text-slate-300">"{item.notes || 'Dalam proses pengolahan data'}"</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Target Bulanan (Monthly Revenue & Unit Sales Target) Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden no-print space-y-5">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-xs">
                <Target className="h-4 w-4" />
              </span>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Target Bulanan Manajer ({currentMonthName})
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                targetAchievedPercent >= 100 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
                targetAchievedPercent >= 50 ? "bg-blue-500/20 text-blue-400 border border-blue-500/40" :
                "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}>
                {targetAchievedPercent >= 100 ? "Target Omzet Melampaui 🎉" : targetAchievedPercent >= 50 ? "Progres Omzet Bagus 📈" : "Perlu Pacu Omzet ⚡"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Pantau progres pendapatan & volume unit smartphone terjual hari ke-<strong>{currentDayOfMonth}</strong> dari <strong>{totalDaysInMonth} hari</strong> bulan ini ({remainingDaysInMonth} hari tersisa).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-300">Proyeksi Akhir Bulan</div>
              <div className="text-sm font-black text-indigo-300 font-mono">
                Rp {projectedRevenue.toLocaleString("id-ID")} ({projectedRevenuePercent}%)
              </div>
            </div>

            <button
              onClick={() => {
                setTargetInputVal(monthlyTargetAmount.toString());
                setUnitTargetInputVal(monthlyUnitTargetAmount.toString());
                setShowMonthlyTargetModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shrink-0"
            >
              <Edit3 className="h-4 w-4" />
              <span>Atur Target (Manager)</span>
            </button>
          </div>
        </div>

        {/* Dual Visual Progress Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {/* Card 1: Revenue Target Progress */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-emerald-400" />
                Target Pendapatan Omzet:
              </span>
              <span className="text-emerald-400 font-black text-sm">
                {targetAchievedPercent}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-white">
                Rp {currentMonthTotalRevenue.toLocaleString("id-ID")}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                dari Rp {monthlyTargetAmount.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-3 bg-slate-800 rounded-full p-0.5 border border-slate-700/80 overflow-hidden">
                <div
                  style={{ width: `${Math.min(targetAchievedPercent, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-700 ${
                    targetAchievedPercent >= 100 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                    targetAchievedPercent >= 50 ? "bg-gradient-to-r from-indigo-500 to-blue-400" :
                    "bg-gradient-to-r from-amber-500 to-orange-400"
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-0.5">
                <span>{remainingTarget > 0 ? `Sisa: Rp ${remainingTarget.toLocaleString("id-ID")}` : "Tercapai 100%! 🎉"}</span>
                <span className="text-amber-300 font-extrabold">
                  {remainingTarget > 0 ? `Diperlukan: ~Rp ${dailyRevenueNeeded.toLocaleString("id-ID")}/hari` : "Memenuhi Kuota"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Smartphone Unit Sales Target Progress */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-indigo-400" />
                Target Penjualan Unit Smartphone:
              </span>
              <span className="text-indigo-400 font-black text-sm">
                {unitTargetAchievedPercent}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-lg font-black text-white">
                {currentMonthSoldUnits} Unit Terjual
              </span>
              <span className="text-xs font-semibold text-slate-400">
                dari {monthlyUnitTargetAmount} Unit HP
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-3 bg-slate-800 rounded-full p-0.5 border border-slate-700/80 overflow-hidden">
                <div
                  style={{ width: `${Math.min(unitTargetAchievedPercent, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-700 ${
                    unitTargetAchievedPercent >= 100 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                    unitTargetAchievedPercent >= 50 ? "bg-gradient-to-r from-indigo-500 to-blue-400" :
                    "bg-gradient-to-r from-amber-500 to-orange-400"
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium pt-0.5">
                <span>{remainingUnitTarget > 0 ? `Sisa: ${remainingUnitTarget} Unit` : "Tercapai 100%! 🎉"}</span>
                <span className="text-amber-300 font-extrabold">
                  {remainingUnitTarget > 0 ? `Diperlukan: ~${dailyUnitsNeeded} Unit/hari` : "Memenuhi Kuota"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Specific Employee Target Monitor Card (When employee filter active) */}
        {selectedEmployeeId !== "ALL" && (() => {
          const emp = employees.find(e => e.id === selectedEmployeeId);
          if (!emp) return null;
          const targetObj = currentTargets.find(t => t.userId === emp.id);
          const empTargetAmt = targetObj ? targetObj.targetAmount : (monthlyTargetAmount / (employees.length || 1));
          const empAchieved = salesPerUser[emp.id] || 0;
          const empPct = empTargetAmt > 0 ? Math.round((empAchieved / empTargetAmt) * 100) : 0;
          const empRemaining = Math.max(0, empTargetAmt - empAchieved);

          return (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-900/60 border border-indigo-500/40 p-4 rounded-2xl relative z-10 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/30 text-indigo-300 rounded-lg">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      Target Individu Karyawan: <span className="text-indigo-300 font-extrabold">{emp.name}</span>
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full uppercase">
                        {emp.role || "Kasir"}
                      </span>
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployeeId("ALL")}
                  className="text-[10px] bg-white/10 hover:bg-white/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Lihat Semua Karyawan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-indigo-500/20">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase">Realisasi Sales</span>
                  <p className="text-sm font-black text-emerald-400 font-mono">Rp {empAchieved.toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-indigo-500/20">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase">Target Pendapatan</span>
                  <p className="text-sm font-black text-white font-mono">Rp {empTargetAmt.toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-indigo-500/20">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase">Status / Sisa Target</span>
                  <p className="text-sm font-black text-amber-300">
                    {empPct >= 100 ? "Melampaui Target 🎉" : `Sisa Rp ${empRemaining.toLocaleString("id-ID")}`}
                  </p>
                </div>
              </div>

              {/* Progress bar for employee */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-indigo-200 font-semibold">Progress Target: {empPct}%</span>
                  <span className="text-indigo-300 font-bold">{empPct >= 100 ? "100% Achieved!" : `${100 - empPct}% Lagi`}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950/60 rounded-full border border-indigo-500/30 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(empPct, 100)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      empPct >= 100 ? "bg-gradient-to-r from-emerald-400 to-teal-300" :
                      empPct >= 50 ? "bg-gradient-to-r from-indigo-400 to-blue-400" :
                      "bg-gradient-to-r from-amber-400 to-orange-400"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })()}
      </div>

      {/* Top Row Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* KPI 1: Total Revenue */}
        <motion.div 
          key={`kpi-revenue-${totalRevenue}-${selectedEmployeeId}-${dashboardDatePreset}`}
          initial={{ opacity: 0.85, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 h-full min-h-[104px] hover:shadow-md transition-shadow"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Total Revenue">Total Revenue</p>
            <h3 className={`text-xl sm:text-2xl font-black ${getAccentClass('text')} truncate`}>
              Rp {(totalRevenue ?? 0).toLocaleString("id-ID")}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              {filteredTransactions.filter(t => t.paymentStatus === "PAID").length} Transaksi Terbayar
            </p>
          </div>
          <div className={`p-3 rounded-xl ${getAccentClass('bg-soft')} ${getAccentClass('text')} shrink-0`}>
            <Banknote className="h-6 w-6" />
          </div>
        </motion.div>

        {/* KPI 2: Gross Profit */}
        <motion.div 
          key={`kpi-profit-${netProfit}-${selectedEmployeeId}-${dashboardDatePreset}`}
          initial={{ opacity: 0.85, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 h-full min-h-[104px] hover:shadow-md transition-shadow"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Gross Profit">Gross Profit</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 truncate">
              Rp {(netProfit ?? 0).toLocaleString("id-ID")}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Margin Est: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0"}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
        </motion.div>

        {/* KPI 3: Active Buybacks */}
        <motion.div 
          key={`kpi-buybacks-${buybacks.length}-${selectedEmployeeId}-${dashboardDatePreset}`}
          initial={{ opacity: 0.85, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 h-full min-h-[104px] hover:shadow-md transition-shadow"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Active Buybacks">Active Buybacks</p>
            <h3 className="text-xl sm:text-2xl font-black text-violet-600 truncate">
              {buybacks.filter(b => (b as any).status === "PENDING" || (b as any).status === "IN_STOCK" || (b as any).status === "RECEIVED" || !(b as any).status || (b as any).status === "APPROVED").length} <span className="text-sm font-bold text-slate-400">Unit</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Total Investasi: Rp {(totalBuybackCost ?? 0).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
            <Coins className="h-6 w-6" />
          </div>
        </motion.div>

        {/* KPI 4: Pending POs */}
        <motion.div 
          key={`kpi-pos-${purchaseOrders.length}-${selectedEmployeeId}-${dashboardDatePreset}`}
          initial={{ opacity: 0.85, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 h-full min-h-[104px] hover:shadow-md transition-shadow"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Pending Purchase Orders">Pending POs</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 truncate">
              {purchaseOrders.filter(po => po.status === "PENDING" || po.status === "DRAFT" || po.status === "SENT" || po.status === "PARTIAL").length} <span className="text-sm font-bold text-slate-400">Pesanan</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium truncate">
              Pesanan Supplier Aktif
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* Upper Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`bg-white p-5 rounded-2xl border shadow-xs relative overflow-hidden ${
        storeAccent === 'indigo' ? 'border-indigo-200/80' :
        storeAccent === 'emerald' ? 'border-emerald-200/80' :
        storeAccent === 'rose' ? 'border-rose-200/80' :
        storeAccent === 'amber' ? 'border-amber-200/80' :
        'border-primary-200/80'
      }`}>
        <div className="flex flex-col gap-3">
          {/* Top Row: Title & Subtitle on left, Cloud Status on top right */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 shrink-0">
                  Dasbor Analitik Real-Time
                  <span className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${
                    storeAccent === 'indigo' ? 'bg-indigo-600' :
                    storeAccent === 'emerald' ? 'bg-emerald-600' :
                    storeAccent === 'rose' ? 'bg-rose-600' :
                    storeAccent === 'amber' ? 'bg-amber-600' :
                    'bg-primary-600'
                  }`}></span>
                </h1>
                <span className="text-slate-300 font-bold hidden md:inline">•</span>
                <p className="text-slate-500 text-xs font-medium">
                  Status POS Smartphone, Validasi IMEI, & Manajemen Finansial Terintegrasi Cloud
                </p>
              </div>
            </div>

            {/* Cloud Status (Top Right) */}
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 shrink-0 self-start md:self-auto no-print">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">
                Cloud Aktif
              </span>
            </div>
          </div>

          {/* Controls Bar Below Text */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Accent Selector */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl no-print">
                <span className="text-[10px] font-bold text-slate-500 mr-1 uppercase tracking-wider">Aksen:</span>
                {[
                  { id: "blue", bg: "bg-primary-600" },
                  { id: "indigo", bg: "bg-indigo-600" },
                  { id: "emerald", bg: "bg-emerald-600" },
                  { id: "rose", bg: "bg-rose-600" },
                  { id: "amber", bg: "bg-amber-600" }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setStoreAccent(opt.id)}
                    className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-all ${opt.bg} ${storeAccent === opt.id ? `ring-2 ring-offset-2 ring-slate-300 scale-110` : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                    title={`Pilih warna aksen ${opt.id}`}
                  />
                ))}
              </div>

              {/* Employee Filter Dropdown for Managers */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1 rounded-xl no-print">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-1.5 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-indigo-600" />
                  Karyawan:
                </span>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  title="Pilih Karyawan Spesifik untuk Memantau Target Pendapatan"
                >
                  <option value="ALL">Semua Karyawan ({employees.length})</option>
                  {employees.map((emp, idx) => (
                    <option key={emp.id || `emp-opt-${idx}`} value={emp.id}>
                      {emp.name} ({emp.role || "Kasir"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Picker Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1 rounded-xl no-print">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary-600" />
                  Filter:
                </span>
                {[
                  { id: "all", label: "Semua" },
                  { id: "today", label: "Hari Ini" },
                  { id: "this_week", label: "Minggu Ini" },
                  { id: "this_month", label: "Bulan Ini" },
                  { id: "custom", label: "Custom" }
                ].map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setDashboardDatePreset(preset.id as any)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                      dashboardDatePreset === preset.id
                        ? "bg-primary-600 text-white border-primary-600 shadow-2xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                {dashboardDatePreset === "custom" && (
                  <div className="flex items-center gap-1 pl-1 border-l border-slate-200 ml-1">
                    <input 
                      type="date"
                      value={printStartDate}
                      onChange={(e) => setPrintStartDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-[10px] text-slate-700 outline-none focus:border-primary-500 w-26 cursor-pointer"
                    />
                    <span className="text-slate-400 text-[10px]">-</span>
                    <input 
                      type="date"
                      value={printEndDate}
                      onChange={(e) => setPrintEndDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-[10px] text-slate-700 outline-none focus:border-primary-500 w-26 cursor-pointer"
                    />
                  </div>
                )}

                <button
                  onClick={fetchDashboardData}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer shadow-xs ml-1"
                  title="Refresh Data Dasbor"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                  Refresh
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isPdfGenerating}
                  className={`px-2.5 py-1 text-white border rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ml-1 active:scale-95 ${
                    isPdfGenerating ? "bg-indigo-400 border-indigo-400 opacity-80 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 border-indigo-500"
                  }`}
                  title="Unduh Ringkasan Performa KPI Bulanan (PDF)"
                >
                  {isPdfGenerating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-100 animate-spin" />
                      <span>Menggenerasi PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5 text-indigo-200" />
                      <span>Unduh Ringkasan (PDF)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  Cetak
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Section */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-md shrink-0">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
              <h3 className="text-xs font-extrabold text-slate-900 tracking-tight uppercase">
                Aksi Cepat / Quick Actions
              </h3>
              <span className="text-slate-300 font-bold hidden sm:inline">•</span>
              <p className="text-[10px] text-slate-500 font-medium">
                Pintasan navigasi langsung
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
            Akses Pintas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Button 1: Add New Sale */}
          <button
            type="button"
            onClick={() => handleQuickNavigate("POS")}
            className="group relative flex items-center justify-between p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] border border-emerald-400/30 overflow-hidden text-left"
          >
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-white/15 backdrop-blur-md rounded-lg text-white group-hover:scale-105 transition-transform shrink-0">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs tracking-tight truncate">POS Kasir</span>
                  <PlusCircle className="h-3 w-3 text-emerald-200 opacity-80 shrink-0" />
                </div>
                <p className="text-[9px] text-emerald-100 font-medium truncate">
                  Penjualan Baru
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-200 group-hover:translate-x-0.5 transition-transform relative z-10 shrink-0 ml-1" />
          </button>

          {/* Button 2: Add Inventory Item */}
          <button
            type="button"
            onClick={() => handleQuickNavigate("INVENTORY")}
            className="group relative flex items-center justify-between p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] border border-blue-400/30 overflow-hidden text-left"
          >
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-white/15 backdrop-blur-md rounded-lg text-white group-hover:scale-105 transition-transform shrink-0">
                <Boxes className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs tracking-tight truncate">Stok Barang</span>
                  <Plus className="h-3 w-3 text-blue-200 opacity-80 shrink-0" />
                </div>
                <p className="text-[9px] text-blue-100 font-medium truncate">
                  Katalog Inventaris
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform relative z-10 shrink-0 ml-1" />
          </button>

          {/* Button 3: Purchase Order Supplier */}
          <button
            type="button"
            onClick={() => handleQuickNavigate("PURCHASE")}
            className="group relative flex items-center justify-between p-2.5 bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] border border-cyan-400/30 overflow-hidden text-left"
          >
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-white/15 backdrop-blur-md rounded-lg text-white group-hover:scale-105 transition-transform shrink-0">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs tracking-tight truncate">Order PO</span>
                  <Send className="h-3 w-3 text-cyan-200 opacity-80 shrink-0" />
                </div>
                <p className="text-[9px] text-cyan-100 font-medium truncate">
                  Pesan ke Supplier
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-cyan-200 group-hover:translate-x-0.5 transition-transform relative z-10 shrink-0 ml-1" />
          </button>

          {/* Button 4: Process Buyback */}
          <button
            type="button"
            onClick={() => handleQuickNavigate("BUYBACK")}
            className="group relative flex items-center justify-between p-2.5 bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] border border-violet-400/30 overflow-hidden text-left"
          >
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-white/15 backdrop-blur-md rounded-lg text-white group-hover:scale-105 transition-transform shrink-0">
                <Coins className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs tracking-tight truncate">Tukar Tambah</span>
                  <RefreshCw className="h-3 w-3 text-violet-200 opacity-80 shrink-0" />
                </div>
                <p className="text-[9px] text-violet-100 font-medium truncate">
                  Buyback HP Bekas
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-violet-200 group-hover:translate-x-0.5 transition-transform relative z-10 shrink-0 ml-1" />
          </button>

          {/* Button 5: Direktori Kontak */}
          <button
            type="button"
            onClick={() => handleQuickNavigate("CONTACTS")}
            className="group relative flex items-center justify-between p-2.5 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] border border-slate-600/30 overflow-hidden text-left"
          >
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-white/15 backdrop-blur-md rounded-lg text-white group-hover:scale-105 transition-transform shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-xs tracking-tight truncate">Kontak</span>
                  <Users className="h-3 w-3 text-slate-300 opacity-80 shrink-0" />
                </div>
                <p className="text-[9px] text-slate-200 font-medium truncate">
                  Direktori Supplier
                </p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform relative z-10 shrink-0 ml-1" />
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {products.filter(p => p.stock <= p.minStockAlert).length > 0 && (
        <div className="bg-white border-l-4 border-l-amber-500 border-y border-r border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 p-8 opacity-[0.03] text-amber-500 shrink-0 pointer-events-none">
            <AlertTriangle className="h-32 w-32" />
          </div>
          <div className="flex gap-4 items-start relative z-10 flex-1 min-w-0">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl shrink-0 mt-0.5 border border-amber-200/30">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                  Peringatan Batas Minimum Stok Terlampaui
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full font-bold border border-rose-100 uppercase tracking-wider animate-pulse self-start sm:self-auto">
                  {products.filter(p => p.stock <= p.minStockAlert).length} Produk Kritis
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
                Beberapa tipe unit smartphone dalam inventaris berada pada atau di bawah batas minimum (threshold). Lakukan pengisian stok ulang segera untuk menghindari kekosongan saat transaksi kasir.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4">
                {products.filter(p => p.stock <= p.minStockAlert).map((p, idx) => (
                  <div key={p.id || `stock-crit-${idx}`} className="group/item bg-slate-50 hover:bg-amber-50/40 border border-slate-100 hover:border-amber-200/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-all duration-200">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover/item:text-amber-900 transition-colors">{p.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Batas: {p.minStockAlert} unit</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">
                        Sisa {p.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              const tabBtn = document.getElementById("tab-inventory");
              if (tabBtn) tabBtn.click();
            }}
            className="w-full xl:w-auto shrink-0 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-slate-900/5 active:scale-95 relative z-10 hover:shadow-lg hover:shadow-slate-900/10"
          >
            <Smartphone className="h-4 w-4 text-amber-400" />
            <span>Kelola Stok Sekarang</span>
          </button>
        </div>
      )}

      {/* Supplier Debt Due Date Alert Banner */}
      {debtReminders.length > 0 && (
        <div className="bg-white border-l-4 border-l-rose-500 border-y border-r border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 p-8 opacity-[0.03] text-rose-500 shrink-0 pointer-events-none">
            <Clock className="h-32 w-32" />
          </div>
          <div className="flex gap-4 items-start relative z-10 flex-1 min-w-0">
            <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl shrink-0 mt-0.5 border border-rose-200/30">
              <Clock className="h-6 w-6 animate-bounce text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                  Pengingat Otomatis Jatuh Tempo Pembayaran Hutang Supplier
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold border border-rose-200 uppercase tracking-wider animate-pulse self-start sm:self-auto">
                  {debtReminders.length} Vendor Mendekati / Terlewat Jatuh Tempo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
                Segera lakukan pelunasan tagihan ke distributor/supplier untuk menjaga reputasi, plafon kredit tempo, dan kontinuitas pasokan unit toko.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4">
                {debtReminders.map((item: any, idx: number) => {
                  const isOverdue = item.diffDays < 0;
                  const isToday = item.diffDays === 0;
                  return (
                    <div key={item.supplier?.id ? `debt-${item.supplier.id}-${idx}` : `debt-item-${idx}`} className="group/item bg-slate-50 hover:bg-rose-50/40 border border-slate-100 hover:border-rose-200/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-all duration-200">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOverdue || isToday ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${isOverdue || isToday ? 'bg-rose-600' : 'bg-amber-500'}`}></span>
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover/item:text-rose-900 transition-colors">{item.supplier.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Sisa: Rp {item.remainingDebt.toLocaleString("id-ID")}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                          isOverdue
                            ? 'text-rose-700 bg-rose-100 border-rose-200'
                            : isToday
                            ? 'text-rose-700 bg-rose-100 border-rose-200'
                            : 'text-amber-800 bg-amber-100 border-amber-200'
                        }`}>
                          {isOverdue
                            ? `Terlewat ${Math.abs(item.diffDays)} Hari`
                            : isToday
                            ? 'HARI INI!'
                            : `Sisa ${item.diffDays} Hari`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const tabBtn = document.getElementById("tab-suppliers");
              if (tabBtn) {
                tabBtn.click();
              } else if (onTabChange) {
                onTabChange("suppliers");
              } else if (onNavigate) {
                onNavigate("suppliers");
              }
            }}
            className="w-full xl:w-auto shrink-0 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-rose-600/20 active:scale-95 relative z-10"
          >
            <CreditCard className="h-4 w-4 text-white" />
            <span>Kelola Hutang Supplier</span>
          </button>
        </div>
      )}

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isDashboardLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 relative overflow-hidden animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-slate-200/80 rounded-xl" />
                  <div className="h-4 w-32 bg-slate-200/60 rounded-md" />
                </div>
                <div className="h-6 w-16 bg-slate-100 rounded-lg" />
              </div>
              <div className="mt-5 space-y-2">
                <div className="h-8 w-44 bg-slate-200/80 rounded-md" />
                <div className="h-4 w-36 bg-slate-100 rounded-md" />
              </div>
            </div>
          ))
        ) : (
          <>
            {/* Card 1: Revenue (Total Penjualan) */}
            <motion.div 
              key={`kpi-rev-${totalRevenue}-${filteredTransactions.length}-${selectedEmployeeId}-${dashboardDatePreset}`}
              initial={{ opacity: 0.7, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-200 ease-out hover:${getAccentClass("border")}`}
            >
              <div className={`h-1 w-full absolute top-0 left-0 bg-gradient-to-r ${
                storeAccent === 'indigo' ? 'from-indigo-500 to-purple-600' :
                storeAccent === 'emerald' ? 'from-emerald-500 to-teal-600' :
                storeAccent === 'rose' ? 'from-rose-500 to-pink-600' :
                storeAccent === 'amber' ? 'from-amber-500 to-orange-600' :
                'from-blue-500 to-indigo-600'
              }`} />
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${getAccentClass("bg-soft")} ${getAccentClass("text")} border-opacity-50`}>
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md">
                    Total Penjualan
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold border flex items-center gap-1 shrink-0 ${
                  momGrowthData.revGrowth >= 0 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {momGrowthData.revGrowth >= 0 ? (
                    <><ArrowUpRight className="h-3 w-3" />+{momGrowthData.revGrowth}% MoM</>
                  ) : (
                    <><ArrowDownRight className="h-3 w-3" />{momGrowthData.revGrowth}% MoM</>
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    Rp {(totalRevenue ?? 0).toLocaleString("id-ID")}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    Bln lalu: Rp {(momGrowthData.prevRev ?? 0).toLocaleString("id-ID")}
                  </p>
                </div>
                {/* Growth Sparkline Chart */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] font-extrabold uppercase text-indigo-500 tracking-wider mb-0.5">Tren 6 Bln</span>
                  <SparklineChart data={momGrowthData.revSparkline} color={momGrowthData.revGrowth >= 0 ? "#10b981" : "#f43f5e"} />
                </div>
              </div>
              <div className="mt-2.5 p-2 bg-slate-50/90 border border-slate-100 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Transaksi Selesai</span>
                <span className="font-bold text-slate-900">{transactions.filter(t => t.paymentStatus === "PAID").length} Trx (PAID)</span>
              </div>
            </motion.div>

            {/* Card 2: Buyback HP (Investasi Buyback) */}
            <motion.div 
              key={`kpi-bb-${totalBuybackCost}-${filteredBuybacks.length}-${selectedEmployeeId}-${dashboardDatePreset}`}
              initial={{ opacity: 0.7, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
              className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg hover:shadow-emerald-100/50 hover:-translate-y-0.5 hover:border-emerald-300 transition-all duration-200 ease-out"
            >
              <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-600" />
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/80">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider bg-emerald-50/90 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                    Investasi Buyback HP
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold border flex items-center gap-1 shrink-0 ${
                  momGrowthData.bbGrowth >= 0 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  {momGrowthData.bbGrowth >= 0 ? (
                    <><ArrowUpRight className="h-3 w-3" />+{momGrowthData.bbGrowth}% MoM</>
                  ) : (
                    <><ArrowDownRight className="h-3 w-3" />{momGrowthData.bbGrowth}% MoM</>
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Rp {(totalBuybackCost ?? 0).toLocaleString("id-ID")}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    Bln lalu: Rp {(momGrowthData.prevBbCost ?? 0).toLocaleString("id-ID")}
                  </p>
                </div>
                {/* Buyback Sparkline Chart */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] font-extrabold uppercase text-emerald-600 tracking-wider mb-0.5">Tren Buyback</span>
                  <SparklineChart data={momGrowthData.bbSparkline} color="#059669" />
                </div>
              </div>
              <div className="mt-2.5 p-2 bg-emerald-50/60 border border-emerald-100/80 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Total Unit Terbeli</span>
                <span className="font-bold text-emerald-700">{buybacks.length} Unit Bekas</span>
              </div>
            </motion.div>

            {/* Card 3: Nilai Modal Stok (Inventory Value) */}
            <motion.div 
              key={`kpi-inv-${totalInventoryCost}-${totalItemsCount}-${selectedEmployeeId}-${dashboardDatePreset}`}
              initial={{ opacity: 0.7, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
              className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg hover:shadow-amber-100/50 hover:-translate-y-0.5 hover:border-amber-300 transition-all duration-200 ease-out"
            >
              <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100/80">
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider bg-amber-50/90 border border-amber-200/70 px-2 py-0.5 rounded-md">
                    Nilai Modal Stok
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-lg text-[10px] sm:text-xs font-bold border border-amber-200/60 flex items-center gap-1 shrink-0">
                  <Coins className="h-3 w-3" />
                  {totalItemsCount} Unit
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Rp {(totalInventoryCost ?? 0).toLocaleString("id-ID")}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    Est. Margin Modal: {totalInventoryCost > 0 ? Math.round(((totalInventoryRetail - totalInventoryCost) / totalInventoryCost) * 100) : 0}%
                  </p>
                </div>
                {/* Stock Units Sparkline Chart */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] font-extrabold uppercase text-amber-600 tracking-wider mb-0.5">Tren Volume</span>
                  <SparklineChart data={momGrowthData.stockUnitsSparkline} color="#d97706" />
                </div>
              </div>
              <div className="mt-2.5 p-2 bg-amber-50/60 border border-amber-100/80 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Potensi Retail</span>
                <span className="font-bold text-emerald-600">Rp {(totalInventoryRetail ?? 0).toLocaleString("id-ID")}</span>
              </div>
            </motion.div>

            {/* Card 4: Laba Kotor Hari Ini */}
            <motion.div 
              key={`kpi-gross-${grossProfitToday}-${totalTransactionsToday}-${selectedEmployeeId}-${dashboardDatePreset}`}
              initial={{ opacity: 0.7, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
              className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg hover:shadow-sky-100/50 hover:-translate-y-0.5 hover:border-sky-300 transition-all duration-200 ease-out"
            >
              <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-sky-500 to-blue-600" />
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg border border-sky-100/80">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-sky-900 uppercase tracking-wider bg-sky-50/90 border border-sky-200/70 px-2 py-0.5 rounded-md">
                    Laba Kotor Hari Ini
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg text-[10px] sm:text-xs font-bold border border-sky-200/60 shrink-0">
                  Hari Ini
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-sky-600 tracking-tight">
                    Rp {(grossProfitToday ?? 0).toLocaleString("id-ID")}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {totalTransactionsToday} Transaksi hari ini
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] font-extrabold uppercase text-sky-600 tracking-wider mb-0.5">Tren Daily</span>
                  <SparklineChart data={chartValues.length > 0 ? chartValues : [1, 2, 3]} color="#0284c7" />
                </div>
              </div>
              <div className="mt-2.5 p-2 bg-sky-50/60 border border-sky-100/80 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Diskon Promo Diserap</span>
                <span className="font-bold text-sky-800">Rp {(promoDiscountToday ?? 0).toLocaleString("id-ID")}</span>
              </div>
            </motion.div>

            {/* Card 5: Keuntungan Bersih (Net Profit) */}
            <motion.div 
              key={`kpi-net-${netProfit}-${selectedEmployeeId}-${dashboardDatePreset}`}
              initial={{ opacity: 0.7, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.2 }}
              className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg hover:shadow-violet-100/50 hover:-translate-y-0.5 hover:border-violet-300 transition-all duration-200 ease-out"
            >
              <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-violet-500 to-purple-600" />
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg border border-violet-100/80">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-violet-900 uppercase tracking-wider bg-violet-50/90 border border-violet-200/70 px-2 py-0.5 rounded-md">
                    Keuntungan Bersih
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold border flex items-center gap-1 shrink-0 ${
                  momGrowthData.profitGrowth >= 0 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {momGrowthData.profitGrowth >= 0 ? (
                    <><ArrowUpRight className="h-3 w-3" />+{momGrowthData.profitGrowth}% MoM</>
                  ) : (
                    <><ArrowDownRight className="h-3 w-3" />{momGrowthData.profitGrowth}% MoM</>
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-violet-600 tracking-tight">
                    Rp {(netProfit ?? 0).toLocaleString("id-ID")}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    Bln lalu: Rp {(momGrowthData.prevProfit ?? 0).toLocaleString("id-ID")}
                  </p>
                </div>
                {/* Profit Sparkline Chart */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-[9px] font-extrabold uppercase text-violet-600 tracking-wider mb-0.5">Tren Profit</span>
                  <SparklineChart data={momGrowthData.profitSparkline} color={momGrowthData.profitGrowth >= 0 ? "#8b5cf6" : "#f43f5e"} />
                </div>
              </div>
              <div className="mt-2.5 p-2 bg-violet-50/60 border border-violet-100/80 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-600">Setelah HPP & Biaya</span>
                <span className="font-bold text-slate-900">Margin POS</span>
              </div>
            </motion.div>

            {/* Card 6: Kondisi Inventaris */}
            <motion.div 
              key={`kpi-stock-${lowStockCount}-${totalItemsCount}`}
              initial={{ opacity: 0.7, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.25 }}
              className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4 relative overflow-hidden group hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 ease-out"
            >
              <div className={`h-1 w-full absolute top-0 left-0 bg-gradient-to-r ${lowStockCount > 0 ? "from-amber-500 to-rose-500" : "from-emerald-500 to-teal-500"}`} />
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${lowStockCount > 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md">
                    Kondisi Stok
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold border ${lowStockCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"} shrink-0`}>
                  {lowStockCount > 0 ? "Stok Kritis" : "Stok Aman"}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {totalItemsCount} <span className="text-sm font-semibold text-slate-400">Unit HP</span>
                </div>
                <div className="mt-2.5 p-2 bg-slate-50/90 border border-slate-100 rounded-lg flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-semibold">Status Alert</span>
                  <span className={`font-bold ${lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {lowStockCount > 0 ? `⚠️ ${lowStockCount} Perlu Restok` : "Stok Terpenuhi"}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Monthly Smartphone Sales Trend (1 Year Bar Chart) */}
      <div id="pdf-sales-trend-chart" className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Grafik Tren Penjualan Smartphone Per Bulan (1 Tahun Terakhir)
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase">
                    12 BULAN
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi performa kuantitas unit terjual (Baru vs Bekas) & pergerakan omzet smartphone selama 12 bulan terakhir
                </p>
              </div>
            </div>
          </div>

          {/* Metric Switcher Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSmartphoneMetricView("units")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                smartphoneMetricView === "units"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Kuantitas (Unit)</span>
            </button>
            <button
              type="button"
              onClick={() => setSmartphoneMetricView("revenue")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                smartphoneMetricView === "revenue"
                  ? "bg-white text-emerald-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Banknote className="h-3.5 w-3.5" />
              <span>Nilai Omzet (Rp)</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards for 12-Month Smartphone Sales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
              Total HP Terjual (12 Bln)
            </span>
            <div className="text-xl font-black text-indigo-950 mt-0.5">
              {smartphone12MonthSummary.totalUnits.toLocaleString("id-ID")} <span className="text-xs font-semibold text-indigo-600">Unit</span>
            </div>
            <div className="text-[11px] text-indigo-700/80 mt-1 flex items-center gap-2">
              <span>Baru: <strong>{smartphone12MonthSummary.totalBaru}</strong></span>
              <span>•</span>
              <span>Bekas: <strong>{smartphone12MonthSummary.totalBekas}</strong></span>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
              Total Omzet Smartphone
            </span>
            <div className="text-xl font-black text-emerald-950 mt-0.5">
              Rp {smartphone12MonthSummary.totalRevenue.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-emerald-700/80 mt-1">
              Est. Laba: <strong>Rp {smartphone12MonthSummary.totalProfit.toLocaleString("id-ID")}</strong>
            </div>
          </div>

          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5">
            <span className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider block">
              Rata-Rata Penjualan/Bulan
            </span>
            <div className="text-xl font-black text-sky-950 mt-0.5">
              {smartphone12MonthSummary.avgUnitsPerMonth} <span className="text-xs font-semibold text-sky-600">Unit/Bln</span>
            </div>
            <div className="text-[11px] text-sky-700/80 mt-1">
              Konsistensi tren bulanan
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3.5">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
              Bulan Penjualan Tertinggi
            </span>
            <div className="text-xl font-black text-amber-950 mt-0.5">
              {smartphone12MonthSummary.peakMonth}
            </div>
            <div className="text-[11px] text-amber-800/80 mt-1">
              Puncak: <strong>{smartphone12MonthSummary.peakUnits} Unit</strong>
            </div>
          </div>
        </div>

        {/* Recharts BarChart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySmartphoneChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 10 }}
                tickFormatter={(val) => 
                  smartphoneMetricView === "revenue" 
                    ? (val >= 1000000 ? `${(val/1000000).toFixed(0)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : `${val}`)
                    : `${val}`
                }
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-1.5 min-w-[210px]">
                        <div className="font-extrabold text-indigo-300 border-b border-slate-800 pb-1.5 flex items-center justify-between">
                          <span>{data.fullMonthName}</span>
                          <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                            {data.unitsTotal} Unit Total
                          </span>
                        </div>
                        <div className="space-y-1 pt-0.5">
                          <p className="text-blue-400 font-semibold flex justify-between">
                            <span>Smartphone BARU:</span>
                            <span>{data.unitsBaru} Unit</span>
                          </p>
                          <p className="text-purple-400 font-semibold flex justify-between">
                            <span>Smartphone BEKAS:</span>
                            <span>{data.unitsBekas} Unit</span>
                          </p>
                          <div className="border-t border-slate-800 my-1 pt-1.5">
                            <p className="text-emerald-400 font-bold flex justify-between">
                              <span>Total Omzet:</span>
                              <span>Rp {Number(data.revenue).toLocaleString("id-ID")}</span>
                            </p>
                            <p className="text-teal-300 font-medium flex justify-between text-[11px]">
                              <span>Est. Laba Kotor:</span>
                              <span>Rp {Number(data.profit).toLocaleString("id-ID")}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {smartphoneMetricView === "units" ? (
                <>
                  <Bar dataKey="unitsBaru" name="HP Baru" fill="#3B82F6" stackId="a" radius={[0, 0, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="unitsBekas" name="HP Bekas" fill="#8B5CF6" stackId="a" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </>
              ) : (
                <>
                  <Bar dataKey="revenue" name="Omzet Smartphone" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="profit" name="Estimasi Laba" fill="#06B6D4" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Footer Note */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-4">
          <div className="flex items-center gap-4">
            {smartphoneMetricView === "units" ? (
              <>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="h-3 w-3 bg-blue-500 rounded-sm" />
                  Smartphone BARU ({smartphone12MonthSummary.totalBaru} unit)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="h-3 w-3 bg-purple-500 rounded-sm" />
                  Smartphone BEKAS ({smartphone12MonthSummary.totalBekas} unit)
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="h-3 w-3 bg-emerald-500 rounded-sm" />
                  Total Omzet Penjualan
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <span className="h-3 w-3 bg-teal-500 rounded-sm" />
                  Estimasi Laba Kotor
                </span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            *Data dihitung otomatis dari transaksi terekam status <strong>PAID</strong>
          </span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Line Chart Component for Daily & Weekly Revenue Trend */}
        <div id="pdf-revenue-line-trend-chart" className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Grafik Garis Tren Pendapatan (Harian & Mingguan)
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase">
                    RECHARTS LINE CHART
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi pergerakan omzet pendapatan, estimasi laba kotor, dan target penjualan berkala
                </p>
              </div>
            </div>

            {/* View Period Selector & Summary Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRevenueTrendPeriod("DAILY")}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    revenueTrendPeriod === "DAILY"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tren Harian (14 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => setRevenueTrendPeriod("WEEKLY")}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    revenueTrendPeriod === "WEEKLY"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tren Mingguan (8 Minggu)
                </button>
              </div>

              <div className="bg-indigo-50/80 border border-indigo-100 px-3.5 py-1.5 rounded-xl text-right">
                <span className="text-[10px] text-indigo-600 font-extrabold uppercase block">
                  Total Omzet {revenueTrendPeriod === "DAILY" ? "14 Hari" : "8 Minggu"}
                </span>
                <span className="font-black text-indigo-700 font-mono text-sm">
                  Rp {(revenueTrendPeriod === "DAILY" ? dailyRevenueLineData : weeklyRevenueLineData).reduce((a, b) => a + b.Revenue, 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendPeriod === "DAILY" ? dailyRevenueLineData : weeklyRevenueLineData} margin={{ top: 15, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : `${val}`}
                />
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-1.5 min-w-[220px]">
                          <div className="font-extrabold text-slate-200 border-b border-slate-800 pb-1.5 flex justify-between items-center">
                            <span>{label}</span>
                            <span className="text-[10px] text-indigo-300 font-mono">{data.dateStr}</span>
                          </div>
                          <div className="space-y-1 text-[11px] pt-0.5">
                            <div className="flex justify-between items-center text-indigo-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                                Omzet Pendapatan:
                              </span>
                              <span className="font-mono text-white text-xs font-black">Rp {data.Revenue.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-300 font-medium">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                Estimasi Laba Kotor:
                              </span>
                              <span className="font-mono text-emerald-300 font-bold">Rp {data.Profit.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between items-center text-amber-300 text-[10px]">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                Target Acuan:
                              </span>
                              <span className="font-mono font-bold">Rp {data.Target.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between items-center text-sky-300 pt-1 border-t border-slate-800 text-[10px]">
                              <span>Frekuensi Transaksi:</span>
                              <span className="font-mono text-white font-bold">{data.Transactions} Transaksi</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="Revenue" 
                  name="Pendapatan (Omzet)" 
                  stroke="#4F46E5" 
                  strokeWidth={3.5} 
                  dot={{ r: 4, fill: "#4F46E5", strokeWidth: 2, stroke: "#FFF" }}
                  activeDot={{ r: 8, fill: "#4F46E5" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Profit" 
                  name="Estimasi Laba Kotor" 
                  stroke="#10B981" 
                  strokeWidth={2.5} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#10B981" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Target" 
                  name="Target Acuan" 
                  stroke="#F59E0B" 
                  strokeWidth={1.5} 
                  strokeDasharray="3 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Daily Sales Volume Trend Component (Recharts) */}
        <div id="pdf-7day-sales-volume-chart" className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Tren Volume Penjualan Harian (7 Hari Terakhir)
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase">
                    RECHARTS VOLUME
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi kuantitas unit produk terjual & frekuensi transaksi paid harian selama 7 hari terakhir
                </p>
              </div>
            </div>

            {/* Metric Summary Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Total Unit (7 Hari)</span>
                <span className="font-black text-indigo-600 font-mono text-sm">
                  {currentWeekChartData.reduce((acc, curr) => acc + curr.Volume, 0)} Unit
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Rata-Rata / Hari</span>
                <span className="font-black text-slate-800 font-mono text-sm">
                  {(currentWeekChartData.reduce((acc, curr) => acc + curr.Volume, 0) / 7).toFixed(1)} Unit
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Puncak Volume</span>
                <span className="font-black text-emerald-600 font-mono text-sm">
                  {Math.max(...currentWeekChartData.map(d => d.Volume), 0)} Unit
                </span>
              </div>
            </div>
          </div>

          {/* Chart & Daily Log Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Recharts Area + Line Chart Container */}
            <div className="lg:col-span-8 h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={currentWeekChartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6366F1', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(val) => `${val}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#0EA5E9', fontSize: 10 }}
                    tickFormatter={(val) => `${val} tx`}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-1.5 min-w-[210px]">
                            <div className="font-extrabold text-slate-200 border-b border-slate-800 pb-1.5 flex justify-between items-center">
                              <span>{label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{data.dateStr}</span>
                            </div>
                            <div className="space-y-1 text-[11px] pt-0.5">
                              <div className="flex justify-between items-center text-indigo-300 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                  Volume Produk Terjual:
                                </span>
                                <span className="font-mono text-white text-xs">{data.Volume} Unit</span>
                              </div>
                              <div className="flex justify-between items-center text-sky-300">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                                  Jumlah Transaksi:
                                </span>
                                <span className="font-mono">{data.Transactions} Transaksi</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800 text-[10px]">
                                <span>Rata-rata Unit/Tx:</span>
                                <span className="font-mono text-emerald-400 font-bold">
                                  {data.Transactions > 0 ? (data.Volume / data.Transactions).toFixed(1) : 0} Unit/Tx
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-amber-300 text-[10px]">
                                <span>Total Omzet Harian:</span>
                                <span className="font-mono font-bold">Rp {data.Revenue.toLocaleString("id-ID")}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="Volume" 
                    name="Volume Unit" 
                    stroke="#6366F1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#volumeGradient)" 
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="Volume" 
                    name="Volume Bar" 
                    fill="#818CF8" 
                    opacity={0.3}
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={28} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="Transactions" 
                    name="Jumlah Transaksi" 
                    stroke="#0EA5E9" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: "#0EA5E9" }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Volume Breakdown Mini List */}
            <div className="lg:col-span-4 bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Rincian Volume 7 Hari
                </span>
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Daily Log
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {currentWeekChartData.map((d, idx) => {
                  const maxVol = Math.max(...currentWeekChartData.map(item => item.Volume), 1);
                  const isPeak = d.Volume === maxVol && d.Volume > 0;
                  return (
                    <div 
                      key={d.dateStr || d.day || `cwd-${idx}`} 
                      className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                        isPeak ? "bg-indigo-100/70 border border-indigo-200 text-indigo-950 font-bold shadow-2xs" : "bg-white border border-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isPeak ? "bg-indigo-600" : "bg-slate-300"}`} />
                        <span className="font-semibold">{d.day}</span>
                        {isPeak && (
                          <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-xs font-black uppercase">
                            PEAK
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-500">{d.Transactions} Tx</span>
                        <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {d.Volume} Unit
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Trend Chart (2 cols wide) */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Grafik Pendapatan Transaksi Harian (Minggu Ini)
                <span className="text-[10px] font-extrabold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                  RECHARTS
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Perbandingan omzet & estimasi laba kotor harian per transaksi paid minggu ini
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 bg-blue-500 rounded-sm" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 bg-emerald-500 rounded-sm" />
                Profit
              </span>
            </div>
          </div>
          
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentWeekChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : `${val}`}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1">
                          <p className="font-extrabold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
                          <p className="text-blue-400 font-bold flex items-center justify-between gap-4">
                            <span>Pendapatan (Revenue):</span>
                            <span>Rp {Number(payload[0].value || 0).toLocaleString("id-ID")}</span>
                          </p>
                          {payload[1] && (
                            <p className="text-emerald-400 font-medium flex items-center justify-between gap-4">
                              <span>Laba Kotor (Profit):</span>
                              <span>Rp {Number(payload[1].value || 0).toLocaleString("id-ID")}</span>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Revenue" name="Revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Profit" name="Gross Profit" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-4">
            <span className="text-[11px] text-slate-600 font-medium">
              Top Performance: <strong className="text-slate-800 font-bold">{currentWeekChartData.reduce((prev, curr) => (curr.Revenue > prev.Revenue ? curr : prev), currentWeekChartData[0] || { day: '-' }).day}</strong>
            </span>
            <span className="text-[11px]">Maksimum Omzet Harian: <strong className="text-slate-800">Rp {Math.max(...currentWeekChartData.map(d => d.Revenue), 0).toLocaleString("id-ID")}</strong></span>
          </div>

          {/* Rincian Metrik Operasional POS (Memanfaatkan sisa ruang di bawah grafik) */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Rata-Rata Nilai Transaksi (AOV)
              </span>
              <div className="text-xl font-black text-slate-900">
                Rp {transactions.length > 0 ? (Math.round((totalRevenue || 0) / transactions.length) ?? 0).toLocaleString("id-ID") : 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Dari total {transactions.length} riwayat transaksi terekam
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Margin Keuntungan Bersih Est.
              </span>
              <div className="text-xl font-black text-emerald-600">
                {totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : '0%'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Rasio margin bersih terhadap total pendapatan
              </p>
            </div>
          </div>
        </div>

        {/* Widget Profitabilitas Per Kategori (Donut Chart) */}
        <div id="pdf-profitability-donut-chart" className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Profitabilitas Per Kategori
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                      DIAGRAM DONAT
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kontribusi margin laba kotor & rasio profitabilitas per kategori produk (HP Baru, HP Bekas, Aksesoris, Sparepart)
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Margin Terbuku</span>
              <span className="font-black text-emerald-700 font-mono text-sm">
                Rp {categoryProfitabilityData.reduce((acc, curr) => acc + curr.profit, 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Recharts Donut Chart */}
            <div className="lg:col-span-5 relative h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryProfitabilityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="profit"
                    nameKey="category"
                  >
                    {categoryProfitabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-800 text-xs space-y-1.5 min-w-[200px]">
                            <div className="font-extrabold flex items-center gap-2 border-b border-slate-800 pb-1.5" style={{ color: data.color }}>
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }}></span>
                              <span>{data.category}</span>
                            </div>
                            <div className="space-y-1 text-[11px] pt-1">
                              <div className="flex justify-between text-slate-300">
                                <span>Total Omzet:</span>
                                <span className="font-mono">Rp {data.revenue.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-emerald-400 font-bold">
                                <span>Laba Bersih:</span>
                                <span className="font-mono">Rp {data.profit.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-indigo-300">
                                <span>Margin Laba:</span>
                                <span className="font-bold">{data.marginPct}%</span>
                              </div>
                              <div className="flex justify-between text-amber-300">
                                <span>Porsi Laba:</span>
                                <span className="font-bold">{data.profitSharePct}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Overlay inside Donut Chart */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Kategori Utama</span>
                <span className="text-sm font-black text-slate-800">
                  {[...categoryProfitabilityData].sort((a,b) => b.profit - a.profit)[0]?.category || "HP Baru"}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mt-0.5">
                  {([...categoryProfitabilityData].sort((a,b) => b.profit - a.profit)[0]?.marginPct || "0")}% Margin
                </span>
              </div>
            </div>

            {/* Category Breakdown Cards Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryProfitabilityData.map((cat, idx) => (
                <div key={cat.category || `cat-profit-${idx}`} className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 hover:bg-slate-50 transition-all">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase ${cat.badgeBg}`}>
                      {cat.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      Porsi: {cat.profitSharePct}%
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-black text-slate-900 font-mono">
                      Rp {cat.profit.toLocaleString("id-ID")}
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mt-0.5">
                      <span>Margin Laba: <strong className="text-slate-800 font-bold">{cat.marginPct}%</strong></span>
                      <span>Omzet: <strong className="text-slate-700 font-mono">Rp {cat.revenue >= 1000000 ? `${(cat.revenue/1000000).toFixed(1)}M` : `${(cat.revenue/1000).toFixed(0)}k`}</strong></span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, parseFloat(cat.profitSharePct)))}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Brand Sales Ratio & Low Stock Alerts */}
        <div className="space-y-6">
          {/* Sticky Notes Component */}
          <div className="bg-amber-50 border border-amber-200/80 shadow-xs rounded-2xl p-4 flex flex-col no-print">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-amber-700" />
                Catatan Shift
              </h2>
              <span className="text-[9px] font-bold text-amber-700/70 bg-amber-200/50 px-2 py-0.5 rounded-md">
                Shift Note
              </span>
            </div>
            <textarea
              value={shiftNote}
              onChange={(e) => setShiftNote(e.target.value)}
              placeholder="Tulis pesan ringkas untuk shift berikutnya..."
              rows={3}
              className="w-full h-20 bg-amber-100/30 hover:bg-amber-100/50 border border-amber-200/60 rounded-xl p-2.5 resize-none outline-none text-xs text-amber-900 placeholder:text-amber-700/50 focus:bg-white focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Merek HP Paling Laris</h2>
            
            {Object.keys(brandSales).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Tidak ada penjualan terekam</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(brandSales).map(([brand, count], idx) => {
                  const percent = Math.floor((count / maxBrandSales) * 100);
                  return (
                    <div key={brand || `brand-${idx}`} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{brand}</span>
                        <span className={`${getAccentClass("text")} font-bold`}>{count} Unit</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${percent}%` }}
                          className={`h-full bg-gradient-to-r ${getChartGradientClass()} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Notifications / System Logs */}
          <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-amber-500 animate-bounce" />
                Aktivitas Sistem POS
              </h2>
              {notifications.length > 0 && (
                <button 
                  onClick={async () => {
                    await apiFetch("/api/notifications/clear", { method: "POST" });
                    fetchDashboardData();
                  }}
                  className="text-[10px] text-slate-400 hover:text-primary-600 underline cursor-pointer"
                >
                  Hapus Semua
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400">
                Sistem beroperasi normal tanpa peringatan aktif.
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {notifications.map((n, i) => (
                  <div key={n.id || i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-3 text-xs">
                    <div className="mt-0.5 shrink-0">
                      {n.type === "STOCK_ALERT" ? (
                        <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                      ) : (
                        <Mail className="h-4.5 w-4.5 text-primary-500" />
                      )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-bold text-slate-800">{n.title}</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed break-words">{n.message}</p>
                      <span className="text-[9px] text-slate-400 block">
                        {new Date(n.timestamp).toLocaleTimeString("id-ID")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* Target Penjualan Bulanan Section & Individual/Category Progress Charts */}
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 no-print space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Panel Target Pendapatan Bulanan & Evaluasi Kinerja
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Periode: <span className="font-bold text-slate-700">{new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}</span> — Monitoring kontribusi kategori produk & pencapaian omzet karyawan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Tab Switcher: Employee vs Category */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setTargetViewMode("employee")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  targetViewMode === "employee"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="h-3.5 w-3.5 text-indigo-600" />
                <span>Individual Karyawan</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetViewMode("category")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  targetViewMode === "category"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Boxes className="h-3.5 w-3.5 text-emerald-600" />
                <span>Target Kategori Produk</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetViewMode("report")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  targetViewMode === "report"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-primary-600" />
                <span>Laporan Kinerja Penjualan</span>
              </button>
            </div>

            {(userRole === "ADMIN" || userRole === "MANAGER") && (
              <>
                {targetViewMode === "employee" ? (
                  <button 
                    onClick={() => {
                      setEditingTargets(
                        employees.map(emp => {
                          const existing = currentTargets.find((t: any) => t.userId === emp.id);
                          return { userId: emp.id, amount: existing ? existing.targetAmount : 25000000 };
                        })
                      );
                      setShowTargetModal(true);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold shadow-xs shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Tetapkan Target Sales Karyawan
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setEditingCategoryTargets({ ...categoryTargets });
                      setShowCategoryTargetModal(true);
                    }}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl font-bold shadow-xs shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Boxes className="h-3.5 w-3.5" />
                    Tetapkan Target Kategori
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-xl border-slate-200">
            Memuat data target karyawan...
          </div>
        ) : (
          <>
            {targetViewMode === "report" ? (
              <SalesPerformanceReport transactions={transactions} employees={employees} currentUser={currentUser} />
            ) : targetViewMode === "employee" ? (
              <>
                {/* Grafik Progres Individual Karyawan (Recharts Bar Chart Target vs Realisasi) */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Grafik Perbandingan Target vs Realisasi Pendapatan</h3>
                    <p className="text-[10px] text-slate-500">Visualisasi pencapaian omzet individual karyawan bulan ini</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-xl">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-slate-300 inline-block" /> Target (Rp)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Realisasi Omzet (Rp)
                  </span>
                </div>
              </div>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={employees
                      .filter(emp => userRole === "ADMIN" || userRole === "MANAGER" || currentUser?.id === emp.id)
                      .map(emp => {
                        const target = currentTargets.find((t: any) => t.userId === emp.id);
                        const targetVal = target ? target.targetAmount : 0;
                        const realisasiVal = salesPerUser[emp.id] || 0;
                        const pct = targetVal > 0 ? Math.round((realisasiVal / targetVal) * 100) : 0;
                        return {
                          name: emp.name.length > 12 ? emp.name.substring(0, 10) + ".." : emp.name,
                          fullName: emp.name,
                          role: emp.role || "Kasir",
                          Target: targetVal,
                          Realisasi: realisasiVal,
                          PencapaianPct: pct
                        };
                      })}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#64748b" />
                    <YAxis 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="#64748b" 
                      tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`} 
                    />
                    <Tooltip 
                      cursor={{ fill: "#f1f5f9" }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                              <p className="font-bold text-sm text-emerald-400">{data.fullName} ({data.role})</p>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Target:</span>
                                <span className="font-bold text-white">Rp {data.Target.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-slate-300">
                                <span>Realisasi:</span>
                                <span className="font-bold text-emerald-400">Rp {data.Realisasi.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="pt-1 border-t border-slate-800 flex justify-between gap-4">
                                <span className="text-slate-400">% Pencapaian:</span>
                                <span className="font-extrabold text-amber-300">{data.PencapaianPct}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Target" fill="#cbd5e1" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="Realisasi" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Employee Target Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp, idx) => {
                const target = currentTargets.find((t: any) => t.userId === emp.id);
                const targetAmount = target ? target.targetAmount : 0;
                
                if (userRole !== "ADMIN" && userRole !== "MANAGER" && currentUser?.id !== emp.id) {
                  return null;
                }

                const achieved = salesPerUser[emp.id] || 0;
                const percentage = targetAmount > 0 ? Math.min(100, Math.round((achieved / targetAmount) * 100)) : (achieved > 0 ? 100 : 0);
                const shortfall = Math.max(targetAmount - achieved, 0);

                // Run-rate calculation per individual
                const dailyNeededForEmp = shortfall > 0 ? Math.ceil(shortfall / remainingDaysInMonth) : 0;

                const isCompleted = percentage >= 100;
                const isGoodProgress = percentage >= 50;

                const radius = 24;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (Math.min(100, percentage) / 100) * circumference;

                return (
                  <div 
                    key={emp.id || `emp-target-card-${idx}`} 
                    className="p-4 bg-white border border-slate-200/90 shadow-xs hover:shadow-md rounded-2xl relative overflow-hidden transition-all flex flex-col justify-between gap-3 group"
                  >
                    {/* Header: Employee Name & Status Pill */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isCompleted ? "bg-emerald-100 text-emerald-800" : isGoodProgress ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-slate-900 block truncate">{emp.name}</span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{emp.role || "Sales / Kasir"}</span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 flex items-center gap-1 ${
                        isCompleted 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : isGoodProgress 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {isCompleted ? "🎉 Target Tercapai" : isGoodProgress ? "🟢 On Track" : "⚡ Perlu Pacu"}
                      </span>
                    </div>

                    {/* Content: Progress Circle & Target Metrics */}
                    <div className="flex items-center gap-4">
                      {targetAmount > 0 ? (
                        <div className="relative shrink-0 flex items-center justify-center">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              className="text-slate-100"
                              strokeWidth="5"
                              stroke="currentColor"
                              fill="transparent"
                              r="24"
                              cx="32"
                              cy="32"
                            />
                            <circle
                              className={isCompleted ? "text-emerald-500" : isGoodProgress ? "text-indigo-600" : "text-amber-500"}
                              strokeWidth="5"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="24"
                              cx="32"
                              cy="32"
                              style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                            />
                          </svg>
                          <span className="absolute text-[11px] font-black text-slate-800">
                            {percentage}%
                          </span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-slate-50 rounded-full border border-slate-200 border-dashed">
                          <span className="text-[10px] font-bold text-slate-400">N/A</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Realisasi:</span>
                          <span className="font-extrabold text-slate-900">Rp {(achieved ?? 0).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Target:</span>
                          <span className="font-bold text-slate-500">{targetAmount > 0 ? 'Rp ' + (targetAmount ?? 0).toLocaleString("id-ID") : '-'}</span>
                        </div>
                        {targetAmount > 0 && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Sisa Target:</span>
                            <span className={`font-semibold ${shortfall === 0 ? "text-emerald-600 font-bold" : "text-amber-600"}`}>
                              {shortfall === 0 ? "Tercapai!" : `Rp ${shortfall.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer: Daily Pace / Quick Edit Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-slate-500 truncate">
                        {targetAmount > 0 && shortfall > 0 
                          ? `Butuh ~Rp ${dailyNeededForEmp.toLocaleString("id-ID")}/hari`
                          : targetAmount > 0 
                            ? "✅ Kuota omset terpenuhi" 
                            : "Belum ada target diatur"
                        }
                      </span>

                      {(userRole === "ADMIN" || userRole === "MANAGER") && (
                        <button
                          onClick={() => {
                            setEditingTargets([
                              { userId: emp.id, amount: targetAmount > 0 ? targetAmount : 25000000 }
                            ]);
                            setShowTargetModal(true);
                          }}
                          className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Edit Target
                        </button>
                      )}
                    </div>

                    {isCompleted && (
                      <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                        <Sparkles className="w-20 h-20 text-emerald-500 transform translate-x-4 -translate-y-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Category Target Summary & Contribution Stack Bar */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Distribusi & Kontribusi Target Kategori terhadap Target Total Bulanan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Total Realisasi: <strong className="text-emerald-700 font-bold">Rp {categorySalesPerformance.totalRealized.toLocaleString("id-ID")}</strong> dari Target Kategori <strong className="text-slate-800">Rp {categorySalesPerformance.totalTarget.toLocaleString("id-ID")}</strong> ({categorySalesPerformance.overallProgressPct}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Pencapaian Kategori:</span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    categorySalesPerformance.overallProgressPct >= 100 ? "bg-emerald-100 text-emerald-800" : categorySalesPerformance.overallProgressPct >= 50 ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {categorySalesPerformance.overallProgressPct}%
                  </span>
                </div>
              </div>

              {/* Visual Stacked Progress Bar of Category Contributions */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Progres Omzet Per Kategori Produk</span>
                  <span>Target Keseluruhan: Rp {categorySalesPerformance.totalTarget.toLocaleString("id-ID")}</span>
                </div>
                <div className="w-full h-3 bg-slate-200/70 rounded-full overflow-hidden flex">
                  {categorySalesPerformance.categoriesList.map((cat, idx) => (
                    <div
                      key={`cat-progress-bar-${cat.category || idx}`}
                      style={{ width: `${Math.min(100, (cat.realizedRevenue / Math.max(1, categorySalesPerformance.totalTarget)) * 100)}%`, backgroundColor: cat.color }}
                      className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full relative group"
                      title={`${cat.category}: Rp ${cat.realizedRevenue.toLocaleString("id-ID")} (${cat.progressPct}%)`}
                    />
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
                  {categorySalesPerformance.categoriesList.map((cat, idx) => (
                    <div key={`cat-legend-${cat.category || idx}`} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-700">{cat.category}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">({cat.progressPct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Target Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorySalesPerformance.categoriesList.map((cat, idx) => {
                const radius = 22;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (Math.min(100, cat.progressPct) / 100) * circumference;
                const isCompleted = cat.progressPct >= 100;

                return (
                  <div
                    key={cat.category || `cat-card-${idx}`}
                    className="p-4 bg-white border border-slate-200/90 shadow-xs hover:shadow-md rounded-2xl relative overflow-hidden transition-all flex flex-col justify-between gap-3 group"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs" style={{ backgroundColor: cat.color }}>
                          <Boxes className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-sm text-slate-900 block truncate">{cat.category}</span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{cat.unitCount} Unit Terjual</span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 flex items-center gap-1 ${
                        isCompleted 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : cat.progressPct >= 50 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {isCompleted ? "🎉 Target Tercapai" : cat.progressPct >= 50 ? "🟢 On Track" : "⚡ Perlu Pacu"}
                      </span>
                    </div>

                    {/* Card Body: Circle gauge & values */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r={radius} stroke="#e2e8f0" strokeWidth="5" fill="transparent" />
                          <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            stroke={cat.color}
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-black text-slate-800">
                          {cat.progressPct}%
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Realisasi:</span>
                          <span className="font-black text-slate-900">Rp {cat.realizedRevenue.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Target Kategori:</span>
                          <span className="font-bold text-slate-500">Rp {cat.targetAmount.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-400">Sisa Target:</span>
                          <span className={`font-semibold ${cat.shortfall === 0 ? "text-emerald-600 font-bold" : "text-amber-600"}`}>
                            {cat.shortfall === 0 ? "Tercapai!" : `Rp ${cat.shortfall.toLocaleString("id-ID")}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-slate-500 truncate">
                        {cat.shortfall > 0 
                          ? `Butuh ~Rp ${Math.ceil(cat.shortfall / remainingDaysInMonth).toLocaleString("id-ID")}/hari`
                          : "✅ Quota Kategori Terpenuhi"
                        }
                      </span>
                      {(userRole === "ADMIN" || userRole === "MANAGER") && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryTargets({ ...categoryTargets, [cat.category]: cat.targetAmount });
                            setShowCategoryTargetModal(true);
                          }}
                          className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Edit Target
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    )}
  </div>


      {/* Ringkasan Aktivitas Karyawan Terbaru */}
      <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 no-print">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-primary-500" />
            Ringkasan Aktivitas Terbaru
          </h2>
          <button 
            onClick={() => {
              const btn = document.getElementById('tab-employees');
              if (btn) btn.click();
            }}
            className={`text-[10px] ${getAccentClass("text")} hover:underline font-bold transition-all cursor-pointer`}
          >
            Lihat Log Lengkap &rarr;
          </button>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border border-slate-100 rounded-xl">
            <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Belum ada aktivitas terekam.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((act, idx) => {
              const isDeletion = act.action.startsWith("DELETE_");
              const isCreation = act.action.startsWith("ADD_");
              const isUpdate = act.action.startsWith("UPDATE_");
              
              const actionBadgeClass = isDeletion
                ? "bg-red-50 text-red-700 border-red-150"
                : isCreation
                  ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                  : isUpdate
                    ? "bg-amber-50 text-amber-700 border-amber-150"
                    : "bg-primary-50 text-primary-700 border-primary-150";

              return (
                <div key={act.id || `act-item-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-150 rounded-xl gap-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px] uppercase shadow-xs shrink-0">
                      {act.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{act.userName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{act.details}</p>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col sm:items-end items-center justify-between sm:justify-center gap-2 mt-2 sm:mt-0">
                    <span className={`px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-wider ${actionBadgeClass}`}>
                      {act.action.replace("DELETE_", "HAPUS ").replace("UPDATE_", "UBAH ").replace("ADD_", "TAMBAH ")}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {new Date(act.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} - {new Date(act.timestamp).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulator Optimalisasi Promo & Proyeksi Penjualan AI (New Requested Feature) */}
      <div id="ai-promo-optimizer-section" className="bg-white border border-slate-200/85 shadow-xs rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
              Simulator Optimalisasi Promo & Proyeksi Penjualan AI
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulasikan skenario promosi Anda dan biarkan Gemini AI memperkirakan volume, margin, serta ROI sebelum meluncurkan blast kampanye pemasaran WhatsApp.
            </p>
          </div>
          <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 uppercase tracking-wider self-start">
            Powered by Gemini 3.5
          </span>
        </div>

        <form onSubmit={(e) => handleRunSimulation(e)} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end bg-slate-50/50 p-4.5 rounded-2xl border border-slate-150">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tipe Kampanye Promosi</label>
            <select
              value={promoType}
              onChange={(e) => setPromoType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="CASHBACK">💰 Cashback Special Belanja</option>
              <option value="WHATSAPP_COUPON">🎫 Kupon Eksklusif WhatsApp</option>
              <option value="TRADEIN_DRIVE">🔄 Upgrade Tukar Tambah (Buyback)</option>
              <option value="CLEARANCE">🔥 Cuci Gudang Stok Lama</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Merek Smartphone Sasaran</label>
            <select
              value={targetBrand}
              onChange={(e) => setTargetBrand(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">Semua Merek (Global Promo)</option>
              <option value="Apple">Apple iPhone</option>
              <option value="Samsung">Samsung Galaxy</option>
              <option value="Xiaomi">Xiaomi Redmi / Poco</option>
              <option value="Oppo">Oppo Series</option>
              <option value="Vivo">Vivo Series</option>
              <option value="Infinix">Infinix Hot / Note</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Persentase Diskon</label>
              <span className="text-xs font-bold text-indigo-600">{discountPercent}%</span>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-1">
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <button
                type="submit"
                disabled={isSimulating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1 shadow-md shadow-indigo-600/10"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Simulasi...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    Analisis AI
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {simulationResult && (
          <div className="space-y-6 animate-fade-in pt-2">
            
            {/* Visual Double-Line / Bar Forecasting Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Grafik Proyeksi Pendapatan Mingguan (4 Minggu Ke Depan)</h3>
                    <p className="text-[10px] text-slate-500">Membandingkan Baseline historis dengan efek promosi {promoType}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-slate-600"></span> Baseline
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-indigo-400">
                      <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Proyeksi Promo
                    </span>
                  </div>
                </div>

                {/* Simulated Chart Bars */}
                <div className="h-44 flex items-end justify-around pt-6 pb-2 px-4 border-b border-slate-800">
                  {simulationResult.weeks.map((w: any, idx: number) => {
                    const maxVal = Math.max(...simulationResult.weeks.map((wk: any) => Math.max(wk.baseline, wk.projected)));
                    const baselineHeight = Math.max(10, Math.floor((w.baseline / maxVal) * 100));
                    const projectedHeight = Math.max(10, Math.floor((w.projected / maxVal) * 100));

                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 w-1/5 group">
                        <div className="flex items-end gap-2.5 h-32 w-full justify-center">
                          {/* Baseline Bar */}
                          <div className="w-4 bg-slate-700/80 rounded-t-sm relative group/base" style={{ height: `${baselineHeight}%` }}>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-[9px] text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700 opacity-0 group-hover/base:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Rp {(w.baseline / 1000000).toFixed(1)}M
                            </div>
                          </div>
                          {/* Projected Promo Bar */}
                          <div className="w-4 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm relative group/proj" style={{ height: `${projectedHeight}%` }}>
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-950 text-[9px] text-indigo-300 px-1.5 py-0.5 rounded font-bold font-mono border border-indigo-800 opacity-0 group-hover/proj:opacity-100 transition-opacity whitespace-nowrap z-10">
                              Rp {(w.projected / 1000000).toFixed(1)}M
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{w.week}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 px-2 pt-1 font-mono">
                  <span>Total Baseline: Rp {(simulationResult.totalBaseline ?? 0).toLocaleString("id-ID")}</span>
                  <span className="text-indigo-400 font-bold">Total Proyeksi: Rp {(simulationResult.totalProjected ?? 0).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex-1 space-y-1">
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block">Est. Tambahan Kas Masuk</span>
                  <p className="text-xl font-extrabold text-indigo-900 font-mono">
                    +Rp {(simulationResult.netUptick ?? 0).toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-medium">
                    Kenaikan volume sebesar +{simulationResult.totalBaseline ? Math.floor(((simulationResult.totalProjected || 0) / simulationResult.totalBaseline - 1) * 100) : 0}% dari baseline normal.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex-1 space-y-1">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Indikator ROI Kampanye</span>
                  <p className="text-xl font-extrabold text-emerald-800 font-mono">SANGAT TINGGI</p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    Efisiensi biaya WhatsApp blast menekan Customer Acquisition Cost s/d 95% dibanding iklan tradisional.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Target Demografis</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1">Daftar Kontak Aktif FonePOS</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sistem akan menyasar nomor ponsel konsumen dari riwayat invoice & buyback.</p>
                </div>
              </div>
            </div>

            {/* AI Strategic Analysis Output */}
            <div className="bg-indigo-950/5 p-5 rounded-2xl border border-indigo-900/10 space-y-3.5">
              <h3 className="text-xs font-bold uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Ulasan Strategis & Analisis Finansial AI (Gemini 3.5-Flash)
              </h3>
              <div className="text-xs text-slate-700 leading-relaxed space-y-3 prose max-w-none">
                {simulationResult.aiAnalysis.split("\n\n").map((para: string, i: number) => {
                  if (para.startsWith("###")) {
                    return <h4 key={i} className="text-sm font-bold text-slate-900 pt-2">{para.replace("###", "").trim()}</h4>;
                  }
                  if (para.startsWith("####")) {
                    return <h5 key={i} className="text-xs font-bold text-slate-800 pt-1 uppercase tracking-wider">{para.replace("####", "").trim()}</h5>;
                  }
                  if (para.startsWith("*") || para.startsWith("-")) {
                    return (
                      <ul key={i} className="list-disc pl-4 space-y-1">
                        {para.split("\n").map((li, idx) => (
                          <li key={idx} className="text-slate-600">{li.replace(/^[\s*-]+/, "").trim()}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i} className="whitespace-pre-wrap">{para}</p>;
                })}
              </div>
            </div>

            {/* Campaign Blast Form Area */}
            <div className="bg-emerald-950/5 p-5 rounded-2xl border border-emerald-900/10 space-y-4">
              <div className="flex justify-between items-center border-b border-emerald-900/10 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase text-emerald-900 tracking-wider">Editor Template Blaster WhatsApp CRM</h3>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                  Personalized Blast
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Pesan Kampanye yang Siap Dikirim (Gunakan [Nama] untuk personalisasi)</label>
                <textarea
                  rows={6}
                  value={editableTemplate}
                  onChange={(e) => setEditableTemplate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {launchSuccess !== null ? (
                <div className="p-4 bg-emerald-600 text-white rounded-xl space-y-2 animate-bounce">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span className="font-extrabold text-sm">Campaign WhatsApp Berhasil Diledakkan!</span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Sebanyak <strong>{launchSuccess} pelanggan</strong> telah dikirimi pesan personalisasi promosi otomatis via FoneWA Gateway. Cek status logs di bawah panel ini.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[10px] text-slate-400 max-w-md">
                    Tombol di samping akan mengekstrak kontak pelanggan aktif dari database Anda, mempersonalisasi nama mereka, dan menjadwalkan pengiriman otomatis ke FoneWA logs.
                  </p>
                  <button
                    type="button"
                    onClick={handleLaunchCampaign}
                    disabled={isLaunching}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {isLaunching ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Meluncurkan Campaign...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Luncurkan Blast Campaign Sekarang
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Cloud Backup & Midtrans API Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cloud Backup Manager */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Database className={`h-5 w-5 ${getAccentClass("text")}`} />
                Backup Cloud Otomatis
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Arsip database POS terenkripsi ke cloud storage setiap hari</p>
            </div>
            <button
              id="btn-trigger-backup"
              onClick={handleTriggerBackup}
              disabled={isBackupLoading}
              className={`px-4 py-2 ${getAccentClass("bg")} text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-md disabled:opacity-50 animate-fade-in`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isBackupLoading ? "animate-spin" : ""}`} />
              Backup Sekarang
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Nama File Backup</th>
                  <th className="p-3">Waktu Sync</th>
                  <th className="p-3 text-right">Ukuran</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((log, idx) => (
                  <tr key={log.id || `backup-row-${idx}`} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-[11px] text-slate-600 max-w-[150px] truncate">{log.filename}</td>
                    <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="p-3 text-right text-slate-500">{(log.sizeBytes / 1024).toFixed(2)} KB</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                        {log.status === "SUCCESS" ? "Sukses" : "Gagal"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Midtrans Payment Gateway Config */}
        <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Integrasi Payment Gateway Midtrans
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Hubungkan kunci pembayaran digital SNAP, QRIS, & VA untuk verifikasi instan</p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            {showConfigSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Kredensial Midtrans berhasil disimpan ke server aman!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Key (Sandbox)</label>
                <input
                  type="text"
                  required
                  value={midtransConfig.clientKey}
                  onChange={(e) => setMidtransConfig({ ...midtransConfig, clientKey: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  placeholder="SB-Mid-client-..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Server Key (Secret)</label>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Backend Hidden</span>
                </div>
                <input
                  type="password"
                  required
                  value={midtransConfig.serverKey}
                  onChange={(e) => setMidtransConfig({ ...midtransConfig, serverKey: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  placeholder="SB-Mid-server-..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <input
                  id="midtrans-mode-toggle"
                  type="checkbox"
                  checked={!midtransConfig.isProduction}
                  disabled
                  className="h-4 w-4 accent-blue-600 rounded cursor-not-allowed"
                />
                <span className="text-xs text-slate-600 font-medium">Aktifkan Sandbox Testing</span>
              </div>
              <button
                id="btn-save-midtrans-config"
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs active:scale-[0.97] transition-all cursor-pointer shadow-xs"
              >
                Simpan Keys
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* WhatsApp Cloud API integration Panel (Requested Feature) */}
      <div id="whatsapp-integration-panel" className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-600 animate-pulse" />
              Integrasi WhatsApp & Email Gateway Automation
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kelola pengaturan API untuk notifikasi stok kritis otomatis, disitribusi invoice FoneWA, dan laporan keuangan PDF harian.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${waConfig.isConnected ? "bg-emerald-500" : "bg-red-500"} animate-pulse`}></span>
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border ${waConfig.isConnected ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>
              {waConfig.isConnected ? "FoneWA (MPWA & Official Meta) Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Config form (5 cols) */}
          <form onSubmit={handleSaveWaConfig} className="lg:col-span-5 space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Kredensial API WhatsApp (FoneWA)</span>
            
            {waSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                API Key & Instance ID berhasil disimpan!
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Jenis API Gateway</label>
                <select
                  value={waConfig.gateway}
                  onChange={(e) => setWaConfig({ ...waConfig, gateway: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:outline-none"
                >
                  <option value="FoneWA MPWA">FoneWA MPWA (Multi-Device WA API - No-Code / Scan QR)</option>
                  <option value="Official Meta Cloud API">Official Meta Cloud API (Bisnis Resmi - Meta Verified)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Instance ID / Akun</label>
                <input
                  type="text"
                  required
                  value={waConfig.instanceId}
                  onChange={(e) => setWaConfig({ ...waConfig, instanceId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Contoh: WA-INST-9321"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Sandi Auth Token (Secret Key)</label>
                <input
                  type="password"
                  required
                  value={waConfig.token}
                  onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Contoh: secret_api_token_..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="wa-connected-toggle"
                  type="checkbox"
                  checked={waConfig.isConnected}
                  onChange={(e) => setWaConfig({ ...waConfig, isConnected: e.target.checked })}
                  className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="wa-connected-toggle" className="text-xs text-slate-600 font-medium cursor-pointer">
                  Aktifkan Pengiriman Otomatis
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/10"
            >
              Simpan Konfigurasi Gateway
            </button>
          </form>

          {/* Logs and Activity feed (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Log Antrean Pesan (Dispatch Queue)</span>
              {waLogs.length > 0 && (
                <button
                  onClick={async () => {
                    await apiFetch("/api/whatsapp/clear-logs", { method: "POST" });
                    fetchDashboardData();
                  }}
                  className="text-[9px] text-red-500 hover:underline cursor-pointer"
                >
                  Bersihkan Log
                </button>
              )}
            </div>

            {waLogs.length === 0 ? (
              <div className="h-48 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                <Mail className="h-8 w-8 mb-2 text-slate-300" />
                <p className="text-[11px]">Belum ada pesan WhatsApp yang terkirim hari ini.</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Selesaikan transaksi di POS untuk menguji trigger otomatis.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {waLogs.map((log, idx) => (
                  <div key={log.id || `walog-item-${idx}`} className="p-3 bg-white border border-slate-250 rounded-xl space-y-1.5 shadow-xs">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-extrabold text-indigo-600">
                        {log.type === "INVOICE" ? "🧾 DIGITAL INVOICE" : log.type === "STOCK_ALERT" ? "⚠️ STOCK ALARM" : "📊 REPORT ALARM"}
                      </span>
                      <span className="text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg font-mono leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {log.message}
                    </div>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="text-slate-500 font-medium">Penerima: <strong className="text-slate-700">{log.recipient}</strong></span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded-full border border-emerald-200">
                        SUCCESS (DISPATCHED)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Setel Target Bulanan */}
      {showMonthlyTargetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Pengaturan Target Bulanan Manajer</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Atur target omzet & volume unit HP untuk bulan ini</p>
                </div>
              </div>
              <button
                onClick={() => setShowMonthlyTargetModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Target 1: Pendapatan Omzet */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Target Pendapatan Omzet (IDR)</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold">Bulan: {currentMonthName}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={targetInputVal}
                    onChange={(e) => setTargetInputVal(e.target.value)}
                    placeholder="100000000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl pl-9 pr-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {/* Presets Omzet */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[
                    { label: "50M", val: 50000000 },
                    { label: "100M", val: 100000000 },
                    { label: "250M", val: 250000000 },
                    { label: "500M", val: 500000000 }
                  ].map(p => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setTargetInputVal(p.val.toString())}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold border cursor-pointer transition-all ${
                        Number(targetInputVal) === p.val
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target 2: Volume Smartphone Unit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Penjualan Unit Smartphone (Unit HP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Unit</span>
                  <input
                    type="number"
                    value={unitTargetInputVal}
                    onChange={(e) => setUnitTargetInputVal(e.target.value)}
                    placeholder="30"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl pl-12 pr-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Presets Unit */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[
                    { label: "15 Unit", val: 15 },
                    { label: "30 Unit", val: 30 },
                    { label: "50 Unit", val: 50 },
                    { label: "100 Unit", val: 100 }
                  ].map(p => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setUnitTargetInputVal(p.val.toString())}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold border cursor-pointer transition-all ${
                        Number(unitTargetInputVal) === p.val
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Info */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/50 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-1 text-xs">
                <div className="flex justify-between font-extrabold text-indigo-900 dark:text-indigo-200">
                  <span>Sisa Hari Bulan Ini:</span>
                  <span>{remainingDaysInMonth} Hari</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                  <span>Omzet Harian Diperlukan:</span>
                  <span className="font-bold">
                    ~Rp {Math.max(Math.ceil((Number(targetInputVal || 0) - currentMonthTotalRevenue) / remainingDaysInMonth), 0).toLocaleString("id-ID")}/hari
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                  <span>Unit HP Harian Diperlukan:</span>
                  <span className="font-bold">
                    ~{Math.max(Math.ceil((Number(unitTargetInputVal || 0) - currentMonthSoldUnits) / remainingDaysInMonth), 0)} Unit/hari
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMonthlyTargetModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const numRev = Number(targetInputVal);
                  const numUnit = Number(unitTargetInputVal);
                  if (!isNaN(numRev) && numRev > 0) {
                    setMonthlyTargetAmount(numRev);
                  }
                  if (!isNaN(numUnit) && numUnit > 0) {
                    setMonthlyUnitTargetAmount(numUnit);
                  }
                  setShowMonthlyTargetModal(false);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Simpan Target Bulanan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Target Modal for Individual Sales Target */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Tetapkan Target Pendapatan Individual Karyawan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur target pendapatan spesifik per sales person untuk bulan <span className="font-bold text-slate-700">{new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}</span>
              </p>
            </div>

            {/* Quick Presets for Manager */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Preset Cepat (Terapkan ke Semua Karyawan):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Rp 15 Juta / Orang", val: 15000000 },
                  { label: "Rp 25 Juta / Orang", val: 25000000 },
                  { label: "Rp 50 Juta / Orang", val: 50000000 },
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      setEditingTargets(
                        editingTargets.map(t => ({ ...t, amount: p.val }))
                      );
                    }}
                    className="py-1.5 px-2 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold text-[11px] rounded-lg border border-slate-200 transition-all cursor-pointer text-center"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {editingTargets.map((et, idx) => {
                const emp = employees.find(e => e.id === et.userId);
                if (!emp) return null;
                return (
                  <div key={et.userId || `edit-target-${idx}`} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-slate-900">{emp.name}</label>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">{emp.role || "Kasir"}</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold text-xs">Rp</span>
                      </div>
                      <input
                        type="text"
                        value={et.amount || et.amount === 0 || et.amount === "0" ? Number(et.amount).toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
                          const numericValue = parseInt(rawValue) || 0;
                          const newTargets = [...editingTargets];
                          newTargets[idx].amount = numericValue;
                          setEditingTargets(newTargets);
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs font-bold text-slate-900"
                        placeholder="0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setShowTargetModal(false)} className="flex-1 py-2.5 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-xs transition-colors cursor-pointer">
                Batal
              </button>
              <button 
                onClick={handleSaveTargets}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
              >
                Simpan Target Sales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Setel Target Per Kategori Produk */}
      {showCategoryTargetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Tetapkan Target Penjualan Per Kategori Produk</h3>
                  <p className="text-xs text-slate-500">Atur alokasi target omzet bulanan spesifik per kategori produk</p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryTargetModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {Object.keys(DEFAULT_CATEGORY_TARGETS).map((catName, idx) => {
                const currentVal = editingCategoryTargets[catName] !== undefined ? editingCategoryTargets[catName] : (categoryTargets[catName] || 0);
                const realized = categorySalesPerformance.categoriesList.find(c => c.category === catName)?.realizedRevenue || 0;

                return (
                  <div key={catName || `cat-modal-${idx}`} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Target {catName}
                      </label>
                      <span className="text-[10px] font-mono font-bold text-emerald-600">
                        Realisasi Saat Ini: Rp {realized.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={currentVal ? Number(currentVal).toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, "");
                          const numericValue = parseInt(rawValue) || 0;
                          setEditingCategoryTargets(prev => ({ ...prev, [catName]: numericValue }));
                        }}
                        className="w-full bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                <span className="font-semibold">Total Target Semua Kategori:</span>
                <span className="font-black text-indigo-700 font-mono text-sm">
                  Rp {Object.keys(DEFAULT_CATEGORY_TARGETS).reduce((sum, cat) => sum + (editingCategoryTargets[cat] !== undefined ? editingCategoryTargets[cat] : (categoryTargets[cat] || 0)), 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowCategoryTargetModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...categoryTargets, ...editingCategoryTargets };
                  setCategoryTargets(updated);
                  try {
                    localStorage.setItem("pos_category_targets", JSON.stringify(updated));
                  } catch (e) {
                    console.error("Failed to save category targets to localStorage", e);
                  }
                  setShowCategoryTargetModal(false);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Simpan Target Kategori
              </button>
            </div>
          </motion.div>
        </div>
      )}

      </div>
    </div>
  );
}
