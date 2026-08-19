import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Lock,
  ShieldCheck,
  Building2,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Database,
  Layers,
  Sparkles,
  Calendar,
  KeyRound,
  FileArchive
} from 'lucide-react';
import { TenantDetailedRecord } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TenantDataExportProps {
  tenants: TenantDetailedRecord[];
  onRefreshTenants?: () => void;
}

export default function TenantDataExport({ tenants, onRefreshTenants }: TenantDataExportProps) {
  const { t } = useLanguage();
  const [selectedTenantId, setSelectedTenantId] = useState<string>('ALL');
  const [encryptionPassword, setEncryptionPassword] = useState<string>('NexusPOS#Secret2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [includeAuditLogs, setIncludeAuditLogs] = useState<boolean>(true);
  const [includeTransactions, setIncludeTransactions] = useState<boolean>(true);
  const [includeEmployees, setIncludeEmployees] = useState<boolean>(true);
  const [includeSuppliers, setIncludeSuppliers] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Trigger Encrypted Export
  const handleExportData = async () => {
    if (!encryptionPassword || encryptionPassword.length < 8) {
      showToast('Kunci enkripsi minimal harus 8 karakter untuk keamanan data.', 'error');
      return;
    }

    try {
      setIsExporting(true);
      setExportResult(null);

      const endpoint = selectedTenantId === 'ALL'
        ? '/api/superadmin/tenants/export-all-encrypted'
        : `/api/superadmin/tenants/${selectedTenantId}/export-encrypted`;

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptionPassword,
          options: {
            includeAuditLogs,
            includeTransactions,
            includeEmployees,
            includeSuppliers
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setExportResult(data);
        showToast(data.message || 'Ekspor terenkripsi berhasil digenerate!', 'success');

        // Automatically trigger browser file download
        if (data.exportPayload) {
          const jsonBlob = new Blob([JSON.stringify(data.exportPayload, null, 2)], {
            type: 'application/json'
          });
          const downloadUrl = URL.createObjectURL(jsonBlob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = data.filename || `nexuspos_encrypted_export_${selectedTenantId}_${Date.now()}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        showToast(data.message || 'Gagal menghasilkan ekspor data.', 'error');
      }
    } catch (err: any) {
      showToast('Error ekspor: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedTenantObj = tenants.find(t => t.id === selectedTenantId);

  return (
    <div id="tenant-data-export-container" className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between shadow-lg ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-black text-xs">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-8 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-wider mb-3 border border-indigo-500/30">
              <Lock className="w-3.5 h-3.5" />
              SaaS Multi-Tenant Encrypted Vault
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Ekspor & Cadangan Terenkripsi Antar-Tenant
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Unduh seluruh snapshot basis data toko (Produk, Dual-IMEI, Transaksi, Hutang Supplier, Karyawan, dan Audit Logs) dalam format file JSON terenkripsi berstandar AES-256 untuk migrasi atau pencadangan offline darurat.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/60 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Tenant</p>
              <p className="text-xl font-black text-emerald-400">{tenants.length}</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/60 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Protokol Enkripsi</p>
              <p className="text-sm font-black text-indigo-400">AES-256 / SHA-256</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Options */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-primary-500" />
            Konfigurasi Ekspor Data Tenant
          </h3>

          <div className="space-y-4">
            {/* Tenant Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Toko / Tenant Target
              </label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white font-medium"
              >
                <option value="ALL">🌟 Semua Toko Terdaftar ({tenants.length} Tenant - Master Archive)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    🏪 {t.name} (Slug: {t.slug || t.id}) — Paket: {t.subscriptionPlan}
                  </option>
                ))}
              </select>
            </div>

            {/* Encryption Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  Kunci Sandi Enkripsi (Passphrase Pengaman)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Wajib diingat untuk dekripsi</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={encryptionPassword}
                  onChange={(e) => setEncryptionPassword(e.target.value)}
                  placeholder="Masukkan kata sandi pengaman enkripsi..."
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Scope / Tables inclusion checklist */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Modul & Koleksi yang Disertakan dalam Snapshot:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTransactions}
                    onChange={(e) => setIncludeTransactions(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Riwayat Transaksi & Penjualan</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Invoice, keranjang belanja, status pembayaran</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmployees}
                    onChange={(e) => setIncludeEmployees(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Karyawan & Hak Akses</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Akun kasir, manajer, dan admin cabang</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSuppliers}
                    onChange={(e) => setIncludeSuppliers(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Supplier & Hutang PO</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Daftar vendor dan jatuh tempo faktur</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAuditLogs}
                    onChange={(e) => setIncludeAuditLogs(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Jejak Audit Keamanan (Audit Logs)</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Perubahan data, login, dan mutasi stok</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Target: <strong>{selectedTenantId === 'ALL' ? 'Semua Toko' : selectedTenantObj?.name || selectedTenantId}</strong>
            </span>

            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengenkripsi Data...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate & Unduh JSON Terenkripsi
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Security Spec & Details */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Spesifikasi Keamanan Data
            </h4>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Algoritma Enkripsi Payload:</span>
                <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">AES-256-CBC with PBKDF2 Key Derivation (10,000 Iterations)</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Checksum Verifikasi:</span>
                <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">SHA-256 Integrity Hash Seal</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Isolasi Partisi:</span>
                <span className="text-[11px]">Setiap record secara permanen terikat dengan header metadata <code>tenantId</code> unik.</span>
              </div>
            </div>
          </div>

          {/* Export Success Card */}
          {exportResult && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Ekspor Sukses Digenerate!
              </div>
              <div className="text-xs text-emerald-800 dark:text-emerald-200 space-y-1 font-mono">
                <p>File: {exportResult.filename}</p>
                <p>Ukuran: {(exportResult.sizeBytes / 1024).toFixed(1)} KB</p>
                <p>Records: {exportResult.recordCount} entitas data</p>
                <p>Hash: {exportResult.checksum?.substring(0, 16)}...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
