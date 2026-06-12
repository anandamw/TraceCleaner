import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Power, Trash2, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StartupApp {
  name: string;
  command: string;
  location: string;
}

export function Startup() {
  const [apps, setApps] = useState<StartupApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const result = await invoke<StartupApp[]>("get_startup_apps");
      setApps(result);
      setHasScanned(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (app: StartupApp) => {
    if (!confirm(`Are you sure you want to prevent "${app.name}" from starting automatically?`)) return;
    try {
      setProcessing(app.name);
      await invoke("remove_startup_app", { name: app.name, location: app.location });
      await fetchApps();
    } catch (e) {
      alert("Failed to disable startup app. Note: You may need to run TraceCleaner as Administrator to modify HKLM keys.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Power className="w-8 h-8 text-blue-500" /> Startup Manager
          </h1>
          <p className="text-zinc-400 mt-2">Speed up Windows boot time by disabling unnecessary background apps.</p>
        </div>
        <button
          onClick={fetchApps}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-colors font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-zinc-500">Scanning startup entries...</div>
        ) : !hasScanned ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10 text-center flex flex-col items-center">
            <Power className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl text-zinc-300 font-medium">Startup Apps</h3>
            <p className="text-zinc-500 mt-2">Click "Refresh" to scan your startup entries.</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10 text-center flex flex-col items-center">
            <ShieldCheck className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl text-zinc-300 font-medium">No startup apps found</h3>
            <p className="text-zinc-500 mt-2">Your system boot is already fully optimized.</p>
          </div>
        ) : (
          <AnimatePresence>
            {apps.map(app => (
              <motion.div 
                key={app.name + app.location}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-zinc-200 font-semibold text-lg truncate">
                      {app.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${app.location.includes('HKLM') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {app.location}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-400 font-mono truncate max-w-xl" title={app.command}>
                    {app.command}
                  </div>
                </div>

                <div className="flex shrink-0">
                  <button
                    disabled={processing === app.name}
                    onClick={() => handleRemove(app)}
                    className="bg-red-600/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Disable
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      
      {!loading && apps.length > 0 && (
        <p className="mt-8 text-sm text-zinc-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          Note: Disabling applications in HKLM (Local Machine) may require Administrator privileges.
        </p>
      )}
    </div>
  );
}
