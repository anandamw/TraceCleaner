import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HardDrive, Trash2, ShieldCheck, Search, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LargeFile {
  path: string;
  name: string;
  size_bytes: number;
  extension: string;
  last_modified: number;
}

export function LargeFiles() {
  const [files, setFiles] = useState<LargeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [minSize, setMinSize] = useState(500); // 500 MB default
  const [deleting, setDeleting] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleScan = async () => {
    try {
      setLoading(true);
      setHasScanned(true);
      const result = await invoke<LargeFile[]>("scan_large_files", { minSizeMb: minSize });
      setFiles(result);
    } catch (e) {
      alert("Error scanning files: " + e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: LargeFile) => {
    if (!confirm(`WARNING: This will permanently delete ${file.name} (${formatSize(file.size_bytes)}). Proceed?`)) return;
    try {
      setDeleting(file.path);
      await invoke("delete_large_file", { path: file.path });
      setFiles(files.filter(f => f.path !== file.path));
    } catch (e) {
      alert("Failed to delete file. It might be in use by another program.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-blue-500" /> Space Analyzer
          </h1>
          <p className="text-zinc-400 mt-2">Find and delete massive files hidden in your user profile.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <span className="text-zinc-400 text-sm mr-2">Min Size:</span>
            <select 
              value={minSize} 
              onChange={(e) => setMinSize(Number(e.target.value))}
              className="bg-transparent text-white border-none focus:outline-none text-sm font-medium cursor-pointer"
            >
              <option value={100} className="bg-zinc-900">&gt; 100 MB</option>
              <option value={500} className="bg-zinc-900">&gt; 500 MB</option>
              <option value={1000} className="bg-zinc-900">&gt; 1 GB</option>
              <option value={5000} className="bg-zinc-900">&gt; 5 GB</option>
            </select>
          </div>
          
          <button
            onClick={handleScan}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-colors font-medium disabled:opacity-50"
          >
            <Search className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
            {loading ? "Scanning..." : "Scan Drive"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl text-white font-medium">Deep Scanning Drive...</h3>
            <p className="text-zinc-500 mt-2">This may take a minute depending on your disk speed.</p>
          </div>
        ) : !hasScanned ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10 text-center flex flex-col items-center">
            <Database className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl text-zinc-300 font-medium">Ready to Analyze</h3>
            <p className="text-zinc-500 mt-2">Click Scan Drive to find large forgotten files taking up space.</p>
          </div>
        ) : files.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10 text-center flex flex-col items-center">
            <ShieldCheck className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl text-zinc-300 font-medium">No Large Files Found</h3>
            <p className="text-zinc-500 mt-2">Your drive is free of massive unused files.</p>
          </div>
        ) : (
          <AnimatePresence>
            {files.map(file => (
              <motion.div 
                key={file.path}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="overflow-hidden flex-1 w-full">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-zinc-200 font-semibold text-lg truncate">
                      {file.name}
                    </span>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2 py-0.5 rounded-full font-bold shrink-0">
                      {formatSize(file.size_bytes)}
                    </span>
                    <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded uppercase font-medium shrink-0">
                      {file.extension}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono truncate" title={file.path}>
                    {file.path}
                  </div>
                </div>

                <div className="flex shrink-0">
                  <button
                    disabled={deleting === file.path}
                    onClick={() => handleDelete(file)}
                    className="bg-red-600/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Permanently
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
