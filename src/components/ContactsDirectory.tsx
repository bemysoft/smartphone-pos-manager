import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Building2, 
  UserCheck, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Tag, 
  Award, 
  AlertCircle,
  ExternalLink,
  Copy,
  UserPlus
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { Supplier, Customer, Employee, UserRole } from "../types";
import { INITIAL_SUPPLIERS } from "../data";
import { useLanguage } from "../contexts/LanguageContext";

interface ContactsDirectoryProps {
  currentUser: any;
  onNavigateToEmployees?: () => void;
}

export default function ContactsDirectory({ currentUser, onNavigateToEmployees }: ContactsDirectoryProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"suppliers" | "customers" | "employees">("suppliers");

  // Data states
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"supplier" | "customer" | "employee">("supplier");
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCategory, setFormCategory] = useState("Distributor Resmi");
  const [formRole, setFormRole] = useState<"REGULAR" | "MEMBER" | "VIP">("REGULAR");
  const [formEmpRole, setFormEmpRole] = useState<UserRole>(UserRole.CASHIER);
  const [formNotes, setFormNotes] = useState("");
  const [formEmergency, setFormEmergency] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [supRes, custRes, empRes] = await Promise.all([
        apiFetch("/api/suppliers"),
        apiFetch("/api/customers"),
        apiFetch("/api/employees")
      ]);

      let loadedSuppliers: Supplier[] = [];
      if (supRes.ok) {
        const supData = await supRes.json();
        if (Array.isArray(supData) && supData.length > 0) {
          loadedSuppliers = supData;
        }
      }

      // Fallback to localStorage or INITIAL_SUPPLIERS if API returned empty
      if (loadedSuppliers.length === 0) {
        const saved = localStorage.getItem("app_suppliers");
        if (saved) {
          try { loadedSuppliers = JSON.parse(saved); } catch (e) { loadedSuppliers = INITIAL_SUPPLIERS; }
        } else {
          loadedSuppliers = INITIAL_SUPPLIERS;
        }
      }

      // Check POs in localStorage for any extra suppliers
      const savedPOs = localStorage.getItem("app_purchase_orders");
      if (savedPOs) {
        try {
          const poList = JSON.parse(savedPOs);
          if (Array.isArray(poList)) {
            poList.forEach((po: any) => {
              if (po.supplierName && !loadedSuppliers.some(s => s.name.toLowerCase() === po.supplierName.toLowerCase())) {
                loadedSuppliers.push({
                  id: po.supplierId || `SPL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  tenantId: "tenant_demo_1",
                  name: po.supplierName,
                  contactPerson: po.supplierContactPerson || "Contact PO",
                  phone: po.supplierPhone || "0812-3456-7890",
                  address: po.supplierAddress || "Alamat Supplier PO",
                  category: "Supplier PO"
                });
              }
            });
          }
        } catch (e) {}
      }

      setSuppliers(loadedSuppliers);
      localStorage.setItem("app_suppliers", JSON.stringify(loadedSuppliers));

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData);
      }
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }
    } catch (err) {
      console.error("Gagal memuat direktori kontak:", err);
      const saved = localStorage.getItem("app_suppliers");
      if (saved) {
        try { setSuppliers(JSON.parse(saved)); } catch (e) { setSuppliers(INITIAL_SUPPLIERS); }
      } else {
        setSuppliers(INITIAL_SUPPLIERS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format WhatsApp Link
  const getWhatsAppLink = (phone: string, name: string) => {
    if (!phone) return "#";
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    const message = encodeURIComponent(`Halo ${name}, salam dari tim NexusPOS Store.`);
    return `https://wa.me/${cleaned}?text=${message}`;
  };

  // Open Modal Helper
  const handleOpenModal = (type: "supplier" | "customer" | "employee", item?: any) => {
    setModalType(type);
    setEditingItem(item || null);

    if (type === "supplier") {
      setFormName(item?.name || "");
      setFormContactPerson(item?.contactPerson || "");
      setFormPhone(item?.phone || "");
      setFormEmail(item?.email || "");
      setFormAddress(item?.address || "");
      setFormCategory(item?.category || "Distributor Resmi");
      setFormNotes(item?.notes || "");
    } else if (type === "customer") {
      setFormName(item?.name || "");
      setFormPhone(item?.phone || "");
      setFormEmail(item?.email || "");
      setFormAddress(item?.address || "");
      setFormRole(item?.role || "REGULAR");
      setFormNotes(item?.notes || "");
    } else if (type === "employee") {
      setFormName(item?.name || "");
      setFormPhone(item?.phone || "");
      setFormEmail(item?.email || "");
      setFormAddress(item?.address || "");
      setFormEmpRole(item?.role || UserRole.CASHIER);
      setFormEmergency(item?.emergencyContact || "");
    }

    setIsModalOpen(true);
  };

  // Submit Modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert("Nama dan nomor HP/WA wajib diisi.");
      return;
    }

    try {
      if (modalType === "supplier") {
        const payload = {
          name: formName,
          contactPerson: formContactPerson,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
          category: formCategory,
          notes: formNotes
        };

        const url = editingItem ? `/api/suppliers/${editingItem.id}` : "/api/suppliers";
        const method = editingItem ? "PUT" : "POST";
        const res = await apiFetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast(editingItem ? "Kontak supplier berhasil diperbarui!" : "Kontak supplier baru berhasil ditambahkan!");
        } else {
          showToast("Kontak supplier disimpan secara lokal.");
        }
        
        // Update local state & localStorage immediately
        const updatedSupplierItem: Supplier = {
          id: editingItem ? editingItem.id : `SPL-${Date.now()}`,
          tenantId: "tenant_demo_1",
          name: formName,
          contactPerson: formContactPerson,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
          category: formCategory,
          notes: formNotes
        };
        
        setSuppliers(prev => {
          let nextList;
          if (editingItem) {
            nextList = prev.map(s => s.id === editingItem.id ? { ...s, ...updatedSupplierItem } : s);
          } else {
            nextList = [updatedSupplierItem, ...prev];
          }
          localStorage.setItem("app_suppliers", JSON.stringify(nextList));
          return nextList;
        });

        setIsModalOpen(false);
        fetchData();
      } else if (modalType === "customer") {
        const payload = {
          name: formName,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
          role: formRole,
          notes: formNotes
        };

        const url = editingItem ? `/api/customers/${editingItem.id}` : "/api/customers";
        const method = editingItem ? "PUT" : "POST";
        const res = await apiFetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast(editingItem ? "Kontak pelanggan berhasil diperbarui!" : "Kontak pelanggan baru berhasil ditambahkan!");
          setIsModalOpen(false);
          fetchData();
        }
      } else if (modalType === "employee") {
        if (!editingItem) {
          alert("Gunakan menu Manajemen Karyawan untuk membuat akun karyawan baru.");
          return;
        }
        const payload = {
          name: formName,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
          emergencyContact: formEmergency
        };

        const res = await apiFetch(`/api/employees/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast("Detail kontak karyawan berhasil diperbarui!");
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan data.");
    }
  };

  // Delete Handler
  const handleDelete = async (type: "supplier" | "customer", id: string, name: string) => {
    if (!confirm(`Hapus kontak ${name}?`)) return;

    try {
      const endpoint = type === "supplier" ? `/api/suppliers/${id}` : `/api/customers/${id}`;
      const res = await apiFetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        showToast(`Kontak ${name} berhasil dihapus.`);
        fetchData();
      }
    } catch (err) {
      alert("Gagal menghapus kontak.");
    }
  };

  // Copy text to clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} terpalin: ${text}`);
  };

  // Filters
  const filteredSuppliers = suppliers.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q));
    const matchesCategory = categoryFilter === "ALL" ? true : (s.category === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));
    const matchesCategory = categoryFilter === "ALL" ? true : (c.role === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const filteredEmployees = employees.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = e.name.toLowerCase().includes(q) ||
      e.username.toLowerCase().includes(q) ||
      (e.phone && e.phone.includes(q)) ||
      e.email.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "ALL" ? true : (e.role === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <Check className="h-4 w-4" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Direktori Kontak & Buku Alamat
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pusat data kontak resmi Supplier Pemasok, Pelanggan Konsumen, dan Karyawan Toko.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Refresh Data Kontak"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          {activeTab === "suppliers" && (
            <button
              onClick={() => handleOpenModal("supplier")}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-primary-600/10 cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              Tambah Kontak Supplier
            </button>
          )}

          {activeTab === "customers" && (
            <button
              onClick={() => handleOpenModal("customer")}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/10 cursor-pointer transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Tambah Kontak Konsumen
            </button>
          )}

          {activeTab === "employees" && onNavigateToEmployees && (
            <button
              onClick={onNavigateToEmployees}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              Kelola Akun & Target Staf
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 relative overflow-x-auto">
        <button
          onClick={() => { setActiveTab("suppliers"); setCategoryFilter("ALL"); }}
          className={`relative pb-3.5 px-5 text-xs font-extrabold tracking-tight cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "suppliers" ? "text-primary-600 dark:text-primary-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Kontak Supplier / Pemasok ({suppliers.length})
          {activeTab === "suppliers" && (
            <motion.div layoutId="contactTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("customers"); setCategoryFilter("ALL"); }}
          className={`relative pb-3.5 px-5 text-xs font-extrabold tracking-tight cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "customers" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <Users className="h-4 w-4" />
          Kontak Konsumen / Pelanggan ({customers.length})
          {activeTab === "customers" && (
            <motion.div layoutId="contactTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("employees"); setCategoryFilter("ALL"); }}
          className={`relative pb-3.5 px-5 text-xs font-extrabold tracking-tight cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "employees" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Kontak Karyawan & Staf ({employees.length})
          {activeTab === "employees" && (
            <motion.div layoutId="contactTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
          )}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder={
              activeTab === "suppliers" ? "Cari nama PT, distributor, no HP WA, atau penanggung jawab..." :
              activeTab === "customers" ? "Cari nama pelanggan, nomor telepon/WA, email..." :
              "Cari nama karyawan, username, peran, email..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Dynamic Category Selector */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-52 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="ALL">Semua Kategori</option>
          {activeTab === "suppliers" && (
            <>
              <option value="Distributor Resmi">Distributor Resmi</option>
              <option value="Aksesoris & Gadget">Aksesoris & Gadget</option>
              <option value="Sparepart & Layar">Sparepart & Layar</option>
              <option value="Tukar Tambah & Second">Tukar Tambah & Second</option>
              <option value="General">Lain-lain</option>
            </>
          )}
          {activeTab === "customers" && (
            <>
              <option value="REGULAR">Member Regular</option>
              <option value="MEMBER">Member Prioritas</option>
              <option value="VIP">Member VIP</option>
            </>
          )}
          {activeTab === "employees" && (
            <>
              <option value="ADMIN">Role Admin</option>
              <option value="MANAGER">Role Manager</option>
              <option value="CASHIER">Role Kasir / Sales</option>
            </>
          )}
        </select>
      </div>

      {/* --- CONTENT TABS --- */}

      {/* 1. SUPPLIERS TAB */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div 
              key={supplier.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-primary-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200/60 dark:border-primary-800/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-black text-sm uppercase">
                      {supplier.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug">
                        {supplier.name}
                      </h3>
                      {supplier.contactPerson && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          PIC: <span className="font-bold text-slate-700 dark:text-slate-300">{supplier.contactPerson}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-extrabold uppercase rounded-md border border-slate-200/60 dark:border-slate-700 shrink-0">
                    {supplier.category || "General"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-mono font-bold text-[11px]">
                      <Phone className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                      {supplier.phone || "-"}
                    </span>
                    {supplier.phone && (
                      <button
                        onClick={() => handleCopy(supplier.phone, "Nomor Telepon")}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Salin Nomor"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {supplier.email && (
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        {supplier.email}
                      </span>
                    </div>
                  )}

                  {supplier.address && (
                    <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                      <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}

                  {supplier.notes && (
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800">
                      "{supplier.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={getWhatsAppLink(supplier.phone, supplier.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  Chat WhatsApp
                </a>

                <button
                  onClick={() => handleOpenModal("supplier", supplier)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-all"
                  title="Edit Supplier"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => handleDelete("supplier", supplier.id, supplier.name)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl cursor-pointer transition-all"
                  title="Hapus Supplier"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredSuppliers.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Tidak ada kontak supplier ditemukan.</p>
              <button
                onClick={() => handleOpenModal("supplier")}
                className="text-xs font-extrabold text-primary-600 hover:underline"
              >
                + Tambah Supplier Baru
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. CUSTOMERS TAB */}
      {activeTab === "customers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm uppercase">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug">
                        {customer.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        Poin Loyalitas: <span className="text-emerald-600 dark:text-emerald-400 font-black">{customer.points || 0} Poin</span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md border shrink-0 ${
                    customer.role === "VIP"
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                      : customer.role === "MEMBER"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}>
                    {customer.role || "REGULAR"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-mono font-bold text-[11px]">
                      <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {customer.phone || "-"}
                    </span>
                    {customer.phone && (
                      <button
                        onClick={() => handleCopy(customer.phone, "Nomor HP")}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Salin Nomor"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {customer.email && (
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        {customer.email}
                      </span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                      <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}

                  {customer.notes && (
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800">
                      "{customer.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={getWhatsAppLink(customer.phone, customer.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  Hubungi WA
                </a>

                <button
                  onClick={() => handleOpenModal("customer", customer)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-all"
                  title="Edit Pelanggan"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => handleDelete("customer", customer.id, customer.name)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl cursor-pointer transition-all"
                  title="Hapus Pelanggan"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Tidak ada kontak pelanggan ditemukan.</p>
              <button
                onClick={() => handleOpenModal("customer")}
                className="text-xs font-extrabold text-emerald-600 hover:underline"
              >
                + Tambah Pelanggan Baru
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. EMPLOYEES TAB */}
      {activeTab === "employees" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <div 
              key={employee.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm uppercase">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug">
                        {employee.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
                        @{employee.username}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md border shrink-0 ${
                    employee.role === UserRole.ADMIN
                      ? "bg-primary-50 text-primary-700 border-primary-200/60 dark:bg-primary-950/40 dark:text-primary-300"
                      : employee.role === UserRole.MANAGER
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}>
                    {employee.role}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-mono font-bold text-[11px]">
                      <Phone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      {employee.phone || "0812-9988-7766"}
                    </span>
                    <button
                      onClick={() => handleCopy(employee.phone || "081299887766", "Nomor Telepon Staf")}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Salin Nomor"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      {employee.email}
                    </span>
                  </div>

                  {employee.address && (
                    <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] pt-1">
                      <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{employee.address}</span>
                    </div>
                  )}

                  {employee.emergencyContact && (
                    <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 border border-amber-200/40 flex items-center justify-between">
                      <span>Kontak Darurat: <strong className="font-bold">{employee.emergencyContact}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={getWhatsAppLink(employee.phone || "081299887766", employee.name)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                  Pesan Instan WA
                </a>

                <button
                  onClick={() => handleOpenModal("employee", employee)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-all"
                  title="Edit Detail Kontak"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ADD / EDIT CONTACT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {editingItem ? "Edit Detail Kontak" : "Tambah Kontak Baru"} - {modalType.toUpperCase()}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nama Lengkap / Perusahaan
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: PT Erajaya Swasembada"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>

                {modalType === "supplier" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Nama PIC / Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={formContactPerson}
                      onChange={(e) => setFormContactPerson(e.target.value)}
                      placeholder="Contoh: Pak Herman (Sales Manager)"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Nomor HP / WhatsApp
                    </label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {modalType === "supplier" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Kategori Pemasok
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="Distributor Resmi">Distributor Resmi (TAM/Erajaya)</option>
                      <option value="Aksesoris & Gadget">Aksesoris & Charger</option>
                      <option value="Sparepart & Layar">Sparepart & LCD</option>
                      <option value="Tukar Tambah & Second">Tukar Tambah & HP Bekas</option>
                      <option value="General">Lain-lain</option>
                    </select>
                  </div>
                )}

                {modalType === "customer" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Tingkat Member
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="REGULAR">Member Regular</option>
                      <option value="MEMBER">Member Prioritas (Diskon 3%)</option>
                      <option value="VIP">Member VIP (Diskon 5%)</option>
                    </select>
                  </div>
                )}

                {modalType === "employee" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Kontak Darurat (Emergency Contact)
                    </label>
                    <input
                      type="text"
                      value={formEmergency}
                      onChange={(e) => setFormEmergency(e.target.value)}
                      placeholder="Istri / Orang Tua: 08198765432"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Alamat Fisik Lengkap
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Jl. Gajah Mada No. 88, Jakarta"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
                  />
                </div>

                {modalType !== "employee" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Catatan Tambahan
                    </label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={2}
                      placeholder="Catatan khusus supplier/pelanggan..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-primary-600/10"
                  >
                    Simpan Kontak
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
