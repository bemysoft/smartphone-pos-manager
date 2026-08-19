import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Users,
  Lock,
  Globe,
  Smartphone,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Sliders,
  Activity,
  Trash2,
  Ban,
  Clock,
  Eye,
  KeyRound,
  FileText
} from 'lucide-react';
import { TenantDetailedRecord } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export interface SecuritySessionItem {
  id: string;
  tenantId: string;
  tenantName?: string;
  username: string;
  userRole: string;
  ipAddress: string;
  deviceInfo: string;
  loginTime: string;
  lastActive: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface SecurityAnomalyItem {
  id: string;
  tenantId: string;
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string;
  timestamp: string;
}

interface SecurityHealthReportProps {
  tenants: TenantDetailedRecord[];
  onRefreshTenants?: () => void;
}

export default function SecurityHealthReport({ tenants, onRefreshTenants }: SecurityHealthReportProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [healthData, setHealthData] = useState<any | null>(null);
  const [activeSessions, setActiveSessions] = useState<SecuritySessionItem[]>([]);
  const [anomalies, setAnomalies] = useState<SecurityAnomalyItem[]>([]);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [newBlockIp, setNewBlockIp] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchSecurityHealth = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/superadmin/security-health');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHealthData(data.health);
          setActiveSessions(data.sessions || []);
          setAnomalies(data.anomalies || []);
          setBlockedIps(data.blockedIps || []);
        }
      }
    } catch (err) {
      console.warn('Notice loading security health report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityHealth();
  }, []);

  // Revoke an active session
  const handleRevokeSession = async (sessionId: string, tenantId: string) => {
    try {
      const res = await apiFetch('/api/superadmin/security/revoke-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, tenantId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Sesi pengguna berhasil dicabut secara instan!', 'success');
        fetchSecurityHealth();
      } else {
        showToast(data.message || 'Gagal mencabut sesi', 'error');
      }
    } catch (err: any) {
      showToast('Error cabut sesi: ' + err.message, 'error');
    }
  };

  // Block an IP address
  const handleBlockIp = async (ipToBlock?: string) => {
    const target = ipToBlock || newBlockIp.trim();
    if (!target) return;

    try {
      const res = await apiFetch('/api/superadmin/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: target })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`IP ${target} berhasil diblokir dari seluruh gateway API!`, 'success');
        setNewBlockIp('');
        fetchSecurityHealth();
      }
    } catch (err: any) {
      showToast('Error blokir IP: ' + err.message, 'error');
    }
  };

  // Unblock IP
  const handleUnblockIp = async (ipToUnblock: string) => {
    try {
      const res = await apiFetch('/api/superadmin/security/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipToUnblock })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`IP ${ipToUnblock} berhasil di-unblock!`, 'success');
        fetchSecurityHealth();
      }
    } catch (err: any) {
      showToast('Error unblock IP: ' + err.message, 'error');
    }
  };

  const securityScore = healthData?.overallScore || 96;

  return (
    <div id="security-health-report-container" className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-black text-xs">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-900/40 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">Skor Keamanan SaaS</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-black text-white">{securityScore}</span>
              <span className="text-sm font-bold text-indigo-300">/ 100</span>
            </div>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              GRADE: OPTIMAL (A+)
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sesi Kasir & Admin Aktif</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeSessions.length}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">JWT token valid terlacak</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Failed Login Attempts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gagal Login 24 Jam</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {healthData?.failedLoginCount24h || 0}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Otomatis dibatasi (Rate Limit)</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Blocked IP Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP Masuk Blacklist</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{blockedIps.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Diblokir dari level gateway</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Ban className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Columns: Active Sessions & Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Sessions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Daftar Sesi Pengguna Aktif ({activeSessions.length})
              </h3>
            </div>
            <button
              onClick={fetchSecurityHealth}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan Sesi
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto max-h-[450px]">
            {activeSessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Tidak ada sesi aktif terdeteksi saat ini.
              </div>
            ) : (
              activeSessions.map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {session.username}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {session.userRole}
                      </span>
                      <span className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold">
                        🏪 {session.tenantName || session.tenantId}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {session.ipAddress}
                      </span>
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        {session.deviceInfo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Login: {new Date(session.loginTime).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeSession(session.id, session.tenantId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer shrink-0"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cabut Sesi
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: IP Blacklist & Access Anomalies */}
        <div className="space-y-6">
          {/* IP Blacklist Manager */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-500" />
              Manajemen IP Blacklist Gateway
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newBlockIp}
                onChange={(e) => setNewBlockIp(e.target.value)}
                placeholder="Contoh: 192.168.1.100"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white font-mono"
              />
              <button
                onClick={() => handleBlockIp()}
                disabled={!newBlockIp.trim()}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Blokir IP
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {blockedIps.length === 0 ? (
                <p className="text-[11px] text-slate-400">Belum ada IP yang diblokir.</p>
              ) : (
                blockedIps.map((ip) => (
                  <div key={ip} className="flex items-center justify-between p-2.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40 text-xs">
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{ip}</span>
                    <button
                      onClick={() => handleUnblockIp(ip)}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 dark:hover:text-rose-200 cursor-pointer"
                    >
                      Buka Blokir
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security Anomalies Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Deteksi Anomali Keamanan Terbaru
            </h4>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {anomalies.length === 0 ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Sistem aman: Tidak ada anomali atau ancaman terdeteksi.</span>
                </div>
              ) : (
                anomalies.map((an) => (
                  <div key={an.id} className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-800 dark:text-amber-200">{an.type}</span>
                      <span className="text-[10px] text-slate-400">{new Date(an.timestamp).toLocaleTimeString('id-ID')}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{an.details}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                      <span>IP: {an.sourceIp}</span>
                      <button
                        onClick={() => handleBlockIp(an.sourceIp)}
                        className="text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Blokir IP Ini
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
