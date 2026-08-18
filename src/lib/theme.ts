export interface ThemeOption {
  id: string;
  name: string;
  colorHex: string;
  bgHex: string;
}

export const THEME_PRESETS: ThemeOption[] = [
  { id: 'blue', name: 'Ocean Blue (Default)', colorHex: '#2563eb', bgHex: '#eff6ff' },
  { id: 'indigo', name: 'Royal Indigo', colorHex: '#4f46e5', bgHex: '#eef2ff' },
  { id: 'purple', name: 'Deep Purple', colorHex: '#9333ea', bgHex: '#faf5ff' },
  { id: 'violet', name: 'Electric Violet', colorHex: '#7c3aed', bgHex: '#f5f3ff' },
  { id: 'rose', name: 'Sunset Rose', colorHex: '#e11d48', bgHex: '#fff1f2' },
  { id: 'amber', name: 'Amber Gold', colorHex: '#d97706', bgHex: '#fffbeb' },
  { id: 'orange', name: 'Vibrant Orange', colorHex: '#ea580c', bgHex: '#fff7ed' },
  { id: 'emerald', name: 'Emerald Green', colorHex: '#059669', bgHex: '#ecfdf5' },
  { id: 'teal', name: 'Modern Teal', colorHex: '#0d9488', bgHex: '#f0fdfa' },
  { id: 'cyan', name: 'Cyan Sky', colorHex: '#0284c7', bgHex: '#f0f9ff' },
  { id: 'slate', name: 'Corporate Dark Slate', colorHex: '#475569', bgHex: '#f8fafc' },
];

/**
 * Generate 50-900 CSS variables dynamically from a custom hex color.
 */
export function applyCustomHexTheme(hex: string) {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return;

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  const mix = (factor: number) => {
    const nr = Math.round(factor >= 0 ? r + (255 - r) * factor : r * (1 + factor));
    const ng = Math.round(factor >= 0 ? g + (255 - g) * factor : g * (1 + factor));
    const nb = Math.round(factor >= 0 ? b + (255 - b) * factor : b * (1 + factor));
    return `rgb(${nr}, ${ng}, ${nb})`;
  };

  const root = document.documentElement;
  root.style.setProperty('--theme-50', mix(0.93));
  root.style.setProperty('--theme-100', mix(0.85));
  root.style.setProperty('--theme-200', mix(0.70));
  root.style.setProperty('--theme-300', mix(0.50));
  root.style.setProperty('--theme-400', mix(0.25));
  root.style.setProperty('--theme-500', mix(0.10));
  root.style.setProperty('--theme-600', `rgb(${r}, ${g}, ${b})`);
  root.style.setProperty('--theme-700', mix(-0.20));
  root.style.setProperty('--theme-800', mix(-0.40));
  root.style.setProperty('--theme-900', mix(-0.60));
}

export function clearCustomHexTheme() {
  const root = document.documentElement;
  const props = [
    '--theme-50', '--theme-100', '--theme-200', '--theme-300', '--theme-400',
    '--theme-500', '--theme-600', '--theme-700', '--theme-800', '--theme-900'
  ];
  props.forEach(p => root.style.removeProperty(p));
}

export function applyAppTheme(themeId: string, customHex?: string) {
  localStorage.setItem('app_theme_color', themeId);
  if (customHex) {
    localStorage.setItem('app_theme_custom_hex', customHex);
  }

  const root = document.documentElement;
  root.className = root.className.replace(/\btheme-[a-z0-9-]+\b/g, '').trim();

  if (themeId === 'custom' && customHex) {
    applyCustomHexTheme(customHex);
  } else {
    clearCustomHexTheme();
    if (themeId && themeId !== 'blue') {
      root.classList.add(`theme-${themeId}`);
    }
  }

  window.dispatchEvent(new Event('themechange'));
}
