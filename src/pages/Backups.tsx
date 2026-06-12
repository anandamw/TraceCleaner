import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArchiveRestore, Trash2, ShieldCheck, RefreshCw, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BackupItem {
  id: string;
  timestamp: number;
  original_paths: string[];
  size_bytes: number;
}

export function Backups() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const result = await invoke<BackupItem[]>("get_backups");
      setBackups(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Are you sure you want to restore these files? This will overwrite existing files at those locations.")) return;
    try {
      setProcessing(id);
      await invoke("restore_backup", { id });
      alert("Backup successfully restored to original locations.");
    } catch (e) {
      alert("Failed to restore: " + e);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this backup?")) return;
    try {
      setProcessing(id);
      await invoke("delete_backup", { id });
      await fetchBackups();
    } catch (e) {
      alert("Failed to delete: " + e);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Archive className="w-8 h-8 text-blue-500" /> Backup Manager
          </h1>
          <p className="text-zinc-400 mt-2">Manage and restore safety backups created before deletion.</p>
        </div>
        <button
          onClick={fetchBackups}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-colors font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-zinc-500">Loading backups...</div>
        ) : backups.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-10 text-center flex flex-col items-center">
            <ShieldCheck className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl text-zinc-300 font-medium">No backups found</h3>
            <p className="text-zinc-500 mt-2">Your system is clean and no safety backups have been made yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            {backups.map(b => (
              <motion.div 
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-zinc-200 font-semibold text-lg">
                      {new Date(b.timestamp * 1000).toLocaleString()}
                    </span>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2 py-0.5 rounded-full font-medium">
                      {formatSize(b.size_bytes)}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-400">
                    Contains {b.original_paths.length} protected item{b.original_paths.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    disabled={processing === b.id}
                    onClick={() => handleRestore(b.id)}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArchiveRestore className="w-4 h-4" /> Restore
                  </button>
                  <button
                    disabled={processing === b.id}
                    onClick={() => handleDelete(b.id)}
                    className="flex-1 sm:flex-none bg-red-600/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
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
