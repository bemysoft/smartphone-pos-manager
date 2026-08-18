import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Sparkles, Copy, Check, Users, UserCheck, RefreshCw, FileText, Phone, ExternalLink, Zap, Tag } from "lucide-react";
import { apiFetch } from "../lib/api";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points?: number;
  role?: string;
}

interface TemplatePreset {
  id: string;
  title: string;
  category: string;
  content: string;
}

const PRESET_TEMPLATES: TemplatePreset[] = [
  {
    id: "tpl-buyback",
    title: "Promo Tukar Tambah & Buyback HP Bekas",
    category: "Buyback",
    content: "Halo *{NAMA_PELANGGAN}*! 👋\n\nPunya smartphone bekas atau iPhone lama yang jarang dipakai? Tukar tambah di *{NAMA_TOKO}* dan dapatkan cashback hingga *Rp 500.000* + Gratis Tempered Glass Premium!\n\n✨ Taksiran harga tinggi & proses transparan 15 menit.\n📍 Cek penawaran langsung atau klik: {LINK_KATALOG}\n\nGunakan kode voucher: *{KODE_VOUCHER}* (Berlaku s/d {BATAS_TANGGAL})."
  },
  {
    id: "tpl-flashsale",
    title: "Promo Flash Sale Smartphone Baru Garansi Resmi",
    category: "Penjualan Unit",
    content: "Halo Kak *{NAMA_PELANGGAN}*! 🚀\n\nPenawaran khusus untuk Anda! *{NAMA_TOKO}* sedang mengadakan *FLASH SALE SMARTPHONE* dengan diskon s/d *{DISKON_PERSEN}%* untuk tipe favorit iPhone & Android Garansi Resmi!\n\n🎁 Bonus Adaptor Fast Charger + Garansi Toko Tambahan.\n\nStok terbatas! Balas pesan ini atau kunjungi toko kami hari ini. promo berakhir {BATAS_TANGGAL}!"
  },
  {
    id: "tpl-aksesoris",
    title: "Diskon Aksesori & Tempered Glass",
    category: "Aksesori",
    content: "Hai Kak *{NAMA_PELANGGAN}*, terimakasih telah menjadi pelanggan setia *{NAMA_TOKO}*! 🎉\n\nSpesial bulan ini, nikmati *BUY 1 GET 1 FREE* untuk semua aksesori original: Charger, Cable, Case & Tempered Glass 9H!\n\nTunjukkan pesan WhatsApp ini ke kasir untuk klaim diskon instan Kakak. Ditunggu kedatangannya ya!"
  },
  {
    id: "tpl-loyalty",
    title: "Voucher Ucapan Terima Kasih Pelanggan Setia",
    category: "Loyaltas",
    content: "Halo *{NAMA_PELANGGAN}*,\n\nSebagai bentuk apresiasi kami di *{NAMA_TOKO}*, Kakak memiliki poin keanggotaan sebanyak *{POIN_PELANGGAN} Poin*. Poin ini bisa ditukarkan dengan potongan harga langsung saat transaksi berikutnya!\n\nGunakan kode: *{KODE_VOUCHER}* saat checkout. Terima kasih telah mempercayai layanan kami! 🙏"
  },
  {
    id: "tpl-servis",
    title: "Pengingat Layanan & Garansi Produk",
    category: "Layanan",
    content: "Halo Kak *{NAMA_PELANGGAN}*,\n\nSekedar mengingatkan bahwa unit smartphone yang Kakak beli di *{NAMA_TOKO}* terlindungi garansi resmi kami. Jika membutuhkan pengecekan kesehatan baterai atau pembersihan unit gratis, silakan mampir ke toko kami kapan saja.\n\nSalam hangat,\nTim *{NAMA_TOKO}*"
  }
];

export default function WhatsAppTemplateManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("ALL");
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(PRESET_TEMPLATES[0].id);
  const [messageDraft, setMessageDraft] = useState<string>(PRESET_TEMPLATES[0].content);
  
  // Dynamic Variables
  const [storeName, setStoreName] = useState("FonePOS Smartphone Store");
  const [discountPercent, setDiscountPercent] = useState("15");
  const [voucherCode, setVoucherCode] = useState("FONEPOS2026");
  const [expiryDate, setExpiryDate] = useState("31 Agustus 2026");
  const [catalogUrl, setCatalogUrl] = useState("https://fonepos.store/promo");
  
  const [targetPhone, setTargetPhone] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load Customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await apiFetch("/api/customers");
        const data = await res.json();
        if (Array.isArray(data)) {
          setCustomers(data);
        }
      } catch (err) {
        console.error("Gagal memuat database pelanggan:", err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  // Selected customer object
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Auto update target phone when customer is selected
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.phone) {
      setTargetPhone(selectedCustomer.phone);
    }
  }, [selectedCustomerId]);

  // Compute final compiled message replacing placeholders
  const getCompiledMessage = () => {
    let text = messageDraft;
    const custName = selectedCustomer ? selectedCustomer.name : "Sahabat FonePOS";
    const custPhone = selectedCustomer ? selectedCustomer.phone : targetPhone || "-";
    const custPoints = selectedCustomer && selectedCustomer.points ? selectedCustomer.points.toString() : "150";

    text = text.replace(/\{NAMA_PELANGGAN\}/g, custName);
    text = text.replace(/\{NO_HP\}/g, custPhone);
    text = text.replace(/\{POIN_PELANGGAN\}/g, custPoints);
    text = text.replace(/\{NAMA_TOKO\}/g, storeName);
    text = text.replace(/\{DISKON_PERSEN\}/g, discountPercent);
    text = text.replace(/\{KODE_VOUCHER\}/g, voucherCode);
    text = text.replace(/\{BATAS_TANGGAL\}/g, expiryDate);
    text = text.replace(/\{LINK_KATALOG\}/g, catalogUrl);

    return text;
  };

  // Insert tag placeholder into text area
  const insertTag = (tag: string) => {
    setMessageDraft(prev => prev + " " + tag);
  };

  // Select Preset Template
  const handleSelectPreset = (tpl: TemplatePreset) => {
    setSelectedTemplateId(tpl.id);
    setMessageDraft(tpl.content);
  };

  // Polish draft with Gemini AI
  const handlePolishWithGemini = async () => {
    setIsPolishing(true);
    try {
      const currentText = getCompiledMessage();
      const prompt = `Poles dan perbagus draf pesan WhatsApp promosi toko smartphone berikut agar lebih persuasif, menarik perhatian, rapi dengan emoji yang pas, dan siap dikirim ke pelanggan. Tetap pertahankan informasi penting seperti nama toko, voucher, dan promo.\n\nDraf Asli:\n${currentText}`;

      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt })
      });

      const data = await res.json();
      if (data.success && data.response) {
        setMessageDraft(data.response);
      } else {
        alert("Gagal memoles pesan via Gemini AI.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memoles draf pesan.");
    } finally {
      setIsPolishing(false);
    }
  };

  // Copy compiled message
  const handleCopyMessage = () => {
    const finalMsg = getCompiledMessage();
    navigator.clipboard.writeText(finalMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Open WhatsApp Web/App via wa.me link
  const handleOpenWhatsApp = () => {
    const finalMsg = getCompiledMessage();
    let cleanPhone = targetPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }

    const encodedMsg = encodeURIComponent(finalMsg);
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(waUrl, "_blank");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/20">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Template Pesan WhatsApp Promosi Pelanggan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih draf promosi, kustomisasi berdasarkan database pelanggan, dan kirim via WhatsApp pihak ketiga
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{customers.length} Pelanggan Terdaftar</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Panel: Template Presets & Customer Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Customer Selection Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Target Pelanggan Database:</span>
            </label>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">-- Kirim Umum / Format Draf --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || "Tanpa No HP"}) {c.role ? `- ${c.role}` : ""}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Nama Pelanggan:</span>
                  <strong className="text-slate-900 dark:text-slate-100">{selectedCustomer.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>No. WhatsApp:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{selectedCustomer.phone || "-"}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Poin Keanggotaan:</span>
                  <strong className="text-amber-600 dark:text-amber-400">{selectedCustomer.points || 0} Poin</strong>
                </div>
              </div>
            )}
          </div>

          {/* Template Presets Picker */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Pilihan Template Promosi:</span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk memuat</span>
            </label>

            <div className="space-y-2">
              {PRESET_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectPreset(tpl)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500/80 ring-1 ring-emerald-500"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{tpl.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold border border-slate-200 dark:border-slate-700">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {tpl.content}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variables Kustomisasi Form */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Variabel Parameter Promo:</span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Toko:</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Diskon (%):</label>
                <input
                  type="text"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Kode Voucher:</label>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Batas Tanggal:</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Panel: Editor, AI Polish, Preview & Direct Send (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Text Editor Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span>Editor Draf Pesan Promo:</span>
              </label>

              <button
                type="button"
                onClick={handlePolishWithGemini}
                disabled={isPolishing}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isPolishing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>{isPolishing ? "Memoles..." : "Poles via Gemini AI"}</span>
              </button>
            </div>

            {/* Placeholder Quick Insert Badges */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisipkan Tag Dinamis:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "{NAMA_PELANGGAN}",
                  "{NAMA_TOKO}",
                  "{DISKON_PERSEN}",
                  "{KODE_VOUCHER}",
                  "{BATAS_TANGGAL}",
                  "{POIN_PELANGGAN}",
                  "{LINK_KATALOG}"
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag)}
                    className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Textarea */}
            <textarea
              rows={8}
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              className="w-full p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-sans leading-relaxed text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Tulis draf pesan WhatsApp di sini..."
            />
          </div>

          {/* Compiled WhatsApp Preview Phone Screen Box */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-emerald-600" />
              <span>Pratinjau Tampilan Pesan WhatsApp (Real-time):</span>
            </label>

            <div className="bg-[#e5ddd5] dark:bg-slate-950 p-4 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-inner space-y-3">
              <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 rounded-2xl rounded-tl-none max-w-[90%] shadow-md border border-slate-200 dark:border-slate-800 space-y-2 text-xs leading-relaxed whitespace-pre-wrap">
                {getCompiledMessage()}
                <div className="text-[9px] text-slate-400 text-right font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* Direct WhatsApp Action Bar */}
          <div className="bg-emerald-950 text-white p-4 rounded-3xl border border-emerald-800 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">Nomor Tujuan WhatsApp:</span>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="bg-slate-900 border border-emerald-700 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-300 outline-none mt-1 w-full sm:w-60"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? "Tersalin!" : "Salin Teks"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-none shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span>Kirim via WA Web / App</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
