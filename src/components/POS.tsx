import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Check, 
  X, 
  Zap, 
  User, 
  Phone, 
  CreditCard, 
  QrCode, 
  DollarSign, 
  Percent, 
  ShieldAlert, 
  Tag, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Settings, 
  Coins, 
  Barcode, 
  SlidersHorizontal, 
  Eye, 
  ArrowRight, 
  Lock,
  ChevronDown,
  Send,
  MessageSquare,
  Share2,
  Clock,
  Smartphone,
  Key,
  XCircle,
  AlertCircle,
  Globe,
  Wifi,
  WifiOff,
  Camera,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import { Product, UserRole, Employee } from "../types";
import { apiFetch } from "../lib/api";
import CameraBarcodeScanner from "./CameraBarcodeScanner";

interface CartItem {
  product: Product;
  selectedImei: string;
  quantity: number;
  customPrice?: number;
}

interface POSProps {
  products: Product[];
  onTransactionComplete: () => void;
  cashierUser: Employee | any;
}

// Preset Quick Sale items for common accessories with fixed price
const QUICK_SALE_ITEMS: Product[] = [
  {
    id: "qs-kabel-typec",
    tenantId: "default",
    name: "Kabel Data Type-C Fast Charge",
    brand: "Generic",
    model: "Type-C 65W",
    type: "BARU",
    category: "Aksesoris",
    priceBuy: 10000,
    priceSell: 25000,
    stock: 999,
    minStockAlert: 5,
    imeis: []
  },
  {
    id: "qs-charger-20w",
    tenantId: "default",
    name: "Adaptor Charger 20W Quick Charge",
    brand: "Generic",
    model: "Adaptor 20W",
    type: "BARU",
    category: "Aksesoris",
    priceBuy: 20000,
    priceSell: 50000,
    stock: 999,
    minStockAlert: 5,
    imeis: []
  },
  {
    id: "qs-softcase-clear",
    tenantId: "default",
    name: "Softcase Bening Premium",
    brand: "Generic",
    model: "Universal Case",
    type: "BARU",
    category: "Aksesoris",
    priceBuy: 10000,
    priceSell: 30000,
    stock: 999,
    minStockAlert: 5,
    imeis: []
  },
  {
    id: "qs-tempered-glass",
    tenantId: "default",
    name: "Tempered Glass Full Cover 9H",
    brand: "Generic",
    model: "TG Universal",
    type: "BARU",
    category: "Aksesoris",
    priceBuy: 12000,
    priceSell: 35000,
    stock: 999,
    minStockAlert: 5,
    imeis: []
  },
  {
    id: "qs-earphone-jack",
    tenantId: "default",
    name: "Earphone Handsfree Hi-Fi Bass",
    brand: "Generic",
    model: "3.5mm Earphone",
    type: "BARU",
    category: "Aksesoris",
    priceBuy: 15000,
    priceSell: 40000,
    stock: 999,
    minStockAlert: 5,
    imeis: []
  }
];

export default function POS({ products, onTransactionComplete, cashierUser }: POSProps) {
  // Authorization validation
  const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER];
  const userRole = cashierUser?.role;
  const isAuthorized = !userRole || userRole === UserRole.SUPERADMIN || allowedRoles.includes(userRole);

  // Cart & Customer States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // Sales Tracking & Toast States
  const [salesEmployees, setSalesEmployees] = useState<Employee[]>([]);
  const [selectedSalesId, setSelectedSalesId] = useState<string>("");
  const [posToast, setPosToast] = useState<{
    type: "success" | "warning" | "error" | "info";
    message: string;
  } | null>(null);

  const showPosToast = (type: "success" | "warning" | "error" | "info", message: string) => {
    setPosToast({ type, message });
    setTimeout(() => {
      setPosToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch employees list for Sales Person tracking
  useEffect(() => {
    apiFetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data)) {
          const activeEmps = data.filter((e) => e.isActive !== false);
          setSalesEmployees(activeEmps);
          if (cashierUser?.id) {
            setSelectedSalesId(cashierUser.id);
          } else if (activeEmps.length > 0) {
            setSelectedSalesId(activeEmps[0].id);
          }
        }
      })
      .catch((e) => console.error("Error fetching employees in POS:", e));
  }, [cashierUser]);

  const selectedSalesName = useMemo(() => {
    const found = salesEmployees.find((e) => e.id === selectedSalesId);
    return found ? found.name : cashierUser?.name || "Kasir";
  }, [salesEmployees, selectedSalesId, cashierUser]);
  
  // Camera Scanner & Search States
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [selectedImeis, setSelectedImeis] = useState<Record<string, string>>({});
  const [imeiModalProduct, setImeiModalProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imeiSearchTerm, setImeiSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Trade-In (Tukar Tambah) States
  const [isTradeIn, setIsTradeIn] = useState(false);
  const [tradeInBrand, setTradeInBrand] = useState("");
  const [tradeInModel, setTradeInModel] = useState("");
  const [tradeInImei, setTradeInImei] = useState("");
  const [tradeInCondition, setTradeInCondition] = useState<"A" | "B" | "C" | "D">("A");
  const [tradeInValue, setTradeInValue] = useState<number>(0);
  const [tradeInNotes, setTradeInNotes] = useState("");

  // Discounts & Tax
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"NOMINAL" | "PERCENT">("NOMINAL");
  const [includeTax, setIncludeTax] = useState(false);
  const [taxPercentage] = useState<number>(11);

  // Payment Method & Cash
  const [paymentMethod, setPaymentMethod] = useState<"TUNAI" | "TRANSFER" | "QRIS" | "MIDTRANS" | "SPLIT">("TUNAI");
  const [cashReceived, setCashReceived] = useState<number>(0);

  // Modals & Receipts
  const [showReceiptPreviewModal, setShowReceiptPreviewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [previewLastDiscount, setPreviewLastDiscount] = useState<number>(0);
  const [previewLastDiscountType, setPreviewLastDiscountType] = useState<"NOMINAL" | "PERCENT">("NOMINAL");
  const [activeReceipt, setActiveReceipt] = useState<any>(null);
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);

  // Print & POS Settings
  const [autoClearCartAfterPrint, setAutoClearCartAfterPrint] = useState<boolean>(() => {
    return localStorage.getItem("pos_auto_clear_cart") !== "false";
  });
  const [printPaperWidth, setPrintPaperWidth] = useState<"58mm" | "80mm">("58mm");
  const [printAutoPrint, setPrintAutoPrint] = useState<boolean>(true);

  // Input Focus Refs
  const productSearchRef = useRef<HTMLInputElement>(null);
  const imeiSearchRef = useRef<HTMLInputElement>(null);

  // Update setting in LocalStorage
  useEffect(() => {
    localStorage.setItem("pos_auto_clear_cart", autoClearCartAfterPrint ? "true" : "false");
  }, [autoClearCartAfterPrint]);

  // POS Navigation Tab & History
  const [posActiveTab, setPosActiveTab] = useState<"KASIR" | "RIWAYAT">("KASIR");
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoadingTxHistory, setIsLoadingTxHistory] = useState(false);
  const [txSearchQuery, setTxSearchQuery] = useState("");

  // WhatsApp Gateway Configuration Modal States
  const [showWaConfigModal, setShowWaConfigModal] = useState(false);
  const [isSavingWaConfig, setIsSavingWaConfig] = useState(false);
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; msg: string; status?: string } | null>(null);

  const [waConfig, setWaConfig] = useState({
    instanceId: "WA-NEXUS-2026",
    token: "token_nexus_9981a",
    gateway: "FoneWA Cloud API Gateway",
    apiEndpoint: "https://api.fonewa.id/v1/messages/send",
    shopPhone: "081234567890",
    isConnected: true,
    autoNotifyTransaction: true,
  });

  // Fetch WhatsApp Config from server on mount
  useEffect(() => {
    apiFetch("/api/whatsapp/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.instanceId || data.config)) {
          const c = data.config || data;
          setWaConfig({
            instanceId: c.instanceId || "WA-NEXUS-2026",
            token: c.token || "token_nexus_9981a",
            gateway: c.gateway || "FoneWA Cloud API Gateway",
            apiEndpoint: c.apiEndpoint || "https://api.fonewa.id/v1/messages/send",
            shopPhone: c.shopPhone || "081234567890",
            isConnected: c.isConnected !== false,
            autoNotifyTransaction: c.autoNotifyTransaction !== false,
          });
        }
      })
      .catch((err) => console.error("Error fetching WA config:", err));
  }, []);

  // Test WhatsApp Connection
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
        setWaTestResult({ success: false, msg: data.message || "Gagal terhubung ke server WhatsApp API.", status: "OFFLINE" });
      }
    } catch (err) {
      console.error(err);
      setWaTestResult({ success: false, msg: "Terjadi kesalahan koneksi saat menguji endpoint.", status: "OFFLINE" });
    } finally {
      setIsTestingWa(false);
    }
  };

  // Fetch Recent Transactions
  const fetchRecentTransactions = async () => {
    setIsLoadingTxHistory(true);
    try {
      const res = await apiFetch("/api/transactions");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecentTransactions(data);
      }
    } catch (err) {
      console.error("Error fetching transaction history:", err);
    } finally {
      setIsLoadingTxHistory(false);
    }
  };

  useEffect(() => {
    if (posActiveTab === "RIWAYAT") {
      fetchRecentTransactions();
    }
  }, [posActiveTab]);

  // Save WhatsApp Gateway Config
  const handleSaveWaConfig = async () => {
    setIsSavingWaConfig(true);
    try {
      const res = await apiFetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waConfig),
      });
      const data = await res.json();
      if (data.success) {
        alert("Konfigurasi Gateway WhatsApp Toko berhasil disimpan!");
        setShowWaConfigModal(false);
      } else {
        alert(data.message || "Gagal menyimpan konfigurasi WhatsApp Gateway.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke server untuk menyimpan konfigurasi.");
    } finally {
      setIsSavingWaConfig(false);
    }
  };

  // Re-send WA Struk from Transaction History Table
  const handleResendWaFromHistory = async (tx: any) => {
    const defaultTarget = tx.customerPhone && tx.customerPhone !== "-" ? tx.customerPhone : "";
    const targetPhone = prompt("Masukkan nomor WhatsApp pelanggan:", defaultTarget);
    if (!targetPhone) return;

    try {
      const res = await apiFetch("/api/whatsapp/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: tx.id,
          phone: targetPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Struk digital berhasil terkirim via API WA Toko ke ${targetPhone}!`);
        setRecentTransactions((prev) =>
          prev.map((t) => (t.id === tx.id ? { ...t, waSent: true, waStatus: "SENT", customerPhone: targetPhone } : t))
        );
      } else {
        alert(data.message || "Gagal mengirim via WhatsApp API.");
        setRecentTransactions((prev) =>
          prev.map((t) => (t.id === tx.id ? { ...t, waSent: false, waStatus: "FAILED", customerPhone: targetPhone } : t))
        );
      }
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke server WhatsApp API.");
      setRecentTransactions((prev) =>
        prev.map((t) => (t.id === tx.id ? { ...t, waSent: false, waStatus: "FAILED", customerPhone: targetPhone } : t))
      );
    }
  };

  // WhatsApp Receipt Sending States
  const [waPhoneInput, setWaPhoneInput] = useState<string>("");
  const [isSendingWa, setIsSendingWa] = useState<boolean>(false);
  const [waSendStatus, setWaSendStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Auto-sync WhatsApp target phone when active receipt updates or modal opens
  useEffect(() => {
    if (activeReceipt) {
      const defaultPhone = activeReceipt.customerPhone && activeReceipt.customerPhone !== "-" 
        ? activeReceipt.customerPhone 
        : customerPhone || "";
      setWaPhoneInput(defaultPhone);
      setWaSendStatus(null);
    }
  }, [activeReceipt, showPrintModal]);

  // Format WhatsApp Message Text
  const formatWhatsAppMessage = (receipt: any) => {
    if (!receipt) return "";
    const itemsList = (receipt.items || [])
      .map(
        (it: any, idx: number) =>
          `${idx + 1}. *${it.name}* (${it.quantity}x)\n   - Harga: Rp ${(it.priceSell || 0).toLocaleString("id-ID")}${it.imei && it.imei !== "-" ? `\n   - IMEI/SN: ${it.imei}` : ""}`
      )
      .join("\n");

    return `🧾 *STRUK PEMBAYARAN DIGITAL - NEXUSPOS SMARTPHONE*
------------------------------------------------
No. Nota   : *${receipt.id}*
Tanggal    : ${new Date(receipt.date || Date.now()).toLocaleString("id-ID")}
Pelanggan  : *${receipt.customerName || "Pelanggan Umum"}*
Kasir      : ${receipt.cashierName || "Kasir Toko"}

*Rincian Barang Belanja:*
${itemsList}

------------------------------------------------
Subtotal   : Rp ${(receipt.subtotalAmount || receipt.totalAmount || 0).toLocaleString("id-ID")}
${receipt.manualDiscount ? `Diskon     : -Rp ${receipt.manualDiscount.toLocaleString("id-ID")}\n` : ""}${receipt.tradeInValue ? `Trade-In   : -Rp ${receipt.tradeInValue.toLocaleString("id-ID")}\n` : ""}*TOTAL BAYAR: Rp ${(receipt.totalAmount || 0).toLocaleString("id-ID")}*
Metode     : *${receipt.paymentMethod || "TUNAI"}*
------------------------------------------------
_Terima kasih atas kunjungan Anda di NEXUSPOS Smartphone. Simpan pesan ini sebagai bukti garansi sah transaksi Anda._`;
  };

  // Send Invoice via Shop's MPWA API Gateway
  const handleSendWhatsAppApi = async () => {
    const target = waPhoneInput.trim();
    if (!target || target === "-") {
      setWaSendStatus({ type: "error", msg: "Masukkan nomor WhatsApp pelanggan yang valid." });
      return;
    }
    setIsSendingWa(true);
    setWaSendStatus(null);

    try {
      const res = await apiFetch("/api/whatsapp/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: activeReceipt?.id,
          phone: target,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaSendStatus({
          type: "success",
          msg: `Struk digital berhasil terkirim via API MPWA Toko ke ${target}!`,
        });
      } else {
        setWaSendStatus({
          type: "error",
          msg: data.message || "Gagal mengirim via API WhatsApp Toko.",
        });
      }
    } catch (err) {
      console.error(err);
      setWaSendStatus({
        type: "error",
        msg: "Gagal terhubung ke server API WhatsApp Toko.",
      });
    } finally {
      setIsSendingWa(false);
    }
  };

  // Open Direct WhatsApp Web / App Link
  const handleOpenDirectWhatsApp = () => {
    const target = waPhoneInput.replace(/[^0-9]/g, "");
    if (!target) {
      alert("Nomor WhatsApp tidak valid!");
      return;
    }
    let formattedPhone = target;
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.slice(1);
    }
    const message = formatWhatsAppMessage(activeReceipt);
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Filtered Product List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQuery = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.imeis && p.imeis.some(im => im.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchCategory = 
        selectedCategory === "ALL" ? true :
        selectedCategory === "BEKAS" ? p.type === "BEKAS" :
        selectedCategory === "BARU" ? p.type === "BARU" :
        p.category === selectedCategory;

      return matchQuery && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.customPrice ?? item.product.priceSell;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  // Discount Calculation
  const calculatedManualDiscount = useMemo(() => {
    let baseDiscount = 0;
    if (discountType === "PERCENT") {
      baseDiscount = Math.round((cartSubtotal * manualDiscount) / 100);
    } else {
      baseDiscount = manualDiscount;
    }
    return Math.min(baseDiscount, cartSubtotal);
  }, [cartSubtotal, manualDiscount, discountType]);

  // Preview Modal Last-Minute Discount
  const previewDiscountAmount = useMemo(() => {
    if (previewLastDiscountType === "PERCENT") {
      return Math.round((cartSubtotal * previewLastDiscount) / 100);
    }
    return previewLastDiscount;
  }, [cartSubtotal, previewLastDiscount, previewLastDiscountType]);

  const totalDiscount = calculatedManualDiscount + previewDiscountAmount;

  const taxAmount = useMemo(() => {
    if (!includeTax) return 0;
    const taxableBase = Math.max(0, cartSubtotal - totalDiscount - (isTradeIn ? tradeInValue : 0));
    return Math.round((taxableBase * taxPercentage) / 100);
  }, [includeTax, cartSubtotal, totalDiscount, isTradeIn, tradeInValue, taxPercentage]);

  const cartGrandTotal = useMemo(() => {
    const gross = cartSubtotal - totalDiscount - (isTradeIn ? tradeInValue : 0) + taxAmount;
    return Math.max(0, gross);
  }, [cartSubtotal, totalDiscount, isTradeIn, tradeInValue, taxAmount]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "TUNAI") return 0;
    return Math.max(0, cashReceived - cartGrandTotal);
  }, [paymentMethod, cashReceived, cartGrandTotal]);

  // Cart Handlers
  const handleAddToCart = (product: Product, imei: string = "") => {
    if (product.stock <= 0) {
      showPosToast("error", `Stok untuk produk "${product.name}" sedang habis!`);
      return;
    }

    setCart((prev) => {
      const hasImeis = product.imeis && product.imeis.length > 0;

      if (hasImeis) {
        let targetImei = imei ? imei.trim() : "";

        if (!targetImei) {
          // Find first available unused IMEI for this product in current cart
          const usedImeis = prev
            .filter((c) => c.product.id === product.id)
            .map((c) => c.selectedImei);
          const availableImei = product.imeis!.find((im) => !usedImeis.includes(im));

          if (!availableImei && prev.filter((c) => c.product.id === product.id).length >= product.stock) {
            showPosToast("warning", `Semua unit IMEI untuk ${product.name} (${product.stock} stok) sudah ada di keranjang!`);
            return prev;
          }

          targetImei = availableImei || product.imeis![0] || "";
        }

        // Check if targetImei is already in cart
        const existingItemWithSameImei = prev.find(
          (item) => item.product.id === product.id && item.selectedImei?.toLowerCase() === targetImei.toLowerCase()
        );

        if (existingItemWithSameImei) {
          showPosToast("warning", `Unit dengan IMEI ${targetImei} sudah ada di dalam keranjang belanja!`);
          return prev;
        }

        showPosToast("success", `Berhasil menambah ${product.name} (IMEI: ${targetImei}) ke keranjang!`);
        return [...prev, { product, selectedImei: targetImei, quantity: 1 }];
      } else {
        // Product without IMEIs (e.g., Accessories, Spareparts)
        const existingIndex = prev.findIndex((item) => item.product.id === product.id);

        if (existingIndex >= 0) {
          const existingItem = prev[existingIndex];
          if (existingItem.quantity + 1 > product.stock) {
            showPosToast("error", `Stok tidak mencukupi untuk ${product.name}. Maksimal stok: ${product.stock}`);
            return prev;
          }
          const updated = [...prev];
          updated[existingIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          };
          showPosToast("success", `Jumlah ${product.name} diperbarui (+1) di keranjang!`);
          return updated;
        } else {
          showPosToast("success", `Berhasil menambah ${product.name} ke keranjang!`);
          return [...prev, { product, selectedImei: "", quantity: 1 }];
        }
      }
    });
  };

  const handleQuickSaleAdd = (qsProduct: Product) => {
    handleAddToCart(qsProduct);
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCart((prev) => {
      const item = prev[index];
      if (newQty > item.product.stock && !item.product.id.startsWith("qs-")) {
        showPosToast("error", `Jumlah melebihi stok yang ada (${item.product.stock})`);
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => {
      const targetItem = prev[index];
      if (targetItem) {
        showPosToast("info", `Item "${targetItem.product.name}" telah dihapus dari keranjang.`);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleBarcodeOrImeiScanned = (scannedText: string) => {
    if (!scannedText || !scannedText.trim()) return;
    const clean = scannedText.trim();

    // Helper to clear both search fields
    const clearSearchFields = () => {
      setImeiSearchTerm("");
      setSearchTerm("");
    };

    // 1. Check exact or partial IMEI match
    const matchByImei = products.find((p) =>
      p.imeis && p.imeis.some((im) => im.toLowerCase() === clean.toLowerCase())
    );
    if (matchByImei) {
      handleAddToCart(matchByImei, clean);
      clearSearchFields();
      return;
    }

    // 2. Partial IMEI match (if exact 15-digit or unique IMEI partial match)
    const partialImeiMatches = products.filter((p) =>
      p.imeis && p.imeis.some((im) => im.toLowerCase().includes(clean.toLowerCase()))
    );
    if (partialImeiMatches.length === 1 && clean.length >= 8) {
      const p = partialImeiMatches[0];
      const matchedImei = p.imeis!.find((im) => im.toLowerCase().includes(clean.toLowerCase())) || p.imeis![0];
      handleAddToCart(p, matchedImei);
      clearSearchFields();
      return;
    }

    // 3. Check SKU / ID match
    const matchBySkuOrId = products.find((p) =>
      p.id.toLowerCase() === clean.toLowerCase() ||
      (p as any).sku?.toLowerCase() === clean.toLowerCase()
    );
    if (matchBySkuOrId) {
      handleAddToCart(matchBySkuOrId, matchBySkuOrId.imeis?.[0] || "");
      clearSearchFields();
      return;
    }

    // 4. Check Name or Model match
    const matchByName = products.find((p) =>
      p.name.toLowerCase().includes(clean.toLowerCase()) ||
      p.model.toLowerCase().includes(clean.toLowerCase())
    );
    if (matchByName) {
      handleAddToCart(matchByName, matchByName.imeis?.[0] || "");
      clearSearchFields();
      return;
    }

    // 5. Quick Sale Accessories check
    const matchQuickSale = QUICK_SALE_ITEMS.find((qs) =>
      qs.id.toLowerCase() === clean.toLowerCase() ||
      qs.name.toLowerCase().includes(clean.toLowerCase())
    );
    if (matchQuickSale) {
      handleAddToCart(matchQuickSale, "");
      clearSearchFields();
      return;
    }

    showPosToast("error", `Unit / Barcode / IMEI "${clean}" tidak ditemukan.`);
  };

  const handleImeiScanSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imeiSearchTerm.trim()) return;
    handleBarcodeOrImeiScanned(imeiSearchTerm);
  };

  // Process Checkout Trigger Preview Modal
  const handleOpenReceiptPreview = () => {
    if (cart.length === 0) {
      alert("Keranjang belanja masih kosong!");
      return;
    }

    if (paymentMethod === "TUNAI" && cashReceived < cartGrandTotal) {
      setCashReceived(cartGrandTotal);
    }

    setPreviewLastDiscount(0);
    setPreviewLastDiscountType("NOMINAL");
    setShowReceiptPreviewModal(true);
  };

  // Confirm Final Transaction
  const handleFinalCheckout = async () => {
    setIsCheckoutProcessing(true);

    const transactionPayload = {
      tenantId: cashierUser?.tenantId || "DEFAULT",
      customerId: "CUST-GENERIC",
      customerName: customerName.trim() || "Pelanggan Umum",
      customerPhone: customerPhone.trim() || "-",
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        model: item.product.model,
        type: item.product.type,
        imei: item.selectedImei || "-",
        priceSell: item.customPrice ?? item.product.priceSell,
        quantity: item.quantity,
      })),
      subtotalAmount: cartSubtotal,
      manualDiscount: totalDiscount,
      taxPpnPercentage: includeTax ? taxPercentage : 0,
      taxPpnAmount: taxAmount,
      totalAmount: cartGrandTotal,
      paymentMethod,
      paymentStatus: "PAID",
      cashierId: cashierUser?.id || "EMP001",
      cashierName: cashierUser?.name || "Kasir",
      salesId: selectedSalesId || cashierUser?.id || "EMP001",
      salesName: selectedSalesName || cashierUser?.name || "Kasir",
      date: new Date().toISOString(),
      isTradeIn,
      tradeInBrandModel: isTradeIn ? `${tradeInBrand} ${tradeInModel}` : undefined,
      tradeInImei: isTradeIn ? tradeInImei : undefined,
      tradeInCondition: isTradeIn ? tradeInCondition : undefined,
      tradeInValue: isTradeIn ? tradeInValue : undefined,
      tradeInNotes: isTradeIn ? tradeInNotes : undefined,
      notes: `Metode Pembayaran: ${paymentMethod} | Uang Diterima: Rp ${cashReceived.toLocaleString("id-ID")}`
    };

    try {
      const res = await apiFetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionPayload),
      });

      const data = await res.json();
      
      const createdTx = data.success ? data.transaction : {
        ...transactionPayload,
        id: `INV-${Date.now()}`
      };

      setActiveReceipt(createdTx);
      setShowReceiptPreviewModal(false);

      // Auto-send WhatsApp Receipt if enabled and phone is provided
      if (waConfig.autoNotifyTransaction && createdTx.customerPhone && createdTx.customerPhone !== "-") {
        apiFetch("/api/whatsapp/send-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: createdTx.id,
            phone: createdTx.customerPhone,
          }),
        })
          .then((r) => r.json())
          .then((wRes) => {
            if (wRes.success) {
              setWaSendStatus({
                type: "success",
                msg: `Struk digital otomatis terkirim via API WA Toko ke ${createdTx.customerPhone}!`,
              });
              createdTx.waSent = true;
            }
          })
          .catch((err) => console.error("Auto WA send failed:", err));
      }

      // Trigger App.tsx global state refetching
      if (onTransactionComplete) {
        onTransactionComplete();
      }

      // Check auto clear option
      if (autoClearCartAfterPrint) {
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setIsTradeIn(false);
        setTradeInBrand("");
        setTradeInModel("");
        setTradeInImei("");
        setTradeInValue(0);
        setTradeInNotes("");
        setManualDiscount(0);
        setCashReceived(0);
      }

      // Show Print Modal
      setShowPrintModal(true);
    } catch (err) {
      console.error("Error submitting transaction:", err);
      // Fallback local receipt preview for offline mode
      const fallbackTx = {
        ...transactionPayload,
        id: `INV-OFFLINE-${Date.now()}`
      };
      setActiveReceipt(fallbackTx);
      setShowReceiptPreviewModal(false);
      
      if (onTransactionComplete) {
        onTransactionComplete();
      }

      if (autoClearCartAfterPrint) {
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setManualDiscount(0);
        setCashReceived(0);
      }
      setShowPrintModal(true);
    } finally {
      setIsCheckoutProcessing(false);
    }
  };

  // Browser Print Trigger
  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  // If role is unauthorized
  if (!isAuthorized) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-2xl mb-4 border border-rose-200 dark:border-rose-900">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Akses Terbatas Modul Kasir POS</h2>
        <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
          Modul ini hanya dapat diakses oleh Kasir, Manager, atau Admin toko. Silakan login menggunakan akun kasir berwenang.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {posToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md ${
              posToast.type === "success"
                ? "bg-slate-900 text-emerald-300 border-emerald-500/50"
                : posToast.type === "warning"
                ? "bg-slate-900 text-amber-300 border-amber-500/50"
                : "bg-slate-900 text-rose-300 border-rose-500/50"
            }`}
          >
            {posToast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
            {posToast.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />}
            {posToast.type === "error" && <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />}
            <p className="text-xs font-bold leading-snug text-white">{posToast.message}</p>
            <button
              type="button"
              onClick={() => setPosToast(null)}
              className="ml-auto text-xs font-black text-slate-400 hover:text-white cursor-pointer p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top POS Header & Quick Stats */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/50 text-primary-600 rounded-xl border border-primary-200/50 dark:border-primary-800">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Kasir Point of Sale (POS)</h1>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                Online Terminal
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Operator Kasir: <strong className="text-slate-700 dark:text-slate-200">{cashierUser?.name || "Kasir"}</strong> ({cashierUser?.role || "CASHIER"})
            </p>
          </div>
        </div>

        {/* Barcode / IMEI Fast Scan Header Input */}
        <form onSubmit={handleImeiScanSearch} className="w-full lg:w-auto flex items-center gap-2">
          <div className="relative flex-1 lg:w-72">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={imeiSearchRef}
              id="pos-imei-scan"
              type="text"
              placeholder="Scan Barcode / Input IMEI..."
              value={imeiSearchTerm}
              onChange={(e) => setImeiSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Scan Unit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0"
            title="Pindai Barcode / IMEI Produk via Lensa Kamera"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Kamera</span>
          </button>
        </form>
      </div>

      {/* POS Navigation Tabs & Gateway Settings Button Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setPosActiveTab("KASIR")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 ${
              posActiveTab === "KASIR"
                ? "bg-primary-600 text-white shadow-xs"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Terminal Kasir POS</span>
          </button>

          <button
            type="button"
            onClick={() => setPosActiveTab("RIWAYAT")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 ${
              posActiveTab === "RIWAYAT"
                ? "bg-primary-600 text-white shadow-xs"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-4 w-4 text-emerald-500" />
            <span>Riwayat & Status Struk WA</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowWaConfigModal(true)}
          className="w-full sm:w-auto px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <Settings className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Pengaturan WA Toko</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
        </button>
      </div>

      {/* VIEW MODE 1: KASIR TERMINAL */}
      {posActiveTab === "KASIR" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Products Catalogue & Quick Sale (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Quick Sale Bar (Aksesoris Harga Tetap Cepat) */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800/80 p-4 rounded-2xl border border-amber-200/60 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-600 fill-amber-500" />
                <h3 className="text-xs font-extrabold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                  Quick Sale - Aksesoris Cepat (Harga Tetap)
                </h3>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                Klik untuk tambah ke keranjang tanpa cari
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {QUICK_SALE_ITEMS.map((qs) => (
                <button
                  key={qs.id}
                  type="button"
                  onClick={() => handleQuickSaleAdd(qs)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 border border-amber-200 dark:border-slate-700 text-amber-900 dark:text-amber-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-600" />
                  <span>{qs.name}</span>
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-slate-700 text-amber-800 dark:text-amber-300 rounded font-extrabold text-[10px]">
                    Rp {qs.priceSell.toLocaleString("id-ID")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search, Category Filters & Layout Switcher */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={productSearchRef}
                  id="pos-product-search"
                  type="text"
                  placeholder="Cari produk, merek, tipe, atau IMEI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (searchTerm.trim()) {
                        handleBarcodeOrImeiScanned(searchTerm);
                      }
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "grid" 
                      ? "bg-primary-600 border-primary-600 text-white shadow-xs" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                  title="Tampilan Grid Kartu"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "table" 
                      ? "bg-primary-600 border-primary-600 text-white shadow-xs" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                  title="Tampilan Tabel Rinci"
                >
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "ALL", label: "Semua Produk" },
                { id: "BARU", label: "Smartphone Baru" },
                { id: "BEKAS", label: "Smartphone Bekas" },
                { id: "Aksesoris", label: "Aksesoris" },
                { id: "Sparepart", label: "Sparepart" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-primary-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product View (Grid or Table) */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">Produk tidak ditemukan</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        p.type === "BEKAS"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      }`}>
                        {p.type} {p.condition && p.condition !== "-" ? `(Grade ${p.condition})` : ""}
                      </span>
                      <span className={`text-[11px] font-bold ${p.stock > 0 ? "text-slate-500" : "text-rose-500"}`}>
                        Stok: {p.stock}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {p.brand} {p.model}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Harga Jual</span>
                      <span className="text-sm font-extrabold text-primary-600 dark:text-primary-400">
                        Rp {p.priceSell.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      disabled={p.stock <= 0}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">Produk</th>
                      <th className="p-3">Tipe / Kategori</th>
                      <th className="p-3">Stok</th>
                      <th className="p-3">Harga Jual</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.brand} {p.model}</p>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            p.type === "BEKAS" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                          {p.stock}
                        </td>
                        <td className="p-3 font-extrabold text-primary-600">
                          Rp {p.priceSell.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            disabled={p.stock <= 0}
                            className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            + Tambah
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Shopping Cart Panel & Summary (4-5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 space-y-4 shadow-sm sticky top-6">
          
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Keranjang Transaksi
              </h3>
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 rounded-full text-[10px] font-bold">
                {cart.length} Item
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Customer & Sales Person Input Section */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Konsumen</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pelanggan Umum"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">No. WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Penanggung Jawab Sales</label>
              <div className="relative">
                <UserCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                <select
                  value={selectedSalesId}
                  onChange={(e) => setSelectedSalesId(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  {salesEmployees.length === 0 ? (
                    <option value={cashierUser?.id || "EMP001"}>{cashierUser?.name || "Kasir (Log In)"}</option>
                  ) : (
                    salesEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id} - {emp.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Cart Item List with Swipe-to-Delete */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <ShoppingCart className="h-8 w-8 mx-auto mb-1 opacity-30" />
                <p className="text-xs font-semibold">Keranjang masih kosong</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1">
                  <span>Daftar Barang ({cart.length})</span>
                  <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-bold bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full border border-primary-200/50 dark:border-primary-800/50">
                    <span>👈 Geser kiri untuk hapus</span>
                  </span>
                </div>

                <AnimatePresence mode="popLayout">
                  {cart.map((item, idx) => {
                    const itemPrice = item.customPrice ?? item.product.priceSell;
                    const hasImeis = item.product.imeis && item.product.imeis.length > 0;
                    const itemKey = `cart-${item.product.id}-${item.selectedImei || idx}`;

                    return (
                      <motion.div
                        key={itemKey}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -100, height: 0, marginBottom: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="relative overflow-hidden rounded-xl group"
                      >
                        {/* Red Swipe Delete Background Layer */}
                        <div className="absolute inset-0 bg-gradient-to-l from-rose-600 via-rose-500 to-rose-600 rounded-xl flex items-center justify-end px-4 text-white font-extrabold text-xs gap-2 shadow-inner">
                          <span className="text-[11px]">Hapus Item</span>
                          <Trash2 className="h-4 w-4 animate-pulse shrink-0" />
                        </div>

                        {/* Foreground Swipable Card */}
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: -110, right: 0 }}
                          dragElastic={{ left: 0.15, right: 0 }}
                          dragSnapToOrigin
                          onDragEnd={(_, info) => {
                            if (info.offset.x < -70 || info.velocity.x < -300) {
                              handleRemoveItem(idx);
                            }
                          }}
                          className="bg-slate-50 dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2 relative z-10 touch-pan-y shadow-xs cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {item.product.name}
                              </h5>
                              <p className="text-[10px] font-semibold text-slate-400">
                                Rp {itemPrice.toLocaleString("id-ID")}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                                  title="Kurangi Jumlah"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="px-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                                  title="Tambah Jumlah"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                title="Hapus Item"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Inline IMEI Dropdown directly inside cart row */}
                          {hasImeis && (
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1 shrink-0">
                                <Barcode className="h-3 w-3 text-primary-500" />
                                IMEI:
                              </span>
                              <select
                                value={item.selectedImei || ""}
                                onChange={(e) => {
                                  const newImei = e.target.value;
                                  const isUsedElsewhere = cart.some(
                                    (c, cIdx) => cIdx !== idx && c.product.id === item.product.id && c.selectedImei === newImei
                                  );
                                  if (isUsedElsewhere) {
                                    showPosToast("warning", `IMEI ${newImei} sudah dipilih pada baris lain di keranjang!`);
                                    return;
                                  }
                                  setCart((prev) => {
                                    const updated = [...prev];
                                    updated[idx] = { ...updated[idx], selectedImei: newImei };
                                    return updated;
                                  });
                                }}
                                className="flex-1 text-[11px] py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                              >
                                {(!item.selectedImei || !item.product.imeis?.includes(item.selectedImei)) && (
                                  <option value="" disabled>-- Pilih IMEI --</option>
                                )}
                                {item.product.imeis?.map((im) => (
                                  <option key={im} value={im}>
                                    {im}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Trade-In (Tukar Tambah) Toggle & Panel */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isTradeIn}
                onChange={(e) => setIsTradeIn(e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <Coins className="h-4 w-4 text-amber-500" />
              <span>Sertakan Tukar Tambah (Trade-In) HP Bekas</span>
            </label>

            {isTradeIn && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Merek (e.g. Samsung)"
                    value={tradeInBrand}
                    onChange={(e) => setTradeInBrand(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Model (e.g. A54)"
                    value={tradeInModel}
                    onChange={(e) => setTradeInModel(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="IMEI HP Bekas"
                    value={tradeInImei}
                    onChange={(e) => setTradeInImei(e.target.value)}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Nilai Taksiran (Rp)"
                    value={tradeInValue || ""}
                    onChange={(e) => setTradeInValue(Number(e.target.value))}
                    className="p-1.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-lg text-xs font-bold text-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Discount & Tax Options */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Diskon Manual:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={manualDiscount || ""}
                  onChange={(e) => setManualDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-right"
                />
                <button
                  type="button"
                  onClick={() => setDiscountType(discountType === "NOMINAL" ? "PERCENT" : "NOMINAL")}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-extrabold cursor-pointer"
                >
                  {discountType === "NOMINAL" ? "Rp" : "%"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={includeTax}
                  onChange={(e) => setIncludeTax(e.target.checked)}
                  className="rounded text-primary-600"
                />
                <span>Termasuk PPN ({taxPercentage}%)</span>
              </label>
              {includeTax && (
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rp {taxAmount.toLocaleString("id-ID")}
                </span>
              )}
            </div>
          </div>

          {/* POS Auto-Clear Cart Option Setting */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Auto-clear Cart setelah Cetak:</span>
            <button
              type="button"
              onClick={() => setAutoClearCartAfterPrint(!autoClearCartAfterPrint)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                autoClearCartAfterPrint 
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {autoClearCartAfterPrint ? "AKTIF (ON)" : "NONAKTIF (OFF)"}
            </button>
          </div>

          {/* Payment Method Selector */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">Metode Pembayaran:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "TUNAI", label: "Tunai", icon: <DollarSign className="h-3.5 w-3.5" /> },
                { id: "TRANSFER", label: "Transfer", icon: <CreditCard className="h-3.5 w-3.5" /> },
                { id: "QRIS", label: "QRIS", icon: <QrCode className="h-3.5 w-3.5" /> }
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === pm.id
                      ? "bg-primary-600 border-primary-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {pm.icon}
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grand Total Breakdown */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Subtotal:</span>
              <span>Rp {cartSubtotal.toLocaleString("id-ID")}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-rose-400">
                <span>Total Diskon:</span>
                <span>- Rp {totalDiscount.toLocaleString("id-ID")}</span>
              </div>
            )}
            {isTradeIn && tradeInValue > 0 && (
              <div className="flex justify-between text-xs text-amber-400">
                <span>Tukar Tambah:</span>
                <span>- Rp {tradeInValue.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">TOTAL BAYAR:</span>
              <span className="text-lg font-black text-emerald-400">
                Rp {cartGrandTotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Action Button: Receipt Preview Modal */}
          <button
            type="button"
            onClick={handleOpenReceiptPreview}
            disabled={cart.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Eye className="h-4 w-4" />
            <span>Preview Struk & Lanjut Bayar</span>
          </button>
        </div>
      </div>
      )}

      {/* VIEW MODE 2: RIWAYAT TRANSAKSI & STATUS STRUK WA */}
      {posActiveTab === "RIWAYAT" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Riwayat Transaksi & Status Pengiriman WA
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifikasi status pengiriman struk digital ke WhatsApp pelanggan pasca-transaksi
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nota, Pelanggan, No WA..."
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100"
                />
              </div>
              <button
                type="button"
                onClick={fetchRecentTransactions}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingTxHistory ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">No. Nota</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Pelanggan</th>
                  <th className="p-3">No. WA</th>
                  <th className="p-3">Total Bayar</th>
                  <th className="p-3">Metode</th>
                  <th className="p-3 text-center">Status WA</th>
                  <th className="p-3 text-center">Aksi Kirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                ) : (
                  recentTransactions
                    .filter((t) => {
                      if (!txSearchQuery.trim()) return true;
                      const q = txSearchQuery.toLowerCase();
                      return (
                        (t.id && t.id.toLowerCase().includes(q)) ||
                        (t.customerName && t.customerName.toLowerCase().includes(q)) ||
                        (t.customerPhone && t.customerPhone.includes(q))
                      );
                    })
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{tx.id}</td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {new Date(tx.date || Date.now()).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {tx.customerName || "Pelanggan Umum"}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{tx.customerPhone || "-"}</td>
                        <td className="p-3 font-extrabold text-emerald-600">
                          Rp {(tx.totalAmount || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{tx.paymentMethod}</td>
                        <td className="p-3 text-center">
                          {tx.waStatus === "SENT" || tx.waSent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Sent
                            </span>
                          ) : tx.waStatus === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-extrabold border border-rose-200 dark:border-rose-800">
                              <XCircle className="h-3.5 w-3.5 text-rose-600" /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800">
                              <Clock className="h-3.5 w-3.5 text-amber-600" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleResendWaFromHistory(tx)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                            title="Kirim Struk via API WA Toko"
                          >
                            <Send className="h-3 w-3" />
                            <span>{tx.waSent ? "Kirim Ulang" : "Kirim WA"}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 0: WHATSAPP GATEWAY SETTINGS MODAL */}
      {showWaConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Pengaturan API & Gateway WA Toko
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWaConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Penyedia Gateway / API Provider:
                </label>
                <select
                  value={waConfig.gateway}
                  onChange={(e) => setWaConfig({ ...waConfig, gateway: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100"
                >
                  <option value="FoneWA Cloud API Gateway">FoneWA Cloud API Gateway (Recommended)</option>
                  <option value="Twilio WhatsApp API">Twilio WhatsApp API</option>
                  <option value="MPWA Local Gateway">MPWA Local WhatsApp Gateway</option>
                  <option value="WATI / Baileys Node API">WATI / Baileys Node API</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  API Provider Endpoint URL:
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={waConfig.apiEndpoint}
                    onChange={(e) => setWaConfig({ ...waConfig, apiEndpoint: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-100"
                    placeholder="https://api.fonewa.id/v1/messages/send"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  API Key / Token Rahasia:
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={waConfig.token}
                    onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-100"
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

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nomor WhatsApp Resmi Toko (Default Business Phone):
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={waConfig.shopPhone}
                    onChange={(e) => setWaConfig({ ...waConfig, shopPhone: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-100"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              {/* Test Connection Result Banner */}
              {waTestResult && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                  waTestResult.success 
                    ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200" 
                    : "bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                }`}>
                  {waTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-extrabold flex items-center gap-1.5">
                      <span>Status API:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold ${
                        waTestResult.success ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                      }`}>
                        {waTestResult.status}
                      </span>
                    </p>
                    <p className="text-[11px] leading-snug">{waTestResult.msg}</p>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waConfig.autoNotifyTransaction}
                    onChange={(e) => setWaConfig({ ...waConfig, autoNotifyTransaction: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                    Otomatis kirim struk WA setelah checkout
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleTestWaConnection}
                  disabled={isTestingWa}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-xl text-[11px] cursor-pointer flex items-center gap-1"
                >
                  {isTestingWa ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveWaConfig}
                disabled={isSavingWaConfig}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isSavingWaConfig ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Simpan Konfigurasi</span>
              </button>
              <button
                type="button"
                onClick={() => setShowWaConfigModal(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: RECEIPT PREVIEW MODAL (Appears before printing receipt) */}
      {showReceiptPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl relative my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Printer className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Print Preview & Draf Struk
                  </h3>
                  <p className="text-[10px] text-slate-400">Verifikasi draf cetak sebelum dikirim ke Printer Bluetooth</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Bluetooth Printer Status & Settings Header */}
            <div className="bg-slate-900 text-slate-100 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-400">Printer Bluetooth: Siap Terhubung</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPrintPaperWidth("58mm")}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold cursor-pointer transition-all ${
                      printPaperWidth === "58mm" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                    }`}
                  >
                    58mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintPaperWidth("80mm")}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold cursor-pointer transition-all ${
                      printPaperWidth === "80mm" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                    }`}
                  >
                    80mm
                  </button>
                </div>
              </div>

              {/* Cash & Discount adjustments */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Diterima (Tunai):</label>
                  <input
                    type="number"
                    value={cashReceived || ""}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">Diskon Tambahan:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={previewLastDiscount || ""}
                      onChange={(e) => setPreviewLastDiscount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-amber-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewLastDiscountType(previewLastDiscountType === "NOMINAL" ? "PERCENT" : "NOMINAL")}
                      className="px-1.5 py-1 bg-slate-800 text-[10px] font-extrabold rounded-lg border border-slate-700"
                    >
                      {previewLastDiscountType === "NOMINAL" ? "Rp" : "%"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Thermal Receipt Paper Preview Card */}
            <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-center">
              <div className={`bg-white text-slate-950 p-4 font-mono text-[11px] leading-tight rounded-xl shadow-md border border-slate-200 ${
                printPaperWidth === "58mm" ? "w-64" : "w-72"
              } space-y-2 relative overflow-hidden`}>
                
                {/* Simulated Thermal Paper Cut Teeth */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(circle,_#e2e8f0_50%,_transparent_50%)] bg-[length:8px_8px]" />

                {/* Header Struk */}
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                  <div className="font-extrabold text-xs tracking-wider">FONEPOS STORE</div>
                  <div className="text-[9px] text-slate-600">Jl. Smartphone No. 88, Medan</div>
                  <div className="text-[9px] text-slate-600">Telp/WA: 0812-3456-7890</div>
                </div>

                {/* Meta Struk */}
                <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-400 pb-2 text-slate-700">
                  <div className="flex justify-between">
                    <span>DRAF NOTA:</span>
                    <span className="font-bold">DRAFT-BT-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TANGGAL:</span>
                    <span>{new Date().toLocaleDateString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KASIR:</span>
                    <span>{cashierUser?.name || "Kasir"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PELANGGAN:</span>
                    <span>{customerName || "Pelanggan Umum"}</span>
                  </div>
                </div>

                {/* List Items */}
                <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold truncate">{item.product.name}</div>
                      {item.selectedImei && (
                        <div className="text-[9px] text-slate-500">IMEI: {item.selectedImei}</div>
                      )}
                      <div className="flex justify-between text-[10px]">
                        <span>{item.quantity} x Rp {(item.customPrice ?? item.product.priceSell).toLocaleString("id-ID")}</span>
                        <span className="font-bold">Rp {((item.customPrice ?? item.product.priceSell) * item.quantity).toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals & Payments */}
                <div className="space-y-1 pt-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {cartSubtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon:</span>
                      <span>-Rp {totalDiscount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {includeTax && (
                    <div className="flex justify-between">
                      <span>PPN ({taxPercentage}%):</span>
                      <span>Rp {taxAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black border-t border-slate-900 pt-1 text-slate-950">
                    <span>TOTAL BAYAR:</span>
                    <span>Rp {cartGrandTotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between pt-0.5 text-[9px] text-slate-600">
                    <span>METODE:</span>
                    <span className="font-bold">{paymentMethod}</span>
                  </div>
                  {paymentMethod === "TUNAI" && (
                    <>
                      <div className="flex justify-between text-[9px] text-slate-600">
                        <span>TUNAI DITERIMA:</span>
                        <span>Rp {cashReceived.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-emerald-700">
                        <span>KEMBALIAN:</span>
                        <span>Rp {changeAmount.toLocaleString("id-ID")}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer Struk */}
                <div className="text-center pt-2 border-t border-dashed border-slate-400 space-y-1 text-[9px] text-slate-600">
                  <p>*** TERIMA KASIH ***</p>
                  <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa nota resmi</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReceiptPreviewModal(false)}
                className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Kembali Edit
              </button>

              <button
                type="button"
                onClick={() => handleTriggerBrowserPrint()}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
                title="Cetak Salinan Draf Langsung ke Printer Browser"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Tes Cetak Draf</span>
              </button>

              <button
                type="button"
                onClick={handleFinalCheckout}
                disabled={isCheckoutProcessing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                {isCheckoutProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Cetak & Selesaikan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THERMAL PRINT RECEIPT MODAL */}
      {showPrintModal && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Transaksi Berhasil
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Thermal Receipt Card */}
            <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-200 font-mono text-[11px] leading-snug space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h4 className="font-black text-sm uppercase">NEXUSPOS SMARTPHONE</h4>
                <p className="text-[9px] text-slate-500">Pusat HP Baru & Bekas Terpercaya</p>
                <p className="text-[9px] text-slate-500">No. Nota: {activeReceipt.id}</p>
                <p className="text-[9px] text-slate-500">{new Date(activeReceipt.date).toLocaleString("id-ID")}</p>
              </div>

              <div className="py-1 border-b border-dashed border-slate-300">
                <p>Pelanggan: {activeReceipt.customerName}</p>
                <p>Kasir: {activeReceipt.cashierName}</p>
              </div>

              <div className="py-1 space-y-1 border-b border-dashed border-slate-300">
                {activeReceipt.items?.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <p className="font-bold">{it.quantity}x {it.name}</p>
                      {it.imei && <p className="text-[9px] text-slate-500">SN/IMEI: {it.imei}</p>}
                    </div>
                    <p className="font-bold">Rp {(it.priceSell * it.quantity).toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </div>

              <div className="pt-1 space-y-1 text-right">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>Rp {activeReceipt.totalAmount?.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Metode:</span>
                  <span>{activeReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[9px] text-slate-500">
                <p className="font-bold">Terima Kasih Atas Kunjungan Anda!</p>
                <p>Barang yang sudah dibeli dapat digaransikan sesuai ketentuan nota.</p>
              </div>
            </div>

            {/* WhatsApp Receipt Delivery Panel */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2.5 no-print">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-extrabold">Kirim Struk via WhatsApp Toko</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-bold">
                  MPWA / FoneWA API
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                  Nomor WA Pelanggan:
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={waPhoneInput}
                    onChange={(e) => setWaPhoneInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {waSendStatus && (
                <div
                  className={`p-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${
                    waSendStatus.type === "success"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                  }`}
                >
                  {waSendStatus.type === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>{waSendStatus.msg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleSendWhatsAppApi}
                  disabled={isSendingWa}
                  className="py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isSendingWa ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{isSendingWa ? "Mengirim..." : "Kirim via API WA"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenDirectWhatsApp}
                  className="py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  title="Buka Aplikasi WA Web / HP Langsung"
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Buka WA Web</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 no-print">
              <button
                type="button"
                onClick={handleTriggerBrowserPrint}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Thermal</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScanner 
        isOpen={isCameraScannerOpen} 
        onClose={() => setIsCameraScannerOpen(false)} 
        onScanSuccess={handleBarcodeOrImeiScanned} 
      />

    </div>
  );
}
