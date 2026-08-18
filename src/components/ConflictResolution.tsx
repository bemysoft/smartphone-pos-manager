import React, { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  GitMerge, 
  Smartphone, 
  ShieldAlert, 
  Building2, 
  ArrowRight, 
  Layers, 
  Database, 
  Server, 
  Lock, 
  X,
  Sliders,
  Check
} from "lucide-react";
import { SyncConflict } from "../types";

interface ConflictResolutionProps {
  conflicts?: SyncConflict[];
  tenantId?: string;
  onResolveConflict?: (
    conflictId: string, 
    strategy: "KEEP_LOCAL" | "KEEP_CLOUD" | "MERGE" | "MANUAL_OVERRIDE",
    customData?: { stock?: number; priceSell?: number; imeis?: string[]; notes?: string }
  ) => void;
  onConflictResolved?: () => void;
  onRefresh?: () => void;
  currentUser?: { name: string; role: string; id: string };
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  conflicts = [],
  onResolveConflict,
  onConflictResolved,
  onRefresh,
  currentUser
}) => {
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<"KEEP_LOCAL" | "KEEP_CLOUD" | "MERGE" | "MANUAL_OVERRIDE">("MERGE");
  const [activeSubTab, setActiveSubTab] = useState<"OPEN" | "RESOLVED">("OPEN");
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  
  // Custom manual edit state
  const [customStock, setCustomStock] = useState<number>(0);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customImeis, setCustomImeis] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [adminPin, setAdminPin] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleGenerateTestConflict = async () => {
    setIsGeneratingTest(true);
    try {
      const { apiFetch } = await import("../lib/api");
      await apiFetch("/api/sync-conflicts/generate", { method: "POST" });
      if (onRefresh) onRefresh();
      setActiveSubTab("OPEN");
    } catch (e) {
      console.error("Gagal membuat konflik pengujian:", e);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const openResolveModal = (conflict: SyncConflict) => {
    setSelectedConflict(conflict);
    setActiveStrategy("MERGE");
    
    // Pre-fill merge values safely
    const localImeis = conflict.localData?.imeis || [];
    const cloudImeis = conflict.cloudData?.imeis || [];
    const mergedImeis = Array.from(new Set([...localImeis, ...cloudImeis]));
    setCustomStock(mergedImeis.length);
    setCustomPrice(conflict.cloudData?.priceSell ?? conflict.localData?.priceSell ?? 0);
    setCustomImeis(mergedImeis.join("\n"));
    setResolutionNotes(`Penyelarasan manual stok oleh Admin (${currentUser?.name || "Ricky Commedan"})`);
    setAdminPin("");
    setPinError("");
  };

  const openConflict = (conflict: SyncConflict) => {
    openResolveModal(conflict);
  };

  const handleApplyResolution = async () => {
    if (!selectedConflict) return;

    // Validate PIN (simulation: admin pin is 1234 or empty for dev)
    if (adminPin.trim() !== "" && adminPin !== "1234" && adminPin !== "8888") {
      setPinError("PIN Otentikasi Admin tidak valid. Gunakan PIN Admin terdaftar (misal: 1234).");
      return;
    }

    setIsSubmitting(true);

    let imeisList: string[] = [];
    if (activeStrategy === "KEEP_LOCAL") {
      imeisList = selectedConflict.localData?.imeis || [];
    } else if (activeStrategy === "KEEP_CLOUD") {
      imeisList = selectedConflict.cloudData?.imeis || [];
    } else {
      imeisList = customImeis.split("\n").map(s => s.trim()).filter(Boolean);
    }

    const payload = {
      stock: activeStrategy === "KEEP_LOCAL" 
        ? (selectedConflict.localData?.stock ?? 0) 
        : activeStrategy === "KEEP_CLOUD" 
          ? (selectedConflict.cloudData?.stock ?? 0) 
          : Number(customStock) || imeisList.length,
      priceSell: activeStrategy === "KEEP_LOCAL" 
        ? (selectedConflict.localData?.priceSell ?? 0) 
        : activeStrategy === "KEEP_CLOUD" 
          ? (selectedConflict.cloudData?.priceSell ?? 0) 
          : Number(customPrice),
      imeis: imeisList,
      notes: resolutionNotes
    };

    if (onResolveConflict) {
      onResolveConflict(selectedConflict.id, activeStrategy, payload);
    } else {
      try {
        const { apiFetch } = await import("../lib/api");
        await apiFetch("/api/sync-conflicts/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conflictId: selectedConflict.id, strategy: activeStrategy, customData: payload, resolvedBy: currentUser?.name || "Admin" })
        });
        if (onConflictResolved) onConflictResolved();
        if (onRefresh) onRefresh();
      } catch (e) {
        console.error("Gagal menyelesaikan konflik:", e);
      }
    }

    setIsSubmitting(false);
    setSelectedConflict(null);
  };

  const openConflicts = conflicts.filter(c => c.status === "OPEN");
  const resolvedConflicts = conflicts.filter(c => c.status === "RESOLVED");

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <GitMerge className="h-4 w-4 text-amber-400" />
              <span>Multi-Outlet Synchronization Engine</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Resolusi Konflik Sinkronisasi Stok
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Tinjau dan selaraskan secara manual perbedaan data inventaris antar cabang offline dan server cloud pusat bila terjadi ketidaksesuaian saat pembaruan jaringan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleGenerateTestConflict}
              disabled={isGeneratingTest}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>{isGeneratingTest ? "Menyilang Data..." : "Simulasi Bentrokan Data (Test)"}</span>
            </button>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Cek Sync Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY METRICS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-800">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Konflik Butuh Review</span>
            <div className="text-2xl font-extrabold text-amber-400">{openConflicts.length} Konflik</div>
            <p className="text-[10px] text-slate-400">Memerlukan persetujuan Admin</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Telah Diresolusi</span>
            <div className="text-2xl font-extrabold text-emerald-400">{resolvedConflicts.length} Diresolusi</div>
            <p className="text-[10px] text-slate-400">Tersimpan dalam Log Audit</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-1 col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Aturan Penggabungan (Merge Strategy)</span>
            <div className="text-xs font-bold text-indigo-200 mt-1">IMEI Array Union + Highest Timestamp</div>
            <p className="text-[10px] text-slate-400">Mencegah stok hilang secara permanen</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("OPEN")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "OPEN"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Konflik Aktif ({openConflicts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("RESOLVED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "RESOLVED"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Riwayat Diresolusi ({resolvedConflicts.length})</span>
        </button>
      </div>

      {/* OPEN CONFLICTS LIST OR RESOLVED HISTORY */}
      {activeSubTab === "RESOLVED" ? (
        <div className="space-y-3">
          {resolvedConflicts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center space-y-2 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">Belum ada riwayat konflik yang diresolusi.</p>
            </div>
          ) : (
            resolvedConflicts.map(rc => (
              <div key={rc.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                      RESOLVED ({rc.resolutionStrategy || "MERGE"})
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{rc.productName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {rc.resolvedAt ? new Date(rc.resolvedAt).toLocaleString("id-ID") : "-"}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                  Diresolusi oleh: <strong>{rc.resolvedBy || "Admin"}</strong> • Cabang: <strong>{rc.outletName}</strong>
                </p>
                {rc.resolutionNotes && (
                  <p className="text-[11px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                    Notes: {rc.resolutionNotes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-bounce" />
            <span>Daftar Ketidaksesuaian Data Aktif ({openConflicts.length})</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Klik 'Tinjau & Gabungkan' untuk melakukan perbandingan visual
          </span>
        </div>

        {openConflicts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center space-y-3 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Seluruh Data Stok Ter-sinkron Sempurna!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ditemukan konflik atau ketidaksesuaian data antara cache cabang lokal dan database cloud pusat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {openConflicts.map(conflict => (
              <div 
                key={conflict.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/60 shadow-md hover:shadow-lg transition-all space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase">
                        {conflict.conflictType.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-400">ID: {conflict.id}</span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {conflict.productName}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Cabang: <strong>{conflict.outletName}</strong></span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openConflict(conflict)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/20 shrink-0"
                  >
                    <GitMerge className="h-4 w-4" />
                    <span>Tinjau & Resolusi</span>
                  </button>
                </div>

                {/* COMPARISON QUICK PREVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* LOCAL SIDE */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-amber-200/40 dark:border-amber-900/40 pb-1.5">
                      <span className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5" />
                        <span>Versi Outlet Lokal ({conflict.localData?.outletName || conflict.outletName || "Outlet"})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(conflict.localData?.updatedAt || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div>Stok: <strong className="text-slate-900 dark:text-white font-mono">{conflict.localData?.stock ?? 0} unit</strong></div>
                      <div>Harga: <strong className="text-slate-900 dark:text-white font-mono">Rp {(conflict.localData?.priceSell ?? 0).toLocaleString("id-ID")}</strong></div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      IMEIs ({(conflict.localData?.imeis || []).length}): {(conflict.localData?.imeis || []).join(", ")}
                    </div>
                  </div>

                  {/* CLOUD SIDE */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between border-b border-indigo-200/40 dark:border-indigo-900/40 pb-1.5">
                      <span className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5" />
                        <span>Versi Cloud Pusat ({conflict.cloudData?.outletName || "Central Cloud"})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(conflict.cloudData?.updatedAt || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                      <div>Stok: <strong className="text-slate-900 dark:text-white font-mono">{conflict.cloudData?.stock ?? 0} unit</strong></div>
                      <div>Harga: <strong className="text-slate-900 dark:text-white font-mono">Rp {(conflict.cloudData?.priceSell ?? 0).toLocaleString("id-ID")}</strong></div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      IMEIs ({(conflict.cloudData?.imeis || []).length}): {(conflict.cloudData?.imeis || []).join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* RESOLUTION MODAL */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 overflow-hidden relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20">
                  <GitMerge className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Review & Merge UI</span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Penyelarasan Manual Rekaman
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConflict(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-1">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedConflict.productName}</div>
                <div className="text-slate-500">Cabang: <strong>{selectedConflict.outletName}</strong> • Jenis Konflik: <strong>{selectedConflict.conflictType}</strong></div>
              </div>

              {/* STRATEGY SELECTION TABS */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block">
                  Pilih Strategi Penyelesaian (Conflict Resolution Strategy):
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStrategy("MERGE");
                      const mergedImeis = Array.from(new Set([...selectedConflict.localData.imeis, ...selectedConflict.cloudData.imeis]));
                      setCustomStock(mergedImeis.length);
                      setCustomPrice(selectedConflict.cloudData.priceSell);
                      setCustomImeis(mergedImeis.join("\n"));
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1 ${
                      activeStrategy === "MERGE"
                        ? "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-bold shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">🔀 Gabung (Merge)</span>
                      {activeStrategy === "MERGE" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Gabungkan IMEI lokal & cloud</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStrategy("KEEP_LOCAL")}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1 ${
                      activeStrategy === "KEEP_LOCAL"
                        ? "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-bold shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">🟢 Pakai Lokal</span>
                      {activeStrategy === "KEEP_LOCAL" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Gunakan data cabang lokal</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStrategy("KEEP_CLOUD")}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1 ${
                      activeStrategy === "KEEP_CLOUD"
                        ? "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-bold shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">🔵 Pakai Cloud</span>
                      {activeStrategy === "KEEP_CLOUD" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Gunakan data cloud pusat</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStrategy("MANUAL_OVERRIDE")}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1 ${
                      activeStrategy === "MANUAL_OVERRIDE"
                        ? "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-bold shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]">⚙️ Override</span>
                      {activeStrategy === "MANUAL_OVERRIDE" && <Check className="h-3.5 w-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Input manual stok & harga</p>
                  </button>
                </div>
              </div>

              {/* EDITING VALUES PANEL */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Jumlah Stok Akhir
                    </label>
                    <input
                      type="number"
                      value={customStock}
                      onChange={(e) => setCustomStock(Number(e.target.value))}
                      disabled={activeStrategy === "KEEP_LOCAL" || activeStrategy === "KEEP_CLOUD"}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Harga Jual (Rp)
                    </label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      disabled={activeStrategy === "KEEP_LOCAL" || activeStrategy === "KEEP_CLOUD"}
                      className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Daftar IMEI Gabungan (Pisahkan dengan baris baru):
                  </label>
                  <textarea
                    rows={4}
                    value={customImeis}
                    onChange={(e) => setCustomImeis(e.target.value)}
                    disabled={activeStrategy === "KEEP_LOCAL" || activeStrategy === "KEEP_CLOUD"}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Catatan Alasan Resolusi Admin:
                  </label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Masukkan alasan penggabungan untuk log audit..."
                    className="w-full py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* ADMIN AUTH PIN */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold">
                  <Lock className="h-4 w-4 text-indigo-500" />
                  <span>Otentikasi Keamanan Otorisasi Admin</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError("");
                    }}
                    placeholder="PIN Keamanan Admin (cth: 1234)"
                    className="flex-1 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {pinError && (
                  <p className="text-[11px] font-bold text-rose-600">{pinError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedConflict(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyResolution}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-600/20 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Menyimpan Resolusi...</span>
                  </>
                ) : (
                  <>
                    <GitMerge className="h-4 w-4" />
                    <span>Terapkan & Simpan Log Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
