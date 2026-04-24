"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  FiCalendar, 
  FiPlus, 
  FiCopy, 
  FiFolder, 
  FiSave, 
  FiTrash2,
  FiPieChart,
  FiDollarSign,
  FiActivity,
  FiChevronRight
} from "react-icons/fi";

interface CategoryBudgets {
  food: number;
  travel: number;
  bills: number;
  shopping: number;
  entertainment: number;
  others: number;
}

interface Plan {
  _id?: string;
  month: string;
  totalBudget: number;
  categoryBudgets: CategoryBudgets;
  createdAt?: string;
  updatedAt?: string;
}

export default function PlanMonth() {
  const router = useRouter();
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM (editing/active month)
  const categories = useMemo(() => ["food", "travel", "bills", "shopping", "entertainment", "others"], []);
  const [totalBudget, setTotalBudget] = useState<number | "">("");
  const [catBudgets, setCatBudgets] = useState<Record<string, number | "">>(() => {
    const obj: Record<string, number | ""> = {};
    ["food", "travel", "bills", "shopping", "entertainment", "others"].forEach((c) => (obj[c] = ""));
    return obj;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null);
  const [copySource, setCopySource] = useState<string>("");

  // Get JWT token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Shared function to fetch all plans
  const fetchAllPlans = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('/api/plan-months', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  }, []);

  // Load all plans on component mount
  useEffect(() => {
    fetchAllPlans();
  }, [fetchAllPlans]);

  // Load specific plan when month changes
  useEffect(() => {
    const fetchPlanByMonth = async (monthToFetch: string) => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`/api/plan-month/${monthToFetch}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const plan = data.plan;
          setTotalBudget(plan.totalBudget);
          setCatBudgets(plan.categoryBudgets || {});
        } else {
          // Plan doesn't exist for this month, reset form
          setTotalBudget("");
          setCatBudgets(() => {
            const obj: Record<string, number | ""> = {};
            categories.forEach((c) => (obj[c] = ""));
            return obj;
          });
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      }
    };

    fetchPlanByMonth(month);
  }, [month, categories]);

  const sumCat = useMemo(() => {
    return categories.reduce((s, c) => s + (Number(catBudgets[c] || 0) || 0), 0);
  }, [catBudgets, categories]);

  function updateCat(c: string, v: string) {
    const num = v === "" ? "" : Number(v);
    setCatBudgets((prev) => ({ ...prev, [c]: num }));
  }

  async function handleSave() {
    setError(null);
    if (totalBudget === "" || Number(totalBudget) <= 0) {
      setError("Please enter a valid total budget.");
      return;
    }
    if (sumCat > Number(totalBudget)) {
      setError("Category budgets total exceeds overall budget.");
      return;
    }

    setSaving(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please login to save plans");
        setSaving(false);
        return;
      }

      const categoryBudgets: CategoryBudgets = {
        food: Number(catBudgets.food || 0),
        travel: Number(catBudgets.travel || 0),
        bills: Number(catBudgets.bills || 0),
        shopping: Number(catBudgets.shopping || 0),
        entertainment: Number(catBudgets.entertainment || 0),
        others: Number(catBudgets.others || 0),
      };

      const response = await fetch('/api/plan-month', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month,
          totalBudget: Number(totalBudget),
          categoryBudgets,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Plan saved:', data.message);
        // Refresh the plans list
        await fetchAllPlans();
        setTimeout(() => {
          setSaving(false);
          router.push('/dashboard');
        }, 600);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save plan');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      setError('Failed to save plan');
      setSaving(false);
    }
  }

  function loadPlanIntoEditor(m: string) {
    setMonth(m);
    setActiveSidebar(m);
    // fetchPlanByMonth will be called automatically by useEffect when month changes
  }

  async function handleDeletePlan() {
    // confirm deletion
    if (!confirm(`Delete plan for ${new Date(month + "-01").toLocaleString(undefined, { month: 'long', year: 'numeric' })}? This cannot be undone.`)) return;
    
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please login to delete plans");
        return;
      }

      const response = await fetch(`/api/plan-month/${month}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh the plans list
        await fetchAllPlans();
        
        // clear editor and active selection
        const today = new Date().toISOString().slice(0, 7);
        setMonth(today);
        setTotalBudget("");
        setCatBudgets(() => {
          const o: Record<string, number | ""> = {};
          categories.forEach((c) => (o[c] = ""));
          return o;
        });
        setActiveSidebar(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      setError('Failed to delete plan');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/30 flex items-center justify-center text-white text-2xl font-bold tracking-tighter ring-4 ring-teal-50">
              <FiCalendar />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Plan your month</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Set an overall spending target and split it across categories efficiently.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <aside className="hidden md:block md:col-span-1">
            <div className="sticky top-6">
              <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <FiFolder className="text-teal-600" size={18} />
                  <h4 className="text-base font-bold text-slate-800">Saved plans</h4>
                </div>
                
                <div className="space-y-3">
                  <button onClick={() => {
                    const today = new Date().toISOString().slice(0,7);
                    setMonth(today);
                    setTotalBudget("");
                    setCatBudgets(() => {
                      const o: Record<string, number | ""> = {};
                      categories.forEach(c => (o[c] = ""));
                      return o;
                    });
                    setActiveSidebar(null);
                  }} 
                  className={`w-full flex items-center gap-2 text-left px-4 py-3 rounded-xl font-semibold transition-all ${activeSidebar === null ? 'bg-slate-100 text-teal-700 border border-slate-200' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'}`}>
                    <FiPlus /> New Plan
                  </button>
                  
                  {/* Copy UI shown when New plan is active */}
                  {activeSidebar === null && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1"><FiCopy /> Copy existing</label>
                      <div className="flex flex-col gap-2">
                        <select 
                          value={copySource} 
                          onChange={(e) => setCopySource(e.target.value)} 
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                        >
                          <option value="">Select month</option>
                          {savedPlans.map((p) => (
                            <option key={p.month} value={p.month}>{new Date(p.month + "-01").toLocaleString(undefined, { month: 'short', year: 'numeric' })} — ₹ {p.totalBudget.toLocaleString()}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => {
                            if (!copySource) return;
                            const sourcePlan = savedPlans.find(p => p.month === copySource);
                            if (sourcePlan) {
                              setTotalBudget(sourcePlan.totalBudget);
                              setCatBudgets({
                                food: sourcePlan.categoryBudgets?.food || "",
                                travel: sourcePlan.categoryBudgets?.travel || "",
                                bills: sourcePlan.categoryBudgets?.bills || "",
                                shopping: sourcePlan.categoryBudgets?.shopping || "",
                                entertainment: sourcePlan.categoryBudgets?.entertainment || "",
                                others: sourcePlan.categoryBudgets?.others || "",
                              });
                              setActiveSidebar(null);
                            }
                          }} 
                          className={`w-full px-3 py-2 rounded-xl text-sm font-bold transition-all ${!copySource ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md flex items-center justify-center gap-2'}`} 
                          disabled={!copySource}
                        >
                          Load Template
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {savedPlans.length === 0 && <div className="text-sm font-medium text-slate-400 p-4text-center bg-slate-50 rounded-xl mt-4">No saved plans yet.</div>}
                  
                  <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-1">
                    {savedPlans.map((p) => (
                      <button 
                        key={p.month} 
                        onClick={() => loadPlanIntoEditor(p.month)} 
                        className={`w-full group text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${activeSidebar === p.month ? 'bg-teal-50/50 border-teal-300 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                      >
                        <div>
                          <div className={`text-sm font-bold ${activeSidebar === p.month ? 'text-teal-800' : 'text-slate-700'}`}>
                            {new Date(p.month + "-01").toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">₹ {p.totalBudget.toLocaleString()}</div>
                        </div>
                        <FiChevronRight className={`text-xl transition-transform ${activeSidebar === p.month ? 'text-teal-600' : 'text-slate-300 group-hover:translate-x-1 group-hover:text-slate-500'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main editor */}
          <section className="md:col-span-3 space-y-8">
            <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1"><FiCalendar /> Month Selection</label>
                  <input 
                    type="month" 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all shadow-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1"><FiDollarSign /> Total Budget (INR)</label>
                  <input 
                    type="number" 
                    value={typeof totalBudget === 'number' ? totalBudget : ''} 
                    onChange={(e) => setTotalBudget(e.target.value === "" ? "" : Number(e.target.value))} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white outline-none transition-all shadow-sm" 
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>
            </div>
            
            <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2"><FiPieChart className="text-teal-500" /> Category Budgets</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Distribute your total budget across categories.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right min-w-[200px]">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Remaining Budget</div>
                  <div className={`text-2xl font-extrabold mt-1 ${sumCat > Number(totalBudget) ? 'text-red-500' : 'text-slate-800'}`}>
                    ₹ {totalBudget === "" ? 0 : Math.max(0, Number(totalBudget) - sumCat).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden mb-8">
                <div className="absolute right-0 bottom-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currently Allocated</div>
                    <div className="text-3xl font-extrabold text-white mt-1">₹ {sumCat.toLocaleString()}</div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => {
                      if (totalBudget === "" || Number(totalBudget) <= 0) return;
                      const per = Math.floor(Number(totalBudget) / categories.length);
                      const next: Record<string, number | ""> = {};
                      categories.forEach((c) => (next[c] = per));
                      setCatBudgets(next);
                    }} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-teal-100 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all backdrop-blur-sm">
                      Evenly Distribute
                    </button>
                    <button onClick={() => {
                      if (totalBudget === "" || Number(totalBudget) <= 0) return;
                      const t = Number(totalBudget);
                      const next: Record<string, number | ""> = {};
                      const weights: Record<string, number> = { 
                        food: 0.25, travel: 0.15, bills: 0.2, shopping: 0.15, entertainment: 0.15, others: 0.1 
                      };
                      categories.forEach((c) => (next[c] = Math.round((weights[c] || 0.1) * t)));
                      setCatBudgets(next);
                    }} className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-[0_0_15px_rgba(45,212,191,0.4)] transition-all">
                      <FiActivity className="inline mr-1" /> Auto-Distribute
                    </button>
                  </div>
                </div>

                <div className="w-full relative z-10">
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${sumCat > Number(totalBudget) ? 'bg-red-500' : 'bg-gradient-to-r from-teal-500 to-blue-500'}`} 
                      style={{ width: `${totalBudget === "" ? 0 : Math.min(100, (sumCat / Number(totalBudget)) * 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs font-bold text-slate-400">
                    <span>0%</span>
                    <span>{totalBudget === "" ? 0 : Math.round((sumCat / Number(totalBudget)) * 100)}% allocated</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((c, index) => {
                  const categoryLabel = ["Food", "Travel", "Bills", "Shopping", "Entertainment", "Others"][index];
                  const val = typeof catBudgets[c] === 'number' ? catBudgets[c] : 0;
                  const pct = totalBudget === "" || Number(totalBudget) === 0 ? 0 : Math.round((val / Number(totalBudget)) * 100);
                  
                  return (
                    <div key={c} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col xl:flex-row items-center justify-between gap-4 group hover:border-teal-300 transition-colors">
                      <div className="flex-1 w-full">
                        <div className="flex items-center justify-between xl:justify-start gap-3">
                          <div className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors uppercase tracking-wide">{categoryLabel}</div>
                          <div className="text-xs font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{pct}%</div>
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-1">Suggested: ₹ {Math.round((Number(totalBudget || 0) * 0.15))}</div>
                      </div>
                      <div className="w-full xl:w-40 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 pointer-events-none">₹</span>
                        <input 
                          type="number" 
                          value={typeof catBudgets[c] === 'number' ? catBudgets[c] : ''} 
                          onChange={(e) => updateCat(c, e.target.value)} 
                          className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow shadow-sm" 
                          placeholder="0"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm font-bold animate-pulse">
                  <FiActivity size={18} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 transform hover:-translate-y-0.5 transition-all outline-none"
                >
                  <FiSave size={18} />
                  {saving ? 'Saving...' : 'Save Plan'}
                </button>
                
                {(() => {
                  const hasPlan = savedPlans.some((p) => p.month === month);
                  return (
                    <button 
                      onClick={handleDeletePlan} 
                      disabled={!hasPlan} 
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold border transition-all inline-flex justify-center items-center gap-2 outline-none ${hasPlan ? 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' : 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50'}`}
                    >
                      <FiTrash2 size={18} />
                      Delete
                    </button>
                  );
                })()}
              </div>
            </div>
            
          </section>
        </div>
      </main>
    </div>
  );
}
