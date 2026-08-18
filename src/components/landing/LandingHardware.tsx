import React from "react";
import { 
  Printer, 
  Barcode, 
  Tablet, 
  Laptop, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Wifi, 
  Bluetooth, 
  Usb,
  Cpu
} from "lucide-react";

export const LandingHardware: React.FC = () => {
  const hardwareList = [
    {
      icon: <Printer className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
      title: "Printer Struk Bluetooth & USB",
      description: "Kompatibel dengan segala merek printer thermal 58mm & 80mm (Iware, Panda, Eppos, Sunmi, Xprinter, Epson, Zijiang, dll). Cetak cepat tanpa driver rumit.",
      tags: ["Bluetooth ESC/POS", "USB Direct", "Auto Cut Struk"]
    },
    {
      icon: <Barcode className="h-6 w-6 text-indigo-500" />,
      title: "Barcode Scanner 1D & 2D QR",
      description: "Dukungan scanner barcode wireless Bluetooth/2.4Ghz, scanner USB kabel, hingga scanner kamera smartphone untuk scan nomor IMEI kotak HP secara instan.",
      tags: ["Scan Dus IMEI Cepat", "2D QR Code Scanner", "Kamera Ponsel"]
    },
    {
      icon: <Tablet className="h-6 w-6 text-amber-500" />,
      title: "Android Tablet & iPad Ready",
      description: "Tampilan layar kasir responsif & nyaman dioperasikan di tablet Android 10 inci, iPad, maupun mesin POS All-in-One layar sentuh (Sunmi T2, iMin, Telpo).",
      tags: ["Touchscreen Optimal", "Fluid UI Layout", "Katalog Gambar HD"]
    },
    {
      icon: <Laptop className="h-6 w-6 text-emerald-500" />,
      title: "Komputer PC, Laptop & Mac",
      description: "Akses tanpa perlu instalasi rumit. Cukup buka browser (Google Chrome, Edge, Safari) di laptop atau PC kasir Anda untuk mulai berjualan.",
      tags: ["Semua OS Didukung", "Ringan & Cepat", "Zero Maintenance"]
    },
    {
      icon: <CreditCard className="h-6 w-6 text-cyan-500" />,
      title: "Integrasi QRIS & Mesin EDC",
      description: "Mendukung pembayaran non-tunai QRIS statis & dinamis (BCA, Mandiri, BRI, GoPay, OVO, Dana) serta pencatatan settlement transaksi EDC kartu debit/kredit.",
      tags: ["QRIS Multi-Bank", "Split Payment EDC", "Rekap Settlement"]
    },
    {
      icon: <Layers className="h-6 w-6 text-rose-500" />,
      title: "Laci Uang Kasir (Cash Drawer)",
      description: "Terhubung otomatis via port RJ-11 printer thermal. Laci kasir akan membuka otomatis setiap kali transaksi tunai selesai diproses kasir.",
      tags: ["Auto-Open RJ11", "Keamanan Kasir", "Audit Selisih Kas"]
    }
  ];

  return (
    <section id="hardware" className="py-20 lg:py-28 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold tracking-wider uppercase border border-emerald-200 dark:border-emerald-800">
            <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekosistem Hardware Terbuka</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Gunakan Perangkat Hardware yang Sudah Anda Miliki
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Tidak ada keharusan membeli hardware proprietary berharga mahal. NexusPOS dapat langsung dipasangkan dengan printer, scanner, dan tablet yang sudah tersedia di toko Anda.
          </p>
        </div>

        {/* 6 Grid Hardware */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hardwareList.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-all hover:shadow-lg group"
            >
              <div className="p-3 w-fit rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {item.title}
              </h3>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                {item.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
