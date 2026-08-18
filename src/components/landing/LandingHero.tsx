import React, { useState } from "react";
import { 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  Play, 
  TrendingUp, 
  Users, 
  Zap, 
  Store, 
  Wrench, 
  Repeat, 
  Layers, 
  Barcode, 
  Printer, 
  Check, 
  Star,
  Activity,
  ShoppingBag,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { useLandingContent } from "../../lib/landingContent";

interface LandingHeroProps {
  onOpenRegister: (plan?: string) => void;
  onLaunchDemo: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenRegister,
  onLaunchDemo
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<"pos" | "imei" | "service" | "multioutlet">("pos");
  const landingContent = useLandingContent();
  const hero = landingContent.hero;

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary-500/15 to-indigo-500/15 dark:from-primary-500/20 dark:to-purple-500/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Eyebrow Tag */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800/80 text-primary-700 dark:text-primary-300 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-400 animate-ping" />
            <span className="text-xs font-bold tracking-wide">
              {hero.badgeText}
            </span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mt-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            {hero.headlinePrefix}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-cyan-600 dark:from-primary-400 dark:via-indigo-400 dark:to-cyan-400">
              {hero.headlineGradient}
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {hero.description}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => onOpenRegister("PRO")}
              className="w-full sm:w-auto px-7 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="h-4 w-4 fill-white" />
              <span>{hero.ctaPrimaryText}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onLaunchDemo}
              className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Play className="h-4 w-4 text-primary-600 dark:text-primary-400 fill-primary-600 dark:fill-primary-400" />
              <span>{hero.ctaSecondaryText}</span>
            </button>
          </div>

          {/* Micro badges below CTA */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500 stroke-[3]" /> Tanpa Perlu Kartu Kredit
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500 stroke-[3]" /> Setup Cepat 2 Menit
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500 stroke-[3]" /> Bantuan Migrasi Data Excel Gratis
            </span>
          </div>
        </div>

        {/* Live Metrics Showcase */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs text-center">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">1.450+</div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Toko HP & Gadget Aktif</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs text-center">
            <div className="text-2xl sm:text-3xl font-black text-primary-600 dark:text-primary-400">4.800.000+</div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Unit IMEI Terverifikasi</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">Rp 180M+</div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Omset Diproses / Bulan</div>
          </div>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xs text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-500">99.98%</div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Uptime Cloud SLA</div>
          </div>
        </div>

        {/* INTERACTIVE PRODUCT PREVIEW SHOWCASE */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-slate-900 text-white p-2 sm:p-4 shadow-2xl border border-slate-800 relative overflow-hidden">
            
            {/* Window Top Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="ml-3 px-3 py-1 rounded-lg bg-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 border border-slate-700/60">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  https://app.nexuspos.id/outlet-pusat/pos
                </div>
              </div>

              {/* Showcase Mode Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("pos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === "pos" ? "bg-primary-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Kasir & Scan IMEI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("service")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === "service" ? "bg-primary-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Antrean Servis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("imei")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === "imei" ? "bg-primary-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Repeat className="h-3.5 w-3.5" />
                  <span>Tukar Tambah</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("multioutlet")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewTab === "multioutlet" ? "bg-primary-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Store className="h-3.5 w-3.5" />
                  <span>Multi Cabang</span>
                </button>
              </div>
            </div>

            {/* Showcase Screen Body */}
            <div className="p-3 sm:p-6 bg-slate-950/70 rounded-2xl mt-2 border border-slate-800/60 min-h-[380px]">
              {activePreviewTab === "pos" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Left Simulated Product Catalog */}
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                        <Barcode className="h-4 w-4 text-primary-400" />
                        <span>Barcode / IMEI Scanner Siap:</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold rounded-md">
                        AUTO-DETECT ON
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary-500/50 transition-colors">
                        <div className="text-xs font-bold text-white">iPhone 15 Pro Max</div>
                        <div className="text-[10px] text-slate-400">256GB Natural Titanium (Baru)</div>
                        <div className="mt-2 text-xs font-extrabold text-primary-400">Rp 21.499.000</div>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> 8 IMEI Tersedia
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary-500/50 transition-colors">
                        <div className="text-xs font-bold text-white">Samsung S24 Ultra</div>
                        <div className="text-[10px] text-slate-400">512GB Titanium Gray (Baru)</div>
                        <div className="mt-2 text-xs font-extrabold text-primary-400">Rp 19.999.000</div>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> 4 IMEI Tersedia
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary-500/50 transition-colors">
                        <div className="text-xs font-bold text-white">iPhone 13 128GB</div>
                        <div className="text-[10px] text-amber-400 font-semibold">Grade A Second (Mulus 98%)</div>
                        <div className="mt-2 text-xs font-extrabold text-amber-400">Rp 8.750.000</div>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> IMEI: 356891029381023
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-primary-500/50 transition-colors">
                        <div className="text-xs font-bold text-white">Adapter 20W USB-C</div>
                        <div className="text-[10px] text-slate-400">Original Box Accessories</div>
                        <div className="mt-2 text-xs font-extrabold text-primary-400">Rp 399.000</div>
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                          Stok: 45 Pcs
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Simulated Cart & Checkout */}
                  <div className="md:col-span-5 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="text-xs font-bold text-white">Keranjang Kasir #INV-2026-0041</div>
                        <span className="text-[10px] text-slate-400">Kasir: Rian</span>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>iPhone 15 Pro Max 256GB</span>
                            <span>Rp 21.499.000</span>
                          </div>
                          <div className="text-[10px] font-mono text-emerald-400 mt-1">
                            IMEI: 358920192837192 (Garansi Resmi 1 Thn)
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>Adapter 20W Fast Charge</span>
                            <span>Rp 399.000</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Metode Bayar:</span>
                        <span className="text-white font-bold">Split (QRIS + Tunai)</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-white">
                        <span>Total Transaksi:</span>
                        <span className="text-emerald-400 text-base">Rp 21.898.000</span>
                      </div>
                      <button 
                        onClick={onLaunchDemo} 
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Selesaikan & Cetak Struk Bluetooth</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === "service" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-sm font-bold text-white">Papan Antrean & Status Servis Live</div>
                      <div className="text-xs text-slate-400">Kirim update progres perbaikan otomatis ke WhatsApp pelanggan</div>
                    </div>
                    <span className="px-2.5 py-1 bg-primary-950 text-primary-300 border border-primary-800 text-xs font-bold rounded-lg">
                      3 Unit Dalam Pengerjaan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-800/40">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-slate-400">SRV/2026/089</span>
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold">DIAGNOSA</span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-white">iPhone 13 Pro (Budi Santoso)</div>
                      <div className="text-[11px] text-slate-400 mt-1">Keluhan: Layar White Screen (WSOD)</div>
                      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                        <span>Teknisi: Agus</span>
                        <span className="text-amber-400 font-bold">Est: Rp 450.000</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-primary-800/40">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-slate-400">SRV/2026/088</span>
                        <span className="px-2 py-0.5 rounded bg-primary-950 text-primary-300 font-bold">GANTI SPAREPART</span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-white">Samsung S22 (Dewi Lestari)</div>
                      <div className="text-[11px] text-slate-400 mt-1">Ganti Baterai Original 3700mAh</div>
                      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                        <span>Teknisi: Hendra</span>
                        <span className="text-emerald-400 font-bold">Est: Rp 380.000</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-800/40">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-slate-400">SRV/2026/087</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">SIAP DIAMBIL</span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-white">iPad Air 5 (Kevin Pratama)</div>
                      <div className="text-[11px] text-slate-400 mt-1">Ganti Port Charging USB-C (Selesai QC)</div>
                      <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                        <span className="text-emerald-400 font-semibold">WA Terkirim</span>
                        <span className="text-emerald-400 font-bold">Lunas Rp 550.000</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === "imei" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Repeat className="h-4 w-4 text-amber-400" />
                      <span>Form Inspeksi & Kalkulator Trade-In</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Unit Masuk:</span>
                        <div className="font-bold text-slate-200">iPhone 12 128GB Black</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400">Kesehatan Baterai (BH):</span>
                          <div className="font-bold text-amber-400">84% (Grade B+)</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Kondisi Fisik:</span>
                          <div className="font-bold text-slate-200">Lecet Pemakaian Halus</div>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Harga Beli Rekomendasi Sistem:</div>
                        <div className="text-lg font-black text-amber-400">Rp 5.200.000</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-white">Otomasi Alur Tukar Tambah</div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Otomatis potong harga transaksi kasir unit baru.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Unit bekas langsung terdaftar di stok inventori dengan status <strong>BEKAS - Grade B+</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Cetak kwitansi buyback resmi dengan tanda tangan digital pelanggan.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activePreviewTab === "multioutlet" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-sm font-bold text-white">Monitoring Multi-Outlet & Gudang Terpusat</div>
                      <div className="text-xs text-slate-400">Kirim mutasi stok antar cabang dengan verifikasi nomor resi & IMEI</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold rounded-lg">
                      3 Outlet Online
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">Outlet Pusat (Roxy Mas)</div>
                      <div className="text-[11px] text-slate-400 mt-1">Stok: 342 Unit HP | 1200 Aksesoris</div>
                      <div className="mt-2 text-[10px] text-emerald-400 font-bold">Omset Hari Ini: Rp 42.500.000</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">Cabang 1 (Kelapa Gading)</div>
                      <div className="text-[11px] text-slate-400 mt-1">Stok: 128 Unit HP | 450 Aksesoris</div>
                      <div className="mt-2 text-[10px] text-emerald-400 font-bold">Omset Hari Ini: Rp 18.200.000</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-bold text-white">Cabang 2 (ITC Cempaka Mas)</div>
                      <div className="text-[11px] text-slate-400 mt-1">Stok: 95 Unit HP | 310 Aksesoris</div>
                      <div className="mt-2 text-[10px] text-emerald-400 font-bold">Omset Hari Ini: Rp 14.850.000</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Interactive Banner in Showcase */}
            <div className="mt-3 px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Live Interactive Architecture — Terhubung ke Cloud Firestore & Offline LocalStorage
              </span>
              <button
                type="button"
                onClick={onLaunchDemo}
                className="text-primary-400 hover:text-primary-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Buka Versi Lengkap Applet</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
