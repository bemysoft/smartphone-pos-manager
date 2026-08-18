import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  Sparkles, 
  ArrowRight, 
  Menu, 
  X, 
  ShieldCheck, 
  Layers, 
  CreditCard, 
  HelpCircle, 
  Store,
  ChevronDown,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  LogIn,
  UserPlus
} from "lucide-react";
import NexusPosLogo from "../NexusPosLogo";

interface LandingNavbarProps {
  onOpenLogin: () => void;
  onOpenRegister: (plan?: string) => void;
  onLaunchDemo: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isLoggedIn: boolean;
  onGoToDashboard: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenLogin,
  onOpenRegister,
  onLaunchDemo,
  darkMode,
  onToggleDarkMode,
  isLoggedIn,
  onGoToDashboard
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-slate-800/80 py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="p-2 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-xl text-white shadow-md shadow-primary-600/20 flex items-center justify-center">
            <NexusPosLogo className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">NexusPOS</span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 rounded-md border border-primary-200/60 dark:border-primary-800/60">
                SaaS
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block -mt-0.5">
              Smartphone & Retail POS Ecosystem
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button 
            onClick={() => scrollToSection("advantages")} 
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            Kelebihan
          </button>
          <button 
            onClick={() => scrollToSection("features")} 
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            Fitur Utama
          </button>
          <button 
            onClick={() => scrollToSection("interactive-demo")} 
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1"
          >
            <Sparkles className="h-3 w-3 text-amber-500" />
            Live Demo
          </button>
          <button 
            onClick={() => scrollToSection("hardware")} 
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            Hardware & Perangkat
          </button>
          <button 
            onClick={() => scrollToSection("pricing")} 
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            Harga & Paket
          </button>
          <button 
            onClick={() => scrollToSection("testimonials")} 
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            Testimoni
          </button>
          <button 
            onClick={() => scrollToSection("faq")} 
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={darkMode ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap"}
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Store className="h-4 w-4" />
              <span>Buka POS Kasir</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenLogin}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-primary-600 dark:text-slate-200 dark:hover:text-primary-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Masuk Akun</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenRegister("PRO")}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Coba Gratis 14 Hari</span>
              </button>
            </>
          )}

          {/* Mobile menu hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 mt-2 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-1">
            <button 
              onClick={() => scrollToSection("advantages")} 
              className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Kelebihan & Keunggulan
            </button>
            <button 
              onClick={() => scrollToSection("features")} 
              className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Fitur Lengkap
            </button>
            <button 
              onClick={() => scrollToSection("interactive-demo")} 
              className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Live Simulation Demo</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">Interactive</span>
            </button>
            <button 
              onClick={() => scrollToSection("hardware")} 
              className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hardware & Printer Bluetooth
            </button>
            <button 
              onClick={() => scrollToSection("pricing")} 
              className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Harga & SaaS Plan
            </button>
            <button 
              onClick={() => scrollToSection("testimonials")} 
              className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Testimoni Toko Gadget
            </button>
            <button 
              onClick={() => scrollToSection("faq")} 
              className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              FAQ (Tanya Jawab)
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Store className="h-4 w-4" />
                <span>Buka POS Kasir Utama</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Masuk Akun Pengguna</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenRegister("PRO");
                  }}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Mulai Uji Coba Gratis 14 Hari</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
