import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => string;
}

const enDict: Record<string, string> = {
  // ==========================================
  // SIDEBAR SECTIONS & HEADERS
  // ==========================================
  "Operasional Kasir & Stok": "Cashier & Inventory Operations",
  "Transaksi & Layanan": "Transactions & Services",
  "Pengadaan & Kontak": "Purchasing & Contacts",
  "Analitik & Keuangan": "Analytics & Finance",
  "Pengaturan & Alat": "Settings & Tools",
  "Superadmin Hub": "Superadmin Hub",
  "Superadmin Platform Hub": "Superadmin Platform Hub",

  // ==========================================
  // SIDEBAR NAVIGATION TABS & BREADCRUMBS
  // ==========================================
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
  "Asisten AI & Poster": "AI Assistant & Posters",
  "Asisten Gemini AI & Rencana Poster": "Gemini AI Assistant & Poster Planner",
  "Backup Data Database": "Database Backup",
  "Backup & Cadangan Database (JSON / CSV)": "Database Backup & Export (JSON / CSV)",
  "Manajemen Semua Tenant": "All Tenants Management",
  "Manajemen Multi-Tenant Platform": "Platform Multi-Tenant Management",
  "Paket & Billing SaaS": "SaaS Packages & Billing",
  "Paket & Billing Langganan SaaS": "SaaS Subscription Packages & Billing",
  "CMS Teks Landing Page": "Landing Page Text CMS",
  "CMS Pengaturan Teks Landing Page": "Landing Page Text Settings CMS",

  // ==========================================
  // HEADER & QUICK ACTIONS
  // ==========================================
  "Aksi Cepat": "Quick Actions",
  "Panel Aksi Cepat": "Quick Actions Panel",
  "Panel Aksi Cepat (Alt + Q)": "Quick Actions Panel (Alt + Q)",
  "Cari / Cek IMEI...": "Search / Check IMEI...",
  "Cari Produk & Cek IMEI / Garansi (Ctrl+K)": "Search Products & Check IMEI / Warranty (Ctrl+K)",
  "Cek IMEI": "Check IMEI",
  "Cek IMEI Terakhir": "Latest IMEI Check",
  "Proses Buyback Cepat": "Quick Buyback Process",
  "Kasir Penjualan POS": "POS Cashier Sales",
  "Profit Margin & Laporan": "Profit Margin & Reports",
  "Inventaris": "Inventory",
  "Buyback": "Buyback",
  "Garansi": "Warranty",
  "Ritel POS": "Retail POS",
  "Audit Stok": "Stock Audit",
  "Keuangan": "Finance",
  "Tema Warna": "Theme Color",
  "Pilih Tema Warna Aplikasi": "Select Application Theme Color",
  "Menu Pengaturan & Profil Pengguna": "Settings & User Profile Menu",
  "Status Jaringan:": "Network Status:",
  "Printer Thermal:": "Thermal Printer:",
  "Bluetooth Siap": "Bluetooth Ready",
  "Cloud Online": "Cloud Online",
  "Mode Offline": "Offline Mode",
  "Status: Cloud Synced (Online)": "Status: Cloud Synced (Online)",
  "Status: Offline Mode": "Status: Offline Mode",
  "Tema & Warna Aplikasi": "App Theme & Colors",
  "Kustom": "Custom",
  "Bahasa Antarmuka": "Interface Language",
  "Mode Tampilan": "Display Mode",
  "Mode Gelap": "Dark Mode",
  "Mode Terang": "Light Mode",
  "Mode Malam": "Night Mode",
  "Ganti ke Mode Terang": "Switch to Light Mode",
  "Ganti ke Mode Malam": "Switch to Dark Mode",
  "Keluar dari Akun": "Logout Account",
  "Ganti Bahasa": "Switch Language",
  "Bahasa": "Language",
  "Reset Sesi": "Reset Session",
  "Perluas Sidebar Navigasi (Ctrl+B)": "Expand Sidebar Navigation (Ctrl+B)",
  "Perkecil Sidebar Navigasi (Ctrl+B)": "Collapse Sidebar Navigation (Ctrl+B)",
  "Cabang Utama": "Main Branch",

  // Quick Action items
  "Tambah Produk Baru": "Add New Product",
  "Input produk smartphone / aksesoris ke stok": "Input smartphone / accessories into inventory",
  "Tukar tambah & beli HP bekas konsumen": "Trade-in & buy back used customer phones",
  "Lacak garansi & pendaftaran Bea Cukai": "Track warranty & Customs registration",
  "Buka terminal kasir transaksi ritel": "Open cashier terminal for retail sales",
  "Audit fisik persediaan stok toko": "Physical inventory audit of store stock",
  "Analisis laba rugi & tren margin profit": "Analyze profit/loss & profit margin trends",

  // ==========================================
  // COMMON UI ACTIONS & LABELS
  // ==========================================
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
  "Gagal": "Failed",
  "Unduh": "Download",
  "Ekspor": "Export",
  "Impor": "Import",
  "Filter": "Filter",
  "Semua": "All",
  "Aksi": "Action",
  "Status": "Status",
  "Tanggal": "Date",
  "Waktu": "Time",
  "Total": "Total",
  "Subtotal": "Subtotal",
  "Jumlah": "Quantity",
  "Harga": "Price",
  "Catatan": "Notes",
  "Kategori": "Category",
  "Merek": "Brand",
  "Model": "Model",
  "Deskripsi": "Description",
  "Semua Cabang": "All Branches",
  "Pilih Outlet": "Select Outlet",

  // ==========================================
  // DASHBOARD & ANALYTICS
  // ==========================================
  "Total Pendapatan (Bulan Ini)": "Total Revenue (This Month)",
  "Total Transaksi": "Total Transactions",
  "Total Kas Aktif (Di Laci)": "Total Active Cash (In Drawer)",
  "Laba Kotor (Estimasi)": "Gross Profit (Estimated)",
  "Laba Bersih": "Net Profit",
  "Penjualan Hari Ini": "Today's Sales",
  "Stok Kritis": "Low Stock Alert",
  "Transaksi Terkini": "Recent Transactions",
  "Unit Smartphone Terjual": "Smartphone Units Sold",
  "Performa Penjualan": "Sales Performance",
  "Tren Penjualan Mingguan": "Weekly Sales Trend",
  "Produk Terlaris": "Top Selling Products",
  "Hari Ini": "Today",
  "7 Hari Terakhir": "Last 7 Days",
  "Bulan Ini": "This Month",
  "Tahun Ini": "This Year",
  "Semua Waktu": "All Time",
  "Target Penjualan": "Sales Target",
  "Pencapaian Target": "Target Achievement",
  "Statistik Superadmin": "Superadmin Statistics",
  "Toko Terdaftar": "Registered Stores",
  "Tenant Aktif": "Active Tenants",
  "Masa Uji Coba (Trial)": "Trial Accounts",

  // ==========================================
  // POS (POINT OF SALE) & CASHIER
  // ==========================================
  "Keranjang Belanja": "Shopping Cart",
  "Total Pembayaran": "Total Payment",
  "Bayar Sekarang": "Pay Now",
  "Metode Pembayaran": "Payment Method",
  "Tunai": "Cash",
  "Transfer Bank": "Bank Transfer",
  "Transfer": "Transfer",
  "QRIS Dynamic": "QRIS Dynamic",
  "Kartu Debit / EDC": "Debit Card / EDC",
  "Kartu Kredit": "Credit Card",
  "Split Payment (Ganda)": "Split Payment",
  "Diskon": "Discount",
  "Pajak": "Tax",
  "Kembalian": "Change Due",
  "Uang Diterima": "Cash Received",
  "Uang Pas": "Exact Amount",
  "Cetak Struk": "Print Receipt",
  "Transaksi Baru": "New Transaction",
  "Kosongkan Keranjang": "Clear Cart",
  "Tahan Transaksi (Hold)": "Hold Transaction",
  "Daftar Transaksi Ditahan": "Held Transactions List",
  "Pilih Pelanggan": "Select Customer",
  "Pelanggan Umum (Walk-in)": "Walk-in Customer",
  "Scan Barcode / Input IMEI": "Scan Barcode / Input IMEI",
  "Nomor Struk / Invoice": "Receipt / Invoice No",
  "Buka Laci Kasir": "Open Cash Drawer",
  "Shift Kasir Aktif": "Active Cashier Shift",
  "Tutup Shift Kasir": "Close Cashier Shift",

  // ==========================================
  // INVENTORY & IMEI MANAGEMENT
  // ==========================================
  "Tambah Unit Baru": "Add New Unit",
  "Daftar Inventaris Smartphone & Aksesoris": "Smartphone & Accessories Inventory List",
  "Nomor IMEI 1": "IMEI 1 Number",
  "Nomor IMEI 2": "IMEI 2 Number",
  "Harga Modal (Beli)": "Cost Price",
  "Harga Jual": "Selling Price",
  "Stok Tersedia": "Available Stock",
  "Stok Minimum": "Minimum Stock Alert",
  "Kondisi Unit": "Unit Condition",
  "Baru (Segel BNIB)": "Brand New (Sealed BNIB)",
  "Bekas / Second (Grade A)": "Used (Grade A)",
  "Bekas / Second (Grade B)": "Used (Grade B)",
  "Bekas / Second (Grade C)": "Used (Grade C)",
  "Klaim Garansi Resmi": "Official Warranty Claim",
  "Klaim Garansi Distributor": "Distributor Warranty Claim",
  "Klaim Garansi Toko": "Store Warranty Claim",
  "Impor Data dari Excel": "Import from Excel",
  "Ekspor Data ke Excel": "Export to Excel",
  "Cetak Label Barcode / QR": "Print Barcode / QR Labels",

  // ==========================================
  // TRADE-IN & BUYBACK
  // ==========================================
  "Kalkulator Taksiran Harga Trade-In": "Trade-In Price Valuation Calculator",
  "Nama Pelanggan": "Customer Name",
  "Nomor WhatsApp": "WhatsApp Number",
  "Tipe Perangkat": "Device Model",
  "Kesehatan Baterai (BH)": "Battery Health (BH)",
  "Kelengkapan Unit": "Device Accessories & Box",
  "Lengkap Fullset (Dus + Charger)": "Fullset (Box + Charger)",
  "Unit Saja (Batangan)": "Unit Only",
  "Inspeksi Fisik & Fungsi": "Physical & Functional Inspection",
  "Layar Normal & TrueTone Aktif": "Normal Screen & TrueTone OK",
  "Kamera Jernih (Depan & Belakang)": "Clear Cameras (Front & Back)",
  "Face ID / Fingerprint Berfungsi": "Face ID / Fingerprint Working",
  "Sinyal All-Operator & IMEI Aman": "All-Carrier Signal & Valid IMEI",
  "Estimasi Harga Beli / Taksiran": "Estimated Buyback Value",
  "Cetak Kwitansi Buyback": "Print Buyback Receipt",
  "Potong ke Transaksi Penjualan": "Deduct from POS Sale",

  // ==========================================
  // SERVICE & REPAIR CENTER
  // ==========================================
  "Nomor Tiket Servis": "Service Ticket #",
  "Keluhan & Kerusakan": "Issue & Defect Description",
  "Teknisi Penanggung Jawab": "Assigned Technician",
  "Estimasi Biaya Servis": "Estimated Repair Cost",
  "Biaya Sparepart": "Spare Part Cost",
  "Jasa Teknisi": "Technician Fee",
  "Status Servis": "Service Status",
  "Unit Diterima": "Unit Received",
  "Sedang Diagnosa": "Under Diagnosis",
  "Menunggu Sparepart": "Waiting for Parts",
  "Proses Pengerjaan": "In Repair",
  "Selesai (Siap Diambil)": "Completed (Ready for Pickup)",
  "Unit Sudah Diambil": "Handed Over to Customer",
  "Kirim Status WhatsApp": "Send WhatsApp Status Update",
  "Komisi Teknisi": "Technician Commission",

  // ==========================================
  // LANDING PAGE & NAVIGATION
  // ==========================================
  "Masuk Akun": "Sign In",
  "Masuk ke Akun": "Sign In to Account",
  "Masuk": "Sign In",
  "Coba Gratis": "Free Trial",
  "Coba Gratis 14 Hari": "Try Free for 14 Days",
  "Mulai Coba Gratis 14 Hari": "Start 14-Day Free Trial",
  "Mulai Uji Coba Gratis 14 Hari": "Start 14-Day Free Trial",
  "Buka POS Kasir": "Open POS Cashier",
  "Fitur": "Features",
  "Fitur Utama": "Key Features",
  "Hardware POS": "POS Hardware",
  "Harga Paket": "Pricing Plans",
  "Testimoni": "Testimonials",
  "FAQ": "FAQ",
  "Lihat Dashboard": "Go to Dashboard",
  "Daftar Akun Baru": "Register New Account",
  "Daftar Gratis 14 Hari": "Register Free for 14 Days",
  "Lupa Password?": "Forgot Password?",
  "Lupa Sandi?": "Forgot Password?",
  "Kembali ke Beranda": "Back to Home",
  "Kembali ke Login": "Back to Login",
  "Tanpa Perlu Kartu Kredit": "No Credit Card Required",
  "Setup 3 Menit Siap Pakai": "3-Minute Ready Setup",
  "Setup Cepat 2 Menit": "Fast 2-Minute Setup",
  "Bantuan Migrasi Data Excel Gratis": "Free Excel Data Migration Assistance",
  "Dukungan Toko & Teknisi": "Store & Technician Support",
  "Toko Gadget Aktif": "Active Gadget Stores",
  "Toko HP & Gadget Aktif": "Active Smartphone & Gadget Stores",
  "Unit IMEI Terverifikasi": "Verified IMEI Units",
  "Omset Diproses / Bulan": "Processed GMV / Month",
  "Uptime Cloud SLA": "Cloud SLA Uptime",
  "Akurasi Stok IMEI": "IMEI Stock Accuracy",
  "Cetak Struk POS": "POS Receipt Print",
  "Coba Demo POS Interaktif": "Try Interactive POS Demo",
  "Eksplorasi Fitur": "Explore Features",
  "Bulanan": "Monthly",
  "Tahunan": "Annual",
  "Bayar Bulanan": "Monthly Billing",
  "Bayar Tahunan": "Annual Billing",
  "Hemat 20%": "Save 20%",
  "Paling Populer": "Most Popular",
  "⭐ PALING DIREKOMENDASIKAN": "⭐ MOST RECOMMENDED",
  "Pilih Paket": "Choose Plan",
  "Mulai Sekarang": "Start Now",
  "Hubungi Kami": "Contact Us",
  "Solusi Hardware": "Hardware Solutions",
  "Simulasi Interaktif": "Interactive Simulation",
  "Interactive Live Sandbox": "Interactive Live Sandbox",
  "Coba Langsung Simulasi Fitur Unggulan NexusPOS": "Experience NexusPOS Key Features in Real-Time",
  "Rasakan kemudahan verifikasi data IMEI, kalkulasi tukar tambah otomatis, dan tracking status servis langsung di browser Anda.": "Experience seamless IMEI verification, automated trade-in valuation, and repair ticket tracking right in your browser.",
  "Kasir Kilat": "Lightning POS",
  "Stok IMEI": "IMEI Stock",
  "Servis HP": "Phone Repair",
  "Multi-Outlet": "Multi-Outlet",
  "Tukar Tambah": "Trade-In",
  "Kasir & Scan IMEI": "Cashier & IMEI Scan",
  "Antrean Servis": "Repair Queue",
  "Multi Cabang": "Multi-Branch",
  "Cek & Lacak IMEI": "Search & Track IMEI",
  "Kalkulator Tukar Tambah": "Trade-In Calculator",
  "Lacak Tiket Servis": "Track Repair Ticket",
  "Kelebihan Eksklusif": "Exclusive Advantages",
  "Investasi Transparan": "Transparent Investment",
  "Kisah Sukses Pengguna": "Customer Success Stories",
  "Tanya Jawab Populer": "Frequently Asked Questions",
  "Ditagih tahunan": "Billed annually",
  "Fitur Termasuk:": "Included Features:",
  "Mulai Uji Coba Gratis": "Start Free Trial",
  "Gratis 14 hari, batalkan kapan saja": "Free 14 days, cancel anytime",
  "Kalkulator Proyeksi Penghematan & ROI": "Projected Savings & ROI Calculator",
  "Hitung Berapa Keuntungan & Efisiensi Toko Anda": "Calculate Your Store's Profit & Efficiency",
  "Simulasikan estimasi waktu dan biaya kebocoran stok HP yang berhasil diselamatkan dengan otomatisasi NexusPOS.": "Simulate saved admin hours and eliminated phone stock leakage with NexusPOS automation.",
  "Jumlah Gerai / Cabang Toko:": "Number of Store Outlets / Branches:",
  "Toko": "Stores",
  "Penjualan Unit HP / Bulan:": "Monthly Phone Sales Volume:",
  "Unit / Toko": "Units / Store",
  "Waktu Admin Hemat": "Admin Time Saved",
  "Jam / Bln": "Hours / Mo",
  "Selisih Stok Dicegah": "Stock Discrepancy Prevented",
  "Biaya Software NexusPOS": "NexusPOS Software Cost",
  "/ bln": "/ mo",
  "Mulai Hemat Sekarang": "Start Saving Today",
  // ==========================================
  // FINANCIAL REPORTS & LEDGER
  // ==========================================
  "Grafik Tren Pendapatan": "Revenue Trends Chart",
  "Buku Besar & Audit IMEI": "General Ledger & IMEI Audit",
  "Detail Transaksi POS": "POS Transaction Details",
  "Detail Transaksi Buyback": "Buyback Transaction Details",
  "Opname & Penilaian Stok": "Stock Opname & Valuation",
  "Smartphone Terlaris": "Best Selling Smartphones",
  "Laba Rugi (Profit & Loss)": "Profit & Loss (P&L)",
  "Neraca Keuangan": "Balance Sheet",
  "Arus Kas (Cash Flow)": "Cash Flow Statement",
  "Penjadwalan Otomatis": "Automated Scheduling",
  "Daftar Laporan": "Reports List",
  "Pilih jenis laporan operasional dan finansial toko": "Select store operational and financial report type",
  "Hasil Audit & Rekomendasi Finansial Pintar (AI)": "Smart AI Financial Audit & Recommendations",
  "Total Pembelian Stok (HPP)": "Total Stock Procurement (COGS)",
  "Profit Kotor (Margin)": "Gross Profit (Margin)",
  "Arus Kas Keluar (Buyback)": "Cash Outflow (Buyback)",
  "Total Revenue": "Total Revenue",
  "Gross Profit": "Gross Profit",
  "Active Buybacks": "Active Buybacks",
  "Pending POs": "Pending POs",
  "Pesanan Supplier Aktif": "Active Supplier Orders",
  "Total Investasi": "Total Investment",
  "Transaksi Terbayar": "Paid Transactions",
  "Minggu Ini": "This Week",
  "Semua Karyawan": "All Employees",

  // ==========================================
  // SUPERADMIN HUB
  // ==========================================
  "Daftar Toko & Lisensi": "Stores & Licenses List",
  "Audit Log Lintas Tenant": "Cross-Tenant Audit Log",
  "Backup & Ekspor Terenkripsi": "Encrypted Backup & Export",
  "Laporan Kesehatan Keamanan": "Security Health Report",
  "Manajemen Tenant & Lisensi SaaS": "Tenant & SaaS License Management",
  "Auto-Reminder (7 Hari)": "Auto-Reminder (7 Days)",
  "Broadcast Email": "Broadcast Email",
  "Registrasi Wizard": "Registration Wizard",
  "Tambah Tenant": "Add Tenant",
  "Aktif": "Active",
  "Kedaluwarsa": "Expired",
  "Uji Coba": "Trial",
  "Jatuh Tempo": "Expiring Soon",
  "Hari": "Days",
  "Hari Lalu": "Days Ago",
  "Sisa": "Remaining",
  "Diperlukan": "Required",
  "Tercapai 100%": "100% Achieved",
  "Pencapaian Target Toko": "Store Target Achievement",
  "Unduh Ringkasan (PDF)": "Download Summary (PDF)",
  "Refresh Data Dasbor": "Refresh Dashboard Data",

  // ==========================================
  // TOASTS & NETWORK
  // ==========================================
  "Koneksi Internet Terhubung Kembali! Sinkronisasi data ke Cloud berhasil.": "Internet Reconnected! Cloud data synchronization successful.",
  "Gagal menyinkronkan data. Pastikan koneksi internet stabil.": "Failed to synchronize data. Please verify your internet connection.",
  "Internet Terhubung": "Internet Connected",
  "Internet Terputus (Bekerja Offline)": "Internet Disconnected (Working Offline)",

  "Modul Aplikasi": "App Modules",
  "Pusat Bantuan & Legal": "Help Center & Legal",
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
