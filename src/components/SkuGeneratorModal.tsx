import React, { useState, useMemo, useEffect } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Plus, 
  Layers, 
  Tag, 
  Wand2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  FileSpreadsheet, 
  Barcode, 
  SlidersHorizontal,
  ChevronRight,
  Info
} from "lucide-react";
import { Product } from "../types";
import { 
  generateProductSku, 
  generateBatchSkus, 
  getCategoryCode, 
  getBrandCode, 
  getModelCode, 
  getStorageCode,
  isSkuDuplicate 
} from "../lib/skuGenerator";
import { useLanguage } from "../contexts/LanguageContext";

interface SkuGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyToNewProduct?: (skuData: {
    sku: string;
    category: string;
    brand: string;
    model: string;
    color?: string;
    type: "BARU" | "BEKAS";
    condition?: string;
    specifications?: string;
  }) => void;
  onBatchUpdateProductSkus?: (updates: { productId: string; newSku: string }[]) => Promise<void> | void;
  initialValues?: {
    category?: string;
    brand?: string;
    model?: string;
    color?: string;
    type?: "BARU" | "BEKAS";
    condition?: string;
  };
}

const POPULAR_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", 
  "Realme", "Infinix", "Tecno", "Huawei", "Honor", 
  "Google", "Sony", "Asus", "Lenovo", "Anker", "Baseus"
];

const POPULAR_MODELS: Record<string, string[]> = {
  Apple: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14", "iPad Pro 11", "iPad Air 5", "AirPods Pro 2"],
  Samsung: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy Z Fold 5", "Galaxy Z Flip 5", "Galaxy A55 5G", "Galaxy Tab S9"],
  Xiaomi: ["Redmi Note 13 Pro+", "Redmi Note 13", "Xiaomi 14", "Poco X6 Pro", "Poco F6", "Redmi 13C"],
  Oppo: ["Reno 11 Pro 5G", "Reno 11 5G", "Find N3", "A79 5G", "A58"],
  Vivo: ["V30 Pro", "V30 5G", "Y100 5G", "Y27s", "X100 Pro"],
  Realme: ["Realme 12 Pro+ 5G", "Realme 12 5G", "Realme C67", "Realme GT 6"],
  Infinix: ["Note 40 Pro", "Hot 40 Pro", "GT 20 Pro", "Smart 8"]
};

const POPULAR_STORAGES = ["64GB", "128GB", "256GB", "512GB", "1TB"];
const POPULAR_COLORS = ["Black", "White", "Silver", "Titanium Gray", "Blue", "Green", "Gold", "Midnight"];

export const SkuGeneratorModal: React.FC<SkuGeneratorModalProps> = ({
  isOpen,
  onClose,
  products,
  onApplyToNewProduct,
  onBatchUpdateProductSkus,
  initialValues
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"SINGLE" | "BATCH_VARIANTS" | "AUDIT_EXISTING">("SINGLE");

  // Single Generator State
  const [category, setCategory] = useState(initialValues?.category || "Smartphone Baru");
  const [brand, setBrand] = useState(initialValues?.brand || "Apple");
  const [model, setModel] = useState(initialValues?.model || "iPhone 15 Pro Max");
  const [storage, setStorage] = useState("256GB");
  const [color, setColor] = useState(initialValues?.color || "Titanium Gray");
  const [type, setType] = useState<"BARU" | "BEKAS">(initialValues?.type || "BARU");
  const [condition, setCondition] = useState(initialValues?.condition || "-");
  const [format, setFormat] = useState<"STANDARD" | "COMPACT" | "MINIMAL">("STANDARD");
  const [customSuffix, setCustomSuffix] = useState("");
  const [copiedSku, setCopiedSku] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Batch Variants Generator State
  const [batchCategory, setBatchCategory] = useState("Smartphone Baru");
  const [batchBrand, setBatchBrand] = useState("Samsung");
  const [batchModel, setBatchModel] = useState("Galaxy S24 Ultra");
  const [selectedStorages, setSelectedStorages] = useState<string[]>(["256GB", "512GB"]);
  const [selectedColors, setSelectedColors] = useState<string[]>(["Titanium Gray", "Titanium Black"]);
  const [batchType, setBatchType] = useState<"BARU" | "BEKAS">("BARU");
  const [copiedBatch, setCopiedBatch] = useState(false);

  // Existing Products Audit / Auto-Assign State
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen && initialValues) {
      if (initialValues.category) setCategory(initialValues.category);
      if (initialValues.brand) setBrand(initialValues.brand);
      if (initialValues.model) setModel(initialValues.model);
      if (initialValues.color) setColor(initialValues.color);
      if (initialValues.type) setType(initialValues.type);
      if (initialValues.condition) setCondition(initialValues.condition);
    }
  }, [isOpen, initialValues]);

  // Extract all existing SKUs & IDs from products
  const existingSkusList = useMemo(() => {
    const list: string[] = [];
    products.forEach(p => {
      if (p.sku) list.push(p.sku);
      if (p.id) list.push(p.id);
    });
    return list;
  }, [products]);

  // Realtime Generated SKU for Single Tab
  const generatedSkuData = useMemo(() => {
    // Dependency on refreshTrigger allows forcing new random suffix
    return generateProductSku({
      category,
      brand,
      model,
      storage,
      color,
      type,
      condition: type === "BEKAS" ? condition : "-",
      format,
      existingSkus: existingSkusList,
      customSuffix: customSuffix.trim() || undefined
    });
  }, [category, brand, model, storage, color, type, condition, format, existingSkusList, customSuffix, refreshTrigger]);

  const isDuplicate = useMemo(() => {
    return isSkuDuplicate(generatedSkuData.fullSku, existingSkusList);
  }, [generatedSkuData.fullSku, existingSkusList]);

  // Batch Generated SKUs
  const batchGeneratedList = useMemo(() => {
    const items: Array<{ category: string; brand: string; model: string; storage: string; color: string; type: "BARU" | "BEKAS" }> = [];
    
    const storagesToUse = selectedStorages.length > 0 ? selectedStorages : ["STD"];
    const colorsToUse = selectedColors.length > 0 ? selectedColors : ["Default"];

    storagesToUse.forEach(s => {
      colorsToUse.forEach(c => {
        items.push({
          category: batchCategory,
          brand: batchBrand,
          model: batchModel,
          storage: s,
          color: c,
          type: batchType
        });
      });
    });

    return generateBatchSkus(items, existingSkusList);
  }, [batchCategory, batchBrand, batchModel, selectedStorages, selectedColors, batchType, existingSkusList, refreshTrigger]);

  // Products with missing or unformatted SKUs
  const productsNeedingSku = useMemo(() => {
    return products.filter(p => {
      if (!p.sku) return true;
      // If SKU is just raw UUID or empty
      if (p.sku.length > 20 && p.sku.includes("-") && p.sku.split("-").length > 4) return true;
      return false;
    }).map(p => {
      const generated = generateProductSku({
        category: p.category,
        brand: p.brand,
        model: p.model,
        color: p.color,
        type: p.type,
        condition: p.condition,
        existingSkus: existingSkusList
      });
      return {
        product: p,
        proposedSku: generated.fullSku
      };
    });
  }, [products, existingSkusList]);

  if (!isOpen) return null;

  const handleCopySku = (skuText: string) => {
    navigator.clipboard.writeText(skuText);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2500);
  };

  const handleCopyBatch = () => {
    const text = batchGeneratedList.map((item, idx) => {
      const target = selectedStorages.length > 0 ? selectedStorages[Math.floor(idx / Math.max(1, selectedColors.length))] : "";
      return `${item.fullSku}\t${batchBrand} ${batchModel} ${target}`;
    }).join("\n");
    
    navigator.clipboard.writeText(text);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2500);
  };

  const handleExportBatchCsv = () => {
    let csv = "No,SKU,Kategori,Brand,Model,Kapasitas,Warna,Tipe\n";
    batchGeneratedList.forEach((item, idx) => {
      const storageVal = item.storageCode || "-";
      csv += `${idx + 1},"${item.fullSku}","${batchCategory}","${batchBrand}","${batchModel}","${storageVal}","-","${batchType}"\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Batch_SKU_${batchBrand}_${batchModel.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApplySingleToNew = () => {
    if (onApplyToNewProduct) {
      onApplyToNewProduct({
        sku: generatedSkuData.fullSku,
        category,
        brand,
        model,
        color,
        type,
        condition: type === "BEKAS" ? condition : "-",
        specifications: `${storage ? `Kapasitas: ${storage}. ` : ""}${color ? `Warna: ${color}. ` : ""}`
      });
      onClose();
    }
  };

  const handleApplyAllMissingSkus = async () => {
    if (!onBatchUpdateProductSkus || productsNeedingSku.length === 0) return;
    setIsUpdatingExisting(true);
    try {
      const updates = productsNeedingSku.map(item => ({
        productId: item.product.id,
        newSku: item.proposedSku
      }));
      await onBatchUpdateProductSkus(updates);
      setAuditSuccessMsg(`Berhasil memperbarui ${updates.length} produk dengan SKU standar.`);
      setTimeout(() => setAuditSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Gagal update SKU produk:", err);
      alert("Terjadi kesalahan saat memperbarui SKU produk.");
    } finally {
      setIsUpdatingExisting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-primary-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Auto SKU & Barcode Generator
                </h2>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] rounded-full border border-amber-200 dark:border-amber-800">
                  Smart POS Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Standarisasi kode unik produk otomatis berbasis Kategori Perangkat, Brand, Model & Spesifikasi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
          <button
            onClick={() => setActiveTab("SINGLE")}
            className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "SINGLE"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Wand2 className="h-4 w-4" />
            <span>Generator Tunggal / Produk Baru</span>
          </button>

          <button
            onClick={() => setActiveTab("BATCH_VARIANTS")}
            className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "BATCH_VARIANTS"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Batch Multi-Varian (Memori / Warna)</span>
          </button>

          <button
            onClick={() => setActiveTab("AUDIT_EXISTING")}
            className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "AUDIT_EXISTING"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Standarisasi SKU Stok Toko ({productsNeedingSku.length})</span>
          </button>
        </div>

        {/* Tab 1: SINGLE GENERATOR */}
        {activeTab === "SINGLE" && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Live Preview Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5" />
                      Hasil Kode SKU Terverifikasi
                    </span>
                    {!isDuplicate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3" /> Unik & Siap Pakai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-black rounded-full border border-rose-500/30">
                        <AlertCircle className="h-3 w-3" /> Terdaftar di Sistem
                      </span>
                    )}
                  </div>
                  
                  {/* Big SKU Display */}
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-amber-300 selection:bg-amber-500 selection:text-slate-900">
                      {generatedSkuData.fullSku}
                    </span>
                  </div>

                  {/* Token breakdown chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-slate-300">
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono" title="Kategori Perangkat">
                      Kategori: <strong className="text-amber-300">{generatedSkuData.categoryCode}</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono" title="Brand / Merek">
                      Brand: <strong className="text-amber-300">{generatedSkuData.brandCode}</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono" title="Model Perangkat">
                      Model: <strong className="text-amber-300">{generatedSkuData.modelCode}</strong>
                    </span>
                    {generatedSkuData.storageCode && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono" title="Kapasitas Memori">
                          Storage: <strong className="text-amber-300">{generatedSkuData.storageCode}</strong>
                        </span>
                      </>
                    )}
                    {generatedSkuData.typeCode && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono" title="Grade Kondisi">
                          Grade: <strong className="text-amber-300">{generatedSkuData.typeCode}</strong>
                        </span>
                      </>
                    )}
                    <span className="text-slate-600">•</span>
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono" title="Nomor Suffix Acak">
                      Suffix: <strong className="text-amber-300">#{generatedSkuData.suffix}</strong>
                    </span>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-row md:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopySku(generatedSkuData.fullSku)}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold rounded-xl border border-slate-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedSku ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-300">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-slate-300" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Buat nomor suffix acak baru yang unik"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Acak Ulang Suffix</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Input Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Kategori Perangkat</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                    Prefix: {getCategoryCode(category, type)}
                  </span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategory(val);
                    if (val === "Smartphone Bekas") setType("BEKAS");
                    else if (val === "Smartphone Baru") setType("BARU");
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Smartphone Baru">📱 Smartphone Baru (SPN)</option>
                  <option value="Smartphone Bekas">📱 Smartphone Bekas / Second (SPU)</option>
                  <option value="Tablet">📱 Tablet / iPad (TAB)</option>
                  <option value="Aksesori">🎧 Aksesori / Casing / Charger (ACC)</option>
                  <option value="Sparepart">🛠️ Sparepart / Baterai / LCD (PRT)</option>
                  <option value="Smartwatch">⌚ Smartwatch & Wearable (WAT)</option>
                  <option value="Audio">🎵 Audio / Headphone / TWS (AUD)</option>
                  <option value="Lainnya">📦 Lainnya / Umum (GEN)</option>
                </select>
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Brand / Merek</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                    Kode: {getBrandCode(brand)}
                  </span>
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Contoh: Apple, Samsung, Xiaomi"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {/* Popular Brand Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {POPULAR_BRANDS.slice(0, 8).map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setBrand(b);
                        if (POPULAR_MODELS[b] && POPULAR_MODELS[b][0]) {
                          setModel(POPULAR_MODELS[b][0]);
                        }
                      }}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        brand.toLowerCase() === b.toLowerCase()
                          ? "bg-amber-500 border-amber-500 text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Model Perangkat</span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                    Kode: {getModelCode(model, brand)}
                  </span>
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Contoh: iPhone 15 Pro Max, Galaxy S24 Ultra"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {/* Popular Model Suggestions */}
                {POPULAR_MODELS[brand] && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {POPULAR_MODELS[brand].slice(0, 4).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          model.toLowerCase() === m.toLowerCase()
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Storage Capacity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Kapasitas / Memori</span>
                  {getStorageCode(storage) && (
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-900">
                      Kode: {getStorageCode(storage)}
                    </span>
                  )}
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {POPULAR_STORAGES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStorage(s)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        storage === s
                          ? "bg-amber-500 border-amber-500 text-white shadow-2xs"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setStorage("")}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      !storage
                        ? "bg-slate-700 border-slate-700 text-white"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    Tanpa Storage
                  </button>
                </div>
              </div>

              {/* Format & Style Customization */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
                  <span>Format Penataan SKU</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("STANDARD")}
                    className={`py-2 px-2 border rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                      format === "STANDARD"
                        ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Standard (Strip)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("COMPACT")}
                    className={`py-2 px-2 border rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                      format === "COMPACT"
                        ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Ringkas (Padat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("MINIMAL")}
                    className={`py-2 px-2 border rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                      format === "MINIMAL"
                        ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Minimalis
                  </button>
                </div>
              </div>

              {/* Custom Suffix */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Custom Suffix (Opsional)</span>
                  <span className="text-[10px] text-slate-400">Kosongkan untuk acak</span>
                </label>
                <input
                  type="text"
                  value={customSuffix}
                  onChange={(e) => setCustomSuffix(e.target.value.toUpperCase())}
                  placeholder="Contoh: 001, A1, RETAIL"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="h-4 w-4 text-amber-500 shrink-0" />
                <span>SKU ini dapat dicetak sebagai Barcode/QR Code pada label dus dan etalase.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onApplyToNewProduct && (
                  <button
                    type="button"
                    onClick={handleApplySingleToNew}
                    className="w-full sm:w-auto px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Gunakan di Form Tambah Produk</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: BATCH VARIANTS GENERATOR */}
        {activeTab === "BATCH_VARIANTS" && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">Batch Variant SKU Matrix</p>
                <p className="text-amber-700 dark:text-amber-300">
                  Buat kode SKU massal secara otomatis untuk satu model HP dengan berbagai varian kapasitas memori dan pilihan warna sekaligus.
                </p>
              </div>
            </div>

            {/* Model Setup */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Brand</label>
                <input
                  type="text"
                  value={batchBrand}
                  onChange={(e) => setBatchBrand(e.target.value)}
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Model Dasar</label>
                <input
                  type="text"
                  value={batchModel}
                  onChange={(e) => setBatchModel(e.target.value)}
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategori</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="mt-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="Smartphone Baru">📱 Smartphone Baru (SPN)</option>
                  <option value="Smartphone Bekas">📱 Smartphone Bekas (SPU)</option>
                  <option value="Tablet">📱 Tablet (TAB)</option>
                  <option value="Aksesori">🎧 Aksesori (ACC)</option>
                </select>
              </div>
            </div>

            {/* Storage Matrix Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Varian Kapasitas</label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_STORAGES.map(s => {
                  const selected = selectedStorages.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSelectedStorages(prev => 
                          selected ? prev.filter(x => x !== s) : [...prev, s]
                        );
                      }}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {selected ? `✓ ${s}` : `+ ${s}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Matrix Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Varian Warna</label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_COLORS.map(c => {
                  const selected = selectedColors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedColors(prev => 
                          selected ? prev.filter(x => x !== c) : [...prev, c]
                        );
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {selected ? `✓ ${c}` : `+ ${c}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generated Matrix Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hasil Batch Matrix ({batchGeneratedList.length} Kode SKU)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBatch}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedBatch ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedBatch ? "Tersalin!" : "Salin Semua"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportBatchCsv}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Ekspor CSV</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Generated SKU</th>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3">Kapasitas</th>
                      <th className="py-2.5 px-3">Warna</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {batchGeneratedList.map((item, idx) => {
                      const storageVal = selectedStorages[Math.floor(idx / Math.max(1, selectedColors.length))] || "-";
                      const colorVal = selectedColors[idx % Math.max(1, selectedColors.length)] || "-";
                      return (
                        <tr key={item.fullSku} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {item.fullSku}
                          </td>
                          <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{batchBrand} {batchModel}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{storageVal}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{colorVal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AUDIT EXISTING INVENTORY */}
        {activeTab === "AUDIT_EXISTING" && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 flex items-start gap-3">
              <Tag className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <p className="font-bold">Standarisasi & Audit SKU Stok Toko</p>
                <p className="text-indigo-700 dark:text-indigo-300">
                  Ditemukan <strong>{productsNeedingSku.length} produk</strong> di inventaris yang belum memiliki format SKU standar. Anda dapat menstandarisasikannya secara instan.
                </p>
              </div>
            </div>

            {auditSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4" />
                <span>{auditSuccessMsg}</span>
              </div>
            )}

            {productsNeedingSku.length > 0 ? (
              <div className="space-y-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Nama Produk</th>
                        <th className="py-2.5 px-3">Brand & Model</th>
                        <th className="py-2.5 px-3">SKU Saat Ini</th>
                        <th className="py-2.5 px-3">Usulan SKU Standar Baru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {productsNeedingSku.map(({ product, proposedSku }) => (
                        <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                            {product.name}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                            {product.brand} {product.model}
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                            {product.sku || <span className="text-amber-600 dark:text-amber-400 font-semibold">[Belum Ada]</span>}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {proposedSku}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isUpdatingExisting}
                    onClick={handleApplyAllMissingSkus}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {isUpdatingExisting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Menerapkan Standarisasi...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Terapkan SKU Standar ke {productsNeedingSku.length} Produk</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Seluruh Produk Inventaris Sudah Memiliki SKU Terstandar!
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Semua item stok produk di toko Anda telah memiliki kode SKU yang teratur dan siap dipindai.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
