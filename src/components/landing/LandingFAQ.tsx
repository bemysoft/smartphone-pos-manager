import React, { useState } from "react";
import { 
  ChevronDown, 
  HelpCircle, 
  Sparkles, 
  MessageSquare, 
  Headphones
} from "lucide-react";
import { useLandingContent } from "../../lib/landingContent";

export const LandingFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const landingContent = useLandingContent();
  const faqData = landingContent.faq;
  const whatsappNum = landingContent.brand.contactWhatsapp.replace(/\D/g, "") || "6281234567890";

  return (
    <section id="faq" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-extrabold tracking-wider uppercase border border-blue-200 dark:border-blue-800">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Tanya Jawab Populer</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {faqData.title}
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {faqData.subtitle}
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-12 space-y-3.5">
          {faqData.items.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help banner */}
        <div className="mt-12 p-6 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-3 rounded-xl bg-blue-600 text-white shrink-0 hidden sm:block">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Masih butuh penjelasan lebih detail?</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Tim konsultan spesialis ritel smartphone kami siap membantu Anda setiap hari.</div>
            </div>
          </div>

          <a
            href={`https://wa.me/${whatsappNum}?text=Halo%20Admin%20NexusPOS,%20saya%20tertarik%20dengan%20software%20POS%20untuk%20toko%20smartphone%20saya`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat WhatsApp Resmi</span>
          </a>
        </div>

      </div>
    </section>
  );
};
