import React, { useState } from "react";
import { 
  ShoppingCart, 
  Boxes, 
  Wrench, 
  Repeat, 
  BarChart3, 
  MessageSquare, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  Printer, 
  Receipt, 
  ShieldCheck, 
  Users, 
  Zap, 
  Barcode,
  Layers,
  FileSpreadsheet,
  Tag,
  CreditCard
} from "lucide-react";

import { useLanguage } from "../../contexts/LanguageContext";

interface LandingFeaturesProps {
  onOpenRegister: (plan?: string) => void;
  onLaunchDemo: () => void;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({
  onOpenRegister,
  onLaunchDemo
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<number>(0);

  const featureTabs = [
    {
      id: "pos",
      name: "Kasir POS Cepat",
      icon: <ShoppingCart className="h-4 w-4" />,
      tag: "Transaksi Kilat",
      title: "Kasir Modern Khusus Gadget dengan Input IMEI Instan",
      description: "Proses transaksi dalam hitungan detik. Dukungan scan barcode fisik atau kamera ponsel, split payment pembayaran ganda, dan diskon promosi otomatis.",
      points: [
        "Pencarian produk via Barcode, SKU, Nama, atau scan nomor IMEI langsung",
        "Split payment fleksibel: Bayar sebagian Tunai + sisa via QRIS/Debit/Transfer",
        "Cetak struk ke printer thermal Bluetooth (58mm/80mm) atau share via WhatsApp",
        "Pencatatan kas kasir (Opening/Closing Cash Float) dan deteksi selisih uang kasir"
      ],
      badge: "Kecepatan 3x Lebih Cepat",
      previewData: {
        type: "pos",
        items: [
          { name: "Samsung Galaxy S24+", imei: "354920192847192", price: "Rp 16.999.000", qty: 1 },
          { name: "Tempered Glass KingKong", imei: "NON-IMEI", price: "Rp 95.000", qty: 1 }
        ],
        total: "Rp 17.094.000",
        payment: "QRIS BCA (Rp 10.000.000) + Tunai (Rp 7.094.000)"
      }
    },
    {
      id: "inventory",
      name: "Inventori & IMEI",
      icon: <Boxes className="h-4 w-4" />,
      tag: "Anti-Selisih Stok",
      title: "Manajemen Siklus Hidup IMEI & Audit Opname Akurat",
      description: "Ketahui secara presisi posisi setiap unit handphone di gudang atau etalase toko. Terhindar dari duplikasi nomor seri dan kehilangan unit berharga mahal.",
      points: [
        "Validasi nomor IMEI ganda saat penerimaan barang masuk dari supplier",
        "Generator SKU otomatis berdasarkan brand, model, warna, dan grade kondisi",
        "Fitur Stock Opname berbasis Barcode Scanner untuk audit stok bulanan cepat",
        "Peringatan stok kritis (Low Stock Alert) otomatis ketika stok menipis"
      ],
      badge: "100% Validasi IMEI",
      previewData: {
        type: "inventory",
        stats: [
          { label: "Total Unit HP Ready", val: "482 Unit" },
          { label: "Unit Bekas Terdaftar", val: "94 Unit" },
          { label: "Aksesoris & Sparepart", val: "1.820 Pcs" },
          { label: "Alert Stok Kritis", val: "3 Item" }
        ]
      }
    },
    {
      id: "service",
      name: "Modul Servis & Teknisi",
      icon: <Wrench className="h-4 w-4" />,
      tag: "Service Center",
      title: "Kelola Tiket Servis, Sparepart & Komisi Teknisi",
      description: "Tingkatkan reputasi profesional konter servis Anda. Pantau estimasi biaya, progres pengerjaan, pemakaian sparepart, dan kirim update status otomatis ke WhatsApp pelanggan.",
      points: [
        "Cetak tanda terima servis ber-QR Code untuk verifikasi saat pengambilan unit",
        "Tracking status transparan: Antrean → Diagnosa → Sparepart → QC → Selesai",
        "Pemotongan stok suku cadang (LCD, Baterai, Flexible, IC) otomatis dari gudang",
        "Kalkulasi komisi dan bagi hasil teknisi transparan per nomor tiket servis"
      ],
      badge: "Otomasi WhatsApp",
      previewData: {
        type: "service",
        tickets: [
          { id: "SRV-092", device: "iPhone 11", problem: "Ganti LCD OLED", status: "QC SELESAI", tech: "Agus" },
          { id: "SRV-093", device: "Oppo Reno 8", problem: "Mati Total / IC Power", status: "PENGERJAAN", tech: "Rian" },
          { id: "SRV-094", device: "Xiaomi Note 12", problem: "Ganti Baterai Original", status: "MENUNGGU PART", tech: "Doni" }
        ]
      }
    },
    {
      id: "tradein",
      name: "Tukar Tambah & Buyback",
      icon: <Repeat className="h-4 w-4" />,
      tag: "Trade-In Pintar",
      title: "Inspeksi & Taksiran Harga Beli HP Bekas Otomatis",
      description: "Menangkan persaingan dengan menyediakan layanan tukar tambah yang aman, transparan, dan tidak bikin rugi toko karena salah taksir harga bekas.",
      points: [
        "Checklist inspeksi fisik & fungsi: Layar, Baterai (BH), Kamera, FaceID/Fingerprint",
        "Pengelompokan grade otomatis (Grade A / B / C / Minus / Matot)",
        "Otomatis memotong nilai belanja unit baru di kasir dalam transaksi yang sama",
        "Kuitansi buyback resmi dengan tanda tangan digital & identitas KTP pelanggan"
      ],
      badge: "Form Inspeksi 12-Titik",
      previewData: {
        type: "tradein",
        demo: {
          phone: "iPhone 12 Pro 128GB Pacific Blue",
          batteryHealth: "85% (Grade B)",
          physical: "Mulus 95%, Box Lengkap",
          estimatedBuyback: "Rp 6.800.000",
          appliedTo: "Potongan iPhone 15 Pro Baru"
        }
      }
    },
    {
      id: "analytics",
      name: "Laporan & Laba Rugi",
      icon: <BarChart3 className="h-4 w-4" />,
      tag: "Finansial Real-Time",
      title: "Analisis Laba Kotor, HPP & Kinerja Penjualan Toko",
      description: "Ketahui performa finansial toko Anda secara real-time tanpa perlu rumus Excel rumit. Pantau margin per produk, omset per cabang, dan komisi tim sales.",
      points: [
        "Laporan Laba/Rugi komprehensif: Pendapatan, HPP Aktual, Diskon, & Margin Bersih",
        "Analisis perputaran produk (Fast vs Slow Moving) untuk efisiensi modal stok",
        "Laporan performa kasir & sales untuk pemberian insentif komisi penjualan",
        "Ekspor data lengkap ke format Excel (.XLSX) dan PDF laporan keuangan formal"
      ],
      badge: "Laporan HPP Akurat",
      previewData: {
        type: "analytics",
        metrics: [
          { title: "Omset Penjualan", val: "Rp 142.800.000", growth: "+18.4%" },
          { title: "Laba Kotor (Gross)", val: "Rp 24.650.000", growth: "+21.2%" },
          { title: "Margin Rata-rata", val: "17.2%", growth: "+2.1%" },
          { title: "Unit Terjual", val: "68 Unit HP", growth: "+12 Unit" }
        ]
      }
    },
    {
      id: "crm",
      name: "WhatsApp CRM & Struk",
      icon: <MessageSquare className="h-4 w-4" />,
      tag: "Retensi Pelanggan",
      title: "Kirim Struk Digital & Broadcast Promosi Otomatis",
      description: "Bangun relasi jangka panjang dengan pembeli. Simpan database kontak pelanggan, kirim reminder garansi, serta blast promo tukar tambah langsung ke WhatsApp.",
      points: [
        "Kirim nota/struk kasir digital berformat rapi langsung ke nomor WhatsApp pembeli",
        "Template pesan otomatis untuk pengingat servis selesai & masa garansi",
        "Database pelanggan lengkap dengan riwayat seluruh transaksi dan unit HP yang dibeli",
        "Sistem loyalty poin pelanggan dan kupon diskon member setia"
      ],
      badge: "WhatsApp Direct",
      previewData: {
        type: "crm",
        waMessage: {
          to: "0812-8921-xxxx (Budi Santoso)",
          text: "Halo Kak Budi, terima kasih telah berbelanja di Nexus Gadget! Berikut nota digital #INV-2026-0041 untuk iPhone 15 Pro Max (IMEI: 358920192837192). Garansi toko aktif s/d 17 Agustus 2027. Simpan nota ini sebagai bukti garansi resmi Anda."
        }
      }
    }
  ];

  const currentTab = featureTabs[activeTab];

  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold tracking-wider uppercase border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Fitur Lengkap Terintegrasi</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Segala Hal yang Dibutuhkan untuk Mengelola Toko Gadget Modern
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Eksplorasi modul-modul canggih yang dirancang spesifik untuk alur kerja toko smartphone, aksesoris, hingga service center terpadu.
          </p>
        </div>

        {/* Tab Selection Bar */}
        <div className="mt-12 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar">
          {featureTabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
                activeTab === idx
                  ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20 scale-105"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="mt-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Description Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-200 dark:border-primary-800">
                <span>{currentTab.tag}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                <span>{currentTab.badge}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {currentTab.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentTab.description}
              </p>

              <div className="space-y-3 pt-2">
                {currentTab.points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                      {pt}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenRegister("PRO")}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <span>Coba Fitur Ini Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onLaunchDemo}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Simulasikan di Demo
                </button>
              </div>
            </div>

            {/* Right Interactive Preview Card */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-slate-950 text-white p-5 sm:p-6 border border-slate-800 shadow-2xl space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-slate-300 font-bold">PREVIEW MODUL // {currentTab.name.toUpperCase()}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">LIVE ENGINE</span>
                </div>

                {/* Specific dynamic preview content per tab */}
                {currentTab.id === "pos" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Item Transaksi Aktif:</div>
                      {currentTab.previewData.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-950 border border-slate-800">
                          <div>
                            <div className="font-bold text-slate-200">{it.name}</div>
                            <div className="text-[10px] text-emerald-400 font-mono">SN/IMEI: {it.imei}</div>
                          </div>
                          <div className="font-bold text-primary-400">{it.price}</div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-primary-950/40 border border-primary-800/60 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Metode Pembayaran:</div>
                        <div className="font-bold text-white">{currentTab.previewData.payment}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">Total:</div>
                        <div className="text-base font-extrabold text-emerald-400">{currentTab.previewData.total}</div>
                      </div>
                    </div>
                  </div>
                )}

                {currentTab.id === "inventory" && (
                  <div className="grid grid-cols-2 gap-3">
                    {currentTab.previewData.stats?.map((st: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-center">
                        <div className="text-lg sm:text-xl font-black text-white">{st.val}</div>
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">{st.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {currentTab.id === "service" && (
                  <div className="space-y-2">
                    {currentTab.previewData.tickets?.map((tk: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-white">{tk.id} - {tk.device}</div>
                          <div className="text-[10px] text-slate-400">{tk.problem}</div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-primary-950 text-primary-300 border border-primary-800 text-[10px] font-bold block">
                            {tk.status}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Teknisi: {tk.tech}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentTab.id === "tradein" && (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Unit Masuk:</span>
                      <span className="font-bold text-white">{currentTab.previewData.demo?.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Kondisi & Baterai:</span>
                      <span className="font-bold text-amber-400">{currentTab.previewData.demo?.batteryHealth}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Kelengkapan:</span>
                      <span className="text-slate-200">{currentTab.previewData.demo?.physical}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-lg flex justify-between items-center">
                      <span className="font-bold text-emerald-300">Nilai Taksiran Trade-In:</span>
                      <span className="text-base font-black text-emerald-400">{currentTab.previewData.demo?.estimatedBuyback}</span>
                    </div>
                  </div>
                )}

                {currentTab.id === "analytics" && (
                  <div className="grid grid-cols-2 gap-3">
                    {currentTab.previewData.metrics?.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="text-[10px] text-slate-400">{m.title}</div>
                        <div className="text-base font-bold text-white mt-1">{m.val}</div>
                        <div className="text-[10px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
                          <span>{m.growth}</span> vs bln lalu
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentTab.id === "crm" && (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp Notifikasi Otomatis</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Tujuan: {currentTab.previewData.waMessage?.to}</div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-slate-300 leading-relaxed text-[11px] font-sans">
                      {currentTab.previewData.waMessage?.text}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
