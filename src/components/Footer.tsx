"use client";

export default function Footer() {
  return (
  <footer className="bg-white text-slate-800 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} FinSense — Built with MERN + ML</p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-slate-600 hover:underline">Privacy</a>
          <a href="#" className="text-sm text-slate-600 hover:underline">Terms</a>
        </div>
      </div>
    </footer>
  );
}
