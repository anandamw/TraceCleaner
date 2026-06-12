import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Skull, AlertTriangle, Shield, CheckCircle2, FileWarning, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Shredder() {
  const [filePath, setFilePath] = useState("");
  const [passes, setPasses] = useState(3);
  const [shredding, setShredding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleShred = async () => {
    if (!filePath.trim()) return;
    if (!confirm(`CRITICAL WARNING: You are about to irrevocably destroy the file at:\n\n${filePath}\n\nThis file will be overwritten ${passes} times. It CANNOT be recovered by any software or hardware means. Proceed?`)) return;
    
    try {
      setShredding(true);
      setResult(null);
      await invoke("secure_delete", { path: filePath.trim(), passes: Number(passes) });
      setResult("File has been successfully eradicated from the disk.");
      setFilePath("");
    } catch (e) {
      alert("Failed to shred file: " + e);
    } finally {
      setShredding(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-red-500 tracking-tight flex items-center gap-3">
            <Flame className="w-8 h-8" /> File Shredder
          </h1>
          <p className="text-zinc-400 mt-2">Military-grade secure file deletion. Files destroyed here cannot be recovered.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-8 relative overflow-hidden">
        {/* Warning Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>
        <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <Skull className="w-64 h-64 text-red-500" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-sm font-medium">
              WARNING: Standard deletion only removes file references. Shredding actively overwrites the file data on the physical disk surface, making forensic recovery impossible.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Absolute File Path</label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="e.g. C:\Users\Name\Documents\Secret.pdf"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded-lg px-4 py-3 text-white outline-none transition-colors font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Overwriting Algorithm</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setPasses(1)}
                  className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    passes === 1 ? "bg-red-500/10 border-red-500 text-red-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-bold">1 Pass</span>
                  <span className="text-xs text-center opacity-80">Quick Wipe (Zero-fill)</span>
                </button>
                <button
                  onClick={() => setPasses(3)}
                  className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    passes === 3 ? "bg-red-500/10 border-red-500 text-red-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-bold">3 Passes</span>
                  <span className="text-xs text-center opacity-80">DoD 5220.22-M Standard</span>
                </button>
                <button
                  onClick={() => setPasses(7)}
                  className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    passes === 7 ? "bg-red-500/10 border-red-500 text-red-400" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  <span className="font-bold">7 Passes</span>
                  <span className="text-xs text-center opacity-80">Peter Gutmann Minimal</span>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleShred}
                disabled={shredding || !filePath.trim()}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-red-500/20 relative overflow-hidden group"
              >
                {shredding ? (
                  <>
                    <Flame className="w-6 h-6 animate-pulse" />
                    Shredding File... Do not close the app.
                  </>
                ) : (
                  <>
                    <Skull className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    SHRED FILE PERMANENTLY
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <div>
              <h3 className="text-lg font-bold text-green-400 mb-1">Target Destroyed</h3>
              <p className="text-zinc-400 text-sm">{result}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
