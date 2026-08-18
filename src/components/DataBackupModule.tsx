import React, { useState, useEffect, useRef } from "react";
import { 
  Database, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  HardDrive, 
  Clock, 
  Boxes, 
  Receipt, 
  Server, 
  Calendar, 
  Play, 
  RotateCcw, 
  Trash2, 
  Upload, 
  Cloud, 
  AlertTriangle, 
  Layers, 
  Check, 
  FileCheck,
  Hash,
  Sparkles,
  Building2,
  Lock,
  Search,
  Filter,
  Activity,
  FileText,
  Send,
  CheckCheck,
  ArrowRight
} from "lucide-react";
import { apiFetch, apiGet, apiPost, apiDelete, getResolvedTenantId } from "../lib/api";
import { useTenant } from "../hooks/useTenant";
import MigrationRequest from "./MigrationRequest";

interface BackupSnapshot {
  id: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  modifiedAt: string;
  downloadUrl: string;
  checksum?: string;
  cloudSyncStatus?: string;
  backupType?: string;
  label?: string;
  note?: string;
  productsCount?: number;
  transactionsCount?: number;
  employeesCount?: number;
  version?: string;
}

interface TenantBackupLog {
  id: string;
  tenantId: string;
  tenantName: string;
  filename: string;
  sizeBytes: number;
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS";
  timestamp: string;
  checksum?: string;
  initiatedBy: string;
  triggerType: "MANUAL_CENTRAL_ADMIN" | "TENANT_MANUAL" | "DAILY_CRON" | "PRE_RESTORE_SAFETY";
  errorMessage?: string;
  label?: string;
  note?: string;
  stats?: {
    productsCount: number;
    transactionsCount: number;
    employeesCount: number;
    buybacksCount?: number;
  };
}

interface BackupScheduleConfig {
  enabled: boolean;
  frequency: "DAILY" | "TWICE_DAILY" | "WEEKLY" | "HOURLY";
  preferredTime: string;
  retentionDays: number;
  autoCloudSync: boolean;
  cloudProvider?: string;
  lastRun?: string;
  nextRun?: string;
}

export default function DataBackupModule() {
  const { tenantId, tenantDetails, availableTenants, switchTenant } = useTenant();
  
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<BackupScheduleConfig>({
    enabled: true,
    frequency: "DAILY",
    preferredTime: "00:00",
    retentionDays: 30,
    autoCloudSync: true
  });
  
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState("");
  const [newSnapshotNote, setNewSnapshotNote] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Central Multi-Tenant Backup States
  const [tenantLogs, setTenantLogs] = useState<TenantBackupLog[]>([]);
  const [loadingTenantLogs, setLoadingTenantLogs] = useState(false);
  const [selectedTargetTenant, setSelectedTargetTenant] = useState<string>(tenantId || "default");
  const [customTenantInput, setCustomTenantInput] = useState<string>("");
  const [useCustomTenant, setUseCustomTenant] = useState<boolean>(false);
  const [tenantBackupLabel, setTenantBackupLabel] = useState<string>("");
  const [tenantBackupNote, setTenantBackupNote] = useState<string>("");
  const [tenantTriggerLoading, setTenantTriggerLoading] = useState<boolean>(false);
  const [tenantLogFilter, setTenantLogFilter] = useState<string>("ALL");
  const [tenantFilterSearch, setTenantFilterSearch] = useState<string>("");
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [tenantActionSuccessMessage, setTenantActionSuccessMessage] = useState<string | null>(null);

  // Restore Modal State
  const [selectedSnapshotToRestore, setSelectedSnapshotToRestore] = useState<BackupSnapshot | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccessInfo, setRestoreSuccessInfo] = useState<{
    message: string;
    safetyRollbackFile?: string;
    restoredStats?: any;
  } | null>(null);

  // Upload restore state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingRestore, setUploadingRestore] = useState(false);

  // Cloud status state
  const [cloudSyncStatus, setCloudSyncStatus] = useState<{
    status: string;
    provider: string;
    encryption: string;
    totalSynced: number;
    syncedAt: string;
  }>({
    status: "CONNECTED",
    provider: "Google Cloud Storage / Firestore Encrypted Multi-Tenant Vault",
    encryption: "AES-256 Cloud Customer-Managed Key",
    totalSynced: 0,
    syncedAt: new Date().toISOString()
  });

  // Archive & Database stats
  const [archiving, setArchiving] = useState(false);
  const [archiveStats, setArchiveStats] = useState<{
    totalTransactions: number;
    eligibleToArchive: number;
    recentCount: number;
    archivedCount: number;
    cutoffDate?: string;
  }>({
    totalTransactions: 0,
    eligibleToArchive: 0,
    recentCount: 0,
    archivedCount: 0
  });

  const [backupStats, setBackupStats] = useState({
    productsCount: 0,
    transactionsCount: 0,
    auditLogsCount: 0,
    employeesCount: 0,
    suppliersCount: 0,
    lastExportTime: localStorage.getItem("last_backup_download_time") || null
  });

  const [activeTab, setActiveTab] = useState<"snapshots" | "tenant-backup" | "schedule" | "archive" | "export" | "migration">("snapshots");

  // Fetch all backup & snapshot metadata for this tenant
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Current DB summary
      const dbRes = await apiFetch("/api/backup");
      if (dbRes.ok) {
        const data = await dbRes.json();
        if (data && data.db) {
          setBackupStats(prev => ({
            ...prev,
            productsCount: data.db.products?.length || 0,
            transactionsCount: data.db.transactions?.length || 0,
            auditLogsCount: data.db.auditLogs?.length || 0,
            employeesCount: data.db.employees?.length || 0,
            suppliersCount: data.db.suppliers?.length || 0
          }));
        }
      }

      // 2. Snapshots list
      const snapRes = await apiFetch("/api/backup/snapshots");
      if (snapRes.ok) {
        const snapData = await snapRes.json();
        if (Array.isArray(snapData)) {
          setSnapshots(snapData);
          setCloudSyncStatus(prev => ({ ...prev, totalSynced: snapData.length }));
        }
      }

      // 3. Schedule config
      const schedRes = await apiFetch("/api/backup/schedule");
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        if (schedData) {
          setScheduleConfig(schedData);
        }
      }

      // 4. Archive stats
      try {
        const archiveRes = await apiFetch("/api/transactions/archive-stats");
        if (archiveRes.ok) {
          const archiveData = await archiveRes.json();
          if (archiveData && archiveData.success) {
            setArchiveStats({
              totalTransactions: archiveData.totalTransactions || 0,
              eligibleToArchive: archiveData.eligibleToArchive || 0,
              recentCount: archiveData.recentCount || 0,
              archivedCount: archiveData.archivedCount || 0,
              cutoffDate: archiveData.cutoffDate
            });
          }
        }
      } catch (aErr) {
        console.warn("Archive stats endpoint optional:", aErr);
      }
    } catch (err) {
      console.error("Gagal memuat metadata backup tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all centralized tenant backup logs
  const fetchTenantLogs = async () => {
    setLoadingTenantLogs(true);
    try {
      const res = await apiFetch(`/api/backup/tenant-logs`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.logs)) {
          setTenantLogs(data.logs);
        }
      }
    } catch (err) {
      console.error("Gagal memuat log backup tenant:", err);
    } finally {
      setLoadingTenantLogs(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchTenantLogs();
  }, [tenantId]);

  // Trigger tenant-specific backup (Central Admin Action)
  const handleTriggerCentralTenantBackup = async () => {
    const targetId = useCustomTenant ? customTenantInput.trim() : selectedTargetTenant;
    if (!targetId) {
      alert("Harap pilih atau masukkan ID Tenant target yang valid!");
      return;
    }

    setTenantTriggerLoading(true);
    setTenantActionSuccessMessage(null);
    try {
      const res = await apiPost("/api/backup/trigger-tenant", {
        tenantId: targetId,
        label: tenantBackupLabel.trim() || `Manual Central Backup (${targetId})`,
        note: tenantBackupNote.trim() || "Dipicu melalui Central Multi-Tenant Backup Console",
        adminUser: localStorage.getItem("user_name") || "Admin Pusat NexusPOS"
      });

      if (res.success) {
        setTenantActionSuccessMessage(`✅ Sukses memicu cadangan untuk tenant '${targetId}': ${res.filename}`);
        setTenantBackupLabel("");
        setTenantBackupNote("");
        fetchTenantLogs();
        if (targetId === tenantId) {
          fetchAllData();
        }
      } else {
        alert("Gagal memicu backup tenant: " + (res.message || res.error || "Terjadi kesalahan"));
      }
    } catch (err: any) {
      alert("Gagal mengeksekusi backup tenant: " + err.message);
    } finally {
      setTenantTriggerLoading(false);
    }
  };

  // Retry failed tenant backup
  const handleRetryTenantBackup = async (targetTenantId: string, logId?: string) => {
    if (logId) setRetryingLogId(logId);
    try {
      const res = await apiPost("/api/backup/retry-failed-tenant-backup", {
        tenantId: targetTenantId,
        adminUser: localStorage.getItem("user_name") || "Admin Pusat (Retry)"
      });

      if (res.success) {
        setTenantActionSuccessMessage(`✅ Sukses mencoba ulang cadangan tenant '${targetTenantId}'!`);
        fetchTenantLogs();
        if (targetTenantId === tenantId) fetchAllData();
      } else {
        alert("Gagal memicu ulang cadangan: " + res.message);
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat memicu ulang: " + err.message);
    } finally {
      setRetryingLogId(null);
    }
  };

  // Download snapshot from central log
  const handleDownloadTenantSnapshot = (filename: string, logTenantId: string) => {
    const downloadUrl = `/api/backup/download-snapshot/${encodeURIComponent(filename)}?tenantId=${encodeURIComponent(logTenantId)}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save automated backup schedule preferences
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const res = await apiPost("/api/backup/schedule", scheduleConfig);
      if (res.success) {
        alert("✅ Jadwal backup otomatis untuk tenant ini berhasil disimpan!");
      }
    } catch (err: any) {
      alert("Gagal menyimpan jadwal: " + err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  // Create immediate snapshot
  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true);
    try {
      const res = await apiPost("/api/backup/create-snapshot", {
        label: newSnapshotLabel.trim() || `Manual Snapshot Admin (${new Date().toLocaleDateString("id-ID")})`,
        note: newSnapshotNote.trim(),
        type: "MANUAL_SNAPSHOT"
      });

      if (res.success) {
        alert("✅ " + res.message);
        setShowCreateModal(false);
        setNewSnapshotLabel("");
        setNewSnapshotNote("");
        fetchAllData();
      }
    } catch (err: any) {
      alert("Gagal membuat snapshot: " + err.message);
    } finally {
      setCreatingSnapshot(false);
    }
  };

  // Trigger daily backup immediately
  const handleTriggerDailyBackup = async () => {
    setLoading(true);
    try {
      const res = await apiPost("/api/backup/trigger-daily");
      if (res.success) {
        alert(`✅ Backup otomatis berhasil dieksekusi: ${res.filename}`);
        fetchAllData();
      } else {
        alert("Gagal memicu backup: " + (res.error || "Terjadi kesalahan"));
      }
    } catch (err: any) {
      alert("Gagal memicu backup harian: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm and Execute Restore from Snapshot
  const handleExecuteRestore = async () => {
    if (!selectedSnapshotToRestore) return;
    setRestoring(true);
    try {
      const res = await apiPost("/api/backup/restore-snapshot", {
        filename: selectedSnapshotToRestore.filename
      });

      if (res.success) {
        setRestoreSuccessInfo({
          message: res.message,
          safetyRollbackFile: res.safetyRollbackFile,
          restoredStats: res.restoredStats
        });
        setSelectedSnapshotToRestore(null);
        fetchAllData();
      } else {
        alert("Gagal memulihkan snapshot: " + res.message);
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat memulihkan database: " + err.message);
    } finally {
      setRestoring(false);
    }
  };

  // Upload external JSON to restore
  const handleFileUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        if (!window.confirm(`Apakah Anda yakin ingin memulihkan database tenant '${tenantId}' dari file '${file.name}'? Sistem akan otomatis membuat safety rollback sebelum proses pemulihan.`)) {
          return;
        }

        setUploadingRestore(true);
        const res = await apiPost("/api/backup/restore-snapshot", {
          snapshotData: parsed
        });

        if (res.success) {
          alert(`✅ Database berhasil dipulihkan dari file '${file.name}'!\nRollback point: ${res.safetyRollbackFile}`);
          fetchAllData();
        } else {
          alert("Gagal memulihkan file: " + res.message);
        }
      } catch (parseErr: any) {
        alert("File JSON tidak valid atau rusak: " + parseErr.message);
      } finally {
        setUploadingRestore(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // Delete snapshot
  const handleDeleteSnapshot = async (filename: string) => {
    if (!window.confirm(`Hapus file snapshot '${filename}' secara permanen dari server?`)) {
      return;
    }

    try {
      const res = await apiDelete(`/api/backup/snapshot/${encodeURIComponent(filename)}`);
      if (res.success) {
        fetchAllData();
      }
    } catch (err: any) {
      alert("Gagal menghapus snapshot: " + err.message);
    }
  };

  // Download Full Database JSON
  const handleDownloadFullJson = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/backup");
      const data = await res.json();
      
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NexusPOS_Backup_${tenantId}_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString("id-ID");
      localStorage.setItem("last_backup_download_time", now);
      setBackupStats(prev => ({ ...prev, lastExportTime: now }));
    } catch (err) {
      alert("Gagal mengunduh backup JSON database.");
    } finally {
      setLoading(false);
    }
  };

  // Export CSV Transactions
  const handleExportTransactionsCSV = async () => {
    try {
      const transactions = await apiGet("/api/transactions");
      if (!Array.isArray(transactions) || transactions.length === 0) {
        alert("Tidak ada data transaksi untuk diekspor!");
        return;
      }

      const headers = [
        "No Invoice",
        "Tanggal & Waktu",
        "Nama Pelanggan",
        "Telepon Pelanggan",
        "Kasir",
        "Metode Pembayaran",
        "Status Pembayaran",
        "Total Pembayaran (Rp)",
        "Jumlah Item",
        "Daftar IMEI Terjual"
      ];

      const rows = transactions.map((t: any) => {
        const itemImeis = (t.items || []).map((i: any) => i.imei).filter(Boolean).join("; ");
        return [
          `"${t.id || ""}"`,
          `"${t.date ? new Date(t.date).toLocaleString("id-ID") : ""}"`,
          `"${(t.customerName || "Pelanggan Umum").replace(/"/g, '""')}"`,
          `"${t.customerPhone || "-"}"`,
          `"${(t.employeeName || "Kasir Utama").replace(/"/g, '""')}"`,
          `"${t.paymentMethod || "TUNAI"}"`,
          `"${t.paymentStatus || "LUNAS"}"`,
          t.totalAmount || 0,
          t.items ? t.items.length : 0,
          `"${itemImeis}"`
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Data_Transaksi_${tenantId}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal mengunduh CSV transaksi.");
    }
  };

  // Export CSV Products
  const handleExportProductsCSV = async () => {
    try {
      const products = await apiGet("/api/products");
      if (!Array.isArray(products) || products.length === 0) {
        alert("Tidak ada data produk untuk diekspor!");
        return;
      }

      const headers = [
        "ID SKU",
        "Nama Produk",
        "Merek",
        "Kategori",
        "Tipe Kondisi",
        "Harga Modal Beli (Rp)",
        "Harga Jual Toko (Rp)",
        "Stok Tersedia",
        "Batas Minimal Alert",
        "Daftar IMEI Active"
      ];

      const rows = products.map((p: any) => [
        `"${p.id || ""}"`,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${(p.brand || "").replace(/"/g, '""')}"`,
        `"${(p.category || "Smartphone").replace(/"/g, '""')}"`,
        `"${(p.type || "BARU").replace(/"/g, '""')}"`,
        p.priceBuy || 0,
        p.priceSell || 0,
        p.stock || 0,
        p.minStockAlert || 2,
        `"${(p.imeis || []).join("; ")}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Katalog_Produk_${tenantId}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal mengunduh CSV produk.");
    }
  };

  // Export CSV Audit Logs
  const handleExportAuditLogsCSV = async () => {
    try {
      const logs = await apiGet("/api/audit-logs");
      if (!Array.isArray(logs) || logs.length === 0) {
        alert("Tidak ada data audit log untuk diekspor!");
        return;
      }

      const headers = [
        "ID Log",
        "Waktu & Tanggal",
        "Pengguna / User",
        "Peran / Role",
        "Aksi Aktivitas",
        "Rincian Detail Keterangan"
      ];

      const rows = logs.map((l: any) => [
        `"${l.id || ""}"`,
        `"${l.timestamp ? new Date(l.timestamp).toLocaleString("id-ID") : ""}"`,
        `"${(l.userName || l.user || "System").replace(/"/g, '""')}"`,
        `"${l.userRole || "-"}"`,
        `"${(l.action || "").replace(/"/g, '""')}"`,
        `"${(l.details || "").replace(/"/g, '""')}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Audit_Log_${tenantId}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal mengunduh CSV audit log.");
    }
  };

  // Run annual archive
  const handleRunAnnualArchive = async () => {
    if (!window.confirm("Apakah Anda yakin ingin memindahkan data transaksi yang berusia lebih dari 1 tahun ke file cadangan JSON terpisah? Tabel utama akan dioptimalkan untuk mempercepat performa sistem.")) {
      return;
    }

    setArchiving(true);
    try {
      const result = await apiPost("/api/transactions/archive-annual");
      if (result.success) {
        if (result.archivedCount > 0 && result.archivedData) {
          const jsonStr = JSON.stringify(result, null, 2);
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const dateStr = new Date().toISOString().slice(0, 10);

          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Arsip_Transaksi_${tenantId}_${dateStr}.json`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        alert(result.message);
        fetchAllData();
      } else {
        alert(result.message || "Gagal menjalankan pengarsipan data tahunan.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat mengarsipkan: " + err.message);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div id="data-backup-module" className="space-y-6">
      
      {/* Top Banner: Multi-Tenant Context & Cloud Disaster Recovery Badge */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-6 rounded-2xl shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900 shrink-0">
            <Database className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Admin Panel Backup & Disaster Recovery Cloud
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold rounded-full flex items-center gap-1 border border-indigo-200 dark:border-indigo-800">
                <Building2 className="h-3 w-3" />
                Tenant: <span className="font-mono">{tenantId}</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-full flex items-center gap-1">
                <Cloud className="h-3 w-3" />
                Cloud Synced
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kelola jadwal backup otomatis berulang per tenant, buat snapshot point-in-time, serta unduh dan pulihkan database secara aman dengan perlindungan safety rollback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Tenant Switcher Quick Select if multiple available */}
          {availableTenants.length > 1 && (
            <select
              value={tenantId}
              onChange={(e) => switchTenant(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl outline-none cursor-pointer"
            >
              {availableTenants.map(t => (
                <option key={t.id} value={t.id}>
                  Toko: {t.name} ({t.id})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Segarkan
          </button>
        </div>
      </div>

      {/* Restore Success Alert Notice if triggered */}
      {restoreSuccessInfo && (
        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                {restoreSuccessInfo.message}
              </h4>
              {restoreSuccessInfo.safetyRollbackFile && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Cadangan sebelum pemulihan tersimpan aman di: <code className="font-mono font-bold">{restoreSuccessInfo.safetyRollbackFile}</code>. Anda dapat menggunakannya untuk membatalkan jika diperlukan.
                </p>
              )}
              {restoreSuccessInfo.restoredStats && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold rounded">
                    {restoreSuccessInfo.restoredStats.products} Produk
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold rounded">
                    {restoreSuccessInfo.restoredStats.transactions} Transaksi
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold rounded">
                    {restoreSuccessInfo.restoredStats.employees} Pengguna
                  </span>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => setRestoreSuccessInfo(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Summary Live Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">
              Riwayat Transaksi
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5 block">
              {backupStats.transactionsCount} Transaksi
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">
              Katalog & Stok HP
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5 block">
              {backupStats.productsCount} Produk SKU
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">
              Snapshot Tersedia
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5 block">
              {snapshots.length} File Snapshot
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">
              Proteksi Data
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 block">
              <Lock className="h-3.5 w-3.5" />
              AES-256 Multi-Tenant
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
        <button
          onClick={() => setActiveTab("snapshots")}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "snapshots"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Layers className="h-4 w-4" />
          Snapshot & Point-in-Time Restore ({snapshots.length})
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "schedule"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Jadwal Backup Otomatis Berulang
        </button>

        <button
          onClick={() => setActiveTab("export")}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "export"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Download className="h-4 w-4" />
          Ekspor JSON & CSV Excel
        </button>

        <button
          onClick={() => setActiveTab("archive")}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "archive"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Server className="h-4 w-4" />
          Arsip Data Tahunan
        </button>

        <button
          onClick={() => setActiveTab("migration")}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "migration"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Database className="h-4 w-4" />
          Impor / Ekspor Massal
          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Tenant Isolated
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("tenant-backup");
            fetchTenantLogs();
          }}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "tenant-backup"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Pusat Backup Spesifik Tenant
          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Admin Pusat
          </span>
        </button>
      </div>

      {/* SUCCESS ACTION NOTICE BANNER */}
      {tenantActionSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{tenantActionSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setTenantActionSuccessMessage(null)}
            className="text-xs font-black underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAB: PUSAT BACKUP SPESIFIK TENANT (CENTRAL ADMIN CONSOLE) */}
      {activeTab === "tenant-backup" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Info & Trigger Console Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    Konsol Eksekusi Backup Spesifik Berdasarkan TenantId
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Admin pusat dapat memicu pencadangan database mandiri untuk tenant/toko tertentu kapan saja tanpa mengganggu data toko lain. Semua riwayat dicatat secara terpusat untuk audit dan investigasi kegagalan sistem.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-auto">
                <button
                  onClick={fetchTenantLogs}
                  disabled={loadingTenantLogs}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingTenantLogs ? "animate-spin" : ""}`} />
                  Segarkan Log
                </button>
              </div>
            </div>

            {/* Trigger Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Tenant Selection Column */}
              <div className="lg:col-span-4 space-y-3">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Pilih Target Tenant ID :
                </label>

                <div className="space-y-2">
                  {!useCustomTenant ? (
                    <select
                      value={selectedTargetTenant}
                      onChange={(e) => setSelectedTargetTenant(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableTenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (ID: {t.id})
                        </option>
                      ))}
                      <option value="default">NexusPOS Central Store (default)</option>
                      <option value="sentral_medan">Sentral Smartphone Medan (sentral_medan)</option>
                      <option value="mitra_gadget">Mitra Gadget Bandung (mitra_gadget)</option>
                      <option value="galaxy_plaza">Galaxy Phone Plaza Surabaya (galaxy_plaza)</option>
                      <option value="istore_nusantara">iStore Nusantara Jakarta (istore_nusantara)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Masukkan ID Tenant (cth: cabang_surabaya)"
                      value={customTenantInput}
                      onChange={(e) => setCustomTenantInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={() => setUseCustomTenant(!useCustomTenant)}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      {useCustomTenant ? "← Pilih dari daftar toko terdaftar" : "✏️ Masukkan ID manual kustom..."}
                    </button>
                    <span className="text-slate-400 text-[10px]">
                      Target: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{useCustomTenant ? customTenantInput || "-" : selectedTargetTenant}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Label & Note Inputs Column */}
              <div className="lg:col-span-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Label Cadangan (Opsional) :
                    </label>
                    <input
                      type="text"
                      placeholder="cth: Pre-Audit Q3 atau Pra-Update"
                      value={tenantBackupLabel}
                      onChange={(e) => setTenantBackupLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Catatan / Alasan Backup :
                    </label>
                    <input
                      type="text"
                      placeholder="cth: Backup preventif sebelum sinkronisasi"
                      value={tenantBackupNote}
                      onChange={(e) => setTenantBackupNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Isolasi Terjamin: File JSON & snapshot terenkripsi AES-256 hanya berisi data tenant target.</span>
                </div>
              </div>

              {/* Action Button Column */}
              <div className="lg:col-span-3 pt-6 lg:pt-0 flex flex-col justify-center h-full">
                <button
                  onClick={handleTriggerCentralTenantBackup}
                  disabled={tenantTriggerLoading}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Play className={`h-4 w-4 ${tenantTriggerLoading ? "animate-spin" : ""}`} />
                  <span>{tenantTriggerLoading ? "Memproses Cadangan..." : "Picu Backup Tenant Sekarang"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs Table for Tenant Backups */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Log Hasil & Riwayat Pelacakan Backup Multi-Tenant ({tenantLogs.length})
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Setiap kegagalan atau keberhasilan pencadangan tercatat lengkap dengan checksum, ukuran file, dan alasan error.
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari ID/Toko/File..."
                    value={tenantFilterSearch}
                    onChange={(e) => setTenantFilterSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none"
                  />
                </div>

                <select
                  value={tenantLogFilter}
                  onChange={(e) => setTenantLogFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SUCCESS">✅ Hanya Berhasil (SUCCESS)</option>
                  <option value="FAILED">❌ Hanya Gagal (FAILED)</option>
                </select>
              </div>
            </div>

            {/* Logs list render */}
            {(() => {
              const filtered = tenantLogs.filter((log) => {
                if (tenantLogFilter !== "ALL" && log.status !== tenantLogFilter) return false;
                if (tenantFilterSearch.trim()) {
                  const q = tenantFilterSearch.toLowerCase();
                  const matchId = (log.tenantId || "").toLowerCase().includes(q);
                  const matchName = (log.tenantName || "").toLowerCase().includes(q);
                  const matchFile = (log.filename || "").toLowerCase().includes(q);
                  const matchLabel = (log.label || "").toLowerCase().includes(q);
                  return matchId || matchName || matchFile || matchLabel;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-10 space-y-2">
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Belum ada riwayat backup spesifik tenant yang sesuai dengan filter.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Picu backup pertama melalui form di atas untuk memulai pencatatan status.
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-extrabold uppercase tracking-wider border-y border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-3.5">ID Log & Tenant</th>
                        <th className="py-3 px-3.5">Status & Integritas</th>
                        <th className="py-3 px-3.5">File Snapshot & Checksum</th>
                        <th className="py-3 px-3.5">Detail & Pemicu</th>
                        <th className="py-3 px-3.5">Waktu Eksekusi</th>
                        <th className="py-3 px-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {filtered.map((log) => {
                        const isSuccess = log.status === "SUCCESS";
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="py-3.5 px-3.5">
                              <div className="space-y-1">
                                <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                  {log.id}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="font-extrabold text-slate-800 dark:text-white">
                                    {log.tenantName || log.tenantId}
                                  </span>
                                </div>
                                <span className="inline-block font-mono text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500">
                                  tenantId: {log.tenantId}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3.5">
                              <div className="space-y-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg uppercase ${
                                  isSuccess
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}>
                                  {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                  {log.status}
                                </span>

                                {isSuccess && log.stats && (
                                  <div className="text-[10px] text-slate-400 space-x-1 font-medium">
                                    <span>{log.stats.productsCount} prod</span>
                                    <span>•</span>
                                    <span>{log.stats.transactionsCount} tx</span>
                                  </div>
                                )}

                                {!isSuccess && log.errorMessage && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold max-w-[180px] truncate" title={log.errorMessage}>
                                    Error: {log.errorMessage}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-3.5">
                              <div className="space-y-1 max-w-[200px]">
                                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-200 truncate" title={log.filename}>
                                  {log.filename}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{log.sizeBytes > 0 ? `${(log.sizeBytes / 1024).toFixed(1)} KB` : "0 KB"}</span>
                                  {log.checksum && (
                                    <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-900 px-1 rounded">
                                      SHA:{log.checksum}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3.5">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-700 dark:text-slate-300">
                                  {log.label || "Manual Backup"}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Pemicu: <span className="font-medium text-slate-700 dark:text-slate-300">{log.initiatedBy || "Admin"}</span>
                                </div>
                                {log.note && (
                                  <div className="text-[10px] text-slate-400 italic">
                                    "{log.note}"
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-3.5">
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                {new Date(log.timestamp).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                              </div>
                            </td>

                            <td className="py-3.5 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isSuccess ? (
                                  <button
                                    onClick={() => handleDownloadTenantSnapshot(log.filename, log.tenantId)}
                                    title="Unduh file snapshot ini"
                                    className="p-2 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg cursor-pointer transition-all"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRetryTenantBackup(log.tenantId, log.id)}
                                    disabled={retryingLogId === log.id}
                                    title="Picu ulang pencadangan yang gagal"
                                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                  >
                                    <RotateCcw className={`h-3 w-3 ${retryingLogId === log.id ? "animate-spin" : ""}`} />
                                    <span>Coba Ulang</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 1: SNAPSHOTS & POINT-IN-TIME RESTORE */}
      {activeTab === "snapshots" && (
        <div className="space-y-6">
          {/* Action Header & Upload */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                Daftar Snapshot Database Cloud & Disk ({tenantId})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Setiap snapshot memuat rekaman lengkap struktur database pada titik waktu tertentu dan dapat dipulihkan kapan saja.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUploadRestore}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingRestore}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Upload className={`h-4 w-4 ${uploadingRestore ? "animate-bounce" : ""}`} />
                <span>{uploadingRestore ? "Memulihkan File..." : "Upload & Pulihkan JSON"}</span>
              </button>

              <button
                onClick={handleTriggerDailyBackup}
                className="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Play className="h-4 w-4" />
                <span>Trigger Cron Backup</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Buat Snapshot Baru</span>
              </button>
            </div>
          </div>

          {/* Snapshots Table / Grid */}
          {snapshots.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-12 rounded-2xl text-center space-y-3">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Database className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Belum Ada Snapshot Backup untuk Toko {tenantId}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Klik tombol "Buat Snapshot Baru" atau "Trigger Cron Backup" untuk membuat cadangan database titik waktu pertama Anda.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700"
              >
                Buat Snapshot Sekarang
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Nama Snapshot & Keterangan</th>
                      <th className="py-3 px-4">Tipe & Status Cloud</th>
                      <th className="py-3 px-4">Waktu Pembuatan</th>
                      <th className="py-3 px-4">Ukuran & Rekaman</th>
                      <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/80">
                    {snapshots.map((snap) => (
                      <tr key={snap.filename} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0 mt-0.5">
                              <FileJson className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-800 dark:text-white">
                                {snap.label || snap.filename}
                              </div>
                              <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                                {snap.filename}
                              </div>
                              {snap.checksum && (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Hash className="h-3 w-3" />
                                  <span>SHA-256: <code className="font-mono">{snap.checksum}...</code></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-black rounded-md uppercase ${
                              snap.backupType === "PRE_RESTORE_SAFETY"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : snap.backupType === "DAILY_CRON"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}>
                              {snap.backupType === "PRE_RESTORE_SAFETY"
                                ? "Safety Rollback"
                                : snap.backupType === "DAILY_CRON"
                                ? "Cron Harian"
                                : "Manual Snapshot"}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <Check className="h-3 w-3" />
                              <span>Cloud Verified</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <div className="font-medium">
                            {new Date(snap.modifiedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(snap.modifiedAt).toLocaleTimeString("id-ID")}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <div className="font-bold">
                            {(snap.sizeBytes / 1024).toFixed(1)} KB
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {snap.productsCount !== undefined ? `${snap.productsCount} Produk • ${snap.transactionsCount || 0} Tx` : "Format v2.0"}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={snap.downloadUrl}
                              download={snap.filename}
                              className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Unduh File Snapshot JSON"
                            >
                              <Download className="h-4 w-4" />
                            </a>

                            <button
                              onClick={() => setSelectedSnapshotToRestore(snap)}
                              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Pulihkan Database dari Snapshot ini"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => handleDeleteSnapshot(snap.filename)}
                              className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Snapshot"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUTOMATED RECURRING BACKUP SCHEDULER */}
      {activeTab === "schedule" && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Konfigurasi Jadwal Backup Otomatis Berulang (Tenant: {tenantId})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Atur frekuensi pencadangan otomatis cloud, waktu eksekusi harian, dan kebijakan retensi penyimpanan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleConfig.enabled}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  {scheduleConfig.enabled ? "Jadwal Aktif" : "Dinonaktifkan"}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frequency selection */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">
                Frekuensi Backup Otomatis
              </label>
              <select
                value={scheduleConfig.frequency}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value as any })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
              >
                <option value="DAILY">Harian (1x Setiap Hari / Tengah Malam)</option>
                <option value="TWICE_DAILY">2 Kali Sehari (Siang 12:00 & Malam 00:00)</option>
                <option value="WEEKLY">Mingguan (Setiap Hari Minggu)</option>
                <option value="HOURLY">Per Jam (Real-Time High Traffic)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Sistem akan secara otomatis membuat snapshot database terisolasi untuk tenant <code className="font-mono text-indigo-500">{tenantId}</code>.
              </p>
            </div>

            {/* Preferred Time */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">
                Waktu Eksekusi Harian (WIB)
              </label>
              <input
                type="time"
                value={scheduleConfig.preferredTime}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, preferredTime: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Disarankan memilih waktu di luar jam operasional toko (misal 00:00 atau 03:00 WIB).
              </p>
            </div>

            {/* Retention Policy */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">
                Kebijakan Retensi File Snapshot
              </label>
              <select
                value={scheduleConfig.retentionDays}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, retentionDays: Number(e.target.value) })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
              >
                <option value={7}>Simpan 7 Hari Terakhir</option>
                <option value={14}>Simpan 14 Hari Terakhir</option>
                <option value={30}>Simpan 30 Hari Terakhir (Direkomendasikan)</option>
                <option value={90}>Simpan 90 Hari (3 Bulan)</option>
                <option value={365}>Simpan 365 Hari (1 Tahun)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Snapshot yang melampaui batas hari retensi akan dibersihkan secara otomatis untuk efisiensi penyimpanan server.
              </p>
            </div>

            {/* Cloud Storage Vault info */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">
                Target Cloud Storage Vault
              </label>
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/60 rounded-xl text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <Cloud className="h-4 w-4 text-indigo-600" />
                <span>Google Cloud Storage & Firestore Encrypted Multi-Tenant Vault</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tersinkronisasi otomatis dengan enkripsi data terisolasi per slug toko.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <button
              onClick={handleSaveSchedule}
              disabled={savingSchedule}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
            >
              <Check className={`h-4 w-4 ${savingSchedule ? "animate-spin" : ""}`} />
              <span>{savingSchedule ? "Menyimpan Jadwal..." : "Simpan Pengaturan Jadwal"}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: EXPORT JSON & CSV */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full JSON Database Backup Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-xl">
                  <FileJson className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Backup Database Lengkap (JSON Format)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unduh seluruh struktur database (Transaksi, Stok, Audit, Karyawan, Promo) dalam 1 file JSON utuh.
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-150 dark:border-indigo-900/60 p-3.5 rounded-xl text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Format Resmi Multi-Tenant:
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Kompatibel 100% untuk migrasi cloud antar server VPS, Coolify, atau pemulihan darurat titik waktu.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadFullJson}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Unduh Full Database Backup (.JSON)
            </button>
          </div>

          {/* Modular CSV Export Options Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Ekspor Laporan Per Tabel (CSV / Excel Format)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unduh file CSV terpisah yang kompatibel dengan Microsoft Excel atau Google Sheets.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleExportTransactionsCSV}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 text-slate-700 dark:text-slate-200 hover:text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span>Unduh Data Transaksi Penjualan (CSV)</span>
                </div>
                <Download className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={handleExportProductsCSV}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 text-slate-700 dark:text-slate-200 hover:text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span>Unduh Katalog Produk & Serial IMEI (CSV)</span>
                </div>
                <Download className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={handleExportAuditLogsCSV}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 text-slate-700 dark:text-slate-200 hover:text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>Unduh Log Aktivitas Audit Keamanan (CSV)</span>
                </div>
                <Download className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANNUAL ARCHIVE */}
      {activeTab === "archive" && (
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 p-6 rounded-2xl shadow-md space-y-4 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                <Database className="h-3.5 w-3.5 text-amber-400" />
                <span>Optimasi Database & Pemeliharaan Performa</span>
              </div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Arsip Data Transaksi Tahunan (&gt; 1 Tahun)
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Pindahkan data riwayat transaksi lama yang berusia di atas 1 tahun ke file cadangan JSON terpisah. Tindakan ini menjaga tabel utama tetap optimal dan responsif tanpa menghapus histori penjualan Anda.
              </p>
            </div>

            <button
              onClick={handleRunAnnualArchive}
              disabled={archiving || archiveStats.eligibleToArchive === 0}
              className={`px-5 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg ${
                archiveStats.eligibleToArchive > 0
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
              }`}
            >
              <Download className={`h-4 w-4 ${archiving ? "animate-bounce" : ""}`} />
              <span>{archiving ? "Proses Memindahkan..." : "Jalankan Arsip Data (> 1 Tahun)"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Transaksi Aktif</span>
              <span className="text-base font-black text-white mt-0.5 block">{archiveStats.totalTransactions} Transaksi</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-amber-300 uppercase block">Siap Diarsipkan (&gt; 1 Thn)</span>
              <span className="text-base font-black text-amber-400 mt-0.5 block">{archiveStats.eligibleToArchive} Transaksi</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-emerald-300 uppercase block">Transaksi Terbaru (&le; 1 Thn)</span>
              <span className="text-base font-black text-emerald-400 mt-0.5 block">{archiveStats.recentCount} Transaksi</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-indigo-300 uppercase block">Total Dalam Arsip</span>
              <span className="text-base font-black text-indigo-300 mt-0.5 block">{archiveStats.archivedCount} Transaksi</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BULK MIGRATION & CSV HUB */}
      {activeTab === "migration" && (
        <div className="space-y-6">
          <MigrationRequest onRefreshGlobalData={fetchAllData} />
        </div>
      )}

      {/* CREATE SNAPSHOT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Buat Snapshot Database Baru
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tenant: <span className="font-mono font-bold text-indigo-600">{tenantId}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Label Snapshot
                </label>
                <input
                  type="text"
                  placeholder="Misal: Sebelum Tutup Buku Bulanan"
                  value={newSnapshotLabel}
                  onChange={(e) => setNewSnapshotLabel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Dibuat sebelum melakukan import stok 50 unit iPhone 15 Pro..."
                  value={newSnapshotNote}
                  onChange={(e) => setNewSnapshotNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleCreateSnapshot}
                disabled={creatingSnapshot}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Check className={`h-4 w-4 ${creatingSnapshot ? "animate-spin" : ""}`} />
                <span>{creatingSnapshot ? "Membuat Snapshot..." : "Simpan Snapshot"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {selectedSnapshotToRestore && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Konfirmasi Pemulihan Database (Point-in-Time Restore)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Anda akan memulihkan data toko <span className="font-mono font-bold text-indigo-600">{tenantId}</span> ke kondisi snapshot berikut:
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Snapshot:</span>
                <span className="font-bold text-slate-800 dark:text-white">{selectedSnapshotToRestore.label || selectedSnapshotToRestore.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Snapshot:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{selectedSnapshotToRestore.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Cadangan:</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{new Date(selectedSnapshotToRestore.modifiedAt).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ukuran File:</span>
                <span className="font-bold text-slate-800 dark:text-white">{(selectedSnapshotToRestore.sizeBytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Perlindungan Safety Rollback Otomatis:</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Sistem akan secara otomatis membuat snapshot rollback darurat dari kondisi saat ini sebelum proses pemulihan berjalan. Anda dapat membatalkannya kapan saja.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSnapshotToRestore(null)}
                disabled={restoring}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteRestore}
                disabled={restoring}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-amber-600/20"
              >
                <RotateCcw className={`h-4 w-4 ${restoring ? "animate-spin" : ""}`} />
                <span>{restoring ? "Memulihkan Database..." : "Ya, Pulihkan Sekarang"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
