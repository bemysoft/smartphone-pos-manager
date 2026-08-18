/**
 * SKU Generator Engine for Smartphone & Device Retail POS
 * Generates structured, readable, and unique product codes based on:
 * - Device Category (e.g. SPN = Smartphone Baru, SPU = Smartphone Bekas, ACC = Aksesori, TAB = Tablet, PRT = Sparepart)
 * - Brand (e.g. APL = Apple, SSG = Samsung, XMI = Xiaomi, OPP = Oppo, VIV = Vivo, RLM = Realme, IFX = Infinix)
 * - Model & Specs (e.g. IP15PM-256G, S24U-512G, RN13P-128G)
 * - Unique Sequence / Hash Suffix ensuring zero collision with existing inventory
 */

export interface SkuGeneratorParams {
  category?: string;
  brand?: string;
  model?: string;
  storage?: string;
  color?: string;
  type?: "BARU" | "BEKAS";
  condition?: "A" | "B" | "C" | "D" | "-" | string;
  format?: "STANDARD" | "COMPACT" | "MODERN" | "MINIMAL";
  existingSkus?: (string | undefined | null)[];
  customSuffix?: string;
}

export interface SkuComponents {
  categoryCode: string;
  brandCode: string;
  modelCode: string;
  storageCode?: string;
  typeCode?: string;
  suffix: string;
  fullSku: string;
}

// Predefined Brand Abbreviations for popular smartphones & electronics
const BRAND_CODE_MAP: Record<string, string> = {
  APPLE: "APL",
  IPHONE: "APL",
  SAMSUNG: "SSG",
  XIAOMI: "XMI",
  REDMI: "RDM",
  POCO: "POC",
  OPPO: "OPP",
  VIVO: "VIV",
  REALME: "RLM",
  INFINIX: "IFX",
  TECNO: "TCN",
  ITEL: "ITL",
  HUAWEI: "HWI",
  HONOR: "HNR",
  GOOGLE: "GGL",
  PIXEL: "GGL",
  SONY: "SNY",
  XPERIA: "SNY",
  ASUS: "ASU",
  ROG: "ROG",
  LENOVO: "LNV",
  MOTOROLA: "MOT",
  NOKIA: "NOK",
  ONEPLUS: "1PL",
  NOTHING: "NTH",
  ZTE: "ZTE",
  NUBIA: "NUB",
  MEIZU: "MZU",
  ANKER: "ANK",
  BASEUS: "BAS",
  UGREEN: "UGR",
  SANDISK: "SND",
  JBL: "JBL",
  SONY_ACC: "SNY",
  MARSHALL: "MSH",
  ACOME: "ACM",
  ROBOT: "RBT",
  JOYSEUS: "JYS",
  KISONLI: "KSN",
  REXUS: "RXS",
  FOOME: "FOM",
  USAMS: "USM",
  LOGITECH: "LOG",
  ORICO: "ORC",
  KINGSTON: "KNG",
  SAMSUNG_ACC: "SSG"
};

// Predefined Category Abbreviations
const CATEGORY_CODE_MAP: Record<string, string> = {
  "SMARTPHONE BARU": "SPN",
  "SMARTPHONE BEKAS": "SPU",
  "SMARTPHONE": "SPH",
  "HP BARU": "SPN",
  "HP BEKAS": "SPU",
  "HP SECOND": "SPU",
  "TABLET": "TAB",
  "AKSESORI": "ACC",
  "AKSESORIS": "ACC",
  "SPAREPART": "PRT",
  "AUDIO": "AUD",
  "WEARABLE": "WAT",
  "SMARTWATCH": "WAT",
  "POWERBANK": "PWR",
  "CHARGER": "CHG",
  "CASING": "CSG",
  "TEMPERED GLASS": "TG",
  "HEADSET": "EAR",
  "TWS": "TWS",
  "LAINNYA": "GEN",
  "UMUM": "GEN"
};

/**
 * Normalizes a category string into a standardized 2-3 letter SKU code
 */
export function getCategoryCode(category?: string, type?: "BARU" | "BEKAS"): string {
  if (!category) {
    return type === "BEKAS" ? "SPU" : "SPN";
  }
  const clean = category.trim().toUpperCase();
  if (CATEGORY_CODE_MAP[clean]) {
    return CATEGORY_CODE_MAP[clean];
  }
  for (const [key, code] of Object.entries(CATEGORY_CODE_MAP)) {
    if (clean.includes(key)) {
      return code;
    }
  }
  // Fallback: take first 3 alphanumeric characters
  const alphanumeric = clean.replace(/[^A-Z0-9]/g, "");
  return alphanumeric.slice(0, 3).padEnd(3, "X");
}

/**
 * Normalizes a brand name into a standardized 3-letter SKU code
 */
export function getBrandCode(brand?: string): string {
  if (!brand) return "GEN";
  const clean = brand.trim().toUpperCase();
  if (BRAND_CODE_MAP[clean]) {
    return BRAND_CODE_MAP[clean];
  }
  for (const [key, code] of Object.entries(BRAND_CODE_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return code;
    }
  }
  const alphanumeric = clean.replace(/[^A-Z0-9]/g, "");
  return alphanumeric.slice(0, 3).padEnd(3, "X");
}

/**
 * Cleans and converts a model name into a readable, concise SKU model token
 * e.g. "iPhone 15 Pro Max" -> "IP15PM"
 * e.g. "Galaxy S24 Ultra" -> "S24U"
 * e.g. "Redmi Note 13 Pro 5G" -> "RN13P"
 * e.g. "iPad Pro 11 M4" -> "IPD11M4"
 */
export function getModelCode(model?: string, brand?: string): string {
  if (!model) return "DEV";
  let str = model.trim().toUpperCase();

  // Strip brand prefix if already included in model (e.g. "Apple iPhone 15" -> "iPhone 15")
  if (brand) {
    const bClean = brand.trim().toUpperCase();
    if (str.startsWith(bClean)) {
      str = str.replace(new RegExp(`^${bClean}\\s*`, "i"), "");
    }
  }

  // Common replacements for concise model representations
  str = str
    .replace(/IPHONE/gi, "IP")
    .replace(/GALAXY/gi, "GAL")
    .replace(/REDMI NOTE/gi, "RN")
    .replace(/REDMI/gi, "RDM")
    .replace(/POCO/gi, "PC")
    .replace(/IPAD PRO/gi, "IPDP")
    .replace(/IPAD AIR/gi, "IPDA")
    .replace(/IPAD/gi, "IPD")
    .replace(/MACBOOK PRO/gi, "MBP")
    .replace(/MACBOOK AIR/gi, "MBA")
    .replace(/PRO MAX/gi, "PM")
    .replace(/ULTRA/gi, "U")
    .replace(/PLUS|\+/gi, "P")
    .replace(/PRO/gi, "P")
    .replace(/MINI/gi, "M")
    .replace(/LITE/gi, "LT")
    .replace(/POWERBANK/gi, "PB")
    .replace(/AIRPODS/gi, "AP")
    .replace(/SMARTWATCH/gi, "SW")
    .replace(/SERIES/gi, "S")
    .replace(/GENERATION|GEN/gi, "G")
    .replace(/5G/gi, "5G")
    .replace(/4G/gi, "4G")
    .replace(/WI-FI|WIFI/gi, "WF");

  // Remove storage text if present in model (will be handled by storage token)
  str = str.replace(/\b\d+\s*(?:GB|TB|MB)\b/gi, "");

  // Clean remaining symbols, keep alphanumeric
  const clean = str.replace(/[^A-Z0-9]/g, "");
  
  if (!clean) return "MOD";
  return clean.slice(0, 8);
}

/**
 * Extracts clean storage capacity token (e.g. 128G, 256G, 512G, 1TB)
 */
export function getStorageCode(storageOrText?: string): string | undefined {
  if (!storageOrText) return undefined;
  const match = storageOrText.toUpperCase().match(/(\d+)\s*(GB|TB|MB)/i);
  if (match) {
    const num = match[1];
    const unit = match[2].toUpperCase() === "TB" ? "TB" : "G";
    return `${num}${unit}`;
  }
  // Try matching plain number if passed storage field directly
  const plainNum = storageOrText.trim().replace(/[^0-9]/g, "");
  if (["32", "64", "128", "256", "512", "1024"].includes(plainNum)) {
    return plainNum === "1024" ? "1TB" : `${plainNum}G`;
  }
  return undefined;
}

/**
 * Checks if a generated SKU code already exists in the given inventory/existing SKUs
 */
export function isSkuDuplicate(candidate: string, existingSkus: (string | undefined | null)[]): boolean {
  if (!candidate || !existingSkus || existingSkus.length === 0) return false;
  const norm = candidate.trim().toUpperCase();
  return existingSkus.some(s => s && s.trim().toUpperCase() === norm);
}

/**
 * Generates a unique product SKU code based on category, brand, and model
 */
export function generateProductSku(params: SkuGeneratorParams): SkuComponents {
  const {
    category,
    brand,
    model,
    storage,
    color,
    type = "BARU",
    condition,
    format = "STANDARD",
    existingSkus = [],
    customSuffix
  } = params;

  const categoryCode = getCategoryCode(category, type);
  const brandCode = getBrandCode(brand);
  const modelCode = getModelCode(model, brand);

  // Extract storage from explicit storage param or from model/color string
  const storageCode = getStorageCode(storage) || 
                      getStorageCode(model) || 
                      getStorageCode(color);

  // Build type/condition token if second hand
  let typeCode = "";
  if (type === "BEKAS") {
    if (condition && condition !== "-") {
      typeCode = `G${condition.toUpperCase()}`;
    }
  }

  // Assembly core parts
  const coreParts: string[] = [categoryCode, brandCode, modelCode];
  if (storageCode) {
    coreParts.push(storageCode);
  }
  if (typeCode) {
    coreParts.push(typeCode);
  }

  let finalSku = "";
  let finalSuffix = "";

  if (customSuffix && customSuffix.trim()) {
    const cleanSuffix = customSuffix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    finalSuffix = cleanSuffix;
    finalSku = [...coreParts, cleanSuffix].join("-");
  } else {
    // Generate unique random suffix ensuring no collision
    let attempts = 0;
    let unique = false;

    while (!unique && attempts < 200) {
      attempts++;
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const candidateSuffix = randNum.toString();

      let candidateSku = "";
      if (format === "COMPACT") {
        candidateSku = `${categoryCode}${brandCode}${modelCode}${storageCode || ""}-${candidateSuffix}`;
      } else if (format === "MINIMAL") {
        candidateSku = `${brandCode}-${modelCode}-${candidateSuffix}`;
      } else {
        // STANDARD
        candidateSku = [...coreParts, candidateSuffix].join("-");
      }

      if (!isSkuDuplicate(candidateSku, existingSkus)) {
        finalSku = candidateSku;
        finalSuffix = candidateSuffix;
        unique = true;
      }
    }

    // Safety fallback
    if (!finalSku) {
      const fallbackSuffix = Date.now().toString().slice(-5);
      finalSuffix = fallbackSuffix;
      finalSku = [...coreParts, fallbackSuffix].join("-");
    }
  }

  return {
    categoryCode,
    brandCode,
    modelCode,
    storageCode,
    typeCode: typeCode || undefined,
    suffix: finalSuffix,
    fullSku: finalSku
  };
}

/**
 * Batch generate multiple unique SKUs for a product line / variant list
 */
export function generateBatchSkus(
  items: Array<{ category?: string; brand?: string; model?: string; storage?: string; color?: string; type?: "BARU" | "BEKAS"; condition?: string }>,
  existingSkus: (string | undefined | null)[] = []
): Array<SkuComponents & { itemIndex: number }> {
  const currentSkus = [...existingSkus];
  const results: Array<SkuComponents & { itemIndex: number }> = [];

  items.forEach((item, index) => {
    const gen = generateProductSku({
      ...item,
      existingSkus: currentSkus
    });
    currentSkus.push(gen.fullSku);
    results.push({
      ...gen,
      itemIndex: index
    });
  });

  return results;
}
