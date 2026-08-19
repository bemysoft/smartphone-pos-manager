import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Package, 
  User, 
  Phone, 
  Smartphone, 
  AlertCircle, 
  Send, 
  Printer, 
  ChevronRight, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  X, 
  MessageCircle, 
  Edit3, 
  UserPlus, 
  KeyRound,
  FileText
} from "lucide-react";
import { ServiceTicket, ServiceStatus, Customer, Employee } from "../types";
import { apiFetch } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

interface ServiceQueueModuleProps {
  currentUser: Employee;
  customers?: Customer[];
  onRefreshGlobalState?: () => void;
}

export default function ServiceQueueModule({ currentUser, customers = [], onRefreshGlobalState }: ServiceQueueModuleProps) {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ServiceStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal 1: Create Ticket
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchInput, setCustomerSearchInput] = useState<string>("");
  
  // Form fields
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [deviceBrand, setDeviceBrand] = useState<string>("Samsung");
  const [deviceModel, setDeviceModel] = useState<string>("");
  const [deviceImei, setDeviceImei] = useState<string>("");
  const [deviceColor, setDeviceColor] = useState<string>("");
  const [devicePasscode, setDevicePasscode] = useState<string>("");
  const [deviceCondition, setDeviceCondition] = useState<string>("Normal pemakaian, tidak ada retak");
  const [problemDescription, setProblemDescription] = useState<string>("");
  const [sparepartCost, setSparepartCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(200000);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [technicianName, setTechnicianName] = useState<string>("Rian Kurniawan (Teknisi)");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal 2: Update Status
  const [selectedTicketForUpdate, setSelectedTicketForUpdate] = useState<ServiceTicket | null>(null);
  const [newStatus, setNewStatus] = useState<ServiceStatus>("DALAM_PENGERJAAN");
  const [statusNotes, setStatusNotes] = useState<string>("");

  // Modal 3: Print Receipt
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState<ServiceTicket | null>(null);

  const fetchServiceTickets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/service-tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Gagal mengambil antrean servis:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceTickets();
  }, []);

  // Filtered contacts autocomplete
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearchInput.toLowerCase()) ||
      c.phone.includes(customerSearchInput)
  );

  const handleSelectCustomerContact = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setCustomerAddress(cust.address || "");
    setCustomerSearchInput("");
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !deviceBrand || !deviceModel.trim() || !problemDescription.trim()) {
      alert("Mohon lengkapi Nama Pelanggan, No HP, Merk, Tipe HP, dan Keluhan Kerusakan.");
      return;
    }

    try {
      setIsSubmitting(true);
      const estimatedTotal = (Number(sparepartCost) || 0) + (Number(laborCost) || 0);

      const res = await apiFetch("/api/service-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          customerName,
          customerPhone,
          customerAddress,
          deviceBrand,
          deviceModel,
          deviceImei,
          deviceColor,
          devicePasscode,
          deviceCondition,
          problemDescription,
          estimatedCost: estimatedTotal,
          sparepartCost: Number(sparepartCost) || 0,
          laborCost: Number(laborCost) || 0,
          downPayment: Number(downPayment) || 0,
          technicianName,
          notes,
          createdBy: currentUser.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`🎉 Tiket Servis ${data.serviceTicket.id} Berhasil Dibuat & Tersimpan dalam Antrean!`);
        setShowCreateModal(false);
        resetForm();
        fetchServiceTickets();
        if (onRefreshGlobalState) onRefreshGlobalState();
      } else {
        const err = await res.json();
        alert(`Gagal membuat tiket servis: ${err.message || "Terjadi kesalahan"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan tiket servis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setDeviceBrand("Samsung");
    setDeviceModel("");
    setDeviceImei("");
    setDeviceColor("");
    setDevicePasscode("");
    setDeviceCondition("Normal pemakaian, tidak ada retak");
    setProblemDescription("");
    setSparepartCost(0);
    setLaborCost(200000);
    setDownPayment(0);
    setNotes("");
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicketForUpdate) return;
    try {
      setIsSubmitting(true);
      const res = await apiFetch(`/api/service-tickets/${selectedTicketForUpdate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          statusNotes,
          updatedBy: currentUser.name
        })
      });

      if (res.ok) {
        alert(`✅ Status Servis ${selectedTicketForUpdate.id} berhasil diperbarui menjadi '${newStatus}'! Notifikasi WA otomatis dikirim ke pelanggan.`);
        setSelectedTicketForUpdate(null);
        setStatusNotes("");
        fetchServiceTickets();
        if (onRefreshGlobalState) onRefreshGlobalState();
      } else {
        alert("Gagal memperbarui status servis.");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui status servis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp notification generator for service status
  const getWhatsAppMessageUrl = (ticket: ServiceTicket) => {
    const remaining = Math.max(0, (ticket.estimatedCost || 0) - (ticket.downPayment || 0));
    let statusText = "Terima (Masuk Antrean)";
    if (ticket.status === "DALAM_PENGERJAAN") statusText = "Sedang Dalam Pengerjaan Teknisi 🛠️";
    if (ticket.status === "SELESAI") statusText = "SELESAI & SIAP DIAMBIL ✅";
    if (ticket.status === "DIAMBIL") statusText = "Sudah Diambil / LUNAS 📦";

    const msg = `Halo Kak ${ticket.customerName},\n\nBerikut update pengerjaan servis HP Anda di FonePOS Roxy Square:\n\n*No. Tiket:* ${ticket.id}\n*Perangkat:* ${ticket.deviceBrand} ${ticket.deviceModel}\n*Kerusakan:* ${ticket.problemDescription}\n*Status:* *${statusText}*\n*Estimasi Biaya:* Rp ${ticket.estimatedCost.toLocaleString("id-ID")}\n*DP:* Rp ${(ticket.downPayment || 0).toLocaleString("id-ID")}\n*Sisa Bayar:* *Rp ${remaining.toLocaleString("id-ID")}*\n\nTerima kasih telah mempercayakan perbaikan gadget Anda bersama kami!`;
    return `https://api.whatsapp.com/send?phone=${ticket.customerPhone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(msg)}`;
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesTab = activeTab === "ALL" || t.status === activeTab;
    const matchesQuery =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerPhone.includes(searchQuery) ||
      t.deviceBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.deviceImei && t.deviceImei.includes(searchQuery));
    return matchesTab && matchesQuery;
  });

  // Calculate counters
  const countTerima = tickets.filter((t) => t.status === "TERIMA").length;
  const countDalamPengerjaan = tickets.filter((t) => t.status === "DALAM_PENGERJAAN").length;
  const countSelesai = tickets.filter((t) => t.status === "SELESAI").length;
  const countDiambil = tickets.filter((t) => t.status === "DIAMBIL").length;

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800 text-indigo-600 rounded-2xl">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Antrean Servis HP & Tablet
              <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-black uppercase">
                Integrasi Kontak Pelanggan
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lacak status pengerjaan servis (Terima, Dalam Pengerjaan, Selesai, Diambil) & notifikasi WA otomatis
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Terima Servis Baru
        </button>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "ALL"
              ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Semua Tiket</p>
          <p className="text-lg font-black mt-1">{tickets.length} <span className="text-xs font-normal">unit</span></p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TERIMA")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "TERIMA"
              ? "bg-amber-500 text-white border-amber-500 shadow-md"
              : "bg-white dark:bg-slate-900 text-amber-600 border-slate-200 dark:border-slate-800 hover:border-amber-300"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
            📥 Terima
          </p>
          <p className="text-lg font-black mt-1">{countTerima} <span className="text-xs font-normal">unit</span></p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DALAM_PENGERJAAN")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "DALAM_PENGERJAAN"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
              : "bg-white dark:bg-slate-900 text-indigo-600 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
            🛠️ Dalam Pengerjaan
          </p>
          <p className="text-lg font-black mt-1">{countDalamPengerjaan} <span className="text-xs font-normal">unit</span></p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SELESAI")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "SELESAI"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
              : "bg-white dark:bg-slate-900 text-emerald-600 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
            ✅ Selesai
          </p>
          <p className="text-lg font-black mt-1">{countSelesai} <span className="text-xs font-normal">unit</span></p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DIAMBIL")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === "DIAMBIL"
              ? "bg-slate-700 text-white border-slate-700 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
            📦 Diambil / Lunas
          </p>
          <p className="text-lg font-black mt-1">{countDiambil} <span className="text-xs font-normal">unit</span></p>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari Tiket Servis, Nama Pelanggan, No HP, Perangkat, atau IMEI..."
          className="w-full bg-transparent border-none text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* TICKETS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold">Memuat antrean servis...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <Wrench className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Tidak Ada Antrean Servis</p>
            <p className="text-xs text-slate-400">Belum ada tiket servis yang sesuai dengan filter/pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => {
              const remainingCost = Math.max(0, (ticket.estimatedCost || 0) - (ticket.downPayment || 0));

              return (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header badge & Ticket ID */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 inline-block">
                          {ticket.id}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Diterima: {new Date(ticket.receivedDate).toLocaleDateString("id-ID")}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                          ticket.status === "TERIMA"
                            ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                            : ticket.status === "DALAM_PENGERJAAN"
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300"
                              : ticket.status === "SELESAI"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse"
                                : "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {ticket.status === "TERIMA" && "📥 TERIMA"}
                        {ticket.status === "DALAM_PENGERJAAN" && "🛠️ DALAM PENGERJAAN"}
                        {ticket.status === "SELESAI" && "✅ SELESAI"}
                        {ticket.status === "DIAMBIL" && "📦 DIAMBIL / LUNAS"}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-500" />
                          {ticket.customerName}
                        </p>
                        <a
                          href={`tel:${ticket.customerPhone}`}
                          className="text-[11px] font-mono font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {ticket.customerPhone}
                        </a>
                      </div>
                    </div>

                    {/* Device & Issue details */}
                    <div className="space-y-1.5">
                      <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Smartphone className="h-4 w-4 text-indigo-600" />
                        {ticket.deviceBrand} {ticket.deviceModel}
                      </p>

                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
                        <p className="font-bold text-amber-950 dark:text-amber-200">📌 Keluhan Kerusakan:</p>
                        <p className="italic text-[11px]">"{ticket.problemDescription}"</p>
                      </div>

                      {ticket.deviceImei && ticket.deviceImei !== "-" && (
                        <p className="text-[10px] text-slate-400 font-mono">IMEI: {ticket.deviceImei}</p>
                      )}
                      {ticket.technicianName && (
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Teknisi: {ticket.technicianName}</p>
                      )}
                    </div>

                    {/* Financial details */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400">Estimasi Total:</p>
                        <p className="font-extrabold text-slate-900 dark:text-white font-mono">
                          Rp {ticket.estimatedCost.toLocaleString("id-ID")}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Sisa Bayar:</p>
                        <p className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                          Rp {remainingCost.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicketForUpdate(ticket);
                        setNewStatus(ticket.status);
                        setStatusNotes("");
                      }}
                      className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Ubah Status
                    </button>

                    <a
                      href={getWhatsAppMessageUrl(ticket)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1 no-underline"
                      title="Kirim Notifikasi WA"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WA
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedTicketForPrint(ticket)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs transition-all cursor-pointer"
                      title="Cetak Tanda Terima Servis"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: TAMBAH TIKET SERVIS BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-2xl">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Penerimaan Unit Servis Baru</h3>
                  <p className="text-xs text-slate-500">Input data perangkat, keluhan, estimasi biaya & otomatis simpan kontak</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Customer selection autocomplete */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    1. Data Kontak Pelanggan
                  </label>
                  {selectedCustomer && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      ✓ Kontak Terhubung
                    </span>
                  )}
                </div>

                {/* Search existing contact */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearchInput}
                    onChange={(e) => setCustomerSearchInput(e.target.value)}
                    placeholder="Cari dari Kontak Terdaftar (Ketik Nama / No HP)..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {customerSearchInput.trim() && filteredCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomerContact(c)}
                          className="p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                            <p className="text-[10px] text-slate-400">{c.phone}</p>
                          </div>
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Pilih</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Pelanggan *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nomor HP / WhatsApp *</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Device details */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  2. Detail Perangkat HP / Tablet
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Merk / Brand *</label>
                    <select
                      value={deviceBrand}
                      onChange={(e) => setDeviceBrand(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="Apple">Apple (iPhone / iPad)</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi / Poco / Redmi</option>
                      <option value="Oppo">Oppo</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Realme">Realme</option>
                      <option value="Infinix">Infinix</option>
                      <option value="Asus">Asus / ROG</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipe / Model HP *</label>
                    <input
                      type="text"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      placeholder="Contoh: Galaxy S23 Ultra / iPhone 13"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IMEI / Serial Number</label>
                    <input
                      type="text"
                      value={deviceImei}
                      onChange={(e) => setDeviceImei(e.target.value)}
                      placeholder="Contoh: 351234567890..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kata Sandi / Pola Kunci</label>
                    <input
                      type="text"
                      value={devicePasscode}
                      onChange={(e) => setDevicePasscode(e.target.value)}
                      placeholder="Contoh: PIN 1234 / Pola Bentuk L"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Kondisi Fisik Saat Diterima</label>
                    <input
                      type="text"
                      value={deviceCondition}
                      onChange={(e) => setDeviceCondition(e.target.value)}
                      placeholder="Contoh: Layar retak, bezel baret halus"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Keluhan / Jenis Kerusakan *</label>
                  <textarea
                    rows={2}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Contoh: Ganti LCD Original, HP mati total setelah kena air, baterai kembung..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Financial & Technician */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  3. Estimasi Biaya & Uang Muka (DP)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Biaya Sparepart (Rp)</label>
                    <input
                      type="number"
                      value={sparepartCost}
                      onChange={(e) => setSparepartCost(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Biaya Jasa Servis (Rp)</label>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Uang Muka / DP (Rp)</label>
                    <input
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/60">
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Total Estimasi Biaya:</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    Rp {((Number(sparepartCost) || 0) + (Number(laborCost) || 0)).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Simpan Tiket Servis
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE STATUS SERVIS */}
      {selectedTicketForUpdate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Update Status Servis</h3>
                <p className="text-[10px] text-slate-400 font-mono">{selectedTicketForUpdate.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketForUpdate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pilih Status Baru</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ServiceStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold"
                >
                  <option value="TERIMA">📥 TERIMA (Masuk Antrean)</option>
                  <option value="DALAM_PENGERJAAN">🛠️ DALAM_PENGERJAAN (Proses Servis)</option>
                  <option value="SELESAI">✅ SELESAI (Siap Diambil)</option>
                  <option value="DIAMBIL">📦 DIAMBIL / LUNAS (Diambil Konsumen)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Catatan Progress Teknisi</label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Contoh: Pemasangan LCD berhasil, battery health 100%, siap diambil..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium"
                />
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/60 text-[11px] text-indigo-900 dark:text-indigo-200">
                📲 <b>Otomatisasi:</b> Mengubah status ke <b>{newStatus}</b> akan mencatat riwayat log dan memicu kirim notifikasi WhatsApp ke HP pelanggan (<b>{selectedTicketForUpdate.customerPhone}</b>).
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicketForUpdate(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINT TANDA TERIMA SERVIS */}
      {selectedTicketForPrint && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Tanda Terima Servis HP</h3>
              <button
                type="button"
                onClick={() => setSelectedTicketForPrint(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl font-mono text-xs text-slate-800 dark:text-slate-200 space-y-3">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <p className="font-extrabold text-sm text-slate-900 dark:text-white uppercase">FonePOS Service Center</p>
                <p className="text-[10px] text-slate-500">TANDA TERIMA UNIT SERVIS</p>
                <p className="text-[10px] text-indigo-600 font-bold">No Tiket: {selectedTicketForPrint.id}</p>
                <p className="text-[10px] text-slate-400">{new Date(selectedTicketForPrint.receivedDate).toLocaleString("id-ID")}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <p><b>Pelanggan:</b> {selectedTicketForPrint.customerName}</p>
                <p><b>HP WA:</b> {selectedTicketForPrint.customerPhone}</p>
                <p><b>Perangkat:</b> {selectedTicketForPrint.deviceBrand} {selectedTicketForPrint.deviceModel}</p>
                {selectedTicketForPrint.deviceImei && <p><b>IMEI:</b> {selectedTicketForPrint.deviceImei}</p>}
                <p><b>Sandi/Pola:</b> {selectedTicketForPrint.devicePasscode || "-"}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-[11px]">
                <p className="font-bold text-rose-600">Keluhan Kerusakan:</p>
                <p className="italic">"{selectedTicketForPrint.problemDescription}"</p>
                <p className="text-[10px] text-slate-500 mt-1"><b>Kondisi Fisik:</b> {selectedTicketForPrint.deviceCondition}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Estimasi Total:</span>
                  <span className="font-bold">Rp {selectedTicketForPrint.estimatedCost.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>DP Masuk:</span>
                  <span className="font-bold">-Rp {(selectedTicketForPrint.downPayment || 0).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-indigo-600 font-bold border-t border-slate-200 pt-1">
                  <span>Sisa Bayar Saat Ambil:</span>
                  <span>Rp {Math.max(0, selectedTicketForPrint.estimatedCost - (selectedTicketForPrint.downPayment || 0)).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="text-[8px] text-slate-500 text-center pt-2 border-t border-dashed border-slate-300 space-y-0.5">
                <p>1. Tanda terima ini wajib dibawa saat pengambilan unit HP.</p>
                <p>2. Garansi servis berlaku 30 hari untuk kerusakan yang sama.</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicketForPrint(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" /> Cetak Tanda Terima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
