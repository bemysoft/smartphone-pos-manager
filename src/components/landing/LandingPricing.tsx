import React, { useState } from "react";
import { 
  Check, 
  Sparkles, 
  ArrowRight, 
  Calculator,
  X
} from "lucide-react";
import { useLandingContent } from "../../lib/landingContent";

interface LandingPricingProps {
  onOpenRegister: (plan: string) => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onOpenRegister }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const landingContent = useLandingContent();
  const pricingData = landingContent.pricing;
  const plans = pricingData.plans || [];

  // ROI Calculator State
  const [storeCount, setStoreCount] = useState<number>(2);
  const [monthlyUnits, setMonthlyUnits] = useState<number>(120);

  // Calculated ROI savings
  const calculateHoursSaved = () => storeCount * 28; // ~28 hours per store saved on inventory & cashier admin
  const calculateStockLeakagePrevented = () => Math.round(monthlyUnits * 35000); // Estimasi Rp 35.000/unit dicegah dari selisih IMEI/stok
  const calculateMonthlyCost = () => (storeCount <= 1 ? 149000 : storeCount <= 3 ? 299000 : 599000);

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold tracking-wider uppercase border border-blue-200 dark:border-blue-800">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Investasi Transparan</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {pricingData.title}
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {pricingData.subtitle}
          </p>

          {/* Billing Switcher Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isAnnual
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Bayar Bulanan
            </button>

            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAnnual
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600"
              }`}
            >
              <span>Bayar Tahunan</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] tracking-tight animate-pulse">
                {pricingData.annualDiscountBadge || "HEMAT 20%"}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all relative ${
                  plan.popular
                    ? "bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-2xl scale-100 lg:scale-105 z-10"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md">
                    ⭐ PALING DIREKOMENDASIKAN
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {plan.badge}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {plan.tagline}
                  </p>

                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-slate-500">Rp</span>
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {Number(price).toLocaleString("id-ID")}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ bulan</span>
                    </div>
                    {isAnnual && (
                      <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        Ditagih tahunan (Hemat Rp {((plan.monthlyPrice - plan.annualPrice) * 12).toLocaleString("id-ID")}/thn)
                      </div>
                    )}
                  </div>

                  {/* Feature check list */}
                  <div className="mt-6 space-y-2.5 text-xs">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fitur Termasuk:</div>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {feat}
                        </span>
                      </div>
                    ))}

                    {plan.missing && plan.missing.length > 0 && (
                      <div className="pt-2 space-y-1.5 opacity-50">
                        {plan.missing.map((mis, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-slate-400 line-through">
                            <X className="h-3 w-3 shrink-0" />
                            <span>{mis}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenRegister(plan.id)}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25"
                        : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{plan.ctaText || `Mulai Uji Coba Paket ${plan.name}`}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Gratis 14 hari, batalkan kapan saja
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* INTERACTIVE ROI & PROFIT SAVINGS CALCULATOR */}
        <div className="mt-16 max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Calculator className="h-4 w-4" />
            <span>Kalkulator Proyeksi Penghematan & ROI</span>
          </div>

          <h3 className="text-2xl font-black tracking-tight mt-2 text-white">
            Hitung Berapa Keuntungan & Efisiensi Toko Anda
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Simulasikan estimasi waktu dan biaya kebocoran stok HP yang berhasil diselamatkan dengan otomatisasi NexusPOS.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Jumlah Gerai / Cabang Toko:</span>
                  <span className="text-amber-400 font-extrabold text-sm">{storeCount} Toko</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={storeCount}
                  onChange={(e) => setStoreCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Penjualan Unit HP / Bulan:</span>
                  <span className="text-blue-400 font-extrabold text-sm">{monthlyUnits} Unit / Toko</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={monthlyUnits}
                  onChange={(e) => setMonthlyUnits(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waktu Admin Hemat</div>
                  <div className="text-xl font-black text-amber-400 mt-0.5">{calculateHoursSaved()} Jam / Bln</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selisih Stok Dicegah</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">Rp {calculateStockLeakagePrevented().toLocaleString("id-ID")}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Biaya Software NexusPOS</div>
                  <div className="text-sm font-bold text-slate-300">Rp {calculateMonthlyCost().toLocaleString("id-ID")} / bln</div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenRegister("PRO")}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Coba Gratis 14 Hari
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
