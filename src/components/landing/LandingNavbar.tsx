import React, { useState, useEffect } from "react";
import { 
  Smartphone, 
  ArrowRight, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogIn, 
  Store,
  Sparkles
} from "lucide-react";
import NexusPosLogo from "../NexusPosLogo";
import { useLanguage, LanguageSwitchButton } from "../../contexts/LanguageContext";

interface LandingNavbarProps {
  onOpenLogin: () => void;
  onOpenRegister: (plan?: string) => void;
  onLaunchDemo?: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenLogin,
  onOpenRegister,
  onLaunchDemo,
  darkMode,
  onToggleDarkMode,
  isLoggedIn = false,
  onGoToDashboard
}) => {
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-xs border-b border-slate-200/60 dark:border-slate-800/60 py-3.5" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer select-none group" 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <NexusPosLogo className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
              NexusPOS
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wide bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-md border border-blue-200/60 dark:border-blue-800/60">
              Cloud
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links (Clean 4 Core Items) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button 
            type="button"
            onClick={() => scrollToSection("features")} 
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            {t("Fitur")}
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection("hardware")} 
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            {t("Hardware POS")}
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection("pricing")} 
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            {t("Harga")}
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection("faq")} 
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            {t("FAQ")}
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Global Language Switcher */}
          <LanguageSwitchButton variant="pill" />

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={darkMode ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap"}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Store className="h-4 w-4" />
              <span>{t("Buka POS Kasir")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              {/* Clean Sign In Link */}
              <button
                type="button"
                onClick={onOpenLogin}
                className="hidden sm:inline-flex px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors items-center gap-1.5 cursor-pointer"
              >
                <span>{t("Masuk")}</span>
              </button>

              {/* Primary Free Trial Pill CTA */}
              <button
                type="button"
                onClick={() => onOpenRegister("PRO")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <span>{t("Coba Gratis")}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-2 shadow-2xl mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <button 
            type="button"
            onClick={() => scrollToSection("features")} 
            className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t("Fitur Utama")}
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection("hardware")} 
            className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t("Hardware POS")}
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection("pricing")} 
            className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t("Harga Paket")}
          </button>
          <button 
            type="button"
            onClick={() => scrollToSection("faq")} 
            className="w-full text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {t("FAQ")}
          </button>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLogin();
              }}
              className="w-full py-2.5 text-center text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t("Masuk ke Akun")}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegister("PRO");
              }}
              className="w-full py-2.5 text-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-colors"
            >
              {t("Mulai Coba Gratis 14 Hari")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
