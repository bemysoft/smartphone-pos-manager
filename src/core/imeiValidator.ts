/**
 * IMEI & Serial Number validation and SKU utilities.
 */

/**
 * Validates whether an IMEI number adheres to the standard 15-digit Luhn algorithm.
 */
export function isValidIMEI(imei: string): { isValid: boolean; reason?: string } {
  const cleaned = imei.trim().replace(/\D/g, "");

  if (cleaned.length === 0) {
    return { isValid: false, reason: "IMEI cannot be empty" };
  }

  if (cleaned.length !== 15 && cleaned.length !== 14) {
    return { isValid: false, reason: `IMEI must be 14 or 15 digits (got ${cleaned.length})` };
  }

  // If 15 digits, verify Luhn algorithm
  if (cleaned.length === 15) {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      let digit = parseInt(cleaned.charAt(i), 10);
      if (i % 2 !== 0) {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + 1;
        }
      }
      sum += digit;
    }

    if (sum % 10 !== 0) {
      return { isValid: false, reason: "Invalid IMEI checksum (Luhn check failed)" };
    }
  }

  return { isValid: true };
}

/**
 * Cleans and normalizes IMEI or Serial Number input (strips spaces, dashes, symbols).
 */
export function normalizeIMEI(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * Checks for duplicate IMEIs in a given batch.
 */
export function findDuplicateIMEIs(imeis: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const imei of imeis) {
    const normalized = normalizeIMEI(imei);
    if (!normalized) continue;
    if (seen.has(normalized)) {
      duplicates.add(normalized);
    } else {
      seen.add(normalized);
    }
  }

  return Array.from(duplicates);
}

/**
 * Generates structured SKU based on brand, model, color, and type.
 * e.g. "APL-IP15P-256-BLK-U"
 */
export function generateStructuredSku(params: {
  brand: string;
  model: string;
  category?: string;
  color?: string;
  type?: "BARU" | "BEKAS";
  storage?: string;
}): string {
  const brandCode = params.brand.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "") || "GEN";
  const modelCode = params.model.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "") || "MOD";
  const colorCode = params.color ? params.color.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  const typeCode = params.type === "BEKAS" ? "U" : "N";
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  const parts = [brandCode, modelCode];
  if (params.storage) parts.push(params.storage.toUpperCase());
  if (colorCode) parts.push(colorCode);
  parts.push(typeCode);
  parts.push(randomSuffix);

  return parts.filter(Boolean).join("-");
}
