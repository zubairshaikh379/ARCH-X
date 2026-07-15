import { useRef, useEffect } from "react";
import type { FormEvent } from "react";
import type { VmStatus } from "../../types";
import { Terminal as TerminalIcon, X, Power, Loader } from "lucide-react";

interface TerminalProps {
  history: string[];
  vmStatus: VmStatus;
  vmIP: string;
  vmPort: number;
  username: string;
  courseTitle?: string;
  onCommand: (cmd: string) => void;
  onClear: () => void;
}

export default function Terminal({
  history,
  vmStatus,
  vmIP,
  vmPort,
  username,
  courseTitle,
  onCommand,
  onClear,
}: TerminalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new output
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  const prompt = `${username}@arch-x:~$`;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input) return;
    const cmd = input.value.trim();
    if (!cmd) return;
    onCommand(cmd);
    input.value = "";
  };

  return (
    <div className="terminal-wrap" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Title bar */}
      <div className="terminal-bar">
        <div className="terminal-dot" style={{ background: "#f87171" }} />
        <div className="terminal-dot" style={{ background: "#facc15" }} />
        <div className="terminal-dot" style={{ background: "#4ade80" }} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", paddingLeft: "0.5rem" }}>
          <TerminalIcon size={11} style={{ color: "var(--text-3)" }} />
          <span style={{ fontSize: "0.6875rem", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            {courseTitle ? `${courseTitle} — ` : ""}
            {vmStatus === "running"
              ? `Connected · ${vmIP}:${vmPort}`
              : vmStatus === "provisioning"
                ? "Provisioning…"
                : "VM Offline"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {vmStatus === "provisioning" && (
            <Loader size={11} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          )}
          {vmStatus === "running" && (
            <div className="dot-online" />
          )}
          <button
            onClick={onClear}
            title="Clear terminal"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Output body */}
      <div
        ref={bodyRef}
        className="terminal-body"
        style={{ flex: 1, overflowY: "auto" }}
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((line, i) => {
          const isPrompt = line.includes(`${username}@arch-x`);
          const isError = line.startsWith("Command not found") || line.startsWith("Error") || line.includes("permission denied");
          const isSuccess = line.includes("FLAG:") || line.includes("SUCCESS") || line.includes("SOLVED");
          const isSystem = line.startsWith("ARCH-X Terminal") || line.startsWith("[SYSTEM]") || line.startsWith("[VM]");

          return (
            <div
              key={i}
              style={{
                color: isPrompt
                  ? "var(--accent)"
                  : isError
                    ? "#f87171"
                    : isSuccess
                      ? "#4ade80"
                      : isSystem
                        ? "var(--purple)"
                        : "inherit",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {line}
            </div>
          );
        })}

        {vmStatus === "off" && (
          <div style={{ color: "#f87171", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Power size={12} />
            VM is offline — start the container to use the terminal
          </div>
        )}
      </div>

      {/* Input */}
      <form className="terminal-input-row" onSubmit={handleSubmit}>
        <span className="terminal-prompt" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", flexShrink: 0 }}>
          {prompt}
        </span>
        <input
          ref={inputRef}
          className="terminal-input"
          placeholder={vmStatus !== "running" ? "Start VM to use terminal…" : ""}
          disabled={vmStatus !== "running"}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </form>
    </div>
  );
}
