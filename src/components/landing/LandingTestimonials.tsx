import React from "react";
import { 
  Star, 
  MapPin, 
  CheckCircle2,
  User
} from "lucide-react";
import { useLandingContent } from "../../lib/landingContent";

export const LandingTestimonials: React.FC = () => {
  const landingContent = useLandingContent();
  const testData = landingContent.testimonials;
  const items = testData.items || [];

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-extrabold tracking-wider uppercase border border-amber-200 dark:border-amber-800">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>Kisah Sukses Pengguna</span>
          </div>

          <h2 className="mt-4 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {testData.title}
          </h2>

          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {testData.subtitle}
          </p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-xl transition-all"
            >
              <div>
                {/* Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="mt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  "{item.content}"
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {item.name}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.role}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>

                {item.stats && (
                  <div className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Hasil: {item.stats}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
