import React, { useState } from "react";
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Store, 
  User, 
  Phone, 
  MapPin, 
  Layers, 
  ShieldCheck,
  Zap
} from "lucide-react";

import { useLanguage } from "../../contexts/LanguageContext";

interface LandingRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string;
  onRegisterSuccess: (storeData: {
    ownerName: string;
    storeName: string;
    phone: string;
    city: string;
    plan: string;
  }) => void;
}

export const LandingRegisterModal: React.FC<LandingRegisterModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onRegisterSuccess
}) => {
  const { t } = useLanguage();
  const [ownerName, setOwnerName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [branchCount, setBranchCount] = useState("1");
  const [plan, setPlan] = useState(selectedPlan || "PRO");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        onRegisterSuccess({
          ownerName: ownerName || "Owner Nexus",
          storeName: storeName || "Nexus Phone Store",
          phone,
          city,
          plan
        });
      }, 1200);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden my-8">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Pendaftaran Uji Coba Berhasil!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
              Akun tenant toko <strong className="text-primary-600 dark:text-primary-400">{storeName || "Toko Anda"}</strong> telah siap. Anda dialihkan langsung ke dashboard kasir...
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 pt-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Menyiapkan Database & Demo Toko
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Mulai Uji Coba Gratis 14 Hari
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dapatkan akses penuh seluruh fitur POS, IMEI & Service Center
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
              
              {/* Form Owner & Store */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Lengkap Anda:
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Budi Santoso"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Toko / Konter Gadget:
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Galaxy Phone Store"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor WhatsApp Aktif:
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kota / Lokasi:
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Jakarta / Surabaya / Medan..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Branch count & Plan selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Jumlah Cabang:
                  </label>
                  <select
                    value={branchCount}
                    onChange={(e) => setBranchCount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="1">1 Cabang (Tunggal)</option>
                    <option value="2-3">2 - 3 Cabang</option>
                    <option value="4+">4+ Cabang / Jaringan Ritel</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Pilihan Paket SaaS:
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="STARTER">Starter Gadget (Rp 149rb/bln)</option>
                    <option value="PRO">Pro Retail Growth (Rp 299rb/bln - Populer)</option>
                    <option value="ENTERPRISE">Enterprise Multi-Store (Rp 599rb/bln)</option>
                  </select>
                </div>
              </div>

              {/* Guarantee text */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Uji coba gratis 14 hari penuh. Tanpa kartu kredit & data Anda aman terenkripsi.</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-primary-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Menyiapkan Akun Toko...</span>
                ) : (
                  <>
                    <span>Aktifkan Uji Coba Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
