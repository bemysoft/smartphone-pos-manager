import React, { useState, useEffect } from "react";
import ThemeSelectorPanel from "./ThemeSelectorPanel";
import DataBackupModule from "./DataBackupModule";
import { apiFetch } from "../lib/api";
import { 
  Printer, 
  Settings, 
  Sliders, 
  FileText, 
  Layers, 
  CheckCircle, 
  RefreshCw, 
  Smartphone, 
  Wifi, 
  FileCheck,
  Building,
  MapPin,
  PhoneCall,
  ClipboardList,
  Camera,
  Database,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Award,
  User,
  QrCode,
  Tag,
  Heart,
  RotateCcw,
  LayoutGrid,
  Move,
  Check,
  Plus,
  Download,
  Trash2,
  Info,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Globe,
  Key,
  MessageSquare,
  Send,
  Clock,
  XCircle
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export type ReceiptElementId = 
  | "LOGO_HEADER" 
  | "META_INFO" 
  | "CASHIER_CUSTOMER" 
  | "WARRANTY_BOX" 
  | "PRODUCT_ITEMS" 
  | "TOTALS" 
  | "LOYALTY_POINTS" 
  | "QR_CODE" 
  | "PROMO_MESSAGE" 
  | "FOOTER_NOTES";

interface ReceiptElementMeta {
  id: ReceiptElementId;
  title: string;
  badge: string;
  description: string;
  defaultVisible: boolean;
  category: "BRANDING" | "DETAILS" | "PRODUCTS" | "PAYMENT" | "MARKETING";
}

const RECEIPT_ELEMENT_DEFS: Record<ReceiptElementId, ReceiptElementMeta> = {
  LOGO_HEADER: {
    id: "LOGO_HEADER",
    title: "Logo & Kop Informasi Toko",
    badge: "Branding",
    description: "Logo visual, Nama Toko, Alamat, No. WA & Media Sosial",
    defaultVisible: true,
    category: "BRANDING"
  },
  META_INFO: {
    id: "META_INFO",
    title: "Header Meta Invoice & Tanggal",
    badge: "Header",
    description: "Jenis Struk, Nomor Invoice & Tanggal Waktu Transaksi",
    defaultVisible: true,
    category: "DETAILS"
  },
  CASHIER_CUSTOMER: {
    id: "CASHIER_CUSTOMER",
    title: "Informasi Kasir & Pelanggan",
    badge: "Kontak",
    description: "Nama Petugas Kasir, Pembeli & Nomor HP Pelanggan",
    defaultVisible: true,
    category: "DETAILS"
  },
  WARRANTY_BOX: {
    id: "WARRANTY_BOX",
    title: "Box Detail & Syarat Garansi Toko",
    badge: "Garansi",
    description: "Judul Garansi, S&K Klaim & Jaminan Kemenperin Bea Cukai",
    defaultVisible: true,
    category: "DETAILS"
  },
  PRODUCT_ITEMS: {
    id: "PRODUCT_ITEMS",
    title: "Daftar Produk, Harga & IMEI",
    badge: "Utama",
    description: "Rincian Item HP/Aksesoris, Harga, IMEI S/N & Tag Garansi",
    defaultVisible: true,
    category: "PRODUCTS"
  },
  TOTALS: {
    id: "TOTALS",
    title: "Subtotal, Diskon & Pembayaran",
    badge: "Keuangan",
    description: "Subtotal, Diskon Promo, Total Akhir & Metode Pembayaran",
    defaultVisible: true,
    category: "PAYMENT"
  },
  LOYALTY_POINTS: {
    id: "LOYALTY_POINTS",
    title: "Poin Loyalti Member Pelanggan",
    badge: "Member",
    description: "Perolehan Poin Transaksi & Akumulasi Poin Pelanggan",
    defaultVisible: true,
    category: "MARKETING"
  },
  QR_CODE: {
    id: "QR_CODE",
    title: "QR Code Interaktif & Label",
    badge: "QR Code",
    description: "QR Code Pembayaran / Status Garansi S/N / Verification",
    defaultVisible: true,
    category: "MARKETING"
  },
  PROMO_MESSAGE: {
    id: "PROMO_MESSAGE",
    title: "Pesan Promosi & Penawaran Khusus",
    badge: "Promosi",
    description: "Teks Spanduk Promosi, Voucher & Himbauan Ulasan",
    defaultVisible: true,
    category: "MARKETING"
  },
  FOOTER_NOTES: {
    id: "FOOTER_NOTES",
    title: "Catatan Kaki & Ucapan Terima Kasih",
    badge: "Footer",
    description: "Teks Terima Kasih, Jaminan Negara & Himbauan Struk",
    defaultVisible: true,
    category: "BRANDING"
  }
};

const DEFAULT_RECEIPT_ORDER: ReceiptElementId[] = [
  "LOGO_HEADER",
  "META_INFO",
  "CASHIER_CUSTOMER",
  "WARRANTY_BOX",
  "PRODUCT_ITEMS",
  "TOTALS",
  "LOYALTY_POINTS",
  "QR_CODE",
  "PROMO_MESSAGE",
  "FOOTER_NOTES"
];

export default function PrinterConfig() {
  const [activeSubTab, setActiveSubTab] = useState<"PRINTER" | "RECEIPT_PREVIEW" | "INVOICE_TEMPLATE" | "BACKUP" | "WHATSAPP">("PRINTER");
  
  // WhatsApp Integration Settings State
  const [waConfig, setWaConfig] = useState({
    gateway: "FoneWA Cloud API Gateway",
    apiEndpoint: "https://api.fonewa.id/v1/messages/send",
    token: "token_nexus_9981a",
    instanceId: "WA-NEXUS-2026",
    shopPhone: "081234567890",
    autoNotifyTransaction: true,
  });
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; msg: string; status?: string } | null>(null);

  useEffect(() => {
    apiFetch("/api/whatsapp/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.instanceId || data.config)) {
          const c = data.config || data;
          setWaConfig({
            gateway: c.gateway || "FoneWA Cloud API Gateway",
            apiEndpoint: c.apiEndpoint || "https://api.fonewa.id/v1/messages/send",
            token: c.token || "token_nexus_9981a",
            instanceId: c.instanceId || "WA-NEXUS-2026",
            shopPhone: c.shopPhone || "081234567890",
            autoNotifyTransaction: c.autoNotifyTransaction !== false,
          });
        }
      })
      .catch((err) => console.error("Error loading WA config in settings:", err));
  }, []);

  const handleTestWaConnection = async () => {
    setIsTestingWa(true);
    setWaTestResult(null);
    try {
      const res = await apiFetch("/api/whatsapp/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: waConfig.apiEndpoint,
          token: waConfig.token,
          gateway: waConfig.gateway,
          shopPhone: waConfig.shopPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaTestResult({ success: true, msg: data.message, status: data.status || "ONLINE" });
      } else {
        setWaTestResult({ success: false, msg: data.message || "Gagal terhubung ke API Provider.", status: "OFFLINE" });
      }
    } catch (err) {
      console.error(err);
      setWaTestResult({ success: false, msg: "Terjadi kesalahan jaringan saat menguji koneksi API.", status: "OFFLINE" });
    } finally {
      setIsTestingWa(false);
    }
  };

  const handleSaveWaConfig = async () => {
    setIsSavingWa(true);
    try {
      const res = await apiFetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waConfig),
      });
      const data = await res.json();
      if (data.success) {
        alert("Konfigurasi WhatsApp Gateway Toko berhasil disimpan!");
      } else {
        alert(data.message || "Gagal menyimpan konfigurasi.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke server.");
    } finally {
      setIsSavingWa(false);
    }
  };
  
  // Printable Invoice Template customization state
  const [invNumber, setInvNumber] = useState("INV/2026/08/9981");
  const [invDate, setInvDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [invCustomerName, setInvCustomerName] = useState("Bpk. Haryono Wijaya");
  const [invCustomerPhone, setInvCustomerPhone] = useState("0819-2287-9911");
  const [invCustomerAddress, setInvCustomerAddress] = useState("Jl. Sudirman No. 45, Jakarta Selatan");
  const [invCashierName, setInvCashierName] = useState("Admin Ricky (FONEPOS)");
  const [invPaymentStatus, setInvPaymentStatus] = useState<"PAID" | "PENDING" | "PARTIAL">("PAID");
  const [invPaymentMethod, setInvPaymentMethod] = useState("QRIS Midtrans / Transfer BCA");
  const [invTaxRate, setInvTaxRate] = useState<number>(11);
  const [invShowTax, setInvShowTax] = useState<boolean>(true);
  const [invDiscount, setInvDiscount] = useState<number>(250000);
  const [invNotes, setInvNotes] = useState(
    "1. Klaim garansi wajib menyertakan bukti Invoice ini.\n2. Pembayaran via QRIS / Transfer BCA dinyatakan sah jika status transaksi LUNAS.\n3. Unit bergaransi resmi Kemenperin & Bea Cukai."
  );
  const [invQrContent, setInvQrContent] = useState("https://fonepos.id/verify/INV-20260807-9981");
  const [invQrLabel, setInvQrLabel] = useState("SCAN UNTUK KONFIRMASI PEMBAYARAN & CEK NOTA");
  const [invShowQr, setInvShowQr] = useState<boolean>(true);

  const [invItems, setInvItems] = useState<Array<{
    id: string;
    name: string;
    imei: string;
    qty: number;
    price: number;
  }>>([
    {
      id: "1",
      name: "iPhone 15 Pro Max 256GB Titanium Natural (BNIB)",
      imei: "352147108924351",
      qty: 1,
      price: 18900000
    },
    {
      id: "2",
      name: "Apple Fast Charger 20W Type-C Original",
      imei: "SN-AP20W-99214",
      qty: 1,
      price: 399000
    },
    {
      id: "3",
      name: "Tempered Glass Curved Armor 9H Protection",
      imei: "-",
      qty: 1,
      price: 150000
    }
  ]);

  const handleAddInvItem = () => {
    setInvItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "Produk / Aksesoris Tambahan",
        imei: "-",
        qty: 1,
        price: 100000
      }
    ]);
  };

  const handleRemoveInvItem = (id: string) => {
    setInvItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateInvItem = (id: string, field: string, value: any) => {
    setInvItems(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const invSubtotal = invItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const invAfterDiscount = Math.max(0, invSubtotal - invDiscount);
  const invTaxAmount = invShowTax ? Math.round(invAfterDiscount * (invTaxRate / 100)) : 0;
  const invGrandTotal = invAfterDiscount + invTaxAmount;

  const handlePrintInvoiceTemplate = () => {
    const printArea = document.getElementById("printable-invoice-template-canvas");
    if (!printArea) return;

    const printContainer = document.createElement("div");
    printContainer.id = "a4-invoice-print-root";
    printContainer.innerHTML = printArea.innerHTML;

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        #root, .fixed, .modal, [role="dialog"], aside, header, footer, .no-print {
          display: none !important;
          visibility: hidden !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        #a4-invoice-print-root {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          color: #0f172a !important;
          background: #ffffff !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }
        .no-print-btn {
          display: none !important;
        }
      }
    `;

    document.body.appendChild(style);
    document.body.appendChild(printContainer);

    setTimeout(() => {
      window.print();
      try {
        document.body.removeChild(printContainer);
        document.body.removeChild(style);
      } catch (e) {
        console.warn("Print invoice cleanup error:", e);
      }
    }, 100);
  };

  // Config states connected to LocalStorage (matching POS names)
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">(
    () => (localStorage.getItem("print_paper_width") as "58mm" | "80mm") || "58mm"
  );
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    () => (localStorage.getItem("print_font_size") as "small" | "medium" | "large") || "medium"
  );
  const [showImei, setShowImei] = useState<boolean>(
    () => localStorage.getItem("print_show_imei") !== "false"
  );
  const [showQr, setShowQr] = useState<boolean>(
    () => localStorage.getItem("print_show_qr") !== "false"
  );
  const [footerText, setFooterText] = useState<string>(
    () => localStorage.getItem("print_footer_text") || "SIMPAN STRUK UNTUK KLAIM GARANSI"
  );
  const [showShopHeader, setShowShopHeader] = useState<boolean>(
    () => localStorage.getItem("print_show_shop_header") !== "false"
  );
  const [shopTitle, setShopTitle] = useState<string>(
    () => localStorage.getItem("print_shop_title") || "FONEPOS & BUYBACK"
  );
  const [shopAddress, setShopAddress] = useState<string>(
    () => localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta"
  );
  const [invoicePrefix, setInvoicePrefix] = useState<string>(
    () => localStorage.getItem("print_invoice_prefix") || "TX"
  );
  const [shopPhone, setShopPhone] = useState<string>(
    () => localStorage.getItem("print_shop_phone") || "0812-RICKY-COMP"
  );
  const [layoutStyle, setLayoutStyle] = useState<"CLASSIC" | "MINIMAL" | "WARRANTY" | "QR_CENTRIC">(
    () => (localStorage.getItem("print_layout_style") as any) || "CLASSIC"
  );
  const [warrantyHeader, setWarrantyHeader] = useState<string>(
    () => localStorage.getItem("print_warranty_header") || "--- KARTU GARANSI ELEKTRONIK ---"
  );
  const [warrantyLine1, setWarrantyLine1] = useState<string>(
    () => localStorage.getItem("print_warranty_line1") || "IMEI teregistrasi Kemenperin Bea Cukai."
  );
  const [warrantyLine2, setWarrantyLine2] = useState<string>(
    () => localStorage.getItem("print_warranty_line2") || "Klaim garansi wajib membawa struk thermal ini."
  );
  const [thanksText, setThanksText] = useState<string>(
    () => localStorage.getItem("print_thanks_text") || "--- TERIMA KASIH ---"
  );
  const [guaranteeText, setGuaranteeText] = useState<string>(
    () => localStorage.getItem("print_guarantee_text") || "IMEI JAMINAN RESMI NEGARA"
  );
  const [autoPrint, setAutoPrint] = useState<boolean>(
    () => localStorage.getItem("print_auto_print") === "true"
  );
  
  const [storeLogo, setStoreLogo] = useState<string>(
    () => localStorage.getItem("print_store_logo") || ""
  );
  
  const [promoMessage, setPromoMessage] = useState<string>(
    () => localStorage.getItem("print_promo_message") || ""
  );

  // Additional receipt customization fields
  const [socialMedia, setSocialMedia] = useState<string>(
    () => localStorage.getItem("print_social_media") || "@fonepos.official"
  );
  const [paddingDensity, setPaddingDensity] = useState<"compact" | "normal" | "spacious">(
    () => (localStorage.getItem("print_padding_density") as any) || "normal"
  );
  const [showPoints, setShowPoints] = useState<boolean>(
    () => localStorage.getItem("print_show_points") !== "false"
  );
  const [showCashierCustomer, setShowCashierCustomer] = useState<boolean>(
    () => localStorage.getItem("print_show_cashier_customer") !== "false"
  );
  const [showKemenperinTag, setShowKemenperinTag] = useState<boolean>(
    () => localStorage.getItem("print_show_kemenperin_tag") !== "false"
  );

  // QR Code tracking & catalog link customization
  const [qrTargetType, setQrTargetType] = useState<"WARRANTY_TRACKING" | "CATALOG_ONLINE" | "INVOICE_VERIFY" | "CUSTOM_LINK">(
    () => (localStorage.getItem("print_qr_target_type") as any) || "WARRANTY_TRACKING"
  );
  const [qrCustomUrl, setQrCustomUrl] = useState<string>(
    () => localStorage.getItem("print_qr_custom_url") || "https://fonepos.id/garansi?sn="
  );
  const [qrLabel, setQrLabel] = useState<string>(
    () => localStorage.getItem("print_qr_label") || "SCAN UNTUK CEK STATUS GARANSI S/N"
  );

  // Drag & Drop Receipt Layout State
  const [elementOrder, setElementOrder] = useState<ReceiptElementId[]>(() => {
    try {
      const saved = localStorage.getItem("print_element_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const missing = DEFAULT_RECEIPT_ORDER.filter(id => !parsed.includes(id));
          return [...parsed, ...missing];
        }
      }
    } catch (e) {}
    return DEFAULT_RECEIPT_ORDER;
  });

  const [hiddenElements, setHiddenElements] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("print_hidden_elements");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [expandedEditElement, setExpandedEditElement] = useState<ReceiptElementId | null>(null);

  // Preview Mode
  const [previewMode, setPreviewMode] = useState<"POS_SALES" | "BUYBACK" | "WARRANTY">("POS_SALES");

  // Bluetooth Simulator State
  const [btDevices, setBtDevices] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [connectedBt, setConnectedBt] = useState<string>(
    () => localStorage.getItem("print_bluetooth_paired") || ""
  );

  // Save changes to localStorage on any state modification
  useEffect(() => {
    localStorage.setItem("print_paper_width", paperWidth);
  }, [paperWidth]);

  useEffect(() => {
    localStorage.setItem("print_font_size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("print_show_imei", showImei ? "true" : "false");
  }, [showImei]);

  useEffect(() => {
    localStorage.setItem("print_show_qr", showQr ? "true" : "false");
  }, [showQr]);

  useEffect(() => {
    localStorage.setItem("print_footer_text", footerText);
  }, [footerText]);

  useEffect(() => {
    localStorage.setItem("print_show_shop_header", showShopHeader ? "true" : "false");
  }, [showShopHeader]);

  useEffect(() => {
    localStorage.setItem("print_shop_title", shopTitle);
  }, [shopTitle]);

  useEffect(() => {
    localStorage.setItem("print_shop_address", shopAddress);
  }, [shopAddress]);

  useEffect(() => {
    localStorage.setItem("print_shop_phone", shopPhone);
  }, [shopPhone]);

  useEffect(() => {
    localStorage.setItem("print_invoice_prefix", invoicePrefix);
  }, [invoicePrefix]);

  useEffect(() => {
    localStorage.setItem("print_layout_style", layoutStyle);
  }, [layoutStyle]);

  useEffect(() => {
    localStorage.setItem("print_warranty_header", warrantyHeader);
  }, [warrantyHeader]);

  useEffect(() => {
    localStorage.setItem("print_warranty_line1", warrantyLine1);
  }, [warrantyLine1]);

  useEffect(() => {
    localStorage.setItem("print_warranty_line2", warrantyLine2);
  }, [warrantyLine2]);

  useEffect(() => {
    localStorage.setItem("print_thanks_text", thanksText);
  }, [thanksText]);

  useEffect(() => {
    localStorage.setItem("print_guarantee_text", guaranteeText);
  }, [guaranteeText]);

  useEffect(() => {
    localStorage.setItem("print_auto_print", autoPrint ? "true" : "false");
  }, [autoPrint]);
  
  useEffect(() => {
    localStorage.setItem("print_store_logo", storeLogo);
    localStorage.setItem("print_shop_logo_url", storeLogo);
  }, [storeLogo]);
  
  useEffect(() => {
    localStorage.setItem("print_promo_message", promoMessage);
  }, [promoMessage]);

  useEffect(() => {
    localStorage.setItem("print_social_media", socialMedia);
  }, [socialMedia]);

  useEffect(() => {
    localStorage.setItem("print_padding_density", paddingDensity);
  }, [paddingDensity]);

  useEffect(() => {
    localStorage.setItem("print_show_points", showPoints ? "true" : "false");
  }, [showPoints]);

  useEffect(() => {
    localStorage.setItem("print_show_cashier_customer", showCashierCustomer ? "true" : "false");
  }, [showCashierCustomer]);

  useEffect(() => {
    localStorage.setItem("print_show_kemenperin_tag", showKemenperinTag ? "true" : "false");
  }, [showKemenperinTag]);

  useEffect(() => {
    localStorage.setItem("print_qr_target_type", qrTargetType);
  }, [qrTargetType]);

  useEffect(() => {
    localStorage.setItem("print_qr_custom_url", qrCustomUrl);
  }, [qrCustomUrl]);

  useEffect(() => {
    localStorage.setItem("print_qr_label", qrLabel);
  }, [qrLabel]);

  useEffect(() => {
    localStorage.setItem("print_element_order", JSON.stringify(elementOrder));
  }, [elementOrder]);

  useEffect(() => {
    localStorage.setItem("print_hidden_elements", JSON.stringify(hiddenElements));
  }, [hiddenElements]);

  // Drag & Drop Handling
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (draggedIdx === null || draggedIdx === dropIndex) return;
    const newOrder = [...elementOrder];
    const [moved] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(dropIndex, 0, moved);
    setElementOrder(newOrder);
    setDraggedIdx(null);
  };

  const moveElementUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...elementOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setElementOrder(newOrder);
  };

  const moveElementDown = (index: number) => {
    if (index >= elementOrder.length - 1) return;
    const newOrder = [...elementOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setElementOrder(newOrder);
  };

  const toggleElementVisibility = (id: ReceiptElementId) => {
    setHiddenElements(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const resetElementOrder = () => {
    setElementOrder(DEFAULT_RECEIPT_ORDER);
    setHiddenElements({});
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setStoreLogo("");
  };

  // Bluetooth Search Simulation
  const startBtSearch = () => {
    setIsSearching(true);
    setBtDevices([]);
    setTimeout(() => {
      setBtDevices([
        "RPP02N-Thermal-58",
        "POS-5890-BT-Printer",
        "Zjiang-80mm-BT-Label",
        "Epson-TM-T82III"
      ]);
      setIsSearching(false);
    }, 1500);
  };

  const pairBtDevice = (name: string) => {
    setConnectedBt(name);
    localStorage.setItem("print_bluetooth_paired", name);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  const unpairBtDevice = () => {
    setConnectedBt("");
    localStorage.removeItem("print_bluetooth_paired");
  };

  // Test Print via Browser Stylesheet injection
  const handlePrintTestReceipt = () => {
    const testPrintArea = document.getElementById("simulated-test-receipt-paper");
    if (!testPrintArea) return;

    const printArea = document.createElement("div");
    printArea.id = "thermal-test-print-root";
    printArea.innerHTML = testPrintArea.innerHTML;

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        #root, .fixed, .modal, [role="dialog"], aside, header, footer, .no-print {
          display: none !important;
          visibility: hidden !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: ${paperWidth === "58mm" ? "50mm" : "72mm"} !important;
        }
        #thermal-test-print-root {
          display: block !important;
          visibility: visible !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: ${paperWidth === "58mm" ? "50mm" : "72mm"} !important;
          font-family: 'JetBrains Mono', monospace, Courier, monospace !important;
          color: #000000 !important;
          background: #ffffff !important;
          padding: 3mm !important;
          box-sizing: border-box !important;
          text-align: center !important;
          font-size: ${fontSize === "small" ? "8px" : fontSize === "medium" ? "10px" : "12px"} !important;
          line-height: 1.2 !important;
        }
        #thermal-test-print-root svg {
          display: block !important;
          margin: 2mm auto !important;
          max-width: 25mm !important;
          max-height: 25mm !important;
        }
        .dotted-line {
          border-top: 1px dashed #000000 !important;
          margin: 2mm 0 !important;
        }
      }
    `;

    document.body.appendChild(style);
    document.body.appendChild(printArea);

    setTimeout(() => {
      window.print();
      try {
        document.body.removeChild(printArea);
        document.body.removeChild(style);
      } catch (e) {
        console.warn("Print clean up error:", e);
      }
    }, 50);
  };

  // Presets Application
  const applyPreset = (presetName: "POS_STANDARD" | "WARRANTY_FULL" | "ECO_MINIMAL" | "DIGITAL_QR" | "BUYBACK_NOTE") => {
    if (presetName === "POS_STANDARD") {
      setPaperWidth("58mm");
      setFontSize("medium");
      setLayoutStyle("CLASSIC");
      setShowImei(true);
      setShowQr(true);
      setShowShopHeader(true);
      setPaddingDensity("normal");
      setShowKemenperinTag(true);
      setShowCashierCustomer(true);
      setShowPoints(true);
      setPreviewMode("POS_SALES");
      setElementOrder(DEFAULT_RECEIPT_ORDER);
      setHiddenElements({});
    } else if (presetName === "WARRANTY_FULL") {
      setPaperWidth("80mm");
      setFontSize("medium");
      setLayoutStyle("WARRANTY");
      setShowImei(true);
      setShowQr(true);
      setShowShopHeader(true);
      setPaddingDensity("spacious");
      setShowKemenperinTag(true);
      setShowCashierCustomer(true);
      setWarrantyHeader("--- KARTU GARANSI & SERVIS RESMI ---");
      setWarrantyLine1("IMEI Unit Teregistrasi Kemenperin & Bea Cukai.");
      setWarrantyLine2("Garansi Toko 14 Hari Ganti Baru + Garansi Service 1 Tahun.");
      setPreviewMode("WARRANTY");
      setElementOrder([
        "LOGO_HEADER",
        "WARRANTY_BOX",
        "META_INFO",
        "CASHIER_CUSTOMER",
        "PRODUCT_ITEMS",
        "TOTALS",
        "QR_CODE",
        "FOOTER_NOTES"
      ]);
    } else if (presetName === "ECO_MINIMAL") {
      setPaperWidth("58mm");
      setFontSize("small");
      setLayoutStyle("MINIMAL");
      setShowImei(true);
      setShowQr(false);
      setShowShopHeader(false);
      setPaddingDensity("compact");
      setShowKemenperinTag(false);
      setShowCashierCustomer(true);
      setShowPoints(false);
      setPreviewMode("POS_SALES");
      setElementOrder([
        "META_INFO",
        "PRODUCT_ITEMS",
        "TOTALS",
        "FOOTER_NOTES"
      ]);
    } else if (presetName === "DIGITAL_QR") {
      setPaperWidth("80mm");
      setFontSize("medium");
      setLayoutStyle("QR_CENTRIC");
      setShowImei(true);
      setShowQr(true);
      setShowShopHeader(true);
      setPaddingDensity("spacious");
      setShowKemenperinTag(true);
      setSocialMedia("@fonepos.official");
      setPromoMessage("Dapatkan Bonus Tempered Glass untuk Ulasan Bintang 5 di Google Maps!");
      setPreviewMode("POS_SALES");
      setElementOrder([
        "LOGO_HEADER",
        "META_INFO",
        "PRODUCT_ITEMS",
        "TOTALS",
        "QR_CODE",
        "PROMO_MESSAGE",
        "FOOTER_NOTES"
      ]);
    } else if (presetName === "BUYBACK_NOTE") {
      setPaperWidth("58mm");
      setFontSize("medium");
      setLayoutStyle("CLASSIC");
      setShowImei(true);
      setShowQr(true);
      setShowShopHeader(true);
      setPaddingDensity("normal");
      setShowCashierCustomer(true);
      setPreviewMode("BUYBACK");
      setElementOrder([
        "LOGO_HEADER",
        "META_INFO",
        "CASHIER_CUSTOMER",
        "PRODUCT_ITEMS",
        "TOTALS",
        "FOOTER_NOTES"
      ]);
    }
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    if (confirm("Kembalikan semua pengaturan printer & urutan elemen ke bawaan pabrik?")) {
      setPaperWidth("58mm");
      setFontSize("medium");
      setShowImei(true);
      setShowQr(true);
      setFooterText("SIMPAN STRUK UNTUK KLAIM GARANSI");
      setShowShopHeader(true);
      setShopTitle("FONEPOS & BUYBACK");
      setShopAddress("Roxy Mas Square Blok C2, Jakarta");
      setShopPhone("0812-RICKY-COMP");
      setSocialMedia("@fonepos.official");
      setInvoicePrefix("TX");
      setLayoutStyle("CLASSIC");
      setPaddingDensity("normal");
      setShowPoints(true);
      setShowCashierCustomer(true);
      setShowKemenperinTag(true);
      setWarrantyHeader("--- KARTU GARANSI ELEKTRONIK ---");
      setWarrantyLine1("IMEI teregistrasi Kemenperin Bea Cukai.");
      setWarrantyLine2("Klaim garansi wajib membawa struk thermal ini.");
      setThanksText("--- TERIMA KASIH ---");
      setGuaranteeText("IMEI JAMINAN RESMI NEGARA");
      setAutoPrint(false);
      resetElementOrder();
      localStorage.removeItem("print_bluetooth_paired");
      setConnectedBt("");
    }
  };

  // Render element on paper preview canvas
  const renderPaperElement = (elemId: ReceiptElementId, index: number) => {
    if (hiddenElements[elemId]) return null;

    const isDraggingThis = draggedIdx === index;
    const isDragOverThis = dragOverIdx === index;

    let content: React.ReactNode = null;

    switch (elemId) {
      case "LOGO_HEADER":
        if (!showShopHeader) return null;
        content = (
          <div className="text-center space-y-1 flex flex-col items-center">
            {storeLogo && (
              <img src={storeLogo} alt="Logo Toko" className="w-12 h-12 object-contain mb-1" style={{ filter: "grayscale(100%) contrast(120%)" }} />
            )}
            <h4 className="font-extrabold text-md uppercase tracking-tight">{shopTitle}</h4>
            <p className="text-[9px] leading-tight text-slate-800">{shopAddress}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-2 text-[9px] text-slate-800 font-bold">
              {shopPhone && <span>WA: {shopPhone}</span>}
              {socialMedia && <span>• {socialMedia}</span>}
            </div>
          </div>
        );
        break;

      case "META_INFO":
        content = (
          <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[9px] space-y-0.5">
            <p className="font-extrabold">
              {previewMode === "BUYBACK" ? "NOTA SERAH TERIMA BUYBACK HP" : previewMode === "WARRANTY" ? "KARTU GARANSI ELEKTRONIK & SERVICE" : "STRUK BUKTI PEMBAYARAN RESMI"}
            </p>
            <p>No. Invoice: {invoicePrefix}-20260714-998</p>
            <p>Tanggal: {new Date().toLocaleString("id-ID")}</p>
          </div>
        );
        break;

      case "CASHIER_CUSTOMER":
        if (!showCashierCustomer) return null;
        content = (
          <div className="border-t border-dashed border-slate-400 py-2 space-y-0.5 text-[10px] text-slate-800">
            <div className="grid grid-cols-2">
              <span>Kasir / Petugas:</span>
              <span className="text-right font-bold">Admin Ricky (FONEPOS)</span>
            </div>
            <div className="grid grid-cols-2">
              <span>Nama Pelanggan:</span>
              <span className="text-right font-bold">Bpk. Haryono Wijaya</span>
            </div>
            <div className="grid grid-cols-2">
              <span>WhatsApp Pelanggan:</span>
              <span className="text-right font-mono">0819-2287-9911</span>
            </div>
          </div>
        );
        break;

      case "WARRANTY_BOX":
        if (layoutStyle !== "WARRANTY" && previewMode !== "WARRANTY") return null;
        content = (
          <div className="bg-slate-50 border border-slate-300 p-2 rounded-lg text-[8.5px] text-slate-800 text-center font-sans space-y-0.5">
            <p className="font-extrabold uppercase text-slate-950">{warrantyHeader}</p>
            <p className="leading-tight">{warrantyLine1}</p>
            <p className="leading-tight text-slate-600">{warrantyLine2}</p>
          </div>
        );
        break;

      case "PRODUCT_ITEMS":
        content = (
          <div className="border-t border-dashed border-slate-400 py-2 space-y-2 text-[10px]">
            {previewMode === "BUYBACK" ? (
              <div className="bg-amber-50/60 border border-amber-200 p-2 rounded-lg space-y-1">
                <div className="flex justify-between font-bold text-slate-950">
                  <span>1x Samsung Galaxy S23 Ultra 512GB (Bekas)</span>
                </div>
                {showImei && (
                  <p className="text-[9px] text-slate-900 font-extrabold font-mono">IMEI Customer: 358912093481239</p>
                )}
                <div className="text-[8.5px] text-slate-700 font-sans space-y-0.5">
                  <p>• Kondisi Fisik: Grade A (Mulus Tanpa Dent)</p>
                  <p>• Kelengkapan: Fullset Original Box + Cable</p>
                  <p>• Battery Health: 94% • Garansi Resmi SEIN</p>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-amber-200/60 font-black text-amber-900">
                  <span>NILAI PENAWARAN BUYBACK:</span>
                  <span>Rp 11.200.000</span>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>1x iPhone 15 Pro Max 256GB Titanium</span>
                    <span>Rp 18.900.000</span>
                  </div>
                  {showImei && (
                    <p className="text-[9px] text-slate-800 font-extrabold font-mono">IMEI: 352147108924351</p>
                  )}
                  {showKemenperinTag && (
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1 py-0.2 rounded font-sans inline-block font-extrabold uppercase">
                      ✓ REGISTRASI KEMENPERIN & BEA CUKAI RESMI
                    </span>
                  )}
                  <div className="text-[8px] text-slate-600 font-sans">
                    Apple • BARU (BNIB) • Garansi Distributor 1 Tahun
                  </div>
                </div>

                <div className="space-y-0.5 border-t border-dashed border-slate-200 pt-1.5">
                  <div className="flex justify-between font-bold">
                    <span>1x Fast Charging Adapter 20W Type-C</span>
                    <span>Rp 399.000</span>
                  </div>
                  <div className="text-[8px] text-slate-600 font-sans">
                    Original Accessory • Garansi 6 Bulan
                  </div>
                </div>
              </>
            )}
          </div>
        );
        break;

      case "TOTALS":
        content = (
          <div className="border-t border-dashed border-slate-400 py-2 space-y-1 text-[10px]">
            {previewMode === "BUYBACK" ? (
              <>
                <div className="grid grid-cols-2 font-black text-[11px] border-t border-dashed border-slate-300 pt-1">
                  <span>TOTAL DICAIRKAN:</span>
                  <span className="text-right text-emerald-700">Rp 11.200.000</span>
                </div>
                <div className="grid grid-cols-2 text-[9px] text-slate-600 font-bold pt-1">
                  <span>METODE PENCAIRAN:</span>
                  <span className="text-right text-slate-800">TRANSFER BCA (LUNAS)</span>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2">
                  <span>SUBTOTAL BELANJA:</span>
                  <span className="text-right font-mono">Rp 19.299.000</span>
                </div>
                <div className="grid grid-cols-2 text-rose-600">
                  <span>DISKON PROMO:</span>
                  <span className="text-right font-mono">-Rp 299.000</span>
                </div>
                <div className="grid grid-cols-2 text-[11px] font-black border-t border-dashed border-slate-300 pt-1">
                  <span>TOTAL AKHIR:</span>
                  <span className="text-right text-primary-800 font-mono">Rp 19.000.000</span>
                </div>
                <div className="grid grid-cols-2 text-[9px] text-slate-600 font-bold border-t border-dashed border-slate-200 pt-1">
                  <span>METODE BAYAR:</span>
                  <span className="text-right text-slate-800">QRIS / MIDTRANS (LUNAS)</span>
                </div>
              </>
            )}
          </div>
        );
        break;

      case "LOYALTY_POINTS":
        if (!showPoints) return null;
        content = (
          <div className="py-1 px-2 bg-indigo-50/80 border border-indigo-200 rounded-lg text-center text-[8.5px] text-indigo-900 font-sans">
            ⭐ Poin Loyalti Diberikan: <strong>+190 Poin</strong> (Total Poin: 420 Poin)
          </div>
        );
        break;

      case "QR_CODE":
        if (!showQr) return null;
        content = (
          <div className="pt-2 flex flex-col items-center justify-center space-y-1 border-t border-dashed border-slate-300">
            <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-2xs">
              <QRCodeSVG
                value={
                  qrTargetType === "WARRANTY_TRACKING"
                    ? `${qrCustomUrl || "https://fonepos.id/garansi?sn="}352147108924351`
                    : qrTargetType === "CATALOG_ONLINE"
                    ? qrCustomUrl || "https://fonepos.id/katalog"
                    : qrTargetType === "CUSTOM_LINK"
                    ? qrCustomUrl || "https://fonepos.id"
                    : `${invoicePrefix}-20260714-998`
                }
                size={72}
                level="M"
              />
            </div>
            <span className="text-[8px] text-slate-600 font-mono font-bold uppercase tracking-wider text-center max-w-[240px]">
              {qrLabel || "VERIFIKASI STRUK & GARANSI ONLINE"}
            </span>
          </div>
        );
        break;

      case "PROMO_MESSAGE":
        if (!promoMessage) return null;
        content = (
          <div className="py-1 px-2 border border-slate-800 rounded font-bold text-slate-800 text-[9.5px] text-center my-1">
            {promoMessage}
          </div>
        );
        break;

      case "FOOTER_NOTES":
        content = (
          <div className="text-center pt-2.5 border-t border-dashed border-slate-400 space-y-1 text-[9px] text-slate-600">
            {thanksText && <p className="font-bold text-slate-900">{thanksText}</p>}
            {guaranteeText && <p className="text-slate-800 uppercase font-semibold">{guaranteeText}</p>}
            <p className="font-extrabold text-slate-900 leading-normal">{footerText}</p>
          </div>
        );
        break;
    }

    if (!content) return null;

    return (
      <div
        key={elemId}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        className={`relative group rounded-xl transition-all cursor-grab active:cursor-grabbing p-1.5 ${
          isDraggingThis
            ? "opacity-40 ring-2 ring-indigo-500 ring-dashed bg-indigo-50/50"
            : isDragOverThis
            ? "bg-indigo-100/80 ring-2 ring-indigo-600 scale-[1.01]"
            : "hover:bg-indigo-50/40 hover:ring-1 hover:ring-indigo-300"
        }`}
        title="Geser (Drag) untuk mengubah urutan elemen struk"
      >
        {/* Overlay Drag Badge on Hover */}
        <div className="absolute -top-2.5 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-1 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md pointer-events-none">
          <GripVertical className="h-2.5 w-2.5" />
          <span>#{index + 1} {RECEIPT_ELEMENT_DEFS[elemId]?.title}</span>
        </div>

        {content}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Switcher Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("PRINTER")}
          className={`px-5 py-2.5 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "PRINTER"
              ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border-t-2 border-primary-600 dark:border-primary-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Printer className="h-4 w-4" />
          Pengaturan Nota & Thermal
        </button>

        <button
          onClick={() => setActiveSubTab("RECEIPT_PREVIEW")}
          className={`px-5 py-2.5 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "RECEIPT_PREVIEW"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 dark:border-indigo-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <LayoutGrid className="h-4 w-4 text-indigo-500" />
          Preview Struk (Drag & Drop Editor)
        </button>

        <button
          onClick={() => setActiveSubTab("INVOICE_TEMPLATE")}
          className={`px-5 py-2.5 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "INVOICE_TEMPLATE"
              ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border-t-2 border-sky-600 dark:border-sky-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <FileCheck className="h-4 w-4 text-sky-500" />
          Template Invoice Cetak (A4 / Resmi)
        </button>

        <button
          onClick={() => setActiveSubTab("BACKUP")}
          className={`px-5 py-2.5 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "BACKUP"
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-600 dark:border-emerald-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Database className="h-4 w-4 text-emerald-500" />
          Backup & Cadangan Database
        </button>

        <button
          onClick={() => setActiveSubTab("WHATSAPP")}
          className={`px-5 py-2.5 font-bold text-xs rounded-t-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "WHATSAPP"
              ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 border-t-2 border-teal-600 dark:border-teal-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Send className="h-4 w-4 text-teal-500" />
          Integrasi WhatsApp
        </button>
      </div>

      {activeSubTab === "WHATSAPP" ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Send className="h-5 w-5 text-teal-600" />
                Integrasi WhatsApp Gateway Toko
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Atur provider API, Endpoint URL, API Key/Token, dan Nomor Pengirim WhatsApp Toko untuk pengiriman struk otomatis.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
              {waConfig.gateway}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                API Provider Gateway:
              </label>
              <select
                value={waConfig.gateway}
                onChange={(e) => setWaConfig({ ...waConfig, gateway: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
              >
                <option value="FoneWA Cloud API Gateway">FoneWA Cloud API Gateway (Recommended)</option>
                <option value="Twilio WhatsApp API">Twilio WhatsApp API</option>
                <option value="MPWA Local Gateway">MPWA Local WhatsApp Gateway</option>
                <option value="WATI / Baileys Node API">WATI / Baileys Node API</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                API Provider Endpoint URL:
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={waConfig.apiEndpoint}
                  onChange={(e) => setWaConfig({ ...waConfig, apiEndpoint: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-100"
                  placeholder="https://api.fonewa.id/v1/messages/send"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                API Key / Token Rahasia:
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={waConfig.token}
                  onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-100"
                  placeholder="Input Token / API Key..."
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Instance ID / Session ID:
              </label>
              <input
                type="text"
                value={waConfig.instanceId}
                onChange={(e) => setWaConfig({ ...waConfig, instanceId: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-100"
                placeholder="Contoh: WA-NEXUS-2026"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Nomor WhatsApp Resmi Toko (Default Business Phone):
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={waConfig.shopPhone}
                  onChange={(e) => setWaConfig({ ...waConfig, shopPhone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                  placeholder="Contoh: 081234567890"
                />
              </div>
            </div>
          </div>

          {/* Test Connection Result Banner */}
          {waTestResult && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              waTestResult.success 
                ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200" 
                : "bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
            }`}>
              {waTestResult.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-extrabold flex items-center gap-2">
                  <span>Status Server API WhatsApp:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold ${
                    waTestResult.success ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                  }`}>
                    {waTestResult.status}
                  </span>
                </p>
                <p className="text-xs">{waTestResult.msg}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={waConfig.autoNotifyTransaction}
                onChange={(e) => setWaConfig({ ...waConfig, autoNotifyTransaction: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
              />
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Otomatis kirim struk WA ke pelanggan setelah transaksi berhasil
              </span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleTestWaConnection}
                disabled={isTestingWa}
                className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                {isTestingWa ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleSaveWaConfig}
                disabled={isSavingWa}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-md shadow-teal-600/20"
              >
                {isSavingWa ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        </div>
      ) : activeSubTab === "BACKUP" ? (
        <DataBackupModule />
      ) : activeSubTab === "INVOICE_TEMPLATE" ? (
        /* PRINTABLE INVOICE TEMPLATE CUSTOMIZER & PREVIEW CANVAS */
        <div className="space-y-6">
          {/* Top Banner Header */}
          <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-sky-800/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/30 text-[10px] font-black uppercase tracking-wider">
                  📄 Printable Invoice Template
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  A4 / PDF Ready
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">Template Invoice Cetak Resmi & Bukti Transaksi</h2>
              <p className="text-xs text-sky-200 max-w-2xl">
                Kustomisasi tata letak invoice A4 dengan Logo Toko, rincian produk, nomor IMEI, kalkulasi pajak PPN, dan QR Code interaktif untuk konfirmasi pembayaran & garansi online.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePrintInvoiceTemplate}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Printer className="h-4 w-4" />
                Cetak Invoice / Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: CUSTOMIZATION CONTROLS FORM (5 COLS) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Section 1: Logo & Identitas Toko */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Building className="h-4.5 w-4.5 text-sky-600" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Identitas & Logo Toko</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Logo Toko di Invoice:</label>
                    <div className="flex items-center gap-3">
                      {storeLogo ? (
                        <img src={storeLogo} alt="Logo" className="w-12 h-12 object-contain border rounded-xl p-1 bg-slate-50" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950 border border-sky-200 text-sky-600 flex items-center justify-center font-black text-xs">
                          LOGO
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-sky-50 file:text-sky-700 cursor-pointer"
                        />
                        {storeLogo && (
                          <button
                            onClick={handleRemoveLogo}
                            className="text-[10px] text-red-500 font-bold hover:underline block mt-1 cursor-pointer"
                          >
                            Hapus Logo
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Atau Masukkan URL Gambar Logo Toko (HTTP/HTTPS):</label>
                      <input
                        type="url"
                        placeholder="https://example.com/logo-toko.png"
                        value={storeLogo}
                        onChange={(e) => setStoreLogo(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Toko:</label>
                    <input
                      type="text"
                      value={shopTitle}
                      onChange={(e) => setShopTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Alamat Toko:</label>
                    <input
                      type="text"
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">No. Telp / WA:</label>
                      <input
                        type="text"
                        value={shopPhone}
                        onChange={(e) => setShopPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Media Sosial:</label>
                      <input
                        type="text"
                        value={socialMedia}
                        onChange={(e) => setSocialMedia(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Detail Transaksi & Pelanggan */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <User className="h-4.5 w-4.5 text-sky-600" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Detail Invoice & Pelanggan</h3>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nomor Invoice:</label>
                      <input
                        type="text"
                        value={invNumber}
                        onChange={(e) => setInvNumber(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Status Bayar:</label>
                      <select
                        value={invPaymentStatus}
                        onChange={(e) => setInvPaymentStatus(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                      >
                        <option value="PAID">LUNAS (PAID)</option>
                        <option value="PENDING">PENDING / BELUM LUNAS</option>
                        <option value="PARTIAL">SEBAGIAN (PARTIAL)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tanggal Transaksi:</label>
                      <input
                        type="date"
                        value={invDate}
                        onChange={(e) => setInvDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Jatuh Tempo:</label>
                      <input
                        type="date"
                        value={invDueDate}
                        onChange={(e) => setInvDueDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Pelanggan:</label>
                      <input
                        type="text"
                        value={invCustomerName}
                        onChange={(e) => setInvCustomerName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">No. WhatsApp Pelanggan:</label>
                      <input
                        type="text"
                        value={invCustomerPhone}
                        onChange={(e) => setInvCustomerPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Alamat Pelanggan:</label>
                    <input
                      type="text"
                      value={invCustomerAddress}
                      onChange={(e) => setInvCustomerAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Kasir / Petugas:</label>
                      <input
                        type="text"
                        value={invCashierName}
                        onChange={(e) => setInvCashierName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Metode Bayar:</label>
                      <input
                        type="text"
                        value={invPaymentMethod}
                        onChange={(e) => setInvPaymentMethod(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Produk & Diskon / Pajak */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4.5 w-4.5 text-sky-600" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Item Produk Invoice</h3>
                  </div>
                  <button
                    onClick={handleAddInvItem}
                    className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer hover:bg-sky-100"
                  >
                    <Plus className="h-3.5 w-3.5" /> Item
                  </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {invItems.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-400">#{idx + 1}</span>
                        <input
                          type="text"
                          placeholder="Nama Produk / Layanan"
                          value={item.name}
                          onChange={(e) => handleUpdateInvItem(item.id, "name", e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100"
                        />
                        <button
                          onClick={() => handleRemoveInvItem(item.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Hapus Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">IMEI / S/N:</label>
                          <input
                            type="text"
                            value={item.imei}
                            onChange={(e) => handleUpdateInvItem(item.id, "imei", e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Qty:</label>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => handleUpdateInvItem(item.id, "qty", parseInt(e.target.value) || 1)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Harga Satuan (Rp):</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleUpdateInvItem(item.id, "price", parseInt(e.target.value) || 0)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Diskon Promo (Rp):</label>
                    <input
                      type="number"
                      value={invDiscount}
                      onChange={(e) => setInvDiscount(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Pajak PPN (%):</label>
                      <input
                        type="checkbox"
                        checked={invShowTax}
                        onChange={(e) => setInvShowTax(e.target.checked)}
                        className="rounded text-sky-600 cursor-pointer"
                      />
                    </div>
                    <input
                      type="number"
                      disabled={!invShowTax}
                      value={invTaxRate}
                      onChange={(e) => setInvTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: QR Code & Pembayaran Confirmation */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4.5 w-4.5 text-sky-600" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">QR Code Konfirmasi Pembayaran</h3>
                  </div>
                  <input
                    type="checkbox"
                    checked={invShowQr}
                    onChange={(e) => setInvShowQr(e.target.checked)}
                    className="rounded text-sky-600 cursor-pointer"
                  />
                </div>

                {invShowQr && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Isi URL / QRIS Payload QR Code:</label>
                      <input
                        type="text"
                        value={invQrContent}
                        onChange={(e) => setInvQrContent(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Label Keterangan QR Code:</label>
                      <input
                        type="text"
                        value={invQrLabel}
                        onChange={(e) => setInvQrLabel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Syarat & Catatan */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">Catatan & Syarat Garansi Toko:</label>
                <textarea
                  rows={3}
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE PRINTABLE A4 INVOICE CANVAS (7 COLS) */}
            <div className="lg:col-span-7 space-y-4 sticky top-6">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-sky-500" />
                  Live Preview Canvas Printable A4
                </span>
                <button
                  onClick={handlePrintInvoiceTemplate}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-[0.98] transition-all"
                >
                  <Printer className="h-4 w-4" />
                  Cetak / Simpan PDF
                </button>
              </div>

              {/* Actual Printable Invoice Container */}
              <div
                id="printable-invoice-template-canvas"
                className="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl p-8 space-y-6 mx-auto transition-all font-sans"
                style={{ minHeight: "800px" }}
              >
                {/* Header: Logo & Store Info + Invoice Badge */}
                <div className="flex justify-between items-start gap-4 border-b border-slate-200 pb-6">
                  <div className="flex items-start gap-4">
                    {storeLogo ? (
                      <img src={storeLogo} alt="Logo Toko" className="w-16 h-16 object-contain rounded-xl border border-slate-200 p-1" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-sky-600 text-white flex flex-col items-center justify-center font-black text-lg shadow-md shrink-0">
                        <span>POS</span>
                        <span className="text-[8px] font-mono tracking-widest text-sky-200">STORE</span>
                      </div>
                    )}
                    <div>
                      <h1 className="text-lg font-black uppercase text-slate-900 tracking-tight">{shopTitle}</h1>
                      <p className="text-xs text-slate-600 max-w-sm mt-0.5 leading-tight">{shopAddress}</p>
                      <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-500 font-semibold mt-1">
                        {shopPhone && <span>WhatsApp: {shopPhone}</span>}
                        {socialMedia && <span>• {socialMedia}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 font-black text-xs rounded-lg uppercase tracking-wider">
                      INVOICE / BUKTI NOTA
                    </span>
                    <p className="text-sm font-mono font-black text-slate-900">{invNumber}</p>
                    <div className="pt-1 text-[11px] text-slate-600 space-y-0.5 font-medium">
                      <p>Tanggal: <span className="font-bold text-slate-900">{invDate}</span></p>
                      <p>Jatuh Tempo: <span className="font-bold text-slate-900">{invDueDate}</span></p>
                    </div>
                  </div>
                </div>

                {/* Customer & Cashier Metadata Bar */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pelanggan (Diterbitkan Untuk):</span>
                    <p className="font-black text-slate-900 text-sm">{invCustomerName}</p>
                    <p className="text-slate-600">No. WA: <span className="font-mono font-bold text-slate-800">{invCustomerPhone}</span></p>
                    <p className="text-slate-600 leading-tight">{invCustomerAddress}</p>
                  </div>

                  <div className="space-y-1 text-right">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Detail Transaksi & Kasir:</span>
                    <p className="font-bold text-slate-800">Petugas: <span className="text-slate-900">{invCashierName}</span></p>
                    <p className="text-slate-600">Metode Bayar: <span className="font-bold text-slate-800">{invPaymentMethod}</span></p>
                    <div className="pt-1">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        invPaymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800 border-emerald-300" :
                        invPaymentStatus === "PENDING" ? "bg-amber-100 text-amber-800 border-amber-300" :
                        "bg-blue-100 text-blue-800 border-blue-300"
                      }`}>
                        STATUS: {invPaymentStatus === "PAID" ? "✓ LUNAS / PAID" : invPaymentStatus === "PENDING" ? "⏳ BELUM LUNAS" : "PARTIAL / DP"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="p-3 w-10 text-center">No</th>
                        <th className="p-3">Deskripsi Produk / Layanan</th>
                        <th className="p-3">IMEI / Serial Number</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Harga Satuan</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                      {invItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center text-slate-400 font-bold">{index + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{item.name}</td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">{item.imei || "-"}</td>
                          <td className="p-3 text-center font-bold">{item.qty}</td>
                          <td className="p-3 text-right font-mono">Rp {item.price.toLocaleString("id-ID")}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            Rp {(item.qty * item.price).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculations & Notes Grid */}
                <div className="grid grid-cols-12 gap-6 pt-2">
                  {/* Left Column: Notes & Warranty Terms */}
                  <div className="col-span-7 space-y-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                        Syarat & Ketentuan Garansi Resmi:
                      </span>
                      <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-700 leading-relaxed">
                        {invNotes}
                      </pre>
                    </div>
                  </div>

                  {/* Right Column: Totals Summary */}
                  <div className="col-span-5 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Produk:</span>
                      <span className="font-mono font-bold text-slate-900">Rp {invSubtotal.toLocaleString("id-ID")}</span>
                    </div>

                    {invDiscount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Diskon Promo:</span>
                        <span className="font-mono font-bold">-Rp {invDiscount.toLocaleString("id-ID")}</span>
                      </div>
                    )}

                    {invShowTax && (
                      <div className="flex justify-between text-slate-600">
                        <span>Pajak PPN ({invTaxRate}%):</span>
                        <span className="font-mono font-bold text-slate-900">Rp {invTaxAmount.toLocaleString("id-ID")}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center p-3 bg-slate-900 text-white rounded-xl font-black text-sm pt-3 border-t border-slate-200">
                      <span>TOTAL AKHIR:</span>
                      <span className="font-mono text-base text-sky-400">Rp {invGrandTotal.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Payment Confirmation & Signatures */}
                <div className="border-t border-dashed border-slate-300 pt-6 grid grid-cols-12 gap-6 items-center">
                  {/* QR Code Section */}
                  <div className="col-span-6 flex items-center gap-4 bg-sky-50/60 border border-sky-200 p-3.5 rounded-2xl">
                    {invShowQr && (
                      <div className="p-1 bg-white border border-slate-200 rounded-xl shrink-0 shadow-2xs">
                        <QRCodeSVG value={invQrContent} size={72} level="M" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-sky-200 text-sky-900 inline-block">
                        ✓ QR Payment & Warranty Verified
                      </span>
                      <p className="text-[10.5px] font-bold text-slate-800 leading-tight">
                        {invQrLabel}
                      </p>
                      <p className="text-[9.5px] font-mono text-slate-500 truncate max-w-[200px]">
                        {invQrContent}
                      </p>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="col-span-6 grid grid-cols-2 gap-4 text-center text-[10px]">
                    <div className="space-y-8">
                      <p className="font-bold text-slate-500 uppercase">Hormat Kami (Kasir)</p>
                      <p className="font-black text-slate-900 underline border-t border-slate-300 pt-1">
                        ( {invCashierName} )
                      </p>
                    </div>
                    <div className="space-y-8">
                      <p className="font-bold text-slate-500 uppercase">Tanda Tangan Pelanggan</p>
                      <p className="font-black text-slate-900 underline border-t border-slate-300 pt-1">
                        ( {invCustomerName} )
                      </p>
                    </div>
                  </div>
                </div>

                {/* Official Footer Stamp Note */}
                <div className="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3">
                  <p>Dokumen Invoice ini diterbitkan secara otomatis dan sah sebagai bukti pembayaran & kartu garansi resmi toko.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === "RECEIPT_PREVIEW" ? (
        /* DEDICATED PREVIEW STRUK & DRAG & DROP EDITOR TAB */
        <div className="space-y-6">
          {/* Banner Notice */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-700/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-[10px] font-black uppercase tracking-wider">
                  🎨 Interactive Struk Builder
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Sync POS
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">Editor Urutan & Preview Struk Pelanggan</h2>
              <p className="text-xs text-indigo-200 max-w-2xl">
                Geser (Drag and Drop) elemen di panel sebelah kiri atau langsung pada kertas thermal sebelah kanan untuk mengubah susunan tata letak nota transaksi sebelum dicetak secara fisik.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={resetElementOrder}
                className="px-3.5 py-2 bg-indigo-800/80 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-indigo-600 cursor-pointer transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Urutan
              </button>
              <button
                onClick={handlePrintTestReceipt}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
              >
                <Printer className="h-4 w-4" />
                Cetak Test Struk
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT SIDE: DRAG AND DROP REORDER LIST (7 COLUMNS) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
                        Urutan Elemen Struk ({elementOrder.length} Elemen)
                      </h3>
                      <p className="text-[11px] text-slate-500">Tarik titik grip atau gunakan panah atas/bawah untuk mengubah posisi</p>
                    </div>
                  </div>

                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg">
                    {elementOrder.filter(id => !hiddenElements[id]).length} Tampil • {Object.keys(hiddenElements).filter(k => hiddenElements[k]).length} Sembunyi
                  </span>
                </div>

                {/* Preset Quick Loader Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pilih Preset Layout Siap Pakai:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => applyPreset("POS_STANDARD")}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                    >
                      🛒 Standard POS
                    </button>
                    <button
                      onClick={() => applyPreset("WARRANTY_FULL")}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                    >
                      🛡️ Garansi Lengkap
                    </button>
                    <button
                      onClick={() => applyPreset("DIGITAL_QR")}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                    >
                      📱 Digital QR Focus
                    </button>
                    <button
                      onClick={() => applyPreset("BUYBACK_NOTE")}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                    >
                      🔄 Nota Buyback HP
                    </button>
                    <button
                      onClick={() => applyPreset("ECO_MINIMAL")}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                    >
                      🍃 Eco Minimalist
                    </button>
                  </div>
                </div>

                {/* Draggable Cards Stack */}
                <div className="space-y-2 pt-2">
                  {elementOrder.map((elemId, index) => {
                    const meta = RECEIPT_ELEMENT_DEFS[elemId];
                    if (!meta) return null;
                    const isHidden = hiddenElements[elemId];
                    const isEditingThis = expandedEditElement === elemId;

                    return (
                      <div
                        key={elemId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`border rounded-2xl transition-all ${
                          draggedIdx === index
                            ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/60 opacity-50 shadow-inner"
                            : dragOverIdx === index
                            ? "border-indigo-600 bg-indigo-100/80 dark:bg-indigo-900/80 scale-[1.01] shadow-lg"
                            : isHidden
                            ? "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-60"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs"
                        }`}
                      >
                        {/* Main Item Row */}
                        <div className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Drag Handle */}
                            <div 
                              className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Tarik untuk mengubah urutan"
                            >
                              <GripVertical className="h-5 w-5" />
                            </div>

                            {/* Position Index Badge */}
                            <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                              isHidden ? "bg-slate-200 dark:bg-slate-700 text-slate-500" : "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900"
                            }`}>
                              #{index + 1}
                            </span>

                            {/* Info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-xs font-black truncate ${isHidden ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100"}`}>
                                  {meta.title}
                                </h4>
                                <span className={`text-[9px] font-black px-2 py-0.2 rounded-full uppercase ${
                                  meta.category === "BRANDING" ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" :
                                  meta.category === "PRODUCTS" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                                  meta.category === "PAYMENT" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                                  meta.category === "MARKETING" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                  "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                                }`}>
                                  {meta.badge}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {meta.description}
                              </p>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Inline Edit Toggle */}
                            <button
                              onClick={() => setExpandedEditElement(isEditingThis ? null : elemId)}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isEditingThis
                                  ? "bg-indigo-600 text-white"
                                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                              title="Edit konten elemen ini"
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                            </button>

                            {/* Move Up */}
                            <button
                              disabled={index === 0}
                              onClick={() => moveElementUp(index)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Naikkan urutan"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>

                            {/* Move Down */}
                            <button
                              disabled={index === elementOrder.length - 1}
                              onClick={() => moveElementDown(index)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Turunkan urutan"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>

                            {/* Hide / Show */}
                            <button
                              onClick={() => toggleElementVisibility(elemId)}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isHidden
                                  ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
                                  : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                              }`}
                              title={isHidden ? "Tampilkan elemen ini" : "Sembunyikan elemen ini dari nota"}
                            >
                              {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Inline Collapsible Editor Panel */}
                        {isEditingThis && (
                          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 rounded-b-2xl space-y-3 animate-fadeIn">
                            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
                              ⚙️ Pengaturan Konten: {meta.title}
                            </span>

                            {elemId === "LOGO_HEADER" && (
                              <div className="space-y-3 text-xs">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Toko:</label>
                                  <input
                                    type="text"
                                    value={shopTitle}
                                    onChange={(e) => setShopTitle(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Alamat Toko:</label>
                                  <input
                                    type="text"
                                    value={shopAddress}
                                    onChange={(e) => setShopAddress(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">No. WhatsApp Toko:</label>
                                    <input
                                      type="text"
                                      value={shopPhone}
                                      onChange={(e) => setShopPhone(e.target.value)}
                                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Media Sosial (@):</label>
                                    <input
                                      type="text"
                                      value={socialMedia}
                                      onChange={(e) => setSocialMedia(e.target.value)}
                                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Upload Logo Toko:</label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleLogoUpload}
                                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
                                    />
                                    {storeLogo && (
                                      <button
                                        onClick={handleRemoveLogo}
                                        className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer"
                                      >
                                        Hapus Logo
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {elemId === "QR_CODE" && (
                              <div className="space-y-3 text-xs">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tipe QR Code:</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQrTargetType("WARRANTY_TRACKING");
                                        setQrLabel("SCAN UNTUK CEK STATUS GARANSI S/N");
                                      }}
                                      className={`p-2 rounded-xl border text-[11px] font-bold text-left cursor-pointer transition-all ${
                                        qrTargetType === "WARRANTY_TRACKING" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                      }`}
                                    >
                                      🛡️ Pelacakan Garansi
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQrTargetType("CATALOG_ONLINE");
                                        setQrLabel("SCAN UNTUK LIHAT KATALOG ONLINE");
                                      }}
                                      className={`p-2 rounded-xl border text-[11px] font-bold text-left cursor-pointer transition-all ${
                                        qrTargetType === "CATALOG_ONLINE" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                      }`}
                                    >
                                      🛍️ Katalog Toko
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Teks Label Bawah QR:</label>
                                  <input
                                    type="text"
                                    value={qrLabel}
                                    onChange={(e) => setQrLabel(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold"
                                  />
                                </div>
                              </div>
                            )}

                            {elemId === "PROMO_MESSAGE" && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Teks Pesan Promosi Toko:</label>
                                <textarea
                                  value={promoMessage}
                                  onChange={(e) => setPromoMessage(e.target.value)}
                                  rows={2}
                                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                                  placeholder="Contoh: Dapatkan gratis tempered glass untuk pembelian HP bulan ini!"
                                />
                              </div>
                            )}

                            {elemId === "WARRANTY_BOX" && (
                              <div className="space-y-2 text-xs">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Judul Garansi:</label>
                                  <input
                                    type="text"
                                    value={warrantyHeader}
                                    onChange={(e) => setWarrantyHeader(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Keterangan Baris 1:</label>
                                  <input
                                    type="text"
                                    value={warrantyLine1}
                                    onChange={(e) => setWarrantyLine1(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                                  />
                                </div>
                              </div>
                            )}

                            {elemId === "FOOTER_NOTES" && (
                              <div className="space-y-2 text-xs">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Teks Terima Kasih:</label>
                                  <input
                                    type="text"
                                    value={thanksText}
                                    onChange={(e) => setThanksText(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Catatan Garansi Footer:</label>
                                  <textarea
                                    value={footerText}
                                    onChange={(e) => setFooterText(e.target.value)}
                                    rows={2}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                                  />
                                </div>
                              </div>
                            )}

                            {!["LOGO_HEADER", "QR_CODE", "PROMO_MESSAGE", "WARRANTY_BOX", "FOOTER_NOTES"].includes(elemId) && (
                              <p className="text-[11px] text-slate-500 italic">
                                Pengaturan visibilitas & urutan posisi otomatis tersimpan. Silakan atur visibilitas melalui tombol mata di sebelah kanan.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: LIVE THERMAL RECEIPT CANVAS (5 COLUMNS) */}
            <div className="lg:col-span-5 space-y-4 sticky top-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
                      Live Thermal Paper Preview
                    </span>
                    <p className="text-[10px] text-slate-400">Geser elemen langsung pada kertas di bawah</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Paper Width Selector */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex text-[10px] font-bold">
                      <button
                        onClick={() => setPaperWidth("58mm")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${paperWidth === "58mm" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-black" : "text-slate-500"}`}
                      >
                        58mm
                      </button>
                      <button
                        onClick={() => setPaperWidth("80mm")}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${paperWidth === "80mm" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-black" : "text-slate-500"}`}
                      >
                        80mm
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mode Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-extrabold">
                  <button
                    onClick={() => setPreviewMode("POS_SALES")}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${previewMode === "POS_SALES" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    🛒 Struk Penjualan
                  </button>
                  <button
                    onClick={() => setPreviewMode("BUYBACK")}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${previewMode === "BUYBACK" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    🔄 Nota Buyback
                  </button>
                  <button
                    onClick={() => setPreviewMode("WARRANTY")}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${previewMode === "WARRANTY" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    🛡️ Nota Garansi
                  </button>
                </div>

                {/* Thermal Receipt Simulator Container */}
                <div 
                  id="simulated-test-receipt-paper"
                  className={`bg-white text-slate-950 rounded-2xl border border-slate-300 font-mono shadow-inner mx-auto select-none overflow-hidden transition-all ${
                    paddingDensity === "compact" ? "p-4 space-y-2" : paddingDensity === "spacious" ? "p-6 space-y-3.5" : "p-5 space-y-2.5"
                  }`}
                  style={{ 
                    width: paperWidth === "58mm" ? "295px" : "375px",
                    fontSize: fontSize === "small" ? "10px" : fontSize === "medium" ? "11.5px" : "13px"
                  }}
                >
                  {elementOrder.map((elemId, idx) => renderPaperElement(elemId, idx))}
                </div>

                {/* Print button */}
                <button
                  onClick={handlePrintTestReceipt}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Fisik Struk Sesuai Urutan kustom ({paperWidth})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upper overview header cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
            <Printer className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Driver Status</span>
            <h4 className="text-sm font-extrabold text-slate-800">Thermal Printer Driver</h4>
            <p className="text-[11px] text-slate-500">Kertas Aktif: {paperWidth === "58mm" ? "58mm (Thermal)" : "80mm (Invoice)"}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wifi className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Bluetooth Hardware</span>
            <h4 className="text-sm font-extrabold text-slate-800">
              {connectedBt ? "Printer Terhubung" : "Printer Bluetooth"}
            </h4>
            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
              {connectedBt ? connectedBt : "Belum dipasangkan (Simulator)"}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Layout Template</span>
            <h4 className="text-sm font-extrabold text-slate-800">
              {layoutStyle === "CLASSIC" && "Classic Thermal Standard"}
              {layoutStyle === "MINIMAL" && "Minimalist Clean Paper"}
              {layoutStyle === "WARRANTY" && "Detailed Warranty Invoice"}
              {layoutStyle === "QR_CENTRIC" && "Modern QR-Centered"}
            </h4>
            <p className="text-[11px] text-slate-500">Kerapatan: {paddingDensity}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: CONFIGURATION FORM (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Quick Presets Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Pilihan Cepat Template Struk</span>
                <h3 className="text-sm font-extrabold">Preset Pengaturan Cetak Otomatis</h3>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2.5 py-1 rounded-full">
                Auto-Save
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => applyPreset("POS_STANDARD")}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <span className="text-indigo-300 text-[10px] font-extrabold">🔥 Paling Laris</span>
                <span className="text-white font-extrabold">Standard POS (58mm)</span>
              </button>

              <button
                onClick={() => applyPreset("WARRANTY_FULL")}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <span className="text-emerald-300 text-[10px] font-extrabold">🛡️ Garansi HP</span>
                <span className="text-white font-extrabold">Nota Garansi (80mm)</span>
              </button>

              <button
                onClick={() => applyPreset("DIGITAL_QR")}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <span className="text-amber-300 text-[10px] font-extrabold">📱 Poin & QR</span>
                <span className="text-white font-extrabold">QR Promosi (80mm)</span>
              </button>

              <button
                onClick={() => applyPreset("BUYBACK_NOTE")}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-left cursor-pointer transition-all flex flex-col justify-between"
              >
                <span className="text-cyan-300 text-[10px] font-extrabold">🔄 Tukar Tambah</span>
                <span className="text-white font-extrabold">Serah Terima Buyback</span>
              </button>

              <button
                onClick={() => applyPreset("ECO_MINIMAL")}
                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-left cursor-pointer transition-all flex flex-col justify-between col-span-2 sm:col-span-1"
              >
                <span className="text-rose-300 text-[10px] font-extrabold">🍃 Hemat Kertas</span>
                <span className="text-white font-extrabold">Eco Minimalist</span>
              </button>
            </div>
          </div>

          {/* DRAG AND DROP QUICK REORDER CARD BANNER IN PRINTER TAB */}
          <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-indigo-950 dark:text-indigo-200 tracking-wider">
                    Editor Urutan Elemen Struk (Drag & Drop)
                  </h3>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                    Atur susunan logo, QR Code, garansi & promo dengan mudah
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSubTab("RECEIPT_PREVIEW")}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>Buka Interactive Builder</span>
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {/* Compact Drag-and-Drop Reorder Strip */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {elementOrder.map((elemId, idx) => (
                <div
                  key={elemId}
                  onClick={() => setActiveSubTab("RECEIPT_PREVIEW")}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    hiddenElements[elemId]
                      ? "bg-slate-200/80 dark:bg-slate-800 border-slate-300 text-slate-500 line-through"
                      : "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 shadow-2xs hover:border-indigo-500"
                  }`}
                  title="Klik untuk buka editor drag & drop lengkap"
                >
                  <GripVertical className="h-3 w-3 text-indigo-400" />
                  <span>#{idx + 1} {RECEIPT_ELEMENT_DEFS[elemId]?.badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1: Store Header Configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-primary-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Identitas & Kop Toko</h3>
              </div>
              <button
                onClick={() => setShowShopHeader(!showShopHeader)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${showShopHeader ? "bg-primary-600" : "bg-slate-200"}`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showShopHeader ? "translate-x-6" : "translate-x-1"}`}></span>
              </button>
            </div>

            {showShopHeader && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 shrink-0">
                    {storeLogo ? (
                      <img src={storeLogo} alt="Store Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Camera className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Logo Toko pada Struk</span>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs cursor-pointer shadow-2xs">
                        Pilih Gambar File
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      {storeLogo && (
                        <button
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Hapus Logo
                        </button>
                      )}
                    </div>
                    <div className="mt-2">
                      <input
                        type="url"
                        placeholder="Atau tempelkan URL gambar logo toko (https://...)"
                        value={storeLogo}
                        onChange={(e) => setStoreLogo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Nama Toko Utama</label>
                    <input
                      type="text"
                      value={shopTitle}
                      onChange={(e) => setShopTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Prefix Kode Invoice</label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 font-mono uppercase focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Alamat Toko / Cabang</label>
                  <input
                    type="text"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">No. Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Username Media Sosial</label>
                    <input
                      type="text"
                      value={socialMedia}
                      onChange={(e) => setSocialMedia(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                      placeholder="Contoh: @fonepos.official"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Thermal Printing & Paper Size */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="h-4.5 w-4.5 text-primary-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Format Kertas & Ukuran Font</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lebar Kertas Thermal</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaperWidth("58mm")}
                      className={`py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${paperWidth === "58mm" ? "bg-primary-600 border-primary-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                    >
                      58mm (Standar POS)
                    </button>
                    <button
                      onClick={() => setPaperWidth("80mm")}
                      className={`py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${paperWidth === "80mm" ? "bg-primary-600 border-primary-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                    >
                      80mm (Invoice Lebar)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Ukuran Font Struk</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["small", "medium", "large"] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`py-2 rounded-xl border text-[11px] font-bold capitalize transition-all cursor-pointer ${fontSize === size ? "bg-primary-600 border-primary-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                      >
                        {size === "small" ? "Kecil" : size === "medium" ? "Sedang" : "Besar"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margin & Density Settings */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Kerapatan Padding Baris (Density)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaddingDensity("compact")}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${paddingDensity === "compact" ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    Rapat (Hemat)
                  </button>
                  <button
                    onClick={() => setPaddingDensity("normal")}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${paddingDensity === "normal" ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    Normal (Standar)
                  </button>
                  <button
                    onClick={() => setPaddingDensity("spacious")}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${paddingDensity === "spacious" ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                  >
                    Renggang (Elegan)
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Tampilkan Nomor IMEI / Serial Unit</span>
                    <span className="text-[10px] text-slate-400 block">Wajib aktif jika Anda menjual produk HP dengan nomor IMEI unik</span>
                  </div>
                  <button
                    onClick={() => setShowImei(!showImei)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${showImei ? "bg-primary-600" : "bg-slate-200"}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showImei ? "translate-x-6" : "translate-x-1"}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Tampilkan Tag Validasi Kemenperin & Bea Cukai</span>
                    <span className="text-[10px] text-slate-400 block">Menambahkan cap keabsahan status pendaftaran IMEI resmi</span>
                  </div>
                  <button
                    onClick={() => setShowKemenperinTag(!showKemenperinTag)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${showKemenperinTag ? "bg-primary-600" : "bg-slate-200"}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showKemenperinTag ? "translate-x-6" : "translate-x-1"}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Tampilkan Info Kasir & Pelanggan</span>
                    <span className="text-[10px] text-slate-400 block">Menampilkan nama petugas kasir dan pembeli</span>
                  </div>
                  <button
                    onClick={() => setShowCashierCustomer(!showCashierCustomer)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${showCashierCustomer ? "bg-primary-600" : "bg-slate-200"}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showCashierCustomer ? "translate-x-6" : "translate-x-1"}`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Tampilkan Poin Loyalti Pelanggan</span>
                    <span className="text-[10px] text-slate-400 block">Tampilkan perolehan poin member di bagian bawah</span>
                  </div>
                  <button
                    onClick={() => setShowPoints(!showPoints)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${showPoints ? "bg-primary-600" : "bg-slate-200"}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showPoints ? "translate-x-6" : "translate-x-1"}`}></span>
                  </button>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-700 font-bold block">Tampilkan QR Code pada Struk</span>
                      <span className="text-[10px] text-slate-400 block">Sertakan QR Code interaktif di bagian bawah nota thermal</span>
                    </div>
                    <button
                      onClick={() => setShowQr(!showQr)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${showQr ? "bg-primary-600" : "bg-slate-200"}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showQr ? "translate-x-6" : "translate-x-1"}`}></span>
                    </button>
                  </div>

                  {showQr && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Tipe / Tujuan QR Code</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              setQrTargetType("WARRANTY_TRACKING");
                              setQrLabel("SCAN UNTUK CEK STATUS GARANSI S/N");
                              if (!qrCustomUrl || qrCustomUrl === "https://fonepos.id/katalog") {
                                setQrCustomUrl("https://fonepos.id/garansi?sn=");
                              }
                            }}
                            className={`p-2 rounded-lg border text-[11px] font-bold text-left transition-all cursor-pointer ${
                              qrTargetType === "WARRANTY_TRACKING"
                                ? "bg-primary-600 border-primary-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="font-extrabold flex items-center gap-1">
                              <span>🛡️ Status Garansi</span>
                            </div>
                            <p className="text-[9px] opacity-80 font-normal">Link pelacakan garansi S/N</p>
                          </button>

                          <button
                            onClick={() => {
                              setQrTargetType("CATALOG_ONLINE");
                              setQrLabel("SCAN UNTUK LIHAT KATALOG ONLINE");
                              setQrCustomUrl("https://fonepos.id/katalog");
                            }}
                            className={`p-2 rounded-lg border text-[11px] font-bold text-left transition-all cursor-pointer ${
                              qrTargetType === "CATALOG_ONLINE"
                                ? "bg-primary-600 border-primary-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="font-extrabold flex items-center gap-1">
                              <span>🛍️ Katalog Online</span>
                            </div>
                            <p className="text-[9px] opacity-80 font-normal">Link katalog produk & HP baru</p>
                          </button>

                          <button
                            onClick={() => {
                              setQrTargetType("INVOICE_VERIFY");
                              setQrLabel("VERIFIKASI STRUK & TRANSAKSI ONLINE");
                            }}
                            className={`p-2 rounded-lg border text-[11px] font-bold text-left transition-all cursor-pointer ${
                              qrTargetType === "INVOICE_VERIFY"
                                ? "bg-primary-600 border-primary-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="font-extrabold flex items-center gap-1">
                              <span>🧾 Verifikasi Invoice</span>
                            </div>
                            <p className="text-[9px] opacity-80 font-normal">ID Invoice Transaksi POS</p>
                          </button>

                          <button
                            onClick={() => {
                              setQrTargetType("CUSTOM_LINK");
                              setQrLabel("SCAN UNTUK INFORMASI LENGKAP");
                            }}
                            className={`p-2 rounded-lg border text-[11px] font-bold text-left transition-all cursor-pointer ${
                              qrTargetType === "CUSTOM_LINK"
                                ? "bg-primary-600 border-primary-600 text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="font-extrabold flex items-center gap-1">
                              <span>🔗 Custom Link URL</span>
                            </div>
                            <p className="text-[9px] opacity-80 font-normal">URL Web / Google Maps / WA</p>
                          </button>
                        </div>
                      </div>

                      {qrTargetType !== "INVOICE_VERIFY" && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            URL Base / Link Target ({qrTargetType === "WARRANTY_TRACKING" ? "Otomatis Ditambah IMEI / Invoice ID" : "URL Langsung"})
                          </label>
                          <input
                            type="text"
                            value={qrCustomUrl}
                            onChange={(e) => setQrCustomUrl(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="https://..."
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Teks Label Bawah QR Code</label>
                        <input
                          type="text"
                          value={qrLabel}
                          onChange={(e) => setQrLabel(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Contoh: SCAN UNTUK CEK STATUS GARANSI S/N"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-600 font-semibold block">Cetak Struk Otomatis (Auto-Print)</span>
                    <span className="text-[10px] text-slate-400 block">Langsung cetak struk setelah transaksi diselesaikan tanpa modal</span>
                  </div>
                  <button
                    onClick={() => setAutoPrint(!autoPrint)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${autoPrint ? "bg-primary-600" : "bg-slate-200"}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoPrint ? "translate-x-6" : "translate-x-1"}`}></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

            {/* Section 3: Policy Footer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="h-4.5 w-4.5 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Catatan Kaki Struk (Policy Footer)</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pesan Promosi (Opsional)</label>
                <textarea
                  value={promoMessage || ""}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-indigo-50/50 border border-indigo-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  placeholder="Contoh: Dapatkan diskon 10% untuk pembelian aksesoris berikutnya!"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Isi Pesan Footer (Garansi / Syarat & Ketentuan)</label>
                <textarea
                  value={footerText || ""}
                  onChange={(e) => setFooterText(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:bg-white focus:outline-none"
                  placeholder="Tuliskan syarat klaim garansi toko Anda..."
                />
              </div>
            </div>

            {/* Section 4: Bluetooth Scanner Simulator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pencarian Printer Bluetooth (Simulator)</h3>
                </div>
                {connectedBt && (
                  <button
                    onClick={unpairBtDevice}
                    className="text-[10px] text-red-500 font-extrabold bg-red-50 border border-red-100 hover:bg-red-100 px-2 py-1 rounded-lg cursor-pointer"
                  >
                    Unpair Printer
                  </button>
                )}
              </div>

              {connectedBt ? (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-emerald-800 font-black flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                      Paired & Sync Online
                    </p>
                    <p className="text-xs text-slate-700 font-bold font-mono uppercase">{connectedBt}</p>
                  </div>
                  <span className="text-[9px] bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase">
                    Connected
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    disabled={isSearching}
                    onClick={startBtSearch}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15 cursor-pointer transition-all"
                  >
                    {isSearching ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Mencari Perangkat Bluetooth Sekitar...
                      </>
                    ) : (
                      <>
                        <Wifi className="h-4 w-4" />
                        Scan Printer Bluetooth Thermal
                      </>
                    )}
                  </button>

                  {btDevices.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Perangkat Ditemukan:
                      </span>
                      <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
                        {btDevices.map((dev) => (
                          <div key={dev} className="p-3 flex justify-between items-center hover:bg-slate-100/60 transition-colors">
                            <span className="font-mono font-bold text-slate-700">{dev}</span>
                            <button
                              onClick={() => pairBtDevice(dev)}
                              className="px-3 py-1 bg-white hover:bg-primary-600 hover:text-white border border-slate-200 hover:border-primary-600 rounded-lg text-[11px] font-extrabold text-primary-600 shadow-2xs transition-all cursor-pointer"
                            >
                              Hubungkan
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 text-xs">
              <button
                onClick={handleResetDefaults}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-extrabold rounded-xl cursor-pointer active:scale-[0.98] transition-all"
              >
                Reset ke Default
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: LIVE RECEIPTS SIMULATOR & PREVIEW (5 COLUMNS) */}
          <div className="lg:col-span-5 space-y-4 sticky top-6">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Thermal Preview ({paperWidth})</span>
                <button
                  onClick={handlePrintTestReceipt}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-extrabold rounded-xl cursor-pointer flex items-center gap-1.5 active:scale-[0.97] transition-all shadow-sm shadow-primary-600/20"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak Test Struk
                </button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-xl text-[10px] font-extrabold">
                <button
                  onClick={() => setPreviewMode("POS_SALES")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${previewMode === "POS_SALES" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"}`}
                >
                  🛒 Struk Penjualan
                </button>
                <button
                  onClick={() => setPreviewMode("BUYBACK")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${previewMode === "BUYBACK" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"}`}
                >
                  🔄 Nota Buyback
                </button>
                <button
                  onClick={() => setPreviewMode("WARRANTY")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${previewMode === "WARRANTY" ? "bg-white text-slate-900 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"}`}
                >
                  🛡️ Nota Garansi
                </button>
              </div>
            </div>

            {/* Interactive simulated receipt wrapper */}
            <div 
              id="simulated-test-receipt-paper"
              className={`bg-white text-slate-950 rounded-2xl border border-slate-300 font-mono shadow-inner mx-auto select-none overflow-hidden transition-all ${
                paddingDensity === "compact" ? "p-4 space-y-2.5" : paddingDensity === "spacious" ? "p-7 space-y-4" : "p-5 space-y-3"
              }`}
              style={{ 
                width: paperWidth === "58mm" ? "295px" : "375px",
                fontSize: fontSize === "small" ? "10px" : fontSize === "medium" ? "11.5px" : "13px"
              }}
            >
              {elementOrder.map((elemId, idx) => renderPaperElement(elemId, idx))}
            </div>
            
            <div className="p-3.5 bg-primary-50/50 border border-primary-100 rounded-2xl text-[11px] text-primary-800 space-y-1">
              <p className="font-extrabold flex items-center gap-1.5 text-primary-900">
                <Sliders className="h-4 w-4 text-primary-600" />
                Sinkronisasi Otomatis Seluruh Sistem
              </p>
              <p className="text-[10.5px] text-slate-600 leading-normal">
                Semua preferensi dan urutan elemen di atas tersimpan langsung secara otomatis. Saat kasir melakukan transaksi baru di POS atau proses Buyback, nota thermal akan dicetak secara otomatis sesuai susunan elemen kustom Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
