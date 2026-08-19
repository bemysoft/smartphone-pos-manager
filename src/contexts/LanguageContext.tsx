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
  "Terminal Kasir POS": "POS Cashier Terminal",
  "Riwayat & Status Struk WA": "Receipt History & WA Status",
  "Pengaturan WA Toko": "Store WhatsApp Config",
  "Quick Sale - Aksesoris Cepat (Harga Tetap)": "Quick Sale - Fast Accessories (Fixed Price)",
  "Klik untuk tambah ke keranjang tanpa cari": "Click to add to cart instantly",
  "Cari produk, merek, tipe, atau IMEI...": "Search products, brand, model, or IMEI...",
  "Keranjang Transaksi": "Transaction Cart",
  "Keranjang Belanja": "Shopping Cart",
  "Item": "Items",
  "Kosongkan": "Clear",
  "Nama Konsumen": "Customer Name",
  "Pelanggan Umum": "General Customer",
  "No. WhatsApp": "WhatsApp No.",
  "Penanggung Jawab Sales": "Sales Person in Charge",
  "Keranjang masih kosong": "Cart is still empty",
  "Daftar Barang": "Items List",
  "👈 Geser kiri untuk hapus": "👈 Swipe left to delete",
  "Hapus Item": "Delete Item",
  "Kurangi Jumlah": "Decrease Qty",
  "Tambah Jumlah": "Increase Qty",
  "Pilih IMEI": "Select IMEI",
  "-- Pilih IMEI --": "-- Select IMEI --",
  "Sertakan Tukar Tambah (Trade-In) HP Bekas": "Include Used Phone Trade-In (Buyback)",
  "Merek (e.g. Samsung)": "Brand (e.g. Samsung)",
  "Model (e.g. A54)": "Model (e.g. A54)",
  "IMEI HP Bekas": "Used Phone IMEI",
  "Nilai Taksiran (Rp)": "Appraised Value (Rp)",
  "Diskon Manual:": "Manual Discount:",
  "Termasuk PPN": "Includes VAT/Tax",
  "Auto-clear Cart setelah Cetak:": "Auto-clear Cart after Print:",
  "AKTIF (ON)": "ENABLED (ON)",
  "NONAKTIF (OFF)": "DISABLED (OFF)",
  "Metode Pembayaran:": "Payment Method:",
  "Metode Pembayaran": "Payment Method",
  "Subtotal:": "Subtotal:",
  "Total Diskon:": "Total Discount:",
  "Tukar Tambah:": "Trade-In:",
  "TOTAL BAYAR:": "TOTAL DUE:",
  "Total Pembayaran": "Total Payment",
  "Bayar Sekarang": "Pay Now",
  "Preview Struk & Lanjut Bayar": "Preview Receipt & Checkout",
  "Tunai": "Cash",
  "Transfer Bank": "Bank Transfer",
  "Transfer": "Transfer",
  "QRIS Dynamic": "QRIS Dynamic",
  "QRIS": "QRIS",
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
  "Riwayat Transaksi & Status Pengiriman WA": "Transaction History & WA Delivery Status",
  "Verifikasi status pengiriman struk digital ke WhatsApp pelanggan pasca-transaksi": "Verify digital receipt delivery status to customer WhatsApp post-transaction",
  "Cari Nota, Pelanggan, No WA...": "Search Invoice, Customer, WA No...",
  "No. Nota": "Invoice No.",
  "Pelanggan": "Customer",
  "No. WA": "WA No.",
  "Total Bayar": "Total Due",
  "Metode": "Method",
  "Status WA": "WA Status",
  "Aksi Kirim": "Send Action",
  "Belum ada transaksi tercatat.": "No transactions recorded yet.",

  // ==========================================
  // INVENTORY & IMEI MANAGEMENT
  // ==========================================
  "Tambah Unit Baru": "Add New Unit",
  "Daftar Inventaris Smartphone & Aksesoris": "Smartphone & Accessories Inventory List",
  "Scan Barcode Kamera": "Camera Barcode Scan",
  "Cetak Label Stiker Barcode": "Print Adhesive Barcode Labels",
  "Cetak Sheet QR Katalog": "Print Catalog QR Sheet",
  "Cetak Massal Barcode": "Bulk Print Barcodes",
  "Lacak IMEI": "Track IMEI",
  "Export IMEI Report (PDF)": "Export IMEI Report (PDF)",
  "Bulk Import CSV": "Bulk Import CSV",
  "Ekspor Excel (.xlsx)": "Export Excel (.xlsx)",
  "Unduh Laporan Stok": "Download Stock Report",
  "Laporan Opname Bulanan (PDF)": "Monthly Opname Report (PDF)",
  "Ekspor CSV": "Export CSV",
  "Ekspor PDF": "Export PDF",
  "Generator SKU": "SKU Generator",
  "Tambah Stok HP Baru": "Add New Smartphone Stock",
  "Cari berdasarkan nama, brand, model, barcode, atau nomor IMEI spesifik...": "Search by name, brand, model, barcode, or IMEI...",
  "Semua Kategori": "All Categories",
  "Smartphone Baru": "New Smartphones",
  "Smartphone Bekas": "Used Smartphones",
  "Status Stok: Semua": "Stock Status: All",
  "Merek: Semua": "Brand: All",
  "Kondisi: Semua": "Condition: All",
  "Grup Kategori": "Category Groups",
  "Tampilan Tabel": "Table View",
  "Tampilan Grid": "Grid View",
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
  "Modul Buyback & Tukar Tambah HP Bekas": "Smartphone Buyback & Trade-In Module",
  "Beli hp bekas dari pelanggan dengan verifikasi IMEI otomatis, pengecekan garansi, dan integrasi stok penjualan.": "Purchase used smartphones from customers with automatic IMEI verification, warranty checks, and inventory integration.",
  "Kalkulator Estimasi Buyback": "Buyback Valuation Calculator",
  "Proses Buyback Baru": "Process New Buyback",
  "Riwayat Transaksi": "Transaction History",
  "Prediksi & Tren Harga Pasar": "Market Price Trends & Forecast",
  "Cari transaksi buyback berdasarkan nama konsumen, IMEI, brand, atau model hp...": "Search buyback transactions by customer name, IMEI, brand, or model...",
  "Tidak ada transaksi buyback terdaftar.": "No buyback transactions registered.",
  "Lakukan buyback baru untuk memasukkan hp bekas ke stok.": "Perform a new buyback to add used phones into stock.",
  "No Buyback": "Buyback No.",
  "Konsumen": "Customer",
  "Detail Perangkat": "Device Details",
  "Status IMEI": "IMEI Status",
  "Harga Beli": "Purchase Price",
  "Garansi Aktif": "Active Warranty",
  "Garansi Habis": "Expired Warranty",
  "DIBLOKIR / PENADAHAN": "BLOCKED / BLACKLISTED",
  "Cetak Bukti Buyback": "Print Buyback Receipt",
  "Kalkulator Taksiran Harga Trade-In": "Trade-In Price Valuation Calculator",
  "Formulir Penerimaan Buyback": "Buyback Intake Form",
  "Riwayat Transaksi Buyback": "Buyback Transaction History",
  "Diagnosa Kondisi Fisik & Fungsi": "Physical & Functional Diagnostics",
  "Taksiran Nilai Beli": "Estimated Purchase Value",
  "Cetak Nota Buyback": "Print Buyback Receipt",
  "Tambah ke Stok Bekas": "Add to Used Stock",
  "Nama Pelanggan": "Customer Name",
  "Nomor WhatsApp": "WhatsApp Number",
  "Tipe Perangkat": "Device Model",
  "Kesehatan Baterai (BH)": "Battery Health (BH)",
  "Kelengkapan Unit": "Device Accessories & Box",
  "Lengkap Fullset (Dus + Charger)": "Fullset (Box + Charger)",
  "Unit Saja (Batangan)": "Unit Only",

  // ==========================================
  // EMPLOYEES & USERS
  // ==========================================
  "Manajemen Karyawan & Hak Akses": "Employee & Access Control Management",
  "Tambah Karyawan Baru": "Add New Employee",
  "Tambah Karyawan": "Add Employee",
  "Daftar Akun Karyawan & Matriks RBAC": "Employee Accounts List & RBAC Matrix",
  "Presensi & Jam Kerja": "Attendance & Working Hours",
  "Penggajian & Slip Gaji Digital": "Payroll & Digital Payslips",
  "Kasbon & Pinjaman Karyawan": "Employee Loans & Advances",
  "Log Audit & Aktivitas Karyawan": "Employee Activity & Audit Log",
  "Rekam Presensi Mandiri": "Self Clock In / Out",
  "Buat Pinjaman Baru": "Create New Loan",
  "Hitung Gaji Bulan Ini": "Calculate This Month's Payroll",
  "Export Rekap Excel": "Export Summary Excel",
  "Unduh Slip PDF": "Download Payslip PDF",
  "Nama Lengkap": "Full Name",
  "Username / Email": "Username / Email",
  "Peran / Jabatan": "Role / Position",
  "Target Penjualan Bulanan": "Monthly Sales Target",
  "Status Akun": "Account Status",
  "Kasir": "Cashier",
  "Teknisi": "Technician",
  "Manajer": "Manager",
  "Admin Cabang": "Branch Admin",
  "Aktifkan Karyawan": "Activate Employee",
  "Nonaktifkan": "Deactivate",
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
  "Atur Kolom PDF": "Configure PDF Columns",
  "Date Range Picker (Filter Periode Laporan)": "Date Range Picker (Report Period Filter)",
  "Pilih rentang tanggal untuk memperbarui seluruh data audit, P&L, neraca, dan laporan penjualan secara opsional.": "Select date range to optionally update all audit, P&L, balance sheet, and sales reports data.",
  "Custom Range": "Custom Range",
  "Dari Tanggal (Mulai)": "From Date (Start)",
  "Sampai Tanggal (Selesai)": "To Date (End)",
  "Reset Tanggal": "Reset Date",
  "Periode Terpilih:": "Selected Period:",
  "Seluruh Record Database": "All Database Records",
  "Transaksi Terfilter": "Filtered Transactions",
  "Audit & Laporan Keuangan Komprehensif": "Comprehensive Financial & Audit Reports",
  "Laporan lengkap mencakup rincian supplier, konsumen, nomor invoice, IMEI, tanggal & harga beli-jual hp.": "Complete report covering supplier details, customers, invoice numbers, IMEI, date & phone buy/sell prices.",
  "Menganalisis...": "Analyzing...",
  "Analisis Keuangan (AI)": "Financial Analysis (AI)",
  "Cetak Laporan Harian (Thermal)": "Print Daily Report (Thermal)",
  "Backup Database": "Backup Database",
  "Restore Database": "Restore Database",
  "Ekspor Laporan Keuangan Bulanan (PDF Manajemen)": "Export Monthly Financial Report (Management PDF)",
  "Bundel Nota POS": "Bundle POS Receipts",
  "CSV Detail Akuntansi Massal": "Bulk Accounting Detail CSV",
  "Ekspor Excel": "Export Excel",
  "Download PDF (Pilih Kolom)": "Download PDF (Custom Columns)",
  "Total Penerimaan Retail": "Total Retail Revenue",
  "Dari seluruh invoice terbayar": "From all paid invoices",
  "Beban modal awal supplier resmi": "Initial capital expense from official suppliers",
  "Keuntungan bersih dari retail": "Net profit from retail sales",
  "Investasi pembelian hp konsumen": "Customer phone buyback investment",
  "Visualisasi Grafik Tren Pendapatan & Profitabilitas": "Revenue & Profitability Trend Chart Visualization",
  "Analisis tren omset retail hp dan margin keuntungan bersih secara grafik interaktif dengan Recharts.": "Analyze retail revenue trends and net profit margin interactively with Recharts.",
  "📅 Tren Harian": "📅 Daily Trend",
  "📆 Tren Bulanan": "📆 Monthly Trend",
  "Setelah HPP & Beban Buyback": "After COGS & Buyback Expenses",
  "Total Beban Buyback": "Total Buyback Expenses",
  "Akuisisi Smartphone Bekas": "Used Smartphone Acquisition",
  "Rata-rata pendapatan omset": "Average revenue GMV",
  "Total Omzet (Penjualan)": "Total Revenue (Sales)",
  "Laba Bersih (Net Profit)": "Net Profit",
  "Grafik Batang: Total Omzet vs Laba Bersih": "Bar Chart: Total Revenue vs Net Profit",
  "Visualisasi batang berdampingan membandingkan total omzet penjualan kotor dengan realisasi laba bersih untuk evaluasi margin efisiensi finansial toko.": "Side-by-side bar visualization comparing gross sales revenue with net profit realization for store financial margin efficiency evaluation.",
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
  "Semua Karyawan": "All Employees",
  "Laba Rugi Komprehensif": "Comprehensive Profit & Loss",
  "Arus Kas Masuk & Keluar": "Cash Inflow & Outflow",
  "Beban HPP & Pengadaan Supplier": "COGS & Supplier Procurement Expense",
  "Beban Operasional Toko": "Store Operating Expenses",
  "Biaya Servis & Sparepart": "Repair & Spare Part Cost",
  "Pajak PPh / PPN": "Tax (Income Tax / VAT)",
  "Cetak Laporan Keuangan PDF / Excel": "Print Financial Report PDF / Excel",
  "No Invoice": "Invoice No",
  "Pembeli (Konsumen)": "Buyer (Customer)",
  "Model & No IMEI": "Model & IMEI No",
  "Tgl Beli": "Buy Date",
  "Tgl Jual": "Sell Date",
  "Keuntungan": "Profit",
  "Belum ada transaksi audit terekam.": "No audit transactions recorded yet.",
  "Ringkasan Transaksi Penjualan:": "Sales Transactions Summary:",
  "Invoice Terfilter": "Filtered Invoices",
  "Ekspor CSV Akuntansi Massal": "Bulk Accounting CSV Export",
  "Cetak Bundel Nota POS PDF": "Print POS Receipts PDF Bundle",
  "Metode Bayar": "Payment Method",
  "Item Produk": "Product Items",
  "Export Struk Nota": "Export Receipt",
  "Tidak ada transaksi POS yang cocok.": "No matching POS transactions found.",
  "Perangkat": "Device",
  "Grade": "Grade",
  "No IMEI & Status": "IMEI No & Status",
  "Kemenperin": "IMEI Registry",
  "TERVERIFIKASI": "VERIFIED",
  "BELUM VERIF": "UNVERIFIED",
  "Tidak ada transaksi buyback yang cocok.": "No matching buyback transactions found.",
  "Brand": "Brand",
  "Model & Tipe": "Model & Type",
  "Stok": "Stock",
  "Limit Alert": "Alert Limit",
  "Harga Beli Satuan": "Unit Purchase Price",
  "Total Nilai HPP": "Total COGS Value",
  "Harga Jual Satuan": "Unit Selling Price",
  "Margin Laba": "Profit Margin",
  "Potensi Keuntungan": "Potential Profit",
  "Tidak ada produk yang ditemukan.": "No products found.",
  "AMAN": "SAFE",
  "REORDER": "REORDER",
  "Analisis Smartphone Terlaris & Kontribusi Laba": "Best Selling Smartphone & Profit Contribution Analysis",
  "Peringkat smartphone berdasarkan kuantitas penjualan terbayar": "Smartphone ranking based on paid sales volume",
  "Belum ada rincian data penjualan untuk dikalkulasi.": "No sales data details to calculate yet.",
  "Volume Penjualan": "Sales Volume",
  "Unit": "Units",
  "Laporan Laba Rugi Komprehensif (Profit & Loss)": "Comprehensive Profit & Loss Report",
  "Periode s/d": "Period up to",
  "PENDAPATAN USAHA": "OPERATING REVENUE",
  "Penjualan Retail Smartphone (Paid Transactions)": "Smartphone Retail Sales (Paid Transactions)",
  "Total Pendapatan Bersih": "Total Net Revenue",
  "HARGA POKOK PENJUALAN (HPP)": "COST OF GOODS SOLD (COGS)",
  "Beban Pengadaan Modal Awal Supplier (TAM, Erajaya)": "Supplier Initial Procurement Expense (TAM, Erajaya)",
  "Total Harga Pokok Penjualan": "Total Cost of Goods Sold",
  "LABA KOTOR (GROSS PROFIT)": "GROSS PROFIT",
  "BEBAN OPERASIONAL & ARUS KELUAR": "OPERATING EXPENSES & OUTFLOWS",
  "Beban Akuisisi Smartphone Bekas (Customer Buybacks)": "Used Smartphone Acquisition Expense (Customer Buybacks)",
  "Total Beban Operasional": "Total Operating Expenses",
  "LABA BERSIH USAHA (NET INCOME)": "NET BUSINESS INCOME",
  "Neraca Keuangan Aktiva & Pasiva (Balance Sheet)": "Balance Sheet (Assets & Liabilities)",
  "Audit per Tanggal:": "Audit as of Date:",
  "AKTIVA (ASSETS)": "ASSETS",
  "Kas & Setara Kas (Saldo POS)": "Cash & Cash Equivalents (POS Balance)",
  "Persediaan Dagang (Stok HP Aktif)": "Merchandise Inventory (Active Phone Stock)",
  "TOTAL AKTIVA": "TOTAL ASSETS",
  "PASIVA (LIABILITIES & EQUITY)": "LIABILITIES & EQUITY",
  "Kewajiban": "Liabilities",
  "Utang Usaha Supplier": "Supplier Accounts Payable",
  "Ekuitas Modal": "Capital Equity",
  "Modal Ricky Commedan": "Store Capital",
  "Laba Ditahan": "Retained Earnings",
  "TOTAL PASIVA": "TOTAL LIABILITIES & EQUITY",
  "SINKRONISASI NERACA SEIMBANG (BALANCED): AKTIVA = PASIVA": "BALANCED SHEET SYNCHRONIZATION: ASSETS = LIABILITIES + EQUITY",
  "Laporan Arus Kas Operasional (Cash Flow Statement)": "Operating Cash Flow Statement",
  "Metode Langsung (Direct Method) - Real-Time": "Direct Method - Real-Time",
  "ARUS KAS DARI AKTIVITAS OPERASIONAL": "CASH FLOW FROM OPERATING ACTIVITIES",
  "Penerimaan Tunai/Transfer Penjualan": "Cash/Transfer Sales Receipts",
  "Pengeluaran Kas untuk HPP Supplier": "Cash Disbursement for Supplier COGS",
  "Pengeluaran Kas untuk Buyback Hp": "Cash Disbursement for Phone Buybacks",
  "Kas Bersih yang Diperoleh dari Aktivitas Operasi": "Net Cash from Operating Activities",
  "Kas dan Setara Kas Awal Periode (Modal)": "Cash and Cash Equivalents Beginning of Period",
  "KAS DAN SETARA KAS AKHIR PERIODE": "CASH AND CASH EQUIVALENTS END OF PERIOD",
  "Penjadwalan Laporan Otomatis (Cron Simulator)": "Automated Report Scheduling (Cron Simulator)",
  "Kirim rangkuman finansial & file PDF kustom harian, mingguan, atau bulanan langsung ke email manajemen dan notifikasi admin.": "Send daily, weekly, or monthly financial summaries and custom PDF reports directly to management email and admin notifications.",
  "Reset Form": "Reset Form",
  "Edit Konfigurasi Jadwal": "Edit Schedule Configuration",
  "Buat Jadwal Otomatis Baru": "Create New Automated Schedule",
  "Tipe Laporan": "Report Type",
  "Frekuensi": "Frequency",
  "Format File": "File Format",
  "Email Manager (Tujuan)": "Manager Email (Recipient)",
  "✍️ Personalisasi Desain PDF": "✍️ PDF Design Personalization",
  "Nama Toko / Cabang": "Store / Branch Name",
  "Nama Manager Utama": "Primary Manager Name",
  "Tema Warna Aksen PDF": "PDF Accent Color Theme",
  "Pesan / Catatan Tambahan (PDF)": "Additional Message / Notes (PDF)",
  "Perbarui Jadwal Laporan": "Update Report Schedule",
  "Aktifkan Jadwal Otomatis": "Activate Automated Schedule",
  "Menyimpan...": "Saving...",

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
  // AUDIT LOG & SECURITY
  // ==========================================
  "Audit Trail & Rekam Jejak Keamanan": "Audit Trail & Security Log",
  "Monitoring seluruh aktivitas transaksi, perubahan data inventori, login kasir, dan penyesuaian sistem untuk kepatuhan & transparansi toko.": "Monitor all transaction activities, inventory modifications, cashier logins, and system changes for compliance & transparency.",
  "Total Aktivitas": "Total Activities",
  "Seluruh riwayat tercatat": "All recorded events",
  "Peringatan Keamanan": "Security Alerts",
  "Perlu perhatian admin": "Requires admin attention",
  "Aktivitas Hari Ini": "Today's Activities",
  "Log 24 jam terakhir": "Past 24 hours log",
  "Kategori Log": "Log Categories",
  "Tipe event sistem": "System event types",
  "Semua Log": "All Logs",
  "Keuangan & Transaksi": "Finance & Transactions",
  "Inventori & IMEI": "Inventory & IMEI",
  "Keamanan & Hak Akses": "Security & Access Rights",
  "Sistem & Konfigurasi": "System & Configuration",
  "30 Hari Terakhir": "Last 30 Days",
  "Semua Severity": "All Severities",
  "Info Biasa": "Normal Info",
  "Peringatan (Warning)": "Warning",
  "Bahaya (Critical)": "Critical Alert",
  "WAKTU & TANGGAL": "TIME & DATE",
  "PENGGUNA / KASIR": "USER / CASHIER",
  "KATEGORI": "CATEGORY",
  "AKSI / EVENT": "ACTION / EVENT",
  "DESKRIPSI RINCIAN": "DETAILED DESCRIPTION",
  "SEVERITY": "SEVERITY",
  "DETAIL": "DETAIL",
  "Filter Severity": "Severity Filter",
  "Lihat Metadata": "View Metadata",
  "Detail Metadata Log Audit": "Audit Log Metadata Details",
  "Informasi Record": "Record Information",
  "Waktu:": "Time:",
  "Pengguna:": "User:",
  "IP Address:": "IP Address:",
  "Perangkat:": "Device:",
  "Payload Perubahan Data:": "Data Modification Payload:",

  // ==========================================
  // CASH REGISTER & DRAWER
  // ==========================================
  "Buku Kas & Manajemen Kasir": "Cash Drawer & Cashier Management",
  "Kontrol uang modal awal, arus kas masuk/keluar, rekonsiliasi selisih kas, dan penutupan shift kasir harian.": "Control opening floating cash, cash inflows/outflows, cash reconciliation, and daily shift closing.",
  "Status Shift Kasir": "Cashier Shift Status",
  "Buka Shift Baru": "Open New Shift",
  "Shift Sedang Berjalan": "Shift In Progress",
  "Modal Awal Laci Kas": "Opening Cash Drawer",
  "Total Penjualan Tunai": "Total Cash Sales",
  "Kas Masuk / Keluar": "Cash In / Out",
  "Estimasi Total di Laci": "Estimated Drawer Total",
  "Buka Shift Kasir": "Open Cashier Shift",
  "Catat Arus Kas Masuk/Keluar": "Record Cash In / Out",
  "Cetak Rekap Shift (Thermal)": "Print Shift Summary (Thermal)",
  "Modal Awal Kas (Rp)": "Opening Float Amount (Rp)",
  "Nominal Uang Fisik Aktual di Laci (Rp)": "Actual Physical Cash in Drawer (Rp)",
  "Selisih Kas:": "Cash Discrepancy:",
  "Seimbang (Rp 0)": "Balanced (Rp 0)",
  "Surplus Kas": "Cash Surplus",
  "Defisit Kas": "Cash Deficit",
  "Catatan Penutupan Shift:": "Shift Closing Notes:",
  "Tipe Arus Kas": "Cash Flow Type",
  "Uang Masuk (Kas Masuk)": "Cash In",
  "Uang Keluar (Kas Keluar)": "Cash Out",
  "Kategori Pengeluaran": "Expense Category",
  "Beli ATK / Kertas Struk": "Office Supplies / Receipt Paper",
  "Konsumsi & Operasional": "Meals & Operations",
  "Setoran Bank / Modal": "Bank Deposit / Capital",
  "Lainnya": "Others",
  "Keterangan / Keperluan:": "Description / Purpose:",

  // ==========================================
  // PROMO & DISCOUNT CONFIG
  // ==========================================
  "Atur diskon bertingkat dan buy-1-get-1.": "Configure tiered discounts and buy-1-get-1 offers.",
  "Tambah Promo": "Add Promotion",
  "Edit Promo": "Edit Promotion",
  "Promo Baru": "New Promotion",
  "Simpan Promo": "Save Promotion",
  "Nama Promo": "Promotion Name",
  "Tipe Promo": "Promotion Type",
  "Diskon Kuantitas (Beli N, Diskon X%)": "Quantity Discount (Buy N, Get X% Off)",
  "Diskon Member (Berdasarkan Role)": "Member Discount (Role Based)",
  "Beli X Gratis Y": "Buy X Get Y Free",
  "Deskripsi Singkat": "Short Description",
  "Minimal Beli (Qty)": "Minimum Purchase (Qty)",
  "Diskon (%)": "Discount (%)",
  "Beli (X Unit)": "Buy (X Units)",
  "Gratis (Y Unit)": "Free (Y Units)",
  "Berlaku Dari": "Valid From",
  "Berlaku Sampai": "Valid Until",
  "Cetak Keterangan Promo di Struk Kasir": "Print Promo Description on Receipt",

  // ==========================================
  // BACKUP & DISASTER RECOVERY
  // ==========================================
  "Disaster Recovery & Central Tenant Backup Vault": "Disaster Recovery & Central Tenant Backup Vault",
  "Pusat kendali pencadangan basis data snapshot lokal, sinkronisasi cloud, pemulihan darurat titik waktu (Point-in-Time Restore), dan isolasi per-tenant.": "Central control for database snapshots, cloud sync, point-in-time disaster recovery, and per-tenant data isolation.",
  "Total Snapshot Cadangan": "Total Backup Snapshots",
  "Pencadangan Sukses": "Successful Backups",
  "Penyimpanan Cloud": "Cloud Storage",
  "Isolasi Tenant ID": "Tenant ID Isolation",
  "Snapshot Basis Data": "Database Snapshots",
  "Jadwal Backup Otomatis": "Automated Backup Schedules",
  "Ekspor & Ekstraksi CSV": "CSV Export & Extraction",
  "Arsip Data Tahunan": "Annual Data Archive",
  "NAMA SNAPSHOT & TANGGAL": "SNAPSHOT NAME & DATE",
  "UKURAN FILE": "FILE SIZE",
  "TIPE DATABASE": "DATABASE TYPE",
  "STATUS INTEGRITAS": "INTEGRITY STATUS",
  "TENANT ID": "TENANT ID",
  "AKSI PEMULIHAN": "RECOVERY ACTION",
  "Buat Snapshot Baru Sekarang": "Create New Snapshot Now",
  "Restore Snapshot Ini": "Restore This Snapshot",
  "Unduh File Cadangan (.JSON)": "Download Backup File (.JSON)",
  "Hapus Snapshot": "Delete Snapshot",
  "Simpan Jadwal Backup": "Save Backup Schedule",
  "Ekspor Semua Transaksi (.CSV)": "Export All Transactions (.CSV)",
  "Ekspor Data Produk (.CSV)": "Export Products Data (.CSV)",
  "Konfirmasi Pemulihan Basis Data (Restore)": "Confirm Database Restore",

  // ==========================================
  // MULTI OUTLET & TRANSFERS
  // ==========================================
  "Transfer Stok Antar-Cabang & Multi-Outlet": "Inter-Branch Stock Transfer & Multi-Outlet",
  "Cabang / Outlet Toko": "Store Branches / Outlets",
  "Daftar Transfer Stok": "Stock Transfer List",
  "Riwayat & Log Mutasi": "Mutation History & Logs",
  "Buat Permintaan Transfer Stok Baru": "Create New Stock Transfer Request",
  "Outlet Asal (Pengirim)": "Source Outlet (Sender)",
  "Outlet Tujuan (Penerima)": "Destination Outlet (Receiver)",
  "Pilih Produk & IMEI yang Dikirim": "Select Products & Transferred IMEIs",
  "Daftar IMEI yang Ditransfer:": "List of Transferred IMEIs:",
  "Catatan Pengiriman / Ekspedisi:": "Shipping / Courier Notes:",
  "Kirim Langsung (In-Transit)": "Dispatch Now (In-Transit)",
  "Simpan sebagai Draf": "Save as Draft",
  "Konfirmasi Penerimaan Barang Transfer": "Confirm Incoming Transfer Receipt",
  "Periksa fisik unit dan nomor IMEI yang tiba di outlet tujuan.": "Inspect physical units and IMEIs arriving at the destination outlet.",
  "Catatan Selisih / Kerusakan:": "Discrepancy / Damage Notes:",
  "Terima & Tambahkan ke Stok Outlet Ini": "Receive & Add to This Outlet's Stock",
  "SURAT JALAN PENGIRIMAN BARANG": "DELIVERY ORDER & WAYBILL",
  "No. Dokumen:": "Document #:",
  "Pengirim:": "Sender:",
  "Penerima:": "Receiver:",
  "Rincian Item & Nomor IMEI:": "Item Details & IMEI Numbers:",
  "Tanda Tangan Pengirim": "Sender Signature",
  "Tanda Tangan Kurir / Supir": "Driver / Courier Signature",
  "Tanda Tangan Penerima": "Receiver Signature",
  "Pending (Draf)": "Pending (Draft)",
  "In-Transit (Dalam Perjalanan)": "In-Transit",
  "Completed (Selesai Diterima)": "Completed (Received)",
  "Dibatalkan": "Cancelled",

  // ==========================================
  // SALES RETURNS & REFUNDS
  // ==========================================
  "Manajemen Retur Penjualan & Pengembalian Dana (Refund)": "Sales Returns & Refund Management",
  "Catat retur produk dari pelanggan, verifikasi kondisi IMEI, dan kembalikan dana kasir atau tukar unit.": "Record customer returns, verify IMEI condition, and process cashier refunds or unit replacements.",
  "Barang tidak sesuai / Cacat pabrik": "Defective / Factory Fault",
  "Kerusakan Layar / LCD": "Screen / LCD Damage",
  "Sinyal / IMEI Terblokir": "Blocked IMEI / No Signal",
  "Kamera / Speaker Rusak": "Faulty Camera / Speaker",
  "Proses Retur Transaksi": "Process Return Transaction",
  "Kondisi Unit Dikembalikan": "Returned Unit Condition",
  "Metode Pengembalian": "Refund Method",
  "Kembalikan Dana Tunai (Refund)": "Cash Refund",
  "Tukar Unit Baru / Sejenis": "Replace with New Unit",
  "Voucher Belanja Toko": "Store Credit Voucher",

  // ==========================================
  // PURCHASE ORDERS & SUPPLIERS
  // ==========================================
  "Draf Pesanan (DRAFT)": "Order Draft (DRAFT)",
  "Terkirim ke Vendor (SENT)": "Sent to Vendor (SENT)",
  "Diterima Sebagian (PARTIAL)": "Partially Received (PARTIAL)",
  "Selesai Diterima (RECEIVED)": "Fully Received (RECEIVED)",
  "Dibatalkan (CANCELLED)": "Cancelled (CANCELLED)",
  "Tempo 14 Hari": "Net 14 Days",
  "Tempo 30 Hari": "Net 30 Days",
  "Cash On Delivery (COD)": "Cash On Delivery (COD)",
  "Bayar Dimuka (Transfer Lunas)": "Prepaid (Full Transfer)",
  "Buat Purchase Order (PO) Baru": "Create New Purchase Order (PO)",
  "Pilih Supplier Vendor": "Select Supplier Vendor",
  "Pilih Produk yang Dipesan": "Select Ordered Products",
  "Penerimaan Barang & Input IMEI Supplier": "Goods Receipt & Supplier IMEI Entry",
  "Cocokkan nomor IMEI fisik unit dari dus kiriman vendor.": "Match physical unit IMEI numbers from vendor delivery box.",
  "Cetak Faktur PO Supplier": "Print Supplier PO Invoice",

  // ==========================================
  // PRINTER & WHATSAPP SETTINGS
  // ==========================================
  "Logo & Kop Informasi Toko": "Store Logo & Header Info",
  "Header Meta Invoice & Tanggal": "Invoice Meta Header & Date",
  "Informasi Kasir & Pelanggan": "Cashier & Customer Info",
  "Box Detail & Syarat Garansi Toko": "Store Warranty Details & Terms",
  "Daftar Produk, Harga & IMEI": "Product List, Prices & IMEI",
  "Subtotal, Diskon & Pembayaran": "Subtotal, Discount & Payment",
  "Poin Loyalti Member Pelanggan": "Customer Loyalty Points",
  "QR Code Interaktif & Label": "Interactive QR Code & Label",
  "Pesan Promosi & Penawaran Khusus": "Promotional Messages & Special Offers",
  "Catatan Kaki & Ucapan Terima Kasih": "Footer Notes & Thank You Message",
  "Konfigurasi Printer Bluetooth / USB": "Bluetooth / USB Printer Configuration",
  "Pratinjau Struk Kasir Thermal": "Thermal Receipt Preview",
  "Template Invoice Kertas A4": "A4 Invoice Template",
  "Pencadangan Konfigurasi": "Configuration Backup",
  "Gateway WhatsApp Struk Digital": "Digital Receipt WhatsApp Gateway",
  "Ukuran Kertas Thermal (58mm / 80mm)": "Thermal Paper Size (58mm / 80mm)",
  "Cetak Logo Toko": "Print Store Logo",
  "Cetak Barcode / QR Invoice": "Print Invoice Barcode / QR",

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
