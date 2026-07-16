import { motion } from "framer-motion";
import { COURSES, OSINT_CHALLENGES } from "../data/courses";
import type { UserProfile, AppTab } from "../types";
import { BookOpen, Search, Trophy, Zap, ArrowRight, Shield } from "lucide-react";

interface HomePageProps {
  userProfile: UserProfile;
  onTabChange: (tab: AppTab) => void;
}

export default function HomePage({ userProfile, onTabChange }: HomePageProps) {
  const totalCourses = COURSES.length;
  const totalOsint   = OSINT_CHALLENGES.length;
  const doneCourses  = userProfile.completedCourses.length;
  const doneOsint    = (userProfile.completedOsint || []).length;
  const xpInLevel    = userProfile.xp % 1000;
  const nextCourse   = COURSES.find(c => !userProfile.completedCourses.includes(c.id));

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: "2rem" }}
      >
        <div className="label-mono" style={{ marginBottom: "0.625rem" }}>◈ OPERATOR DASHBOARD</div>
        <h1 className="heading-xl" style={{ marginBottom: "0.5rem" }}>
          Welcome back,{" "}
          <span style={{ color: "var(--accent)" }}>{userProfile.username}</span>
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: "0.9375rem" }}>
          {userProfile.callsign} · Level {userProfile.level} · {userProfile.xp.toLocaleString()} XP total
        </p>
      </motion.div>

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Zap size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontWeight: 600 }}>Level {userProfile.level} Progress</span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--accent)" }}>
            {xpInLevel} / 1000 XP
          </span>
        </div>
        <div className="xp-bar-track" style={{ height: "6px" }}>
          <div className="xp-bar-fill" style={{ width: `${(xpInLevel / 1000) * 100}%` }} />
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.375rem" }}>
          {1000 - xpInLevel} XP to Level {userProfile.level + 1}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "0.875rem",
        marginBottom: "2rem",
      }}>
        {[
          { icon: <BookOpen size={18} />, value: `${doneCourses}/${totalCourses}`, label: "Courses Completed", color: "var(--accent)", action: () => onTabChange("courses") },
          { icon: <Search   size={18} />, value: `${doneOsint}/${totalOsint}`,     label: "OSINT Ops Solved",  color: "var(--purple)", action: () => onTabChange("osint") },
          { icon: <Trophy   size={18} />, value: `#${userProfile.level}`,           label: "Current Rank",      color: "#facc15",       action: () => onTabChange("profile") },
          { icon: <Shield   size={18} />, value: `${Math.round((doneCourses / totalCourses) * 100)}%`, label: "Platform Progress", color: "#4ade80", action: () => onTabChange("courses") },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="stat-card"
            onClick={s.action}
            style={{ cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <div style={{ color: s.color, marginBottom: "0.75rem" }}>{s.icon}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "0.25rem" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-3)" }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Continue / Next up */}
      {nextCourse && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginBottom: "2rem" }}
        >
          <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>◈ NEXT MISSION</div>
          <div
            className="glass"
            style={{ padding: "1.5rem", cursor: "pointer", transition: "all 0.25s" }}
            onClick={() => onTabChange("courses")}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "rgba(34,211,238,0.03)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span className={`badge badge-${nextCourse.difficulty.toLowerCase()}`}>{nextCourse.difficulty}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-3)" }}>{nextCourse.estimatedTime}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.375rem" }}>{nextCourse.title}</div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>{nextCourse.shortDesc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--accent)", flexShrink: 0, marginLeft: "1rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Launch</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="label-mono" style={{ fontSize: "0.65rem", marginBottom: "0.875rem" }}>◈ QUICK ACCESS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.625rem" }}>
          {[
            { label: "Browse All Courses", tab: "courses" as AppTab, icon: <BookOpen size={14} /> },
            { label: "OSINT Operations",   tab: "osint"   as AppTab, icon: <Search size={14} /> },
            { label: "Community Board",    tab: "community" as AppTab, icon: <Trophy size={14} /> },
            { label: "My Profile",         tab: "profile"  as AppTab, icon: <Shield size={14} /> },
          ].map(item => (
            <button
              key={item.tab}
              className="btn btn-outline"
              onClick={() => onTabChange(item.tab)}
              style={{ justifyContent: "flex-start", gap: "0.5rem" }}
            >
              {item.icon}
              {item.label}
              <ArrowRight size={13} style={{ marginLeft: "auto", opacity: 0.5 }} />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
