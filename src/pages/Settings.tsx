import React, { useState, useEffect } from "react";
import { Save, CheckCircle2, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Settings() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [ignoreList, setIgnoreList] = useState<string[]>([]);
  const [newIgnore, setNewIgnore] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedAutoBackup = localStorage.getItem("tc_autoBackup");
    if (savedAutoBackup !== null) {
      setAutoBackup(savedAutoBackup === "true");
    }
    const savedIgnoreList = localStorage.getItem("tc_ignoreList");
    if (savedIgnoreList !== null) {
      try { setIgnoreList(JSON.parse(savedIgnoreList)); } catch(e) {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("tc_autoBackup", autoBackup.toString());
    localStorage.setItem("tc_ignoreList", JSON.stringify(ignoreList));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addIgnoreItem = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newIgnore.trim();
    if (val && !ignoreList.includes(val)) {
      setIgnoreList([...ignoreList, val]);
      setNewIgnore("");
    }
  };

  const removeIgnoreItem = (item: string) => {
    setIgnoreList(ignoreList.filter(i => i !== item));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Settings</h1>
      
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
        <h2 className="text-xl font-semibold text-zinc-200 mb-4">Safety & Backup</h2>
        
        <label className="flex items-center gap-3 text-zinc-300 cursor-pointer group">
          <input 
            type="checkbox"
            checked={autoBackup}
            onChange={(e) => setAutoBackup(e.target.checked)}
            className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-white focus:ring-white focus:ring-offset-zinc-900"
          />
          <span className="group-hover:text-white transition-colors">
            Always enable "Create Backup" by default when uninstalling
          </span>
        </label>
        <p className="text-sm text-zinc-500 mt-2 ml-8">
          If disabled, you will need to manually check the backup box before each deletion.
        </p>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-8">
        <h2 className="text-xl font-semibold text-zinc-200 mb-4">Ignore List (Whitelist)</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Directories or keywords added here will be completely ignored by the deep trace and residual scanners.
        </p>
        
        <form onSubmit={addIgnoreItem} className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newIgnore}
            onChange={(e) => setNewIgnore(e.target.value)}
            placeholder="e.g. MyImportantFiles or C:\Data"
            className="flex-1 bg-zinc-950 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        <div className="space-y-2">
          <AnimatePresence>
            {ignoreList.map((item, idx) => (
              <motion.div 
                key={item}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2"
              >
                <span className="text-zinc-300 font-mono text-sm">{item}</span>
                <button 
                  onClick={() => removeIgnoreItem(item)}
                  className="text-zinc-500 hover:text-red-400 p-1 rounded-md hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {ignoreList.length === 0 && (
            <div className="text-zinc-500 text-sm text-center py-4 italic">No paths ignored.</div>
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
      >
        {saved ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Save className="w-5 h-5" />}
        {saved ? "Saved successfully!" : "Save Preferences"}
      </button>
    </motion.div>
  );
}
