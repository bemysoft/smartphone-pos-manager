import React, { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "motion/react";
import { Product, Customer } from "../types";
import { apiFetch } from "../lib/api";
import { 
  Smartphone, 
  Search, 
  MonitorSmartphone, 
  Tag, 
  Filter, 
  CheckCircle2, 
  Layers, 
  Zap, 
  ShieldCheck, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Building2, 
  Sparkles, 
  Info, 
  X, 
  ChevronRight,
  PackageCheck,
  CreditCard,
  Flame,
  Printer,
  FileText,
  Settings2,
  Image as ImageIcon,
  Check,
  Download,
  User,
  Award,
  Crown,
  Gift,
  Plus,
  Edit3,
  Trash2,
  PhoneCall,
  Send,
  Star,
  Coins,
  TrendingUp,
  UserCheck,
  HeartHandshake,
  UserPlus,
  History,
  Clock,
  Receipt,
  ShieldAlert,
  ShoppingBag,
  MessageCircle
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface CustomerCatalogProps {
  products: Product[];
  onSelectProductForPOS?: (product: Product) => void;
}

export default function CustomerCatalog({ products, onSelectProductForPOS }: CustomerCatalogProps) {
  const { t } = useLanguage();
  const [mainTab, setMainTab] = useState<"CATALOG" | "CUSTOMERS">("CUSTOMERS");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Category & Filter Tabs State
  const [activeBrandTab, setActiveBrandTab] = useState<string>("ALL");
  const [activeTypeTab, setActiveTypeTab] = useState<"ALL" | "BARU" | "BEKAS" | "ACCESSORY">("ALL");
  const [activePriceTier, setActivePriceTier] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"NAME_ASC" | "PRICE_ASC" | "PRICE_DESC" | "STOCK_DESC">("STOCK_DESC");

  // Product detail view modal
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // PDF Export Customization Modal State
  const [showExportPdfModal, setShowExportPdfModal] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("KATALOG INVENTARIS SMARTPHONE & AKSESORIS");
  const [pdfSubtitle, setPdfSubtitle] = useState("Daftar Stok Resmi & Pricelist Toko Smartphone POS");
  const [pdfStoreContact, setPdfStoreContact] = useState("WA Sales: 0812-3456-7890 | Cabang Utama | Garansi Unit Store");
  const [pdfFooterNote, setPdfFooterNote] = useState("*Harga dan ketersediaan unit dapat berubah sewaktu-waktu tanpa pemberitahuan.");
  const [pdfExportScope, setPdfExportScope] = useState<"FILTERED" | "ALL">("FILTERED");
  const [pdfShowPrices, setPdfShowPrices] = useState(true);
  const [pdfShowSpecs, setPdfShowSpecs] = useState(true);
  const [pdfShowStock, setPdfShowStock] = useState(true);
  const [pdfShowImeiCount, setPdfShowImeiCount] = useState(true);
  const [pdfShowImages, setPdfShowImages] = useState(true);
  const [pdfTheme, setPdfTheme] = useState<"INDIGO" | "SLATE" | "EMERALD" | "DARK">("INDIGO");

  // CUSTOMERS & LOYALTY POINTS STATE
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "REGULAR" | "MEMBER" | "VIP">("ALL");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedCustomerForPoints, setSelectedCustomerForPoints] = useState<Customer | null>(null);
  const [pointsAdjustment, setPointsAdjustment] = useState<number>(100);
  const [pointsActionType, setPointsActionType] = useState<"ADD" | "DEDUCT">("ADD");

  // Customer Purchase History & Warranty Modal State
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [customerTransactions, setCustomerTransactions] = useState<any[]>([]);
  const [customerWarranties, setCustomerWarranties] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyActiveTab, setHistoryActiveTab] = useState<"DEVICES" | "TRANSACTIONS" | "WARRANTIES">("DEVICES");

  const handleOpenCustomerHistory = async (cust: Customer) => {
    setSelectedCustomerForHistory(cust);
    setLoadingHistory(true);
    setHistoryActiveTab("DEVICES");
    try {
      const [txData, warData] = await Promise.all([
        apiFetch("/api/transactions").catch(() => []),
        apiFetch("/api/warranties").catch(() => [])
      ]);

      const custPhoneClean = (cust.phone || "").replace(/[^0-9]/g, "");

      const filteredTx = Array.isArray(txData) ? txData.filter((t: any) => {
        const tPhoneClean = (t.customerPhone || "").replace(/[^0-9]/g, "");
        return (custPhoneClean && tPhoneClean && custPhoneClean === tPhoneClean) ||
               (t.customerId && t.customerId === cust.id) ||
               (t.customerName && t.customerName.toLowerCase() === cust.name.toLowerCase());
      }) : [];

      const filteredWar = Array.isArray(warData) ? warData.filter((w: any) => {
        const wPhoneClean = (w.customerPhone || "").replace(/[^0-9]/g, "");
        return (custPhoneClean && wPhoneClean && custPhoneClean === wPhoneClean) ||
               (w.customerName && w.customerName.toLowerCase() === cust.name.toLowerCase());
      }) : [];

      setCustomerTransactions(filteredTx);
      setCustomerWarranties(filteredWar);
    } catch (err) {
      console.error("Gagal memuat riwayat transaksi pelanggan:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // New customer form state
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustRole, setNewCustRole] = useState<"REGULAR" | "MEMBER" | "VIP">("MEMBER");
  const [newCustPoints, setNewCustPoints] = useState<number>(100);

  // Fetch Customers from API
  const fetchCustomers = async () => {
    try {
      const data = await apiFetch("/api/customers");
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      console.error("Gagal memuat pelanggan:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    try {
      const res = await apiFetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: newCustPhone.trim(),
          role: newCustRole,
          points: Number(newCustPoints) || 0
        })
      });
      if (res.ok) {
        fetchCustomers();
        setShowAddCustomerModal(false);
        setNewCustName("");
        setNewCustPhone("");
        setNewCustPoints(100);
        alert("Pelanggan member berhasil ditambahkan!");
      }
    } catch (err) {
      alert("Gagal menambahkan pelanggan.");
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPoints) return;
    const currentPts = selectedCustomerForPoints.points || 0;
    const delta = pointsActionType === "ADD" ? pointsAdjustment : -pointsAdjustment;
    const newTotal = Math.max(0, currentPts + delta);
    let newRole = selectedCustomerForPoints.role || "REGULAR";
    if (newTotal >= 1000) newRole = "VIP";
    else if (newTotal >= 200) newRole = "MEMBER";

    try {
      const res = await apiFetch(`/api/customers/${selectedCustomerForPoints.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: newTotal,
          role: newRole
        })
      });
      if (res.ok) {
        fetchCustomers();
        setSelectedCustomerForPoints(null);
        alert(`Saldo poin loyalti ${selectedCustomerForPoints.name} berhasil diperbarui menjadi ${newTotal.toLocaleString()} PTS!`);
      }
    } catch (err) {
      alert("Gagal memperbarui saldo poin.");
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Hapus data pelanggan ${name}?`)) return;
    try {
      const res = await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCustomers();
      }
    } catch (err) {
      alert("Gagal menghapus pelanggan.");
    }
  };

  // Filtered Customers List
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = customerSearch.trim() === "" ||
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch) ||
        c.id.toLowerCase().includes(customerSearch.toLowerCase());
      const matchesRole = roleFilter === "ALL" || c.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [customers, customerSearch, roleFilter]);

  const totalPointsAllCustomers = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.points || 0), 0);
  }, [customers]);

  // Derive unique brands from product list
  const brandList = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.brand && p.brand.trim()) {
        brands.add(p.brand.trim());
      }
    });
    return Array.from(brands).sort();
  }, [products]);

  // Count metrics for quick filter badges
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: products.length };
    products.forEach(p => {
      const b = p.brand ? p.brand.trim() : "Lainnya";
      counts[b] = (counts[b] || 0) + 1;
    });
    return counts;
  }, [products]);

  const typeCounts = useMemo(() => {
    let baru = 0;
    let bekas = 0;
    let accessory = 0;
    products.forEach(p => {
      if (p.type === "BARU") baru++;
      else if (p.type === "BEKAS") bekas++;
      else accessory++;
    });
    return {
      ALL: products.length,
      BARU: baru,
      BEKAS: bekas,
      ACCESSORY: accessory
    };
  }, [products]);

  // Price tier breakdown counts
  const priceTierCounts = useMemo(() => {
    let tier1 = 0; // < 3M
    let tier2 = 0; // 3M - 7M
    let tier3 = 0; // 7M - 15M
    let tier4 = 0; // > 15M
    products.forEach(p => {
      const price = p.priceSell || 0;
      if (price < 3000000) tier1++;
      else if (price >= 3000000 && price < 7000000) tier2++;
      else if (price >= 7000000 && price < 15000000) tier3++;
      else tier4++;
    });
    return { ALL: products.length, TIER1: tier1, TIER2: tier2, TIER3: tier3, TIER4: tier4 };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search Query Match
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(query);
        const brandMatch = p.brand.toLowerCase().includes(query);
        const modelMatch = p.model.toLowerCase().includes(query);
        const specMatch = p.specifications ? p.specifications.toLowerCase().includes(query) : false;
        const categoryMatch = p.category ? p.category.toLowerCase().includes(query) : false;
        const imeiMatch = p.imeis ? p.imeis.some(i => i.toLowerCase().includes(query)) : false;

        if (!nameMatch && !brandMatch && !modelMatch && !specMatch && !categoryMatch && !imeiMatch) {
          return false;
        }
      }

      // 2. Brand Tab Match
      if (activeBrandTab !== "ALL") {
        if (p.brand.toLowerCase() !== activeBrandTab.toLowerCase()) {
          return false;
        }
      }

      // 3. Type / Condition Tab Match
      if (activeTypeTab !== "ALL") {
        if (activeTypeTab === "BARU" && p.type !== "BARU") return false;
        if (activeTypeTab === "BEKAS" && p.type !== "BEKAS") return false;
        if (activeTypeTab === "ACCESSORY") {
          const isAcc = p.category === "Aksesoris" || p.category === "Sparepart" || (!p.type && !p.imeis?.length);
          if (!isAcc) return false;
        }
      }

      // 4. Price Tier Filter Match
      if (activePriceTier !== "ALL") {
        const price = p.priceSell || 0;
        if (activePriceTier === "TIER1" && price >= 3000000) return false;
        if (activePriceTier === "TIER2" && (price < 3000000 || price >= 7000000)) return false;
        if (activePriceTier === "TIER3" && (price < 7000000 || price >= 15000000)) return false;
        if (activePriceTier === "TIER4" && price < 15000000) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "PRICE_ASC") return (a.priceSell || 0) - (b.priceSell || 0);
      if (sortBy === "PRICE_DESC") return (b.priceSell || 0) - (a.priceSell || 0);
      if (sortBy === "STOCK_DESC") return (b.stock || 0) - (a.stock || 0);
      return a.name.localeCompare(b.name);
    });
  }, [products, searchQuery, activeBrandTab, activeTypeTab, activePriceTier, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setActiveBrandTab("ALL");
    setActiveTypeTab("ALL");
    setActivePriceTier("ALL");
  };

  const activeFilterCount = (activeBrandTab !== "ALL" ? 1 : 0) + 
    (activeTypeTab !== "ALL" ? 1 : 0) + 
    (activePriceTier !== "ALL" ? 1 : 0) + 
    (searchQuery.trim() !== "" ? 1 : 0);

  // Generate & Export PDF Catalog
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const targetProducts = pdfExportScope === "FILTERED" ? filteredProducts : products;

    let primaryColor = [49, 46, 129]; // INDIGO
    let accentColor = [99, 102, 241];
    if (pdfTheme === "SLATE") {
      primaryColor = [30, 41, 59];
      accentColor = [71, 85, 105];
    } else if (pdfTheme === "EMERALD") {
      primaryColor = [6, 78, 59];
      accentColor = [16, 185, 129];
    } else if (pdfTheme === "DARK") {
      primaryColor = [15, 23, 42];
      accentColor = [14, 165, 233];
    }

    // Header Color Block
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 36, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfTitle.toUpperCase(), 14, 14);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(226, 232, 240);
    doc.text(pdfSubtitle, 14, 21);

    // Store Contact
    doc.setFontSize(8);
    doc.setTextColor(191, 219, 254);
    doc.text(pdfStoreContact, 14, 28);

    // Right Info Total
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL: ${targetProducts.length} ITEM`, 196, 21, { align: "right" });
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(`Cetak: ${new Date().toLocaleDateString("id-ID")}`, 196, 27, { align: "right" });

    // Table Data Setup
    const tableHead: string[] = ["No"];
    if (pdfShowImages) tableHead.push("Visual");
    tableHead.push("Merek & Tipe");
    tableHead.push("Nama Produk & Model");
    if (pdfShowSpecs) tableHead.push("Spesifikasi");
    if (pdfShowImeiCount) tableHead.push("Kondisi & S/N");
    if (pdfShowStock) tableHead.push("Stok");
    if (pdfShowPrices) tableHead.push("Harga Jual (IDR)");

    const tableBody = targetProducts.map((p, idx) => {
      const typeLabel = p.type === "BARU" ? "BARU" : p.type === "BEKAS" ? "BEKAS" : "AKSESORIS";
      const row: string[] = [(idx + 1).toString()];

      if (pdfShowImages) {
        row.push(p.imageUrl ? "[Foto] 📷" : "[Visual] 📱");
      }
      row.push(`${p.brand.toUpperCase()}\n[${typeLabel}]`);
      row.push(`${p.name}\n${p.model ? `Model: ${p.model}` : ""}`);
      if (pdfShowSpecs) {
        row.push(p.specifications || "-");
      }
      if (pdfShowImeiCount) {
        const imeiCount = p.imeis ? p.imeis.length : 0;
        row.push(`${p.warrantyDays ? `Garansi ${p.warrantyDays} Hari` : "Garansi Toko"}\n(${imeiCount} S/N Ready)`);
      }
      if (pdfShowStock) {
        row.push(`${p.stock} Unit`);
      }
      if (pdfShowPrices) {
        row.push(`Rp ${(p.priceSell || 0).toLocaleString("id-ID")}`);
      }
      return row;
    });

    autoTable(doc, {
      startY: 42,
      head: [tableHead],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center"
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        valign: "middle"
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" }
      },
      margin: { top: 42, bottom: 18, left: 14, right: 14 },
      didDrawPage: (data) => {
        const totalPages = typeof (doc as any).getNumberOfPages === "function" ? (doc as any).getNumberOfPages() : 1;
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.text(pdfFooterNote, 14, 288);
        doc.text(`Halaman ${data.pageNumber} dari ${totalPages}`, 196, 288, { align: "right" });
      }
    });

    doc.save(`Katalog-Inventaris-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* MAIN VIEW NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMainTab("CUSTOMERS")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              mainTab === "CUSTOMERS"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Gift className="h-4 w-4" />
            <span>Daftar Pelanggan & Poin Loyalti ({customers.length})</span>
          </button>

          <button
            onClick={() => setMainTab("CATALOG")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              mainTab === "CATALOG"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Katalog Stok Barang ({products.length})</span>
          </button>
        </div>

        {mainTab === "CUSTOMERS" && (
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pelanggan Member</span>
          </button>
        )}
      </div>

      {/* HEADER BANNER */}
      {mainTab === "CATALOG" ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Smartphone className="h-64 w-64 text-indigo-400" />
          </div>
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Katalog Inventaris Multi-Cabang</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Eksplorasi Stok Smartphone & Aksesoris
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Pilih unit smartphone resmi terdaftar Kemenperin/Bea Cukai atau HP bekas garansi unit toko. Gunakan tab kategori merek, tipe model, dan kelas harga di bawah untuk pencarian kilat.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Garansi S/N Resmi</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <PackageCheck className="h-4 w-4 text-indigo-400" />
                <span>{products.length} Total Unit Terdata</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <CreditCard className="h-4 w-4 text-amber-400" />
                <span>Opsi Cicilan 0% Available</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-amber-900/40 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Gift className="h-64 w-64 text-amber-400" />
          </div>
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Crown className="h-3.5 w-3.5" />
              <span>Sistem Poin Loyalti & Keanggotaan VIP</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Katalog Pelanggan & Saldo Poin Loyalti Member
            </h1>
            <p className="text-amber-100/90 text-xs md:text-sm leading-relaxed">
              Pantau saldo poin aktif seluruh pelanggan toko. Poin terakumulasi otomatis saat checkout di Kasir POS (Rp 10.000 = +1 Poin) dan dapat ditukarkan dengan diskon langsung saat pembelian berikutnya.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-amber-200">
              <div className="flex items-center gap-1.5 font-semibold">
                <Coins className="h-4 w-4 text-amber-400" />
                <span>{totalPointsAllCustomers.toLocaleString()} Total Poin Terdistribusi</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                <span>{customers.length} Pelanggan Terdaftar</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <Award className="h-4 w-4 text-indigo-400" />
                <span>Diskon 1 PTS = Rp 100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMERS & LOYALTY POINTS VIEW */}
      {mainTab === "CUSTOMERS" ? (
        <div className="space-y-6">
          {/* LOYALTY METRICS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Pelanggan</span>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
                  <User className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {customers.length} <span className="text-xs font-semibold text-slate-400">Orang</span>
              </p>
              <p className="text-[11px] text-slate-500">Terdaftar di database toko</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                <span className="text-xs font-bold uppercase tracking-wider">Saldo Poin Aktif</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                  <Coins className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {totalPointsAllCustomers.toLocaleString()} <span className="text-xs font-semibold">PTS</span>
              </p>
              <p className="text-[11px] text-slate-500">Akumulasi poin seluruh member</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider">Nilai Diskon Disiapkan</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                  <Gift className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                Rp {(totalPointsAllCustomers * 100).toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-slate-500">Potongan harga di kasir (1 PTS = Rp 100)</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                <span className="text-xs font-bold uppercase tracking-wider">Member VIP</span>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
                  <Crown className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {customers.filter(c => c.role === "VIP").length} <span className="text-xs font-semibold text-slate-400">VIP</span>
              </p>
              <p className="text-[11px] text-slate-500">Di atas 1.000 Poin Loyalti</p>
            </div>
          </div>

          {/* LOYALTY RULES BOX */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-300/40 dark:border-amber-800/50 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-200 text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Aturan Sistem Poin Loyalti FonePOS</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
                • <strong>Perolehan Poin:</strong> Otomatis bertambah +1 Poin untuk setiap kelipatan Rp 10.000 pada checkout Kasir POS.<br/>
                • <strong>Penukaran Diskon:</strong> 1 Poin bernilai Rp 100 diskon tunai langsung pada transaksi berikutnya.<br/>
                • <strong>Tingkat Keanggotaan:</strong> Regular (&lt;200 PTS) ➔ Member (200-999 PTS) ➔ VIP Tier (&ge;1.000 PTS).
              </p>
            </div>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shrink-0 cursor-pointer shadow-md shadow-amber-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Member</span>
            </button>
          </div>

          {/* CUSTOMER SEARCH & FILTER BAR */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari nama pelanggan, nomor WA 0812..., ID member..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              {customerSearch && (
                <button
                  onClick={() => setCustomerSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(["ALL", "REGULAR", "MEMBER", "VIP"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    roleFilter === r
                      ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {r === "ALL" ? "Semua Level" : r}
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOMERS GRID WITH CURRENT POINT BALANCES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <User className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak Ada Pelanggan Ditemukan</h3>
                <p className="text-xs text-slate-400">Gunakan tombol di atas untuk mendaftarkan pelanggan baru.</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const pts = cust.points || 0;
                const redeemValue = pts * 100;
                const isVip = cust.role === "VIP" || pts >= 1000;
                const isMember = cust.role === "MEMBER" || (pts >= 200 && pts < 1000);
                const nextTierTarget = isVip ? 2000 : isMember ? 1000 : 200;
                const progressPct = Math.min(100, Math.round((pts / nextTierTarget) * 100));

                const waMessage = encodeURIComponent(
                  `Halo Kak ${cust.name}, berikut adalah informasi Saldo Poin Loyalti FonePOS Anda:\n\n` +
                  `👤 Nama: ${cust.name}\n` +
                  `📱 No. HP: ${cust.phone}\n` +
                  `🎖️ Tier Member: ${cust.role || "MEMBER"}\n` +
                  `⭐ Saldo Poin: ${pts.toLocaleString()} PTS\n` +
                  `💰 Nilai Diskon Tukar: Rp ${redeemValue.toLocaleString("id-ID")}\n\n` +
                  `Gunakan poin Anda saat checkout di Kasir untuk potongan harga langsung. Terima kasih!`
                );
                const waUrl = `https://wa.me/${cust.phone.replace(/[^0-9]/g, "")}?text=${waMessage}`;

                const waFollowUpMsg = encodeURIComponent(
                  `Halo Kak ${cust.name},\n\n` +
                  `Terima kasih telah menjadi pelanggan setia FonePOS! 📱\n` +
                  `Kami ingin menyampaikan informasi promo eksklusif & layanan purna jual untuk Anda:\n` +
                  `• Tier Member: ${cust.role || "REGULAR"}\n` +
                  `• Saldo Poin Loyalti: ${pts.toLocaleString()} PTS (Setara Rp ${redeemValue.toLocaleString("id-ID")})\n` +
                  `• Garansi Store & Penawaran Spesial Aksesoris / Gadget Baru.\n\n` +
                  `Silakan balas pesan ini jika Kak ${cust.name} memerlukan bantuan promo atau tindak lanjut purna jual. Terima kasih!`
                );
                const waFollowUpUrl = `https://wa.me/${cust.phone.replace(/[^0-9]/g, "")}?text=${waFollowUpMsg}`;

                return (
                  <div
                    key={cust.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Customer Header */}
                      <div className="flex justify-between items-start">
                        <div 
                          onClick={() => handleOpenCustomerHistory(cust)}
                          className="cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition-colors">
                              {cust.name}
                            </h3>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              isVip
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                                : isMember
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                              {isVip ? "👑 VIP" : isMember ? "⭐ MEMBER" : "REGULAR"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 pt-1">
                            <PhoneCall className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cust.phone}</span>
                            <span className="text-[10px] text-slate-400">({cust.id})</span>
                          </p>
                        </div>
                      </div>

                      {/* CURRENT POINT BALANCE HIGHLIGHT */}
                      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-300/40 dark:border-amber-900/50 p-3.5 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            Saldo Poin Loyalti Saat Ini:
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-black text-lg">
                            {pts.toLocaleString()} <span className="text-xs font-extrabold">PTS</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-amber-200/50 dark:border-amber-900/30">
                          <span>Setara Nilai Diskon Kasir:</span>
                          <span className="font-black">Rp {redeemValue.toLocaleString("id-ID")}</span>
                        </div>

                        {/* Tier Progress Bar */}
                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                            <span>Progress Tier ({progressPct}%)</span>
                            <span>{pts} / {nextTierTarget} PTS</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-400 to-amber-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <a
                        href={waFollowUpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-emerald-600/20 active:scale-[0.98]"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Hubungi via WhatsApp</span>
                      </a>

                      <button
                        onClick={() => handleOpenCustomerHistory(cust)}
                        className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>Riwayat Pembelian & Garansi</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCustomerForPoints(cust);
                            setPointsAdjustment(100);
                            setPointsActionType("ADD");
                          }}
                          className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <Coins className="h-3.5 w-3.5" />
                          <span>Kelola Poin</span>
                        </button>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl cursor-pointer border border-emerald-200 dark:border-emerald-800"
                          title="Kirim Saldo Poin ke WA"
                        >
                          <Send className="h-4 w-4" />
                        </a>

                        <button
                          onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 rounded-xl cursor-pointer border border-rose-200 dark:border-rose-800"
                          title="Hapus Pelanggan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* PRODUCT CATALOG VIEW CONTINUES HERE */
        <div className="space-y-6">
          {/* SEARCH BAR & SORT CONTROLS */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari iPhone 15, Samsung S24, IMEI 3589..., 256GB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 w-full md:w-auto">
                <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer flex-1"
                >
                  <option value="STOCK_DESC">Stok Terbanyak</option>
                  <option value="PRICE_ASC">Harga: Termurah</option>
                  <option value="PRICE_DESC">Harga: Termahal</option>
                  <option value="NAME_ASC">Nama (A - Z)</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset ({activeFilterCount})</span>
                </button>
              )}

              {/* Tombol Ekspor PDF Katalog */}
              <button
                onClick={() => setShowExportPdfModal(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-600/20 shrink-0"
                title="Kustomisasi & Unduh PDF Laporan Stok Katalog"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Ekspor ke PDF</span>
              </button>
            </div>
          </div>

      {/* CATEGORY TABS CONTAINER */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* 1. BRAND TABS (MEREK PRODUSEN) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-indigo-500" />
              Pilih Merek / Produsen Smartphone:
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {brandList.length} Merek Terdaftar
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveBrandTab("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeBrandTab === "ALL"
                  ? "bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Semua Merek</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeBrandTab === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"}`}>
                {brandCounts["ALL"]}
              </span>
            </button>

            {brandList.map(brand => {
              const count = brandCounts[brand] || 0;
              const isActive = activeBrandTab.toLowerCase() === brand.toLowerCase();
              return (
                <button
                  key={brand}
                  onClick={() => setActiveBrandTab(brand)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-extrabold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{brand}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white font-extrabold" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. MODEL & CONDITION TABS (TIPE MODEL & KONDISI) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Condition Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
              Tipe Model / Kondisi Unit:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setActiveTypeTab("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  activeTypeTab === "ALL"
                    ? "bg-emerald-600 text-white font-extrabold shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                Semua ({typeCounts.ALL})
              </button>
              <button
                onClick={() => setActiveTypeTab("BARU")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                  activeTypeTab === "BARU"
                    ? "bg-blue-600 text-white font-extrabold shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Baru ({typeCounts.BARU})</span>
              </button>
              <button
                onClick={() => setActiveTypeTab("BEKAS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
                  activeTypeTab === "BEKAS"
                    ? "bg-purple-600 text-white font-extrabold shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                <Smartphone className="h-3 w-3" />
                <span>Bekas ({typeCounts.BEKAS})</span>
              </button>
              <button
                onClick={() => setActiveTypeTab("ACCESSORY")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  activeTypeTab === "ACCESSORY"
                    ? "bg-amber-600 text-white font-extrabold shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                Aksesoris ({typeCounts.ACCESSORY})
              </button>
            </div>
          </div>

          {/* 3. PRICE TIER FILTER */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
              Filter Kelas Harga Smartphone:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] font-bold">
              <button
                onClick={() => setActivePriceTier("ALL")}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  activePriceTier === "ALL"
                    ? "bg-amber-600 text-white font-black"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActivePriceTier("TIER1")}
                className={`px-2 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  activePriceTier === "TIER1"
                    ? "bg-amber-600 text-white font-black"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                &lt; 3 Juta ({priceTierCounts.TIER1})
              </button>
              <button
                onClick={() => setActivePriceTier("TIER2")}
                className={`px-2 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  activePriceTier === "TIER2"
                    ? "bg-amber-600 text-white font-black"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                3 - 7 Juta ({priceTierCounts.TIER2})
              </button>
              <button
                onClick={() => setActivePriceTier("TIER3")}
                className={`px-2 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  activePriceTier === "TIER3"
                    ? "bg-amber-600 text-white font-black"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                7 - 15 Juta ({priceTierCounts.TIER3})
              </button>
              <button
                onClick={() => setActivePriceTier("TIER4")}
                className={`px-2 py-1.5 rounded-xl transition-all cursor-pointer text-center col-span-2 sm:col-span-1 ${
                  activePriceTier === "TIER4"
                    ? "bg-amber-600 text-white font-black"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                &gt; 15 Juta ({priceTierCounts.TIER4})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS SUMMARY BAR */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-semibold">
        <span>
          Menampilkan <strong>{filteredProducts.length}</strong> dari <strong>{products.length}</strong> produk di katalog
        </span>
        {activeFilterCount > 0 && (
          <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
            {activeFilterCount} Filter Diterapkan
          </span>
        )}
      </div>

      {/* PRODUCT GRID DISPLAY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredProducts.map(p => {
          const isAvailable = p.stock > 0;
          const monthlyEst = Math.round((p.priceSell || 0) / 12);

          return (
            <div 
              key={p.id} 
              onClick={() => setSelectedProductDetail(p)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Top Row: Type Badge & Stock Pill */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    p.type === 'BARU' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800' 
                      : p.type === 'BEKAS'
                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {p.type || "AKSESORIS"} {p.type === 'BEKAS' && p.condition && `Grade ${p.condition}`}
                  </span>

                  <span className={`text-[11px] font-extrabold flex items-center gap-1 ${
                    isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                    {isAvailable ? `${p.stock} Unit` : "Habis"}
                  </span>
                </div>

                {/* Brand & Title */}
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    {p.brand} {p.model ? `• ${p.model}` : ""}
                  </p>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {p.name}
                  </h3>
                </div>

                {/* Specifications / RAM storage preview */}
                {p.specifications && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl font-medium">
                    {p.specifications}
                  </p>
                )}

                {/* IMEI Badge indicator if smartphone */}
                {p.imeis && p.imeis.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>IMEI Terdata ({p.imeis.length} Unit Ready)</span>
                  </div>
                )}
              </div>

              {/* Bottom Price Section */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga Jual POS</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      Rp {(p.priceSell ?? 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>

                {p.priceSell && p.priceSell >= 1000000 && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between font-medium">
                    <span>Est. Cicilan 12x:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ~Rp {monthlyEst.toLocaleString("id-ID")}/bln
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center">
              <MonitorSmartphone className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Tidak ada unit produk yang cocok
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Coba ubah kata kunci pencarian, sesuaikan filter merek ({activeBrandTab}), atau reset kombinasi filter kelas harga.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span>Reset Semua Filter Katalag</span>
            </button>
          </div>
        )}
      </div>
      </div>
      )}

      {/* DETAIL MODAL WHEN PRODUCT CLICKED */}
      <AnimatePresence>
        {selectedProductDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  selectedProductDetail.type === 'BARU' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {selectedProductDetail.type} {selectedProductDetail.type === 'BEKAS' && `Grade ${selectedProductDetail.condition}`}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {selectedProductDetail.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Merek: {selectedProductDetail.brand} • Model: {selectedProductDetail.model || "-"}
                </p>
              </div>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Specs & Pricing */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-sm font-extrabold">
                  <span className="text-slate-600 dark:text-slate-400">Harga Jual Tunai/POS:</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    Rp {(selectedProductDetail.priceSell ?? 0).toLocaleString("id-ID")}
                  </span>
                </div>
                {selectedProductDetail.priceBuy && (
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span>Harga Pokok (HPP Buyback):</span>
                    <span className="font-mono">Rp {selectedProductDetail.priceBuy.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-300">Sisa Stok Fisik:</span>
                  <span className={selectedProductDetail.stock > 0 ? "text-emerald-600" : "text-rose-600"}>
                    {selectedProductDetail.stock} Unit Tersedia
                  </span>
                </div>
              </div>

              {selectedProductDetail.specifications && (
                <div className="space-y-1">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 block">Spesifikasi Unit:</span>
                  <p className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl leading-relaxed">
                    {selectedProductDetail.specifications}
                  </p>
                </div>
              )}

              {selectedProductDetail.imeis && selectedProductDetail.imeis.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300 block flex items-center justify-between">
                    <span>Daftar IMEI Ready ({selectedProductDetail.imeis.length}):</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Resmi Kemenperin</span>
                  </span>
                  <div className="max-h-28 overflow-y-auto bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] space-y-1">
                    {selectedProductDetail.imeis.map((imei, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>Unit #{idx + 1}:</span>
                        <span>{imei}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* MODAL PENGATURAN EKSPOR KATALOG PDF */}
      <AnimatePresence>
        {showExportPdfModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.25 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto"
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Pengaturan Ekspor Katalog PDF</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kustomisasi header, kolom, & format cetak fisik stok toko</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportPdfModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Header Preview Banner */}
            <div className={`p-4 rounded-2xl text-white space-y-1 shadow-md transition-all ${
              pdfTheme === "INDIGO" ? "bg-gradient-to-r from-indigo-900 via-indigo-950 to-indigo-900 border border-indigo-800" :
              pdfTheme === "SLATE" ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700" :
              pdfTheme === "EMERALD" ? "bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border border-emerald-800" :
              "bg-gradient-to-r from-slate-950 via-gray-900 to-slate-950 border border-slate-800"
            }`}>
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Pratinjau Header Katalog</span>
                  <h4 className="text-sm font-black uppercase tracking-tight">{pdfTitle || "JUDUL KATALOG"}</h4>
                  <p className="text-[11px] text-slate-200">{pdfSubtitle}</p>
                  <p className="text-[10px] text-indigo-200 pt-1">{pdfStoreContact}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-extrabold">
                    {pdfExportScope === "FILTERED" ? `${filteredProducts.length} Item Filter` : `${products.length} Semua Item`}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Customization Controls */}
            <div className="space-y-4 text-xs">
              {/* 1. Header Information */}
              <div className="space-y-3">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  1. Informasi Kop & Header Laporan
                </span>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Judul Utama Katalog PDF:
                  </label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Subjudul / Slogan Toko:
                  </label>
                  <input
                    type="text"
                    value={pdfSubtitle}
                    onChange={(e) => setPdfSubtitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Kontak Toko & Media Sosial:
                  </label>
                  <input
                    type="text"
                    value={pdfStoreContact}
                    onChange={(e) => setPdfStoreContact(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Catatan Kaki / Footer Terms:
                  </label>
                  <input
                    type="text"
                    value={pdfFooterNote}
                    onChange={(e) => setPdfFooterNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 2. Scope & Theme selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Scope */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Cakupan Produk Dicetak:
                  </label>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setPdfExportScope("FILTERED")}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        pdfExportScope === "FILTERED"
                          ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>Hasil Filter ({filteredProducts.length} Item)</span>
                      {pdfExportScope === "FILTERED" && <Check className="h-4 w-4 text-indigo-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPdfExportScope("ALL")}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        pdfExportScope === "ALL"
                          ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span>Seluruh Produk ({products.length} Item)</span>
                      {pdfExportScope === "ALL" && <Check className="h-4 w-4 text-indigo-600" />}
                    </button>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Tema Warna Kop PDF:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "INDIGO", name: "Indigo Pro", bg: "bg-indigo-600" },
                      { id: "SLATE", name: "Slate Class", bg: "bg-slate-800" },
                      { id: "EMERALD", name: "Emerald", bg: "bg-emerald-700" },
                      { id: "DARK", name: "Dark Modern", bg: "bg-slate-950" }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPdfTheme(t.id as any)}
                        className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-all ${
                          pdfTheme === t.id
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${t.bg} shrink-0`} />
                        <span>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Column Toggles */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Kolom & Visual yang Ditampilkan dalam Tabel PDF:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfShowImages}
                      onChange={(e) => setPdfShowImages(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Visual & Foto</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfShowPrices}
                      onChange={(e) => setPdfShowPrices(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Harga Jual</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfShowSpecs}
                      onChange={(e) => setPdfShowSpecs(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Spesifikasi Unit</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfShowStock}
                      onChange={(e) => setPdfShowStock(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Sisa Stok Fisik</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer col-span-2 sm:col-span-1">
                    <input
                      type="checkbox"
                      checked={pdfShowImeiCount}
                      onChange={(e) => setPdfShowImeiCount(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Garansi & S/N</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExportPdfModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExportPDF();
                  setShowExportPdfModal(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Laporan Katalog PDF</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* MODAL TAMBAH PELANGGAN BARU */}
      <AnimatePresence>
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-lg">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                  <span>Daftarkan Pelanggan Member</span>
                </div>
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Pelanggan:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp / HP:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Keanggotaan Awalan:
                  </label>
                  <select
                    value={newCustRole}
                    onChange={(e) => setNewCustRole(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="MEMBER">MEMBER (Standar Poin)</option>
                    <option value="REGULAR">REGULAR (Non-Poin)</option>
                    <option value="VIP">VIP (Prioritas Layanan)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bonus Poin Registrasi Awal:
                  </label>
                  <input
                    type="number"
                    value={newCustPoints}
                    onChange={(e) => setNewCustPoints(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Bonus {newCustPoints} Poin setara potongan diskon Kasir Rp {(newCustPoints * 100).toLocaleString("id-ID")}.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KELOLA / ADJUSTMENT POIN LOYALTI */}
      <AnimatePresence>
        {selectedCustomerForPoints && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-500" />
                    <span>Penyesuaian Poin Loyalti</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    Member: <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedCustomerForPoints.name}</span> ({selectedCustomerForPoints.phone})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomerForPoints(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Current Points Info */}
                <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-300">Saldo Saat Ini</span>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {(selectedCustomerForPoints.points || 0).toLocaleString()} <span className="text-xs">PTS</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500">Nilai Tukar Diskon</span>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      Rp {((selectedCustomerForPoints.points || 0) * 100).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aksi Penyesuaian:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPointsActionType("ADD")}
                      className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        pointsActionType === "ADD"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      + Tambah Poin
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointsActionType("SUBTRACT")}
                      className={`py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                        pointsActionType === "SUBTRACT"
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      - Potong Poin
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Nominal Poin:
                  </label>
                  <input
                    type="number"
                    value={pointsAdjustment}
                    onChange={(e) => setPointsAdjustment(Math.max(1, Number(e.target.value)))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {pointsActionType === "ADD" ? "Penambahan" : "Pemotongan"} {pointsAdjustment} PTS setara dampak nominal Rp {(pointsAdjustment * 100).toLocaleString("id-ID")}.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForPoints(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAdjustPoints}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Proses Penyesuaian
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL RIWAYAT PEMBELIAN & GARANSI PELANGGAN */}
      <AnimatePresence>
        {selectedCustomerForHistory && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.25 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col justify-between overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-white text-lg">
                        {selectedCustomerForHistory.name}
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {selectedCustomerForHistory.role || "REGULAR"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                      <span>📱 {selectedCustomerForHistory.phone}</span>
                      <span>•</span>
                      <span>ID: {selectedCustomerForHistory.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${selectedCustomerForHistory.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Halo Kak ${selectedCustomerForHistory.name},\n\nSalam dari FonePOS! Kami ingin menindaklanjuti layanan purna jual, garansi, atau promo spesial produk Anda. Ada yang bisa kami bantu?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Hubungi via WhatsApp</span>
                  </a>

                  <button
                    onClick={() => setSelectedCustomerForHistory(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto space-y-5 py-4 pr-1 grow">
                {/* Stats Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pembelian</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      Rp {customerTransactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Transaksi</span>
                    <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {customerTransactions.length} Nota
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Perangkat Terbeli</span>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {customerTransactions.reduce((acc, t) => acc + (t.items?.length || 0), 0)} Unit
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Saldo Loyalti</span>
                    <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                      {(selectedCustomerForHistory.points || 0).toLocaleString()} PTS
                    </p>
                  </div>
                </div>

                {/* Internal Tab Navigation */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold gap-4">
                  <button
                    onClick={() => setHistoryActiveTab("DEVICES")}
                    className={`pb-2.5 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                      historyActiveTab === "DEVICES"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Perangkat & HP Dibeli</span>
                  </button>

                  <button
                    onClick={() => setHistoryActiveTab("TRANSACTIONS")}
                    className={`pb-2.5 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                      historyActiveTab === "TRANSACTIONS"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    <Receipt className="h-4 w-4" />
                    <span>Riwayat Invoice Penjualan</span>
                  </button>

                  <button
                    onClick={() => setHistoryActiveTab("WARRANTIES")}
                    className={`pb-2.5 transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                      historyActiveTab === "WARRANTIES"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Garansi Resmi Store ({customerWarranties.length})</span>
                  </button>
                </div>

                {/* Loading state */}
                {loadingHistory ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Memuat riwayat transaksi dan garansi pelanggan...
                  </div>
                ) : (
                  <>
                    {/* TAB 1: PERANGKAT DIBELI */}
                    {historyActiveTab === "DEVICES" && (
                      <div className="space-y-3">
                        {(() => {
                          const allItems: any[] = [];
                          customerTransactions.forEach((tx) => {
                            (tx.items || []).forEach((item: any) => {
                              allItems.push({
                                ...item,
                                txId: tx.id,
                                date: tx.date,
                                cashier: tx.cashierName || "Kasir"
                              });
                            });
                          });

                          if (allItems.length === 0) {
                            return (
                              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
                                <Smartphone className="h-8 w-8 text-slate-300 mx-auto" />
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum Ada Perangkat Terdaftar</p>
                                <p className="text-[11px] text-slate-400">Pelanggan ini belum melakukan pembelian perangkat/HP di POS.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {allItems.map((item, idx) => {
                                const matchingWarranty = customerWarranties.find(w => w.imei === item.imei || w.invoiceId === item.txId);
                                const purchaseDateStr = item.date ? new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";
                                const isExpired = matchingWarranty ? new Date(matchingWarranty.expiryDate) < new Date() : false;

                                return (
                                  <div
                                    key={idx}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-xs"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                                          {item.brand || "HP"} • {item.condition || "UNIT"}
                                        </span>
                                        <h4 className="font-black text-slate-900 dark:text-white text-sm mt-1">
                                          {item.productName || `${item.brand} ${item.model}`}
                                        </h4>
                                      </div>
                                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                        matchingWarranty && !isExpired
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300"
                                      }`}>
                                        {matchingWarranty ? (isExpired ? "Garansi Habis" : "Garansi Aktif") : "Garansi Toko"}
                                      </span>
                                    </div>

                                    <div className="space-y-1 text-xs bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl font-mono text-slate-700 dark:text-slate-300">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400 font-sans text-[11px]">IMEI / Serial:</span>
                                        <span className="font-bold">{item.imei || "-"}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400 font-sans text-[11px]">No. Invoice:</span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.txId}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400 font-sans text-[11px]">Tanggal Beli:</span>
                                        <span className="font-bold">{purchaseDateStr}</span>
                                      </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-700">
                                      <span className="text-xs text-slate-400 font-medium">Harga Terbayar:</span>
                                      <span className="text-sm font-black text-slate-900 dark:text-white">
                                        Rp {(item.priceSell || item.price || 0).toLocaleString("id-ID")}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* TAB 2: RIWAYAT INVOICE TRANSAKSI */}
                    {historyActiveTab === "TRANSACTIONS" && (
                      <div className="space-y-3">
                        {customerTransactions.length === 0 ? (
                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
                            <Receipt className="h-8 w-8 text-slate-300 mx-auto" />
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Tidak Ada Riwayat Invoice</p>
                          </div>
                        ) : (
                          customerTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3"
                            >
                              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2.5">
                                <div>
                                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                                    INVOICE PENJUALAN
                                  </span>
                                  <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                    {tx.id}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-extrabold text-slate-500 block">
                                    {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    {tx.paymentMethod || "CASH"}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                {(tx.items || []).map((i: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs font-medium text-slate-700 dark:text-slate-300">
                                    <span>• {i.productName || `${i.brand} ${i.model}`} (IMEI: {i.imei || "-"})</span>
                                    <span className="font-bold">Rp {(i.priceSell || 0).toLocaleString("id-ID")}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-bold">Kasir: {tx.cashierName || "Kasir Toko"}</span>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">Total Akhir:</span>
                                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                    Rp {(tx.totalAmount || 0).toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TAB 3: GARANSI RESMI */}
                    {historyActiveTab === "WARRANTIES" && (
                      <div className="space-y-3">
                        {customerWarranties.length === 0 ? (
                          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
                            <ShieldCheck className="h-8 w-8 text-slate-300 mx-auto" />
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Belum Ada Kartu Garansi Tersimpan</p>
                          </div>
                        ) : (
                          customerWarranties.map((w) => {
                            const isExp = new Date(w.expiryDate) < new Date();
                            return (
                              <div
                                key={w.id}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">KARTU GARANSI UNIT</span>
                                    <h4 className="font-black text-slate-900 dark:text-white text-sm">{w.productName}</h4>
                                    <p className="text-xs text-slate-500 font-mono">IMEI: {w.imei || "-"}</p>
                                  </div>
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                    !isExp
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                                  }`}>
                                    {!isExp ? "GARANSI AKTIF" : "KADALUARSA"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block">TANGGAL KLAIM AWAL</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{w.purchaseDate || "-"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block">MASA KADALUARSA</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{w.expiryDate || "-"}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForHistory(null)}
                  className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-extrabold text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
