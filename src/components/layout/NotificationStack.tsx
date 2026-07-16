import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import type { Notification } from "../../types";

interface NotificationStackProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const ICONS = {
  success: <CheckCircle  size={15} style={{ color: "#4ade80" }} />,
  error:   <XCircle      size={15} style={{ color: "#f87171" }} />,
  warning: <AlertTriangle size={15} style={{ color: "#facc15" }} />,
  info:    <Info          size={15} style={{ color: "var(--accent)" }} />,
};

export default function NotificationStack({ notifications, onDismiss }: NotificationStackProps) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[notifications.length - 1];
    const timer = setTimeout(() => onDismiss(latest.id), 4000);
    return () => clearTimeout(timer);
  }, [notifications, onDismiss]);

  return (
    <div style={{
      position: "fixed",
      top: "1.25rem",
      right: "1.5rem",
      zIndex: 200,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      maxWidth: "360px",
      width: "100%",
      pointerEvents: "none",
    }}>
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 40, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`glass notif-${n.type}`}
            style={{
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.625rem",
              pointerEvents: "all",
              cursor: "default",
            }}
          >
            <div style={{ flexShrink: 0, marginTop: "1px" }}>{ICONS[n.type]}</div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-1)", lineHeight: 1.5, flex: 1 }}>
              {n.message}
            </p>
            <button
              onClick={() => onDismiss(n.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-3)", padding: "2px", flexShrink: 0,
                display: "flex", alignItems: "center", transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
