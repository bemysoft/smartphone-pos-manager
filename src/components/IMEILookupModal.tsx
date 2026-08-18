import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Smartphone, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  User, 
  Receipt, 
  Wrench, 
  Copy, 
  CheckCircle2, 
  Printer, 
  ExternalLink,
  Tag,
  Calendar,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { Product, Transaction, Buyback } from "../types";

interface IMEILookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  transactions: Transaction[];
  buybacks: Buyback[];
  warranties?: any[];
}

export default function IMEILookupModal({
  isOpen,
  onClose,
  products,
  transactions,
  buybacks,
  warranties = []
}: IMEILookupModalProps) {
  const [searchImei, setSearchImei] = useState("");
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const rawImei = searchImei.trim();
  const containsNonDigits = /[^\d]/.test(rawImei);
  const isValid15Digits = /^\d{15}$/.test(rawImei);

  const query = rawImei.toLowerCase();

  // Find matching records across modules
  const matchingProducts = query
    ? products.filter(p => p.imeis?.some(i => i.toLowerCase().includes(query)))
    : [];

  const matchingTransactions = query
    ? transactions.filter(t => t.items?.some(item => item.imei?.toLowerCase().includes(query)))
    : [];

  const matchingBuybacks = query
    ? buybacks.filter(b => b.customerImei?.toLowerCase().includes(query))
    : [];

  const matchingWarranties = query
    ? warranties.filter(w => w.imei?.toLowerCase().includes(query))
    : [];

  const handleInputChange = (val: string) => {
    setSearchImei(val);
    setValidationError(null);
    setSearched(true);
  };

  const handleSanitizeImei = () => {
    const cleaned = searchImei.replace(/\D/g, "").slice(0, 15);
    setSearchImei(cleaned);
    setValidationError(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawImei.length > 0 && (!isValid15Digits || containsNonDigits)) {
      setValidationError(`Nomor IMEI tidak valid! IMEI standar harus terdiri dari tepat 15 digit angka (saat ini ${rawImei.length}/15 digit).`);
      setSearched(true);
      return;
    }
    setValidationError(null);
    setSearched(true);
  };

  const totalFound = 
    matchingProducts.length + 
    matchingTransactions.length + 
    matchingBuybacks.length + 
    matchingWarranties.length;

  const handleCopySummary = () => {
    const text = `--- HASIL AUDIT IMEI: ${searchImei} ---\n` +
      `Hasil Ditemukan: ${totalFound} Rekaman\n` +
      `Stok Aktif: ${matchingProducts.length > 0 ? matchingProducts.map(p => `${p.brand} ${p.model} (${p.type})`).join(', ') : 'Tidak ada di stok'}\n` +
      `Penjualan: ${matchingTransactions.length > 0 ? matchingTransactions.map(t => `${t.id} (${t.customerName})`).join(', ') : 'Belum pernah dijual'}\n` +
      `Buyback: ${matchingBuybacks.length > 0 ? 'Pernah di-buyback' : 'Tidak ada riwayat buyback'}\n` +
      `Garansi: ${matchingWarranties.length > 0 ? 'Ada tiket garansi/service' : 'Tidak ada klaim garansi'}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-primary-600 text-white rounded-xl shadow-md">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                Pencarian IMEI & Lacak Garansi Global
              </h2>
              <p className="text-xs text-slate-400">
                Lacak status stok, riwayat penjualan, klaim garansi, dan buyback unit HP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchImei}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Masukkan Nomor IMEI (15 digit angka, misal: 352147108924351)"
                maxLength={20}
                className={`w-full pl-10 pr-24 py-3 bg-white dark:bg-slate-900 border rounded-2xl text-xs sm:text-sm font-semibold font-mono text-slate-800 dark:text-slate-100 focus:outline-none shadow-xs transition-all ${
                  rawImei.length > 0 && (!isValid15Digits || containsNonDigits)
                    ? "border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    : rawImei.length > 0 && isValid15Digits
                    ? "border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                }`}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                  isValid15Digits && !containsNonDigits
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : rawImei.length > 0
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {rawImei.length}/15
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-primary-600/20 cursor-pointer shrink-0"
            >
              Cari IMEI
            </button>
          </form>

          {/* Validation Status & Assistant Banner */}
          {rawImei.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {containsNonDigits ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 px-2.5 py-1 rounded-lg">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Karakter Non-Angka Dideteksi (Hanya angka 0-9 diperbolehkan)
                  </span>
                ) : isValid15Digits ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/30 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Format IMEI Valid (Tepat 15 Digit Angka)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/30 px-2.5 py-1 rounded-lg">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Format Belum Sesuai ({rawImei.length} dari 15 digit)
                  </span>
                )}
              </div>

              {containsNonDigits || rawImei.length > 15 ? (
                <button
                  type="button"
                  onClick={handleSanitizeImei}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Bersihkan Karakter (Ambil 15 Angka)
                </button>
              ) : null}
            </div>
          )}

          {validationError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Quick Preset / Demo Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Contoh Cepat:</span>
            {products.flatMap(p => p.imeis || []).slice(0, 3).map((im, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchImei(im);
                  setValidationError(null);
                  setSearched(true);
                }}
                className="text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-500 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              >
                {im}
              </button>
            ))}
          </div>
        </div>

        {/* Results Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {!searched || !query ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Smartphone className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">
                Ketik nomor IMEI di kolom pencarian untuk melihat riwayat lengkap perangkat.
              </p>
            </div>
          ) : totalFound === 0 ? (
            <div className="text-center py-10 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl space-y-2 p-6">
              <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
              <h4 className="text-sm font-extrabold text-rose-800 dark:text-rose-300">
                IMEI Tidak Ditemukan
              </h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                Nomor IMEI "<span className="font-mono font-bold">{searchImei}</span>" belum terdaftar di sistem inventaris, riwayat transaksi, maupun klaim garansi toko Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Banner */}
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                      IMEI Terdaftar Dalam Sistem
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Ditemukan {totalFound} entri terkait nomor IMEI ini.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Tersalin!" : "Salin Info"}
                </button>
              </div>

              {/* 1. Active Stock Status */}
              {matchingProducts.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-primary-600" />
                    Status Inventaris Aktif (Ready Stock)
                  </h4>
                  {matchingProducts.map((p) => (
                    <div key={p.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          {p.brand} {p.model}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${p.type === 'BARU' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                          UNIT {p.type} {p.condition && p.condition !== '-' ? `(Grade ${p.condition})` : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                        <div>Harga Beli: <span className="font-bold text-slate-800 dark:text-slate-200">Rp {(p.priceBuy ?? 0).toLocaleString("id-ID")}</span></div>
                        <div>Harga Jual: <span className="font-bold text-primary-600 dark:text-primary-400">Rp {(p.priceSell ?? 0).toLocaleString("id-ID")}</span></div>
                        <div>Lokasi: <span className="font-bold text-slate-800 dark:text-slate-200">{p.location || "Etalase Utm"}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Sales History */}
              {matchingTransactions.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    Riwayat Penjualan (Nota/Faktur)
                  </h4>
                  {matchingTransactions.map((t) => (
                    <div key={t.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold font-mono text-primary-600 dark:text-primary-400">
                          {t.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(t.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          Pelanggan: <span className="font-bold">{t.customerName}</span> ({t.customerPhone})
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                          Total Faktur: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Rp {(t.totalAmount ?? 0).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                        <span>Kasir: <strong className="text-slate-700 dark:text-slate-300">{t.cashierName}</strong></span>
                        <span>Metode: <strong className="text-slate-700 dark:text-slate-300">{t.paymentMethod}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Buyback History */}
              {matchingBuybacks.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-amber-600" />
                    Riwayat Trade-In / Buyback HP Bekas
                  </h4>
                  {matchingBuybacks.map((b) => (
                    <div key={b.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          {b.brand} {b.model} (Grade {b.condition})
                        </span>
                        <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md font-bold">
                          Faktur Buyback: {b.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex justify-between">
                        <span>Harga Beli Toko: <strong className="text-slate-800 dark:text-slate-200">Rp {(b.priceBuy ?? 0).toLocaleString("id-ID")}</strong></span>
                        <span>Penjual: <strong className="text-slate-800 dark:text-slate-200">{b.customerName}</strong></span>
                      </div>
                      {b.notes && (
                        <p className="text-[11px] italic text-slate-500 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl">
                          Catatan Kondisi: "{b.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Warranty & Service Records */}
              {matchingWarranties.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-purple-600" />
                    Tiket Servis & Klaim Garansi Toko
                  </h4>
                  {matchingWarranties.map((w, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                          Tiket Servis #{w.ticketNo || w.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${w.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                          {w.status || "PROSES REPARASI"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Kerusakan: <strong>{w.issue || w.description || "Perbaikan umum"}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Tutup Window
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
