import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Smartphone, Plus, Check, Sparkles, Database, History, Tag, ChevronDown, X } from "lucide-react";
import { Product, Buyback } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

// Standard Popular Smartphone Database to prevent typos & duplicates
export const POPULAR_SMARTPHONE_CATALOG: { brand: string; model: string; category?: string }[] = [
  // Apple iPhones
  { brand: "Apple", model: "iPhone 11 64GB" },
  { brand: "Apple", model: "iPhone 11 128GB" },
  { brand: "Apple", model: "iPhone 12 64GB" },
  { brand: "Apple", model: "iPhone 12 128GB" },
  { brand: "Apple", model: "iPhone 12 Pro 128GB" },
  { brand: "Apple", model: "iPhone 12 Pro Max 256GB" },
  { brand: "Apple", model: "iPhone 13 Mini 128GB" },
  { brand: "Apple", model: "iPhone 13 128GB" },
  { brand: "Apple", model: "iPhone 13 256GB" },
  { brand: "Apple", model: "iPhone 13 Pro 128GB" },
  { brand: "Apple", model: "iPhone 13 Pro Max 256GB" },
  { brand: "Apple", model: "iPhone 14 128GB" },
  { brand: "Apple", model: "iPhone 14 Plus 128GB" },
  { brand: "Apple", model: "iPhone 14 Pro 128GB" },
  { brand: "Apple", model: "iPhone 14 Pro Max 256GB" },
  { brand: "Apple", model: "iPhone 15 128GB" },
  { brand: "Apple", model: "iPhone 15 Plus 128GB" },
  { brand: "Apple", model: "iPhone 15 Pro 128GB" },
  { brand: "Apple", model: "iPhone 15 Pro Max 256GB" },
  { brand: "Apple", model: "iPhone 16 128GB" },
  { brand: "Apple", model: "iPhone 16 Pro 128GB" },
  { brand: "Apple", model: "iPhone 16 Pro Max 256GB" },
  { brand: "Apple", model: "iPhone SE 2022 64GB" },
  
  // Samsung
  { brand: "Samsung", model: "Galaxy S21 FE 5G" },
  { brand: "Samsung", model: "Galaxy S22 5G" },
  { brand: "Samsung", model: "Galaxy S22 Ultra 5G" },
  { brand: "Samsung", model: "Galaxy S23 FE 5G" },
  { brand: "Samsung", model: "Galaxy S23 5G 128GB" },
  { brand: "Samsung", model: "Galaxy S23 Ultra 256GB" },
  { brand: "Samsung", model: "Galaxy S24 5G 256GB" },
  { brand: "Samsung", model: "Galaxy S24+ 5G 256GB" },
  { brand: "Samsung", model: "Galaxy S24 Ultra 5G 256GB" },
  { brand: "Samsung", model: "Galaxy Z Flip 5 5G" },
  { brand: "Samsung", model: "Galaxy Z Fold 5 5G" },
  { brand: "Samsung", model: "Galaxy Z Flip 6 5G" },
  { brand: "Samsung", model: "Galaxy A15 5G 128GB" },
  { brand: "Samsung", model: "Galaxy A25 5G 128GB" },
  { brand: "Samsung", model: "Galaxy A35 5G 128GB" },
  { brand: "Samsung", model: "Galaxy A55 5G 256GB" },
  { brand: "Samsung", model: "Galaxy A54 5G 128GB" },

  // Xiaomi & POCO
  { brand: "Xiaomi", model: "Redmi Note 12 128GB" },
  { brand: "Xiaomi", model: "Redmi Note 13 4G 128GB" },
  { brand: "Xiaomi", model: "Redmi Note 13 Pro 5G 256GB" },
  { brand: "Xiaomi", model: "Xiaomi 13T 256GB" },
  { brand: "Xiaomi", model: "Xiaomi 14 256GB" },
  { brand: "POCO", model: "POCO X6 Pro 5G 512GB" },
  { brand: "POCO", model: "POCO F5 256GB" },
  { brand: "POCO", model: "POCO F6 256GB" },
  { brand: "POCO", model: "POCO M6 Pro 256GB" },

  // Oppo
  { brand: "Oppo", model: "Oppo Reno 8 5G" },
  { brand: "Oppo", model: "Oppo Reno 10 5G" },
  { brand: "Oppo", model: "Oppo Reno 11 5G" },
  { brand: "Oppo", model: "Oppo Reno 12 5G 256GB" },
  { brand: "Oppo", model: "Oppo A78 5G 128GB" },
  { brand: "Oppo", model: "Oppo A98 5G 256GB" },
  { brand: "Oppo", model: "Oppo Find N3 Flip" },

  // Vivo
  { brand: "Vivo", model: "Vivo V27 5G 256GB" },
  { brand: "Vivo", model: "Vivo V29 5G 256GB" },
  { brand: "Vivo", model: "Vivo V30 5G 256GB" },
  { brand: "Vivo", model: "Vivo Y27 5G 128GB" },
  { brand: "Vivo", model: "Vivo Y100 5G 256GB" },
  { brand: "Vivo", model: "Vivo X100 Pro 512GB" },

  // Realme & Infinix
  { brand: "Realme", model: "Realme 11 Pro 5G" },
  { brand: "Realme", model: "Realme 12 Pro+ 5G 256GB" },
  { brand: "Realme", model: "Realme GT Neo 3" },
  { brand: "Infinix", model: "Infinix Zero 30 5G" },
  { brand: "Infinix", model: "Infinix GT 20 Pro" },
  { brand: "Infinix", model: "Infinix Note 40 Pro" },

  // ASUS & Google
  { brand: "ASUS", model: "ROG Phone 7 256GB" },
  { brand: "ASUS", model: "ROG Phone 8 256GB" },
  { brand: "Google", model: "Pixel 7a 128GB" },
  { brand: "Google", model: "Pixel 8 128GB" },
  { brand: "Google", model: "Pixel 8 Pro 256GB" }
];

export const POPULAR_BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "POCO",
  "Realme",
  "Infinix",
  "ASUS",
  "Google",
  "Tecno",
  "Honor",
  "Huawei",
  "Sony"
];

interface BrandModelSearchInputProps {
  brand: string;
  setBrand: (b: string) => void;
  model: string;
  setModel: (m: string) => void;
  products?: Product[];
  buybacks?: Buyback[];
  compact?: boolean;
  onSelectProduct?: (product: Product | null) => void;
  selectedProductId?: string | null;
  setSelectedProductId?: (id: string | null) => void;
}

export default function BrandModelSearchInput({
  brand,
  setBrand,
  model,
  setModel,
  products = [],
  buybacks = [],
  compact = false,
  onSelectProduct,
  selectedProductId,
  setSelectedProductId
}: BrandModelSearchInputProps) {
  const { t } = useLanguage();
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  const [brandSearch, setBrandSearch] = useState(brand);
  const [modelSearch, setModelSearch] = useState(model);

  const brandRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  // Sync inputs when props change from outside
  useEffect(() => {
    setBrandSearch(brand);
  }, [brand]);

  useEffect(() => {
    setModelSearch(model);
  }, [model]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setShowBrandDropdown(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute available brands list (combining popular, products, and buybacks)
  const availableBrands = useMemo(() => {
    const set = new Set<string>(POPULAR_BRANDS);
    products.forEach(p => {
      if (p.brand && p.brand.trim()) set.add(p.brand.trim());
    });
    buybacks.forEach(b => {
      if (b.brand && b.brand.trim()) set.add(b.brand.trim());
    });
    return Array.from(set);
  }, [products, buybacks]);

  // Filtered brands based on search query
  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return availableBrands;
    return availableBrands.filter(b => b.toLowerCase().includes(q));
  }, [availableBrands, brandSearch]);

  // Unified candidate models with metadata
  const candidateModels = useMemo(() => {
    const map = new Map<string, { 
      brand: string; 
      model: string; 
      source: "STOCK" | "BUYBACK" | "CATALOG"; 
      priceHint?: number;
      productId?: string;
      productObj?: Product;
    }>();

    // 1. From Popular Catalog
    POPULAR_SMARTPHONE_CATALOG.forEach(item => {
      const key = `${item.brand.toLowerCase()}||${item.model.toLowerCase()}`;
      map.set(key, {
        brand: item.brand,
        model: item.model,
        source: "CATALOG"
      });
    });

    // 2. From Current Inventory Products
    products.forEach(p => {
      if (p.model && p.model.trim()) {
        const brandName = p.brand || "Lainnya";
        const key = `${brandName.toLowerCase()}||${p.model.trim().toLowerCase()}`;
        map.set(key, {
          brand: brandName,
          model: p.model.trim(),
          source: "STOCK",
          priceHint: p.priceSell,
          productId: p.id,
          productObj: p
        });
      } else if (p.name && p.name.trim()) {
        const brandName = p.brand || "Lainnya";
        const key = `${brandName.toLowerCase()}||${p.name.trim().toLowerCase()}`;
        if (!map.has(key)) {
          map.set(key, {
            brand: brandName,
            model: p.name.trim(),
            source: "STOCK",
            priceHint: p.priceSell,
            productId: p.id,
            productObj: p
          });
        }
      }
    });

    // 3. From Past Buyback Transactions
    buybacks.forEach(b => {
      if (b.model && b.model.trim()) {
        const brandName = b.brand || "Lainnya";
        const key = `${brandName.toLowerCase()}||${b.model.trim().toLowerCase()}`;
        if (!map.has(key)) {
          map.set(key, {
            brand: brandName,
            model: b.model.trim(),
            source: "BUYBACK",
            priceHint: b.priceBuy
          });
        }
      }
    });

    return Array.from(map.values());
  }, [products, buybacks]);

  // Filter candidate models based on modelSearch query and selected brand
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    const activeBrand = brand.trim().toLowerCase();

    return candidateModels.filter(item => {
      // Filter by brand if a specific brand is selected
      if (activeBrand && activeBrand !== "semua" && item.brand.toLowerCase() !== activeBrand) {
        // Exception: if query explicitly mentions brand e.g. "iphone", allow it
        if (!item.model.toLowerCase().includes(q) && !item.brand.toLowerCase().includes(q) && !(item.productId && item.productId.toLowerCase().includes(q))) {
          return false;
        }
      }

      if (!q) return true;

      // Match query against model, brand, or Product ID
      return (
        item.model.toLowerCase().includes(q) || 
        item.brand.toLowerCase().includes(q) ||
        (item.productId && item.productId.toLowerCase().includes(q))
      );
    });
  }, [candidateModels, modelSearch, brand]);

  // Handle selecting a model from dropdown
  const handleSelectModel = (selectedItem: { 
    brand: string; 
    model: string; 
    productId?: string; 
    productObj?: Product 
  }) => {
    setModel(selectedItem.model);
    setModelSearch(selectedItem.model);
    
    // Auto-set brand if brand is empty or differs
    if (selectedItem.brand) {
      setBrand(selectedItem.brand);
      setBrandSearch(selectedItem.brand);
    }

    if (selectedItem.productId) {
      if (setSelectedProductId) setSelectedProductId(selectedItem.productId);
      if (onSelectProduct && selectedItem.productObj) onSelectProduct(selectedItem.productObj);
    } else {
      if (setSelectedProductId) setSelectedProductId(null);
      if (onSelectProduct) onSelectProduct(null);
    }
    
    setShowModelDropdown(false);
  };

  // Handle selecting a brand from dropdown
  const handleSelectBrand = (b: string) => {
    setBrand(b);
    setBrandSearch(b);
    setShowBrandDropdown(false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {/* 1. Merek / Brand Field */}
      <div className="space-y-1 relative" ref={brandRef}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Merek / Brand</span>
          {brand && (
            <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {brand}
            </span>
          )}
        </label>
        
        <div className="relative">
          <input
            type="text"
            required
            value={brandSearch}
            onFocus={() => setShowBrandDropdown(true)}
            onChange={(e) => {
              setBrandSearch(e.target.value);
              setBrand(e.target.value);
              setShowBrandDropdown(true);
            }}
            placeholder="Cari / Pilih Merek (e.g. Apple, Samsung)"
            className={`w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary-500 pr-8 font-semibold ${
              compact ? "py-1.5 text-[11px]" : ""
            }`}
          />
          <button
            type="button"
            onClick={() => setShowBrandDropdown(!showBrandDropdown)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showBrandDropdown ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Brand Dropdown Menu */}
        {showBrandDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 max-h-56 overflow-y-auto space-y-1 text-xs">
            <div className="px-2 py-1 text-[9px] font-extrabold text-slate-400 uppercase border-b border-slate-100 flex items-center justify-between">
              <span>Pilih Merek Smartphone</span>
              <span className="text-[8px] text-slate-400">{filteredBrands.length} opsi</span>
            </div>

            {filteredBrands.length === 0 ? (
              <button
                type="button"
                onClick={() => handleSelectBrand(brandSearch)}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-emerald-600 font-bold flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Gunakan Merek Baru: "{brandSearch}"</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-1 pt-1">
                {filteredBrands.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleSelectBrand(b)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      brand.toLowerCase() === b.toLowerCase()
                        ? "bg-primary-50 text-primary-700 border border-primary-200"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {brand.toLowerCase() === b.toLowerCase() && (
                      <Check className="h-3.5 w-3.5 text-primary-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Model / Tipe HP Bekas Field with Smart Search Autocomplete */}
      <div className="space-y-1 relative" ref={modelRef}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Tipe / Model HP Bekas</span>
          <span className="text-[9px] text-indigo-600 font-mono font-bold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Auto-Search
          </span>
        </label>

        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            required
            value={modelSearch}
            onFocus={() => setShowModelDropdown(true)}
            onChange={(e) => {
              setModelSearch(e.target.value);
              setModel(e.target.value);
              setShowModelDropdown(true);
            }}
            placeholder={brand ? `Cari model ${brand}... (misal: iPhone 13)` : "Ketik nama/model (e.g. iPhone 13, Galaxy S23)..."}
            className={`w-full bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary-500 font-medium ${
              compact ? "py-1.5 text-[11px]" : ""
            }`}
          />
          {modelSearch && (
            <button
              type="button"
              onClick={() => {
                setModelSearch("");
                setModel("");
                setShowModelDropdown(true);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Model Autocomplete Dropdown List */}
        {showModelDropdown && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 max-h-64 overflow-y-auto space-y-1 text-xs">
            {/* Header info */}
            <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between text-[9px] font-extrabold text-slate-400 uppercase">
              <span>Rekomendasi Katalog & Stok ({filteredModels.length})</span>
              <span>Klik untuk pilih tanpa typo</span>
            </div>

            {/* Always offer custom text if user typed something */}
            {modelSearch.trim() && !filteredModels.some(m => m.model.toLowerCase() === modelSearch.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => {
                  setModel(modelSearch.trim());
                  setShowModelDropdown(false);
                }}
                className="w-full text-left p-2 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="h-4 w-4 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">Gunakan nama baru: "{modelSearch.trim()}"</p>
                  <p className="text-[9px] text-amber-700 font-normal">Item baru belum terdaftar di katalog standar</p>
                </div>
              </button>
            )}

            {filteredModels.length === 0 && !modelSearch.trim() ? (
              <div className="p-3 text-center text-slate-400 text-[11px]">
                Ketik nama HP (contoh: <strong>iphone 13</strong>, <strong>s23</strong>, <strong>reno</strong>) untuk rekomendasi kilat.
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {filteredModels.slice(0, 15).map((item, idx) => {
                  const isSelected = model.toLowerCase() === item.model.toLowerCase();
                  return (
                    <button
                      key={`${item.brand}-${item.model}-${idx}`}
                      type="button"
                      onClick={() => handleSelectModel(item)}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer group ${
                        isSelected
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold"
                          : "hover:bg-slate-50 border border-transparent text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <Smartphone className="h-3.5 w-3.5 shrink-0" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase border border-slate-200">
                              {item.brand}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate group-hover:text-primary-600">
                              {item.model}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.source === "STOCK" && (
                          <span className="text-[8px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Database className="h-2.5 w-2.5" />
                            {item.productId ? `ID: ${item.productId}` : "Stok Toko"}
                          </span>
                        )}
                        {item.source === "BUYBACK" && (
                          <span className="text-[8px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <History className="h-2.5 w-2.5" />
                            Riwayat Buyback
                          </span>
                        )}
                        {item.source === "CATALOG" && (
                          <span className="text-[8px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full">
                            Katalog Standard
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
