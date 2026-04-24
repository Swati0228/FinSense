"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { apiClient } from "@/utils/apiClient";
import { 
  FiUser, 
  FiCalendar, 
  FiRefreshCw,
  FiPhone,
  FiMapPin,
  FiMail,
  FiEdit2,
  FiCamera,
  FiDollarSign,
  FiActivity
} from "react-icons/fi";

const BACKEND_URL = "";

interface RecurringExpense {
  _id?: string;
  date?: string;
  amount?: number;
  merchant?: string;
  category?: string;
  notes?: string;
  recurring?: boolean;
}

export default function Profile() {
  const [user, setUser] = useState({
    name: "Loading...",
    email: "Loading...",
    phone: "123-456-7890",
    address: "123 Main St, Springfield, USA",
    profileImage: "", // Placeholder for uploaded image
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringError, setRecurringError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!localStorage.getItem("token")) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const response = await apiClient(`${BACKEND_URL}/api/profile`, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(prevUser => ({
              ...prevUser,
              name: data.user.name,
              email: data.user.email,
              profileImage: data.user.profileImage || ""
            }));
          }
        } else {
          setError("Failed to fetch profile data");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("An error occurred while fetching profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch recurring expenses when the recurringExpenses tab is selected
  useEffect(() => {
    const fetchRecurring = async () => {
      setRecurringError("");
      setRecurringLoading(true);
      try {
        if (!localStorage.getItem("token")) {
          setRecurringError("No authentication token found");
          setRecurringExpenses([]);
          setRecurringLoading(false);
          return;
        }

        const res = await apiClient(`${BACKEND_URL}/api/recurringexpenses`, {
          method: "GET",
        });

        if (res.ok) {
          const data = await res.json();
          setRecurringExpenses(Array.isArray(data.recurringExpenses) ? data.recurringExpenses : []);
        } else {
          const err = await res.json().catch(() => ({}));
          setRecurringError(err.error || "Failed to fetch recurring expenses");
        }
      } catch (err) {
        console.error("Error fetching recurring expenses:", err);
        setRecurringError("An error occurred while fetching recurring expenses");
      } finally {
        setRecurringLoading(false);
      }
    };

    if (activeTab === "recurringExpenses") {
      fetchRecurring();
    }
  }, [activeTab]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setUser((prevUser) => ({ ...prevUser, profileImage: base64String }));
      
      try {
        setIsUploading(true);
        const res = await apiClient(`${BACKEND_URL}/api/profile`, {
          method: "PUT",
          body: JSON.stringify({ profileImage: base64String })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.profileImage) {
            setUser((prev) => ({ ...prev, profileImage: data.user.profileImage }));
            window.dispatchEvent(new Event("userAuthenticated"));
          }
        } else {
          console.error("Failed to upload image");
        }
      } catch (err) {
        console.error("Error uploading image:", err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 lg:p-12">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-14 h-14 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mx-auto mb-6 shadow-lg shadow-teal-500/20"></div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Profile</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center p-8 bg-red-50 rounded-3xl border border-red-100 max-w-sm">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiActivity size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-red-700 mb-2">Sync Error</h3>
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-teal-400 text-white rounded-[2rem] flex items-center justify-center text-5xl font-black shadow-xl shadow-teal-500/30 overflow-hidden ring-4 ring-slate-50 relative z-10 transition-transform group-hover:scale-105">
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                           <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      {user.profileImage ? (
                        <Image
                          src={user.profileImage}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="z-0">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    
                    {/* Floating camera button overlay */}
                    <label className="absolute -bottom-3 -right-3 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 cursor-pointer z-20 hover:bg-slate-800 hover:scale-110 transition-all border-4 border-white">
                      <FiCamera size={18} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-1">{user.name}</h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-sm font-bold mb-4">
                      <FiMail size={14} /> {user.email}
                    </div>
                    <p className="text-sm font-medium text-slate-500">Manage your FinSense profile, settings, and personal data securely from this dashboard.</p>
                  </div>
                  
                  <div className="hidden md:block">
                     <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl font-bold border border-slate-200 transition-colors">
                       <FiEdit2 size={16} /> Edit
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-teal-200 hover:bg-white hover:shadow-lg transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <FiPhone size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</h3>
                    <p className="text-lg font-bold text-slate-800">{user.phone}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-teal-200 hover:bg-white hover:shadow-lg transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <FiMapPin size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billing Address</h3>
                    <p className="text-lg font-bold text-slate-800 truncate">{user.address}</p>
                  </div>
                </div>

                {/* Mobile edit button */}
                <div className="md:hidden mt-8">
                  <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl shadow-lg shadow-teal-500/20 font-bold">
                    <FiEdit2 size={18} /> Edit Profile Data
                  </button>
                </div>
              </>
            )}
          </div>
        );
      case "previousMonths":
        return (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 lg:p-12">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
               <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shadow-inner">
                 <FiCalendar size={22} />
               </div>
               <div>
                  <h2 className="text-2xl font-extrabold text-slate-800">Historical Archives</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Review your financial timeline and performance.</p>
               </div>
            </div>
            
            <div className="p-12 bg-slate-50 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center">
               <FiActivity size={32} className="text-slate-300 mb-4" />
               <h3 className="text-lg font-bold text-slate-700 mb-2">No Past Data Gathered</h3>
               <p className="text-sm text-slate-500 max-w-sm">Once you complete a full month with FinSense, your comparative analytics will appear right here.</p>
            </div>
          </div>
        );
      case "recurringExpenses":
        return (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 lg:p-12">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
               <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shadow-inner">
                 <FiRefreshCw size={22} />
               </div>
               <div>
                  <h2 className="text-2xl font-extrabold text-slate-800">Recurring Liabilities</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Active subscriptions and monthly set expenses.</p>
               </div>
            </div>

            {recurringLoading ? (
               <div className="flex items-center justify-center py-20">
                 <div className="text-center">
                   <div className="w-14 h-14 border-4 border-slate-100 border-t-slate-500 rounded-full animate-spin mx-auto mb-6"></div>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Scanning Expenses</p>
                 </div>
               </div>
            ) : recurringError ? (
               <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-100 text-red-600 font-bold mb-6">
                 {recurringError}
               </div>
            ) : recurringExpenses.length === 0 ? (
               <div className="p-12 bg-slate-50 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300 mb-4">
                   <FiDollarSign size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-700 mb-2">No active subscriptions</h3>
                 <p className="text-sm text-slate-500 max-w-sm">Mark expenses as recurring in your dashboard to see them auto-populated here.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recurringExpenses.map((exp, idx) => (
                  <div key={exp._id || idx} className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-teal-300 hover:shadow-lg transition-all group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold">
                         {exp.merchant ? exp.merchant.charAt(0).toUpperCase() : 'E'}
                       </div>
                       <div className="bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                         <FiRefreshCw size={10} /> Active
                       </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 truncate mb-1">{exp.merchant || exp.category || 'Logged Expense'}</h4>
                      <p className="text-sm font-medium text-slate-500 truncate mb-4">{exp.notes || 'No description provided'}</p>
                      
                      <div className="flex items-end justify-between pt-4 border-t border-slate-100">
                        <div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Process Date</div>
                           <div className="text-sm font-bold text-slate-700">{exp.date ? new Date(exp.date).toLocaleDateString() : 'Auto'}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</div>
                           <div className="text-xl font-black text-slate-800 group-hover:text-teal-600 transition-colors">₹{exp.amount?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        
        {/* Page Header */}
        <div className="mb-10">
           <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Account Settings</h1>
           <p className="text-sm font-medium text-slate-500 mt-1">Manage your identity, recurring rules, and preferences.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-8 space-y-2">
              <button
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all shadow-sm ${
                  activeTab === "profile" 
                    ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-teal-500/20 transform scale-[1.02]" 
                    : "bg-white text-slate-600 border border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <FiUser size={20} className={activeTab === "profile" ? "text-teal-100" : "text-slate-400"} /> Personal Info
              </button>
              
              <button
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all shadow-sm ${
                  activeTab === "recurringExpenses" 
                    ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-teal-500/20 transform scale-[1.02]" 
                    : "bg-white text-slate-600 border border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                }`}
                onClick={() => setActiveTab("recurringExpenses")}
              >
                <FiRefreshCw size={20} className={activeTab === "recurringExpenses" ? "text-teal-100" : "text-slate-400"} /> Recurring Logs
              </button>

              <button
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all shadow-sm ${
                  activeTab === "previousMonths" 
                    ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-teal-500/20 transform scale-[1.02]" 
                    : "bg-white text-slate-600 border border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                }`}
                onClick={() => setActiveTab("previousMonths")}
              >
                <FiCalendar size={20} className={activeTab === "previousMonths" ? "text-teal-100" : "text-slate-400"} /> History
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
          
        </div>
      </div>
    </div>
  );
}