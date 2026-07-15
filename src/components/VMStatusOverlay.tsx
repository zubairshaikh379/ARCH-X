import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { X, Cpu, MemoryStick, Wifi, Power, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VMStatusOverlayProps {
  vmStatus: "running" | "provisioning";
  vmIP: string;
  vmPort: number;
  cpuHistory: number[];
  ramHistory: number[];
  courseTitle: string;
  onShutdown: () => void;
}

export default function VMStatusOverlay({
  vmStatus,
  vmIP,
  vmPort,
  cpuHistory,
  ramHistory,
  courseTitle,
  onShutdown,
}: VMStatusOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);

  const cpuNow = cpuHistory[cpuHistory.length - 1] ?? 0;
  const ramNow = ramHistory[ramHistory.length - 1] ?? 0;

  const cpuData = cpuHistory.map((v, i) => ({ t: i, v }));
  const ramData = ramHistory.map((v, i) => ({ t: i, v }));

  return (
    <motion.div
      className="vm-overlay"
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="glass" style={{ overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderBottom: collapsed ? "none" : "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className={vmStatus === "running" ? "dot-online" : "dot-pending"} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>
              {vmStatus === "provisioning" ? "PROVISIONING…" : "VM ONLINE"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: "2px" }}
            >
              {collapsed ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              onClick={onShutdown}
              title="Shutdown VM"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: "2px" }}
            >
              <Power size={13} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0.875rem 1rem" }}>
                {/* Course */}
                <div style={{ marginBottom: "0.875rem" }}>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-3)", marginBottom: "0.2rem" }}>Active Session</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-1)", fontWeight: 500 }}>{courseTitle}</div>
                </div>

                {/* Connection info */}
                <div style={{
                  display: "flex", gap: "0.5rem", alignItems: "center",
                  padding: "0.5rem 0.75rem",
                  background: "var(--accent-dim)",
                  border: "1px solid rgba(34,211,238,0.12)",
                  borderRadius: "6px",
                  marginBottom: "0.875rem",
                }}>
                  <Wifi size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                    {vmIP}:{vmPort}
                  </span>
                </div>

                {/* CPU Chart */}
                <div style={{ marginBottom: "0.625rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Cpu size={11} style={{ color: "var(--accent)" }} />
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>CPU</span>
                    </div>
                    <span style={{ fontSize: "0.6875rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {cpuNow.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: "40px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cpuData}>
                        <defs>
                          <linearGradient id="cpu-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={1.5}
                          fill="url(#cpu-grad)" dot={false} />
                        <Tooltip
                          contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "0.7rem", color: "var(--text-1)" }}
                          itemStyle={{ color: "var(--accent)" }}
                          formatter={(v: number) => [`${v.toFixed(1)}%`, "CPU"]}
                          labelFormatter={() => ""}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* RAM Chart */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <MemoryStick size={11} style={{ color: "var(--purple)" }} />
                      <span style={{ fontSize: "0.6875rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>RAM</span>
                    </div>
                    <span style={{ fontSize: "0.6875rem", color: "var(--purple)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {ramNow.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: "40px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ramData}>
                        <defs>
                          <linearGradient id="ram-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--purple)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--purple)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke="var(--purple)" strokeWidth={1.5}
                          fill="url(#ram-grad)" dot={false} />
                        <Tooltip
                          contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "0.7rem", color: "var(--text-1)" }}
                          itemStyle={{ color: "var(--purple)" }}
                          formatter={(v: number) => [`${v.toFixed(1)}%`, "RAM"]}
                          labelFormatter={() => ""}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
