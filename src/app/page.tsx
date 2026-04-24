"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
  FiPieChart, 
  FiTarget, 
  FiTrendingUp, 
  FiRefreshCw, 
  FiShield, 
  FiZap 
} from "react-icons/fi";

// Reusable scroll-reveal animation wrapper
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, { threshold: 0.1, rootMargin: "50px" });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Progress Bar Animation Component
function AnimatedProgress({ targetWidth, colorClass, baseDelay }: { targetWidth: string, colorClass: string, baseDelay: number }) {
  const [width, setWidth] = useState("0%");
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setWidth(targetWidth), baseDelay);
        if (ref.current) observer.unobserve(ref.current);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [targetWidth, baseDelay]);

  return (
    <div ref={ref} className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div 
        className={`${colorClass} h-2 rounded-full transition-all duration-1000 ease-out`} 
        style={{ width }}
      ></div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50/50 -z-10" />
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-teal-100/50 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '12s' }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16 relative">
          <div className="flex-1 text-center lg:text-left space-y-8 z-10 w-full">
            <Reveal delay={100}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 text-teal-800 text-sm font-semibold tracking-wide border border-teal-200 shadow-sm hover:scale-105 transition-transform cursor-default">
                <span className="flex h-2 w-2 rounded-full bg-teal-600 animate-ping"></span>
                Smart Financial Assistant
              </div>
            </Reveal>
            
            <Reveal delay={200}>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Understand spending.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 animate-gradient bg-300%">
                  Make smarter choices.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={300}>
              <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                FinSense isn't just an expense tracker. We use lightweight machine learning to categorize your spending, identify patterns, and provide actionable tips—helping you save more without the stress.
              </p>
            </Reveal>

            <Reveal delay={400}>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transform hover:-translate-y-1 transition-all duration-300 text-center relative overflow-hidden group">
                  <span className="absolute w-0 h-full bg-white/20 top-0 left-0 -skew-x-[45deg] group-hover:w-[150%] transition-all duration-700 ease-out"></span>
                  <span className="relative z-10">Get Started for Free</span>
                </Link>
                <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold shadow-sm border border-slate-200 hover:border-slate-300 transform hover:-translate-y-1 transition-all duration-300 text-center">
                  Sign In
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="flex-1 w-full max-w-lg lg:max-w-none relative group perspective-1000 mt-10 lg:mt-0">
            <Reveal delay={500}>
              {/* Mockup Dashboard UI built with CSS */}
              <div className="relative rounded-2xl bg-white/60 backdrop-blur-xl border border-white max-w-md mx-auto shadow-2xl p-6 transform rotate-y-[0deg] lg:rotate-y-[-10deg] lg:rotate-x-[5deg] group-hover:rotate-y-0 group-hover:rotate-x-0 transition-transform duration-1000 ease-out z-10">
                <div className="absolute top-4 right-4 flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80 hover:bg-amber-500 transition-colors"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80 hover:bg-green-500 transition-colors"></div>
                </div>
                
                <p className="text-sm text-slate-500 font-medium mb-1 mt-4">Monthly Snapshot</p>
                <h3 className="text-4xl font-extrabold text-slate-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">₹ 28,450</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-teal-50 to-white border border-teal-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 text-teal-600 rounded-lg group-hover:scale-110 transition-transform">
                        <FiPieChart size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Pattern Analysis</p>
                        <p className="text-xs text-slate-500">Moderate Spending</p>
                      </div>
                    </div>
                    <span className="text-teal-700 font-bold bg-teal-100 border border-teal-200 px-3 py-1 rounded-full text-xs shadow-sm shadow-teal-500/10">Healthy</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-600">Food & Dining</span>
                      <span className="font-semibold text-slate-900">35%</span>
                    </div>
                    <AnimatedProgress targetWidth="35%" colorClass="bg-gradient-to-r from-amber-400 to-orange-400 shadow-sm shadow-amber-400/50" baseDelay={800} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-600">Travel</span>
                      <span className="font-semibold text-slate-900">15%</span>
                    </div>
                    <AnimatedProgress targetWidth="15%" colorClass="bg-gradient-to-r from-blue-400 to-indigo-400 shadow-sm shadow-blue-400/50" baseDelay={1000} />
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-xl shadow-inner border border-slate-700 font-medium hover:bg-slate-800 transition-colors cursor-default">
                  <p className="text-xs font-bold text-teal-400 mb-1 flex items-center gap-2 uppercase tracking-wide">
                    <FiZap size={14} className="animate-pulse" /> AI Suggestion
                  </p>
                  <p className="text-sm">Cut monthly eating out by 20% to save ₹3,000.</p>
                </div>
              </div>
            </Reveal>
            
            {/* Floating element 1 */}
            <Reveal delay={900} className="absolute -bottom-4 translate-y-full -left-2 sm:-left-10 lg:-left-16 z-20">
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-100 animate-bounce cursor-default scale-90 sm:scale-100" style={{ animationDuration: '6s' }}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 text-green-600 rounded-full shadow-inner">
                    <FiTrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Savings Trend</p>
                    <p className="text-lg font-bold text-slate-900">+12% this month</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Floating element 2 */}
            <Reveal delay={1100} className="absolute -top-6 -right-4 lg:-right-8 z-20">
               <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 animate-bounce cursor-default" style={{ animationDuration: '7s', animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                     </span>
                     <p className="text-sm font-bold text-slate-700">Live Syncing</p>
                  </div>
               </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-teal-600 font-bold tracking-wide uppercase text-sm mb-3 relative inline-block">
                Core Features
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600/30 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </h2>
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Intelligent tools to rethink your wallet.</h3>
              <p className="text-slate-600 text-lg">FinSense does the heavy lifting of categorizing expenses and spotting trends.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 hover:border-teal-200 transition-all duration-500 group h-full">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-teal-600 group-hover:to-teal-500 group-hover:text-white group-hover:shadow-teal-500/30 transition-all duration-500 group-hover:-rotate-3">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">{feature.title}</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-[800px] h-[800px] bg-teal-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Reveal>
                <h2 className="text-teal-400 font-bold tracking-wide uppercase text-sm mb-3">Workflow</h2>
                <h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">How FinSense Works</h3>
                <p className="text-slate-400 text-lg mb-12 leading-relaxed font-medium">
                  We keep things simple: you input your spending, we analyze it instantly, and provide clear next steps. No confusing spreadsheets required.
                </p>
              </Reveal>

              <div className="space-y-12">
                {[
                  { step: '01', title: 'Enter Your Expenses', desc: 'Add category-wise amounts dynamically. Set up recurring payments for hands-off tracking.' },
                  { step: '02', title: 'Smart ML Analysis', desc: 'A Decision Tree evaluates the pattern and returns an actionable label with a strict confidence score.' },
                  { step: '03', title: 'Personalized Advice', desc: 'We combine the classification with simple heuristics to produce specific tips to maximize savings.' }
                ].map((item, i) => (
                  <Reveal key={i} delay={i * 200}>
                    <div className="flex gap-6 group cursor-default">
                      <div className="relative">
                        <div className="font-mono font-bold text-teal-500 text-3xl pt-1 tracking-tighter opacity-40 group-hover:opacity-100 group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-300 z-10 relative">
                          {item.step}
                        </div>
                        {i !== 2 && (
                          <div className="absolute top-10 left-1/2 w-0.5 h-16 bg-gradient-to-b from-teal-500/30 to-transparent -translate-x-1/2"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2 group-hover:text-teal-300 transition-colors duration-300">{item.title}</h4>
                        <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal delay={400} className="relative z-10">
              <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 md:p-10 rounded-[2rem] shadow-2xl relative transform transition-all duration-500 hover:shadow-teal-900/40 hover:-translate-y-2">
                 <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent rounded-[2rem] pointer-events-none"></div>
                 <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-700/50 relative">
                   <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                      <FiZap className="text-teal-400" /> Live Analysis Server
                   </h4>
                   <div className="flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-full text-xs font-bold tracking-wider uppercase font-mono shadow-sm shadow-teal-500/20 shadow-inner">
                     <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                     Running
                   </div>
                 </div>
                 <div className="space-y-8 relative">
                   {[
                     { label: 'Categorization Confidence', val: '98.5%', color: 'text-white' },
                     { label: 'Spending Pattern Score', val: 'Healthy', color: 'text-green-400' },
                     { label: 'Calculated Risk Factor', val: 'Low Risk', color: 'text-green-400' },
                   ].map((stat, i) => (
                     <div key={i} className="flex justify-between items-center group">
                       <span className="text-slate-400 font-medium group-hover:text-slate-300 transition-colors">{stat.label}</span>
                       <span className={`font-bold font-mono ${stat.color} bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700`}>{stat.val}</span>
                     </div>
                   ))}
                   <div className="pt-6 border-t border-slate-700/50">
                     <div className="bg-gradient-to-r from-teal-900/40 to-slate-800 p-4 rounded-xl border border-teal-800/50 flex flex-col gap-2">
                        <span className="text-xs font-bold text-teal-500 uppercase tracking-wide">Recommendation Output</span>
                        <span className="text-teal-50 font-bold text-lg">Increase liquid investments by 5%</span>
                     </div>
                   </div>
                 </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-teal-50/50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-white blur-3xl opacity-50 -z-10 rounded-full"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">What Early Users Say</h3>
              <p className="text-slate-600 text-lg">Real stories from people saving more with FinSense.</p>
            </div>
          </Reveal>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Rhea, Bengaluru", quote: "FinSense showed me I was overspending on subscriptions. I cancelled two and saved ₹800/month instantly." },
              { name: "Kunal, Pune", quote: "The suggestions are practical and clear — not generic finance-speak. Finally an app that makes total sense." },
              { name: "Sneha, Hyderabad", quote: "Stunning visuals — I finally understand where I can cut costs without sacrificing my everyday lifestyle." }
            ].map((t, i) => (
              <Reveal key={i} delay={i * 150} className="h-full">
                <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-teal-100/50 relative hover:shadow-xl hover:border-teal-200 transition-all duration-300 group h-full flex flex-col justify-between">
                  <div>
                    <div className="text-teal-200 mb-6 font-serif text-8xl leading-none h-10 italic group-hover:text-teal-300 transition-colors">"</div>
                    <p className="text-slate-700 font-medium mb-8 relative z-10 leading-relaxed text-lg group-hover:text-slate-900 transition-colors">{t.quote}</p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-slate-50 pt-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-md">
                      {t.name[0]}
                    </div>
                    <p className="text-sm text-slate-900 font-bold uppercase tracking-wider">{t.name}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Frequently Asked Questions</h3>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: "Is my financial data secure?", a: "Yes, we use secure authentication with JWT tokens and password encryption. Your data is strictly private and never shared with generic third parties." },
              { q: "How does the ML categorization work?", a: "We run a lightweight decision tree model on your spending distribution to label your habits as Healthy, Moderate, or Risky with transparent confidence scores." },
              { q: "Can I set up recurring expenses?", a: "Yes! You can mark expenses as recurring. This helps you track regular payments like rent and subscriptions automatically, projecting your future spending." },
              { q: "Is FinSense free to use?", a: "Absolutely. We believe basic financial clarity and actionable insights should be accessible to everyone via a stunning interface." },
            ].map((faq, i) => (
              <Reveal key={i} delay={i * 100} className="h-full">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-teal-200 hover:bg-white hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <h4 className="font-bold text-slate-900 mb-3 text-lg">{faq.q}</h4>
                  <p className="text-slate-600 leading-relaxed font-medium mt-auto">{faq.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white pb-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <Reveal delay={200}>
            <div className="bg-gradient-to-r from-teal-600 to-blue-700 rounded-[3rem] p-10 md:p-20 text-center text-white shadow-2xl shadow-teal-900/30 relative overflow-hidden group">
              {/* Animated background lines */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay group-hover:scale-110 transition-transform duration-1000"></div>
              
              <h3 className="text-4xl md:text-6xl font-black mb-6 relative z-10 tracking-tight">Make Your Money Make Sense</h3>
              <p className="text-xl text-teal-50 max-w-2xl mx-auto mb-10 relative z-10 font-medium">
                Stop guessing where your paycheck goes. Get precision clarity in minutes with FinSense.
              </p>
              <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/signup" className="px-10 py-5 bg-white text-teal-700 hover:bg-slate-50 hover:text-teal-800 rounded-2xl font-bold shadow-2xl transition-all hover:-translate-y-1 active:scale-95 text-center text-lg inline-flex justify-center items-center gap-2 group/btn">
                  Create Free Account
                  <FiTrendingUp className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: <FiTarget size={24} />,
    title: "Expense Classification",
    desc: "A lightweight Decision Tree model labels patterns as Healthy, Moderate or Risky with confidence scores."
  },
  {
    icon: <FiPieChart size={24} />,
    title: "Visual Breakdowns",
    desc: "Insightful charts and trend lines that make it incredibly simple to spot where your money is concentrated."
  },
  {
    icon: <FiZap size={24} />,
    title: "Actionable Advice",
    desc: "Practical tips generated based on your habits, like \"cut entertainment by 10%\" with estimated monthly savings."
  },
  {
    icon: <FiRefreshCw size={24} />,
    title: "Recurring Management",
    desc: "Automatically track recurring expenses like subscriptions and utilities to prevent accidental overspending."
  },
  {
    icon: <FiTrendingUp size={24} />,
    title: "Budget Planning",
    desc: "Create simple monthly budgets with category-wise allocation to stay ahead of your financial goals."
  },
  {
    icon: <FiShield size={24} />,
    title: "Private & Secure",
    desc: "Your data stays private. We focus on personal insights, not feeding your financial info to third parties."
  }
];
