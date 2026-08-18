import { apiFetch, safeResponseJson } from './lib/api';
import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { 
  Smartphone, 
  BarChart3, 
  ShoppingCart, 
  Boxes, 
  Coins, 
  BookOpen, 
  Bot, 
  LogOut, 
  User, 
  Bell, 
  ShieldCheck,
  Cpu,
  RefreshCw,
  Printer,
  ShieldAlert,
  Clock,
  Sun,
  Moon,
  MonitorSmartphone,
  Menu,
  X,
  Wifi,
  WifiOff,
  Wallet,
  Receipt,
  Users,
  Tag,
  Settings,
  Mail,
  Globe,
  Palette,
  Search,
  Building2,
  ShoppingBag,
  ClipboardCheck,
  Database,
  Undo2,
  Wrench,
  GitMerge,
  ArrowRight,
  Zap,
  ChevronDown,
  Plus,
  PanelLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import StockOpnameModule from "./components/StockOpnameModule";
import DataBackupModule from "./components/DataBackupModule";
import NexusPosLogo from "./components/NexusPosLogo";
import { useLanguage } from "./contexts/LanguageContext";
import { Employee, Product, Transaction, Buyback, UserRole, Supplier, PurchaseOrder } from "./types";
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_BUYBACKS, INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS } from "./data";
import { applyCustomHexTheme, clearCustomHexTheme } from "./lib/theme";
import ThemeSelectorPanel from "./components/ThemeSelectorPanel";
import IMEILookupModal from "./components/IMEILookupModal";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import POS from "./components/POS";
import CustomerCatalog from "./components/CustomerCatalog";
import Inventory from "./components/Inventory";
import PurchaseOrderModule from "./components/PurchaseOrderModule";
import BuybackModule from "./components/Buyback";
import FinancialReports from "./components/FinancialReports";
import AIChatbot from "./components/AIChatbot";
import Employees from "./components/Employees";
import ContactsDirectory from "./components/ContactsDirectory";
import PrinterConfig from "./components/PrinterConfig";
import SmtpConfig from "./components/SmtpConfig";
import QuickStartGuide from "./components/QuickStartGuide";
import WarrantyModule from "./components/Warranty";
import CashRegister from "./components/CashRegister";
import PromoConfig from "./components/PromoConfig";
import Subscription from "./components/Subscription";
import TenantManagement from "./components/TenantManagement";
import MultiOutletTransfer from "./components/MultiOutletTransfer";
import SalesReturnModule from "./components/SalesReturnModule";
import ServiceQueueModule from "./components/ServiceQueueModule";
import { AuditLog } from "./components/AuditLog";
import { ConflictResolution } from "./components/ConflictResolution";
import { SupplierManagement } from "./components/SupplierManagement";
import { AuditLogEntry, SyncConflict } from "./types";
import { LandingPage } from "./components/landing/LandingPage";

export default function App() {
  const { language, setLanguage, t } = useLanguage();

  // SaaS Landing Page / POS Application toggle state
  const [showLanding, setShowLanding] = useState<boolean>(() => {
    const saved = localStorage.getItem("employee_session");
    // Show landing page by default if no active session
    return !saved;
  });
  // Mobile Navigation Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Desktop Navigation Sidebar Collapsed / Expanded state with local storage persistence
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("desktop_sidebar_collapsed") === "true";
  });

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("desktop_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Session State
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const saved = localStorage.getItem("employee_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [logoutReason, setLogoutReason] = useState<string | null>(null);
  const [showIdleWarning, setShowIdleWarning] = useState<boolean>(false);
  const [idleCountdown, setIdleCountdown] = useState<number>(60);
  const lastActivity = useRef<number>(Date.now());

  // Dark Mode Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("dark_mode") === "true";
  });

  // App Theme Color, Global IMEI Lookup & Quick Actions Panel State
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showImeiModal, setShowImeiModal] = useState<boolean>(false);
  const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === "q") || (e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setShowQuickActions(prev => !prev);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const [, forceRender] = useState(0);
  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('app_theme_color') || 'blue';
      const savedHex = localStorage.getItem('app_theme_custom_hex');
      
      document.documentElement.className = document.documentElement.className.replace(/\btheme-[a-z0-9-]+\b/g, '').trim();
      
      if (savedTheme === 'custom' && savedHex) {
        applyCustomHexTheme(savedHex);
      } else {
        clearCustomHexTheme();
        if (savedTheme && savedTheme !== 'blue') {
          document.documentElement.classList.add(`theme-${savedTheme}`);
        }
      }
      forceRender(prev => prev + 1);
    };
    applyTheme();
    window.addEventListener('themechange', applyTheme);
    return () => window.removeEventListener('themechange', applyTheme);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dark_mode", "false");
    }
  }, [darkMode]);

  // Global Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [buybacks, setBuybacks] = useState<Buyback[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);

  // Network connection states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConnectionToast, setShowConnectionToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setToastType("success");
      setToastMessage("Koneksi Internet Terhubung Kembali! Menjalankan sinkronisasi data offline & peninjauan bentrokan...");
      setShowConnectionToast(true);
      
      try {
        await apiFetch("/api/sync-offline-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outletName: activeOutlet?.name || "Cabang Utama" })
        });
        await fetchGlobalState();
      } catch (err) {
        console.warn("Sinkronisasi otomatis saat online:", err);
      }

      const timer = setTimeout(() => {
        setShowConnectionToast(false);
      }, 7000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastType("error");
      setToastMessage("Koneksi Internet Terputus! Anda sekarang bekerja dalam Mode Offline. Transaksi baru akan disimpan lokal.");
      setShowConnectionToast(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Active Outlet State
  const [activeOutlet, setActiveOutlet] = useState<any | null>(null);

  // Active Tab Router
  const [activeTab, setActiveTabState] = useState<"SUBSCRIPTION" | "TENANTS" | "WARRANTY" | "DASHBOARD" | "POS" | "CATALOG" | "INVENTORY" | "OPNAME" | "BACKUP" | "PURCHASE" | "BUYBACK" | "SALES_RETURN" | "SERVICE_QUEUE" | "PROMO" | "FINANCE" | "CHAT" | "EMPLOYEES" | "CONTACTS" | "PRINTER" | "SMTP" | "OUTLETS" | "AUDIT_LOG" | "CONFLICT_RESOLUTION" | "SUPPLIERS">("DASHBOARD");
  const [direction, setDirection] = useState<number>(0);

  const TAB_ORDER: Record<string, number> = {
    DASHBOARD: 1,
    POS: 2,
    CATALOG: 3,
    INVENTORY: 4,
    OPNAME: 4.1,
    PURCHASE: 4.2,
    SUPPLIERS: 4.25,
    SALES_RETURN: 4.3,
    SERVICE_QUEUE: 4.4,
    OUTLETS: 4.5,
    AUDIT_LOG: 4.8,
    CONFLICT_RESOLUTION: 4.9,
    BUYBACK: 5,
    WARRANTY: 5.5,
    PROMO: 5.8,
    FINANCE: 6,
    EMPLOYEES: 7,
    CONTACTS: 7.5,
    CHAT: 8,
    PRINTER: 9,
    SMTP: 9.2,
    BACKUP: 9.5,
    SUBSCRIPTION: 10,
    TENANTS: 11
  };

  const setActiveTab = (newTab: "SUBSCRIPTION" | "TENANTS" | "WARRANTY" | "DASHBOARD" | "POS" | "CATALOG" | "INVENTORY" | "OPNAME" | "BACKUP" | "PURCHASE" | "BUYBACK" | "SALES_RETURN" | "SERVICE_QUEUE" | "PROMO" | "FINANCE" | "CHAT" | "EMPLOYEES" | "CONTACTS" | "PRINTER" | "SMTP" | "OUTLETS" | "AUDIT_LOG" | "CONFLICT_RESOLUTION" | "SUPPLIERS") => {
    const currentOrder = TAB_ORDER[activeTab] || 0;
    const newOrder = TAB_ORDER[newTab] || 0;
    if (newOrder > currentOrder) {
      setDirection(1);
    } else if (newOrder < currentOrder) {
      setDirection(-1);
    } else {
      setDirection(0);
    }
    setActiveTabState(newTab);
  };

  // Fetch all states from Express API with fallback for static environments
  const fetchGlobalState = async () => {
    let hasLoadedProducts = false;
    try {
      setLoading(true);
      const [pRes, tRes, bRes, audRes, cnfRes, supRes, poRes] = await Promise.all([
        apiFetch("/api/products"),
        apiFetch("/api/transactions"),
        apiFetch("/api/buybacks"),
        apiFetch("/api/audit-logs"),
        apiFetch("/api/sync-conflicts"),
        apiFetch("/api/suppliers"),
        apiFetch("/api/purchase-orders")
      ]);

      if (pRes.ok) {
        const pData = await safeResponseJson<Product[]>(pRes);
        if (Array.isArray(pData) && pData.length > 0) {
          setProducts(pData);
          hasLoadedProducts = true;
        }
      }
      if (tRes.ok) {
        const tData = await safeResponseJson<Transaction[]>(tRes);
        if (Array.isArray(tData)) setTransactions(tData);
      }
      if (bRes.ok) {
        const bData = await safeResponseJson<Buyback[]>(bRes);
        if (Array.isArray(bData)) setBuybacks(bData);
      }
      if (audRes.ok) {
        const audData = await safeResponseJson<any>(audRes);
        if (audData && audData.auditLogs) setAuditLogs(audData.auditLogs);
      }
      if (cnfRes.ok) {
        const cnfData = await safeResponseJson<SyncConflict[]>(cnfRes);
        if (Array.isArray(cnfData)) setSyncConflicts(cnfData);
      }
      if (supRes && supRes.ok) {
        const sData = await safeResponseJson<Supplier[]>(supRes);
        if (Array.isArray(sData)) setSuppliers(sData);
      }
      if (poRes && poRes.ok) {
        const poData = await safeResponseJson<PurchaseOrder[]>(poRes);
        if (Array.isArray(poData)) setPurchaseOrders(poData);
      }
    } catch (err: any) {
      console.warn("API server unreachable (Static deployment mode like Netlify). Using initial local dataset.", err);
    } finally {
      if (!hasLoadedProducts) {
        setProducts(prev => prev.length > 0 ? prev : INITIAL_PRODUCTS);
        setTransactions(prev => prev.length > 0 ? prev : INITIAL_TRANSACTIONS);
        setBuybacks(prev => prev.length > 0 ? prev : INITIAL_BUYBACKS);
        setSuppliers(prev => prev.length > 0 ? prev : INITIAL_SUPPLIERS);
        setPurchaseOrders(prev => prev.length > 0 ? prev : INITIAL_PURCHASE_ORDERS);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchGlobalState();
      
      // Select best starting tab based on role permissions
      if (currentUser.role === UserRole.CASHIER) {
        setActiveTab("POS");
      } else {
        setActiveTab("DASHBOARD");
      }
    }
  }, [currentUser]);

  // Idle Timer (30 minutes inactivity timeout with 60s warning countdown)
  useEffect(() => {
    if (!currentUser) return;

    // 30 minutes in ms = 1,800,000 ms
    // Warning triggers at 29 minutes = 1,740,000 ms (60 seconds remaining)
    const idleTimeoutMs = 30 * 60 * 1000;
    const warningThresholdMs = 29 * 60 * 1000;

    const resetTimer = () => {
      lastActivity.current = Date.now();
      setShowIdleWarning(false);
    };

    const handleUserActivity = () => {
      lastActivity.current = Date.now();
      if (showIdleWarning) {
        setShowIdleWarning(false);
      }
    };

    // Add activity listeners
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;

      if (elapsed >= idleTimeoutMs) {
        // Idle limit exceeded - log out immediately
        handleLogout("idle");
        resetTimer();
      } else if (elapsed >= warningThresholdMs) {
        // Warning threshold reached - show warning and update countdown
        setShowIdleWarning(true);
        const secondsLeft = Math.max(0, Math.ceil((idleTimeoutMs - elapsed) / 1000));
        setIdleCountdown(secondsLeft);
      } else {
        if (showIdleWarning) {
          setShowIdleWarning(false);
        }
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, [currentUser, showIdleWarning]);

  // Global Keyboard Shortcuts Toggle State
  const [shortcutsEnabled, setShortcutsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("pos_shortcuts_enabled") !== "false";
  });

  const toggleShortcuts = () => {
    setShortcutsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem("pos_shortcuts_enabled", String(newValue));
      return newValue;
    });
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    if (!currentUser || !shortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Desktop Sidebar with Ctrl+B / Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleDesktopSidebar();
        return;
      }

      const handledKeys = ["F1", "F2", "F3", "F4", "F6", "F7", "F8"];
      if (handledKeys.includes(e.key)) {
        e.preventDefault();
        
        if (e.key === "F1") {
          setActiveTab("POS");
        } else if (e.key === "F2") {
          setActiveTab("POS");
          setTimeout(() => {
            const el = document.getElementById("pos-product-search");
            if (el) el.focus();
          }, 50);
        } else if (e.key === "F3") {
          setActiveTab("POS");
          setTimeout(() => {
            const el = document.getElementById("pos-imei-scan");
            if (el) el.focus();
          }, 50);
        } else if (e.key === "F4") {
          if (currentUser.role !== UserRole.CASHIER) {
            setActiveTab("DASHBOARD");
          }
        } else if (e.key === "F6") {
          setActiveTab("PRINTER");
        } else if (e.key === "F7") {
          if (currentUser.role === UserRole.ADMIN) {
            setActiveTab("FINANCE");
          }
        } else if (e.key === "F8") {
          if (currentUser.role !== UserRole.CASHIER) {
            setActiveTab("BUYBACK");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentUser, shortcutsEnabled]);

  // Handle launch interactive live demo from Landing Page
  const handleLaunchDemo = () => {
    const demoUser = {
      id: "emp-demo-admin",
      name: "Demo Store Owner",
      role: UserRole.ADMIN,
      tenantId: "default",
      phone: "0812-3456-7890",
      email: "demo@nexuspos.id"
    };
    setCurrentUser(demoUser);
    localStorage.setItem("employee_session", JSON.stringify(demoUser));
    setLogoutReason(null);
    setShowLanding(false);
    fetchGlobalState();
  };

  // Handle free trial registration from Landing Page modal
  const handleRegisterDemo = (storeData: any) => {
    const newOwner = {
      id: "emp-" + Date.now(),
      name: storeData.ownerName || "Pemilik Toko",
      role: UserRole.ADMIN,
      tenantId: (storeData.storeName || "store").toLowerCase().replace(/[^a-z0-9]/g, "-"),
      phone: storeData.phone || "",
      email: "owner@" + (storeData.storeName || "toko").toLowerCase().replace(/[^a-z0-9]/g, "") + ".com",
      plan: storeData.plan || "PRO"
    };
    localStorage.setItem("tenantId", newOwner.tenantId);
    setCurrentUser(newOwner);
    localStorage.setItem("employee_session", JSON.stringify(newOwner));
    setLogoutReason(null);
    setShowLanding(false);
    fetchGlobalState();
  };

  // Handle logout
  const handleLogout = (reason?: string) => {
    setCurrentUser(null);
    localStorage.removeItem("employee_session");
    localStorage.removeItem("authToken");
    setShowLanding(true);
    if (reason === "idle") {
      setLogoutReason("Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 30 menit demi keamanan toko.");
    } else {
      setLogoutReason(null);
    }
  };

  // 1. If user is in Landing Page Mode
  if (showLanding) {
    return (
      <LandingPage
        onOpenLogin={() => setShowLanding(false)}
        onLaunchDemo={handleLaunchDemo}
        onRegisterSuccess={handleRegisterDemo}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
      />
    );
  }

  // 2. If user is not logged in and not viewing landing page, render Login Screen
  if (!currentUser) {
    return (
      <Login 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("employee_session", JSON.stringify(user));
          setLogoutReason(null);
          fetchGlobalState();
        }} 
        employees={[]} 
        loggedOutReason={logoutReason}
        onBackToLanding={() => setShowLanding(true)}
      />
    );
  }

  // Permissions Checker Helper
  const hasAccess = (allowedRoles: UserRole[]) => {
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden relative">
      
      {/* Idle Inactivity Warning Dialog Overlay */}
      <AnimatePresence>
        {showIdleWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center space-y-6 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-rose-500" />
              
              <div className="mx-auto h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <Clock className="h-7 w-7 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900">Pemberitahuan Keamanan</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sesi login Anda mendeteksi inaktivitas di area kasir/dasbor. Anda akan otomatis keluar dalam:
                </p>
                <div className="text-3xl font-extrabold text-rose-600 font-mono tracking-tight my-2">
                  {idleCountdown} <span className="text-xs font-bold text-slate-400">detik</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                  <div 
                    className="bg-rose-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(idleCountdown / 60) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Silakan goyangkan mouse, klik tombol, atau tekan tombol apa saja untuk membatalkan.
                </p>
              </div>
              
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  id="btn-keep-logged-in"
                  onClick={() => {
                    lastActivity.current = Date.now();
                    setShowIdleWarning(false);
                  }}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-primary-600/10 cursor-pointer active:scale-95"
                >
                  {t("Tetap Masuk")}
                </button>
                <button
                  type="button"
                  id="btn-idle-logout"
                  onClick={() => handleLogout()}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {t("Keluar Sesi")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Dialog Konfirmasi Keluar Akun (Logout Confirmation) */}
      <AnimatePresence>
        {showLogoutConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print"
            onClick={() => setShowLogoutConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-5 overflow-hidden relative"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />
              
              {/* Icon */}
              <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
                <LogOut className="h-8 w-8 ml-0.5" />
              </div>
              
              {/* Header Text */}
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {t("Konfirmasi Keluar Akun")}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Apakah Anda yakin ingin mengakhiri sesi dan keluar dari sistem NexusPOS?
                </p>
              </div>

              {/* Active User Card Details */}
              {currentUser && (
                <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-primary-600/20 text-primary-600 dark:text-primary-400 border border-primary-500/30 flex items-center justify-center font-black text-sm uppercase shrink-0">
                      {currentUser.name ? currentUser.name.charAt(0) : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide truncate">
                        {currentUser.role} &bull; {activeOutlet?.name || "Cabang Utama"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shrink-0">
                    Sesi Aktif
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  id="btn-cancel-logout"
                  onClick={() => setShowLogoutConfirmModal(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {t("Batal")}
                </button>
                <button
                  type="button"
                  id="btn-confirm-logout"
                  onClick={() => {
                    setShowLogoutConfirmModal(false);
                    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t("Ya, Keluar")}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Theme Selector Modal Overlay */}
      <AnimatePresence>
        {showThemeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print"
            onClick={() => setShowThemeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 overflow-hidden relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary-600" />
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    Pengaturan Tema Warna Utama
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowThemeModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ThemeSelectorPanel />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowThemeModal(false)}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-primary-600/10"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global IMEI Lookup & Warranty Modal */}
      <IMEILookupModal
        isOpen={showImeiModal}
        onClose={() => setShowImeiModal(false)}
        products={products}
        transactions={transactions}
        buybacks={buybacks}
      />

      {/* MOBILE NAV DRAWER (Visible only on mobile/tablets when triggered) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40 lg:hidden no-print"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 lg:hidden no-print flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white shadow-md">
                    <NexusPosLogo className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-primary-400 tracking-widest uppercase block">Corporate POS</span>
                    <h1 className="text-sm font-extrabold tracking-tight text-white">NexusPOS</h1>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer h-10 w-10 flex items-center justify-center"
                  title={t("Tutup Menu")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation items */}
              <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {/* Tab 1: Dashboard (Admin, Manager only) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("DASHBOARD");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "DASHBOARD" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <BarChart3 className="h-4 w-4 text-primary-400" />
                    {t("Dasbor Analitik")}
                  </button>
                )}

                {/* Tab 2: POS Penjualan (All roles) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("POS");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "POS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <ShoppingCart className="h-4 w-4 text-emerald-400" />
                    {t("POS Kasir Penjualan")}
                  </button>
                )}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("CATALOG");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "CATALOG" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <MonitorSmartphone className="h-4 w-4 text-purple-400" />
                    {t("Katalog Pelanggan")}
                  </button>
                )}

                {/* Tab 3: Katalog Inventaris (Admin, Manager only) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("INVENTORY");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "INVENTORY" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Boxes className="h-4 w-4 text-amber-400" />
                    {t("Katalog Inventaris")}
                  </button>
                )}

                {/* Tab 3a: Modul Stok Opname (Admin, Manager) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("OPNAME");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "OPNAME" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <ClipboardCheck className="h-4 w-4 text-emerald-400" />
                    Stok Opname & Audit
                  </button>
                )}

                {/* Tab 3b: Pesanan Pembelian PO Supplier (Admin, Manager, Cashier) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("PURCHASE");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "PURCHASE" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <ShoppingBag className="h-4 w-4 text-cyan-400" />
                    {t("Pesanan Pembelian (PO)")}
                  </button>
                )}

                {/* Tab 3c: Manajemen Supplier & Hutang Vendor (Admin, Manager) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("SUPPLIERS");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "SUPPLIERS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Building2 className="h-4 w-4 text-purple-400" />
                    Manajemen Supplier
                  </button>
                )}

                {/* Retur Penjualan */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("SALES_RETURN");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "SALES_RETURN" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Undo2 className="h-4 w-4 text-rose-400" />
                    Retur Penjualan
                  </button>
                )}

                {/* Antrean Servis HP */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("SERVICE_QUEUE");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "SERVICE_QUEUE" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Wrench className="h-4 w-4 text-indigo-400" />
                    Antrean Servis HP
                  </button>
                )}

                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("OUTLETS");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "OUTLETS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    Multi-Outlet & Transfer
                  </button>
                )}

                {/* Tab 4: Buyback HP Bekas (Admin, Manager only) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("BUYBACK");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "BUYBACK" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Coins className="h-4 w-4 text-violet-400" />
                    {t("Tukar Tambah & Buyback")}
                  </button>
          )}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("WARRANTY");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "WARRANTY" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    {t("Garansi & IMEI Tracker")}
                  </button>
                )}

                {/* Tab 5: Laporan Keuangan (Admin only - Highly Secure!) */}
                {hasAccess([UserRole.ADMIN]) && (
                  <button
                    onClick={() => {
                      setActiveTab("FINANCE");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "FINANCE" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <BookOpen className="h-4 w-4 text-cyan-400" />
                    {t("Laporan Keuangan Audit")}
                  </button>
                )}
                {/* Tab 5b: Manajemen Promo (Admin only) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("PROMO");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "PROMO" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Tag className="h-4 w-4 text-orange-400" />
                    {t("Manajemen Promo")}
                  </button>
                )}

                {/* Tab 5b: Manajemen Karyawan (Admin only - Highly Secure!) */}
                {hasAccess([UserRole.ADMIN]) && (
                  <button
                    onClick={() => {
                      setActiveTab("EMPLOYEES");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "EMPLOYEES" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    {t("Manajemen Karyawan")}
                  </button>
                )}

                {/* Tab: Direktori Kontak Supplier, Konsumen & Karyawan */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("CONTACTS");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "CONTACTS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Users className="h-4 w-4 text-cyan-400" />
                    {t("Direktori Kontak")}
                  </button>
                )}

                {/* Tab 6: Asisten Chatbot AI (All roles) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("CHAT");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "CHAT" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Bot className="h-4 w-4 text-rose-400" />
                    Asisten AI & Poster
                  </button>
                )}

                {/* Tab 7: Pengaturan Toko & Konfigurasi Printer (All roles) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("PRINTER");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "PRINTER" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Settings className="h-4 w-4 text-sky-400" />
                    Pengaturan Toko & Struk
                  </button>
                )}

                {/* Tab 7a2: Pengaturan Server SMTP Email (Admin & Manager) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("SMTP");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "SMTP" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Mail className="h-4 w-4 text-indigo-400" />
                    Pengaturan Server SMTP Email
                  </button>
                )}

                {/* Tab 7b: Backup Data (Admin & Manager) */}
                {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                  <button
                    onClick={() => {
                      setActiveTab("BACKUP");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "BACKUP" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Database className="h-4 w-4 text-indigo-400" />
                    Backup Data Database
                  </button>
                )}

                {/* Tab 8: Paket Langganan SaaS */}
                {hasAccess([UserRole.ADMIN]) && (
                  <button
                    onClick={() => {
                      setActiveTab("SUBSCRIPTION");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "SUBSCRIPTION" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Globe className="h-4 w-4 text-indigo-400" />
                    Paket Langganan (SaaS)
                  </button>
                )}

                {/* Tab 9: Superadmin Tenant Management */}
                {hasAccess([UserRole.ADMIN]) && (
                  <button
                    onClick={() => {
                      setActiveTab("TENANTS");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "TENANTS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/10" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                  >
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    Manajemen Tenant (SaaS)
                  </button>
                )}
              </nav>

              {/* User Session status and log out */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                <div className="flex items-center gap-2.5 mb-3 px-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Cloud Synced</span>
                </div>
                
                <div className="flex items-center justify-between gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary-600/30 text-primary-300 border border-primary-500/20 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold truncate">{currentUser.role}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="p-2 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all cursor-pointer shrink-0"
                    title={t("Reset Sesi")}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogoutConfirmModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer shrink-0"
                    title={t("Keluar Akun")}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>

                {/* Premium Dark Mode Toggle Switch */}
                <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between px-1.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    {darkMode ? <Moon className="h-3.5 w-3.5 text-primary-400" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
                    <span className="text-[10px] font-bold tracking-wide uppercase">Mode Malam</span>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-800 transition-colors duration-200 ease-in-out focus:outline-none"
                    role="switch"
                    aria-checked={darkMode}
                  >
                    <span className="sr-only">Toggle Dark Mode</span>
                    <span
                      className={`${
                        darkMode ? 'translate-x-4.5 bg-primary-500' : 'translate-x-0 bg-slate-500'
                      } pointer-events-none relative inline-block h-4.5 w-4.5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QuickStartGuide />

      {/* DESKTOP SIDEBAR NAVIGATION (Hidden on mobile screens, shown on lg screens with smooth transition) */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isDesktopSidebarCollapsed ? 80 : 260,
        }}
        transition={{ 
          duration: 0.35,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="hidden lg:flex bg-slate-900 text-white flex-col shrink-0 no-print shadow-2xl relative border-r border-slate-800/80 z-30 select-none overflow-hidden"
      >
        {/* Sidebar Brand Header */}
        <div className={`p-4 flex items-center ${isDesktopSidebarCollapsed ? "justify-center" : "justify-between"} border-b border-slate-800/90 h-16 shrink-0 transition-all duration-300 ease-in-out`}>
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="p-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 hover:border-slate-600 rounded-xl text-white shadow-md shrink-0 transition-all cursor-pointer group"
              title={isDesktopSidebarCollapsed ? "Perluas Sidebar (Ctrl+B)" : "Perkecil Sidebar (Ctrl+B)"}
            >
              <NexusPosLogo className="h-7 w-7 transition-transform group-hover:scale-105" />
            </button>
            {!isDesktopSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="whitespace-nowrap overflow-hidden min-w-0"
              >
                <span className="text-[10px] font-bold text-primary-400 tracking-widest uppercase block leading-none">Corporate POS</span>
                <h1 className="text-sm font-extrabold tracking-tight text-white mt-0.5">NexusPOS</h1>
              </motion.div>
            )}
          </div>
          
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className={`p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0 ${isDesktopSidebarCollapsed ? "hidden" : "flex"}`}
            title="Tutup / Perkecil Sidebar (Ctrl+B)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Quick Actions Shortcuts Widget in Sidebar */}
          {!isDesktopSidebarCollapsed ? (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-3 p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/90 space-y-2 shadow-inner"
            >
              <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Zap className="h-3.5 w-3.5 fill-amber-400" />
                  Aksi Cepat
                </span>
                <span className="text-[8px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded-full border border-amber-800/50 font-mono">
                  Alt+Q
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("INVENTORY")}
                  className="p-1.5 bg-slate-800/80 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-center transition-all border border-slate-700/50 hover:border-emerald-500/50 cursor-pointer group flex flex-col items-center gap-1"
                  title="Tambah Produk Baru"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[8.5px] font-extrabold leading-tight truncate w-full">Tambah HP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("BUYBACK")}
                  className="p-1.5 bg-slate-800/80 hover:bg-amber-600/30 text-amber-300 rounded-xl text-center transition-all border border-slate-700/50 hover:border-amber-500/50 cursor-pointer group flex flex-col items-center gap-1"
                  title="Proses Buyback Cepat"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[8.5px] font-extrabold leading-tight truncate w-full">Buyback</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowImeiModal(true)}
                  className="p-1.5 bg-slate-800/80 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-center transition-all border border-slate-700/50 hover:border-indigo-500/50 cursor-pointer group flex flex-col items-center gap-1"
                  title="Cek IMEI Terakhir"
                >
                  <Search className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[8.5px] font-extrabold leading-tight truncate w-full">Cek IMEI</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="mb-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowQuickActions(prev => !prev)}
                className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 text-amber-300 border border-amber-500/30 rounded-xl transition-all cursor-pointer relative group shadow-sm flex items-center justify-center"
                title="Panel Aksi Cepat (Alt+Q)"
              >
                <Zap className="h-4 w-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Aksi Cepat (Alt+Q)
                </div>
              </button>
            </div>
          )}

          {/* Tab 1: Dashboard (Admin, Manager only) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab("DASHBOARD")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "DASHBOARD" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <BarChart3 className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "DASHBOARD" ? "text-white" : "text-primary-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("Dasbor Analitik")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Dasbor Analitik")}
                </div>
              )}
            </button>
          )}

          {/* Tab 2: POS Penjualan (All roles) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-pos"
              onClick={() => setActiveTab("POS")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "POS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <ShoppingCart className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "POS" ? "text-white" : "text-emerald-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("POS Kasir Penjualan")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("POS Kasir Penjualan")}
                </div>
              )}
            </button>
          )}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-catalog"
              onClick={() => setActiveTab("CATALOG")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "CATALOG" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <MonitorSmartphone className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "CATALOG" ? "text-white" : "text-purple-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("Katalog Pelanggan")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Katalog Pelanggan")}
                </div>
              )}
            </button>
          )}

          {/* Tab 3: Katalog Inventaris (Admin, Manager only) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-inventory"
              onClick={() => setActiveTab("INVENTORY")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "INVENTORY" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Boxes className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "INVENTORY" ? "text-white" : "text-amber-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("Katalog Inventaris")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Katalog Inventaris")}
                </div>
              )}
            </button>
          )}

          {/* Tab 3a: Modul Stok Opname (Admin, Manager) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-opname"
              onClick={() => setActiveTab("OPNAME")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "OPNAME" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <ClipboardCheck className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "OPNAME" ? "text-white" : "text-emerald-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Stok Opname & Audit</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Stok Opname & Audit
                </div>
              )}
            </button>
          )}

          {/* Tab 3b: Pesanan Pembelian PO Supplier (Admin, Manager, Cashier) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-purchase"
              onClick={() => setActiveTab("PURCHASE")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "PURCHASE" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <ShoppingBag className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "PURCHASE" ? "text-white" : "text-cyan-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Pesanan Pembelian (PO)</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Pesanan Pembelian (PO)
                </div>
              )}
            </button>
          )}

          {/* Tab 3c: Manajemen Supplier & Vendor */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-suppliers"
              onClick={() => setActiveTab("SUPPLIERS")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "SUPPLIERS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Building2 className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "SUPPLIERS" ? "text-white" : "text-amber-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Manajemen Supplier & Vendor</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Manajemen Supplier & Vendor
                </div>
              )}
            </button>
          )}

          {/* Retur Penjualan */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-sales-return"
              onClick={() => setActiveTab("SALES_RETURN")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "SALES_RETURN" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Undo2 className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "SALES_RETURN" ? "text-white" : "text-rose-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Retur Penjualan</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Retur Penjualan
                </div>
              )}
            </button>
          )}

          {/* Antrean Servis HP */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-service-queue"
              onClick={() => setActiveTab("SERVICE_QUEUE")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "SERVICE_QUEUE" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Wrench className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "SERVICE_QUEUE" ? "text-white" : "text-indigo-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Antrean Servis HP</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Antrean Servis HP
                </div>
              )}
            </button>
          )}

          {/* Multi-Outlet & Transfer Stok */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-outlets"
              onClick={() => setActiveTab("OUTLETS")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "OUTLETS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Building2 className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "OUTLETS" ? "text-white" : "text-indigo-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Multi-Outlet & Transfer</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Multi-Outlet & Transfer
                </div>
              )}
            </button>
          )}

          {/* Audit Log (Admin & Manager) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-audit-log"
              onClick={() => setActiveTab("AUDIT_LOG")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "AUDIT_LOG" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <ShieldCheck className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "AUDIT_LOG" ? "text-white" : "text-indigo-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Audit Log Transaksi & Stok</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Audit Log Transaksi & Stok
                </div>
              )}
            </button>
          )}

          {/* Conflict Resolution (Admin only) */}
          {hasAccess([UserRole.ADMIN]) && (
            <button
              id="tab-conflict-resolution"
              onClick={() => setActiveTab("CONFLICT_RESOLUTION")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "CONFLICT_RESOLUTION" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <RefreshCw className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "CONFLICT_RESOLUTION" ? "text-white" : "text-amber-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Resolusi Konflik Sinkronisasi</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Resolusi Konflik Sinkronisasi
                </div>
              )}
            </button>
          )}

          {/* Tab 4: Buyback HP Bekas (Admin, Manager only) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-buyback"
              onClick={() => setActiveTab("BUYBACK")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "BUYBACK" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Coins className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "BUYBACK" ? "text-white" : "text-violet-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("Tukar Tambah & Buyback")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Tukar Tambah & Buyback")}
                </div>
              )}
            </button>
          )}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-warranty"
              onClick={() => setActiveTab("WARRANTY")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "WARRANTY" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <ShieldCheck className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "WARRANTY" ? "text-white" : "text-emerald-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("Garansi & IMEI Tracker")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Garansi & IMEI Tracker")}
                </div>
              )}
            </button>
          )}
          {/* Tab 5: Laporan Keuangan (Admin only - Highly Secure!) */}
          {hasAccess([UserRole.ADMIN]) && (
            <button
              id="tab-finance"
              onClick={() => setActiveTab("FINANCE")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "FINANCE" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <BookOpen className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "FINANCE" ? "text-white" : "text-cyan-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("Laporan Keuangan Audit")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Laporan Keuangan Audit")}
                </div>
              )}
            </button>
          )}
          {/* Tab 5b: Manajemen Promo (Admin only) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-promo"
              onClick={() => setActiveTab("PROMO")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "PROMO" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Tag className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "PROMO" ? "text-white" : "text-orange-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("Manajemen Promo")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Manajemen Promo")}
                </div>
              )}
            </button>
          )}

          {/* Tab 5b: Manajemen Karyawan (Admin only - Highly Secure!) */}
          {hasAccess([UserRole.ADMIN]) && (
            <button
              id="tab-employees"
              onClick={() => setActiveTab("EMPLOYEES")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "EMPLOYEES" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <ShieldCheck className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "EMPLOYEES" ? "text-white" : "text-emerald-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">{t("Manajemen Karyawan")}</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Manajemen Karyawan")}
                </div>
              )}
            </button>
          )}

          {/* Tab: Direktori Kontak Supplier, Konsumen & Karyawan */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-contacts"
              onClick={() => setActiveTab("CONTACTS")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "CONTACTS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Users className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "CONTACTS" ? "text-white" : "text-cyan-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Direktori Kontak</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Direktori Kontak
                </div>
              )}
            </button>
          )}

          {/* Tab 6: Asisten Chatbot AI (All roles) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-chat"
              onClick={() => setActiveTab("CHAT")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "CHAT" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Bot className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "CHAT" ? "text-white" : "text-rose-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Asisten AI & Poster</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Asisten AI & Poster
                </div>
              )}
            </button>
          )}

          {/* Tab 7: Pengaturan Toko & Konfigurasi Printer (All roles) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
            <button
              id="tab-printer"
              onClick={() => setActiveTab("PRINTER")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "PRINTER" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Settings className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "PRINTER" ? "text-white" : "text-sky-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Pengaturan Toko & Struk</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Pengaturan Toko & Struk
                </div>
              )}
            </button>
          )}

          {/* Tab 7a2: Pengaturan Server SMTP Email (Admin & Manager) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-smtp"
              onClick={() => setActiveTab("SMTP")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "SMTP" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Mail className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "SMTP" ? "text-white" : "text-indigo-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Pengaturan Server SMTP Email</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Pengaturan Server SMTP Email
                </div>
              )}
            </button>
          )}

          {/* Tab 7b: Backup Data (Admin & Manager) */}
          {hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
            <button
              id="tab-backup"
              onClick={() => setActiveTab("BACKUP")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "BACKUP" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Database className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "BACKUP" ? "text-white" : "text-indigo-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Backup Data Database</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Backup Data Database
                </div>
              )}
            </button>
          )}

          {/* Tab 8: Paket Langganan SaaS */}
          {hasAccess([UserRole.ADMIN]) && (
            <button
              id="tab-subscription"
              onClick={() => setActiveTab("SUBSCRIPTION")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "SUBSCRIPTION" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Globe className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "SUBSCRIPTION" ? "text-white" : "text-indigo-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Paket Langganan (SaaS)</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Paket Langganan (SaaS)
                </div>
              )}
            </button>
          )}

          {/* Tab 9: Superadmin Tenant Management */}
          {hasAccess([UserRole.ADMIN]) && (
            <button
              id="tab-tenants"
              onClick={() => setActiveTab("TENANTS")}
              className={`w-full flex items-center ${isDesktopSidebarCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${activeTab === "TENANTS" ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20 font-bold" : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"}`}
            >
              <Building2 className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${activeTab === "TENANTS" ? "text-white" : "text-emerald-400"}`} />
              {!isDesktopSidebarCollapsed && (
                <span className="truncate whitespace-nowrap">Manajemen Tenant (SaaS)</span>
              )}
              {isDesktopSidebarCollapsed && (
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  Manajemen Tenant (SaaS)
                </div>
              )}
            </button>
          )}
        </nav>

        {/* User Session status and log out */}
        <div className={`p-3 border-t border-slate-800/90 bg-slate-950/40 shrink-0 transition-all duration-300 ease-in-out`}>
          {isDesktopSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2.5 py-1">
              {/* Online indicator */}
              <div
                className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500 animate-ping"} relative group cursor-default`}
              >
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {isOnline ? "Status: Cloud Synced (Online)" : "Status: Offline Mode"}
                </div>
              </div>

              {/* User Avatar */}
              <div
                className="h-8 w-8 rounded-full bg-primary-600/30 text-primary-300 border border-primary-500/30 flex items-center justify-center font-bold text-xs shrink-0 uppercase relative group cursor-default"
              >
                {currentUser.name.charAt(0)}
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {currentUser.name} ({currentUser.role})
                </div>
              </div>

              {/* Dark mode toggle icon button */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer relative group"
                title={darkMode ? "Mode Terang" : "Mode Malam"}
              >
                {darkMode ? <Moon className="h-4 w-4 text-primary-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Malam"}
                </div>
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(true)}
                className="p-2 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer relative group"
                title={t("Keluar Akun")}
              >
                <LogOut className="h-4 w-4" />
                <div className="fixed left-20 ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[11px] font-bold rounded-lg shadow-2xl border border-slate-700/80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
                  {t("Keluar Akun")}
                </div>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2.5 px-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"}`}></div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    {isOnline ? "Cloud Synced" : "Offline Mode"}
                  </span>
                </div>
                {!isOnline && (
                  <button
                    onClick={() => {
                      if (navigator.onLine) {
                        setIsOnline(true);
                        setToastType("success");
                        setToastMessage("Koneksi Internet Terhubung Kembali! Sinkronisasi data ke Cloud berhasil.");
                        setShowConnectionToast(true);
                        setTimeout(() => setShowConnectionToast(false), 6000);
                      } else {
                        setToastType("error");
                        setToastMessage("Gagal menyinkronkan data. Pastikan koneksi internet stabil.");
                        setShowConnectionToast(true);
                        setTimeout(() => setShowConnectionToast(false), 6000);
                      }
                    }}
                    className="px-2 py-0.5 bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white border border-primary-500/30 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Sinkronisasi Data"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Sync
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-2 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-primary-600/30 text-primary-300 border border-primary-500/20 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold truncate">{currentUser.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 rounded-lg transition-all cursor-pointer shrink-0"
                    title={t("Reset Sesi")}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirmModal(true)}
                    className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer shrink-0"
                    title={t("Keluar Akun")}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Premium Dark Mode Toggle Switch */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/40 flex items-center justify-between px-1.5">
                <div className="flex items-center gap-2 text-slate-400">
                  {darkMode ? <Moon className="h-3.5 w-3.5 text-primary-400" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
                  <span className="text-[10px] font-bold tracking-wide uppercase">Mode Malam</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-800 transition-colors duration-200 ease-in-out focus:outline-none"
                  role="switch"
                  aria-checked={darkMode}
                >
                  <span className="sr-only">Toggle Dark Mode</span>
                  <span
                    className={`${
                      darkMode ? 'translate-x-4 bg-primary-500' : 'translate-x-0 bg-slate-500'
                    } pointer-events-none relative inline-block h-4 w-4 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </motion.aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Toast Notifikasi Koneksi Jaringan */}
        <AnimatePresence>
          {showConnectionToast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-11/12 md:w-full"
            >
              <div className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3.5 ${
                toastType === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200" 
                  : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200"
              }`}>
                <div className="p-1.5 rounded-xl shrink-0 mt-0.5" style={{
                  backgroundColor: toastType === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"
                }}>
                  {toastType === "success" ? (
                    <Wifi className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-rose-600 dark:text-rose-400 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-bold leading-tight">
                    {toastType === "success" ? "Internet Terhubung" : "Internet Terputus (Bekerja Offline)"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 leading-normal font-medium">
                    {toastMessage}
                  </p>
                </div>
                <button 
                  onClick={() => setShowConnectionToast(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 hover:bg-slate-200/40 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* TOP BAR / HEADER */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 shrink-0 no-print sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title={t("Menu Navigasi")}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Sidebar Toggle Button */}
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="hidden lg:flex p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title={isDesktopSidebarCollapsed ? "Perluas Sidebar Navigasi (Ctrl+B)" : "Perkecil Sidebar Navigasi (Ctrl+B)"}
            >
              <PanelLeft className={`h-4.5 w-4.5 transition-colors duration-200 ${isDesktopSidebarCollapsed ? "text-primary-600 dark:text-primary-400" : ""}`} />
            </button>

            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-primary-600 rounded-full hidden sm:inline-block"></span>
              {activeTab === "DASHBOARD" && t("Dasbor Analitik Real-Time")}
              {activeTab === "POS" && t("Point of Sale Kasir Penjualan")}
              {activeTab === "CATALOG" && t("Katalog Pelanggan")}
              {activeTab === "INVENTORY" && t("Katalog Inventaris & IMEI")}
              {activeTab === "OPNAME" && "Stok Opname & Audit Inventaris Fisik Toko"}
              {activeTab === "PURCHASE" && t("Pesanan Pembelian (PO)")}
              {activeTab === "SUPPLIERS" && "Manajemen Supplier, Riwayat PO & Status Hutang Vendor"}
              {activeTab === "WARRANTY" && t("Garansi & IMEI Tracker")}
              {activeTab === "PROMO" && t("Manajemen Promo & Diskon")}
              {activeTab === "FINANCE" && t("Laporan Keuangan Audit")}
              {activeTab === "CHAT" && t("Asisten Gemini AI & Rencana Poster")}
              {activeTab === "PRINTER" && t("Pengaturan & Konfigurasi Printer Struk")}
              {activeTab === "SMTP" && "Pengaturan Server SMTP Email & Notifikasi Otomatis"}
              {activeTab === "BACKUP" && "Backup & Cadangan Database (JSON / CSV)"}
              {activeTab === "OUTLETS" && "Multi-Outlet & Transfer Stok Antar Cabang"}
              {activeTab === "AUDIT_LOG" && "Audit Log Transaksi & Pergerakan Stok Multi-Cabang"}
              {activeTab === "CONFLICT_RESOLUTION" && "Resolusi Konflik Sinkronisasi Stok Multi-Outlet"}
              {activeTab === "CONTACTS" && "Direktori Kontak Supplier, Konsumen & Karyawan"}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider ${isOnline ? "text-emerald-500" : "text-rose-500 animate-pulse"}`}>
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-rose-500 animate-bounce" />
                  <span>Offline Mode</span>
                </>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Printer BT: Ready
            </div>
            {/* Quick Actions Dropdown Button in Header */}
            <div className="relative" ref={quickActionsRef}>
              <button
                type="button"
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer border border-amber-400/40"
                title="Panel Aksi Cepat (Alt + Q)"
              >
                <Zap className="h-4 w-4 fill-amber-200 text-amber-200 animate-pulse" />
                <span>Aksi Cepat</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showQuickActions ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                          Panel Aksi Cepat
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded font-mono font-bold">
                        Alt+Q
                      </span>
                    </div>

                    <div className="py-1 space-y-1 max-h-80 overflow-y-auto">
                      {[
                        {
                          id: "add_product",
                          label: "Tambah Produk Baru",
                          desc: "Input produk smartphone / aksesoris ke stok",
                          icon: <Plus className="h-4 w-4 text-emerald-500" />,
                          badge: "Inventaris",
                          action: () => {
                            setActiveTab("INVENTORY");
                            setShowQuickActions(false);
                          }
                        },
                        {
                          id: "buyback",
                          label: "Proses Buyback Cepat",
                          desc: "Tukar tambah & beli HP bekas konsumen",
                          icon: <ShoppingBag className="h-4 w-4 text-amber-500" />,
                          badge: "Buyback",
                          action: () => {
                            setActiveTab("BUYBACK");
                            setShowQuickActions(false);
                          }
                        },
                        {
                          id: "check_imei",
                          label: "Cek IMEI Terakhir",
                          desc: "Lacak garansi & pendaftaran Bea Cukai",
                          icon: <Search className="h-4 w-4 text-indigo-500" />,
                          badge: "Garansi",
                          action: () => {
                            setShowImeiModal(true);
                            setShowQuickActions(false);
                          }
                        },
                        {
                          id: "pos_kasir",
                          label: "Kasir Penjualan POS",
                          desc: "Buka terminal kasir transaksi ritel",
                          icon: <ShoppingCart className="h-4 w-4 text-primary-500" />,
                          badge: "Ritel POS",
                          action: () => {
                            setActiveTab("POS");
                            setShowQuickActions(false);
                          }
                        },
                        {
                          id: "stok_opname",
                          label: "Stok Opname & Audit",
                          desc: "Audit fisik persediaan stok toko",
                          icon: <ClipboardCheck className="h-4 w-4 text-purple-500" />,
                          badge: "Audit Stok",
                          action: () => {
                            setActiveTab("OPNAME");
                            setShowQuickActions(false);
                          }
                        },
                        {
                          id: "finance_reports",
                          label: "Profit Margin & Laporan",
                          desc: "Analisis laba rugi & tren margin profit",
                          icon: <BarChart3 className="h-4 w-4 text-teal-500" />,
                          badge: "Keuangan",
                          action: () => {
                            setActiveTab("FINANCE");
                            setShowQuickActions(false);
                          }
                        }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.action}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                {item.label}
                              </p>
                              <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-extrabold rounded-md">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setShowImeiModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition-all cursor-pointer border border-emerald-200/50 dark:border-emerald-800/40"
              title="Lacak & Cek IMEI / Garansi Global"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Cek IMEI</span>
            </button>
            <button
              onClick={() => setShowThemeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer border border-primary-200/50 dark:border-slate-700"
              title="Pilih Tema Warna Aplikasi"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Tema Warna</span>
            </button>
            <button
              onClick={() => setShowLanding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-all cursor-pointer border border-indigo-200/50 dark:border-indigo-800/40"
              title="Lihat Website SaaS & Info Paket"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Website SaaS</span>
            </button>
            <button
              onClick={() => setLanguage(language === "id" ? "en" : "id")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Globe className="h-4 w-4" />
              {language === "id" ? "ID" : "EN"}
            </button>
          </div>
        </header>

        {/* CONTAINER WORKSPACE */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
          <div className="max-w-7xl w-full mx-auto print:p-0">
            {/* Conflict Alert Banner when returning online or when conflicts detected */}
            {syncConflicts.some(c => c.status === "OPEN") && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && activeTab !== "CONFLICT_RESOLUTION" && (
              <div className="mb-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-900 px-5 py-3.5 rounded-2xl shadow-lg border border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs no-print">
                <div className="flex items-center gap-3 font-bold">
                  <div className="p-2 bg-slate-900 text-amber-300 rounded-xl shrink-0 shadow-xs">
                    <GitMerge className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block tracking-tight">
                      Perhatian Admin: Terdeteksi {syncConflicts.filter(c => c.status === "OPEN").length} Bentrokan Data Stok Online Sync!
                    </span>
                    <span className="text-slate-900/90 text-[11px] font-medium">
                      Terdapat ketidaksesuaian jumlah unit/IMEI antara cache lokal cabang dan database cloud. Harap selaraskan data.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("CONFLICT_RESOLUTION")}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-amber-300 font-black rounded-xl cursor-pointer text-xs transition-all shadow-md shrink-0 flex items-center gap-2 border border-amber-400/30"
                >
                  <span>Tinjau di Conflict Resolution View</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {loading ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3 no-print">
                <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
                <p className="text-xs font-semibold">Mengambil persediaan smartphone dari cloud...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeTab}
                  custom={direction}
                  initial={(dir: number) => ({ 
                    opacity: 0, 
                    x: dir > 0 ? 40 : dir < 0 ? -40 : 0,
                    y: 6,
                    filter: "blur(3px)",
                    scale: 0.995
                  })}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    y: 0,
                    filter: "blur(0px)",
                    scale: 1,
                    transition: {
                      duration: 0.26,
                      ease: [0.215, 0.61, 0.355, 1.0]
                    }
                  }}
                  exit={(dir: number) => ({ 
                    opacity: 0, 
                    x: dir > 0 ? -40 : dir < 0 ? 40 : 0,
                    y: -4,
                    filter: "blur(2px)",
                    scale: 0.995,
                    transition: {
                      duration: 0.16,
                      ease: [0.55, 0.055, 0.675, 0.19]
                    }
                  })}
                  className="text-slate-800 dark:text-slate-100 origin-top overflow-x-hidden"
                >
                  {activeTab === "DASHBOARD" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <Dashboard 
                      products={products} 
                      transactions={transactions} 
                      buybacks={buybacks}
                      userRole={currentUser.role}
                      currentUser={currentUser}
                      onNavigate={setActiveTab}
                      onTabChange={setActiveTab}
                    />
                  )}

                  {activeTab === "POS" && (
                    <POS 
                      products={products} 
                      onTransactionComplete={fetchGlobalState}
                      cashierUser={currentUser}
                    />
                  )}
                  {activeTab === "CATALOG" && (
                    <CustomerCatalog products={products} />
                  )}

                  {activeTab === "INVENTORY" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <Inventory 
                      products={products} 
                      onProductsChange={fetchGlobalState}
                      userRole={currentUser.role}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === "OPNAME" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <StockOpnameModule
                      products={products}
                      onProductsChange={fetchGlobalState}
                      userRole={currentUser.role}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === "PURCHASE" && (
                    <PurchaseOrderModule 
                      products={products}
                      currentUser={currentUser}
                      onProductsChange={fetchGlobalState}
                    />
                  )}

                  {activeTab === "SUPPLIERS" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <SupplierManagement
                      suppliers={suppliers}
                      purchaseOrders={purchaseOrders}
                      products={products}
                      apiFetch={apiFetch}
                      onRefreshData={fetchGlobalState}
                      onNavigateToPO={(supplierId) => {
                        setActiveTab("PURCHASE");
                      }}
                      userRole={currentUser.role}
                    />
                  )}

                  {activeTab === "SALES_RETURN" && (
                    <SalesReturnModule 
                      currentUser={currentUser}
                      transactions={transactions}
                      onRefreshGlobalState={fetchGlobalState}
                    />
                  )}

                  {activeTab === "SERVICE_QUEUE" && (
                    <ServiceQueueModule 
                      currentUser={currentUser}
                      onRefreshGlobalState={fetchGlobalState}
                    />
                  )}

                  {activeTab === "OUTLETS" && (
                    <MultiOutletTransfer
                      activeOutlet={activeOutlet}
                      onSelectActiveOutlet={(outlet) => setActiveOutlet(outlet)}
                      userRole={currentUser.role}
                      currentUser={currentUser}
                      products={products}
                      onRefreshData={fetchGlobalState}
                    />
                  )}

                  {activeTab === "AUDIT_LOG" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <AuditLog 
                      tenantId={currentUser?.tenantId || "default"} 
                      userRole={currentUser?.role || "ADMIN"} 
                    />
                  )}

                  {activeTab === "CONFLICT_RESOLUTION" && hasAccess([UserRole.ADMIN]) && (
                    <ConflictResolution 
                      conflicts={syncConflicts}
                      tenantId={currentUser?.tenantId || "default"} 
                      onConflictResolved={fetchGlobalState}
                      onRefresh={fetchGlobalState}
                      currentUser={currentUser}
                    />
                  )}

                  {activeTab === "BUYBACK" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <BuybackModule 
                      buybacks={buybacks}
                      products={products}
                      onBuybacksChange={fetchGlobalState}
                      userRole={currentUser.role}
                      cashierUser={currentUser}
                    />
                  )}
                  {activeTab === "WARRANTY" && (
                    <WarrantyModule />
                  )}
                  {activeTab === "PROMO" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <PromoConfig />
                  )}

                  {activeTab === "FINANCE" && hasAccess([UserRole.ADMIN]) && (
                    <FinancialReports 
                      products={products} 
                      transactions={transactions} 
                      buybacks={buybacks}
                      currentUser={currentUser}
                      onRestore={fetchGlobalState}
                    />
                  )}

                  {activeTab === "EMPLOYEES" && hasAccess([UserRole.ADMIN]) && (
                    <Employees 
                      onEmployeesChange={fetchGlobalState}
                      currentUser={currentUser}
                      transactions={transactions}
                      onNavigateToContacts={() => setActiveTab("CONTACTS")}
                    />
                  )}

                  {activeTab === "CONTACTS" && hasAccess([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]) && (
                    <ContactsDirectory 
                      currentUser={currentUser} 
                      onNavigateToEmployees={() => setActiveTab("EMPLOYEES")} 
                    />
                  )}

                  {activeTab === "CHAT" && (
                    <AIChatbot />
                  )}

                  {activeTab === "PRINTER" && (
                    <PrinterConfig />
                  )}

                  {activeTab === "SMTP" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <SmtpConfig />
                  )}

                  {activeTab === "BACKUP" && hasAccess([UserRole.ADMIN, UserRole.MANAGER]) && (
                    <DataBackupModule />
                  )}

                  {activeTab === "SUBSCRIPTION" && hasAccess([UserRole.ADMIN]) && (
                    <Subscription userRole={currentUser.role} currentUser={currentUser} />
                  )}

                  {activeTab === "TENANTS" && hasAccess([UserRole.ADMIN]) && (
                    <TenantManagement 
                      currentUser={currentUser} 
                      onNavigateToSmtp={() => setActiveTab("SMTP")}
                      onNavigateToSubscription={() => setActiveTab("SUBSCRIPTION")}
                    />
                  )}

                  {/* Fallback Denied Access screen if unauthorized */}
                  {((activeTab === "DASHBOARD" && !hasAccess([UserRole.ADMIN, UserRole.MANAGER])) ||
                    (activeTab === "INVENTORY" && !hasAccess([UserRole.ADMIN, UserRole.MANAGER])) ||
                    (activeTab === "BUYBACK" && !hasAccess([UserRole.ADMIN, UserRole.MANAGER])) ||
                    (activeTab === "PROMO" && !hasAccess([UserRole.ADMIN, UserRole.MANAGER])) ||
                    (activeTab === "FINANCE" && !hasAccess([UserRole.ADMIN])) ||
                    (activeTab === "EMPLOYEES" && !hasAccess([UserRole.ADMIN]))) && (
                      <div className="bg-white border border-red-200/60 rounded-2xl p-10 text-center space-y-4 max-w-md mx-auto my-12 shadow-md">
                        <div className="inline-flex p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600">
                          <ShieldCheck className="h-10 w-10 animate-bounce" />
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900">Akses Terbatas (RBAC)</h3>
                        <p className="text-xs text-slate-500">
                          Maaf, akun Anda tidak memiliki hak otorisasi yang cukup untuk mengakses modul ini. Silakan hubungi Administrator (Ricky Commedan) untuk peningkatan hak akses.
                        </p>
                      </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* SYSTEM BAR FOOTER (Hidden on print layout) */}
        <footer className="bg-white border-t border-slate-200 py-3 text-[11px] text-slate-400 no-print flex flex-col md:flex-row justify-between items-center px-8 gap-4 shrink-0">
          <p>© 2026 Smartphone POS Retail Platform • Keamanan IMEI Enkripsi Kemenperin</p>
          
          {/* Quick Keyboard Shortcut Legends with ON/OFF switch */}
          <div className="flex flex-wrap items-center gap-2.5 justify-center text-[10px] text-slate-500">
            <button 
              type="button"
              onClick={toggleShortcuts}
              className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                shortcutsEnabled 
                  ? "bg-primary-50 text-primary-600 border border-primary-200" 
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${shortcutsEnabled ? "bg-primary-500 animate-pulse" : "bg-slate-400"}`} />
              Shortcut: {shortcutsEnabled ? "AKTIF" : "OFF"}
            </button>
            {shortcutsEnabled && (
              <>
                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"><b>F1</b> POS</span>
                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"><b>F2</b> Cari Produk</span>
                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"><b>F3</b> Scan IMEI</span>
                {currentUser && currentUser.role !== UserRole.CASHIER && (
                  <>
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"><b>F4</b> Dasbor</span>
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"><b>F8</b> Buyback</span>
                  </>
                )}
                <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"><b>F6</b> Printer</span>
                {currentUser && currentUser.role === UserRole.ADMIN && (
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80"><b>F7</b> Laporan</span>
                )}
              </>
            )}
          </div>

          <div className="flex gap-4 justify-center shrink-0">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary-500" /> Database Cloud-Synced</span>
            <span className="flex items-center gap-1"><Smartphone className="h-3.5 w-3.5 text-emerald-500" /> Midtrans Gateway Active</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
