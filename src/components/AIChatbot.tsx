import { apiFetch } from '../lib/api';
import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Image, 
  Download, 
  Trash2, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Coins,
  Settings,
  Check,
  MessageSquare,
  Users
} from "lucide-react";
import { ChatMessage } from "../types";
import AIConfigModal from "./AIConfigModal";
import WhatsAppTemplateManager from "./WhatsAppTemplateManager";

export default function AIChatbot() {
  const [activeSubTab, setActiveSubTab] = useState<"CHAT" | "WHATSAPP_TEMPLATE">("CHAT");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: "Halo! Saya adalah **Asisten AI FonePOS**. Saya siap mendampingi Anda (Ricky Commedan) dalam mengelola operasional, menganalisis margin keuangan, memverifikasi keamanan IMEI smartphone, hingga membuat ide gambar poster promosi toko menggunakan teknologi kecerdasan buatan Gemini.\n\nSilakan ketik pertanyaan Anda atau gunakan pintasan cepat di bawah!",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Image Generator State
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [imageHistory, setImageHistory] = useState<any[]>([]);

  // AI Configuration State
  const [showSettings, setShowSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    provider: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    apiKey: "",
    model: "gemini-3.5-flash",
    imageModel: "gemini-3.1-flash-lite-image"
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load AI Config from LocalStorage or API
  useEffect(() => {
    const saved = localStorage.getItem("fonepos_ai_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAiConfig(parsed);
        return;
      } catch (e) {
        console.error("Gagal membaca fonepos_ai_config dari localStorage:", e);
      }
    }

    const fetchConfig = async () => {
      try {
        const res = await apiFetch("/api/ai/config");
        const data = await res.json();
        if (data) {
          setAiConfig(data);
        }
      } catch (err) {
        console.error("Gagal mengambil konfigurasi AI:", err);
      }
    };
    fetchConfig();
  }, [showSettings]);

  // Load image history
  const fetchImageLogs = async () => {
    try {
      const res = await apiFetch("/api/products"); // Trigger db state check
      const dRes = await apiFetch("/api/backup/logs"); // Trigger check
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchImageLogs();
  }, [generatedImageUrl]);

  // Handle Chat Submit
  const handleChatSubmit = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || inputMessage;
    if (!textToSend.trim()) return;

    // Add user message
    const userMsgId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage("");
    setIsChatLoading(true);

    let customConfig = null;
    try {
      const saved = localStorage.getItem("fonepos_ai_config");
      if (saved) {
        customConfig = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.sender === "user" ? "user" : "model", text: m.text })),
          customConfig
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now() + 1}`,
          sender: "ai",
          text: data.response,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now() + 1}`,
          sender: "ai",
          text: "Maaf, sistem AI sedang sibuk. Silakan coba sesaat lagi.",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Image Generation Submit
  const handleGenerateImage = async (e: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptValue = customPrompt || imagePrompt;
    if (!promptValue.trim()) return;

    setIsImageGenerating(true);
    setGeneratedImageUrl("");

    let customConfig = null;
    try {
      const saved = localStorage.getItem("fonepos_ai_config");
      if (saved) {
        customConfig = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const response = await apiFetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptValue, customConfig })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedImageUrl(data.imageUrl);
        setImagePrompt("");
        
        // Add log entry
        setImageHistory(prev => [
          {
            id: `img-${Date.now()}`,
            prompt: promptValue,
            imageUrl: data.imageUrl,
            timestamp: new Date().toLocaleString()
          },
          ...prev
        ]);
      } else {
        alert("Gagal membuat gambar poster AI.");
      }
    } catch (err) {
      console.error(err);
      alert("Koneksi gagal saat membuat gambar poster.");
    } finally {
      setIsImageGenerating(false);
    }
  };

  const quickPrompts = [
    { title: "Analisis Keuangan Toko", text: "Berapa keuntungan bersih toko saya dari seluruh penjualan saat ini?" },
    { title: "Verifikasi Aturan IMEI", text: "Bagaimana cara sistem melakukan verifikasi keaslian dan memblokir IMEI curian?" },
    { title: "Tips Sukses Buyback", text: "Berikan panduan negosiasi harga saat melakukan buyback iPhone dari pelanggan bekas." },
    { title: "Cek Stok Rendah", text: "Periksa apakah ada stok hp yang berada di bawah batas minimum?" }
  ];

  const quickImages = [
    "Poster promo buyback iPhone bekas, gradasi biru neon premium",
    "Promo smartphone cashback gede, 3D render minimalis merah",
    "Gebrakan diskon hp baru Samsung Ultra, flat design modern"
  ];

  return (
    <div className="space-y-6">
      
      {/* Sub Tab Navigation Bar */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md">
        <button
          type="button"
          onClick={() => setActiveSubTab("CHAT")}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 ${
            activeSubTab === "CHAT"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Bot className="h-4 w-4 text-primary-600" />
          <span>Asisten Chat & Poster AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("WHATSAPP_TEMPLATE")}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 ${
            activeSubTab === "WHATSAPP_TEMPLATE"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <span>Template WA Promosi</span>
        </button>
      </div>

      {activeSubTab === "WHATSAPP_TEMPLATE" ? (
        <WhatsAppTemplateManager />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* AI Chatbot Module (7 Columns) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col h-[650px] justify-between">
            <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <Bot className="h-5.5 w-5.5 text-primary-600" />
              Asisten Audit AI & Konsultan Finansial
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-lg border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1 text-xs"
                title="Pengaturan API & Model AI"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Konfigurasi AI</span>
              </button>
              <span className="text-[9px] bg-primary-50 text-primary-700 font-bold px-2.5 py-1 rounded-full border border-primary-200">
                {aiConfig.provider === "gemini" ? "Gemini Active" : "Custom AI Active"}
              </span>
            </div>
          </div>

          {/* AI Settings Modal */}
          <AIConfigModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            onSave={(newCfg) => setAiConfig(newCfg)} 
          />

          {/* Quick Prompts shortcuts */}
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleChatSubmit(undefined, p.text)}
                disabled={isChatLoading}
                className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-primary-300 text-left rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                <p className="text-[10px] font-bold text-primary-700 line-clamp-1">{p.title}</p>
                <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{p.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Messages Thread */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
          {messages.map((m) => {
            const isAi = m.sender === "ai";
            return (
              <div 
                key={m.id} 
                className={`flex gap-3 text-xs max-w-[85%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                <div className={`p-2.5 rounded-2xl leading-relaxed space-y-1.5 ${isAi ? "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-xs" : "bg-primary-600 text-white rounded-tr-none shadow-xs"}`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span className={`text-[8px] block text-right ${isAi ? "text-slate-400" : "text-primary-200"}`}>{m.timestamp}</span>
                </div>
              </div>
            );
          })}
          {isChatLoading && (
            <div className="flex gap-2 items-center text-slate-500 text-xs italic pl-2">
              <RefreshCw className="h-4.5 w-4.5 animate-spin text-primary-600" />
              Gemini sedang memikirkan audit dan kalkulasi...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input form */}
        <form onSubmit={(e) => handleChatSubmit(e)} className="flex gap-2">
          <input
            type="text"
            required
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Tanyakan margin profit, status IMEI, atau instruksi buyback..."
          />
          <button
            type="submit"
            disabled={isChatLoading || !inputMessage.trim()}
            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-40 transition-all"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>

      {/* AI Marketing Poster Creator (5 Columns) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <Image className="h-5.5 w-5.5 text-emerald-600" />
            Pembuat Poster Promosi AI Toko
          </h2>
          <p className="text-xs text-slate-500 mt-1">Buat gambar banner, selebaran digital promo buyback, atau materi instagram instan.</p>
        </div>

        {/* Prompt shortcuts */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspirasi Prompt Cepat</label>
          <div className="space-y-1.5">
            {quickImages.map((q, i) => (
              <button
                key={i}
                type="button"
                disabled={isImageGenerating}
                onClick={(e) => handleGenerateImage(e, q)}
                className="w-full p-2 bg-slate-50 hover:bg-slate-100 text-left text-[11px] text-slate-700 rounded-xl border border-slate-200 hover:border-emerald-400/50 truncate block transition-all cursor-pointer"
              >
                ✨ {q}
              </button>
            ))}
          </div>
        </div>

        {/* Image generation form */}
        <form onSubmit={handleGenerateImage} className="space-y-3">
          <input
            type="text"
            required
            value={imagePrompt}
            disabled={isImageGenerating}
            onChange={(e) => setImagePrompt(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Tulis deskripsi poster, contoh: Promo Tukar Tambah HP..."
          />
          <button
            type="submit"
            disabled={isImageGenerating || !imagePrompt.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 flex justify-center items-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles className="h-4 w-4" />
            {isImageGenerating ? "Mendesain Poster..." : "Rancang Poster via Gemini AI"}
          </button>
        </form>

        {/* Display screen */}
        {isImageGenerating && (
          <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-400 border border-slate-200">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-2" />
            <p className="text-xs font-semibold">Gemini sedang menggambar grafis...</p>
          </div>
        )}

        {generatedImageUrl && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <img 
              src={generatedImageUrl} 
              alt="Generated poster" 
              className="w-full h-auto aspect-square rounded-xl object-cover shadow-xs border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-500 font-medium">Poster Desain Selesai</span>
              <a
                href={generatedImageUrl}
                download={`poster_promosi_${Date.now()}.png`}
                className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100/80 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all"
              >
                <Download className="h-3 w-3" />
                Unduh Gambar
              </a>
            </div>
          </div>
        )}

        {imageHistory.length > 0 && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Arsip Galeri Poster AI</h4>
            <div className="grid grid-cols-4 gap-2">
              {imageHistory.slice(0, 4).map((h) => (
                <button
                   key={h.id}
                   onClick={() => setGeneratedImageUrl(h.imageUrl)}
                   className="aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 cursor-pointer transition-all"
                   title={h.prompt}
                >
                  <img src={h.imageUrl} alt="Archived thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )}
</div>
  );
}
