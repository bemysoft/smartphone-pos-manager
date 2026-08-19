import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Save, 
  RefreshCw, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ExternalLink,
  Smartphone,
  CreditCard,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  Percent,
  Check,
  X
} from "lucide-react";
import { 
  LandingContentConfig, 
  DEFAULT_LANDING_CONTENT, 
  getStoredLandingContent, 
  fetchServerLandingContent, 
  saveServerLandingContent,
  PricingPlanConfig,
  FAQItemConfig,
  TestimonialItemConfig
} from "../lib/landingContent";
import { useLanguage } from "../contexts/LanguageContext";

interface LandingPageEditorProps {
  onPreviewLanding?: () => void;
}

export default function LandingPageEditor({ onPreviewLanding }: LandingPageEditorProps) {
  const { t } = useLanguage();
  const [config, setConfig] = useState<LandingContentConfig>(DEFAULT_LANDING_CONTENT);
  const [activeTab, setActiveTab] = useState<"HERO" | "PRICING" | "TESTIMONIALS" | "FAQ" | "BRAND">("PRICING");
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const local = getStoredLandingContent();
    setConfig(local);
    fetchServerLandingContent().then((serverData) => {
      if (serverData) setConfig(serverData);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveServerLandingContent(config);
      setSaveToast({ type: "success", message: res.message });
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err: any) {
      setSaveToast({ type: "error", message: "Gagal menyimpan perubahan ke server." });
      setTimeout(() => setSaveToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Apakah Anda yakin ingin mengembalikan semua teks landing page ke teks standar bawaan pabrik?")) {
      setConfig(DEFAULT_LANDING_CONTENT);
      saveServerLandingContent(DEFAULT_LANDING_CONTENT);
      setSaveToast({ type: "success", message: "Semua teks landing page dikembalikan ke standar bawaan." });
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  // Pricing Plan Helpers
  const handleUpdatePlan = (index: number, updated: Partial<PricingPlanConfig>) => {
    const newPlans = [...config.pricing.plans];
    newPlans[index] = { ...newPlans[index], ...updated };
    setConfig({
      ...config,
      pricing: {
        ...config.pricing,
        plans: newPlans
      }
    });
  };

  const handleAddPlanFeature = (planIndex: number) => {
    const newPlans = [...config.pricing.plans];
    newPlans[planIndex].features.push("Fitur baru");
    setConfig({
      ...config,
      pricing: {
        ...config.pricing,
        plans: newPlans
      }
    });
  };

  const handleRemovePlanFeature = (planIndex: number, featureIndex: number) => {
    const newPlans = [...config.pricing.plans];
    newPlans[planIndex].features.splice(featureIndex, 1);
    setConfig({
      ...config,
      pricing: {
        ...config.pricing,
        plans: newPlans
      }
    });
  };

  const handleUpdatePlanFeature = (planIndex: number, featureIndex: number, value: string) => {
    const newPlans = [...config.pricing.plans];
    newPlans[planIndex].features[featureIndex] = value;
    setConfig({
      ...config,
      pricing: {
        ...config.pricing,
        plans: newPlans
      }
    });
  };

  // Testimonial Helpers
  const handleAddTestimonial = () => {
    setConfig({
      ...config,
      testimonials: {
        ...config.testimonials,
        items: [
          ...config.testimonials.items,
          {
            name: "Nama Pemilik Toko",
            role: "Owner, Toko HP",
            location: "Jakarta",
            content: "Pengalaman menggunakan aplikasi ini sangat membantu operasional harian toko.",
            stats: "Omset Naik 30%",
            rating: 5
          }
        ]
      }
    });
  };

  const handleRemoveTestimonial = (index: number) => {
    const newItems = [...config.testimonials.items];
    newItems.splice(index, 1);
    setConfig({
      ...config,
      testimonials: {
        ...config.testimonials,
        items: newItems
      }
    });
  };

  const handleUpdateTestimonial = (index: number, updated: Partial<TestimonialItemConfig>) => {
    const newItems = [...config.testimonials.items];
    newItems[index] = { ...newItems[index], ...updated };
    setConfig({
      ...config,
      testimonials: {
        ...config.testimonials,
        items: newItems
      }
    });
  };

  // FAQ Helpers
  const handleAddFaq = () => {
    setConfig({
      ...config,
      faq: {
        ...config.faq,
        items: [
          ...config.faq.items,
          { question: "Pertanyaan Baru?", answer: "Jawaban penjelasan di sini." }
        ]
      }
    });
  };

  const handleRemoveFaq = (index: number) => {
    const newItems = [...config.faq.items];
    newItems.splice(index, 1);
    setConfig({
      ...config,
      faq: {
        ...config.faq,
        items: newItems
      }
    });
  };

  const handleUpdateFaq = (index: number, updated: Partial<FAQItemConfig>) => {
    const newItems = [...config.faq.items];
    newItems[index] = { ...newItems[index], ...updated };
    setConfig({
      ...config,
      faq: {
        ...config.faq,
        items: newItems
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-300 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-blue-400/30">
              CMS Landing Page Editor
            </span>
            <span className="text-xs text-slate-400">• Superadmin Platform Control</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-blue-400" />
            Pengaturan Teks, Harga & Konten Landing Page
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Ubah seluruh tulisan, harga bulanan vs tahunan, persentase diskon, testimoni toko, FAQ, banner hero, dan kontak WhatsApp CS langsung dari dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reset ke Teks Bawaan"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Bawaan</span>
          </button>

          {onPreviewLanding && (
            <button
              type="button"
              onClick={onPreviewLanding}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-xl text-xs font-bold border border-blue-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Lihat Landing Page</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {saveToast && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
          saveToast.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
        }`}>
          {saveToast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("PRICING")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "PRICING"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>1. Paket, Harga Bulanan & Tahunan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HERO")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "HERO"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>2. Hero & Banner Utama</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TESTIMONIALS")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "TESTIMONIALS"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          <span>3. Testimoni Toko</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("FAQ")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "FAQ"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>4. Tanya Jawab (FAQ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("BRAND")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "BRAND"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>5. Brand & Kontak CS</span>
        </button>
      </div>

      {/* ========================================= */}
      {/* TAB 1: PRICING PLANS (MONTHLY & ANNUAL)   */}
      {/* ========================================= */}
      {activeTab === "PRICING" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pengaturan Judul & Diskon Tahunan</h2>
              <p className="text-xs text-slate-500 mt-0.5">Atur judul paket dan badge diskon saat pengunjung memilih opsi pembayaran tahunan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Seksi Harga</label>
                <input
                  type="text"
                  value={config.pricing.title}
                  onChange={(e) => setConfig({ ...config, pricing: { ...config.pricing, title: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sub-judul Seksi Harga</label>
                <input
                  type="text"
                  value={config.pricing.subtitle}
                  onChange={(e) => setConfig({ ...config, pricing: { ...config.pricing, subtitle: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-amber-500" />
                  Badge Diskon Tahunan
                </label>
                <input
                  type="text"
                  value={config.pricing.annualDiscountBadge || "HEMAT 20%"}
                  onChange={(e) => setConfig({ ...config, pricing: { ...config.pricing, annualDiscountBadge: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-extrabold text-amber-500 focus:outline-none focus:border-blue-500"
                  placeholder="HEMAT 20%"
                />
              </div>
            </div>
          </div>

          {/* Cards for each plan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {config.pricing.plans.map((plan, planIdx) => (
              <div 
                key={plan.id || planIdx}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-sm flex flex-col justify-between ${
                  plan.popular 
                    ? "border-blue-500 ring-2 ring-blue-500/20" 
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                      Paket #{planIdx + 1}
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plan.popular}
                        onChange={(e) => handleUpdatePlan(planIdx, { popular: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="font-bold text-[11px]">Badge Populer</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Nama Paket</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => handleUpdatePlan(planIdx, { name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Label Badge</label>
                      <input
                        type="text"
                        value={plan.badge}
                        onChange={(e) => handleUpdatePlan(planIdx, { badge: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                        placeholder="Contoh: Kios Tunggal"
                      />
                    </div>
                  </div>

                  {/* Monthly & Annual Price Inputs */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Harga Bulanan (Rp/bln)</span>
                        <span className="text-[10px] text-blue-600 font-extrabold">
                          Rp {Number(plan.monthlyPrice || 0).toLocaleString("id-ID")}
                        </span>
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={plan.monthlyPrice}
                        onChange={(e) => handleUpdatePlan(planIdx, { monthlyPrice: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-900 dark:text-white"
                        placeholder="149000"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Harga Tahunan (Rp/bln)</span>
                        <span className="text-[10px] text-emerald-600 font-extrabold">
                          Rp {Number(plan.annualPrice || 0).toLocaleString("id-ID")}
                        </span>
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={plan.annualPrice}
                        onChange={(e) => handleUpdatePlan(planIdx, { annualPrice: Number(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400"
                        placeholder="119000"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Hemat Rp {(((plan.monthlyPrice || 0) - (plan.annualPrice || 0)) * 12).toLocaleString("id-ID")} / tahun bagi pelanggan.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tagline / Deskripsi Singkat</label>
                    <textarea
                      rows={2}
                      value={plan.tagline}
                      onChange={(e) => handleUpdatePlan(planIdx, { tagline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed"
                    />
                  </div>

                  {/* Included Feature Bullets */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Fitur Termasuk ({plan.features.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddPlanFeature(planIdx)}
                        className="text-[11px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        Tambah Fitur
                      </button>
                    </div>

                    <div className="space-y-2">
                      {plan.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => handleUpdatePlanFeature(planIdx, fIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePlanFeature(planIdx, fIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Hapus fitur"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Teks Tombol CTA</label>
                  <input
                    type="text"
                    value={plan.ctaText}
                    onChange={(e) => handleUpdatePlan(planIdx, { ctaText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 2: HERO & MAIN BANNER                 */}
      {/* ========================================= */}
      {activeTab === "HERO" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Konten Banner Hero Utama & Metrik Counter</h2>
            <p className="text-xs text-slate-500 mt-0.5">Teks yang langsung dilihat oleh calon konsumen saat pertama kali membuka website.</p>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Badge / Tagline Kecil di Atas Judul
              </label>
              <input
                type="text"
                value={config.hero.badgeText}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, badgeText: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                placeholder="Software POS & Retail #1 Khusus Toko Gadget"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Awalan Judul Utama (Hitam / Putih)
                </label>
                <input
                  type="text"
                  value={config.hero.headlinePrefix}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, headlinePrefix: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Aksen Gradient Judul (Warna Gradasi)
                </label>
                <input
                  type="text"
                  value={config.hero.headlineGradient}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, headlineGradient: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-bold text-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Deskripsi Paragraf Hero
              </label>
              <textarea
                rows={3}
                value={config.hero.description}
                onChange={(e) => setConfig({ ...config, hero: { ...config.hero, description: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teks Tombol CTA Utama (Register)
                </label>
                <input
                  type="text"
                  value={config.hero.ctaPrimaryText}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaPrimaryText: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teks Tombol CTA Kedua (Demo)
                </label>
                <input
                  type="text"
                  value={config.hero.ctaSecondaryText}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaSecondaryText: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 3: TESTIMONIALS                       */}
      {/* ========================================= */}
      {activeTab === "TESTIMONIALS" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Judul Bagian Testimoni Toko</h2>
              <p className="text-xs text-slate-500 mt-0.5">Atur judul dan deskripsi seksi ulasan & kisah sukses pemilik toko.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Testimoni</label>
                <input
                  type="text"
                  value={config.testimonials.title}
                  onChange={(e) => setConfig({ ...config, testimonials: { ...config.testimonials, title: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sub-judul Testimoni</label>
                <input
                  type="text"
                  value={config.testimonials.subtitle}
                  onChange={(e) => setConfig({ ...config, testimonials: { ...config.testimonials, subtitle: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Testimoni Pelanggan ({config.testimonials.items.length})</h3>
                <p className="text-xs text-slate-500">Ulasan nyata pemilik toko smartphone yang ditampilkan pada landing page.</p>
              </div>
              <button
                type="button"
                onClick={handleAddTestimonial}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Testimoni Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {config.testimonials.items.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                        Testimoni #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTestimonial(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                        title="Hapus Testimoni"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Pemilik</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateTestimonial(idx, { name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Jabatan & Nama Toko</label>
                      <input
                        type="text"
                        value={item.role}
                        onChange={(e) => handleUpdateTestimonial(idx, { role: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        placeholder="Owner, Galaxy Cell (3 Cabang)"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Lokasi / Mall / Kota</label>
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => handleUpdateTestimonial(idx, { location: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                        placeholder="ITC Roxy Mas, Jakarta Pusat"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Isi Ulasan / Testimoni</label>
                      <textarea
                        rows={3}
                        value={item.content}
                        onChange={(e) => handleUpdateTestimonial(idx, { content: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Highlight Hasil / Statistik</label>
                      <input
                        type="text"
                        value={item.stats}
                        onChange={(e) => handleUpdateTestimonial(idx, { stats: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-emerald-600 font-bold"
                        placeholder="Contoh: Selisih Stok Turun Jadi 0%"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 4: FAQ (TANYA JAWAB)                   */}
      {/* ========================================= */}
      {activeTab === "FAQ" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Judul Bagian FAQ</h2>
              <p className="text-xs text-slate-500 mt-0.5">Atur judul dan deskripsi seksi tanya jawab.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul FAQ</label>
                <input
                  type="text"
                  value={config.faq.title}
                  onChange={(e) => setConfig({ ...config, faq: { ...config.faq, title: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sub-judul FAQ</label>
                <input
                  type="text"
                  value={config.faq.subtitle}
                  onChange={(e) => setConfig({ ...config, faq: { ...config.faq, subtitle: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Pertanyaan & Jawaban ({config.faq.items.length})</h3>
                <p className="text-xs text-slate-500">Pertanyaan yang sering ditanyakan oleh calon pelanggan toko.</p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Pertanyaan FAQ
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {config.faq.items.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                      FAQ #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus Pertanyaan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Pertanyaan</label>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => handleUpdateFaq(idx, { question: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Jawaban Lengkap</label>
                    <textarea
                      rows={2}
                      value={item.answer}
                      onChange={(e) => handleUpdateFaq(idx, { answer: e.target.value })}
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 5: BRAND & FOOTER INFO                */}
      {/* ========================================= */}
      {activeTab === "BRAND" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Identitas Brand & Kontak Support CS</h2>
            <p className="text-xs text-slate-500 mt-0.5">Informasi nama brand aplikasi, kontak WhatsApp CS, dan footer website.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Brand / Aplikasi
              </label>
              <input
                type="text"
                value={config.brand.brandName}
                onChange={(e) => setConfig({ ...config, brand: { ...config.brand, brandName: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500"
                placeholder="NexusPOS"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Badge Versi / Edisi
              </label>
              <input
                type="text"
                value={config.brand.badgeText}
                onChange={(e) => setConfig({ ...config, brand: { ...config.brand, badgeText: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                placeholder="Cloud"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tagline Singkat Brand
              </label>
              <input
                type="text"
                value={config.brand.tagline}
                onChange={(e) => setConfig({ ...config, brand: { ...config.brand, tagline: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                placeholder="Ekosistem Kasir, Inventori IMEI & Toko Smartphone Cloud"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-500" />
                Nomor WhatsApp Support CS (Format: 628...)
              </label>
              <input
                type="text"
                value={config.brand.contactWhatsapp}
                onChange={(e) => setConfig({ ...config, brand: { ...config.brand, contactWhatsapp: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
                placeholder="6281234567890"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-blue-500" />
                Email Support
              </label>
              <input
                type="email"
                value={config.brand.contactEmail}
                onChange={(e) => setConfig({ ...config, brand: { ...config.brand, contactEmail: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                placeholder="support@nexuspos.cloud"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                Alamat Kantor / Kota
              </label>
              <input
                type="text"
                value={config.brand.address}
                onChange={(e) => setConfig({ ...config, brand: { ...config.brand, address: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                placeholder="Jakarta & Medan, Indonesia"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Teks Copyright Footer
              </label>
              <input
                type="text"
                value={config.brand.copyrightText}
                onChange={(e) => setConfig({ ...config, brand: { ...config.brand, copyrightText: e.target.value } })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                placeholder="© 2026 NexusPOS Cloud Inc. All rights reserved."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
