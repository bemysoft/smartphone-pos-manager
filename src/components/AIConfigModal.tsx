import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from "react";
import { X, ShieldAlert, Sparkles, Key, Globe, Eye, EyeOff, Save, Check, RefreshCw, ShieldCheck, AlertCircle, Activity } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export interface AIConfig {
  provider: "gemini" | "openai_compatible";
  baseUrl: string;
  apiKey: string;
  model: string;
  imageModel: string;
}

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: AIConfig) => void;
}

export default function AIConfigModal({ isOpen, onClose, onSave }: AIConfigModalProps) {
  const { t } = useLanguage();
  const [config, setConfig] = useState<AIConfig>({
    provider: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    apiKey: "",
    model: "gemini-3.5-flash",
    imageModel: "gemini-3.1-flash-lite-image",
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Connection testing states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiFetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customConfig: config }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.response || "Koneksi berhasil terhubung!",
          latency: data.latency,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Gagal menghubungi API. Silakan periksa kunci dan endpoint Anda.",
        });
      }
    } catch (err: any) {
      console.error(err);
      setTestResult({
        success: false,
        message: err.message || "Gagal tersambung ke server lokal.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem("fonepos_ai_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          setConfig({
            provider: parsed.provider || "gemini",
            baseUrl: parsed.baseUrl || "https://generativelanguage.googleapis.com",
            apiKey: parsed.apiKey || "",
            model: parsed.model || "gemini-3.5-flash",
            imageModel: parsed.imageModel || "gemini-3.1-flash-lite-image",
          });
        } else {
          // Attempt to load from server's current state as fallback
          apiFetch("/api/ai/config")
            .then((res) => res.json())
            .then((data) => {
              if (data) {
                setConfig({
                  provider: data.provider || "gemini",
                  baseUrl: data.baseUrl || "https://generativelanguage.googleapis.com",
                  apiKey: data.apiKey || "",
                  model: data.model || "gemini-3.5-flash",
                  imageModel: data.imageModel || "gemini-3.1-flash-lite-image",
                });
              }
            })
            .catch((err) => console.error("Error loading server AI config:", err));
        }
      } catch (err) {
        console.error("Gagal membaca konfigurasi AI dari localStorage:", err);
      }
    }
  }, [isOpen]);

  const handleProviderChange = (provider: "gemini" | "openai_compatible") => {
    if (provider === "gemini") {
      setConfig({
        provider: "gemini",
        baseUrl: "https://generativelanguage.googleapis.com",
        apiKey: config.apiKey, // keep existing key if any
        model: "gemini-3.5-flash",
        imageModel: "gemini-3.1-flash-lite-image",
      });
    } else {
      setConfig({
        provider: "openai_compatible",
        baseUrl: "https://api.openai.com/v1",
        apiKey: config.apiKey,
        model: "gpt-4o",
        imageModel: "dall-e-3",
      });
    }
  };

  const handlePresetSelect = (presetName: string) => {
    if (presetName === "deepseek") {
      setConfig({
        provider: "openai_compatible",
        baseUrl: "https://api.deepseek.com/v1",
        apiKey: "",
        model: "deepseek-chat",
        imageModel: "dall-e-3", // default to dalled-3 or placeholder
      });
    } else if (presetName === "openrouter") {
      setConfig({
        provider: "openai_compatible",
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey: "",
        model: "google/gemini-2.5-flash",
        imageModel: "dall-e-3",
      });
    } else if (presetName === "openai") {
      setConfig({
        provider: "openai_compatible",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "",
        model: "gpt-4o-mini",
        imageModel: "dall-e-3",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Save to localStorage as requested
      localStorage.setItem("fonepos_ai_config", JSON.stringify(config));

      // Also save to server DB for full synchronization
      const res = await apiFetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      await res.json();

      setSaveSuccess(true);
      if (onSave) {
        onSave(config);
      }
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Gagal menyimpan konfigurasi AI:", err);
      alert("Terjadi kesalahan saat menyinkronkan dengan server. Konfigurasi lokal tetap disimpan.");
      // Even if server sync fails, allow local storage save to be successful
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Konfigurasi AI Assistant</h3>
              <p className="text-xs text-slate-400">Sesuaikan endpoint, model, dan API Key Anda</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Provider API</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleProviderChange("gemini")}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  config.provider === "gemini"
                    ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-xs border border-slate-200/50 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                Google Gemini API
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("openai_compatible")}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  config.provider === "openai_compatible"
                    ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-xs border border-slate-200/50 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                OpenAI / Compatible
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons for OpenAI Compatible */}
          {config.provider === "openai_compatible" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Preset Cepat</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePresetSelect("deepseek")}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/40 dark:border-slate-700 transition-all cursor-pointer"
                >
                  DeepSeek API
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect("openrouter")}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/40 dark:border-slate-700 transition-all cursor-pointer"
                >
                  OpenRouter
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect("openai")}
                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/40 dark:border-slate-700 transition-all cursor-pointer"
                >
                  Official OpenAI
                </button>
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Key className="h-3.5 w-3.5 text-slate-400" />
                API Key / Token Rahasia
              </label>
              <span className="text-[10px] text-primary-500 font-semibold">Tersimpan di Lokal</span>
            </div>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={config.apiKey || ""}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder={
                  config.provider === "gemini" 
                    ? "Masukkan GEMINI_API_KEY Anda (atau biarkan kosong untuk server default)" 
                    : "Masukkan API Key / Token Penyedia"
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-3 pr-10 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-mono outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Base URL Endpoint */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              API Base URL
            </label>
            <input
              type="text"
              value={config.baseUrl || ""}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="Contoh: https://api.openai.com/v1 atau https://generativelanguage.googleapis.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-mono outline-hidden"
              required
            />
          </div>

          {/* Model Selections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Model Text / Chat
              </label>
              {config.provider === "gemini" ? (
                <select
                  value={config.model || "gemini-3.5-flash"}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-hidden font-mono"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Tercepat)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Kompatibel)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Sangat Cerdas)</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={config.model || ""}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder="Contoh: deepseek-chat, gpt-4o"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-mono outline-hidden"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Model Poster Image
              </label>
              {config.provider === "gemini" ? (
                <select
                  value={config.imageModel || "gemini-3.1-flash-lite-image"}
                  onChange={(e) => setConfig({ ...config, imageModel: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-hidden font-mono"
                >
                  <option value="gemini-3.1-flash-lite-image">gemini-3.1-flash-lite-image</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Fallback)</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={config.imageModel || ""}
                  onChange={(e) => setConfig({ ...config, imageModel: e.target.value })}
                  placeholder="Contoh: dall-e-3"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 font-mono outline-hidden"
                  required
                />
              )}
            </div>
          </div>

          <div className="flex gap-2 p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl text-[11px] text-amber-700 dark:text-amber-300">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>
              <strong>Keterangan Keamanan:</strong> Seluruh API Key dan Token Anda disimpan secara lokal di <strong>localStorage</strong> browser ini dan tidak terekspos secara publik. Koneksi akan diteruskan secara aman via backend proxy.
            </span>
          </div>

          {/* Test connection result display */}
          {testResult && (
            <div className={`p-3.5 border rounded-2xl flex gap-2.5 text-xs ${
              testResult.success 
                ? "bg-green-50/70 border-green-200/60 text-green-800 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-300"
                : "bg-red-50/70 border-red-200/60 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-300"
            }`}>
              {testResult.success ? (
                <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{testResult.success ? "Koneksi Sukses!" : "Koneksi Gagal"}</span>
                  {testResult.latency !== undefined && (
                    <span className="text-[10px] bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-0.5">
                      <Activity className="h-2.5 w-2.5" />
                      {testResult.latency} ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className="mr-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Menguji...</span>
                </>
              ) : (
                <>
                  <Activity className="h-3.5 w-3.5 text-primary-500" />
                  <span>Test Koneksi</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none hover:shadow-primary-500/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-300" />
                  <span>Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Konfigurasi</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
