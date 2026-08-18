import React from "react";
import { 
  Smartphone, 
  ShieldCheck, 
  Repeat, 
  Wrench, 
  Barcode, 
  CreditCard, 
  Store, 
  WifiOff, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock
} from "lucide-react";

interface LandingAdvantagesProps {
  onOpenRegister: (plan?: string) => void;
}

export const LandingAdvantages: React.FC<LandingAdvantagesProps> = ({ onOpenRegister }) => {
  const advantages = [
    {
      icon: <Smartphone className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
      title: "Pelacakan Dual-IMEI Anti-Bocor",
      description: "Setiap unit handphone dilacak spesifik hingga ke nomor IMEI 1 & 2. Hindari tertukarnya unit, kecurangan stok, dan permudah verifikasi klaim garansi toko vs klaim distributor.",
      highlights: ["Deteksi IMEI Duplikat Otomatis", "Riwayat Purna Jual & Asal Supplier", "Pencarian Instan 1-Detik"]
    },
    {
      icon: <Repeat className="h-6 w-6 text-amber-500" />,
      title: "Kalkulator Trade-In & Buyback",
      description: "Hitung taksiran harga HP bekas secara objektif berdasarkan grade (A/B/C/Minus), kelengkapan & kesehatan baterai. Otomatis potong invoice kasir dan unit bekas langsung terdaftar di stok inventori.",
      highlights: ["Form Inspeksi Standar 12-Titik", "Potong Total Pembelian Unit Baru", "Cetak Kwitansi Buyback Resmi"]
    },
    {
      icon: <Wrench className="h-6 w-6 text-emerald-500" />,
      title: "Manajemen Tiket Servis & Teknisi",
      description: "Pantau antrean servis dari penerimaan unit, diagnosa kerusakan, pemakaian sparepart, hingga QC selesai. Lengkap dengan notifikasi status otomatis ke WhatsApp pelanggan dan hitung bagi hasil teknisi.",
      highlights: ["Tracking Status Servis via QR", "Pemotongan Stok Sparepart Otomatis", "Laporan Komisi Teknisi Akurat"]
    },
    {
      icon: <Barcode className="h-6 w-6 text-indigo-500" />,
      title: "Generator SKU & Label Barcode",
      description: "Standarisasi kode inventori berdasarkan Kategori, Brand, Model & Kapasitas (misal: APL-15PM-256G). Cetak label stiker barcode 1D atau QR Code ke printer thermal dalam 1 klik.",
      highlights: ["Format SKU Standar Retail Modern", "Cetak Label Thermal 58mm / 80mm", "Batch Barcode Generator"]
    },
    {
      icon: <Store className="h-6 w-6 text-cyan-500" />,
      title: "Multi-Outlet & Transfer Stok Antar Cabang",
      description: "Kelola 2 hingga 50+ cabang toko retail dari satu dashboard master. Mutasi unit antar toko dilengkapi approval nomor resi transfer, riwayat pengiriman, dan audit stock opname.",
      highlights: ["Stok Terpusat Real-Time", "Surat Jalan Transfer Otomatis", "Pembatasan Hak Akses per Outlet"]
    },
    {
      icon: <WifiOff className="h-6 w-6 text-rose-500" />,
      title: "Kasir Offline-Ready & Anti Mogok",
      description: "Internet toko putus saat jam ramai? Kasir tetap berjalan lancar! Data transaksi disimpan aman di browser dan otomatis tersinkronisasi kembali ke Cloud saat koneksi pulih.",
      highlights: ["Transaksi Tanpa Delay Jaringan", "Auto-Sync Saat Online Kembali", "Dukungan Bluetooth Thermal Printer"]
    }
  ];

  return (
    <section id="advantages" className="py-20 lg:py-28 bg-white dark:bg-slate-900 border-t border-b border-slate-200/80 dark:border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-extrabold tracking-wider uppercase border border-primary-200 dark:border-primary-800">
            <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
            <span>Kelebihan Eksklusif</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Mengapa POS Umum Tidak Cukup untuk Toko Smartphone?
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Bisnis retail gadget memiliki kompleksitas tinggi: unit bekas, IMEI unik, servis teknisi, dan margin fluktuatif. NexusPOS dirancang dari awal khusus untuk memecahkan tantangan ini.
          </p>
        </div>

        {/* 6 Grid Advantages */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {advantages.map((item, index) => (
            <div
              key={index}
              className="p-6 sm:p-7 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-primary-500/60 dark:hover:border-primary-500/60 transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="p-3 w-fit rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {item.title}
              </h3>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>

              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/60 space-y-1.5">
                {item.highlights.map((hl, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-primary-800/60">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xl font-bold tracking-tight">Ingin migrasi dari catatan manual atau POS lama Anda?</h4>
            <p className="text-xs text-slate-300">Tim kami menyediakan bantuan import file Excel stok produk & IMEI gratis tanpa biaya tambahan.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenRegister("PRO")}
            className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-2"
          >
            <span>Konsultasi & Mulai Uji Coba</span>
            <ArrowRight className="h-4 w-4 text-primary-600" />
          </button>
        </div>

      </div>
    </section>
  );
};
