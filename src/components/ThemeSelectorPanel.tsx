import React, { useState, useEffect } from "react";
import { Palette, Check, RefreshCw, Sparkles, Sliders } from "lucide-react";
import { THEME_PRESETS, applyAppTheme } from "../lib/theme";

export default function ThemeSelectorPanel({ compact = false }: { compact?: boolean }) {
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem("app_theme_color") || "blue";
  });
  
  const [customHex, setCustomHex] = useState<string>(() => {
    return localStorage.getItem("app_theme_custom_hex") || "#2563eb";
  });

  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    return localStorage.getItem("app_theme_color") === "custom";
  });

  useEffect(() => {
    const syncThemeFromStorage = () => {
      const savedTheme = localStorage.getItem("app_theme_color") || "blue";
      setActiveTheme(savedTheme);
      setIsCustomMode(savedTheme === "custom");
      const savedHex = localStorage.getItem("app_theme_custom_hex");
      if (savedHex) setCustomHex(savedHex);
    };

    window.addEventListener("themechange", syncThemeFromStorage);
    return () => window.removeEventListener("themechange", syncThemeFromStorage);
  }, []);

  const handleSelectPreset = (themeId: string) => {
    setActiveTheme(themeId);
    setIsCustomMode(false);
    applyAppTheme(themeId);
  };

  const handleApplyCustomHex = (hexValue: string) => {
    setCustomHex(hexValue);
    if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
      setActiveTheme("custom");
      setIsCustomMode(true);
      applyAppTheme("custom", hexValue);
    }
  };

  const handleResetToDefault = () => {
    setActiveTheme("blue");
    setIsCustomMode(false);
    setCustomHex("#2563eb");
    applyAppTheme("blue");
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-xl">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Warna Utama Tema Aplikasi
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ubah CSS variable warna utama (primary) secara instan di seluruh komponen.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetToDefault}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          title="Reset ke Biru Standar"
        >
          <RefreshCw className="h-3 w-3" />
          Reset Default
        </button>
      </div>

      {/* Preset Swatches Grid */}
      <div className="space-y-2">
        <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
          Pilihan Warna Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {THEME_PRESETS.map((preset) => {
            const isSelected = !isCustomMode && activeTheme === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary-600 bg-primary-50/60 dark:bg-primary-950/30 text-slate-900 dark:text-white shadow-xs font-bold ring-2 ring-primary-600/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white/20 flex items-center justify-center"
                  style={{ backgroundColor: preset.colorHex }}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="text-[11px] font-semibold truncate leading-tight flex-1">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker Section */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-primary-600" />
            Warna Custom (HEX Picker)
          </label>
          {isCustomMode && (
            <span className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Custom Hex Aktif
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center shrink-0">
            <input
              type="color"
              value={customHex}
              onChange={(e) => handleApplyCustomHex(e.target.value)}
              className="w-10 h-10 rounded-xl border-0 p-0 cursor-pointer overflow-hidden bg-transparent shadow-xs"
              title="Pilih Warna Kustom"
            />
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={customHex}
              onChange={(e) => handleApplyCustomHex(e.target.value)}
              placeholder="#2563eb"
              maxLength={7}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary-500"
            />
          </div>

          <button
            type="button"
            onClick={() => handleApplyCustomHex(customHex)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer shrink-0"
          >
            Terapkan
          </button>
        </div>
      </div>

      {/* Live Sample Component Preview */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
          Pratinjau Komponen Tema
        </span>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <button type="button" className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold shadow-xs">
            Tombol Utama
          </button>
          <span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/40 rounded-lg text-[10px] font-extrabold">
            Badge Utama
          </span>
          <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400 underline decoration-2">
            Teks Warna Akses
          </span>
        </div>
      </div>
    </div>
  );
}
