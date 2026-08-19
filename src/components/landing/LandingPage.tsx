import React, { useState, useEffect } from "react";
import { ArrowUp, ChevronUp } from "lucide-react";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingAdvantages } from "./LandingAdvantages";
import { LandingFeatures } from "./LandingFeatures";
import { LandingInteractiveDemo } from "./LandingInteractiveDemo";
import { LandingHardware } from "./LandingHardware";
import { LandingPricing } from "./LandingPricing";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingFAQ } from "./LandingFAQ";
import { LandingFooter } from "./LandingFooter";
import { LandingRegisterModal } from "./LandingRegisterModal";
import { useLanguage } from "../../contexts/LanguageContext";

interface LandingPageProps {
  onOpenLogin: () => void;
  onLaunchDemo: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onRegisterSuccess?: (storeData: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onLaunchDemo,
  darkMode,
  onToggleDarkMode,
  onRegisterSuccess
}) => {
  const { language } = useLanguage();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("PRO");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 350) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleOpenRegister = (plan: string = "PRO") => {
    setSelectedPlan(plan);
    setRegisterModalOpen(true);
  };

  const handleRegisterSuccess = (storeData: any) => {
    setRegisterModalOpen(false);
    if (onRegisterSuccess) {
      onRegisterSuccess(storeData);
    } else {
      onLaunchDemo();
    }
  };

  return (
    <div key={language} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-200 relative">
      {/* 1. Header Navigation */}
      <LandingNavbar
        onOpenLogin={onOpenLogin}
        onOpenRegister={handleOpenRegister}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onLaunchDemo={onLaunchDemo}
      />

      {/* 2. Hero Section with Live Showcase */}
      <LandingHero
        onOpenRegister={handleOpenRegister}
        onLaunchDemo={onLaunchDemo}
      />

      {/* 3. Key Advantages (Kelebihan Eksklusif) */}
      <LandingAdvantages
        onOpenRegister={handleOpenRegister}
      />

      {/* 4. Deep-Dive Feature Tabs */}
      <LandingFeatures
        onOpenRegister={handleOpenRegister}
        onLaunchDemo={onLaunchDemo}
      />

      {/* 5. Interactive Live Sandbox (IMEI Search, Trade-in Calculator, Ticket Lookup) */}
      <LandingInteractiveDemo
        onOpenRegister={handleOpenRegister}
        onLaunchFullApp={onLaunchDemo}
      />

      {/* 6. Hardware & Device Ecosystem Compatibility */}
      <LandingHardware />

      {/* 7. SaaS Pricing Plans & ROI Calculator */}
      <LandingPricing
        onOpenRegister={handleOpenRegister}
      />

      {/* 8. Customer Testimonials & Social Proof */}
      <LandingTestimonials />

      {/* 9. FAQ Accordion */}
      <LandingFAQ />

      {/* 10. Footer */}
      <LandingFooter
        onOpenLogin={onOpenLogin}
        onOpenRegister={handleOpenRegister}
        onLaunchDemo={onLaunchDemo}
      />

      {/* Floating Scroll to Top Button (Right Bottom Corner) */}
      <div 
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          showScrollTop 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          className="p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 border border-blue-400/30 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group cursor-pointer"
          title="Kembali ke Atas"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      {/* Free Trial Registration Modal */}
      <LandingRegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        selectedPlan={selectedPlan}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </div>
  );
};
