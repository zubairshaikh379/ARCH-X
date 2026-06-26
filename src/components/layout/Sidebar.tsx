import type { ReactNode } from "react";
import { ArchXLogo } from "../ArchXLogo";
import type { UserProfile, AppTab } from "../../types";
import { COURSES } from "../../data/courses";
import {
  Home, BookOpen, Search, Users, User, LogOut,
  Shield, ChevronRight,
} from "lucide-react";

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  userProfile: UserProfile;
  onLogout: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: ReactNode; hint: string }[] = [
  { id: "home",      label: "Dashboard",  icon: <Home      size={16} />, hint: "Overview" },
  { id: "courses",   label: "Courses",    icon: <BookOpen  size={16} />, hint: `${COURSES.length} tracks` },
  { id: "osint",     label: "Operations", icon: <Search    size={16} />, hint: "OSINT missions" },
  { id: "community", label: "Intel",      icon: <Users     size={16} />, hint: "Community" },
  { id: "profile",   label: "Profile",    icon: <User      size={16} />, hint: "Settings & stats" },
];

const XP_TO_NEXT = 1000;

export default function Sidebar({ activeTab, onTabChange, userProfile, onLogout }: SidebarProps) {
  const xpInLevel = userProfile.xp % XP_TO_NEXT;
  const xpPct = (xpInLevel / XP_TO_NEXT) * 100;

  return (
    <aside className="sidebar content-layer">
      {/* Logo */}
      <div style={{ padding: "1.25rem 1rem 1rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <ArchXLogo size={28} className="text-[color:var(--accent)]" />
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.9375rem", letterSpacing: "-0.02em", color: "var(--text-1)" }}>
              ARCH-X
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--text-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
              CYB3R OPS PLATFORM
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0.75rem 0.625rem", display: "flex", flexDirection: "column", gap: "2px" }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            <span style={{ opacity: activeTab === item.id ? 1 : 0.6 }}>{item.icon}</span>
            <span>{item.label}</span>
            {activeTab === item.id && (
              <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />
            )}
          </button>
        ))}
      </nav>

      {/* Operator Status */}
      <div style={{ padding: "1rem 0.875rem", borderTop: "1px solid var(--border)" }}>
        {/* Level + XP */}
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "0.375rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)",
                fontFamily: "var(--font-mono)",
              }}>
                {userProfile.level}
              </div>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>
                  {userProfile.username || "Operator"}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
                  {userProfile.callsign}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6875rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {userProfile.xp.toLocaleString()} XP
              </div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-3)" }}>
                Lv {userProfile.level}
              </div>
            </div>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div style={{ marginTop: "0.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.625rem", color: "var(--text-3)" }}>
              {userProfile.completedCourses.length}/{COURSES.length} courses
            </div>
            <div style={{ fontSize: "0.625rem", color: "var(--text-3)" }}>
              {xpInLevel}/{XP_TO_NEXT}
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.375rem",
          padding: "0.375rem 0.625rem",
          background: "rgba(74,222,128,0.06)",
          border: "1px solid rgba(74,222,128,0.15)",
          borderRadius: "6px",
          marginBottom: "0.625rem",
        }}>
          <Shield size={11} style={{ color: "#4ade80" }} />
          <span style={{ fontSize: "0.6875rem", color: "#4ade80", fontFamily: "var(--font-mono)" }}>
            SESSION SECURE
          </span>
        </div>

        {/* Logout */}
        <button className="nav-item btn-ghost" onClick={onLogout} style={{ color: "var(--text-3)", width: "100%" }}>
          <LogOut size={14} />
          <span style={{ fontSize: "0.8125rem" }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
