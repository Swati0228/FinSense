"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { apiClient } from "@/utils/apiClient";
import Papa from "papaparse";
import { 
  FiDollarSign, 
  FiCalendar, 
  FiFileText, 
  FiSave, 
  FiX, 
  FiRefreshCw, 
  FiShoppingCart,
  FiShoppingBag,
  FiCoffee,
  FiMapPin,
  FiActivity,
  FiMonitor,
  FiPieChart,
  FiPlus,
  FiCheckCircle,
  FiUploadCloud,
  FiGlobe
} from "react-icons/fi";
import { SUPPORTED_CURRENCIES, convertToINR } from "@/utils/currency";

const API_BASE_URL = "";

const categoryIconMap: Record<string, any> = {
  Food: FiCoffee,
  Travel: FiMapPin,
  Bills: FiActivity,
  Shopping: FiShoppingBag,
  Entertainment: FiMonitor,
  Others: FiPieChart
};

// Simple auto-categorization engine for CSV parsing
function guessCategory(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('zomato') || desc.includes('swiggy') || desc.includes('starbucks') || desc.includes('cafe')) return 'Food';
  if (desc.includes('uber') || desc.includes('ola') || desc.includes('irctc') || desc.includes('flight') || desc.includes('indigo')) return 'Travel';
  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') || desc.includes('zara')) return 'Shopping';
  if (desc.includes('airtel') || desc.includes('jio') || desc.includes('electricity') || desc.includes('bill')) return 'Bills';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('pvr') || desc.includes('bookmyshow')) return 'Entertainment';
  return 'Others';
}

export default function AddExpense() {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("INR");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food");
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recurringExpenses, setRecurringExpenses] = useState<Array<{ _id: string; amount: number; merchant: string; category: string }>>([]);
  const [showPopup, setShowPopup] = useState(false);

  // CSV Import State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchRecurringExpenses() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await apiClient(`${API_BASE_URL}/api/recurringexpenses`, { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          setRecurringExpenses(data.recurringExpenses || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchRecurringExpenses();
  }, []);

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!amount || Number(amount) <= 0 || !merchant.trim() || !date || !category) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      let finalAmount = Number(amount);
      let finalNotes = notes;

      // Multi-Currency Conversion Logic
      const conversion = await convertToINR(Number(amount), currency, notes);
      const finalAmount = conversion.convertedAmount;
      const finalNotes = conversion.originalNotes;

      const payload = JSON.parse(atob(token!.split(".")[1]));
      
      const expenseData = {
        userId: payload.id,
        date,
        amount: finalAmount,
        merchant,
        category,
        notes: finalNotes,
        recurring,
      };

      await axios.post(`${API_BASE_URL}/api/addexpense`, expenseData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (recurring) {
        setRecurringExpenses(prev => [...prev, { _id: "temp", amount: finalAmount, merchant, category }]);
      }

      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);

      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      setMerchant("");
      setNotes("");
      setRecurring(false);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the expense.");
    } finally {
      setLoading(false);
    }
  }

  // --- CSV Handling Functions ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => {
          // Attempt to extract generic fields from common bank CSV headers
          const rawDate = row['Date'] || row['Value Date'] || row['Transaction Date'] || '';
          const rawDesc = row['Description'] || row['Narration'] || row['Particulars'] || row['Merchant'] || '';
          const rawAmount = row['Amount'] || row['Withdrawal'] || row['Debit'] || '0';

          const parsedAmount = Math.abs(parseFloat(String(rawAmount).replace(/,/g, '')));
          
          return {
            date: rawDate || new Date().toISOString().slice(0, 10),
            merchant: rawDesc || 'Unknown Merchant',
            amount: isNaN(parsedAmount) ? 0 : parsedAmount,
            category: guessCategory(rawDesc),
            notes: "Imported via CSV",
            recurring: false
          };
        }).filter(exp => exp.amount > 0); // Only keep valid deductions
        
        setCsvData(parsed);
        setShowCsvPreview(true);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const confirmCsvImport = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      await axios.post(`${API_BASE_URL}/api/addexpense/bulk`, { expenses: csvData }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setShowCsvPreview(false);
      setCsvData([]);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to import expenses.");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Food", "Travel", "Bills", "Shopping", "Entertainment", "Others"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-200/60">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-400 shadow-lg shadow-teal-500/30 flex items-center justify-center text-white text-2xl font-bold tracking-tighter ring-4 ring-teal-50">
              <FiPlus strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Add an Expense</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Log a single transaction or upload your bank statement.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
             <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all text-sm">
               <FiUploadCloud size={18} /> Import CSV Statement
             </button>
          </div>
        </div>

        {/* CSV Preview Section */}
        {showCsvPreview && (
          <div className="mb-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FiFileText className="text-teal-500" /> Preview Imported Data</h3>
                <button onClick={() => setShowCsvPreview(false)} className="text-slate-400 hover:text-slate-600"><FiX size={24} /></button>
             </div>
             
             <div className="overflow-x-auto mb-6 max-h-[300px] border border-slate-100 rounded-xl">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Merchant</th>
                      <th className="p-3">Category (Auto-Guessed)</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 text-sm font-medium text-slate-700">
                        <td className="p-3 whitespace-nowrap">{row.date}</td>
                        <td className="p-3">{row.merchant}</td>
                        <td className="p-3">
                           <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-xs">{row.category}</span>
                        </td>
                        <td className="p-3 text-right">₹{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
             
             <div className="flex items-center gap-4">
                <button onClick={confirmCsvImport} disabled={loading} className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-500 transition-colors">
                  {loading ? "Importing..." : `Confirm & Import ${csvData.length} Expenses`}
                </button>
                <button onClick={() => { setShowCsvPreview(false); setCsvData([]); }} className="text-slate-500 font-bold hover:text-slate-700">Cancel</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Main Form */}
          <section className="md:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 xl:p-10">
              <div className="mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2"><FiDollarSign className="text-teal-500" /> Single Transaction Details</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Multi-currency conversion is handled automatically.</p>
              </div>

              <form onSubmit={handleSingleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <FiGlobe /> Amount & Currency
                    </label>
                    <div className="relative flex shadow-sm rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-slate-100 px-3 py-3 border-r border-slate-200 text-slate-700 font-bold outline-none cursor-pointer max-w-[100px]"
                      >
                        {SUPPORTED_CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} ({curr.symbol})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-slate-50 text-xl font-extrabold text-slate-800 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <FiCalendar /> Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FiShoppingCart /> Merchant Name
                  </label>
                  <input
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g., BigMart, Uber, Amazon"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-1">
                    <FiPieChart /> Category Allocation
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {categories.map((c) => {
                      const Icon = categoryIconMap[c] || FiPieChart;
                      const isActive = category === c;
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setCategory(c)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${
                            isActive 
                              ? "bg-teal-600 text-white shadow-teal-500/30 scale-105" 
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Icon size={16} className={isActive ? "text-white" : "text-slate-400"} />
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FiFileText /> Additional Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Describe what you bought..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm resize-none"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm font-bold">
                     <FiActivity size={18} className="shrink-0" /> {error}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex items-center gap-4 flex-wrap">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 transition-all outline-none md:w-auto w-full disabled:opacity-70"
                  >
                    <FiSave size={18} />
                    {loading ? "Processing..." : "Log Expense"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
        
        {/* Popup Notification */}
        <div className={`fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform ${showPopup ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
           <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center">
             <FiCheckCircle size={18} />
           </div>
           <div>
             <div className="text-sm font-bold tracking-wide">Success!</div>
             <div className="text-xs text-slate-400 mt-0.5 font-medium">Your data has been saved.</div>
           </div>
        </div>
        
      </main>
    </div>
  );
}
