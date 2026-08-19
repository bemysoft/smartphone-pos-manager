import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => string;
}

const enDict: Record<string, string> = {
  // Sidebar & Navigation Section Headers
  "Operasional Kasir & Stok": "Cashier & Inventory Operations",
  "Transaksi & Layanan": "Transactions & Services",
  "Pengadaan & Kontak": "Purchasing & Contacts",
  "Analitik & Keuangan": "Analytics & Finance",
  "Pengaturan & Alat": "Settings & Tools",
  "Superadmin Hub": "Superadmin Hub",
  "Superadmin Platform Hub": "Superadmin Platform Hub",

  // Sidebar & Navigation Tabs
  "Dasbor Analitik": "Analytics Dashboard",
  "Dasbor Analitik Real-Time": "Real-Time Analytics Dashboard",
  "POS Kasir Penjualan": "POS Cashier",
  "Point of Sale Kasir Penjualan": "Point of Sale Cashier",
  "Katalog Pelanggan": "Customer Catalog",
  "Katalog Inventaris & IMEI": "Inventory & IMEI Catalog",
  "Katalog Inventaris": "Inventory Catalog",
  "Stok Opname & Audit": "Stock Opname & Audit",
  "Stok Opname & Audit Inventaris Fisik Toko": "Physical Stock Opname & Store Audit",
  "Multi-Outlet & Mutasi": "Multi-Outlet & Transfers",
  "Multi-Outlet & Transfer": "Multi-Outlet & Transfers",
  "Multi-Outlet & Transfer Stok": "Multi-Outlet & Stock Transfers",
  "Multi-Outlet & Transfer Stok Antar Cabang": "Multi-Outlet & Inter-Branch Stock Transfers",
  "Antrean Servis HP": "Phone Repair Queue",
  "Antrean Tiket Servis HP & Teknisi": "Phone Repair Queue & Technician Tickets",
  "Modul Tukar Tambah & Buyback": "Trade-in & Buyback Module",
  "Tukar Tambah & Buyback": "Trade-in & Buyback",
  "Kalkulator Tukar Tambah & Buyback": "Trade-in & Buyback Calculator",
  "Garansi & IMEI Tracker": "Warranty & IMEI Tracker",
  "Retur Penjualan": "Sales Return",
  "Retur Penjualan & Pengembalian Barang": "Sales Return & Item Refund",
  "Pesanan Pembelian (PO)": "Purchase Order (PO)",
  "Order Pembelian (PO)": "Purchase Order (PO)",
  "Manajemen Supplier": "Supplier Management",
  "Manajemen Supplier & Vendor": "Supplier & Vendor Management",
  "Manajemen Supplier, Riwayat PO & Status Hutang Vendor": "Supplier Management, PO History & Vendor Debt",
  "Direktori Kontak": "Contacts Directory",
  "Direktori Kontak Supplier, Konsumen & Karyawan": "Supplier, Customer & Employee Contacts Directory",
  "Manajemen Karyawan": "Employee Management",
  "Manajemen Karyawan & Komisi": "Employee & Commission Management",
  "Buku Kas Laci & Shift Kasir": "Cash Drawer & Cashier Shift",
  "Laporan Keuangan": "Financial Reports",
  "Laporan Keuangan Audit": "Audit Financial Reports",
  "Audit Log Aktivitas": "Activity Audit Log",
  "Audit Log Transaksi & Stok": "Transaction & Stock Audit Log",
  "Audit Log Transaksi & Pergerakan Stok Multi-Cabang": "Transaction & Multi-Branch Stock Movement Audit Log",
  "Resolusi Konflik": "Conflict Resolution",
  "Resolusi Konflik Sinkronisasi": "Sync Conflict Resolution",
  "Resolusi Konflik Sinkronisasi Stok Multi-Outlet": "Multi-Outlet Stock Sync Conflict Resolution",
  "Diskon & Promo": "Discounts & Promos",
  "Manajemen Promo": "Promo Management",
  "Manajemen Promo & Diskon": "Promo & Discount Management",
  "Printer Kasir": "Cashier Printer",
  "Pengaturan & Konfigurasi Printer Struk": "Receipt Printer Settings",
  "Pengaturan Printer": "Printer Settings",
  "Pengaturan Toko & Struk": "Store Settings & Receipts",
  "Pengaturan Toko & Konfigurasi Printer": "Store & Printer Settings",
  "Integrasi Email SMTP": "SMTP Email Integration",
  "Pengaturan Server SMTP Email": "SMTP Email Server Settings",
  "Pengaturan Server SMTP Email & Notifikasi Otomatis": "SMTP Email Server Settings & Automated Notifications",
  "Asisten AI Smart": "Smart AI Assistant",
  "Asisten AI": "AI Assistant",
  "Asisten Gemini AI & Rencana Poster": "Gemini AI Assistant & Poster Planner",
  "Backup Data Database": "Database Backup",
  "Backup & Cadangan Database (JSON / CSV)": "Database Backup & Export (JSON / CSV)",
  "Manajemen Semua Tenant": "All Tenants Management",
  "Manajemen Multi-Tenant Platform": "Platform Multi-Tenant Management",
  "Paket & Billing SaaS": "SaaS Packages & Billing",
  "Paket & Billing Langganan SaaS": "SaaS Subscription Packages & Billing",
  "CMS Teks Landing Page": "Landing Page Text CMS",
  "CMS Pengaturan Teks Landing Page": "Landing Page Text Settings CMS",

  // Header & Controls
  "Aksi Cepat": "Quick Actions",
  "Panel Aksi Cepat": "Quick Actions Panel",
  "Panel Aksi Cepat (Alt + Q)": "Quick Actions Panel (Alt + Q)",
  "Cari / Cek IMEI...": "Search / Check IMEI...",
  "Cari Produk & Cek IMEI / Garansi (Ctrl+K)": "Search Products & Check IMEI / Warranty (Ctrl+K)",
  "Cek IMEI": "Check IMEI",
  "Tema Warna": "Theme Color",
  "Pilih Tema Warna Aplikasi": "Select Application Theme Color",
  "Menu Pengaturan & Profil Pengguna": "Settings & User Profile Menu",
  "Status Jaringan:": "Network Status:",
  "Printer Thermal:": "Thermal Printer:",
  "Bluetooth Siap": "Bluetooth Ready",
  "Cloud Online": "Cloud Online",
  "Mode Offline": "Offline Mode",
  "Tema & Warna Aplikasi": "App Theme & Colors",
  "Bahasa Antarmuka": "Interface Language",
  "Mode Tampilan": "Display Mode",
  "Mode Gelap": "Dark Mode",
  "Mode Terang": "Light Mode",
  "Keluar dari Akun": "Logout Account",
  "Ganti Bahasa": "Switch Language",
  "Bahasa": "Language",

  // Quick Action items
  "Tambah Produk Baru": "Add New Product",
  "Input produk smartphone / aksesoris ke stok": "Input smartphone / accessories into inventory",
  "Tukar tambah & beli HP bekas konsumen": "Trade-in & buy back used customer phones",
  "Lacak garansi & pendaftaran Bea Cukai": "Track warranty & Customs registration",
  "Buka terminal kasir transaksi ritel": "Open cashier terminal for retail sales",
  "Audit fisik persediaan stok toko": "Physical inventory audit of store stock",
  "Analisis laba rugi & tren margin profit": "Analyze profit/loss & profit margin trends",

  // Common UI actions
  "Keluar Akun": "Logout Account",
  "Tetap Masuk": "Keep Logged In",
  "Keluar Sesi": "Logout Session",
  "Menu Navigasi": "Navigation Menu",
  "Tutup Menu": "Close Menu",
  "Pencarian Global (F3)...": "Global Search (F3)...",
  "Pintasan Keyboard Aktif": "Keyboard Shortcuts Active",
  "Keluar": "Logout",
  "Batal": "Cancel",
  "Simpan": "Save",
  "Simpan Perubahan": "Save Changes",
  "Hapus": "Delete",
  "Cari": "Search",
  "Tutup": "Close",
  "Kembali": "Back",
  "Edit": "Edit",
  "Detail": "Details",
  "Konfirmasi": "Confirm",
  "Sukses": "Success",
  "Peringatan": "Warning",
  "Unduh": "Download",
  "Ekspor": "Export",
  "Impor": "Import",
  "Filter": "Filter",
  "Semua": "All",
  
  // Dashboard & Metrics
  "Total Pendapatan (Bulan Ini)": "Total Revenue (This Month)",
  "Total Transaksi": "Total Transactions",
  "Total Kas Aktif (Di Laci)": "Total Active Cash (In Drawer)",
  "Laba Kotor (Estimasi)": "Gross Profit (Estimated)",
  "Laba Bersih": "Net Profit",
  "Penjualan Hari Ini": "Today's Sales",
  "Stok Kritis": "Low Stock Alert",
  "Transaksi Terkini": "Recent Transactions",
  
  // POS & Transactions
  "Keranjang Belanja": "Shopping Cart",
  "Total Pembayaran": "Total Payment",
  "Bayar Sekarang": "Pay Now",
  "Metode Pembayaran": "Payment Method",
  "Tunai": "Cash",
  "Transfer": "Transfer",
  "Diskon": "Discount",
  "Pajak": "Tax",
  "Kembalian": "Change",
  "Cetak Struk": "Print Receipt",
  "Transaksi Baru": "New Transaction",
  
  // Reports
  "Laba Rugi (Profit & Loss)": "Profit & Loss (P&L)",
  "Buku Besar & Audit IMEI": "General Ledger & IMEI Audit",
  "Detail Transaksi Buyback": "Buyback Transaction Details",
  "Arus Kas (Cash Flow)": "Cash Flow",

  // Landing Page & Navigation
  "Masuk Akun": "Sign In",
  "Masuk ke Akun": "Sign In to Account",
  "Masuk": "Sign In",
  "Coba Gratis": "Free Trial",
  "Coba Gratis 14 Hari": "Try Free for 14 Days",
  "Mulai Coba Gratis 14 Hari": "Start 14-Day Free Trial",
  "Buka POS Kasir": "Open POS Cashier",
  "Fitur": "Features",
  "Fitur Utama": "Key Features",
  "Hardware POS": "POS Hardware",
  "Harga": "Pricing",
  "Harga Paket": "Pricing Plans",
  "Testimoni": "Testimonials",
  "FAQ": "FAQ",
  "Lihat Dashboard": "Go to Dashboard",
  "Daftar Akun Baru": "Register New Account",
  "Lupa Password?": "Forgot Password?",
  "Kembali ke Beranda": "Back to Home",
  "Tanpa Perlu Kartu Kredit": "No Credit Card Required",
  "Setup 3 Menit Siap Pakai": "3-Minute Ready Setup",
  "Dukungan Toko & Teknisi": "Store & Technician Support",
  "Toko Gadget Aktif": "Active Gadget Stores",
  "Akurasi Stok IMEI": "IMEI Stock Accuracy",
  "Cetak Struk POS": "POS Receipt Print",
  "Coba Demo POS Interaktif": "Try Interactive POS Demo",
  "Eksplorasi Fitur": "Explore Features",
  "Bulanan": "Monthly",
  "Tahunan": "Annual",
  "Hemat 20%": "Save 20%",
  "Paling Populer": "Most Popular",
  "Pilih Paket": "Choose Plan",
  "Mulai Sekarang": "Start Now",
  "Hubungi Kami": "Contact Us",
  "Solusi Hardware": "Hardware Solutions",
  "Simulasi Interaktif": "Interactive Simulation",
  "Kasir Kilat": "Lightning POS",
  "Stok IMEI": "IMEI Stock",
  "Servis HP": "Phone Repair",
  "Multi-Outlet": "Multi-Outlet",
  "Tukar Tambah": "Trade-In",
  "Semua Hak Cipta Dilindungi.": "All Rights Reserved."
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('id');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));
  };

  const t = (text: string): string => {
    if (!text) return text;
    if (language === 'en') {
      return enDict[text] || text;
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Reusable Global Language Switch Button Component
 * Renders a clean "ID ⇋ EN" toggle without flag emojis
 */
export const LanguageSwitchButton: React.FC<{
  className?: string;
  variant?: 'pill' | 'badge' | 'minimal';
  showLabel?: boolean;
}> = ({ className = '', variant = 'pill' }) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  if (variant === 'badge' || variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border shadow-2xs ${
          language === 'id'
            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
        } ${className}`}
        title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      >
        <span className={language === 'id' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-400'}>ID</span>
        <span className="text-[10px] text-slate-400 select-none font-bold">⇋</span>
        <span className={language === 'en' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400'}>EN</span>
      </button>
    );
  }

  // Pill toggle (default) - Clean "ID ⇋ EN" format
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`group relative inline-flex items-center gap-1 px-1.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer shadow-xs ${className}`}
      title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
    >
      <span
        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all duration-200 ${
          language === 'id'
            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        ID
      </span>
      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 select-none">
        ⇋
      </span>
      <span
        className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all duration-200 ${
          language === 'en'
            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        EN
      </span>
    </button>
  );
};
