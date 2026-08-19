import React, { useState } from "react";
import { 
  Sparkles, 
  Smartphone, 
  Search, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Repeat, 
  Wrench, 
  ArrowRight, 
  Check, 
  Clock, 
  Tag,
  Zap,
  Play,
  RotateCcw
} from "lucide-react";

import { useLanguage } from "../../contexts/LanguageContext";

interface LandingInteractiveDemoProps {
  onOpenRegister: (plan?: string) => void;
  onLaunchFullApp: () => void;
}

export const LandingInteractiveDemo: React.FC<LandingInteractiveDemoProps> = ({
  onOpenRegister,
  onLaunchFullApp
}) => {
  const { t } = useLanguage();
  const [activeSandbox, setActiveSandbox] = useState<"imei" | "tradein" | "service">("imei");

  // IMEI Sandbox State
  const [imeiInput, setImeiInput] = useState("358920192837192");
  const [imeiResult, setImeiResult] = useState<any>({
    imei: "358920192837192",
    product: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
    type: "BARU (Resmi iBox Indonesia)",
    status: "TERSEDIA DI ETALASE",
    outlet: "Outlet Pusat - Roxy Mas (Rak Display A1)",
    costPrice: "Rp 18.900.000",
    sellingPrice: "Rp 21.499.000",
    warranty: "Garansi Aktif s/d 17 Agustus 2027",
    supplier: "PT Erajaya Swasembada Tbk"
  });

  const handleSearchImei = (val: string) => {
    setImeiInput(val);
    if (val.includes("3589")) {
      setImeiResult({
        imei: val,
        product: "Apple iPhone 15 Pro Max 256GB Natural Titanium",
        type: "BARU (Resmi iBox Indonesia)",
        status: "TERSEDIA DI ETALASE",
        outlet: "Outlet Pusat - Roxy Mas (Rak Display A1)",
        costPrice: "Rp 18.900.000",
        sellingPrice: "Rp 21.499.000",
        warranty: "Garansi Aktif s/d 17 Agustus 2027",
        supplier: "PT Erajaya Swasembada Tbk"
      });
    } else if (val.includes("8649")) {
      setImeiResult({
        imei: val,
        product: "Samsung Galaxy S24 Ultra 512GB Titanium Black",
        type: "BARU (SEIN Indonesia)",
        status: "TERJUAL KE BUDI SANTOSO (#INV-098)",
        outlet: "Cabang 1 - Kelapa Gading",
        costPrice: "Rp 17.500.000",
        sellingPrice: "Rp 19.999.000",
        warranty: "Garansi Resmi SEIN s/d 12 Des 2026",
        supplier: "Samsung Electronics Indonesia"
      });
    } else {
      setImeiResult({
        imei: val,
        product: "Apple iPhone 13 128GB Midnight Blue",
        type: "BEKAS (Grade A Mulus 98%)",
        status: "HASIL TUKAR TAMBAH (#BB-042)",
        outlet: "Outlet Pusat - Roxy Mas (Etalase Second)",
        costPrice: "Rp 7.200.000",
        sellingPrice: "Rp 8.650.000",
        warranty: "Garansi Toko 1 Bulan (s/d 17 Sept 2026)",
        supplier: "Trade-in Pelanggan (Kevin)"
      });
    }
  };

  // Trade-In Sandbox State
  const [selectedDevice, setSelectedDevice] = useState("iPhone 12 128GB");
  const [batteryHealth, setBatteryHealth] = useState(86);
  const [conditionGrade, setConditionGrade] = useState<"A" | "B" | "C">("B");
  const [hasBox, setHasBox] = useState(true);

  const calculateTradeInPrice = () => {
    let base = 5000000;
    if (selectedDevice.includes("14")) base = 8500000;
    if (selectedDevice.includes("13")) base = 7000000;
    if (selectedDevice.includes("12")) base = 5200000;
    if (selectedDevice.includes("11")) base = 3800000;
    if (selectedDevice.includes("S22")) base = 5800000;

    let gradeFactor = conditionGrade === "A" ? 1.05 : conditionGrade === "B" ? 0.95 : 0.85;
    let bhFactor = batteryHealth >= 85 ? 1 : 0.92;
    let boxBonus = hasBox ? 250000 : 0;

    return Math.round((base * gradeFactor * bhFactor + boxBonus) / 10000) * 10000;
  };

  // Service Sandbox State
  const [srvSearch, setSrvSearch] = useState("SRV/2026/0041");

  return (
    <section id="interactive-demo" className="py-20 lg:py-28 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-extrabold tracking-wider uppercase border border-amber-200 dark:border-amber-800">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t("Interactive Live Sandbox")}</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t("Coba Langsung Simulasi Fitur Unggulan NexusPOS")}
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {t("Rasakan kemudahan verifikasi data IMEI, kalkulasi tukar tambah otomatis, dan tracking status servis langsung di browser Anda.")}
          </p>
        </div>

        {/* Sandbox Navigation */}
        <div className="mt-10 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSandbox("imei")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeSandbox === "imei"
                ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>{t("Cek & Lacak IMEI")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSandbox("tradein")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeSandbox === "tradein"
                ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            <Repeat className="h-4 w-4" />
            <span>{t("Kalkulator Tukar Tambah")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSandbox("service")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
              activeSandbox === "service"
                ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-600/20"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>{t("Lacak Tiket Servis")}</span>
          </button>
        </div>

        {/* Sandbox Content Container */}
        <div className="mt-8 max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          
          {/* 1. IMEI Sandbox */}
          {activeSandbox === "imei" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pencarian & Pelacakan IMEI Instan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ketik nomor IMEI 15-digit atau klik sampel contoh di bawah:</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Sampel:</span>
                  <button 
                    onClick={() => handleSearchImei("358920192837192")}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-mono rounded cursor-pointer"
                  >
                    iPhone 15 PM
                  </button>
                  <button 
                    onClick={() => handleSearchImei("864920182736451")}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-mono rounded cursor-pointer"
                  >
                    S24 Ultra
                  </button>
                  <button 
                    onClick={() => handleSearchImei("356891029381023")}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-mono rounded cursor-pointer"
                  >
                    iPhone 13 2nd
                  </button>
                </div>
              </div>

              {/* Input bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={imeiInput}
                    onChange={(e) => handleSearchImei(e.target.value)}
                    placeholder="Masukkan 15-digit nomor IMEI..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchImei(imeiInput)}
                  className="px-4 py-2.5 bg-primary-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Lacak Unit
                </button>
              </div>

              {/* Result Card */}
              {imeiResult && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{imeiResult.type}</span>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{imeiResult.product}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs rounded-lg border border-emerald-300 dark:border-emerald-800">
                      {imeiResult.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Posisi Fisik Stok:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{imeiResult.outlet}</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Harga Modal (HPP):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{imeiResult.costPrice}</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Harga Jual Kasir:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{imeiResult.sellingPrice}</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block">Status Garansi:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{imeiResult.warranty}</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block">Asal Pasokan (Supplier):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{imeiResult.supplier}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Trade-in Sandbox */}
          {activeSandbox === "tradein" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kalkulator Taksiran Harga Trade-In (Buyback)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Uji simulasi grading kondisi fisik untuk mendapatkan estimasi nilai tukar tambah yang aman.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pilih Model Handphone Bekas:</label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium"
                  >
                    <option value="iPhone 14 128GB">iPhone 14 128GB</option>
                    <option value="iPhone 13 128GB">iPhone 13 128GB</option>
                    <option value="iPhone 12 128GB">iPhone 12 128GB</option>
                    <option value="iPhone 11 128GB">iPhone 11 128GB</option>
                    <option value="Samsung Galaxy S22 256GB">Samsung Galaxy S22 256GB</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kesehatan Baterai (BH): <span className="text-primary-600 dark:text-primary-400 font-extrabold">{batteryHealth}%</span>
                  </label>
                  <input
                    type="range"
                    min="70"
                    max="100"
                    value={batteryHealth}
                    onChange={(e) => setBatteryHealth(Number(e.target.value))}
                    className="w-full accent-primary-600 mt-2"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Grade Kondisi Fisik:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setConditionGrade("A")}
                      className={`p-2 rounded-lg font-bold border text-center cursor-pointer transition-all ${
                        conditionGrade === "A" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      Grade A (98-99%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConditionGrade("B")}
                      className={`p-2 rounded-lg font-bold border text-center cursor-pointer transition-all ${
                        conditionGrade === "B" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      Grade B (90-95%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConditionGrade("C")}
                      className={`p-2 rounded-lg font-bold border text-center cursor-pointer transition-all ${
                        conditionGrade === "C" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      Grade C (Lecet/Minus)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-box"
                    checked={hasBox}
                    onChange={(e) => setHasBox(e.target.checked)}
                    className="h-4 w-4 accent-primary-600 rounded"
                  />
                  <label htmlFor="chk-box" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Kelengkapan Fullset Box & Kabel Asli (+Rp 250.000)
                  </label>
                </div>
              </div>

              {/* Taksiran Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary-500/10 to-emerald-500/10 border border-amber-300/80 dark:border-amber-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Rekomendasi Harga Beli Kasir:</span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Rp {calculateTradeInPrice().toLocaleString("id-ID")}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Otomatis potong harga kasir unit baru & terdaftar di stok bekas.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLaunchFullApp}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer active:scale-95"
                >
                  Buka Modul Trade-In Penuh
                </button>
              </div>
            </div>
          )}

          {/* 3. Service Sandbox */}
          {activeSandbox === "service" && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pusat Antrean Tiket Servis Teknisi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tracking langkah perbaikan unit pelanggan secara transparan.</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono text-primary-600 dark:text-primary-400 font-bold">#SRV-2026-0041</span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Apple iPhone 13 Pro (Layar Blank Putih)</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 font-bold rounded-lg border border-primary-300">
                    TAHAP: GANTI JUMPER & LCD
                  </span>
                </div>

                {/* Progress Steps Timeline */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mt-1">1. Diterima Kasir</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block mt-1">2. Diagnosa</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary-600 text-white border border-primary-600 text-center shadow-sm">
                    <Clock className="h-4 w-4 text-white mx-auto animate-spin" />
                    <span className="text-[10px] font-bold block mt-1">3. Pengerjaan</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center opacity-60">
                    <div className="h-4 w-4 rounded-full border-2 border-slate-400 mx-auto" />
                    <span className="text-[10px] font-medium text-slate-500 block mt-1">4. QC & Siap Ambil</span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Teknisi Bertanggung Jawab:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Agus Hendrawan (Komisi: Rp 85.000)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Estimasi Biaya Servis:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">Rp 450.000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
