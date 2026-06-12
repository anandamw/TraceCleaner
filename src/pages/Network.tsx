import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Globe, RefreshCw, Search, ShieldAlert, Skull, Activity, Lock } from "lucide-react";

interface OpenPort {
  LocalAddress: string;
  LocalPort: number;
  PID: number;
  ProcessName: string;
}

export function Network() {
  const [ports, setPorts] = useState<OpenPort[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [killing, setKilling] = useState<number | null>(null);

  const fetchPorts = async () => {
    try {
      setLoading(true);
      const result = await invoke<OpenPort[]>("get_open_ports");
      setPorts(result);
      setHasScanned(true);
    } catch (e) {
      alert("Failed to fetch open ports: " + e);
    } finally {
      setLoading(false);
    }
  };

  const handleKill = async (port: OpenPort) => {
    if (port.PID === 0 || port.PID === 4) {
      alert("Cannot kill core Windows System processes.");
      return;
    }
    
    if (!confirm(`Are you sure you want to FORCE KILL "${port.ProcessName}" (PID: ${port.PID})?\n\nAny unsaved data in this application will be lost.`)) return;

    try {
      setKilling(port.PID);
      await invoke("kill_port_process", { pid: port.PID });
      setTimeout(fetchPorts, 1000);
    } catch (e) {
      alert(`Failed to kill process. You may need Administrator privileges.\n\nError: ${e}`);
    } finally {
      setKilling(null);
    }
  };

  const filteredPorts = ports.filter(p => 
    p.ProcessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.LocalPort.toString().includes(searchQuery)
  );

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-cyan-500" /> Network Ports
          </h1>
          <p className="text-zinc-400 mt-2">Monitor open TCP ports and terminate unauthorized network listeners.</p>
        </div>
        <button
          onClick={fetchPorts}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-colors font-medium shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Scan Ports
        </button>
      </div>

      <div className="relative mb-6 shrink-0">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by Process Name or Port Number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-lg pl-10 pr-4 py-2.5 text-white outline-none transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-900/50 border border-zinc-800 rounded-xl relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
             <p className="text-zinc-500">Scanning TCP sockets...</p>
          </div>
        ) : !hasScanned ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
             <Globe className="w-12 h-12 mb-4 opacity-20" />
             <p>Click "Scan Ports" to find open network sockets.</p>
          </div>
        ) : filteredPorts.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
             <Globe className="w-12 h-12 mb-4 opacity-20" />
             <p>No open ports found matching your search.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-950/50 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-sm font-medium text-zinc-400 border-b border-zinc-800">Process Name</th>
                <th className="p-4 text-sm font-medium text-zinc-400 border-b border-zinc-800">PID</th>
                <th className="p-4 text-sm font-medium text-zinc-400 border-b border-zinc-800">Local Address</th>
                <th className="p-4 text-sm font-medium text-zinc-400 border-b border-zinc-800">Port</th>
                <th className="p-4 text-sm font-medium text-zinc-400 border-b border-zinc-800 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredPorts.map((port, idx) => (
                <tr key={`${port.PID}-${port.LocalPort}-${idx}`} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-zinc-500" />
                      <span className="font-medium text-zinc-200">{port.ProcessName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 font-mono text-sm">{port.PID}</td>
                  <td className="p-4 text-zinc-400 font-mono text-sm">{port.LocalAddress}</td>
                  <td className="p-4">
                    <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-1 rounded text-xs font-mono font-bold">
                      {port.LocalPort}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {port.PID === 0 || port.PID === 4 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                        <Lock className="w-3 h-3" /> System
                      </span>
                    ) : (
                      <button
                        onClick={() => handleKill(port)}
                        disabled={killing === port.PID}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      >
                        {killing === port.PID ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <><Skull className="w-3 h-3" /> Kill</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-zinc-500 flex items-center gap-2 shrink-0">
        <ShieldAlert className="w-4 h-4 text-yellow-500" />
        Killing a process instantly destroys it without saving. Use caution.
      </p>
    </div>
  );
}
