import React, { useState, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Package,
  FileText,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Download,
  Send,
  User,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  X,
  Layers,
  Sparkles,
  BookOpen
} from "lucide-react";
import { Supplier, PurchaseOrder, Product, SupplierDebtPayment } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

interface SupplierManagementProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
  onRefreshData: () => void;
  onNavigateToPO?: (supplierId?: string) => void;
  userRole?: string;
}

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
  suppliers = [],
  purchaseOrders = [],
  products = [],
  apiFetch,
  onRefreshData,
  onNavigateToPO,
  userRole = "ADMIN"
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "DEBT" | "PO_HISTORY" | "PRODUCTS">("DIRECTORY");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Form State - Add / Edit Supplier
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    category: "Distributor Resmi",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    bankName: "BCA",
    bankAccountName: "",
    bankAccountNumber: "",
    totalDebt: 0,
    paidDebt: 0,
    debtDueDate: "",
    suppliedCategories: [] as string[],
    notes: ""
  });

  // Debt Tab Filter State
  const [debtTabFilter, setDebtTabFilter] = useState<"ALL" | "NEAR_DUE" | "OVERDUE" | "UNPAID" | "PAID">("ALL");

  // Pagination & Search Filter States
  const [dirPage, setDirPage] = useState(1);
  const [dirItemsPerPage, setDirItemsPerPage] = useState(9);

  const [debtSearchQuery, setDebtSearchQuery] = useState("");
  const [debtPage, setDebtPage] = useState(1);
  const [debtItemsPerPage, setDebtItemsPerPage] = useState(10);

  const [paymentLogSearchQuery, setPaymentLogSearchQuery] = useState("");
  const [paymentLogPage, setPaymentLogPage] = useState(1);
  const [paymentLogItemsPerPage, setPaymentLogItemsPerPage] = useState(10);

  const [poSearchQuery, setPoSearchQuery] = useState("");
  const [poPage, setPoPage] = useState(1);
  const [poItemsPerPage, setPoItemsPerPage] = useState(10);

  const [prodSearchQuery, setProdSearchQuery] = useState("");
  const [prodPage, setProdPage] = useState(1);
  const [prodItemsPerPage, setProdItemsPerPage] = useState(10);

  useEffect(() => { setDirPage(1); }, [searchQuery, selectedCategory]);
  useEffect(() => { setDebtPage(1); }, [debtSearchQuery, debtTabFilter]);
  useEffect(() => { setPaymentLogPage(1); }, [paymentLogSearchQuery]);
  useEffect(() => { setPoPage(1); }, [poSearchQuery]);
  useEffect(() => { setProdPage(1); }, [prodSearchQuery, selectedSupplierId]);

  // Form State - Pay Debt
  const [payDebtForm, setPayDebtForm] = useState({
    supplierId: "",
    poId: "",
    amount: 0,
    paymentMethod: "TRANSFER" as "TUNAI" | "TRANSFER" | "GIRO" | "EDC",
    notes: "",
    recordedBy: "Admin"
  });

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Selected supplier details
  const activeSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0] || null;
  }, [suppliers, selectedSupplierId]);

  // Categories list
  const categoryOptions = [
    "Distributor Resmi",
    "Aksesoris",
    "Sparepart",
    "Grosir Import",
    "HP Bekas / Buyback",
    "Lainnya"
  ];

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.phone && s.phone.includes(searchQuery)) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === "ALL" || s.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [suppliers, searchQuery, selectedCategory]);

  // Financial Debt Calculations
  const totalDebtAll = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.totalDebt || 0), 0);
  }, [suppliers]);

  const totalPaidDebtAll = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.paidDebt || 0), 0);
  }, [suppliers]);

  const totalRemainingDebtAll = useMemo(() => {
    return suppliers.reduce((sum, s) => {
      const rem = s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
      return sum + rem;
    }, 0);
  }, [suppliers]);

  const suppliersWithDebtCount = useMemo(() => {
    return suppliers.filter((s) => {
      const rem = s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
      return rem > 0;
    }).length;
  }, [suppliers]);

  // POs related to active supplier or selected vendor
  const supplierPOs = useMemo(() => {
    if (!activeSupplier) return [];
    return purchaseOrders.filter(
      (po) =>
        po.supplierId === activeSupplier.id ||
        po.supplierName.toLowerCase() === activeSupplier.name.toLowerCase()
    );
  }, [purchaseOrders, activeSupplier]);

  // Products supplied by active supplier
  const supplierProducts = useMemo(() => {
    if (!activeSupplier) return [];
    return products.filter((p) => {
      // check purchasedImeisHistory
      const hasHist = p.purchasedImeisHistory?.some((h) =>
        h.supplier.toLowerCase().includes(activeSupplier.name.toLowerCase())
      );
      // check specifications or category
      const hasSpec = p.specifications?.toLowerCase().includes(activeSupplier.name.toLowerCase());
      return hasHist || hasSpec;
    });
  }, [products, activeSupplier]);

  // All debt payments across all suppliers
  const allDebtPayments = useMemo(() => {
    const list: (SupplierDebtPayment & { supplierName: string })[] = [];
    suppliers.forEach((s) => {
      if (s.debtPayments && Array.isArray(s.debtPayments)) {
        s.debtPayments.forEach((p) => {
          list.push({ ...p, supplierName: s.name });
        });
      }
    });
    return list.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [suppliers]);

  // Helper to calculate due date status and countdown
  const getDueDateInfo = (dueDateStr?: string, remainingDebt: number = 0) => {
    if (!remainingDebt || remainingDebt <= 0) {
      return { status: "PAID", label: "Lunas / Rp 0", color: "emerald", daysLeft: null, badgeBg: "bg-emerald-100 text-emerald-800" };
    }
    if (!dueDateStr) {
      return { status: "NO_DUE_DATE", label: "Belum Ada Tgl Jatuh Tempo", color: "slate", daysLeft: null, badgeBg: "bg-slate-100 text-slate-700" };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "OVERDUE", label: `⚠️ OVERDUE (Terlewat ${Math.abs(diffDays)} Hari)`, color: "rose", daysLeft: diffDays, badgeBg: "bg-rose-600 text-white animate-pulse" };
    } else if (diffDays === 0) {
      return { status: "TODAY", label: "🚨 JATUH TEMPO HARI INI!", color: "rose", daysLeft: 0, badgeBg: "bg-rose-500 text-white animate-bounce" };
    } else if (diffDays <= 7) {
      return { status: "NEAR_DUE", label: `⚡ MENDEKATI (${diffDays} Hari Lagi)`, color: "amber", daysLeft: diffDays, badgeBg: "bg-amber-500 text-white font-black" };
    } else {
      return { status: "SAFE", label: `Jatuh Tempo: ${dueDateStr} (${diffDays} Hari)`, color: "indigo", daysLeft: diffDays, badgeBg: "bg-indigo-100 text-indigo-800" };
    }
  };

  // Filtered & Paginated Arrays for Tab 1 (Directory)
  const paginatedSuppliers = useMemo(() => {
    const start = (dirPage - 1) * dirItemsPerPage;
    return filteredSuppliers.slice(start, start + dirItemsPerPage);
  }, [filteredSuppliers, dirPage, dirItemsPerPage]);

  // Tab 2 (Debt)
  const filteredDebtSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const remDebt = s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
      const dueInfo = getDueDateInfo(s.debtDueDate, remDebt);

      const matchesSearch =
        !debtSearchQuery ||
        s.name.toLowerCase().includes(debtSearchQuery.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(debtSearchQuery.toLowerCase())) ||
        (s.phone && s.phone.includes(debtSearchQuery));

      let matchesFilter = true;
      if (debtTabFilter === "NEAR_DUE") matchesFilter = dueInfo.status === "NEAR_DUE" || dueInfo.status === "TODAY";
      else if (debtTabFilter === "OVERDUE") matchesFilter = dueInfo.status === "OVERDUE";
      else if (debtTabFilter === "UNPAID") matchesFilter = remDebt > 0;
      else if (debtTabFilter === "PAID") matchesFilter = remDebt === 0;

      return matchesSearch && matchesFilter;
    });
  }, [suppliers, debtSearchQuery, debtTabFilter]);

  const paginatedDebtSuppliers = useMemo(() => {
    const start = (debtPage - 1) * debtItemsPerPage;
    return filteredDebtSuppliers.slice(start, start + debtItemsPerPage);
  }, [filteredDebtSuppliers, debtPage, debtItemsPerPage]);

  const filteredPaymentLogs = useMemo(() => {
    if (!paymentLogSearchQuery) return allDebtPayments;
    const q = paymentLogSearchQuery.toLowerCase();
    return allDebtPayments.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.paymentMethod.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [allDebtPayments, paymentLogSearchQuery]);

  const paginatedPaymentLogs = useMemo(() => {
    const start = (paymentLogPage - 1) * paymentLogItemsPerPage;
    return filteredPaymentLogs.slice(start, start + paymentLogItemsPerPage);
  }, [filteredPaymentLogs, paymentLogPage, paymentLogItemsPerPage]);

  // Tab 3 (PO History)
  const filteredPOs = useMemo(() => {
    if (!poSearchQuery) return purchaseOrders;
    const q = poSearchQuery.toLowerCase();
    return purchaseOrders.filter(
      (po) =>
        po.id.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.status.toLowerCase().includes(q) ||
        (po.paymentTerms && po.paymentTerms.toLowerCase().includes(q))
    );
  }, [purchaseOrders, poSearchQuery]);

  const paginatedPOs = useMemo(() => {
    const start = (poPage - 1) * poItemsPerPage;
    return filteredPOs.slice(start, start + poItemsPerPage);
  }, [filteredPOs, poPage, poItemsPerPage]);

  // Tab 4 (Products)
  const filteredSupplierProducts = useMemo(() => {
    if (!prodSearchQuery) return supplierProducts;
    const q = prodSearchQuery.toLowerCase();
    return supplierProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [supplierProducts, prodSearchQuery]);

  const paginatedSupplierProducts = useMemo(() => {
    const start = (prodPage - 1) * prodItemsPerPage;
    return filteredSupplierProducts.slice(start, start + prodItemsPerPage);
  }, [filteredSupplierProducts, prodPage, prodItemsPerPage]);

  // Open Edit Modal
  const handleOpenEdit = (s: Supplier) => {
    setFormData({
      id: s.id,
      name: s.name,
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      category: s.category || "Distributor Resmi",
      status: s.status || "ACTIVE",
      bankName: s.bankName || "BCA",
      bankAccountName: s.bankAccountName || "",
      bankAccountNumber: s.bankAccountNumber || "",
      totalDebt: s.totalDebt || 0,
      paidDebt: s.paidDebt || 0,
      debtDueDate: s.debtDueDate || "",
      suppliedCategories: s.suppliedCategories || [],
      notes: s.notes || ""
    });
    setIsEditModalOpen(true);
  };

  // Handle Save New Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast("error", "Nama Supplier dan No. Telepon Wajib Diisi!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        category: formData.category,
        status: formData.status,
        bankName: formData.bankName,
        bankAccountName: formData.bankAccountName,
        bankAccountNumber: formData.bankAccountNumber,
        totalDebt: Number(formData.totalDebt || 0),
        paidDebt: Number(formData.paidDebt || 0),
        remainingDebt: Math.max(0, Number(formData.totalDebt || 0) - Number(formData.paidDebt || 0)),
        debtDueDate: formData.debtDueDate,
        suppliedCategories: formData.suppliedCategories,
        notes: formData.notes
      };

      const res = await apiFetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res && (res.success || res.supplier)) {
        showToast("success", `Supplier ${formData.name} berhasil ditambahkan!`);
        setIsAddModalOpen(false);
        onRefreshData();
      } else {
        throw new Error(res?.message || "Gagal menambah supplier.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal menambah supplier.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Update Supplier
  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        category: formData.category,
        status: formData.status,
        bankName: formData.bankName,
        bankAccountName: formData.bankAccountName,
        bankAccountNumber: formData.bankAccountNumber,
        totalDebt: Number(formData.totalDebt || 0),
        paidDebt: Number(formData.paidDebt || 0),
        remainingDebt: Math.max(0, Number(formData.totalDebt || 0) - Number(formData.paidDebt || 0)),
        debtDueDate: formData.debtDueDate,
        suppliedCategories: formData.suppliedCategories,
        notes: formData.notes
      };

      const res = await apiFetch(`/api/suppliers/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res && (res.success || res.supplier)) {
        showToast("success", `Data supplier ${formData.name} berhasil diperbarui.`);
        setIsEditModalOpen(false);
        onRefreshData();
      } else {
        throw new Error(res?.message || "Gagal memperbarui data.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal memperbarui data.");
    } finally {
      setLoading(false);
    }
  };

  // Open Pay Debt Modal
  const handleOpenPayDebt = (s: Supplier) => {
    const rem = s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
    setPayDebtForm({
      supplierId: s.id,
      poId: "",
      amount: rem > 0 ? rem : 0,
      paymentMethod: "TRANSFER",
      notes: `Pembayaran hutang nota supplier ${s.name}`,
      recordedBy: "Admin"
    });
    setSelectedSupplierId(s.id);
    setIsPayDebtModalOpen(true);
  };

  // Submit Pay Debt
  const handlePayDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebtForm.supplierId || payDebtForm.amount <= 0) {
      showToast("error", "Jumlah pembayaran hutang harus lebih besar dari Rp 0.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`/api/suppliers/${payDebtForm.supplierId}/pay-debt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payDebtForm)
      });

      if (res && res.success) {
        showToast("success", `Pembayaran hutang sebesar Rp ${payDebtForm.amount.toLocaleString("id-ID")} berhasil dicatat!`);
        setIsPayDebtModalOpen(false);
        onRefreshData();
      } else {
        throw new Error(res?.message || "Gagal memproses pembayaran hutang.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal memproses pembayaran hutang.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus supplier ${name}?`)) return;

    setLoading(true);
    try {
      const res = await apiFetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res && res.success) {
        showToast("success", `Supplier ${name} telah dihapus.`);
        onRefreshData();
      }
    } catch (err: any) {
      showToast("error", "Gagal menghapus supplier.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  // Export Filtered Suppliers to CSV
  const handleExportSuppliersCSV = () => {
    const listToExport = filteredSuppliers.length > 0 ? filteredSuppliers : suppliers;
    if (listToExport.length === 0) {
      alert("Tidak ada data supplier untuk diekspor!");
      return;
    }

    const headers = [
      "ID Supplier",
      "Nama Pemasok / Supplier",
      "Kontak Person",
      "No Telepon / WA",
      "Email",
      "Alamat",
      "Kategori Vendor",
      "Status Vendor",
      "Bank",
      "Atas Nama",
      "No Rekening Bank",
      "Total Pembelian (Rp)",
      "Sisa Hutang (Rp)",
      "Tanggal Jatuh Tempo"
    ];

    const rows = listToExport.map((s) => {
      const remDebt = s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
      return [
        s.id || "",
        s.name || "",
        s.contactPerson || "",
        s.phone || "",
        s.email || "",
        s.address || "",
        s.category || "Distributor Resmi",
        s.status || "ACTIVE",
        s.bankName || "-",
        s.bankAccountName || "-",
        s.bankAccountNumber || "-",
        s.totalDebt || 0,
        remDebt,
        s.debtDueDate || "-"
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const csvContent = "\uFEFF" + XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Data_Supplier_Pemasok_FonePOS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Filtered Suppliers to PDF
  const handleExportSuppliersPDF = () => {
    const listToExport = filteredSuppliers.length > 0 ? filteredSuppliers : suppliers;
    if (listToExport.length === 0) {
      alert("Tidak ada data supplier untuk diekspor!");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const shopTitle = localStorage.getItem("print_shop_title") || "FONEPOS & SMARTPHONE STORE";
    const shopAddress = localStorage.getItem("print_shop_address") || "Roxy Mas Square Blok C2, Jakarta Pusat";

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 26, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`${shopTitle} - DAFTAR DIREKTORI PEMASOK / SUPPLIER`, 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`${shopAddress} | Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`, 14, 18);

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Filter Terpasang: Kategori (${selectedCategory === "ALL" ? "Semua Kategori" : selectedCategory}), Kata Kunci ("${searchQuery || "Semua"}") — Total: ${listToExport.length} Vendor`, 14, 32);

    const tableBody = listToExport.map((s, idx) => {
      const remDebt = s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
      return [
        idx + 1,
        s.id || "-",
        s.name || "-",
        s.contactPerson || "-",
        s.phone || "-",
        s.category || "Distributor",
        s.bankName && s.bankAccountNumber ? `${s.bankName} - ${s.bankAccountNumber}` : "-",
        `Rp ${(s.totalDebt || 0).toLocaleString("id-ID")}`,
        `Rp ${remDebt.toLocaleString("id-ID")}`,
        s.debtDueDate || "-",
        s.status || "ACTIVE"
      ];
    });

    autoTable(doc, {
      startY: 36,
      head: [["No", "ID Vendor", "Nama Pemasok / Supplier", "Kontak Person", "Telepon/WA", "Kategori", "Rekening Bank", "Total PO (Rp)", "Sisa Hutang (Rp)", "Jatuh Tempo", "Status"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59], cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Halaman ${i} dari ${totalPages} - Laporan Resmi Supplier FonePOS`, 148, 202, { align: "center" });
    }

    doc.save(`Export_Direktori_Supplier_FonePOS_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all transform animate-bounce ${
            toastMessage.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toastMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Building2 className="w-96 h-96 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
                Supply Chain & Vendor Hub
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi Multi-Outlet
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-400" /> Manajemen Supplier & Vendor
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
              Kelola data vendor resmi, riwayat Purchase Order (PO), pemetaan katalog produk per supplier, dan kontrol saldo hutang dagang secara akurat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormData({
                  id: "",
                  name: "",
                  contactPerson: "",
                  phone: "",
                  email: "",
                  address: "",
                  category: "Distributor Resmi",
                  status: "ACTIVE",
                  bankName: "BCA",
                  bankAccountName: "",
                  bankAccountNumber: "",
                  totalDebt: 0,
                  paidDebt: 0,
                  suppliedCategories: [],
                  notes: ""
                });
                setIsAddModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition shadow-lg hover:shadow-indigo-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Tambah Vendor Baru
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-5-0 uppercase tracking-wider text-slate-500">Total Vendor Aktif</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{suppliers.length} Vendor</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {suppliers.filter((s) => s.status !== "INACTIVE").length} Vendor aktif bertransaksi
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Hutang Supplier</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalDebtAll)}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {suppliersWithDebtCount} vendor memiliki saldo hutang
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Hutang Belum Lunas (Sisa)</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalRemainingDebtAll)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalDebtAll > 0
                ? `Sisa ${((totalRemainingDebtAll / totalDebtAll) * 100).toFixed(0)}% dari total hutang`
                : "Tidak ada beban hutang"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Pelunasan Hutang (Total)</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaidDebtAll)}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {allDebtPayments.length} riwayat transaksi pelunasan
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab("DIRECTORY")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "DIRECTORY"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" /> Daftar Vendor ({suppliers.length})
          </button>

          <button
            onClick={() => setActiveTab("DEBT")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "DEBT"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Status Hutang Supplier
            {suppliersWithDebtCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full font-bold">
                {suppliersWithDebtCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("PO_HISTORY")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "PO_HISTORY"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" /> Riwayat PO Supplier
          </button>

          <button
            onClick={() => setActiveTab("PRODUCTS")}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "PRODUCTS"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Package className="w-4 h-4" /> Produk per Supplier
          </button>
        </div>

        {/* Quick Refresh Button */}
        <button
          onClick={onRefreshData}
          className="px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ml-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama vendor, kontak, telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" /> Kategori:
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Semua Kategori Vendor</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <button
              onClick={handleExportSuppliersCSV}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs whitespace-nowrap cursor-pointer"
              title="Ekspor data supplier/vendor terfilter ke format CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Ekspor CSV
            </button>
            <button
              onClick={handleExportSuppliersPDF}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition active:scale-95 shadow-xs whitespace-nowrap cursor-pointer"
              title="Ekspor data supplier/vendor terfilter ke format PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              Ekspor PDF
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DAFTAR VENDOR / DIRECTORY */}
      {activeTab === "DIRECTORY" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedSuppliers.map((s) => {
            const remDebt =
              s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
            const poCount = purchaseOrders.filter(
              (p) => p.supplierId === s.id || p.supplierName.toLowerCase() === s.name.toLowerCase()
            ).length;

            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                        {s.category || "General Vendor"}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">{s.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit Supplier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(s.id, s.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                        title="Hapus Supplier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-3">
                    {s.contactPerson && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>PIC: <strong className="text-slate-800">{s.contactPerson}</strong></span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`https://wa.me/${s.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                        {s.phone} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{s.address || "Alamat belum diisi"}</span>
                    </div>

                    {s.bankName && s.bankAccountNumber && (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-2">
                        <CreditCard className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="font-semibold text-slate-800">{s.bankName} - {s.bankAccountNumber}</p>
                          <p className="text-[10px] text-slate-500">a.n. {s.bankAccountName || s.name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Financial Debt Status Box */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Sisa Hutang:</span>
                      <span className={`font-bold ${remDebt > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {remDebt > 0 ? formatCurrency(remDebt) : "LUNAS / Rp 0"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Total PO Terlibat:</span>
                      <span className="font-semibold text-slate-800">{poCount} PO</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedSupplierId(s.id);
                      setIsDetailDrawerOpen(true);
                    }}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Detail Vendor & Produk <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {remDebt > 0 ? (
                    <button
                      onClick={() => handleOpenPayDebt(s)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-sm"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Bayar Hutang
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigateToPO?.(s.id)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Buat PO
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredSuppliers.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700">Tidak ada vendor ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau kategori vendor.</p>
            </div>
          )}
          </div>

          {/* Directory Pagination Footer */}
          <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={dirItemsPerPage}
                onChange={(e) => {
                  setDirItemsPerPage(Number(e.target.value));
                  setDirPage(1);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={15}>15</option>
                <option value={30}>30</option>
              </select>
              <span>vendor per halaman</span>
            </div>

            <div className="font-medium text-slate-500">
              Menampilkan <strong>{filteredSuppliers.length === 0 ? 0 : (dirPage - 1) * dirItemsPerPage + 1}</strong> - <strong>{Math.min(dirPage * dirItemsPerPage, filteredSuppliers.length)}</strong> dari <strong>{filteredSuppliers.length}</strong> vendor
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDirPage(1)}
                disabled={dirPage === 1}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                title="Halaman Pertama"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setDirPage((prev) => Math.max(prev - 1, 1))}
                disabled={dirPage === 1}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              >
                ‹
              </button>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-extrabold">
                Hal {dirPage} / {Math.ceil(filteredSuppliers.length / dirItemsPerPage) || 1}
              </span>
              <button
                type="button"
                onClick={() => setDirPage((prev) => Math.min(prev + 1, Math.ceil(filteredSuppliers.length / dirItemsPerPage) || 1))}
                disabled={dirPage >= Math.ceil(filteredSuppliers.length / dirItemsPerPage)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setDirPage(Math.ceil(filteredSuppliers.length / dirItemsPerPage) || 1)}
                disabled={dirPage >= Math.ceil(filteredSuppliers.length / dirItemsPerPage)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                title="Halaman Terakhir"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATUS HUTANG SUPPLIER */}
      {activeTab === "DEBT" && (
        <div className="space-y-6">
          {/* Debt Summary Banner & Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" /> Pelacakan Jatuh Tempo & Saldo Hutang Supplier
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau tanggal jatuh tempo tagihan vendor untuk menjaga reputasi ketersediaan barang dan tempo kredit toko.
                </p>
              </div>

              {/* Debt Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setDebtTabFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    debtTabFilter === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua ({suppliers.length})
                </button>
                <button
                  onClick={() => setDebtTabFilter("NEAR_DUE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    debtTabFilter === "NEAR_DUE"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  ⚡ Mendekati (H-7)
                </button>
                <button
                  onClick={() => setDebtTabFilter("OVERDUE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    debtTabFilter === "OVERDUE"
                      ? "bg-rose-600 text-white shadow-xs animate-pulse"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  }`}
                >
                  🚨 Overdue / Terlewat
                </button>
                <button
                  onClick={() => setDebtTabFilter("UNPAID")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    debtTabFilter === "UNPAID"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  Belum Lunas
                </button>
                <button
                  onClick={() => setDebtTabFilter("PAID")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    debtTabFilter === "PAID"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  Lunas
                </button>
              </div>
            </div>
          </div>

          {/* Supplier Debt Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Daftar Tagihan & Jatuh Tempo Pembayaran
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  Sisa Total Hutang: <strong className="text-rose-600 font-bold">{formatCurrency(totalRemainingDebtAll)}</strong>
                </span>
              </div>

              {/* Real-time search for debt table */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari vendor / kontak hutang..."
                  value={debtSearchQuery}
                  onChange={(e) => setDebtSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Nama Vendor / Supplier</th>
                    <th className="px-4 py-3">Total & Sisa Hutang</th>
                    <th className="px-4 py-3">Tgl Jatuh Tempo</th>
                    <th className="px-4 py-3">Status & Countdown</th>
                    <th className="px-4 py-3 text-right">Aksi Pelunasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {paginatedDebtSuppliers.map((s) => {
                      const remDebt =
                        s.remainingDebt !== undefined ? s.remainingDebt : Math.max(0, (s.totalDebt || 0) - (s.paidDebt || 0));
                      const dueInfo = getDueDateInfo(s.debtDueDate, remDebt);

                      const isDueOrOverdue = remDebt > 0 && (dueInfo.status === "OVERDUE" || dueInfo.status === "TODAY");
                      const isNearDue = remDebt > 0 && dueInfo.status === "NEAR_DUE";

                      const rowBgClass = isDueOrOverdue
                        ? "bg-rose-100/80 hover:bg-rose-200/90 border-l-4 border-l-rose-600 font-medium text-rose-950 transition-colors"
                        : isNearDue
                        ? "bg-rose-50/80 hover:bg-rose-100/80 border-l-4 border-l-rose-500 text-slate-900 transition-colors"
                        : remDebt === 0
                        ? "bg-emerald-50/30 hover:bg-emerald-50/60 border-l-4 border-l-emerald-500 transition-colors"
                        : "hover:bg-slate-50 border-l-4 border-l-transparent transition-colors";

                      // WA reminder link generator
                      const sendWaReminder = () => {
                        const cleanPhone = (s.phone || "").replace(/[^0-9]/g, "");
                        const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
                        const msg = `Halo Bpk/Ibu ${s.contactPerson || s.name}, perihal konfirmasi pembayaran tagihan toko kami sebesar ${formatCurrency(remDebt)}${s.debtDueDate ? ` dengan tanggal jatuh tempo ${s.debtDueDate}` : ""}. Mohon dapat diinfokan nomor rekening tujuan transfer. Terima kasih.`;
                        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                      };

                      return (
                        <tr key={s.id} className={rowBgClass}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {(isDueOrOverdue || isNearDue) && (
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    isDueOrOverdue ? "bg-rose-600 animate-pulse ring-2 ring-rose-400" : "bg-rose-500 animate-bounce"
                                  }`}
                                  title="Peringatan Jatuh Tempo Tagihan"
                                />
                              )}
                              <span className={`font-bold ${isDueOrOverdue ? "text-rose-950" : isNearDue ? "text-rose-900" : "text-slate-900"}`}>
                                {s.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                              PIC: {s.contactPerson || "-"} ({s.phone || "-"})
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">Sisa: <span className={remDebt > 0 ? "text-rose-600" : "text-emerald-600"}>{formatCurrency(remDebt)}</span></div>
                            <div className="text-[10px] text-slate-400">Total awal: {formatCurrency(s.totalDebt || 0)}</div>
                          </td>

                          <td className="px-4 py-3 font-mono font-medium text-slate-800">
                            {s.debtDueDate ? s.debtDueDate : <span className="text-slate-400 font-sans italic text-[11px]">Belum diatur</span>}
                          </td>

                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${dueInfo.badgeBg}`}>
                              {dueInfo.status === "OVERDUE" && <AlertTriangle className="w-3 h-3 shrink-0" />}
                              {dueInfo.status === "TODAY" && <Clock className="w-3 h-3 shrink-0" />}
                              {dueInfo.status === "NEAR_DUE" && <Clock className="w-3 h-3 shrink-0" />}
                              {dueInfo.status === "PAID" && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                              {dueInfo.label}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {remDebt > 0 && (
                                <button
                                  onClick={sendWaReminder}
                                  title="Kirim Pesan Konfirmasi WA ke Vendor"
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1"
                                >
                                  <PhoneCall className="w-3 h-3" /> WA
                                </button>
                              )}

                              {remDebt > 0 ? (
                                <button
                                  onClick={() => handleOpenPayDebt(s)}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                                >
                                  Bayar Hutang
                                </button>
                              ) : (
                                <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                                </span>
                              )}

                              <button
                                onClick={() => handleOpenEdit(s)}
                                title="Edit Tanggal Jatuh Tempo / Supplier"
                                className="p-1 hover:bg-slate-200 text-slate-500 rounded-md transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Debt Table Pagination Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Tampilkan</span>
                <select
                  value={debtItemsPerPage}
                  onChange={(e) => {
                    setDebtItemsPerPage(Number(e.target.value));
                    setDebtPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>tagihan per halaman</span>
              </div>

              <div className="font-medium text-slate-500">
                Menampilkan <strong>{filteredDebtSuppliers.length === 0 ? 0 : (debtPage - 1) * debtItemsPerPage + 1}</strong> - <strong>{Math.min(debtPage * debtItemsPerPage, filteredDebtSuppliers.length)}</strong> dari <strong>{filteredDebtSuppliers.length}</strong> tagihan
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDebtPage(1)}
                  disabled={debtPage === 1}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setDebtPage((prev) => Math.max(prev - 1, 1))}
                  disabled={debtPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  ‹
                </button>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-extrabold">
                  Hal {debtPage} / {Math.ceil(filteredDebtSuppliers.length / debtItemsPerPage) || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setDebtPage((prev) => Math.min(prev + 1, Math.ceil(filteredDebtSuppliers.length / debtItemsPerPage) || 1))}
                  disabled={debtPage >= Math.ceil(filteredDebtSuppliers.length / debtItemsPerPage)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setDebtPage(Math.ceil(filteredDebtSuppliers.length / debtItemsPerPage) || 1)}
                  disabled={debtPage >= Math.ceil(filteredDebtSuppliers.length / debtItemsPerPage)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  »
                </button>
              </div>
            </div>
          </div>

          {/* Riwayat Pembayaran Hutang Global */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Log Riwayat Pembayaran Hutang Supplier
              </h3>

              {/* Real-time search for payment logs */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari log pembayaran / nota..."
                  value={paymentLogSearchQuery}
                  onChange={(e) => setPaymentLogSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ID Pembayaran</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Supplier Vendor</th>
                    <th className="px-4 py-3">Jumlah Dibayar</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Catatan</th>
                    <th className="px-4 py-3">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {paginatedPaymentLogs.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-slate-900 font-semibold">{p.id}</td>
                      <td className="px-4 py-3">{p.paymentDate}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.supplierName}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{p.notes || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{p.recordedBy || "Admin"}</td>
                    </tr>
                  ))}

                  {filteredPaymentLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Belum ada catatan riwayat pembayaran hutang.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment Log Pagination Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Tampilkan</span>
                <select
                  value={paymentLogItemsPerPage}
                  onChange={(e) => {
                    setPaymentLogItemsPerPage(Number(e.target.value));
                    setPaymentLogPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>log per halaman</span>
              </div>

              <div className="font-medium text-slate-500">
                Menampilkan <strong>{filteredPaymentLogs.length === 0 ? 0 : (paymentLogPage - 1) * paymentLogItemsPerPage + 1}</strong> - <strong>{Math.min(paymentLogPage * paymentLogItemsPerPage, filteredPaymentLogs.length)}</strong> dari <strong>{filteredPaymentLogs.length}</strong> log
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentLogPage(1)}
                  disabled={paymentLogPage === 1}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentLogPage((prev) => Math.max(prev - 1, 1))}
                  disabled={paymentLogPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  ‹
                </button>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-extrabold">
                  Hal {paymentLogPage} / {Math.ceil(filteredPaymentLogs.length / paymentLogItemsPerPage) || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPaymentLogPage((prev) => Math.min(prev + 1, Math.ceil(filteredPaymentLogs.length / paymentLogItemsPerPage) || 1))}
                  disabled={paymentLogPage >= Math.ceil(filteredPaymentLogs.length / paymentLogItemsPerPage)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentLogPage(Math.ceil(filteredPaymentLogs.length / paymentLogItemsPerPage) || 1)}
                  disabled={paymentLogPage >= Math.ceil(filteredPaymentLogs.length / paymentLogItemsPerPage)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT PO SUPPLIER */}
      {activeTab === "PO_HISTORY" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Riwayat Purchase Order (PO) per Vendor
            </h3>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari PO / vendor / status..."
                  value={poSearchQuery}
                  onChange={(e) => setPoSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={() => onNavigateToPO?.()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Buat PO Baru
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">No. PO</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Supplier</th>
                  <th className="px-4 py-3">Item Barang</th>
                  <th className="px-4 py-3">Total Nilai PO</th>
                  <th className="px-4 py-3">Syarat Bayar</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {paginatedPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{po.id}</td>
                    <td className="px-4 py-3">{new Date(po.createdAt || po.date).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{po.supplierName}</td>
                    <td className="px-4 py-3">
                      {po.items?.length || 0} Jenis Produk (
                      {po.items?.reduce((s, i) => s + (i.qty || 1), 0)} unit)
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(po.totalAmount || 0)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[10px]">
                        {po.paymentTerms || "CASH"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          po.status === "RECEIVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : po.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : po.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredPOs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Belum ada Purchase Order (PO) terdaftar dalam sistem.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PO Pagination Footer */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={poItemsPerPage}
                onChange={(e) => {
                  setPoItemsPerPage(Number(e.target.value));
                  setPoPage(1);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>PO per halaman</span>
            </div>

            <div className="font-medium text-slate-500">
              Menampilkan <strong>{filteredPOs.length === 0 ? 0 : (poPage - 1) * poItemsPerPage + 1}</strong> - <strong>{Math.min(poPage * poItemsPerPage, filteredPOs.length)}</strong> dari <strong>{filteredPOs.length}</strong> PO
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPoPage(1)}
                disabled={poPage === 1}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setPoPage((prev) => Math.max(prev - 1, 1))}
                disabled={poPage === 1}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              >
                ‹
              </button>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-extrabold">
                Hal {poPage} / {Math.ceil(filteredPOs.length / poItemsPerPage) || 1}
              </span>
              <button
                type="button"
                onClick={() => setPoPage((prev) => Math.min(prev + 1, Math.ceil(filteredPOs.length / poItemsPerPage) || 1))}
                disabled={poPage >= Math.ceil(filteredPOs.length / poItemsPerPage)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setPoPage(Math.ceil(filteredPOs.length / poItemsPerPage) || 1)}
                disabled={poPage >= Math.ceil(filteredPOs.length / poItemsPerPage)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRODUK PER SUPPLIER */}
      {activeTab === "PRODUCTS" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" /> Pilih Supplier untuk Melihat Katalog Produk:
            </label>
            <select
              value={selectedSupplierId || ""}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 w-full sm:w-72"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category || "Vendor"})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" /> Daftar Produk yang Disuplai oleh{" "}
                <span className="text-indigo-600">{activeSupplier?.name}</span>
              </h3>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari produk / brand / tipe..."
                    value={prodSearchQuery}
                    onChange={(e) => setProdSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-xs text-slate-500 shrink-0">{filteredSupplierProducts.length} Produk</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3">Brand & Tipe</th>
                    <th className="px-4 py-3">Stok Aktif</th>
                    <th className="px-4 py-3">Harga Beli (HPP)</th>
                    <th className="px-4 py-3">Harga Jual</th>
                    <th className="px-4 py-3">Estimasi Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {paginatedSupplierProducts.map((p) => {
                    const margin = p.priceSell - p.priceBuy;
                    const marginPct = p.priceBuy > 0 ? ((margin / p.priceBuy) * 100).toFixed(1) : "0";

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {p.brand} ({p.type})
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-600">{p.stock} unit</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(p.priceBuy)}</td>
                        <td className="px-4 py-3 font-medium text-emerald-600">{formatCurrency(p.priceSell)}</td>
                        <td className="px-4 py-3 font-bold text-indigo-700">
                          +{formatCurrency(margin)} ({marginPct}%)
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSupplierProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Belum ada pemetaan produk spesifik untuk supplier ini dalam riwayat pengadaan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Products Pagination Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Tampilkan</span>
                <select
                  value={prodItemsPerPage}
                  onChange={(e) => {
                    setProdItemsPerPage(Number(e.target.value));
                    setProdPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>produk per halaman</span>
              </div>

              <div className="font-medium text-slate-500">
                Menampilkan <strong>{filteredSupplierProducts.length === 0 ? 0 : (prodPage - 1) * prodItemsPerPage + 1}</strong> - <strong>{Math.min(prodPage * prodItemsPerPage, filteredSupplierProducts.length)}</strong> dari <strong>{filteredSupplierProducts.length}</strong> produk
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setProdPage(1)}
                  disabled={prodPage === 1}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setProdPage((prev) => Math.max(prev - 1, 1))}
                  disabled={prodPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  ‹
                </button>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-extrabold">
                  Hal {prodPage} / {Math.ceil(filteredSupplierProducts.length / prodItemsPerPage) || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setProdPage((prev) => Math.min(prev + 1, Math.ceil(filteredSupplierProducts.length / prodItemsPerPage) || 1))}
                  disabled={prodPage >= Math.ceil(filteredSupplierProducts.length / prodItemsPerPage)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setProdPage(Math.ceil(filteredSupplierProducts.length / prodItemsPerPage) || 1)}
                  disabled={prodPage >= Math.ceil(filteredSupplierProducts.length / prodItemsPerPage)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH VENDOR */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" /> Tambah Vendor Supplier Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Vendor / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Teletama Artha Mandiri"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIC / Person in Charge</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Hendra"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Telepon / WA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Vendor</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor / Gudang</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Gajah Mada No. 10, Jakarta Pusat"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {/* Bank Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Informasi Rekening Bank Vendor (Pembayaran PO)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Bank</label>
                    <input
                      type="text"
                      placeholder="BCA/Mandiri"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">No. Rekening</label>
                    <input
                      type="text"
                      placeholder="0012988341"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Atas Nama (A.N)</label>
                    <input
                      type="text"
                      placeholder="PT TAM"
                      value={formData.bankAccountName}
                      onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Debt Initial */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Awal Saldo Hutang (Rp)</label>
                  <input
                    type="number"
                    value={formData.totalDebt}
                    onChange={(e) => setFormData({ ...formData, totalDebt: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Jatuh Tempo</label>
                  <input
                    type="date"
                    value={formData.debtDueDate}
                    onChange={(e) => setFormData({ ...formData, debtDueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Khusus</label>
                  <input
                    type="text"
                    placeholder="Kredit Tempo 30 Hari"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-sm"
                >
                  {loading ? "Menyimpan..." : "Simpan Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT VENDOR */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" /> Edit Data Vendor Supplier
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Vendor</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIC</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Telepon</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {/* Debt update */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Hutang (Rp)</label>
                  <input
                    type="number"
                    value={formData.totalDebt}
                    onChange={(e) => setFormData({ ...formData, totalDebt: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sudah Dibayar (Rp)</label>
                  <input
                    type="number"
                    value={formData.paidDebt}
                    onChange={(e) => setFormData({ ...formData, paidDebt: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Jatuh Tempo</label>
                  <input
                    type="date"
                    value={formData.debtDueDate}
                    onChange={(e) => setFormData({ ...formData, debtDueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500"
                >
                  {loading ? "Menyimpan..." : "Update Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAYAR HUTANG SUPPLIER */}
      {isPayDebtModalOpen && activeSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Form Pelunasan Hutang Supplier
              </h3>
              <button
                onClick={() => setIsPayDebtModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayDebtSubmit} className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900">
                <p className="font-bold text-sm">{activeSupplier.name}</p>
                <p className="text-xs mt-0.5">
                  Sisa Tagihan Hutang:{" "}
                  <strong className="text-rose-600">
                    {formatCurrency(
                      activeSupplier.remainingDebt !== undefined
                        ? activeSupplier.remainingDebt
                        : Math.max(0, (activeSupplier.totalDebt || 0) - (activeSupplier.paidDebt || 0))
                    )}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Pembayaran (Rp)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={payDebtForm.amount}
                  onChange={(e) => setPayDebtForm({ ...payDebtForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={payDebtForm.paymentMethod}
                    onChange={(e) =>
                      setPayDebtForm({
                        ...payDebtForm,
                        paymentMethod: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="TUNAI">Kas Tunai Toko</option>
                    <option value="GIRO">Cek / Giro</option>
                    <option value="EDC">Kartu Debit/Kredit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ID Nota PO (Opsional)</label>
                  <input
                    type="text"
                    placeholder="PO-20260723-001"
                    value={payDebtForm.poId}
                    onChange={(e) => setPayDebtForm({ ...payDebtForm, poId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan Pembayaran</label>
                <input
                  type="text"
                  placeholder="Pelunasan Cicilan Ke-2 Invoice PO Xiaomi"
                  value={payDebtForm.notes}
                  onChange={(e) => setPayDebtForm({ ...payDebtForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayDebtModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition shadow-md"
                >
                  {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: DETAIL SUPPLIER & PRODUCTS */}
      {isDetailDrawerOpen && activeSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md">
                    {activeSupplier.category || "Vendor"}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{activeSupplier.name}</h2>
                </div>
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vendor Info Cards */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-xs border border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PIC / Contact:</span>
                    <strong className="text-slate-800">{activeSupplier.contactPerson || "-"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">No. Telepon / WA:</span>
                    <strong className="text-slate-800">{activeSupplier.phone}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Alamat:</span>
                  <p className="text-slate-700">{activeSupplier.address || "-"}</p>
                </div>

                {activeSupplier.bankName && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Rekening Bank:</span>
                    <p className="font-semibold text-slate-800">
                      {activeSupplier.bankName} - {activeSupplier.bankAccountNumber} (a.n {activeSupplier.bankAccountName})
                    </p>
                  </div>
                )}
              </div>

              {/* PO History for this Supplier */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Riwayat PO Vendor Ini ({supplierPOs.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {supplierPOs.map((po) => (
                    <div
                      key={po.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-mono font-bold text-indigo-600">{po.id}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(po.createdAt || po.date).toLocaleDateString("id-ID")}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900">{formatCurrency(po.totalAmount)}</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded">
                          {po.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {supplierPOs.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Belum ada Purchase Order untuk vendor ini.</p>
                  )}
                </div>
              </div>

              {/* Products Supplied */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" /> Produk Disuplai ({supplierProducts.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {supplierProducts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-500">Stok: {p.stock} unit</p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-800">HPP: {formatCurrency(p.priceBuy)}</p>
                        <p className="text-emerald-600 font-bold">Jual: {formatCurrency(p.priceSell)}</p>
                      </div>
                    </div>
                  ))}

                  {supplierProducts.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Belum ada produk yang disuplai oleh vendor ini.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => onNavigateToPO?.(activeSupplier.id)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Buat Purchase Order untuk {activeSupplier.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
