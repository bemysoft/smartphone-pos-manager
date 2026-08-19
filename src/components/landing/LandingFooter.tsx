import React from "react";
import { 
  Smartphone, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowUp
} from "lucide-react";
import { useLandingContent } from "../../lib/landingContent";
import { useLanguage } from "../../contexts/LanguageContext";

interface LandingFooterProps {
  onOpenLogin: () => void;
  onOpenRegister: (plan?: string) => void;
  onLaunchDemo: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onOpenLogin,
  onOpenRegister,
  onLaunchDemo
}) => {
  const { t } = useLanguage();
  const landingContent = useLandingContent();
  const brand = landingContent.brand;
  const hero = landingContent.hero;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
      
      {/* Top CTA Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Siap Menghilangkan Masalah Selisih Stok IMEI Selamanya?
            </h3>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Bergabunglah dengan ribuan pengusaha toko smartphone di seluruh Indonesia yang telah beralih ke {brand.brandName}.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenRegister("PRO")}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {hero.ctaPrimaryText}
            </button>
            <button
              type="button"
              onClick={onLaunchDemo}
              className="px-5 py-3.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl border border-blue-400/40 transition-colors cursor-pointer"
            >
              {hero.ctaSecondaryText}
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white">
                  {brand.brandName}
                </span>
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-widest -mt-1">
                  {brand.tagline}
                </span>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
              Sistem kasir POS, pelacakan dual-IMEI, service center tiket teknisi, dan kalkulator tukar tambah paling komprehensif di Indonesia.
            </p>

            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-2 text-[11px]">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-slate-300">256-Bit SSL Enkripsi Cloud</span>
              </div>
            </div>
          </div>

          {/* Col 2: Fitur */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Modul Aplikasi</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-blue-400 transition-colors">POS Kasir & Barcode Scan</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Pelacakan Dual-IMEI</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Manajemen Tiket Servis</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Kalkulator Tukar Tambah</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Mutasi Multi-Cabang</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Laporan Laba/Rugi & HPP</a></li>
            </ul>
          </div>

          {/* Col 3: Solusi Bisnis */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Solusi Industri</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Toko Gadget & HP Baru</span></li>
              <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Spesialis Jual Beli HP Second</span></li>
              <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Service Center & Sparepart</span></li>
              <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Grosir & Distributor Gadget</span></li>
              <li><span className="hover:text-blue-400 transition-colors cursor-pointer">Toko Aksesoris & Audio</span></li>
            </ul>
          </div>

          {/* Col 4: Kontak & Bantuan */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Kontak & Support</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{brand.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{brand.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                <span>+{brand.contactWhatsapp}</span>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 text-center transition-colors cursor-pointer"
              >
                Masuk ke Portal Toko
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright & back to top */}
        <div className="mt-14 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-500">
            {brand.copyrightText || `© ${new Date().getFullYear()} NexusPOS SaaS Platform. Seluruh hak cipta dilindungi undang-undang.`}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Kembali ke Atas</span>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

    </footer>
  );
};
