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

const STORAGE_KEY = "nexus_landing_page_config";

/**
 * Load landing content from localStorage cache, then sync from server
 */
export function getStoredLandingContent(): LandingContentConfig {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_LANDING_CONTENT,
        ...parsed,
        hero: { ...DEFAULT_LANDING_CONTENT.hero, ...(parsed.hero || {}) },
        advantages: { ...DEFAULT_LANDING_CONTENT.advantages, ...(parsed.advantages || {}) },
        pricing: { ...DEFAULT_LANDING_CONTENT.pricing, ...(parsed.pricing || {}) },
        testimonials: { ...DEFAULT_LANDING_CONTENT.testimonials, ...(parsed.testimonials || {}) },
        faq: { ...DEFAULT_LANDING_CONTENT.faq, ...(parsed.faq || {}) },
        brand: { ...DEFAULT_LANDING_CONTENT.brand, ...(parsed.brand || {}) },
      };
    }
  } catch (e) {}
  return DEFAULT_LANDING_CONTENT;
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
  try {
    const res = await apiFetch("/api/landing-config");
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") {
        const merged: LandingContentConfig = {
          ...DEFAULT_LANDING_CONTENT,
          ...data,
          hero: { ...DEFAULT_LANDING_CONTENT.hero, ...(data.hero || {}) },
          advantages: { ...DEFAULT_LANDING_CONTENT.advantages, ...(data.advantages || {}) },
          pricing: { ...DEFAULT_LANDING_CONTENT.pricing, ...(data.pricing || {}) },
          testimonials: { ...DEFAULT_LANDING_CONTENT.testimonials, ...(data.testimonials || {}) },
          faq: { ...DEFAULT_LANDING_CONTENT.faq, ...(data.faq || {}) },
          brand: { ...DEFAULT_LANDING_CONTENT.brand, ...(data.brand || {}) },
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
 * React Hook for automatic synchronization with landing page content
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

    window.addEventListener("landingcontentupdated", handleUpdate);
    return () => window.removeEventListener("landingcontentupdated", handleUpdate);
  }, []);

  return content;
}
