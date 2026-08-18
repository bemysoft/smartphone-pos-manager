import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch, setActiveTenantId } from '../lib/api';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X,
  Smartphone,
  Tag,
  KeyRound,
  RefreshCw,
  Store
} from 'lucide-react';

interface TenantRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newTenant: any) => void;
}

export default function TenantRegistrationModal({ isOpen, onClose, onSuccess }: TenantRegistrationModalProps) {
  const [step, setStep] = useState<number>(1);
  const [storeName, setStoreName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [plan, setPlan] = useState<string>('TRIAL');
  const [inventoryTemplate, setInventoryTemplate] = useState<'SAMPLE_CATALOG' | 'BLANK_STARTER'>('SAMPLE_CATALOG');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredResult, setRegisteredResult] = useState<any | null>(null);

  // Auto-generate slug from store name
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    const cleanSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(cleanSlug);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch('/api/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          slug,
          phone,
          address,
          ownerName,
          ownerEmail,
          password,
          plan,
          inventoryTemplate
        })
      });

      const data = await res.json();
      if (data.success) {
        setRegisteredResult(data);
        if (onSuccess) onSuccess(data.tenant);
      } else {
        setErrorMsg(data.message || 'Pendaftaran tenant gagal.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = () => {
    if (registeredResult && registeredResult.tenant) {
      setActiveTenantId(registeredResult.tenant.slug || registeredResult.tenant.id);
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Registrasi Tenant Baru</h3>
              <p className="text-xs text-white/80">Buat partisi toko dan akun administrator mandiri</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {registeredResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">Toko Berhasil Didaftarkan!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tenant ID: <strong className="font-mono text-primary-600 dark:text-primary-400">{registeredResult.tenant.id}</strong> (Slug: {registeredResult.tenant.slug})
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
                <p className="font-bold text-slate-700 dark:text-slate-300">Detail Kredensial Administrator:</p>
                <div className="font-mono text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                  <p>Email: <strong>{registeredResult.tenant.ownerEmail}</strong></p>
                  <p>Username Admin: <strong>admin</strong></p>
                  <p>Paket: <strong>{registeredResult.tenant.subscriptionPlan}</strong> (Aktif 14 Hari Uji Coba)</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleDirectLogin}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Masuk Langsung ke Toko Ini
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    step === 1 ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  1. Info Toko
                </button>
                <div className="w-4 h-0.5 bg-slate-200 dark:bg-slate-700" />
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    step === 2 ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  2. Admin & Template
                </button>
              </div>

              {step === 1 ? (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Toko / Bisnis *
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => handleStoreNameChange(e.target.value)}
                        placeholder="Contoh: Galaxy Phone Store Surabaya"
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Domain Slug Unik *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                        pos.id/
                      </span>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="galaxy-phone"
                        className="w-full pl-16 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nomor WhatsApp Toko
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="08123456789"
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Kota / Alamat Singkat
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Surabaya, Jawa Timur"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!storeName || !slug}
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Lanjut ke Langkah 2
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Pemilik / Admin *
                      </label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Budi Santoso"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Akun Utama *
                      </label>
                      <input
                        type="email"
                        required
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="owner@galaxyphone.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Kata Sandi *
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Konfirmasi Kata Sandi *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pilihan Template Data Awal Toko:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center gap-2.5 transition-all ${inventoryTemplate === 'SAMPLE_CATALOG' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20' : 'border-slate-200 dark:border-slate-700'}`}>
                        <input
                          type="radio"
                          name="template"
                          checked={inventoryTemplate === 'SAMPLE_CATALOG'}
                          onChange={() => setInventoryTemplate('SAMPLE_CATALOG')}
                          className="text-primary-600"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Katalog Sample HP</p>
                          <p className="text-[10px] text-slate-500">Contoh iPhone & Samsung dengan IMEI</p>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center gap-2.5 transition-all ${inventoryTemplate === 'BLANK_STARTER' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20' : 'border-slate-200 dark:border-slate-700'}`}>
                        <input
                          type="radio"
                          name="template"
                          checked={inventoryTemplate === 'BLANK_STARTER'}
                          onChange={() => setInventoryTemplate('BLANK_STARTER')}
                          className="text-primary-600"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Katalog Kosong Bersih</p>
                          <p className="text-[10px] text-slate-500">Mulai input stok baru secara mandiri</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      Kembali
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !ownerEmail || !ownerName || !password}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Mendaftarkan Toko...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Selesaikan Pendaftaran
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
