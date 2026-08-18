import React, { useState, useMemo } from "react";
import { 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Search, 
  Award, 
  Printer, 
  Download, 
  ArrowUpRight, 
  CheckCircle2, 
  Percent, 
  BarChart3,
  Filter,
  UserCheck
} from "lucide-react";
import { Transaction, Employee } from "../types";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from "recharts";

interface SalesPerformanceReportProps {
  transactions: Transaction[];
  employees?: Employee[];
  currentUser?: any;
}

export default function SalesPerformanceReport({ 
  transactions = [], 
  employees = [], 
  currentUser 
}: SalesPerformanceReportProps) {
  const [periodFilter, setPeriodFilter] = useState<"TODAY" | "THIS_MONTH" | "LAST_30_DAYS" | "ALL" | "CUSTOM">("THIS_MONTH");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter transactions by selected date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStr = todayStr.substring(0, 7); // YYYY-MM

    return transactions.filter((t) => {
      if (t.paymentStatus !== "PAID") return false;
      if (!t.date) return false;

      const txDateStr = t.date.split("T")[0];

      if (periodFilter === "TODAY") {
        return txDateStr === todayStr;
      }
      if (periodFilter === "THIS_MONTH") {
        return txDateStr.startsWith(monthStr);
      }
      if (periodFilter === "LAST_30_DAYS") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return new Date(t.date) >= thirtyDaysAgo;
      }
      if (periodFilter === "CUSTOM") {
        if (customStartDate && txDateStr < customStartDate) return false;
        if (customEndDate && txDateStr > customEndDate) return false;
        return true;
      }
      return true; // ALL
    });
  }, [transactions, periodFilter, customStartDate, customEndDate]);

  // Total summary metrics
  const totalStoreRevenue = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.totalAmount || 0), 0);
  }, [filteredTransactions]);

  const totalStoreUnits = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      const itemsQty = (t.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
      return acc + itemsQty;
    }, 0);
  }, [filteredTransactions]);

  const totalStoreTxCount = filteredTransactions.length;

  // Group performance by employee ID (salesId or cashierId)
  const employeePerformanceList = useMemo(() => {
    const map: Record<string, {
      salesId: string;
      salesName: string;
      role: string;
      transactionCount: number;
      totalUnits: number;
      totalRevenue: number;
      itemsList: Record<string, number>;
    }> = {};

    // First seed with known employees list
    employees.forEach((emp) => {
      map[emp.id] = {
        salesId: emp.id,
        salesName: emp.name,
        role: emp.role || "Kasir",
        transactionCount: 0,
        totalUnits: 0,
        totalRevenue: 0,
        itemsList: {},
      };
    });

    // Populate from transactions
    filteredTransactions.forEach((t) => {
      const targetSalesId = t.salesId || t.cashierId || "UNKNOWN";
      const targetSalesName = t.salesName || t.cashierName || "Karyawan";

      if (!map[targetSalesId]) {
        map[targetSalesId] = {
          salesId: targetSalesId,
          salesName: targetSalesName,
          role: "Kasir",
          transactionCount: 0,
          totalUnits: 0,
          totalRevenue: 0,
          itemsList: {},
        };
      }

      const empEntry = map[targetSalesId];
      empEntry.transactionCount += 1;
      empEntry.totalRevenue += t.totalAmount || 0;

      (t.items || []).forEach((item) => {
        const qty = item.quantity || 1;
        empEntry.totalUnits += qty;
        empEntry.itemsList[item.name] = (empEntry.itemsList[item.name] || 0) + qty;
      });
    });

    const list = Object.values(map)
      .map((emp) => {
        const avgBasket = emp.transactionCount > 0 ? Math.round(emp.totalRevenue / emp.transactionCount) : 0;
        const contributionPct = totalStoreRevenue > 0 ? ((emp.totalRevenue / totalStoreRevenue) * 100) : 0;
        return {
          ...emp,
          avgBasket,
          contributionPct: Number(contributionPct.toFixed(1)),
        };
      })
      .filter((emp) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          emp.salesName.toLowerCase().includes(q) ||
          emp.salesId.toLowerCase().includes(q) ||
          emp.role.toLowerCase().includes(q)
        );
      });

    // Sort descending by totalRevenue, then totalUnits
    return list.sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalUnits - a.totalUnits);
  }, [filteredTransactions, employees, totalStoreRevenue, searchQuery]);

  // Top Performing Salesperson
  const topSalesperson = employeePerformanceList[0] && employeePerformanceList[0].totalRevenue > 0
    ? employeePerformanceList[0]
    : null;

  // Print/Export Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6"];

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Laporan Kinerja Penjualan Karyawan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analisis kontribusi penjualan, total unit terjual, dan omzet per ID karyawan penanggung jawab
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter Buttons */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setPeriodFilter("TODAY")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                periodFilter === "TODAY"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter("THIS_MONTH")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                periodFilter === "THIS_MONTH"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter("LAST_30_DAYS")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                periodFilter === "LAST_30_DAYS"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter("ALL")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                periodFilter === "ALL"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              Semua
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Omzet Penjualan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Omzet Sales</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              Rp {totalStoreRevenue.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Dari {totalStoreTxCount} transaksi Lunas
            </p>
          </div>
        </div>

        {/* Metric 2: Total Unit Terjual */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Unit Terjual</span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalStoreUnits.toLocaleString("id-ID")} <span className="text-xs font-bold text-slate-500">Unit</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Unit HP & Aksesoris terdistribusi
            </p>
          </div>
        </div>

        {/* Metric 3: Total Transaksi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Transaksi</span>
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalStoreTxCount} <span className="text-xs font-bold text-slate-500">Nota</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Rata-rata: Rp {totalStoreTxCount > 0 ? Math.round(totalStoreRevenue / totalStoreTxCount).toLocaleString("id-ID") : 0} / nota
            </p>
          </div>
        </div>

        {/* Metric 4: Top Salesperson */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
              <Award className="h-4 w-4 text-amber-300" /> Sales Champion
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/40 rounded-full text-[10px] font-extrabold text-emerald-100">
              TOP 1
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-black truncate">
              {topSalesperson ? topSalesperson.salesName : "Belum Ada"}
            </h3>
            <p className="text-xs text-emerald-100 font-semibold mt-0.5">
              {topSalesperson ? `Rp ${topSalesperson.totalRevenue.toLocaleString("id-ID")} (${topSalesperson.totalUnits} Unit)` : "0 Transaksi"}
            </p>
          </div>
        </div>
      </div>

      {/* VISUAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Chart 1: Unit Terjual Per Karyawan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Total Unit Terjual Per Karyawan
              </h3>
              <p className="text-[11px] text-slate-400">Volume kuantitas unit produk yang dijual oleh masing-masing staff</p>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeePerformanceList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="salesName" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-indigo-400">{data.salesName} ({data.salesId})</p>
                          <p className="text-slate-200">Total Unit: <span className="font-bold text-white">{data.totalUnits} Unit</span></p>
                          <p className="text-slate-300">Total Nota: {data.transactionCount} Transaksi</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalUnits" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Omzet Penjualan (Rp) Per Karyawan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Total Nilai Omzet Penjualan (Rp)
              </h3>
              <p className="text-[11px] text-slate-400">Kontribusi nominal rupiah hasil penjualan per ID karyawan</p>
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeePerformanceList} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="salesName" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-emerald-400">{data.salesName} ({data.salesId})</p>
                          <p className="text-slate-200">Total Omzet: <span className="font-bold text-emerald-300">Rp {data.totalRevenue.toLocaleString("id-ID")}</span></p>
                          <p className="text-slate-300">Kontribusi: {data.contributionPct}% Dari Toko</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalRevenue" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DETAILED DATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header & Search Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary-600" />
              Tabel Kinerja Penjualan Masing-Masing ID Karyawan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rincian kuantitas unit, total omzet, dan rata-rata transaksi per penanggung jawab sales
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / ID karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700">
                <th className="p-3.5 text-center w-12">Rank</th>
                <th className="p-3.5">Nama & ID Karyawan</th>
                <th className="p-3.5">Jabatan / Role</th>
                <th className="p-3.5 text-center">Total Transaksi</th>
                <th className="p-3.5 text-center">Total Unit Terjual</th>
                <th className="p-3.5 text-right">Total Nilai Penjualan</th>
                <th className="p-3.5 text-right">Rata-rata / Nota</th>
                <th className="p-3.5 text-center">Kontribusi Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {employeePerformanceList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data transaksi atau karyawan yang cocok.
                  </td>
                </tr>
              ) : (
                employeePerformanceList.map((emp, index) => {
                  const isTop = index === 0 && emp.totalRevenue > 0;
                  return (
                    <tr 
                      key={emp.salesId || index}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3.5 text-center font-bold">
                        {isTop ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-800 rounded-full font-black text-xs">
                            🥇
                          </span>
                        ) : (
                          <span className="text-slate-400">{index + 1}</span>
                        )}
                      </td>
                      <td className="p-3.5 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            isTop ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}>
                            {emp.salesName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {emp.salesName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {emp.salesId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-semibold text-[10px]">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                        {emp.transactionCount} <span className="text-[10px] font-normal text-slate-400">Nota</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg font-black">
                          {emp.totalUnits} Unit
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                        Rp {emp.totalRevenue.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                        Rp {emp.avgBasket.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-col items-center gap-1 w-28 mx-auto">
                          <div className="flex items-center justify-between w-full text-[10px] font-extrabold text-slate-600 dark:text-slate-400">
                            <span>{emp.contributionPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${Math.min(100, emp.contributionPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
