import React, { useState, useMemo, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Trash2, 
  ShieldAlert, 
  FolderSearch, 
  Package, 
  FileCode2, 
  ChevronRight, 
  ChevronDown,
  AlertTriangle,
  FolderTree
} from "lucide-react";

interface Application {
  id?: number;
  name: string;
  version?: string;
  publisher?: string;
  install_path?: string;
  uninstall_command?: string;
  source: string;
}

interface Trace {
  id?: number;
  app_id: number;
  trace_type: string;
  path: string;
  size_bytes?: number;
  is_residual: boolean;
  verified: boolean;
}

const categorizeTrace = (path: string): string => {
  const p = path.toLowerCase();
  if (p.includes("appdata\\roaming")) return "Config & Profile Data";
  if (p.includes("appdata\\local\\temp") || p.includes("temp\\")) return "Temporary Files";
  if (p.includes("appdata\\local")) return "Local App Data & Cache";
  if (p.includes("programdata")) return "Program Data (Global)";
  if (p.includes("program files")) return "Installation Folder";
  if (p.includes("hkey_")) return "Registry Keys";
  return "Other Traces";
};

export function Dashboard() {
  const [apps, setApps] = useState<Application[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [tracing, setTracing] = useState(false);
  
  const [removalMode, setRemovalMode] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);
  const [createBackup, setCreateBackup] = useState(true);
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showingResiduals, setShowingResiduals] = useState(false);

  useEffect(() => {
    const savedAutoBackup = localStorage.getItem("tc_autoBackup");
    if (savedAutoBackup !== null) {
      setCreateBackup(savedAutoBackup === "true");
    }
  }, []);

  const scanApps = async () => {
    try {
      setScanning(true);
      setError("");
      setExpandedApp(null);
      setRemovalMode(false);
      setShowingResiduals(false);
      const result = await invoke<Application[]>("scan_installed_apps");
      setApps(result);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setScanning(false);
    }
  };

  const getIgnoreList = (): string[] => {
    const saved = localStorage.getItem("tc_ignoreList");
    return saved ? JSON.parse(saved) : [];
  };

  const handleDeepScan = async (app: Application, index: number, isUninstall: boolean) => {
    if (expandedApp === index && removalMode === isUninstall) {
      setExpandedApp(null);
      setRemovalMode(false);
      return;
    }
    
    setExpandedApp(index);
    setRemovalMode(isUninstall);
    setShowingResiduals(false);
    setTracing(true);
    setTraces([]);
    setSelectedPaths(new Set());
    
    const savedAutoBackup = localStorage.getItem("tc_autoBackup");
    setCreateBackup(savedAutoBackup !== "false");
    
    try {
      const result = await invoke<Trace[]>("get_app_traces", {
        appId: index,
        appName: app.name,
        publisher: app.publisher || null,
        ignoreList: getIgnoreList(),
      });
      setTraces(result);
      if (isUninstall) {
        setSelectedPaths(new Set(result.map(t => t.path)));
      }
      const cats = new Set(result.map(t => categorizeTrace(t.path)));
      setExpandedCategories(cats);
    } catch (e: any) {
      console.error(e);
    } finally {
      setTracing(false);
    }
  };

  const scanResiduals = async () => {
    try {
      setScanning(true);
      setError("");
      setExpandedApp(null);
      setRemovalMode(true);
      setShowingResiduals(true);
      setTracing(true);
      
      const savedAutoBackup = localStorage.getItem("tc_autoBackup");
      setCreateBackup(savedAutoBackup !== "false");
      
      const result = await invoke<Trace[]>("scan_residual_traces", {
        ignoreList: getIgnoreList(),
      });
      setTraces(result);
      setSelectedPaths(new Set(result.map(t => t.path)));
      
      const cats = new Set(result.map(t => categorizeTrace(t.path)));
      setExpandedCategories(cats);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setTracing(false);
      setScanning(false);
    }
  };

  const groupedTraces = useMemo(() => {
    const groups: Record<string, Trace[]> = {};
    traces.forEach(t => {
      const cat = categorizeTrace(t.path);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return Object.entries(groups).map(([category, items]) => ({ category, items }));
  }, [traces]);

  const togglePath = (path: string) => {
    const newSet = new Set(selectedPaths);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setSelectedPaths(newSet);
  };

  const toggleCategorySelection = (categoryItems: Trace[]) => {
    const allSelected = categoryItems.every(t => selectedPaths.has(t.path));
    const newSet = new Set(selectedPaths);
    if (allSelected) {
      categoryItems.forEach(t => newSet.delete(t.path));
    } else {
      categoryItems.forEach(t => newSet.add(t.path));
    }
    setSelectedPaths(newSet);
  };

  const toggleCategoryExpand = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) newSet.delete(category);
    else newSet.add(category);
    setExpandedCategories(newSet);
  };

  const executeRemoval = async (app: Application) => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedPaths.size} traces for ${app.name}?`)) {
      return;
    }
    setRemoving(true);
    try {
      const pathsToDelete = Array.from(selectedPaths);
      if (createBackup) {
        await invoke<string>("backup_traces", { paths: pathsToDelete });
      }
      if (app.uninstall_command) {
        await invoke("execute_uninstaller", { command: app.uninstall_command });
      }
      const deletedCount = await invoke<number>("delete_traces", { paths: pathsToDelete });
      alert(`Successfully deleted ${deletedCount} traces.${createBackup ? " Backup created." : ""}`);
      setExpandedApp(null);
      scanApps();
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setRemoving(false);
    }
  };

  const renderTraceTree = (app: Application) => {
    return (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className={`p-6 border-l-2 ${removalMode ? 'bg-red-950/10 border-red-900' : 'bg-zinc-900 border-zinc-800'}`}
      >
        <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-widest flex items-center gap-2">
          {removalMode ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <FolderSearch className="w-4 h-4 text-zinc-500" />}
          {removalMode ? "Select Traces to Remove" : "Traces Found"}
        </h3>
        
        {tracing ? (
          <div className="text-zinc-500 text-sm flex items-center gap-2">
            <Search className="w-4 h-4 animate-spin" /> Scanning system...
          </div>
        ) : traces.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {groupedTraces.map(({ category, items }) => {
                const allSelected = items.every(t => selectedPaths.has(t.path));
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <div key={category} className="bg-zinc-900/50 rounded border border-zinc-800 overflow-hidden">
                    <div className="flex items-center p-3 hover:bg-zinc-800 transition-colors">
                      {removalMode && (
                        <input 
                          type="checkbox" 
                          checked={allSelected}
                          onChange={() => toggleCategorySelection(items)}
                          className="mr-3 w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-white focus:ring-offset-black"
                        />
                      )}
                      <button 
                        className="flex-1 flex items-center gap-2 text-zinc-300 font-medium cursor-pointer text-left text-sm"
                        onClick={() => toggleCategoryExpand(category)}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                        <Package className="w-4 h-4 text-zinc-500" />
                        {category}
                        <span className="ml-2 bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">
                          {items.length}
                        </span>
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="border-t border-zinc-800 bg-zinc-950 p-2 pl-10 space-y-1 overflow-hidden"
                        >
                          {items.map((trace, tidx) => (
                            <div key={tidx} className="flex items-center text-xs font-mono text-zinc-500 py-1 hover:text-zinc-300 transition-colors">
                              {removalMode && (
                                <input 
                                  type="checkbox" 
                                  checked={selectedPaths.has(trace.path)}
                                  onChange={() => togglePath(trace.path)}
                                  className="mr-3 rounded border-zinc-700 bg-[#0a0a0a] focus:ring-white focus:ring-offset-black"
                                />
                              )}
                              <FileCode2 className="w-3.5 h-3.5 text-zinc-600 mr-2 shrink-0" />
                              <span className="truncate" title={trace.path}>{trace.path}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {removalMode && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-6 pt-6 border-t border-zinc-800 flex flex-col items-start gap-4"
              >
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={createBackup} 
                    onChange={(e) => setCreateBackup(e.target.checked)} 
                    className="w-4 h-4 rounded border-zinc-700 bg-[#0a0a0a] text-white focus:ring-white focus:ring-offset-black"
                  />
                  Create a secure backup before permanently deleting files
                </label>
                
                <div className="flex flex-col gap-2 w-full max-w-sm">
                  <button
                    onClick={() => executeRemoval(app)}
                    disabled={removing || selectedPaths.size === 0}
                    className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-6 rounded-md font-medium text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {removing ? (
                      <Search className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {removing ? "Removing..." : `Delete ${selectedPaths.size} Traces`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="text-zinc-500 text-sm py-4">No traces found. Your system is clean.</div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Scanner</h1>
        <div className="flex gap-4">
          <button
            onClick={scanApps}
            disabled={scanning}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-sm py-2 px-4 rounded-md border border-zinc-800 transition-all disabled:opacity-50"
          >
            <Search className={`w-4 h-4 ${scanning && !showingResiduals ? "animate-spin" : ""}`} />
            Scan Installed Apps
          </button>
          <button
            onClick={scanResiduals}
            disabled={scanning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-md transition-all disabled:opacity-50"
          >
            <FolderTree className={`w-4 h-4 ${scanning && showingResiduals ? "animate-spin" : ""}`} />
            Scan Residuals
          </button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 mb-6 bg-red-950/30 border border-red-900/50 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" /> {error}
        </motion.div>
      )}

      {showingResiduals && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden mb-8">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-zinc-400" /> Orphaned Traces Found
            </h2>
            <p className="text-zinc-500 text-sm mt-1">These folders do not match any installed application.</p>
          </div>
          {renderTraceTree({ name: "Orphaned Traces", source: "residuals" })}
        </motion.div>
      )}

      {apps.length > 0 && !showingResiduals && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/50 text-zinc-500 border-b border-zinc-800 text-xs tracking-wider uppercase">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Version</th>
                <th className="p-4 font-medium">Publisher</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {apps.map((app, idx) => (
                <React.Fragment key={idx}>
                  <tr className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="p-4 text-zinc-300 font-medium group-hover:text-white transition-colors">{app.name}</td>
                    <td className="p-4 text-zinc-500 text-sm">{app.version || "-"}</td>
                    <td className="p-4 text-zinc-500 text-sm">{app.publisher || "-"}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => handleDeepScan(app, idx, false)}
                        className="flex items-center gap-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 px-3 rounded-md border border-zinc-700 transition-colors"
                      >
                        <FolderSearch className="w-3.5 h-3.5" /> Deep Scan
                      </button>
                      <button
                        onClick={() => handleDeepScan(app, idx, true)}
                        className="flex items-center gap-1.5 text-xs font-medium bg-red-950/20 hover:bg-red-900/40 text-red-400 py-1.5 px-3 rounded-md border border-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Uninstall
                      </button>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedApp === idx && (
                      <tr className="bg-zinc-950">
                        <td colSpan={4} className="p-0 border-t-0">
                          {renderTraceTree(app)}
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
