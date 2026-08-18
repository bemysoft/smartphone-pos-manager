import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from "react";
import { 
  Shield, 
  ShieldAlert, 
  CheckCircle, 
  Search, 
  Clock, 
  MessageCircle, 
  Send, 
  AlertTriangle, 
  BellRing, 
  Settings, 
  Sparkles, 
  CheckSquare, 
  X,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Warranty } from "../types";

export default function WarrantyModule() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "EXPIRING_7" | "ACTIVE" | "CLAIMED" | "EXPIRED">("ALL");
  const [thresholdDays, setThresholdDays] = useState<number>(7);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [claimDescription, setClaimDescription] = useState("");
  const [claimPhoto, setClaimPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("Tidak dapat mengakses kamera.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      setClaimPhoto(canvas.toDataURL("image/jpeg"));
      setIsCameraActive(false);
      (videoRef.current.srcObject as MediaStream)?.getTracks().forEach(track => track.stop());
    }
  };
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(true);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/warranties");
      const data = await res.json();
      setWarranties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper calculation for days remaining
  const getDaysLeft = (expiryDateStr: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);
    const diffMs = exp.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Filter items expiring within threshold days (e.g. <= 7 days)
  const expiringItems = warranties.filter((w) => {
    const daysLeft = getDaysLeft(w.expiryDate);
    return w.status === "ACTIVE" && daysLeft >= 0 && daysLeft <= thresholdDays;
  });

  // Sync selected batch IDs when expiring items change
  useEffect(() => {
    setSelectedBatchIds(expiringItems.map(w => w.id));
  }, [warranties, thresholdDays]);

  const getWarrantyWaUrl = (w: Warranty) => {
    const daysLeft = getDaysLeft(w.expiryDate);
    const isExpired = daysLeft < 0;
    const statusStr = isExpired ? "KEDALUWARSA" : w.status === "CLAIMED" ? "PERNAH DIKLAIM" : "AKTIF";
    
    let message = "";
    if (w.status === "ACTIVE" && daysLeft >= 0 && daysLeft <= thresholdDays) {
      message = `Halo Kak ${w.customerName},\n\n⚠️ *PENGINGAT GARANSI PRODUK* dari FonePOS Roxy Square:\n\nGaransi resmi/toko untuk unit Anda akan berakhir dalam *${daysLeft === 0 ? "HARI INI TERAKHIR" : `${daysLeft} HARI KEPADA`}*.\n\n*Produk:* ${w.productName}\n*IMEI:* ${w.imei}\n*Berlaku S/D:* ${new Date(w.expiryDate).toLocaleDateString("id-ID")}\n\nMohon lakukan pemeriksaan unit Anda sebelum masa garansi berakhir. Jika ada kendala, kunjungi toko kami dengan membawa invoice *${w.invoiceId}*.\n\nTerima kasih!`;
    } else {
      message = `Halo Kak ${w.customerName},\n\nBerikut adalah Kartu Garansi Digital produk Anda dari FonePOS Roxy Square:\n\n*ID Garansi:* ${w.id}\n*No. Invoice:* ${w.invoiceId}\n*Produk:* ${w.productName}\n*IMEI:* ${w.imei}\n\n*Tanggal Beli:* ${new Date(w.purchaseDate).toLocaleDateString("id-ID")}\n*Berlaku S/D:* ${new Date(w.expiryDate).toLocaleDateString("id-ID")}\n*Status Garansi:* *${statusStr}*\n\n📌 *Ketentuan:* Garansi mencakup klaim resmi toko & IMEI terdaftar. Bawa bukti pesan ini & unit fisik untuk klaim.\n\nTerima kasih telah mempercayai FonePOS!`;
    }

    return `https://api.whatsapp.com/send?phone=${w.customerPhone.replace(/[^0-9]/g, "") || "0812"}&text=${encodeURIComponent(message)}`;
  };

  const triggerWaWarranty = async (w: Warranty) => {
    if (!w.customerPhone || w.customerPhone === "-") {
      alert("Nomor HP pelanggan tidak tersedia.");
      return;
    }
    setSendingWaId(w.id);
    try {
      const res = await apiFetch("/api/whatsapp/send-warranty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warrantyId: w.id, imei: w.imei, phone: w.customerPhone }),
      });
      if (res.ok) {
        alert(`Notifikasi pengingat garansi untuk ${w.customerName} berhasil dikirim via API WhatsApp!`);
      } else {
        alert("Gagal mengirim pesan via API WhatsApp.");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal terhubung ke server WhatsApp API.");
    } finally {
      setSendingWaId(null);
    }
  };

  const handleBatchSendReminders = async () => {
    if (selectedBatchIds.length === 0) {
      alert("Pilih setidaknya satu garansi untuk dikirim notifikasi pengingat.");
      return;
    }
    setIsSendingBatch(true);
    setBatchResult(null);
    try {
      const res = await apiFetch("/api/warranties/send-expiry-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warrantyIds: selectedBatchIds, channel: "API WhatsApp (FoneWA)" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBatchResult(`Berhasil mengirim notifikasi otomatis ke ${data.sentCount} pelanggan! Log tersimpan di Notifikasi Sistem & WA Log.`);
        fetchWarranties();
      } else {
        alert("Gagal mengirim notifikasi batch.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSendingBatch(false);
    }
  };

  const handleClaim = async () => {
    if (!selectedWarranty || !claimDescription) return;
    try {
      const res = await apiFetch("/api/warranties/" + selectedWarranty.id + "/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: claimDescription }),
      });
      if (res.ok) {
        alert("Klaim garansi berhasil dicatat.");
        setShowClaimModal(false);
        fetchWarranties();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered List based on Tab & Search
  const filtered = warranties.filter((w) => {
    const matchesSearch =
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.imei.includes(searchTerm) ||
      w.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const daysLeft = getDaysLeft(w.expiryDate);
    const isExpired = daysLeft < 0;

    if (filterTab === "EXPIRING_7") {
      return w.status === "ACTIVE" && daysLeft >= 0 && daysLeft <= thresholdDays;
    }
    if (filterTab === "ACTIVE") {
      return w.status === "ACTIVE" && daysLeft >= 0;
    }
    if (filterTab === "CLAIMED") {
      return w.status === "CLAIMED";
    }
    if (filterTab === "EXPIRED") {
      return isExpired || w.status === "EXPIRED";
    }
    return true;
  });

  // Overview Metrics
  const activeCount = warranties.filter(w => w.status === "ACTIVE" && getDaysLeft(w.expiryDate) >= 0).length;
  const claimedCount = warranties.filter(w => w.status === "CLAIMED").length;
  const expiredCount = warranties.filter(w => getDaysLeft(w.expiryDate) < 0 || w.status === "EXPIRED").length;

  return (
    <div className="space-y-6">
      {/* Top Title & Quick Config Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Garansi & IMEI Tracker
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pencatatan garansi digital, pelacakan IMEI & sistem peringatan garansi berakhir otomatis H-7.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            Pengaturan Notifikasi (H-{thresholdDays})
          </button>
          
          {expiringItems.length > 0 && (
            <button
              onClick={() => {
                setShowBatchModal(true);
                setBatchResult(null);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-2 animate-pulse"
            >
              <BellRing className="h-4 w-4" />
              Kirim Notifikasi Batch ({expiringItems.length})
            </button>
          )}
        </div>
      </div>

      {/* AUTOMATIC NOTIFICATION ALERT BANNER FOR ADMIN (H-7 Expiry Warning) */}
      {expiringItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <BellRing className="h-48 w-48" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/30 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Peringatan Otomatis Admin (H-{thresholdDays})
                </span>
                <span className="text-xs font-bold text-amber-100">
                  {expiringItems.length} Produk Perlu Perhatian
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight">
                Masa Garansi {expiringItems.length} Unit Produk Akan Berakhir Dalam {thresholdDays} Hari Ke Depan!
              </h3>
              <p className="text-xs text-amber-100 max-w-2xl leading-relaxed">
                Peringatan dini otomatis dari sistem: Beritahu pelanggan sekarang agar dapat melakukan pemeriksaan unit/klaim sebelum garansi kedaluwarsa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setFilterTab("EXPIRING_7")}
                className="px-3.5 py-2 bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5 text-amber-600" />
                Lihat Semua ({expiringItems.length})
              </button>
              <button
                onClick={() => {
                  setShowBatchModal(true);
                  setBatchResult(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5 text-amber-400" />
                Kirim Pengingat WA Otomatis
              </button>
            </div>
          </div>

          {/* Quick List Preview Cards in Alert Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
            {expiringItems.slice(0, 3).map((w) => {
              const daysLeft = getDaysLeft(w.expiryDate);
              return (
                <div key={w.id} className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-extrabold truncate">{w.customerName}</p>
                    <p className="text-[11px] opacity-90 truncate">{w.productName}</p>
                    <p className="text-[10px] font-mono opacity-80">{w.imei}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 bg-red-600 text-white font-black text-[10px] rounded-md shadow-xs block">
                      {daysLeft === 0 ? "HARI INI!" : `Sisa ${daysLeft} Hari`}
                    </span>
                    <a
                      href={getWarrantyWaUrl(w)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-white hover:underline mt-1"
                    >
                      <MessageCircle className="h-3 w-3 text-emerald-300" /> WA
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div 
          onClick={() => setFilterTab("ALL")} 
          className={`cursor-pointer bg-white border rounded-2xl p-4 shadow-xs transition-all ${filterTab === "ALL" ? "border-primary-500 ring-2 ring-primary-500/20" : "border-slate-200 hover:border-slate-300"}`}
        >
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Garansi</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">{warranties.length}</span>
            <Shield className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        <div 
          onClick={() => setFilterTab("EXPIRING_7")} 
          className={`cursor-pointer rounded-2xl p-4 shadow-xs transition-all ${expiringItems.length > 0 ? 'bg-amber-500 text-white ring-2 ring-amber-400/50' : 'bg-white border border-slate-200'} ${filterTab === "EXPIRING_7" ? 'ring-4 ring-amber-300' : ''}`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${expiringItems.length > 0 ? 'text-amber-100' : 'text-amber-600'}`}>
              ⚠️ Akan Expired (≤{thresholdDays} Hari)
            </p>
            {expiringItems.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            )}
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-black ${expiringItems.length > 0 ? 'text-white' : 'text-amber-600'}`}>
              {expiringItems.length}
            </span>
            <AlertTriangle className={`h-5 w-5 ${expiringItems.length > 0 ? 'text-amber-200' : 'text-amber-500'}`} />
          </div>
        </div>

        <div 
          onClick={() => setFilterTab("ACTIVE")} 
          className={`cursor-pointer bg-white border rounded-2xl p-4 shadow-xs transition-all ${filterTab === "ACTIVE" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"}`}
        >
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Garansi Aktif</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div 
          onClick={() => setFilterTab("CLAIMED")} 
          className={`cursor-pointer bg-white border rounded-2xl p-4 shadow-xs transition-all ${filterTab === "CLAIMED" ? "border-primary-500 ring-2 ring-primary-500/20" : "border-slate-200 hover:border-slate-300"}`}
        >
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Telah Diklaim</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-primary-600">{claimedCount}</span>
            <ShieldAlert className="h-5 w-5 text-primary-500" />
          </div>
        </div>

        <div 
          onClick={() => setFilterTab("EXPIRED")} 
          className={`cursor-pointer bg-white border rounded-2xl p-4 shadow-xs transition-all ${filterTab === "EXPIRED" ? "border-red-500 ring-2 ring-red-500/20" : "border-slate-200 hover:border-slate-300"}`}
        >
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kedaluwarsa</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-red-600">{expiredCount}</span>
            <Clock className="h-5 w-5 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${filterTab === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Semua ({warranties.length})
          </button>
          
          <button
            onClick={() => setFilterTab("EXPIRING_7")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${filterTab === "EXPIRING_7" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"}`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Peringatan H-{thresholdDays} ({expiringItems.length})
          </button>

          <button
            onClick={() => setFilterTab("ACTIVE")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${filterTab === "ACTIVE" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"}`}
          >
            Aktif ({activeCount})
          </button>

          <button
            onClick={() => setFilterTab("CLAIMED")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${filterTab === "CLAIMED" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100"}`}
          >
            Diklaim ({claimedCount})
          </button>

          <button
            onClick={() => setFilterTab("EXPIRED")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${filterTab === "EXPIRED" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"}`}
          >
            Kedaluwarsa ({expiredCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, IMEI, produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Main Warranty Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs">
              <tr>
                <th className="px-6 py-4">ID Garansi / Invoice</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Produk & IMEI</th>
                <th className="px-6 py-4">Masa Berlaku & Sisa Hari</th>
                <th className="px-6 py-4">Status & Alert</th>
                <th className="px-6 py-4 text-right">Aksi Notifikasi & Klaim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Sparkles className="h-6 w-6 text-primary-500 animate-spin" />
                      <span>Memuat data garansi & estimasi garansi...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada data garansi yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => {
                  const daysLeft = getDaysLeft(w.expiryDate);
                  const isExpired = daysLeft < 0;
                  const isExpiringSoon = w.status === "ACTIVE" && daysLeft >= 0 && daysLeft <= thresholdDays;
                  const status = isExpired ? "EXPIRED" : w.status;

                  return (
                    <tr 
                      key={w.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isExpiringSoon ? 'bg-amber-50/70 border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-800">{w.id}</div>
                        <div className="text-xs font-medium text-slate-400">{w.invoiceId}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{w.customerName}</div>
                        <div className="text-xs text-slate-500 font-mono">{w.customerPhone}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{w.productName}</div>
                        <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <span>IMEI:</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{w.imei}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>Beli: {new Date(w.purchaseDate).toLocaleDateString("id-ID")}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-700 mt-0.5">
                          Expired: {new Date(w.expiryDate).toLocaleDateString("id-ID")}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isExpiringSoon && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-white text-xs font-black rounded-lg shadow-xs animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {daysLeft === 0 ? "HARI INI TERAKHIR!" : `Sisa ${daysLeft} Hari (H-${thresholdDays})`}
                          </span>
                        )}

                        {!isExpiringSoon && status === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                            <CheckCircle className="h-3 w-3" /> Aktif ({daysLeft} Hari)
                          </span>
                        )}

                        {status === "CLAIMED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-lg border border-primary-200">
                            <ShieldAlert className="h-3 w-3" /> Diklaim
                          </span>
                        )}

                        {status === "EXPIRED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
                            <Clock className="h-3 w-3" /> Kedaluwarsa
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={getWarrantyWaUrl(w)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-2.5 py-1.5 font-bold text-xs rounded-xl border inline-flex items-center gap-1 no-underline transition-all ${
                              isExpiringSoon 
                                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={isExpiringSoon ? "Kirim Pesan Pengingat Garansi H-7" : "Kirim Kartu Garansi WA"}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {isExpiringSoon ? `Pengingat WA` : "WA Manual"}
                          </a>

                          <button
                            onClick={() => triggerWaWarranty(w)}
                            disabled={sendingWaId === w.id}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 inline-flex items-center gap-1 disabled:opacity-50"
                            title="Kirim Pesan Otomatis via API WhatsApp"
                          >
                            <Send className="h-3.5 w-3.5 text-indigo-600" />
                            {sendingWaId === w.id ? "SND..." : "API WA"}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedWarranty(w);
                              setClaimDescription("");
                              setShowClaimModal(false);
                              setShowClaimModal(true);
                            }}
                            disabled={status !== "ACTIVE"}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 disabled:opacity-40"
                          >
                            Klaim
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: BATCH NOTIFICATION BROADCAST MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600">
                <BellRing className="h-6 w-6" />
                <h3 className="text-lg font-black text-slate-800">Kirim Notifikasi Pengingat Garansi H-{thresholdDays}</h3>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-extrabold flex items-center gap-1 text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Daftar Pelanggan Garansi Berakhir ≤{thresholdDays} Hari ({expiringItems.length} Unit)
              </p>
              <p className="text-amber-700">
                Sistem akan secara otomatis mengirimkan rincian nomor garansi, tanggal kedaluwarsa, dan ajakan pemeriksaan unit via API WhatsApp & mencatatnya di Log Notifikasi Sistem.
              </p>
            </div>

            {batchResult && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{batchResult}</span>
              </div>
            )}

            {/* List of Expiring Items Checkbox */}
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
              {expiringItems.map((w) => {
                const daysLeft = getDaysLeft(w.expiryDate);
                const isChecked = selectedBatchIds.includes(w.id);
                return (
                  <div key={w.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBatchIds([...selectedBatchIds, w.id]);
                          } else {
                            setSelectedBatchIds(selectedBatchIds.filter(id => id !== w.id));
                          }
                        }}
                        className="h-4 w-4 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <div>
                        <p className="font-extrabold text-slate-800">{w.customerName} ({w.customerPhone})</p>
                        <p className="text-[11px] text-slate-500">{w.productName} • <span className="font-mono">{w.imei}</span></p>
                      </div>
                    </div>

                    <span className="px-2 py-1 bg-amber-100 text-amber-800 font-black text-[10px] rounded-lg">
                      {daysLeft === 0 ? "HARI INI!" : `Sisa ${daysLeft} Hari`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-slate-500">
                Terpilih: {selectedBatchIds.length} dari {expiringItems.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Tutup
                </button>
                <button
                  onClick={handleBatchSendReminders}
                  disabled={isSendingBatch || selectedBatchIds.length === 0}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSendingBatch ? "Mengirim Otomatis..." : "Kirim Notifikasi WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NOTIFICATION SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-black">
                <Settings className="h-5 w-5 text-primary-500" />
                <h3>Pengaturan Notifikasi Garansi</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Ambisi Hari Peringatan (Masa Garansi Berakhir)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setThresholdDays(days)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        thresholdDays === days 
                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      H-{days} Hari
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem akan menampilkan peringatan dan mengumpulkan daftar produk yang garansinya berakhir dalam ≤{thresholdDays} hari.
                </p>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Banner Peringatan Admin POS</p>
                    <p className="text-[11px] text-slate-400">Tampilkan kotak peringatan di atas modul Garansi</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoNotifyEnabled}
                    onChange={(e) => setAutoNotifyEnabled(e.target.checked)}
                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                <p className="font-extrabold text-slate-700">Integrasi API WhatsApp (FoneWA):</p>
                <p className="text-slate-500 text-[11px]">
                  Terhubung aktif dengan FoneWA Cloud API. Pesan peringatan otomatis dikirim menggunakan kredensial toko resmi.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PROCESS CLAIM MODAL */}
      {showClaimModal && selectedWarranty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-slate-800">Proses Klaim Garansi</h3>
            <div className="bg-slate-50 p-3 rounded-2xl text-xs border border-slate-200 space-y-1">
              <p><strong>Pelanggan:</strong> {selectedWarranty.customerName}</p>
              <p><strong>Produk:</strong> {selectedWarranty.productName}</p>
              <p><strong>IMEI:</strong> <span className="font-mono bg-white px-1.5 py-0.5 rounded border">{selectedWarranty.imei}</span></p>
              <p><strong>Masa Berlaku S/D:</strong> {new Date(selectedWarranty.expiryDate).toLocaleDateString("id-ID")}</p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Deskripsi Kerusakan</label>
              <textarea
                className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                placeholder="Contoh: Layar flickering..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Foto Kerusakan</label>
              {claimPhoto ? (
                <div className="relative">
                  <img src={claimPhoto} alt="Foto Kerusakan" className="w-full h-40 object-cover rounded-xl" />
                  <button className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full" onClick={() => setClaimPhoto(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : isCameraActive ? (
                <video ref={videoRef} className="w-full h-40 bg-slate-900 rounded-xl" />
              ) : (
                <button 
                  className="w-full py-6 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500 flex flex-col items-center gap-2"
                  onClick={startCamera}
                >
                  <Sparkles className="h-6 w-6" />
                  Ambil Foto Kerusakan
                </button>
              )}
              {isCameraActive && (
                <button className="w-full py-2 bg-emerald-600 text-white rounded-xl mt-2 text-xs font-bold" onClick={capturePhoto}>Ambil Foto</button>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClaimModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleClaim}
                disabled={!claimDescription}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-extrabold rounded-xl disabled:opacity-50 shadow-xs"
              >
                Simpan Klaim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
