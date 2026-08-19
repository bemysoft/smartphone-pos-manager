import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  Sparkles,
  Info,
  CheckCircle2
} from "lucide-react";
import { Transaction, Buyback, Product } from "../types";
import { useLanguage } from "../contexts/LanguageContext";

interface MonthlyRevenueTrendChartProps {
  transactions: Transaction[];
  buybacks: Buyback[];
  products: Product[];
  initialMonthlyTarget?: number;
}

export const MonthlyRevenueTrendChart: React.FC<MonthlyRevenueTrendChartProps> = ({
  transactions,
  buybacks,
  products,
  initialMonthlyTarget = 250000000 // Default 250jt target per month
}) => {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "last6" | "last12" | "currentYear">("all");
  const [chartViewType, setChartViewType] = useState<"area" | "bar" | "composed">("area");
  const [monthlyTarget, setMonthlyTarget] = useState<number>(initialMonthlyTarget);
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [showDataTable, setShowDataTable] = useState<boolean>(true);

  // Month names for localization
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  // Process raw transactions & buybacks into monthly grouped metrics
  const rawMonthlyData = useMemo(() => {
    const map: Record<
      string,
      {
        monthKey: string;
        year: number;
        monthIndex: number;
        displayLabel: string;
        fullLabel: string;
        revenue: number;
        cost: number;
        buyback: number;
        txCount: number;
        totalUnits: number;
      }
    > = {};

    // 1. Process Paid Retail Transactions
    transactions.forEach(tx => {
      if (tx.paymentStatus !== "PAID" || !tx.date) return;
      const mKey = tx.date.slice(0, 7); // e.g. "2026-06"
      if (!mKey || mKey.length < 7) return;

      const [yStr, mStr] = mKey.split("-");
      const year = parseInt(yStr, 10);
      const monthIndex = parseInt(mStr, 10) - 1;

      if (!map[mKey]) {
        map[mKey] = {
          monthKey: mKey,
          year,
          monthIndex,
          displayLabel: `${shortMonthNames[monthIndex] || mStr} '${String(year).slice(-2)}`,
          fullLabel: `${monthNames[monthIndex] || mStr} ${year}`,
          revenue: 0,
          cost: 0,
          buyback: 0,
          txCount: 0,
          totalUnits: 0
        };
      }

      let txCost = 0;
      let units = 0;
      tx.items.forEach(item => {
        units += item.quantity || 1;
        const prod = products.find(p => p.id === item.productId);
        let pPrice = prod ? prod.priceBuy : Math.floor(item.priceSell * 0.85);
        if (prod?.purchasedImeisHistory) {
          const h = prod.purchasedImeisHistory.find(hist => hist.imei === item.imei);
          if (h) pPrice = h.purchasePrice;
        }
        txCost += pPrice * (item.quantity || 1);
      });

      map[mKey].revenue += tx.totalAmount;
      map[mKey].cost += txCost;
      map[mKey].txCount += 1;
      map[mKey].totalUnits += units;
    });

    // 2. Process Customer Buyback Expenses
    buybacks.forEach(bb => {
      if (!bb.date) return;
      const mKey = bb.date.slice(0, 7);
      if (!mKey || mKey.length < 7) return;

      const [yStr, mStr] = mKey.split("-");
      const year = parseInt(yStr, 10);
      const monthIndex = parseInt(mStr, 10) - 1;

      if (!map[mKey]) {
        map[mKey] = {
          monthKey: mKey,
          year,
          monthIndex,
          displayLabel: `${shortMonthNames[monthIndex] || mStr} '${String(year).slice(-2)}`,
          fullLabel: `${monthNames[monthIndex] || mStr} ${year}`,
          revenue: 0,
          cost: 0,
          buyback: 0,
          txCount: 0,
          totalUnits: 0
        };
      }

      map[mKey].buyback += bb.priceBuy || 0;
    });

    // Sort chronologically
    const sortedKeys = Object.keys(map).sort();
    
    // If no transactions exist, provide realistic data structure
    if (sortedKeys.length === 0) {
      const curYear = new Date().getFullYear();
      const demoMonths = [
        { key: `${curYear}-01`, rev: 148000000, cost: 116000000, bb: 12000000, tx: 22, units: 28 },
        { key: `${curYear}-02`, rev: 185000000, cost: 144000000, bb: 15000000, tx: 30, units: 37 },
        { key: `${curYear}-03`, rev: 215000000, cost: 168000000, bb: 18000000, tx: 36, units: 44 },
        { key: `${curYear}-04`, rev: 198000000, cost: 152000000, bb: 14000000, tx: 32, units: 39 },
        { key: `${curYear}-05`, rev: 245000000, cost: 188000000, bb: 22000000, tx: 41, units: 50 },
        { key: `${curYear}-06`, rev: 280000000, cost: 214000000, bb: 25000000, tx: 48, units: 58 },
        { key: `${curYear}-07`, rev: 315000000, cost: 238000000, bb: 28000000, tx: 55, units: 66 },
      ];

      return demoMonths.map((dm, idx) => {
        const [yStr, mStr] = dm.key.split("-");
        const year = parseInt(yStr, 10);
        const monthIndex = parseInt(mStr, 10) - 1;
        const grossProfit = dm.rev - dm.cost;
        const netProfit = grossProfit - dm.bb;
        const prevRev = idx > 0 ? demoMonths[idx - 1].rev : dm.rev;
        const momGrowthPercent = idx > 0 ? Number((((dm.rev - prevRev) / prevRev) * 100).toFixed(1)) : 0;
        const aov = dm.tx > 0 ? Math.round(dm.rev / dm.tx) : 0;

        return {
          monthKey: dm.key,
          year,
          monthIndex,
          displayLabel: `${shortMonthNames[monthIndex]} '${String(year).slice(-2)}`,
          fullLabel: `${monthNames[monthIndex]} ${year}`,
          revenue: dm.rev,
          cost: dm.cost,
          buyback: dm.bb,
          grossProfit,
          netProfit,
          txCount: dm.tx,
          totalUnits: dm.units,
          momGrowthPercent,
          aov,
          target: initialMonthlyTarget,
          targetAchievement: Number(((dm.rev / initialMonthlyTarget) * 100).toFixed(1))
        };
      });
    }

    // Calculate profit, MoM growth, and AOV for sorted real records
    return sortedKeys.map((key, idx) => {
      const item = map[key];
      const grossProfit = item.revenue - item.cost;
      const netProfit = grossProfit - item.buyback;
      
      const prevKey = idx > 0 ? sortedKeys[idx - 1] : null;
      const prevRev = prevKey ? map[prevKey].revenue : item.revenue;
      const momGrowthPercent = prevKey && prevRev > 0
        ? Number((((item.revenue - prevRev) / prevRev) * 100).toFixed(1))
        : 0;

      const aov = item.txCount > 0 ? Math.round(item.revenue / item.txCount) : 0;
      const targetAchievement = initialMonthlyTarget > 0 
        ? Number(((item.revenue / initialMonthlyTarget) * 100).toFixed(1))
        : 0;

      return {
        ...item,
        grossProfit,
        netProfit,
        momGrowthPercent,
        aov,
        target: initialMonthlyTarget,
        targetAchievement
      };
    });
  }, [transactions, buybacks, products, initialMonthlyTarget]);

  // Filter based on selected period
  const filteredData = useMemo(() => {
    if (selectedPeriod === "last6") {
      return rawMonthlyData.slice(-6);
    }
    if (selectedPeriod === "last12") {
      return rawMonthlyData.slice(-12);
    }
    if (selectedPeriod === "currentYear") {
      const curYear = new Date().getFullYear();
      const currentYearData = rawMonthlyData.filter(d => d.year === curYear);
      return currentYearData.length > 0 ? currentYearData : rawMonthlyData;
    }
    return rawMonthlyData;
  }, [rawMonthlyData, selectedPeriod]);

  // Aggregate Key Performance Indicators
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalRevenue: 0,
        avgMonthlyRevenue: 0,
        totalNetProfit: 0,
        totalTransactions: 0,
        bestMonth: null,
        lowestMonth: null,
        avgMomGrowth: 0,
        latestMomGrowth: 0,
        avgAov: 0,
        runRateNextMonth: 0
      };
    }

    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalNetProfit = filteredData.reduce((acc, curr) => acc + curr.netProfit, 0);
    const totalTransactions = filteredData.reduce((acc, curr) => acc + curr.txCount, 0);
    const avgMonthlyRevenue = Math.round(totalRevenue / filteredData.length);

    let bestMonth = filteredData[0];
    let lowestMonth = filteredData[0];

    filteredData.forEach(d => {
      if (d.revenue > bestMonth.revenue) bestMonth = d;
      if (d.revenue < lowestMonth.revenue) lowestMonth = d;
    });

    const momList = filteredData.filter((_, idx) => idx > 0).map(d => d.momGrowthPercent);
    const avgMomGrowth = momList.length > 0
      ? Number((momList.reduce((a, b) => a + b, 0) / momList.length).toFixed(1))
      : 0;

    const latestMonth = filteredData[filteredData.length - 1];
    const latestMomGrowth = latestMonth ? latestMonth.momGrowthPercent : 0;
    const avgAov = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // Projected next month revenue based on recent momentum
    const runRateNextMonth = Math.round(
      latestMonth ? latestMonth.revenue * (1 + (latestMomGrowth > -50 && latestMomGrowth < 100 ? latestMomGrowth / 100 : 0.05)) : avgMonthlyRevenue
    );

    return {
      totalRevenue,
      avgMonthlyRevenue,
      totalNetProfit,
      totalTransactions,
      bestMonth,
      lowestMonth,
      avgMomGrowth,
      latestMomGrowth,
      avgAov,
      runRateNextMonth
    };
  }, [filteredData]);

  // Formatter for Rupiah Currency
  const formatRupiah = (val: number) => {
    return `Rp ${(val || 0).toLocaleString("id-ID")}`;
  };

  const formatShortRupiah = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}M`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Jt`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}Rb`;
    return `${val}`;
  };

  return (
    <div id="monthly-revenue-trend-component" className="space-y-6">
      {/* Component Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Trend Pendapatan Bulanan
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Recharts Visualizer
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monitoring performa penjualan kotor, margin keuntungan bersih, dan laju pertumbuhan Month-over-Month (MoM).
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {[
              { id: "all", label: "Semua" },
              { id: "last6", label: "6 Bulan" },
              { id: "last12", label: "12 Bulan" },
              { id: "currentYear", label: "Tahun Ini" }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedPeriod === p.id
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setChartViewType("area")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                chartViewType === "area"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
              }`}
              title="Grafik Area Fluktuasi"
            >
              <Activity className="h-3.5 w-3.5" /> Area
            </button>
            <button
              onClick={() => setChartViewType("bar")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                chartViewType === "bar"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
              }`}
              title="Grafik Batang Perbandingan"
            >
              <BarChart3 className="h-3.5 w-3.5" /> Batang
            </button>
            <button
              onClick={() => setChartViewType("composed")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                chartViewType === "composed"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
              }`}
              title="Grafik Gabungan (Composed)"
            >
              <Layers className="h-3.5 w-3.5" /> Multi-Layer
            </button>
          </div>

          {/* Toggle Target Line */}
          <button
            onClick={() => setShowTargetLine(!showTargetLine)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showTargetLine
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            }`}
            title="Tampilkan / Sembunyikan Garis Target Bulanan"
          >
            <Target className="h-3.5 w-3.5" />
            Target: {formatShortRupiah(monthlyTarget)}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Total Pendapatan Terakumulasi
            </span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {formatRupiah(stats.totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Rata-rata:</span>
            <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(stats.avgMonthlyRevenue)} / bln</strong>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Total Laba Bersih (Net Profit)
            </span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatRupiah(stats.totalNetProfit)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Margin Bersih:</span>
            <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
              {stats.totalRevenue > 0 ? ((stats.totalNetProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%
            </strong>
          </div>
        </div>

        {/* MoM Growth Momentum */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Pertumbuhan MoM Terakhir
            </span>
            <div className={`p-1.5 rounded-lg ${stats.latestMomGrowth >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {stats.latestMomGrowth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className={`text-xl font-black ${stats.latestMomGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {stats.latestMomGrowth >= 0 ? `+${stats.latestMomGrowth}%` : `${stats.latestMomGrowth}%`}
            </p>
            <span className="text-[10px] text-slate-400 font-semibold">vs bln lalu</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Rata-rata MoM:</span>
            <strong className={stats.avgMomGrowth >= 0 ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
              {stats.avgMomGrowth >= 0 ? `+${stats.avgMomGrowth}%` : `${stats.avgMomGrowth}%`}
            </strong>
          </div>
        </div>

        {/* Bulan Terbaik & Proyeksi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Performa Puncak (Peak Month)
            </span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-2">
            {stats.bestMonth ? stats.bestMonth.fullLabel : "-"}
          </p>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {stats.bestMonth ? formatRupiah(stats.bestMonth.revenue) : "Rp 0"}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
            <span>Proyeksi bln depan:</span>
            <strong className="text-slate-800 dark:text-slate-200">{formatShortRupiah(stats.runRateNextMonth)}</strong>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualizer Canvas */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Chart Header Title & Legend Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
              Kurva Trend Pendapatan & Profitabilitas Bulanan
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Menampilkan {filteredData.length} bulan data penjualan retail FonePOS dengan tren laba bersih dan target penjualan.
            </p>
          </div>

          {/* Quick Legend Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50/80 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span className="text-indigo-900 dark:text-indigo-200">Pendapatan Omset</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50/80 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-900 dark:text-emerald-200">Laba Bersih</span>
            </div>
            {showTargetLine && (
              <div className="flex items-center gap-1.5 text-xs font-bold bg-rose-50/80 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-900/50">
                <span className="w-2.5 h-0.5 bg-rose-500"></span>
                <span className="text-rose-900 dark:text-rose-200">Target ({formatShortRupiah(monthlyTarget)})</span>
              </div>
            )}
          </div>
        </div>

        {/* Responsive Recharts Canvas */}
        <div className="h-[360px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewType === "area" ? (
              <AreaChart data={filteredData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={formatShortRupiah}
                  axisLine={false}
                />
                <RechartsTooltip
                  formatter={(value: any, name: any) => [
                    formatRupiah(Number(value || 0)),
                    name === "revenue" ? "Pendapatan Omset" : name === "netProfit" ? "Laba Bersih" : name === "cost" ? "HPP Pengadaan" : name
                  ]}
                  labelFormatter={label => `Bulan: ${label}`}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "14px",
                    color: "#f8fafc",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  formatter={val => (
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {val === "revenue" ? "Pendapatan Omset Bulanan" : val === "netProfit" ? "Laba Bersih Usaha" : val}
                    </span>
                  )}
                />
                {showTargetLine && (
                  <ReferenceLine
                    y={monthlyTarget}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `Target: ${formatShortRupiah(monthlyTarget)}`,
                      fill: "#e11d48",
                      fontSize: 10,
                      fontWeight: "bold",
                      position: "insideTopRight"
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaRevenueGrad)"
                  dot={{ r: 4, fill: "#4f46e5" }}
                  activeDot={{ r: 7 }}
                />
                <Area
                  type="monotone"
                  dataKey="netProfit"
                  name="netProfit"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaProfitGrad)"
                  dot={{ r: 4, fill: "#059669" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            ) : chartViewType === "bar" ? (
              <BarChart data={filteredData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }} barGap={8}>
                <defs>
                  <linearGradient id="barRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity={0.85} />
                  </linearGradient>
                  <linearGradient id="barProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={formatShortRupiah}
                  axisLine={false}
                />
                <RechartsTooltip
                  formatter={(value: any, name: any) => [
                    formatRupiah(Number(value || 0)),
                    name === "revenue" ? "Pendapatan Omset" : name === "netProfit" ? "Laba Bersih" : name === "cost" ? "HPP Pengadaan" : name
                  ]}
                  labelFormatter={label => `Bulan: ${label}`}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "14px",
                    color: "#f8fafc",
                    fontSize: "12px"
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  formatter={val => (
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {val === "revenue" ? "Pendapatan Omset Bulanan" : val === "netProfit" ? "Laba Bersih" : val}
                    </span>
                  )}
                />
                {showTargetLine && (
                  <ReferenceLine
                    y={monthlyTarget}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `Target: ${formatShortRupiah(monthlyTarget)}`,
                      fill: "#e11d48",
                      fontSize: 10,
                      fontWeight: "bold",
                      position: "insideTopRight"
                    }}
                  />
                )}
                <Bar
                  dataKey="revenue"
                  name="revenue"
                  fill="url(#barRevGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="netProfit"
                  name="netProfit"
                  fill="url(#barProfitGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            ) : (
              <ComposedChart data={filteredData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="compAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={formatShortRupiah}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  tickFormatter={val => `${val} tx`}
                  axisLine={false}
                />
                <RechartsTooltip
                  formatter={(value: any, name: any) => [
                    name === "txCount" ? `${value} Transaksi` : formatRupiah(Number(value || 0)),
                    name === "revenue" ? "Pendapatan Omset" : name === "netProfit" ? "Laba Bersih" : name === "txCount" ? "Jumlah Transaksi" : name
                  ]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "14px",
                    color: "#f8fafc",
                    fontSize: "12px"
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                {showTargetLine && (
                  <ReferenceLine
                    yAxisId="left"
                    y={monthlyTarget}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: `Target: ${formatShortRupiah(monthlyTarget)}`,
                      fill: "#e11d48",
                      fontSize: 10,
                      fontWeight: "bold",
                      position: "insideTopRight"
                    }}
                  />
                )}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Pendapatan (IDR)"
                  fill="url(#compAreaGrad)"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                />
                <Bar
                  yAxisId="left"
                  dataKey="netProfit"
                  name="Laba Bersih (IDR)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="txCount"
                  name="Volume Transaksi"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f59e0b" }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Insight Bottom Callout */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
            <Info className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>
              Target bulanan saat ini disetel pada <strong className="text-slate-900 dark:text-white">{formatRupiah(monthlyTarget)}</strong>.
              {stats.bestMonth && stats.bestMonth.revenue >= monthlyTarget && (
                <span className="text-emerald-600 font-bold ml-1">
                  (Target tercapai pada {stats.bestMonth.fullLabel})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Ubah Target Bulanan:</span>
            <input
              type="number"
              value={monthlyTarget}
              onChange={e => setMonthlyTarget(Number(e.target.value) || 0)}
              step={10000000}
              min={10000000}
              className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Tabel Rincian Kinerja Penjualan Bulanan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daftar historis omset, pengadaan HPP, beban buyback, dan margin laba bersih per bulan.
            </p>
          </div>
          <button
            onClick={() => setShowDataTable(!showDataTable)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {showDataTable ? "Sembunyikan Tabel [-]" : "Tampilkan Tabel [+]"}
          </button>
        </div>

        {showDataTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5">Periode Bulan</th>
                  <th className="p-3.5 text-center">Transaksi</th>
                  <th className="p-3.5 text-center">Unit Terjual</th>
                  <th className="p-3.5 text-right">Pendapatan Omset</th>
                  <th className="p-3.5 text-right">HPP & Pengadaan</th>
                  <th className="p-3.5 text-right">Beban Buyback</th>
                  <th className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">Laba Bersih</th>
                  <th className="p-3.5 text-center">MoM Growth</th>
                  <th className="p-3.5 text-center">Pencapaian Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredData.map((item, idx) => {
                  const isAchieved = item.revenue >= monthlyTarget;
                  const isGrowthPositive = item.momGrowthPercent >= 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                        {item.fullLabel}
                      </td>
                      <td className="p-3.5 text-center text-slate-600 dark:text-slate-400">
                        {item.txCount} tx
                      </td>
                      <td className="p-3.5 text-center text-slate-600 dark:text-slate-400">
                        {item.totalUnits} unit
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
                        {formatRupiah(item.revenue)}
                      </td>
                      <td className="p-3.5 text-right text-slate-600 dark:text-slate-400">
                        {formatRupiah(item.cost)}
                      </td>
                      <td className="p-3.5 text-right text-amber-600 dark:text-amber-400">
                        {formatRupiah(item.buyback)}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                        {formatRupiah(item.netProfit)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isGrowthPositive
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {isGrowthPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {isGrowthPositive ? `+${item.momGrowthPercent}%` : `${item.momGrowthPercent}%`}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAchieved
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {isAchieved && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                          {item.targetAchievement}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
