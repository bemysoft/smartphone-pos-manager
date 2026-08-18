import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from "react";
import { Wallet, DollarSign, ArrowDownRight, ArrowUpRight, Plus, CheckCircle, Calculator, TrendingUp, TrendingDown, Clock, Printer } from "lucide-react";


export default function CashRegister({ currentUser }: { currentUser: any }) {
  
  const [session, setSession] = useState<any>(null);
  const [flows, setFlows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showManualFlowModal, setShowManualFlowModal] = useState(false);

  // Form states
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");
  
  const [flowType, setFlowType] = useState<"CASH_IN" | "CASH_OUT">("CASH_OUT");
  const [flowCategory, setFlowCategory] = useState<string>("BIAYA_LAIN");
  const [flowAmount, setFlowAmount] = useState<number>(0);
  const [flowDesc, setFlowDesc] = useState<string>("");

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await apiFetch("/api/cash/session");
      const data = await res.json();
      setSession(data.session);
      if (data.session) {
        fetchFlows(data.session.id);
      } else {
        setFlows([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlows = async (sessionId: string) => {
    try {
      const res = await apiFetch("/api/cash/flows?sessionId=" + sessionId);
      const data = await res.json();
      setFlows(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRegister = async () => {
    if (openingBalance < 0) return alert("Nominal tidak valid");
    try {
      const res = await apiFetch("/api/cash/session/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierId: currentUser?.id || "EMP001",
          cashierName: currentUser?.name || "Kasir",
          openingBalance
        })
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        fetchFlows(data.session.id);
        setShowOpenModal(false);
        setOpeningBalance(0);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseRegister = async () => {
    try {
      const res = await apiFetch("/api/cash/session/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualClosingBalance: closingBalance,
          adjustmentReason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Kasir berhasil ditutup. Selisih: Rp ${data.session.difference.toLocaleString()}`);
        handlePrintEodReport();
        setTimeout(() => {
          setSession(null);
          setFlows([]);
          setShowCloseModal(false);
          setClosingBalance(0);
          setAdjustmentReason("");
        }, 1500);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  const handlePrintEodReport = () => {
    const printArea = document.createElement("div");
    printArea.id = "thermal-print-area";
    const container = document.getElementById("eod-thermal-container");
    if (!container) return;
    printArea.innerHTML = container.innerHTML;

    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page { margin: 0; size: 58mm 210mm; }
        body * { visibility: hidden; }
        #thermal-print-area, #thermal-print-area * {
          visibility: visible;
          font-family: monospace !important;
          color: #000 !important;
        }
        #thermal-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 58mm;
          padding: 2mm;
          font-size: 10px !important;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .border-b { border-bottom: 1px dashed #000; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .pb-2 { padding-bottom: 8px; }
        .pt-2 { padding-top: 8px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
      }
    `;

    document.body.appendChild(style);
    document.body.appendChild(printArea);

    setTimeout(() => {
      window.print();
      try {
        document.body.removeChild(printArea);
        document.body.removeChild(style);
      } catch (e) {}
    }, 50);
  };


  const handleAddFlow = async () => {
    if (flowAmount <= 0) return alert("Nominal harus lebih dari 0");
    if (!flowDesc) return alert("Deskripsi wajib diisi");
    try {
      const res = await apiFetch("/api/cash/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: flowType,
          category: flowCategory,
          amount: flowAmount,
          description: flowDesc
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowManualFlowModal(false);
        fetchFlows(session.id);
        setFlowAmount(0);
        setFlowDesc("");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  let expectedBalance = 0;
  let totalIn = 0;
  let totalOut = 0;
  flows.forEach(f => {
    if (f.type === "CASH_IN") {
      expectedBalance += f.amount;
      if (f.category !== "MODAL_AWAL") totalIn += f.amount;
    } else {
      expectedBalance -= f.amount;
      totalOut += f.amount;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-indigo-500" />
            Manajemen Kas / Kasir
          </h2>
          <p className="text-sm text-slate-500 mt-1">Pencatatan uang laci kasir (pemasukan & pengeluaran tunai).</p>
        </div>
        <div>
          {session ? (
            <div className="flex gap-2">
            <button 
              onClick={handlePrintEodReport}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm shadow-sm flex items-center gap-2"
            >
              <Printer className="h-4 w-4" /> Cetak Rekap
            </button>
            <button 
              onClick={() => {
                setClosingBalance(expectedBalance);
                setShowCloseModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-md"
            >
              Tutup Kasir (End Shift)
            </button>
          </div>) : (
            <button 
              onClick={() => setShowOpenModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20"
            >
              Buka Kasir (Start Shift)
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 font-bold">Memuat data...</div>
      ) : !session ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <Wallet className="h-16 w-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Kasir Belum Dibuka</h3>
          <p className="text-slate-500 max-w-sm mb-6">Silakan buka shift kasir terlebih dahulu dengan memasukkan saldo awal laci untuk mulai menerima transaksi.</p>
          <button 
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Clock className="h-5 w-5" /> Buka Shift Kasir
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="h-12 w-12" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimasi Saldo Laci</p>
              <h3 className="text-2xl font-black text-indigo-700">Rp {expectedBalance.toLocaleString()}</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-2">Termasuk Modal Awal: Rp {(flows.find(f => f.category === "MODAL_AWAL")?.amount || 0).toLocaleString()}</p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" /> Uang Masuk
              </p>
              <h3 className="text-xl font-bold text-slate-800">Rp {totalIn.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500 mt-2">Dari Penjualan Tunai dll.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" /> Uang Keluar
              </p>
              <h3 className="text-xl font-bold text-slate-800">Rp {totalOut.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500 mt-2">Dari Buyback, Retur, Biaya.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between items-start justify-center">
              <button 
                onClick={() => setShowManualFlowModal(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors font-bold"
              >
                <Plus className="h-6 w-6" />
                Catat Biaya / Kasbon
              </button>
            </div>
          </div>

          {/* Flows Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Riwayat Arus Kas (Shift Ini)</h3>
              <span className="text-xs font-mono bg-slate-200 text-slate-600 px-2 py-1 rounded">Kasir: {session.cashierName}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Waktu</th>
                    <th className="px-6 py-3">Kategori</th>
                    <th className="px-6 py-3">Keterangan</th>
                    <th className="px-6 py-3 text-right">Masuk (In)</th>
                    <th className="px-6 py-3 text-right">Keluar (Out)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">Belum ada transaksi.</td>
                    </tr>
                  ) : (
                    flows.map((f: any) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 whitespace-nowrap font-mono text-xs">{new Date(f.timestamp).toLocaleTimeString("id-ID")}</td>
                        <td className="px-6 py-3">
                          <span className={"px-2 py-0.5 rounded text-[10px] font-bold border " + (
                            f.category === 'MODAL_AWAL' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                            f.category === 'PENJUALAN' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            f.category === 'BUYBACK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          )}>
                            {f.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-xs font-medium text-slate-800">{f.description}</p>
                          {f.referenceId && <p className="text-[10px] font-mono text-slate-400">{f.referenceId}</p>}
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-emerald-600">
                          {f.type === "CASH_IN" ? "+" + f.amount.toLocaleString() : "-"}
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-rose-600">
                          {f.type === "CASH_OUT" ? "-" + f.amount.toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* OPEN SHIFT MODAL */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-6 w-6 text-indigo-500" />
                Buka Shift Kasir
              </h2>
              <p className="text-xs text-slate-500 mt-1">Masukkan uang modal awal yang ada di laci kasir saat ini.</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Modal Awal Laci (Rp)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-bold">Rp</span>
                </div>
                <input
                  type="text"
                  value={openingBalance || openingBalance === 0 || openingBalance === "0" ? Number(openingBalance).toLocaleString("id-ID") : ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setOpeningBalance(val ? parseInt(val, 10) : 0);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-lg font-bold text-slate-800"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowOpenModal(false)} className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
              <button 
                onClick={handleOpenRegister}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                Mulai Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE SHIFT MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="h-6 w-6 text-slate-700" />
                Tutup Shift Kasir
              </h2>
              <p className="text-xs text-slate-500 mt-1">Hitung fisik uang di laci dan cocokkan dengan sistem.</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Estimasi Saldo Sistem:</span>
                <span className="font-bold text-slate-800 font-mono">Rp {expectedBalance.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Uang Fisik Laci (Rp)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-bold">Rp</span>
                </div>
                <input
                  type="text"
                  value={closingBalance || closingBalance === 0 || closingBalance === "0" ? Number(closingBalance).toLocaleString("id-ID") : ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setClosingBalance(val ? parseInt(val, 10) : 0);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-slate-500 font-mono text-xl font-bold text-slate-800"
                  placeholder="0"
                />
              </div>
              <div className="mt-2 text-right">
                {closingBalance - expectedBalance > 0 ? (
                  <span className="text-xs font-bold text-emerald-600">Selisih: Lebih Rp {((closingBalance || 0) - (expectedBalance || 0)).toLocaleString()}</span>
                ) : closingBalance - expectedBalance < 0 ? (
                  <span className="text-xs font-bold text-rose-600">Selisih: Kurang Rp {Math.abs((closingBalance || 0) - (expectedBalance || 0)).toLocaleString()}</span>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Selisih: Cocok (0)</span>
                )}
              </div>
            </div>

            {closingBalance - expectedBalance !== 0 && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4">
                <label className="block text-[11px] font-bold text-amber-800 uppercase mb-2">Penyesuaian Kas: Alasan Selisih</label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Cth: Kembalian kurang 500 perak, Tip pelanggan"
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCloseModal(false)} className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
              <button 
                onClick={handleCloseRegister}
                className="flex-[2] py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                Simpan & Tutup Shift
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* HIDDEN PRINT CONTAINER FOR EOD REPORT */}
      <div className="hidden">
        <div id="eod-thermal-container" className="bg-white text-black p-4" style={{ width: "280px" }}>
          <div className="text-center pb-2 mb-2 border-b">
            <h3 className="font-bold" style={{ fontSize: "14px" }}>REKAP KASIR HARIAN</h3>
            <p>Shift: {session?.cashierName || "Kasir"}</p>
            <p>{new Date().toLocaleString("id-ID")}</p>
          </div>
          
          <div className="pb-2 mb-2 border-b">
            <div className="flex justify-between">
              <span>Modal Awal:</span>
              <span className="font-bold">Rp {(flows.find(f => f.category === "MODAL_AWAL")?.amount || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pb-2 mb-2 border-b">
            <h4 className="font-bold mb-1">PEMASUKAN</h4>
            <div className="flex justify-between">
              <span>Penjualan & dll:</span>
              <span>Rp {(totalIn || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pb-2 mb-2 border-b">
            <h4 className="font-bold mb-1">PENGELUARAN</h4>
            <div className="flex justify-between">
              <span>Total Keluar:</span>
              <span>-Rp {(totalOut || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="pt-2 mb-2">
            <div className="flex justify-between font-bold" style={{ fontSize: "12px" }}>
              <span>ESTIMASI LACI:</span>
              <span>Rp {(expectedBalance || 0).toLocaleString()}</span>
            </div>
            
            {closingBalance !== 0 && (
              <>
                <div className="flex justify-between" style={{ fontSize: "12px" }}>
                  <span>AKTUAL LACI:</span>
                  <span>Rp {(closingBalance || 0).toLocaleString()}</span>
                </div>
                {closingBalance - expectedBalance !== 0 && (
                  <div className="flex justify-between mt-1 pt-1 border-t" style={{ fontSize: "11px" }}>
                    <span>SELISIH:</span>
                    <span className="font-bold">
                      {closingBalance - expectedBalance > 0 ? "+" : ""}
                      Rp {((closingBalance || 0) - (expectedBalance || 0)).toLocaleString()}
                    </span>
                  </div>
                )}
                {adjustmentReason && (
                  <div className="text-left mt-1 italic" style={{ fontSize: "10px" }}>
                    Note: {adjustmentReason}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="text-center pt-2 border-b border-t pb-2">
            <p>--- AKHIR LAPORAN ---</p>
          </div>
        </div>
      </div>


      {/* ADD MANUAL FLOW MODAL */}
      {showManualFlowModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-5">
            <h2 className="text-lg font-bold text-slate-800">Catat Arus Kas Manual</h2>
            
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button 
                onClick={() => setFlowType("CASH_OUT")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${flowType === 'CASH_OUT' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}
              >Pengeluaran</button>
              <button 
                onClick={() => setFlowType("CASH_IN")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${flowType === 'CASH_IN' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
              >Pemasukan</button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Kategori</label>
              <select 
                value={flowCategory}
                onChange={e => setFlowCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {flowType === "CASH_OUT" ? (
                  <>
                    <option value="BIAYA_LAIN">Biaya Operasional (Makan, Listrik dll)</option>
                    <option value="TARIK_TUNAI">Setor Tunai ke Bank / Bos</option>
                  </>
                ) : (
                  <>
                    <option value="BIAYA_LAIN">Pendapatan Lain-lain</option>
                    <option value="TARIK_TUNAI">Tambah Modal Tunai (Dari Bos)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nominal (Rp)</label>
              <input
                type="text"
                value={flowAmount || flowAmount === 0 || flowAmount === "0" ? Number(flowAmount).toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setFlowAmount(val ? parseInt(val, 10) : 0);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Keterangan</label>
              <input
                type="text"
                placeholder="Cth: Beli makan siang, Bayar listrik"
                value={flowDesc}
                onChange={(e) => setFlowDesc(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowManualFlowModal(false)} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl border border-slate-200">Batal</button>
              <button 
                onClick={handleAddFlow}
                className={`flex-1 py-2 text-white font-bold rounded-xl shadow-md ${flowType === 'CASH_IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
