import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Zap, Trash2, CheckCircle2, ShieldAlert, Cpu, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JunkItem {
  path: string;
  size_bytes: number;
  category: string;
}

interface JunkScanResult {
  items: JunkItem[];
  total_size_bytes: number;
}

export function Optimizer() {
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanResult, setScanResult] = useState<JunkScanResult | null>(null);
  const [lastCleanedSize, setLastCleanedSize] = useState<number | null>(null);

  const [browserScanning, setBrowserScanning] = useState(false);
  const [browserCleaning, setBrowserCleaning] = useState(false);
  const [browserResult, setBrowserResult] = useState<JunkScanResult | null>(null);
  const [browserCleanedSize, setBrowserCleanedSize] = useState<number | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      setLastCleanedSize(null);
      const result = await invoke<JunkScanResult>("scan_system_junk");
      setScanResult(result);
    } catch (e) {
      alert("Failed to scan system junk: " + e);
    } finally {
      setScanning(false);
    }
  };

  const handleBrowserScan = async () => {
    try {
      setBrowserScanning(true);
      setBrowserCleanedSize(null);
      const result = await invoke<JunkScanResult>("scan_browsers");
      setBrowserResult(result);
    } catch (e) {
      alert("Failed to scan browsers: " + e);
    } finally {
      setBrowserScanning(false);
    }
  };

  const handleClean = async () => {
    if (!scanResult || scanResult.items.length === 0) return;
    try {
      setCleaning(true);
      const paths = scanResult.items.map(item => item.path);
      const deletedCount = await invoke<number>("clean_system_junk", { paths });
      setLastCleanedSize(scanResult.total_size_bytes);
      setScanResult(null);
    } catch (e) {
      alert("Failed to clean system junk: " + e);
    } finally {
      setCleaning(false);
    }
  };

  const handleBrowserClean = async () => {
    if (!browserResult || browserResult.items.length === 0) return;
    try {
      setBrowserCleaning(true);
      const paths = browserResult.items.map(item => item.path);
      const deletedCount = await invoke<number>("clean_system_junk", { paths }); // Reuse delete logic
      setBrowserCleanedSize(browserResult.total_size_bytes);
      setBrowserResult(null);
    } catch (e) {
      alert("Failed to clean browsers: " + e);
    } finally {
      setBrowserCleaning(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" /> System Optimizer
          </h1>
          <p className="text-zinc-500 mt-2">Free up disk space and protect privacy by removing temporary files.</p>
        </div>
      </div>

      {/* System Junk Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center text-center">
          <Cpu className="w-12 h-12 text-zinc-500 mb-4" />
          <h3 className="text-xl text-white font-medium mb-2">System Junk</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Scans Windows Temp, User Temp, and the Recycle Bin for orphaned files.
          </p>
          <button
            onClick={handleScan}
            disabled={scanning || cleaning}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            <Zap className={`w-5 h-5 ${scanning ? "animate-pulse text-yellow-500" : ""}`} />
            {scanning ? "Scanning System..." : "Scan System Junk"}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
          {lastCleanedSize !== null ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl text-white font-bold mb-1">System Optimized</h3>
              <p className="text-green-400 font-medium">Reclaimed {formatSize(lastCleanedSize)} of disk space</p>
            </motion.div>
          ) : scanResult ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              <h3 className="text-xl text-white font-medium mb-1">Analysis Complete</h3>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-bold text-yellow-500">{formatSize(scanResult.total_size_bytes)}</span>
                <span className="text-zinc-500 pb-1 font-medium">of junk found</span>
              </div>
              <div className="mt-auto">
                <button
                  onClick={handleClean}
                  disabled={cleaning || scanResult.total_size_bytes === 0}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                  <Trash2 className={`w-5 h-5 ${cleaning ? "animate-pulse" : ""}`} />
                  {cleaning ? "Cleaning..." : "Clean System Junk"}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <Zap className="w-12 h-12 mb-4 opacity-20" />
              <p>Run a scan to see how much space you can save.</p>
            </div>
          )}
        </div>
      </div>

      {/* Browser Privacy Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center text-center">
          <Globe className="w-12 h-12 text-zinc-500 mb-4" />
          <h3 className="text-xl text-white font-medium mb-2">Browser Privacy</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Cleans Cache, Cookies, and History from Chrome, Edge, and Firefox.
          </p>
          <button
            onClick={handleBrowserScan}
            disabled={browserScanning || browserCleaning}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            <Globe className={`w-5 h-5 ${browserScanning ? "animate-pulse text-purple-400" : ""}`} />
            {browserScanning ? "Scanning Browsers..." : "Scan Browsers"}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
          {browserCleanedSize !== null ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl text-white font-bold mb-1">Privacy Secured</h3>
              <p className="text-green-400 font-medium">Removed {formatSize(browserCleanedSize)} of tracking data</p>
            </motion.div>
          ) : browserResult ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              <h3 className="text-xl text-white font-medium mb-1">Analysis Complete</h3>
              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-bold text-purple-400">{formatSize(browserResult.total_size_bytes)}</span>
                <span className="text-zinc-500 pb-1 font-medium">of tracking data</span>
              </div>
              <div className="mt-auto">
                <button
                  onClick={handleBrowserClean}
                  disabled={browserCleaning || browserResult.total_size_bytes === 0}
                  className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                  <Trash2 className={`w-5 h-5 ${browserCleaning ? "animate-pulse" : ""}`} />
                  {browserCleaning ? "Cleaning..." : "Clean Browsers"}
                </button>
                <p className="text-xs text-zinc-600 mt-3 text-center flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Browsers must be closed to clean all files.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <Globe className="w-12 h-12 mb-4 opacity-20" />
              <p>Protect your privacy by clearing browser data.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
