"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { 
  FiPieChart, 
  FiTrendingDown, 
  FiZap, 
  FiPlus, 
  FiCalendar,
  FiShoppingBag,
  FiCoffee,
  FiMapPin,
  FiActivity,
  FiMonitor,
  FiDownload,
  FiUpload,
  FiSettings,
  FiTrendingUp,
  FiRefreshCw
} from "react-icons/fi";

const categoryIconMap: Record<string, any> = {
  Food: FiCoffee,
  Travel: FiMapPin,
  Bills: FiActivity,
  Shopping: FiShoppingBag,
  Entertainment: FiMonitor,
  Others: FiPieChart
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#0d9488", // teal-600
  Travel: "#3b82f6", // blue-500
  Bills: "#ea580c", // orange-600
  Shopping: "#8b5cf6", // violet-500
  Entertainment: "#ec4899", // pink-500
  Others: "#64748b", // slate-500
};

interface Expense {
  _id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  notes?: string;
  recurring: boolean;
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const event = new Event("userAuthenticated");
      window.dispatchEvent(event);
      fetchDashboardData(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchDashboardData = async (token: string) => {
    try {
      const [expenseRes, planRes] = await Promise.all([
        fetch('/api/expenses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/plan-months', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (expenseRes.ok) {
        const data = await expenseRes.json();
        setExpenses(data.expenses || []);
      }
      if (planRes.ok) {
        const data = await planRes.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch AI Insight when current month data changes
  useEffect(() => {
    if (expenses.length > 0 && topCategory !== "None" && !aiInsight && !isInsightLoading) {
      generateAIInsight();
    }
  }, [expenses, selectedMonth]);

  const generateAIInsight = async () => {
    setIsInsightLoading(true);
    try {
      const prompt = `Based on my spending this month, my top expense category is ${topCategory} with ₹${monthTotal.toLocaleString()} total spent. Give me one very specific, short, professional financial tip to save money next month.`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.response);
      }
    } catch (e) {
      console.error("AI Insight error:", e);
    } finally {
      setIsInsightLoading(false);
    }
  };

  // Group expenses by month (YYYY-MM)
  const groupedData = useMemo(() => {
    const data: Record<string, { total: number; categories: Record<string, number>; recent: Expense[], raw: Expense[] }> = {};
    
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedExpenses.forEach(exp => {
      const monthKey = exp.date.substring(0, 7);
      if (!data[monthKey]) {
        data[monthKey] = {
          total: 0,
          categories: { Food: 0, Travel: 0, Bills: 0, Shopping: 0, Entertainment: 0, Others: 0 },
          recent: [],
          raw: []
        };
      }
      
      data[monthKey].total += exp.amount;
      const cat = data[monthKey].categories[exp.category] !== undefined ? exp.category : 'Others';
      data[monthKey].categories[cat] += exp.amount;
      data[monthKey].raw.push(exp);
      
      if (data[monthKey].recent.length < 5) {
        data[monthKey].recent.push(exp);
      }
    });

    return data;
  }, [expenses]);

  const availableMonths = useMemo(() => {
    const months = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0]);
    }
    return months;
  }, [groupedData, selectedMonth]);

  const currentMonthKey = selectedMonth || new Date().toISOString().substring(0, 7);
  const monthData = groupedData[currentMonthKey] || {
    total: 0,
    categories: { Food: 0, Travel: 0, Bills: 0, Shopping: 0, Entertainment: 0, Others: 0 },
    recent: [],
    raw: []
  };

  const monthTotal = monthData.total;
  
  const categoriesList = Object.entries(monthData.categories)
    .map(([name, amount]) => ({
      name,
      amount,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Others']
    }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoriesList[0]?.name || "None";
  const savingsEst = monthTotal > 0 ? Math.round(monthTotal * 0.1) : 0; 
  
  const prevMonthDate = new Date(`${currentMonthKey}-01`);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthKey = prevMonthDate.toISOString().substring(0, 7);
  const prevMonthTotal = groupedData[prevMonthKey]?.total || 0;
  
  let changePercent = 0;
  if (prevMonthTotal > 0) {
    changePercent = Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100);
  } else if (monthTotal > 0) {
    changePercent = 100;
  }

  // --- Visual Analytics Data Preparation ---
  
  // 1. Weekly Trend (Daily spending for the month)
  const trendData = useMemo(() => {
    const daysInMonth = new Date(parseInt(currentMonthKey.split('-')[0]), parseInt(currentMonthKey.split('-')[1]), 0).getDate();
    const map: Record<string, number> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      map[i.toString().padStart(2, '0')] = 0;
    }
    monthData.raw.forEach(exp => {
      const day = exp.date.split('-')[2];
      if (map[day] !== undefined) map[day] += exp.amount;
    });
    return Object.keys(map).map(day => ({ day, amount: map[day] }));
  }, [monthData, currentMonthKey]);

  // 2. Spending Mood (Weekday vs Weekend)
  const moodData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    monthData.raw.forEach(exp => {
      const dayOfWeek = new Date(exp.date).getDay();
      map[days[dayOfWeek]] += exp.amount;
    });
    return Object.keys(map).map(day => ({ day, amount: map[day] }));
  }, [monthData]);

  // 3. Budget vs Actual Comparison
  const budgetVsActualData = useMemo(() => {
    const currentPlan = plans.find(p => p.month === currentMonthKey);
    if (!currentPlan) return [];

    const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Entertainment', 'Others'];
    return categories.map(cat => {
      const budgetKey = cat.toLowerCase() as keyof typeof currentPlan.categoryBudgets;
      return {
        category: cat,
        budget: currentPlan.categoryBudgets[budgetKey] || 0,
        actual: monthData.categories[cat] || 0
      };
    }).filter(d => d.budget > 0 || d.actual > 0);
  }, [plans, currentMonthKey, monthData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200 pb-20">
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/30 flex items-center justify-center text-white text-xl font-bold tracking-tighter ring-4 ring-teal-50">
              FS
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Visual Analytics</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Your interactive financial snapshot.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer hover:bg-slate-50"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{new Date(`${m}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
                ))}
                {availableMonths.length === 0 && <option value={currentMonthKey}>{new Date(`${currentMonthKey}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}</option>}
              </select>
              <FiCalendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <Link href="/dashboard/addexpense" className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-teal-500/20 transform hover:-translate-y-0.5 transition-all text-sm">
              <FiPlus strokeWidth={3} /> Add expense
            </Link>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 mb-10">
            <div className="w-20 h-20 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiTrendingUp size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Unlock Advanced Analytics</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">Start tracking your spending to see beautiful charts, heat maps, and AI-driven insights about your financial habits.</p>
            <Link href="/dashboard/addexpense" className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/30 transition-all">
              <FiPlus strokeWidth={3} /> Import or Add Data
            </Link>
          </div>
        ) : (
          <>
            {/* Fancy KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="relative overflow-hidden rounded-3xl p-8 shadow-xl bg-gradient-to-br from-teal-600 to-teal-400 group">
                <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                  <FiPieChart size={120} />
                </div>
                <div className="relative z-10 text-white">
                  <div className="flex items-center gap-2 text-teal-50 font-semibold tracking-wide uppercase text-xs mb-2">Total spent</div>
                  <div className="text-4xl font-extrabold tracking-tight mb-2">₹ {monthTotal.toLocaleString()}</div>
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium">
                    <FiTrendingDown className={changePercent > 0 ? "rotate-180" : ""} />
                    <span><span className="font-bold">{changePercent > 0 ? '+' : ''}{changePercent}%</span> vs last month</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl p-8 shadow-sm bg-white border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Avg Category Spend</div>
                    <div className="text-3xl font-extrabold text-slate-800">
                      ₹ {categoriesList.length > 0 ? Math.round(monthTotal / categoriesList.length).toLocaleString() : 0}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FiActivity size={20} />
                  </div>
                </div>
                <div className="mt-6">
                   <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                     <span>Top: {topCategory}</span>
                   </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500" style={{ width: `${Math.min(100, ((categoriesList[0]?.amount || 0) / (monthTotal || 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl p-8 shadow-sm bg-white border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 text-green-50 opacity-50"><FiZap size={150} /></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Projected Savings</div>
                      <div className="text-3xl font-extrabold text-slate-800">₹ {savingsEst.toLocaleString()}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                      <FiTrendingDown size={20} />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                     <div className="text-sm font-medium text-slate-500">Based on recent trends</div>
                     <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Target</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Category Heat Map (Donut) */}
              <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm flex flex-col">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Category Heat Map</h3>
                    <p className="text-sm text-slate-500 mt-1">Interactive breakdown of where your money goes.</p>
                 </div>
                 {monthTotal > 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                     <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={categoriesList}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="amount"
                            stroke="none"
                          >
                            {categoriesList.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => `₹ ${Number(value).toLocaleString()}`}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                          />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="flex flex-wrap justify-center gap-4 mt-2">
                        {categoriesList.map(c => (
                           <div key={c.name} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></span>
                              {c.name} ({Math.round((c.amount/monthTotal)*100)}%)
                           </div>
                        ))}
                     </div>
                   </div>
                 ) : (
                   <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">No data to display</div>
                 )}
              </div>

              {/* Weekly Trend (Area Chart) */}
              <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm flex flex-col">
                 <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Daily Spending Trend</h3>
                    <p className="text-sm text-slate-500 mt-1">Identify spikes and patterns over the month.</p>
                 </div>
                 {monthTotal > 0 ? (
                   <div className="flex-1 min-h-[250px] -ml-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
                          <Tooltip 
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                             labelStyle={{ fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}
                             formatter={(value: any) => [`₹ ${Number(value).toLocaleString()}`, 'Spent']}
                          />
                          <Area type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, strokeWidth: 0, fill: '#0f766e' }} />
                        </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 ) : (
                   <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">No data to display</div>
                </div>
              </div>

              {/* Budget vs Actual (Bar Chart) */}
              <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm flex flex-col lg:col-span-2">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Budget vs Actual Comparison</h3>
                        <p className="text-sm text-slate-500 mt-1">See how well you are sticking to your planned limits.</p>
                    </div>
                    {budgetVsActualData.length === 0 && (
                      <Link href="/dashboard/planmonth" className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors">Set Budgets</Link>
                    )}
                 </div>
                 {budgetVsActualData.length > 0 ? (
                   <div className="flex-1 min-h-[300px] -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetVsActualData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={8}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
                          <Tooltip 
                             cursor={{ fill: '#f8fafc' }}
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="budget" name="Planned Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={35} />
                          <Bar dataKey="actual" name="Actual Spent" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={35} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                      <FiPieChart size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">No budgets set for this month.</p>
                      <Link href="/dashboard/planmonth" className="mt-4 text-sm font-bold text-teal-600 underline underline-offset-4">Configure Monthly Plan</Link>
                   </div>
                 )}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Spending Mood (Bar Chart) */}
              <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-100 p-8 shadow-sm flex flex-col">
                 <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Spending Mood (Weekday vs Weekend)</h3>
                    <p className="text-sm text-slate-500 mt-1">Discover which days you spend the most.</p>
                 </div>
                 {monthTotal > 0 ? (
                   <div className="flex-1 min-h-[250px] -ml-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={moodData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 'bold' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val}`} />
                          <Tooltip 
                             cursor={{ fill: '#f8fafc' }}
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                             formatter={(value: any) => [`₹ ${Number(value).toLocaleString()}`, 'Total Spent']}
                          />
                          <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                     </ResponsiveContainer>
                   </div>
                 ) : (
                   <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">No data to display</div>
                 )}
              </div>

              {/* Smart Suggestions & Actions */}
              <aside className="space-y-8">
                <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-800 p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg"><FiZap size={18} /></div>
                    <h4 className="text-lg font-bold text-white tracking-tight">Smart Suggestions</h4>
                  </div>
                  <p className="text-sm text-slate-400 mb-6 font-medium">AI-driven actions to save this month.</p>
                  
                  {aiInsight ? (
                    <div className="space-y-4 relative z-10">
                      <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                        <div className="text-sm font-medium text-teal-50 leading-relaxed italic">
                          "{aiInsight}"
                        </div>
                      </div>
                      <button onClick={generateAIInsight} className="text-[10px] uppercase tracking-widest font-bold text-teal-400 hover:text-white transition-colors flex items-center gap-1">
                         <FiRefreshCw className={isInsightLoading ? "animate-spin" : ""} /> Refresh Insight
                      </button>
                    </div>
                  ) : isInsightLoading ? (
                    <div className="flex flex-col gap-3 py-4">
                       <div className="h-4 bg-white/10 rounded-full w-full animate-pulse"></div>
                       <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 py-4">Add expenses to get personalized AI suggestions!</div>
                  )}
                </div>

                <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/dashboard/addexpense" className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all text-slate-700 hover:text-teal-600 group">
                      <FiPlus size={20} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-center">Add Expense</span>
                    </Link>
                    <Link href="/dashboard/addexpense" className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all text-slate-700 hover:text-teal-600 group">
                      <FiUpload size={20} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-center">Import CSV</span>
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
