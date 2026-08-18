import { useState, useEffect } from "react";
import { apiFetch } from "./api";

export interface PricingPlanConfig {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
}

export interface FAQItemConfig {
  question: string;
  answer: string;
}

export interface LandingContentConfig {
  hero: {
    badgeText: string;
    headlinePrefix: string;
    headlineGradient: string;
    description: string;
    ctaPrimaryText: string;
    ctaSecondaryText: string;
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
  pricing: {
    title: string;
    subtitle: string;
    plans: PricingPlanConfig[];
  };
  faq: {
    title: string;
    subtitle: string;
    items: FAQItemConfig[];
  };
}

export const DEFAULT_LANDING_CONTENT: LandingContentConfig = {
  hero: {
    badgeText: "Software POS & Retail #1 Khusus Toko Gadget & Service Center",
    headlinePrefix: "Kelola Stok IMEI, Kasir Kilat, Servis & Tukar Tambah",
    headlineGradient: "Dalam Satu Ekosistem",
    description: "Hentikan kebocoran stok HP bekas, pantau serial Dual IMEI anti-duplikat, kelola antrean tiket teknisi, dan cetak struk kasir Bluetooth dengan kecepatan maksimal.",
    ctaPrimaryText: "Mulai Coba Gratis 14 Hari",
    ctaSecondaryText: "Coba Demo Interaktif",
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
  pricing: {
    title: "Pilihan Paket Langganan SaaS Transparan",
    subtitle: "Pilih paket yang sesuai dengan kapasitas outlet toko smartphone dan kebutuhan tim Anda.",
    plans: [
      {
        id: "STARTER",
        name: "Starter Outlet",
        badge: "Toko Pemula",
        price: "Rp 99.000",
        period: "/ bulan",
        description: "Cocok untuk 1 gerai counter smartphone mandiri dengan fitur kasir & stok dasar.",
        features: [
          "Maksimal 1 Cabang / Outlet",
          "Hingga 500 Unit Stok HP Aktif",
          "Modul Kasir POS & Bluetooth Print",
          "Tracking IMEI Tunggal / Dual IMEI",
          "Laporan Penjualan Harian Standar",
        ],
        isPopular: false,
        ctaText: "Pilih Paket Starter",
      },
      {
        id: "PRO",
        name: "Professional Store",
        badge: "Paling Populer",
        price: "Rp 199.000",
        period: "/ bulan",
        description: "Solusi lengkap untuk toko smartphone berkembang dengan servis & buyback.",
        features: [
          "Maksimal 3 Cabang Outlet",
          "Stok IMEI Tanpa Batas (Unlimited)",
          "Modul Tukar Tambah & Buyback HP",
          "Antrean Tiket Servis HP & Teknisi",
          "Laporan Keuangan Audit & Laba Bersih",
          "Backup Otomatis & Notifikasi WA",
        ],
        isPopular: true,
        ctaText: "Mulai Uji Coba Pro 14 Hari",
      },
      {
        id: "ENTERPRISE",
        name: "Enterprise Multi-Branch",
        badge: "Jaringan Cabang",
        price: "Rp 399.000",
        period: "/ bulan",
        description: "Untuk jaringan distribusi retail smartphone dan pusat perbaikan besar.",
        features: [
          "Cabang Outlet Tanpa Batas",
          "Multi-Outlet Stock Transfer & Audit",
          "Multi-User Kasir & Role RBAC Penuh",
          "Katalog Online Konsumen Mandiri",
          "Integrasi AI Assistant & Poster Generator",
          "Dukungan Prioritas 24/7 & Dedicated Server",
        ],
        isPopular: false,
        ctaText: "Hubungi Penjualan Enterprise",
      },
    ],
  },
  faq: {
    title: "Pertanyaan yang Sering Diajukan (FAQ)",
    subtitle: "Segala hal yang perlu Anda ketahui tentang implementasi NexusPOS di toko smartphone Anda.",
    items: [
      {
        question: "Apakah sistem ini mendukung pencatatan Dual IMEI per unit handphone?",
        answer: "Ya, NexusPOS memiliki arsitektur khusus untuk tracking Serial Number, IMEI 1, IMEI 2, warna, kapasitas penyimpanan, dan status garansi per unit smartphone dengan validasi anti-duplikat.",
      },
      {
        question: "Apakah bisa digunakan saat koneksi internet terputus (Offline)?",
        answer: "Tentu. Sistem dilengkapi mode offline lokal yang menyimpan transaksi di browser dan otomatis melakukan sinkronisasi data saat koneksi internet terhubung kembali.",
      },
      {
        question: "Bagaimana cara kerja modul Tukar Tambah (Buyback)?",
        answer: "Anda dapat melakukan inspeksi kelayakan fisik HP bekas konsumen, menentukan harga taksiran beli, dan langsung memotongnya sebagai diskon pada struk pembelian HP baru.",
      },
      {
        question: "Apakah ada biaya tersembunyi saat masa trial 14 hari selesai?",
        answer: "Tidak ada. Anda dapat mencoba seluruh fitur Pro selama 14 hari secara gratis tanpa perlu memasukkan kartu kredit.",
      },
    ],
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
      return { ...DEFAULT_LANDING_CONTENT, ...JSON.parse(cached) };
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
        saveLocalLandingContent(data);
        return data;
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
