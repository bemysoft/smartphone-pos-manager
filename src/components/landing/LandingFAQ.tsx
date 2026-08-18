import React, { useState } from "react";
import { 
  ChevronDown, 
  HelpCircle, 
  Sparkles, 
  MessageSquare, 
  PhoneCall, 
  ArrowRight,
  Headphones
} from "lucide-react";

export const LandingFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Apakah bisa scan nomor IMEI menggunakan kamera smartphone atau tablet tanpa beli scanner mahal?",
      a: "Bisa 100%! NexusPOS dilengkapi modul kamera barcode & QR code scanner bawaan berkecepatan tinggi. Anda juga bisa menyambungkan scanner USB atau wireless Bluetooth jika ingin alur kasir yang lebih cepat."
    },
    {
      q: "Bagaimana jika koneksi internet toko tiba-tiba mati saat transaksi sedang ramai?",
      a: "Kasir Anda tidak akan terhenti! NexusPOS dirancang dengan arsitektur Offline-First. Seluruh transaksi kasir dan mutasi barang tetap tersimpan aman di penyimpanan lokal browser dan akan otomatis disinkronisasi ke server Firestore ketika internet terhubung kembali."
    },
    {
      q: "Bagaimana cara memindahkan ribuan data produk & IMEI lama kami dari file Excel?",
      a: "Sangat mudah! Kami menyediakan template import Excel/CSV standar. Cukup upload file Anda, dan data produk, stok, nomor IMEI, serta harga modal akan masuk otomatis. Tim customer support kami juga siap mendampingi proses migrasi data Anda secara gratis."
    },
    {
      q: "Merek printer apa saja yang didukung untuk cetak struk kasir & tiket servis?",
      a: "NexusPOS mendukung hampir seluruh printer thermal Bluetooth dan USB 58mm maupun 80mm yang menggunakan protokol standar ESC/POS (seperti Panda, Iware, Eppos, Xprinter, Sunmi, RPP02N, Zijiang, Epson, dll)."
    },
    {
      q: "Apakah ada potongan persenan atau biaya tersembunyi untuk setiap transaksi kasir?",
      a: "Sama sekali TIDAK ADA. NexusPOS menggunakan sistem langganan flat subscription yang transparan. Berapapun omset dan jumlah transaksi toko Anda, biaya langganan tetap sama sesuai paket yang Anda pilih."
    },
    {
      q: "Apakah NexusPOS cocok untuk toko yang memiliki teknisi servis sekaligus melayani tukar tambah HP second?",
      a: "Tepat sekali! NexusPOS secara spesifik dirancang untuk ekosistem toko smartphone terpadu yang menggabungkan penjualan unit baru, tukar tambah HP bekas (trade-in), penjualan aksesoris, hingga perbaikan service center dengan perhitungan komisi teknisi."
    }
  ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-xs font-extrabold tracking-wider uppercase border border-primary-200 dark:border-primary-800">
            <HelpCircle className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
            <span>Tanya Jawab Populer</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Punya pertanyaan lain? Kami rangkum jawaban atas hal-hal yang paling sering ditanyakan oleh calon pengguna kami.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-12 space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary-600 dark:text-primary-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help banner */}
        <div className="mt-12 p-6 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-3 rounded-xl bg-primary-600 text-white shrink-0 hidden sm:block">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Masih butuh penjelasan lebih detail?</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Tim konsultan spesialis ritel HP kami siap membantu Anda setiap hari.</div>
            </div>
          </div>

          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20NexusPOS,%20saya%20tertarik%20dengan%20software%20POS%20untuk%20toko%20smartphone%20saya"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat WhatsApp Resmi</span>
          </a>
        </div>

      </div>
    </section>
  );
};
