import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (text: string) => string;
}

const enDict: Record<string, string> = {
  // Sidebar & Navigation
  "Dasbor Analitik": "Analytics Dashboard",
  "POS Kasir Penjualan": "POS Cashier",
  "Dasbor Analitik Real-Time": "Real-Time Analytics Dashboard",
  "Point of Sale Kasir Penjualan": "Point of Sale Cashier",
  "Katalog Pelanggan": "Customer Catalog",
  "Katalog Inventaris & IMEI": "Inventory & IMEI Catalog",
  "Katalog Inventaris": "Inventory Catalog",
  "Modul Tukar Tambah & Buyback": "Trade-in & Buyback Module",
  "Tukar Tambah & Buyback": "Trade-in & Buyback",
  "Garansi & IMEI Tracker": "Warranty & IMEI Tracker",
  "Laporan Keuangan Audit": "Audit Financial Reports",
  "Pesanan Pembelian (PO)": "Purchase Order (PO)",
  "Order Pembelian (PO)": "Purchase Order (PO)",
  "Manajemen Karyawan": "Employee Management",
  "Direktori Kontak": "Contacts Directory",
  "Asisten Gemini AI & Rencana Poster": "Gemini AI Assistant & Posters",
  "Asisten AI": "AI Assistant",
  "Pengaturan & Konfigurasi Printer Struk": "Receipt Printer Settings",
  "Pengaturan Printer": "Printer Settings",
  "Pengaturan Toko & Struk": "Store Settings & Receipts",
  "Pengaturan Toko & Konfigurasi Printer": "Store & Printer Settings",
  
  // Common
    "Manajemen Promo": "Promo Management",
  "Manajemen Promo & Diskon": "Promo & Discount Management",
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
  "Hapus": "Delete",
  "Cari": "Search",
  "Tutup": "Close",
  "Kembali": "Back",
  
  // Dashboard
  "Total Pendapatan (Bulan Ini)": "Total Revenue (This Month)",
  "Total Transaksi": "Total Transactions",
  "Total Kas Aktif (Di Laci)": "Total Active Cash (In Drawer)",
  "Laba Kotor (Estimasi)": "Gross Profit (Estimated)",
  "Laba Bersih": "Net Profit",
  
  // POS
  "Keranjang Belanja": "Shopping Cart",
  "Total Pembayaran": "Total Payment",
  "Bayar Sekarang": "Pay Now",
  
  // Reports
  "Laba Rugi (Profit & Loss)": "Profit & Loss (P&L)",
  "Buku Besar & Audit IMEI": "General Ledger & IMEI Audit",
  "Detail Transaksi Buyback": "Buyback Transaction Details",
  "Arus Kas (Cash Flow)": "Cash Flow",
  "Laporan Keuangan": "Financial Reports"
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
  };

  const t = (text: string): string => {
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
