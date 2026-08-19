import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  Smartphone,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Radio,
  Layers
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export interface SuperadminActivityLogItem {
  id: string;
  tenantId: string;
  tenantName?: string;
  category: 'AUTH' | 'FINANCIAL' | 'INVENTORY' | 'SECURITY' | 'BACKUP' | 'CONFIG' | 'SYSTEM';
  action: string;
  logType?: string;
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  device?: string;
  timestamp: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  verificationStatus?: 'VERIFIED_SAME_TENANT' | 'FLAGGED_ANOMALY' | 'UNVERIFIED';
  metadata?: Record<string, any>;
}

interface TenantActivityLogProps {
  currentTenantId?: string;
  onRefreshStats?: () => void;
}

export default function TenantActivityLog({ currentTenantId, onRefreshStats }: TenantActivityLogProps) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<SuperadminActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTenant, setSelectedTenant] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [availableTenants, setAvailableTenants] = useState<{ id: string; name: string }[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/superadmin/activity-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
          if (Array.isArray(data.tenants)) {
            setAvailableTenants(data.tenants);
          }
        }
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('Notice loading superadmin activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Auto refresh every 20 seconds if toggled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedTenant !== 'ALL' && log.tenantId !== selectedTenant) {
        return false;
      }
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (log.title && log.title.toLowerCase().includes(q)) ||
          (log.description && log.description.toLowerCase().includes(q)) ||
          (log.tenantId && log.tenantId.toLowerCase().includes(q)) ||
          (log.tenantName && log.tenantName.toLowerCase().includes(q)) ||
          (log.userName && log.userName.toLowerCase().includes(q)) ||
          (log.action && log.action.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, selectedTenant, selectedCategory, selectedSeverity, searchQuery]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Waktu', 'Tenant ID', 'Nama Toko', 'Kategori', 'Aksi', 'Judul', 'Pengguna', 'Peran', 'Deskripsi', 'Status Keamanan'];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.timestamp).toLocaleString('id-ID')}"`,
      `"${l.tenantId}"`,
      `"${l.tenantName || l.tenantId}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${l.userName || 'System'}"`,
      `"${l.userRole || '-'}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${l.verificationStatus || 'VERIFIED'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tenant_activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Category Badge Styler
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'AUTH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Lock className="w-2.5 h-2.5" /> AUTH / LOGIN
          </span>
        );
      case 'FINANCIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Activity className="w-2.5 h-2.5" /> KEUANGAN
          </span>
        );
      case 'INVENTORY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Smartphone className="w-2.5 h-2.5" /> INVENTORI
          </span>
        );
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Shield className="w-2.5 h-2.5" /> KEAMANAN
          </span>
        );
      case 'BACKUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Layers className="w-2.5 h-2.5" /> BACKUP / CLOUD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <FileText className="w-2.5 h-2.5" /> {category}
          </span>
        );
    }
  };

  // Severity Styler
  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'INFO':
      default:
        return <Activity className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  // Metrics
  const totalEvents = logs.length;
  const securityWarnings = logs.filter(l => l.category === 'SECURITY' || l.severity === 'WARNING' || l.severity === 'ERROR').length;
  const uniqueTenantsInLogs = new Set(logs.map(l => l.tenantId)).size;
  const authLogins = logs.filter(l => l.category === 'AUTH').length;

  return (
    <div id="tenant-activity-log-container" className="space-y-6">
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Riwayat Log</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalEvents.toLocaleString('id-ID')}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Seluruh tenant terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tenant Aktif</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{uniqueTenantsInLogs}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Memiliki riwayat aktivitas</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sesi Login / Auth</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{authLogins}</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">Autentikasi kasir & admin</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peringatan Keamanan</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{securityWarnings}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Anomali atau gagal login</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul log, deskripsi, tenant ID, atau nama pengguna..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
              Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>

            <button
              onClick={handleExportCsv}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV ({filteredLogs.length})
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Filter Toko / Tenant</label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="ALL">Semua Toko ({logs.length})</option>
              {availableTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Kategori Aktivitas</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="AUTH">Autentikasi & Login (AUTH)</option>
              <option value="FINANCIAL">Keuangan & Transaksi (FINANCIAL)</option>
              <option value="INVENTORY">Inventori & IMEI (INVENTORY)</option>
              <option value="SECURITY">Keamanan & Audit (SECURITY)</option>
              <option value="BACKUP">Backup & Restore (BACKUP)</option>
              <option value="CONFIG">Konfigurasi Toko (CONFIG)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tingkat Status / Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="INFO">Informasi Biasa (INFO)</option>
              <option value="SUCCESS">Berhasil / Lolos (SUCCESS)</option>
              <option value="WARNING">Peringatan (WARNING)</option>
              <option value="ERROR">Kesalahan / Anomali (ERROR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Log Terpusat Multi-Tenant ({filteredLogs.length} Baris)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Terakhir dimuat: {lastRefreshed.toLocaleTimeString('id-ID')}
          </span>
        </div>

        {loading && logs.length === 0 ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Memuat log aktivitas terpusat...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Tidak ada log aktivitas yang cocok</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter di atas.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">{getSeverityIcon(log.severity)}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {getCategoryBadge(log.category)}
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Toko: {log.tenantName || log.tenantId} ({log.tenantId})
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {log.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {log.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          {log.userName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              Pengguna: <strong>{log.userName}</strong> ({log.userRole || 'USER'})
                            </span>
                          )}
                          {log.ipAddress && (
                            <span>
                              IP: <code>{log.ipAddress}</code>
                            </span>
                          )}
                          {log.verificationStatus && (
                            <span className={`inline-flex items-center gap-1 font-bold ${log.verificationStatus === 'VERIFIED_SAME_TENANT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              <Shield className="w-3 h-3" />
                              {log.verificationStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title={isExpanded ? 'Tutup Detail' : 'Lihat Detail'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded JSON payload */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 overflow-hidden"
                      >
                        <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl text-xs font-mono overflow-x-auto">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-bold font-sans">
                            Metadata Payload Rinci:
                          </p>
                          <pre className="text-[11px] leading-relaxed">
                            {JSON.stringify(
                              {
                                id: log.id,
                                tenantId: log.tenantId,
                                category: log.category,
                                action: log.action,
                                title: log.title,
                                description: log.description,
                                userId: log.userId,
                                userName: log.userName,
                                userRole: log.userRole,
                                timestamp: log.timestamp,
                                verificationStatus: log.verificationStatus,
                                metadata: log.metadata || {}
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
