import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Download, Award, Loader } from "lucide-react";

interface CertificateModalProps {
  open: boolean;
  onClose: () => void;
  operatorName: string;   // callsign or username
  username: string;
  courseTitle: string;
  courseId: string;
  level: number;
  xp: number;
}

const W = 1600;
const H = 1131;
const ACCENT = "#b9cbdd";   // icy platinum (brightened for legibility on dark cert)

/** Stable certificate id from user + course (no randomness → same cert every time). */
function certId(username: string, courseId: string): string {
  const seed = `${username.toLowerCase()}:${courseId}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `ARCHX-${h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`;
}

export default function CertificateModal({
  open, onClose, operatorName, username, courseTitle, courseId, level, xp,
}: CertificateModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);

  const id = certId(username, courseId);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRendering(true);

    const draw = (logo?: HTMLImageElement) => {
      // Background
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#04040d");
      g.addColorStop(1, "#0a0a1a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Outer frame
      ctx.strokeStyle = "rgba(34,211,238,0.55)";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, W - 80, H - 80);
      ctx.strokeStyle = "rgba(34,211,238,0.18)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(58, 58, W - 116, H - 116);

      // Corner accents
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 3;
      const c = 46, off = 40;
      [[off, off, 1, 1], [W - off, off, -1, 1], [off, H - off, 1, -1], [W - off, H - off, -1, -1]]
        .forEach(([x, y, dx, dy]) => {
          ctx.beginPath();
          ctx.moveTo(x, y + dy * c); ctx.lineTo(x, y); ctx.lineTo(x + dx * c, y);
          ctx.stroke();
        });

      // Watermark logo (faint, centered)
      if (logo) {
        ctx.globalAlpha = 0.05;
        const wm = 560;
        ctx.drawImage(logo, W / 2 - wm / 2, H / 2 - wm / 2 + 30, wm, wm);
        ctx.globalAlpha = 1;
        // Header logo
        const hl = 120;
        ctx.drawImage(logo, W / 2 - hl / 2, 96, hl, hl);
      }

      ctx.textAlign = "center";

      // Brand
      ctx.fillStyle = "#e8ecff";
      ctx.font = "800 40px Inter, system-ui, sans-serif";
      ctx.fillText("ARCH-X", W / 2, 268);
      ctx.fillStyle = "rgba(180,190,220,0.7)";
      ctx.font = "600 18px 'JetBrains Mono', monospace";
      ctx.fillText("C Y B E R   O P S   P L A T F O R M", W / 2, 298);

      // Title
      ctx.fillStyle = ACCENT;
      ctx.font = "700 26px 'JetBrains Mono', monospace";
      ctx.fillText("◈  CERTIFICATE OF COMPLETION  ◈", W / 2, 392);

      // Body
      ctx.fillStyle = "rgba(200,208,235,0.85)";
      ctx.font = "400 24px Inter, system-ui, sans-serif";
      ctx.fillText("This certifies that the operator", W / 2, 470);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 68px Inter, system-ui, sans-serif";
      ctx.fillText(operatorName || username, W / 2, 560);

      // underline
      const uw = Math.min(720, ctx.measureText(operatorName || username).width + 120);
      ctx.strokeStyle = "rgba(34,211,238,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W / 2 - uw / 2, 588); ctx.lineTo(W / 2 + uw / 2, 588); ctx.stroke();

      ctx.fillStyle = "rgba(200,208,235,0.85)";
      ctx.font = "400 24px Inter, system-ui, sans-serif";
      ctx.fillText("has successfully completed the training operation", W / 2, 650);

      ctx.fillStyle = ACCENT;
      ctx.font = "700 40px Inter, system-ui, sans-serif";
      wrapText(ctx, courseTitle, W / 2, 716, W - 320, 48);

      // Footer meta row
      const fy = 940;
      ctx.textAlign = "center";
      metaBlock(ctx, W / 2 - 380, fy, "DATE ISSUED", dateStr);
      metaBlock(ctx, W / 2, fy, "CERTIFICATE ID", id);
      metaBlock(ctx, W / 2 + 380, fy, "OPERATOR RANK", `Level ${level} · ${xp.toLocaleString()} XP`);

      // Signature line
      ctx.strokeStyle = "rgba(200,208,235,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(W / 2 - 200, 1030); ctx.lineTo(W / 2 + 200, 1030); ctx.stroke();
      ctx.fillStyle = "rgba(180,190,220,0.7)";
      ctx.font = "500 18px Inter, system-ui, sans-serif";
      ctx.fillText("Directed Training Command", W / 2, 1058);

      setRendering(false);
    };

    // Load logo, then draw (draw without it if it fails)
    const img = new Image();
    img.onload = () => draw(img);
    img.onerror = () => draw(undefined);
    img.src = "/ARCH-X%20LOGO.svg";

    // Safety: if the SVG is slow, draw a first pass immediately
    const t = setTimeout(() => { if (rendering) draw(undefined); }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, operatorName, username, courseTitle, courseId, level, xp]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ARCH-X_Certificate_${courseId}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 210,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass"
        style={{ width: "100%", maxWidth: "860px", padding: "1.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Award size={18} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 700 }}>Certificate of Completion</span>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)" }}>
          {rendering && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(4,4,13,0.6)", color: "var(--text-3)", zIndex: 1,
            }}>
              <Loader size={22} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>

        <button className="btn btn-accent" onClick={download} style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>
          <Download size={15} /> Download PNG
        </button>
      </motion.div>
    </div>
  );
}

/* ── canvas helpers ─────────────────────────────────────────── */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lh));
}

function metaBlock(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(150,160,195,0.65)";
  ctx.font = "600 15px 'JetBrains Mono', monospace";
  ctx.fillText(label, x, y);
  ctx.fillStyle = "#e8ecff";
  ctx.font = "600 20px Inter, system-ui, sans-serif";
  ctx.fillText(value, x, y + 30);
}
