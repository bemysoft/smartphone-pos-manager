import React, { useState } from "react";
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
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("PRO");

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-primary-500 selection:text-white transition-colors duration-200">
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
