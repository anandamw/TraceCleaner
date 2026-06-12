import React, { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { Backups } from "./pages/Backups";
import { Optimizer } from "./pages/Optimizer";
import { Startup } from "./pages/Startup";
import { LargeFiles } from "./pages/LargeFiles";
import { Shredder } from "./pages/Shredder";
import { Services } from "./pages/Services";
import { Network } from "./pages/Network";
import { Shield, LayoutDashboard, Settings as SettingsIcon, Archive, Zap, Heart, X, Power, HardDrive, Flame, Server, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [currentPage, setCurrentPage] = useState<"dashboard" | "backups" | "optimizer" | "startup" | "largefiles" | "shredder" | "services" | "network" | "settings">("dashboard");
  const [showDonateModal, setShowDonateModal] = useState(false);

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-sans selection:bg-zinc-800 p-6 gap-6">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col z-10 shadow-2xl">
        <div className="flex items-center justify-center mb-8 px-2 mt-4 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
          <img src="/Logo-Optim.png" alt="Optim Logo" className="w-9 h-9 object-contain drop-shadow-lg" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 ml-3 tracking-tight">
            OPTIM
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "dashboard"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage("optimizer")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "optimizer"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
          >
            <Zap className="w-4 h-4" />
            Optimizer
          </button>
          <button
            onClick={() => setCurrentPage("startup")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "startup"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
          >
            <Power className="w-4 h-4" />
            Startup Apps
          </button>
          <button
            onClick={() => setCurrentPage("services")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "services"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
          >
            <Server className="w-4 h-4" />
            Services
          </button>
          <button
            onClick={() => setCurrentPage("network")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "network"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
          >
            <Globe className="w-4 h-4" />
            Open Ports
          </button>
          <button
            onClick={() => setCurrentPage("largefiles")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "largefiles"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
          >
            <HardDrive className="w-4 h-4" />
            Space Analyzer
          </button>
          <button
            onClick={() => setCurrentPage("shredder")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "shredder"
                ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 hover:text-red-400"
              }`}
          >
            <Flame className="w-4 h-4" />
            File Shredder
          </button>
          <button
            onClick={() => setCurrentPage("backups")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "backups"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
          >
            <Archive className="w-4 h-4" />
            Backups
          </button>
          <button
            onClick={() => setCurrentPage("settings")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${currentPage === "settings"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <button
            onClick={() => setShowDonateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors text-sm font-medium border border-zinc-800 mb-3"
          >
            <Heart className="w-4 h-4 text-pink-500" />
            Support Project
          </button>
          <div className="text-xs text-center text-zinc-600 font-mono">
            v1.0.0-MVP
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-zinc-950 border border-zinc-900 rounded-2xl relative shadow-2xl">
        <div className="relative z-10 min-h-full">
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "startup" && <Startup />}
          {currentPage === "services" && <Services />}
          {currentPage === "network" && <Network />}
          {currentPage === "largefiles" && <LargeFiles />}
          {currentPage === "shredder" && <Shredder />}
          {currentPage === "backups" && <Backups />}
          {currentPage === "optimizer" && <Optimizer />}
          {currentPage === "settings" && <Settings />}
        </div>
      </div>

      {/* Donate Modal */}
      <AnimatePresence>
        {showDonateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowDonateModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700 shadow-inner">
                  <Heart className="w-8 h-8 text-pink-500" />
                <h2 className="text-xl font-bold text-white mb-2">Support Developer</h2>
                <p className="text-zinc-400 text-sm mb-6">
                  If Optim helped you reclaim disk space and remove stubborn apps, consider buying me a coffee! ☕
                </p>

                  </div>
                </div>

                <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">
                  Scan with any E-Wallet
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
