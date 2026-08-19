import { useState, useEffect } from "react";
import { apiFetch } from "./api";

export interface PricingPlanConfig {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  missing: string[];
  popular: boolean;
  ctaText: string;
}

export interface FAQItemConfig {
  question: string;
  answer: string;
}

export interface TestimonialItemConfig {
  name: string;
  role: string;
  location: string;
  content: string;
  stats: string;
  rating: number;
}

export interface AdvantageItemConfig {
  iconName: string;
  title: string;
  tag: string;
  description: string;
  highlight: string;
}

export interface LandingContentConfig {
  hero: {
    badgeText: string;
    headlinePrefix: string;
    headlineGradient: string;
    description: string;
    ctaPrimaryText: string;
    ctaSecondaryText: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
  };
  advantages: {
    title: string;
    subtitle: string;
    items: AdvantageItemConfig[];
  };
  pricing: {
    title: string;
    subtitle: string;
    annualDiscountBadge: string;
    plans: PricingPlanConfig[];
  };
  testimonials: {
    title: string;
    subtitle: string;
    items: TestimonialItemConfig[];
  };
  faq: {
    title: string;
    subtitle: string;
    items: FAQItemConfig[];
  };
  brand: {
    brandName: string;
    badgeText: string;
    tagline: string;
    contactWhatsapp: string;
    contactEmail: string;
    address: string;
    copyrightText: string;
  };
}

export const DEFAULT_LANDING_CONTENT: LandingContentConfig = {
  hero: {
    badgeText: "Software POS & Retail #1 Khusus Toko Gadget & Service Center",
    headlinePrefix: "Kelola Stok IMEI, Kasir Kilat, Servis & Tukar Tambah",
    headlineGradient: "Dalam Satu Ekosistem",
    description: "Hentikan kebocoran stok HP bekas, pantau serial Dual IMEI anti-duplikat, kelola antrean tiket teknisi, dan cetak struk kasir Bluetooth dengan kecepatan maksimal.",
    ctaPrimaryText: "Mulai Coba Gratis 14 Hari",
    ctaSecondaryText: "Coba Demo POS Interaktif",
    stat1Value: "1.450+",
    stat1Label: "Toko Gadget Aktif",
    stat2Value: "99.99%",
    stat2Label: "Akurasi Stok IMEI",
    stat3Value: "< 1 Detik",
    stat3Label: "Cetak Struk POS",
  },
  advantages: {
    title: "Mengapa Toko Smartphone Wajib Beralih ke NexusPOS?",
    subtitle: "Didesain khusus mengatasi masalah rumit ritel handphone: serial IMEI ganda, perbaikan teknisi, dan jual beli HP bekas.",
    items: [
      {
        iconName: "ShieldCheck",
        title: "Pelacakan Dual-IMEI Anti Bocor",
        tag: "Zero Duplicate",
        description: "Setiap HP tercatat dengan IMEI 1, IMEI 2, warna, kapasitas, dan status garansi. Sistem otomatis memblokir nomor serial duplikat.",
        highlight: "100% Bebas Selisih Serial HP",
      },
      {
        iconName: "Printer",
        title: "Kasir Kilat & Cetak Bluetooth",
        tag: "High Speed POS",
        description: "Proses transaksi kasir hitungan detik via barcode scan kamera, koneksi printer thermal Bluetooth/USB, dan split payment QRIS.",
        highlight: "Hemat Waktu Antrean 70%",
      },
      {
        iconName: "Wrench",
        title: "Service Center & Tiket Teknisi",
        tag: "Auto WhatsApp",
        description: "Keluarkan surat tanda terima servis dengan QR status, hitung komisi teknisi otomatis, dan kirim notifikasi WA saat HP selesai.",
        highlight: "Transparansi Ongkos & Part",
      },
      {
        iconName: "Repeat",
        title: "Kalkulator Tukar Tambah (Trade-In)",
        tag: "Smart Buyback",
        description: "Formulir grading fisik HP second konsumen langsung memotong tagihan belanja unit baru dan masuk ke buku inventaris bekas.",
        highlight: "Margin Laba Second Terjaga",
      },
    ],
  },
  pricing: {
    title: "Pilihan Paket SaaS yang Bertumbuh Bersama Toko Anda",
    subtitle: "Semua paket mencakup uji coba gratis 14 hari tanpa risiko. Tanpa biaya tersembunyi, tanpa ikatan kontrak jangka panjang.",
    annualDiscountBadge: "HEMAT 20%",
    plans: [
      {
        id: "STARTER",
        name: "Starter Gadget",
        tagline: "Ideal untuk toko tunggal & kios handphone pemula.",
        monthlyPrice: 149000,
        annualPrice: 119000,
        popular: false,
        badge: "Kios Tunggal",
        features: [
          "1 Cabang / Outlet Toko",
          "2 Akun Pengguna (Admin & Kasir)",
          "Pelacakan Stok IMEI & Non-IMEI",
          "POS Kasir Cepat & Struk Bluetooth",
          "Modul Tukar Tambah Standar",
          "Laporan Penjualan & Laba Harian",
          "Dukungan Komunitas & Panduan",
        ],
        missing: [
          "Modul Service Center & Teknisi",
          "Transfer Stok Antar Outlet",
          "Notifikasi WhatsApp Otomatis",
          "Generator SKU Kustom",
        ],
        ctaText: "Mulai Uji Coba Starter",
      },
      {
        id: "PRO",
        name: "Pro Retail Growth",
        tagline: "Paling populer untuk toko berkembang dengan layanan servis & tukar tambah.",
        monthlyPrice: 299000,
        annualPrice: 239000,
        popular: true,
        badge: "Paling Populer",
        features: [
          "Hingga 3 Cabang / Outlet Toko",
          "Pengguna Tanpa Batas (Unlimited Users)",
          "Pelacakan Dual-IMEI Lengkap Anti-Duplikat",
          "Modul Service Center & Antrean Teknisi",
          "Kalkulator Tukar Tambah & Buyback Otomatis",
          "Mutasi Stok Antar Cabang + Nomor Resi",
          "Generator SKU Standar & Stiker Barcode",
          "Notifikasi WhatsApp Struk & Servis Siap Ambil",
          "Laporan HPP, Margin & Komisi Teknisi",
          "Support Prioritas via WhatsApp",
        ],
        missing: ["Dedicated Database & Custom Domain"],
        ctaText: "Mulai Uji Coba Pro 14 Hari",
      },
      {
        id: "ENTERPRISE",
        name: "Enterprise Multi-Store",
        tagline: "Solusi terlengkap untuk jaringan retail besar, distributor & grosir handphone.",
        monthlyPrice: 599000,
        annualPrice: 479000,
        popular: false,
        badge: "Multi-Cabang Tanpa Batas",
        features: [
          "Cabang / Outlet Toko Tanpa Batas",
          "Pengguna Tanpa Batas & Multi-Role Kustom",
          "Semua Fitur Pro Tanpa Batas",
          "Akses Integrasi API & Webhook",
          "Audit Log Aktivitas Karyawan Lengkap",
          "Backup Otomatis Real-Time & Enkripsi",
          "Bantuan Onboarding & Import Excel Khusus",
          "Dedicated Account Manager 24/7",
          "SLA Uptime 99.99% Guaranteed",
        ],
        missing: [],
        ctaText: "Hubungi Penjualan Enterprise",
      },
    ],
  },
  testimonials: {
    title: "Dipercaya Lebih dari 1.450+ Pemilik Toko Smartphone di Seluruh Indonesia",
    subtitle: "Dengar langsung cerita nyata bagaimana pemilik toko gadget dan service center bertransformasi bersama NexusPOS.",
    items: [
      {
        name: "Hendrik Wijaya",
        role: "Owner, Galaxy Cell (3 Cabang)",
        location: "ITC Roxy Mas, Jakarta Pusat",
        content: "Dulu kami sering pusing saat stock opname HP bekas karena nomor IMEI sering tertukar dan salah input modal. Sejak pakai NexusPOS, pelacakan unit second dan tukar tambah jadi rapi 100%. Kasir juga jauh lebih cepat.",
        stats: "Selisih Stok Turun Jadi 0%",
        rating: 5,
      },
      {
        name: "Ricky Pratama",
        role: "Founder, Medan Gadget Store & Service",
        location: "Plaza Medan Fair, Medan",
        content: "Modul tiket servisnya luar biasa! Pelanggan sangat senang karena mereka dapat update status pengerjaan otomatis via WhatsApp saat LCD atau baterai HP-nya selesai diganti. Komisi teknisi juga otomatis terhitung akurat.",
        stats: "Kepuasan Pelanggan Naik 95%",
        rating: 5,
      },
      {
        name: "Siti Rahmawati",
        role: "Operasional, Berkah Phone Retail",
        location: "WTC Surabaya, Jawa Timur",
        content: "Fitur transfer stok antar cabang dengan surat jalan nomor resi sangat membantu koordinasi 4 toko kami. Ketika internet mal sedang down, kasir offline tetap jalan tanpa panik dan otomatis tersinkron lagi.",
        stats: "Efisiensi Waktu Admin 40 Jam/Bulan",
        rating: 5,
      },
    ],
  },
  faq: {
    title: "Pertanyaan yang Sering Diajukan (FAQ)",
    subtitle: "Punya pertanyaan lain? Kami rangkum jawaban atas hal-hal yang paling sering ditanyakan oleh calon pengguna kami.",
    items: [
      {
        question: "Apakah bisa scan nomor IMEI menggunakan kamera smartphone atau tablet tanpa beli scanner mahal?",
        answer: "Bisa 100%! NexusPOS dilengkapi modul kamera barcode & QR code scanner bawaan berkecepatan tinggi. Anda juga bisa menyambungkan scanner USB atau wireless Bluetooth jika ingin alur kasir yang lebih cepat.",
      },
      {
        question: "Bagaimana jika koneksi internet toko tiba-tiba mati saat transaksi sedang ramai?",
        answer: "Kasir Anda tidak akan terhenti! NexusPOS dirancang dengan arsitektur Offline-First. Seluruh transaksi kasir dan mutasi barang tetap tersimpan aman di penyimpanan lokal browser dan akan otomatis disinkronisasi ke server Firestore ketika internet terhubung kembali.",
      },
      {
        question: "Bagaimana cara memindahkan ribuan data produk & IMEI lama kami dari file Excel?",
        answer: "Sangat mudah! Kami menyediakan template import Excel/CSV standar. Cukup upload file Anda, dan data produk, stok, nomor IMEI, serta harga modal akan masuk otomatis. Tim customer support kami juga siap mendampingi proses migrasi data Anda secara gratis.",
      },
      {
        question: "Merek printer apa saja yang didukung untuk cetak struk kasir & tiket servis?",
        answer: "NexusPOS mendukung hampir seluruh printer thermal Bluetooth dan USB 58mm maupun 80mm yang menggunakan protokol standar ESC/POS (seperti Panda, Iware, Eppos, Xprinter, Sunmi, RPP02N, Zijiang, Epson, dll).",
      },
      {
        question: "Apakah ada potongan persenan atau biaya tersembunyi untuk setiap transaksi kasir?",
        answer: "Sama sekali TIDAK ADA. NexusPOS menggunakan sistem langganan flat subscription yang transparan. Berapapun omset dan jumlah transaksi toko Anda, biaya langganan tetap sama sesuai paket yang Anda pilih.",
      },
      {
        question: "Apakah NexusPOS cocok untuk toko yang memiliki teknisi servis sekaligus melayani tukar tambah HP second?",
        answer: "Tepat sekali! NexusPOS secara spesifik dirancang untuk ekosistem toko smartphone terpadu yang menggabungkan penjualan unit baru, tukar tambah HP bekas (trade-in), penjualan aksesoris, hingga perbaikan service center dengan perhitungan komisi teknisi.",
      },
    ],
  },
  brand: {
    brandName: "NexusPOS",
    badgeText: "Cloud",
    tagline: "Ekosistem Kasir, Inventori IMEI & Manajemen Toko Smartphone Modern",
    contactWhatsapp: "6281234567890",
    contactEmail: "support@nexuspos.cloud",
    address: "Jakarta & Medan, Indonesia",
    copyrightText: "© 2026 NexusPOS Cloud Inc. All rights reserved.",
  },
};

export const DEFAULT_LANDING_CONTENT_EN: LandingContentConfig = {
  hero: {
    badgeText: "#1 POS & Retail Software for Gadget Stores & Service Centers",
    headlinePrefix: "Manage IMEI Stock, Rapid Cashier, Service & Trade-In",
    headlineGradient: "In One Unified Ecosystem",
    description: "Prevent used phone stock loss, track dual IMEI serial numbers with zero duplicates, manage technician service tickets, and print Bluetooth receipts at lightning speed.",
    ctaPrimaryText: "Start 14-Day Free Trial",
    ctaSecondaryText: "Try Interactive POS Demo",
    stat1Value: "1,450+",
    stat1Label: "Active Gadget Stores",
    stat2Value: "99.99%",
    stat2Label: "IMEI Stock Accuracy",
    stat3Value: "< 1 Sec",
    stat3Label: "POS Receipt Print",
  },
  advantages: {
    title: "Why Smartphone Stores Choose NexusPOS?",
    subtitle: "Built specifically to solve the complex challenges of smartphone retail: dual IMEI serial numbers, technician repairs, and used phone trade-ins.",
    items: [
      {
        iconName: "ShieldCheck",
        title: "Zero-Leak Dual-IMEI Tracking",
        tag: "Zero Duplicate",
        description: "Every smartphone is recorded with IMEI 1, IMEI 2, color, capacity, and warranty status. Automatically blocks duplicate serial numbers.",
        highlight: "100% Zero Serial Variance",
      },
      {
        iconName: "Printer",
        title: "Lightning Cashier & Bluetooth Printing",
        tag: "High Speed POS",
        description: "Process cashier checkout in seconds with camera barcode scanning, Bluetooth/USB thermal printers, and QRIS split payment.",
        highlight: "Cut Queue Time by 70%",
      },
      {
        iconName: "Wrench",
        title: "Service Center & Tech Tickets",
        tag: "Auto WhatsApp",
        description: "Issue repair receipts with QR verification, auto-calculate tech commissions, and send WhatsApp updates when repairs are ready.",
        highlight: "Transparent Labor & Parts",
      },
      {
        iconName: "Repeat",
        title: "Trade-In & Buyback Calculator",
        tag: "Smart Buyback",
        description: "Customer physical grading forms directly deduct purchase totals and log units into the second-hand inventory ledger.",
        highlight: "Protect Used Margins",
      },
    ],
  },
  pricing: {
    title: "SaaS Plans Designed to Grow with Your Store",
    subtitle: "All plans include a risk-free 14-day free trial. No hidden fees, no long-term contract lock-ins.",
    annualDiscountBadge: "SAVE 20%",
    plans: [
      {
        id: "STARTER",
        name: "Starter Gadget",
        tagline: "Ideal for single stores and beginner phone kiosks.",
        monthlyPrice: 149000,
        annualPrice: 119000,
        popular: false,
        badge: "Single Kiosk",
        features: [
          "1 Branch / Store Outlet",
          "2 User Accounts (Admin & Cashier)",
          "IMEI & Non-IMEI Stock Tracking",
          "Fast POS Cashier & Bluetooth Receipts",
          "Standard Trade-In Module",
          "Daily Sales & Profit Reports",
          "Community & Guide Support",
        ],
        missing: [
          "Service Center & Technician Module",
          "Inter-Outlet Stock Transfer",
          "Automated WhatsApp Notifications",
          "Custom SKU Generator",
        ],
        ctaText: "Start Starter Trial",
      },
      {
        id: "PRO",
        name: "Pro Retail Growth",
        tagline: "Most popular for growing stores with repair services & trade-ins.",
        monthlyPrice: 299000,
        annualPrice: 239000,
        popular: true,
        badge: "Most Popular",
        features: [
          "Up to 3 Branches / Outlets",
          "Unlimited User Accounts",
          "Full Dual-IMEI Tracking with Anti-Duplicate",
          "Service Center & Tech Queue Module",
          "Automated Trade-In & Buyback Calculator",
          "Inter-Branch Stock Transfer with Waybill Tracking",
          "Standard SKU Generator & Barcode Labels",
          "WhatsApp Receipt & Repair-Ready Notifications",
          "COGS, Margin & Technician Commission Reports",
          "Priority WhatsApp Support",
        ],
        missing: ["Dedicated Database & Custom Domain"],
        ctaText: "Start 14-Day Pro Trial",
      },
      {
        id: "ENTERPRISE",
        name: "Enterprise Multi-Store",
        tagline: "Complete solution for large retail chains, distributors & wholesalers.",
        monthlyPrice: 599000,
        annualPrice: 479000,
        popular: false,
        badge: "Unlimited Branches",
        features: [
          "Unlimited Store Branches / Outlets",
          "Unlimited Users & Custom Multi-Role",
          "All Pro Features Unlimited",
          "API & Webhook Integration Access",
          "Full Employee Activity Audit Log",
          "Real-Time Auto Backup & Encryption",
          "Dedicated Onboarding & Excel Import Support",
          "24/7 Dedicated Account Manager",
          "99.99% Guaranteed SLA Uptime",
        ],
        missing: [],
        ctaText: "Contact Enterprise Sales",
      },
    ],
  },
  testimonials: {
    title: "Trusted by Over 1,450+ Smartphone Store Owners Across the Country",
    subtitle: "Hear real stories of how gadget stores and service centers scaled with NexusPOS.",
    items: [
      {
        name: "Hendrik Wijaya",
        role: "Owner, Galaxy Cell (3 Branches)",
        location: "ITC Roxy Mas, Jakarta",
        content: "We used to struggle with used phone stock opname because serials were mixed up. Since adopting NexusPOS, second-hand unit tracking and trade-ins are 100% accurate. Cashier speed is also much faster.",
        stats: "Stock Discrepancy Down to 0%",
        rating: 5,
      },
      {
        name: "Ricky Pratama",
        role: "Founder, Medan Gadget Store & Service",
        location: "Plaza Medan Fair, Medan",
        content: "The service ticket module is incredible! Customers love getting automated WhatsApp status updates when their screen or battery replacement is complete. Technician commissions are calculated automatically.",
        stats: "Customer Satisfaction +95%",
        rating: 5,
      },
      {
        name: "Siti Rahmawati",
        role: "Operations, Berkah Phone Retail",
        location: "WTC Surabaya, East Java",
        content: "Inter-branch stock transfers with waybills make coordinating 4 stores seamless. When mall internet drops, the offline cashier works without panic and syncs back smoothly.",
        stats: "Saved 40 Admin Hours/Month",
        rating: 5,
      },
    ],
  },
  faq: {
    title: "Frequently Asked Questions (FAQ)",
    subtitle: "Have more questions? Here are the most common inquiries from our new store partners.",
    items: [
      {
        question: "Can I scan IMEI numbers using a phone or tablet camera without buying expensive scanners?",
        answer: "100% Yes! NexusPOS comes with a high-speed built-in camera barcode and QR code scanner. You can also connect standard USB or wireless Bluetooth scanners for even faster checkout.",
      },
      {
        question: "What happens if store internet disconnects during busy peak hours?",
        answer: "Your checkout will never stop! NexusPOS is engineered with an Offline-First architecture. All sales and inventory movements remain saved locally and automatically synchronize to Firestore once internet reconnects.",
      },
      {
        question: "How do we migrate thousands of existing products and IMEIs from Excel files?",
        answer: "Super simple! We provide standard Excel/CSV import templates. Upload your file, and products, stock, IMEIs, and cost prices will be imported automatically. Our support team is also available to assist your migration for free.",
      },
      {
        question: "Which printer models are supported for cashier receipts and repair tickets?",
        answer: "NexusPOS supports nearly all 58mm and 80mm Bluetooth and USB thermal printers using standard ESC/POS commands (such as Panda, Iware, Eppos, Xprinter, Sunmi, RPP02N, Zijiang, Epson, etc).",
      },
      {
        question: "Are there any transaction percentage cuts or hidden fees per sale?",
        answer: "Absolutely ZERO. NexusPOS uses a 100% transparent flat subscription model. No matter how large your sales volume is, your monthly subscription remains fixed.",
      },
      {
        question: "Is NexusPOS suitable for stores that handle repairs and customer phone trade-ins?",
        answer: "Exactly! NexusPOS is purposefully built for the smartphone ecosystem combining new phone sales, second-hand trade-ins, accessories, and technician service center ticketing with commission tracking.",
      },
    ],
  },
  brand: {
    brandName: "NexusPOS",
    badgeText: "Cloud",
    tagline: "Modern Smartphone POS, IMEI Inventory & Retail Management Ecosystem",
    contactWhatsapp: "6281234567890",
    contactEmail: "support@nexuspos.cloud",
    address: "Jakarta & Medan, Indonesia",
    copyrightText: "© 2026 NexusPOS Cloud Inc. All rights reserved.",
  },
};

const STORAGE_KEY = "nexus_landing_page_config";

/**
 * Load landing content from localStorage cache, taking language into account
 */
export function getStoredLandingContent(): LandingContentConfig {
  const currentLang = (typeof localStorage !== "undefined" && localStorage.getItem("app_language")) || "id";
  const baseDefault = currentLang === "en" ? DEFAULT_LANDING_CONTENT_EN : DEFAULT_LANDING_CONTENT;

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...baseDefault,
        ...parsed,
        hero: { ...baseDefault.hero, ...(parsed.hero || {}) },
        advantages: { ...baseDefault.advantages, ...(parsed.advantages || {}) },
        pricing: { ...baseDefault.pricing, ...(parsed.pricing || {}) },
        testimonials: { ...baseDefault.testimonials, ...(parsed.testimonials || {}) },
        faq: { ...baseDefault.faq, ...(parsed.faq || {}) },
        brand: { ...baseDefault.brand, ...(parsed.brand || {}) },
      };
    }
  } catch (e) {}
  return baseDefault;
}

/**
 * Save landing content locally and dispatch update event
 */
export function saveLocalLandingContent(config: LandingContentConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent("landingcontentupdated", { detail: config }));
  } catch (e) {}
}

/**
 * Fetch latest landing configuration from backend
 */
export async function fetchServerLandingContent(): Promise<LandingContentConfig> {
  const currentLang = (typeof localStorage !== "undefined" && localStorage.getItem("app_language")) || "id";
  const baseDefault = currentLang === "en" ? DEFAULT_LANDING_CONTENT_EN : DEFAULT_LANDING_CONTENT;

  try {
    const res = await apiFetch("/api/landing-config");
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") {
        const merged: LandingContentConfig = {
          ...baseDefault,
          ...data,
          hero: { ...baseDefault.hero, ...(data.hero || {}) },
          advantages: { ...baseDefault.advantages, ...(data.advantages || {}) },
          pricing: { ...baseDefault.pricing, ...(data.pricing || {}) },
          testimonials: { ...baseDefault.testimonials, ...(data.testimonials || {}) },
          faq: { ...baseDefault.faq, ...(data.faq || {}) },
          brand: { ...baseDefault.brand, ...(data.brand || {}) },
        };
        saveLocalLandingContent(merged);
        return merged;
      }
    }
  } catch (e) {}
  return getStoredLandingContent();
}

/**
 * Save landing configuration to backend server and cache locally
 */
export async function saveServerLandingContent(config: LandingContentConfig): Promise<{ success: boolean; message: string }> {
  try {
    saveLocalLandingContent(config);
    const res = await apiFetch("/api/landing-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      const result = await res.json();
      return { success: true, message: result.message || "Berhasil disimpan ke server cloud!" };
    }
    return { success: true, message: "Berhasil disimpan secara lokal!" };
  } catch (err: any) {
    return { success: true, message: "Tersimpan di perangkat lokal." };
  }
}

/**
 * React Hook for automatic synchronization with landing page content and active language
 */
export function useLandingContent(): LandingContentConfig {
  const [content, setContent] = useState<LandingContentConfig>(getStoredLandingContent());

  useEffect(() => {
    fetchServerLandingContent().then((data) => {
      if (data) setContent(data);
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LandingContentConfig>;
      if (customEvent.detail) {
        setContent(customEvent.detail);
      } else {
        setContent(getStoredLandingContent());
      }
    };

    const handleLanguageChange = () => {
      setContent(getStoredLandingContent());
    };

    window.addEventListener("landingcontentupdated", handleUpdate);
    window.addEventListener("languagechange", handleLanguageChange);
    return () => {
      window.removeEventListener("landingcontentupdated", handleUpdate);
      window.removeEventListener("languagechange", handleLanguageChange);
    };
  }, []);

  return content;
}
