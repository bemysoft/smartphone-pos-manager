import React, { useState, useEffect } from "react";
import { X, CheckCircle, ShoppingCart, ScanLine, Printer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function QuickStartGuide() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only if the user hasn't dismissed it before
    const hasSeenGuide = localStorage.getItem("fonepos_quickstart_seen");
    if (!hasSeenGuide) {
      // Delay showing it slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("fonepos_quickstart_seen", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 text-white relative">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-extrabold mb-1">Selamat Datang di FonePOS! 🎉</h2>
              <p className="text-primary-100 text-sm">Sistem Kasir Pintar & Pelacakan IMEI Otomatis</p>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Berikut adalah panduan cepat untuk memulai menggunakan FonePOS di toko Anda:
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary-100 p-2.5 rounded-xl text-primary-600 shrink-0">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">1. Scan IMEI & Cari Produk</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Cukup klik pada kolom "Cari produk atau scan barcode..." di menu <b>POS</b>, lalu gunakan barcode scanner untuk memindai IMEI HP. Produk akan otomatis masuk ke keranjang.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">2. Proses Pembayaran</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Setelah produk masuk ke keranjang, klik <b>"Proses Pembayaran"</b>. FonePOS mendukung Tukar Tambah (Trade-in), Cash, dan QRIS.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shrink-0">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">3. Cetak Struk Otomatis</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Masuk ke tab <b>Konfigurasi Printer</b> untuk menyesuaikan layout, pesan, dan fitur <i>Auto-Print</i> struk via Bluetooth thermal.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer flex justify-center items-center gap-2 shadow-md"
              >
                <CheckCircle className="h-4.5 w-4.5" />
                Saya Mengerti, Mulai Gunakan!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
