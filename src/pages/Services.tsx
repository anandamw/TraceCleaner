import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Server, Play, Square, RefreshCw, AlertTriangle, Search, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WinService {
  Name: string;
  DisplayName: string;
  Status: string;
}

export function Services() {
  const [services, setServices] = useState<WinService[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Running" | "Stopped">("All");

  const fetchServices = async () => {
    try {
      setLoading(true);
      const result = await invoke<WinService[]>("get_services");
      setServices(result);
      setHasScanned(true);
    } catch (e) {
      alert("Failed to fetch services: " + e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (service: WinService) => {
    const action = service.Status === "Running" ? "Stop" : "Start";
    
    if (action === "Stop") {
      if (!confirm(`Are you sure you want to STOP the service "${service.DisplayName}"?\n\nStopping critical Windows services may cause system instability or crashes.`)) return;
    }

    try {
      setProcessing(service.Name);
      await invoke("toggle_service", { name: service.Name, action });
      // Refresh list after brief delay to let service state update in OS
      setTimeout(fetchServices, 1000);
    } catch (e) {
      alert(`Failed to ${action} service. You may need to run Optim as Administrator to modify system services.\n\nError: ${e}`);
    } finally {
      setProcessing(null);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.DisplayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.Name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "All" || s.Status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-500" /> Services Manager
          </h1>
          <p className="text-zinc-400 mt-2">View and manage background Windows services to free up RAM.</p>
        </div>
        <button
          onClick={fetchServices}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-colors font-medium shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search services by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-lg pl-10 pr-4 py-2.5 text-white outline-none transition-colors"
          />
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 shrink-0">
          <button
            onClick={() => setFilter("All")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === "All" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("Running")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === "Running" ? "bg-blue-500/20 text-blue-400" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Running
          </button>
          <button
            onClick={() => setFilter("Stopped")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === "Stopped" ? "bg-zinc-800 text-zinc-300" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Stopped
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-900/50 border border-zinc-800 rounded-xl relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
             <p className="text-zinc-500">Fetching Windows Services...</p>
          </div>
        ) : !hasScanned ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
             <Server className="w-12 h-12 mb-4 opacity-20" />
             <p>Click "Refresh" to load background services.</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
             <Server className="w-12 h-12 mb-4 opacity-20" />
             <p>No services found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {filteredServices.map(service => (
              <div 
                key={service.Name}
                className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-zinc-200 truncate">{service.DisplayName}</span>
                    {service.Status === "Running" ? (
                      <span className="shrink-0 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Running
                      </span>
                    ) : (
                      <span className="shrink-0 bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Stopped
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500 font-mono truncate">
                    {service.Name}
                  </div>
                </div>

                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={processing === service.Name}
                    onClick={() => handleToggle(service)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                      service.Status === "Running"
                        ? "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
                        : "bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20"
                    }`}
                  >
                    {processing === service.Name ? (
                       <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : service.Status === "Running" ? (
                       <><Square className="w-3 h-3 fill-current" /> Stop</>
                    ) : (
                       <><Play className="w-3 h-3 fill-current" /> Start</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-zinc-500 flex items-center gap-2 shrink-0">
        <ShieldAlert className="w-4 h-4 text-yellow-500" />
        Modifying services requires Administrator privileges. Do not stop services you do not recognize.
      </p>
    </div>
  );
}
