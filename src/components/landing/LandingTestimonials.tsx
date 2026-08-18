import React from "react";
import { 
  Star, 
  Sparkles, 
  Quote, 
  Store, 
  MapPin, 
  CheckCircle2 
} from "lucide-react";

export const LandingTestimonials: React.FC = () => {
  const testimonials = [
    {
      name: "Hendrik Wijaya",
      role: "Owner, Galaxy Cell (3 Cabang)",
      location: "ITC Roxy Mas, Jakarta Pusat",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      content: "Dulu kami sering pusing saat stock opname HP bekas karena nomor IMEI sering tertukar dan salah input modal. Sejak pakai NexusPOS, pelacakan unit second dan tukar tambah jadi rapi 100%. Kasir juga jauh lebih cepat.",
      stats: "Selisih Stok Turun Jadi 0%"
    },
    {
      name: "Ricky Pratama",
      role: "Founder, Medan Gadget Store & Service",
      location: "Plaza Medan Fair, Medan",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      content: "Modul tiket servisnya luar biasa! Pelanggan sangat senang karena mereka dapat update status pengerjaan otomatis via WhatsApp saat LCD atau baterai HP-nya selesai diganti. Komisi teknisi juga otomatis terhitung akurat.",
      stats: "Kepuasan Pelanggan Naik 95%"
    },
    {
      name: "Siti Rahmawati",
      role: "Operasional, Berkah Phone Retail",
      location: "WTC Surabaya, Jawa Timur",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      content: "Fitur transfer stok antar cabang dengan surat jalan nomor resi sangat membantu koordinasi 4 toko kami. Ketika internet mal sedang down, kasir offline tetap jalan tanpa panik dan otomatis tersinkron lagi.",
      stats: "Efisiensi Waktu Admin 40 Jam/Bulan"
    }
  ];

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-extrabold tracking-wider uppercase border border-amber-200 dark:border-amber-800">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>Kisah Sukses Pengguna</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Dipercaya Lebih dari 1.450+ Pemilik Toko Smartphone di Seluruh Indonesia
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Dengar langsung cerita nyata bagaimana pemilik toko gadget dan service center bertransformasi bersama NexusPOS.
          </p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-xl transition-all"
            >
              <div>
                {/* 5 Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  "{item.content}"
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-11 w-11 rounded-full object-cover border-2 border-primary-500"
                  />
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {item.name}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.role}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Hasil: {item.stats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
