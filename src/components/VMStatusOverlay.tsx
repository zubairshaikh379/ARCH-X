import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Server, Activity, Cpu, HardDrive, Clock, X, Minimize2, Maximize2 } from "lucide-react";

interface VMStatusOverlayProps {
  vmStatus: "off" | "provisioning" | "running";
  vmIP: string;
  vmPort: number;
  vmUptime: number;
  vmCPU: number;
  vmRAM: number;
  metricHistory: { time: string; cpu: number; ram: number }[];
  onShutdown: () => void;
}

export const VMStatusOverlay: React.FC<VMStatusOverlayProps> = ({
  vmStatus,
  vmIP,
  vmPort,
  vmUptime,
  vmCPU,
  vmRAM,
  metricHistory,
  onShutdown
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (vmStatus !== "running") return null;

  const formattedUptime = (() => {
    const mins = Math.floor(vmUptime / 60);
    const secs = vmUptime % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  })();

  // Simple custom tooltip for recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/90 border border-zinc-800 p-2 rounded shadow-2xl text-[10px] font-mono text-zinc-300">
          <p className="text-zinc-500 mb-0.5">Time: {payload[0].payload.time}</p>
          <p className="text-white font-bold">Value: {payload[0].value.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-white rounded-full p-4 flex items-center gap-2 shadow-2xl transition-all hover:scale-105 z-40 group cursor-pointer"
        id="vm-overlay-trigger"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-100"></span>
        </span>
        <Activity className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider">VM Metrics</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-40 transition-all overflow-hidden flex flex-col ${
        isMinimized ? "w-72 h-auto" : "w-96 h-[440px]"
      }`}
      id="vm-status-panel"
    >
      {/* Header */}
      <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-zinc-400 animate-pulse" />
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">Secure Sandbox Telemetry</h4>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">{vmIP}:{vmPort}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-900 rounded cursor-pointer"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-900 rounded cursor-pointer"
            title="Hide Widget"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time Indicators */}
      <div className="p-4 grid grid-cols-3 gap-2 bg-zinc-950/40">
        <div className="bg-zinc-950/80 border border-zinc-850 p-2.5 rounded-xl text-center">
          <div className="flex justify-center mb-1 text-zinc-500">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <p className="text-[9px] font-mono uppercase text-zinc-500 font-bold">CPU Core</p>
          <p className="text-sm font-mono text-white font-bold mt-0.5">{vmCPU.toFixed(1)}%</p>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-850 p-2.5 rounded-xl text-center">
          <div className="flex justify-center mb-1 text-zinc-500">
            <HardDrive className="w-3.5 h-3.5" />
          </div>
          <p className="text-[9px] font-mono uppercase text-zinc-500 font-bold">RAM Alloc</p>
          <p className="text-sm font-mono text-white font-bold mt-0.5">{vmRAM.toFixed(1)}M</p>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-850 p-2.5 rounded-xl text-center">
          <div className="flex justify-center mb-1 text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <p className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Uptime</p>
          <p className="text-sm font-mono text-white font-bold mt-0.5">{formattedUptime}</p>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Charts Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* CPU Chart */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full"></span> CPU Utilisation %
                </span>
                <span className="text-[10px] font-mono text-zinc-500">1-Sec Intervals</span>
              </div>
              <div className="h-28 bg-zinc-950/80 border border-zinc-850 rounded-xl p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 12]} tick={{ fill: "#52525b", fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cpu"
                      stroke="#d4d4d8"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#cpuGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RAM Chart */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></span> RAM Consumption (MB)
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Peak Tracker</span>
              </div>
              <div className="h-28 bg-zinc-950/80 border border-zinc-850 rounded-xl p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricHistory} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#71717a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[23, 27]} tick={{ fill: "#52525b", fontSize: 9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="ram"
                      stroke="#71717a"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#ramGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-850 flex justify-between items-center">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              Secure Socket Channel Live
            </span>
            <button
              onClick={onShutdown}
              className="text-[10px] font-mono font-bold text-rose-400 hover:text-rose-300 border border-zinc-800 hover:bg-rose-950/20 px-3 py-1.5 rounded uppercase tracking-wider transition-all cursor-pointer"
            >
              Kill VM Box
            </button>
          </div>
        </>
      )}
    </div>
  );
};
