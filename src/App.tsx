import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { motion } from "motion/react";
import { AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";
import { ProfileStore, usernameFromSession, signOut } from "./lib/auth";
import SecurityCard, { useSecurityGaps } from "./components/SecurityCard";
import { ACCENT_COLORS, DEFAULT_PROFILE } from "./types";
import type { UserProfile, Notification, VmStatus, AppPage, AppTab } from "./types";
import type { Course } from "./data/courses";
import { COURSES } from "./data/courses";

import LandingPage     from "./pages/LandingPage";
import AuthPage        from "./pages/AuthPage";
import HomePage        from "./pages/HomePage";
import CoursesPage     from "./pages/CoursesPage";
import OsintPage       from "./pages/OsintPage";
import CommunityPage   from "./pages/CommunityPage";
import ProfilePage     from "./pages/ProfilePage";
import SettingsPage     from "./pages/SettingsPage";
import PasswordRecoveryModal from "./components/PasswordRecoveryModal";
import Sidebar         from "./components/layout/Sidebar";
import NotificationStack from "./components/layout/NotificationStack";
import VMStatusOverlay from "./components/VMStatusOverlay";

// ─── Pure terminal command executor ──────────────────────────────
// Supports a per-course virtual filesystem (ls/cat/grep), an `objective`
// command, progressive `hint`s, and {{FLAG}} substitution so the correct
// command chain reveals the exact flag the platform will accept.
function executeCmd(
  cmd: string,
  course: Course,
  username: string,
  ip: string,
  port: number,
  flag: string
): string {
  const parts = cmd.trim().split(/\s+/);
  const base  = parts[0].toLowerCase();
  const sim   = course.simulation;

  // Replace the {{FLAG}} placeholder with the live flag for this container.
  const sub = (s: string) => s.replace(/\{\{FLAG\}\}/g, flag || "ARCHX_FLAG_PENDING");

  // Virtual filesystem: course-provided files + sensible defaults.
  const files: { [name: string]: string } = {
    "flag.txt": "[ENCRYPTED] Complete the mission objective to reveal the flag. Type 'objective'.",
    ".env":     `CONTAINER_IP=${ip}\nCONTAINER_PORT=${port}\nVM_STATUS=RUNNING`,
    "notes.md": "# Mission Notes\nType 'objective' to see your goal, 'hint' for progressive guidance,\nand 'ls' to explore the files in this container.",
    ...(sim.files || {}),
  };
  const fileNames = Object.keys(files);

  switch (base) {
    case "help":
      return [
        "Core commands:",
        "  objective      — Show the mission goal",
        "  hint [n]       — Progressive hints (hint 1, hint 2, …). Guidance, not the answer.",
        "  ls             — List files in the container",
        "  cat [file]     — Read a file's contents",
        "  grep [p] [f]   — Search for pattern p inside file f",
        "  whoami / pwd   — Operator identity / working directory",
        "  env            — Container environment variables",
        "  uname -a       — System information",
        "  nmap [target]  — Network port scan",
        "  ping [target]  — Ping a host",
        "  clear          — Clear terminal",
        "",
        "This lab accepts many commands — explore freely. Course-specific",
        "actions are listed in the SOP tab. Start with: objective",
      ].join("\n");

    case "objective":
      return sim.objective
        || "Investigate the container, identify the threat, and execute the corrective action. Type 'hint' if you get stuck.";

    case "hint": {
      const hints = sim.hints || [];
      if (!hints.length) return "No hints are available for this mission — check the Guidebook tab.";
      if (!parts[1]) {
        return [
          `This mission has ${hints.length} progressive hints.`,
          `Reveal them one at a time:  hint 1   …   hint ${hints.length}`,
          "Each hint nudges you closer — the final answer is never given away.",
        ].join("\n");
      }
      const n = parseInt(parts[1], 10);
      if (isNaN(n) || n < 1 || n > hints.length) return `Invalid hint. Use: hint 1 .. hint ${hints.length}`;
      return `HINT ${n}/${hints.length} ▸ ${hints[n - 1]}`;
    }

    case "whoami":
      return username;

    case "pwd":
      return `/home/${username}/workspace/${course.id}`;

    case "ls":
      return fileNames.join("  ");

    case "cat": {
      if (!parts[1]) return "cat: missing file operand";
      const content = files[parts[1]];
      if (content === undefined) return `cat: ${parts[1]}: No such file or directory`;
      return sub(content);
    }

    case "grep": {
      // grep <pattern> <file>
      if (parts.length < 3) return "grep: usage: grep <pattern> <file>\n(Tip: grep root audit_log.json)";
      const pattern = parts[1].toLowerCase();
      const fname   = parts[parts.length - 1];
      const content = files[fname];
      if (content === undefined) return `grep: ${fname}: No such file or directory`;
      const matched = sub(content).split("\n").filter(l => l.toLowerCase().includes(pattern));
      return matched.length ? matched.join("\n") : `(no matches for '${parts[1]}' in ${fname})`;
    }

    case "env":
      return `CONTAINER_IP=${ip}\nCONTAINER_PORT=${port}\nVM_ORCHESTRATOR=ARCH-X\nDOCKER_STATUS=RUNNING\nACTIVE_OPERATOR=${username}\nCOURSE_ID=${course.id}`;

    case "uname":
      return "Linux arch-x-ctf-vm 6.1.0-arch1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux";

    case "date":
      return new Date().toString();

    case "ping": {
      const t = parts[1] || ip;
      return `PING ${t}: 56 bytes\n64 bytes from ${t}: icmp_seq=0 ttl=64 time=0.42ms\n64 bytes from ${t}: icmp_seq=1 ttl=64 time=0.39ms\n3 packets transmitted, 3 received, 0% packet loss`;
    }

    case "nmap": {
      const t = parts[parts.length - 1] || ip;
      return `Starting Nmap 7.95\nScan report for ${t}\nPORT    STATE  SERVICE\n22/tcp  open   ssh\n80/tcp  open   http\n443/tcp open   https\nDone: 1 host up in 2.31s`;
    }

    case "ssh":
      return `Connected to ${parts[parts.length - 1] || ip}:22\nWelcome to ARCH-X Training VM\nType 'exit' to disconnect.`;

    case "sudo":
      return `[sudo] password for ${username}:\nsudo: permission denied — escalate through course missions.`;

    case "history":
      return "(Scroll up to review session history)";

    case "exit":
      return "Session ended. Reconnect with: ssh operator@" + ip;

    default: {
      // Exact course command lookup (flag-substituted)
      const exact = sim.commands[cmd] || sim.commands[cmd.toLowerCase()];
      if (exact) return sub(exact);

      // Fuzzy match by base verb
      const fuzzy = Object.entries(sim.commands)
        .find(([k]) => k.toLowerCase().startsWith(base));
      if (fuzzy) {
        return `Command not found: '${cmd}'\nDid you mean: ${fuzzy[0]}?\n(Type 'hint' for guidance, or check the SOP tab)`;
      }

      return `Command not found: '${cmd}'\nType 'help' for commands, 'objective' for your goal, or 'hint' for guidance.`;
    }
  }
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  // ── Routing ──────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage]             = useState<AppPage>("landing");
  const [authMode, setAuthMode]     = useState<"login" | "register">("login");
  const [activeTab, setActiveTab]   = useState<AppTab>("home");

  // ── User ─────────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // ── Course + VM ───────────────────────────────────────────────
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [vmStatus,  setVmStatus]  = useState<VmStatus>("off");
  const [vmIP,      setVmIP]      = useState("");
  const [vmPort,    setVmPort]    = useState(22);
  const [vmFlag,    setVmFlag]    = useState("");
  const [vmCpuHistory, setVmCpuHistory] = useState<number[]>([]);
  const [vmRamHistory, setVmRamHistory] = useState<number[]>([]);

  // ── Terminal (lifted so it persists across tab switches) ──────
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "[ARCH-X Terminal v2.0]",
    'Type "help" for available commands.',
    'Select a course and start the container to begin.',
  ]);

  // ── Notifications ─────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Stable ref to avoid stale closure in addXp
  const userProfileRef = useRef(userProfile);
  useEffect(() => { userProfileRef.current = userProfile; }, [userProfile]);

  // Tracks the currently-authed username so auth-state events don't re-init mid-session
  const authedUserRef = useRef<string | null>(null);

  // Post-login "secure your account" nudge (dismissible per session)
  const [securityDismissed, setSecurityDismissed] = useState(false);
  const securityGaps = useSecurityGaps(userProfile.username);

  // Password-reset link lands here → show a set-new-password modal
  const [recoveryMode, setRecoveryMode] = useState(false);

  // ── Accent color → CSS variable ───────────────────────────────
  useEffect(() => {
    const col = ACCENT_COLORS[userProfile.accentColor];
    if (!col) return;
    document.documentElement.style.setProperty("--accent",      col.hex);
    document.documentElement.style.setProperty("--accent-glow", `${col.hex}38`);
    document.documentElement.style.setProperty("--accent-dim",  `${col.hex}14`);
  }, [userProfile.accentColor]);

  // ── VM metrics simulation ─────────────────────────────────────
  useEffect(() => {
    if (vmStatus !== "running") return;
    const id = setInterval(() => {
      const t   = Date.now() / 1000;
      const cpu = Math.max(5,  Math.min(95, 25 + Math.sin(t / 3.1) * 18 + Math.random() * 12));
      const ram = Math.max(20, Math.min(90, 42 + Math.cos(t / 4.2) * 12 + Math.random() * 8));
      setVmCpuHistory(h => [...h.slice(-40), cpu]);
      setVmRamHistory(h => [...h.slice(-40), ram]);
    }, 1000);
    return () => clearInterval(id);
  }, [vmStatus]);

  // ── Session restore on mount ──────────────────────────────────
  // Supabase Auth owns the JWT session (auto-persisted). Restore it, and
  // subscribe to auth changes so email-link confirmation / token refresh /
  // sign-out anywhere keep the UI in sync.
  useEffect(() => {
    // Only (re)initialize the app when the *active user* actually changes —
    // TOKEN_REFRESHED / USER_UPDATED events must not reset terminal & page state.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        authedUserRef.current = null;
        setIsLoggedIn(false);
        return;
      }
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      const u = usernameFromSession(session);
      if (u && u !== authedUserRef.current) {
        authedUserRef.current = u;
        handleAuthSuccess(u);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────
  const triggerNotification = useCallback((message: string, type: Notification["type"] = "info") => {
    setNotifications(prev => [
      ...prev.slice(-4),
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, type },
    ]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const saveProfile = useCallback(async (profile: UserProfile) => {
    setUserProfile(profile);
    ProfileStore.save(profile.username, profile as unknown as Record<string, unknown>);
    try {
      await supabase.from("profiles").upsert({
        username:          profile.username,
        callsign:          profile.callsign,
        accent_color:      profile.accentColor,
        xp:                profile.xp,
        level:             profile.level,
        completed_courses: profile.completedCourses,
        completed_osint:   profile.completedOsint,
        updated_at:        new Date().toISOString(),
      }, { onConflict: "username" });
    } catch { /* silent — localStorage is the fallback */ }
  }, []);

  const addXp = useCallback((amount: number, message: string) => {
    setUserProfile(prev => {
      const nextXp    = prev.xp + amount;
      const nextLevel = Math.floor(nextXp / 1000) + 1;
      const updated   = { ...prev, xp: nextXp, level: nextLevel };
      ProfileStore.save(prev.username, updated as unknown as Record<string, unknown>);
      void supabase.from("profiles")
        .update({ xp: nextXp, level: nextLevel })
        .eq("username", prev.username)
        .then(undefined, () => {});
      return updated;
    });
    triggerNotification(`+${amount} XP — ${message}`, "success");
  }, [triggerNotification]);

  // ── Auth ──────────────────────────────────────────────────────
  const handleAuthSuccess = useCallback(async (username: string) => {
    authedUserRef.current = username;
    setSecurityDismissed(false);

    // Start from default + any local save
    const local = ProfileStore.get(username) as Partial<UserProfile> | null;
    let profile: UserProfile = {
      ...DEFAULT_PROFILE,
      username,
      ...(local || {}),
    };

    // Sync from Supabase
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (data) {
        profile = {
          ...profile,
          callsign:         data.callsign      || profile.callsign,
          accentColor:      data.accent_color  || profile.accentColor,
          xp:               Math.max(profile.xp, data.xp || 0),
          level:            Math.max(profile.level, data.level || 1),
          completedCourses: Array.from(new Set([
            ...profile.completedCourses,
            ...(data.completed_courses || []),
          ])),
          completedOsint:   Array.from(new Set([
            ...(profile.completedOsint || []),
            ...(data.completed_osint   || []),
          ])),
        };
      } else if (uid) {
        // First login — create the Supabase profile keyed by auth.uid()
        // (strict RLS: insert own where auth.uid() = id).
        await supabase.from("profiles").insert({
          id:                uid,
          username,
          callsign:          profile.callsign,
          accent_color:      profile.accentColor,
          xp:                profile.xp,
          level:             profile.level,
          completed_courses: profile.completedCourses,
          completed_osint:   profile.completedOsint,
        });
      }
    } catch { /* local fallback */ }

    ProfileStore.save(username, profile as unknown as Record<string, unknown>);
    setUserProfile(profile);
    setTerminalHistory([
      "[ARCH-X Terminal v2.0]",
      `Operator ${username} authenticated.`,
      'Type "help" for commands. Select a course and start a container to begin.',
    ]);
    setIsLoggedIn(true);
    setPage("landing"); // clear page state
  }, []);

  const handleLogout = useCallback(() => {
    authedUserRef.current = null;
    void signOut();
    setIsLoggedIn(false);
    setUserProfile(DEFAULT_PROFILE);
    setSelectedCourse(null);
    setVmStatus("off"); setVmFlag(""); setVmIP(""); setVmPort(22);
    setTerminalHistory(["[ARCH-X Terminal v2.0]", 'Type "help" for commands.']);
    setVmCpuHistory([]); setVmRamHistory([]);
    setActiveTab("home");
    setPage("landing");
  }, []);

  const handleClearAndLogout = useCallback(() => {
    const u = userProfileRef.current.username;
    ProfileStore.clear(u);
    handleLogout();
  }, [handleLogout]);

  // ── VM ────────────────────────────────────────────────────────
  const handleProvisionVM = useCallback(() => {
    if (!selectedCourse) {
      triggerNotification("Select a course before provisioning a container.", "warning");
      return;
    }
    if (vmStatus !== "off") {
      triggerNotification("Container is already active.", "info");
      return;
    }

    const key       = selectedCourse.id.toUpperCase().replace(/-/g, "_");
    const suffix    = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newFlag   = `ARCHX_${key}_CTF_${suffix}`;
    const oct       = () => Math.floor(Math.random() * 254) + 1;
    const newIP     = `10.${oct()}.${oct()}.${oct()}`;
    const newPort   = 22;

    setVmFlag(newFlag);
    setVmIP(newIP);
    setVmPort(newPort);
    setVmStatus("provisioning");
    setVmCpuHistory([]);
    setVmRamHistory([]);

    setTerminalHistory(prev => [
      ...prev,
      `[VM] Provisioning container for ${selectedCourse.title}…`,
      `[VM] Allocated: ${newIP}:${newPort}`,
      "[VM] Flag injected and encrypted.",
    ]);

    triggerNotification("Container provisioning — ready in ~3 seconds", "info");

    setTimeout(async () => {
      setVmStatus("running");
      setTerminalHistory(prev => [
        ...prev,
        `[VM ONLINE] ${newIP}:${newPort}`,
        selectedCourse.simulation.terminalWelcome || "Container ready. Type 'help' to begin.",
      ]);
      triggerNotification("Container online — mission active!", "success");

      try {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData.user?.id;
        if (uid) {
          await supabase.from("user_vms").upsert({
            user_id:   uid,
            username:  userProfileRef.current.username,
            course_id: selectedCourse.id,
            status:    "running",
            ip_address: newIP,
            port:      newPort,
            flag:      newFlag,
            solved:    false,
          }, { onConflict: "user_id,course_id" });
        }
      } catch { /* silent */ }
    }, 3500);
  }, [selectedCourse, vmStatus, triggerNotification]);

  const handleShutdownVM = useCallback(async () => {
    setVmStatus("off");
    setVmFlag(""); setVmIP(""); setVmPort(22);
    setVmCpuHistory([]); setVmRamHistory([]);
    setTerminalHistory(prev => [...prev, "[VM OFFLINE] Container shut down."]);
    triggerNotification("Container shut down.", "info");

    try {
      if (selectedCourse) {
        await supabase.from("user_vms")
          .update({ status: "off" })
          .eq("username", userProfileRef.current.username)
          .eq("course_id", selectedCourse.id);
      }
    } catch { /* silent */ }
  }, [selectedCourse, triggerNotification]);

  // FIXED: strict flag comparison — no substring / empty-flag bypass
  const handleSubmitFlag = useCallback(async (input: string) => {
    if (!vmFlag) {
      triggerNotification("No active container — start a VM first.", "error");
      return;
    }

    if (input.trim() === vmFlag) {
      triggerNotification("🚩 FLAG ACCEPTED — Mission complete!", "success");

      const courseId = selectedCourse?.id;
      if (courseId) {
        const newCompleted = Array.from(new Set([...userProfileRef.current.completedCourses, courseId]));
        const updated = { ...userProfileRef.current, completedCourses: newCompleted };
        await saveProfile(updated);

        try {
          await supabase.from("user_vms")
            .update({ solved: true, status: "off" })
            .eq("username", userProfileRef.current.username)
            .eq("course_id", courseId);
        } catch { /* silent */ }
      }

      addXp(400, `Course completed: ${selectedCourse?.title}`);
      setVmStatus("off");
      setVmFlag(""); setVmIP(""); setVmPort(22);
      setTerminalHistory(prev => [
        ...prev,
        "[MISSION COMPLETE] Flag accepted. Container secured.",
        "Return to the course list to select your next operation.",
      ]);
    } else {
      triggerNotification("Invalid flag — verify your attack output.", "error");
    }
  }, [vmFlag, selectedCourse, triggerNotification, saveProfile, addXp]);

  // ── Terminal (lifted — persists across tab switches) ──────────
  const handleCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed === "clear") {
      setTerminalHistory([]);
      return;
    }

    const prompt = `${userProfileRef.current.username}@arch-x:~$ ${trimmed}`;

    if (!selectedCourse) {
      setTerminalHistory(prev => [...prev, prompt, "No active course — select one from the Courses tab."]);
      return;
    }
    if (vmStatus !== "running") {
      setTerminalHistory(prev => [...prev, prompt, "[VM OFFLINE] Start the container to execute commands."]);
      return;
    }

    const output = executeCmd(trimmed, selectedCourse, userProfileRef.current.username, vmIP, vmPort, vmFlag);
    setTerminalHistory(prev => [...prev, prompt, output]);
  }, [selectedCourse, vmStatus, vmIP, vmPort, vmFlag]);

  const handleClearTerminal = useCallback(() => setTerminalHistory([]), []);

  // ── OSINT completion ──────────────────────────────────────────
  const handleCompleteOsint = useCallback((id: string) => {
    setUserProfile(prev => {
      const newList = Array.from(new Set([...(prev.completedOsint || []), id]));
      const updated = { ...prev, completedOsint: newList };
      ProfileStore.save(prev.username, updated as unknown as Record<string, unknown>);
      void supabase.from("profiles")
        .update({ completed_osint: newList })
        .eq("username", prev.username)
        .then(undefined, () => {});
      return updated;
    });
  }, []);

  // ── Profile update (from ProfilePage) ────────────────────────
  const handleUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...updates };
      ProfileStore.save(prev.username, updated as unknown as Record<string, unknown>);
      void supabase.from("profiles").upsert({
        username:          prev.username,
        callsign:          updated.callsign,
        accent_color:      updated.accentColor,
        xp:                updated.xp,
        level:             updated.level,
        completed_courses: updated.completedCourses,
        completed_osint:   updated.completedOsint,
        updated_at:        new Date().toISOString(),
      }, { onConflict: "username" }).then(undefined, () => {});
      return updated;
    });
  }, []);

  // ── Course selection (switch to courses tab) ──────────────────
  const handleSelectCourse = useCallback((course: (typeof selectedCourse)) => {
    setSelectedCourse(course);
    if (course) setActiveTab("courses");
  }, []);

  // ── Render ────────────────────────────────────────────────────

  // Not logged in
  if (!isLoggedIn) {
    if (page === "auth") {
      return (
        <AuthPage
          initialMode={authMode}
          onAuthSuccess={handleAuthSuccess}
          onBack={() => setPage("landing")}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={(mode = "login") => { setAuthMode(mode); setPage("auth"); }}
      />
    );
  }

  // ── App shell ─────────────────────────────────────────────────
  return (
    <>
      <div className="bg-mesh" />
      <div className="app-shell content-layer">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userProfile={userProfile}
          onLogout={handleLogout}
        />

        {/* Main content */}
        <main className="main-content">
          {/* Notifications */}
          <NotificationStack
            notifications={notifications}
            onDismiss={dismissNotification}
          />

          {/* VM overlay */}
          <AnimatePresence>
            {vmStatus !== "off" && (
              <VMStatusOverlay
                vmStatus={vmStatus as "running" | "provisioning"}
                vmIP={vmIP}
                vmPort={vmPort}
                cpuHistory={vmCpuHistory}
                ramHistory={vmRamHistory}
                courseTitle={selectedCourse?.title || ""}
                onShutdown={handleShutdownVM}
              />
            )}
          </AnimatePresence>

          {/* Tab content — AnimatePresence for smooth transitions */}
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ height: "100%", overflow: "auto" }}
              >
                {securityGaps && !securityDismissed && (
                  <div style={{ maxWidth: 640, margin: "0 auto 1.25rem", padding: "0 1rem" }}>
                    <SecurityCard
                      username={userProfile.username}
                      variant="card"
                      onDismiss={() => setSecurityDismissed(true)}
                    />
                  </div>
                )}
                <HomePage
                  userProfile={userProfile}
                  onTabChange={setActiveTab}
                />
              </motion.div>
            )}

            {activeTab === "courses" && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                <CoursesPage
                  selectedCourse={selectedCourse}
                  onSelectCourse={handleSelectCourse}
                  userProfile={userProfile}
                  vmStatus={vmStatus}
                  vmIP={vmIP}
                  vmPort={vmPort}
                  vmFlag={vmFlag}
                  vmCpuHistory={vmCpuHistory}
                  vmRamHistory={vmRamHistory}
                  terminalHistory={terminalHistory}
                  onCommand={handleCommand}
                  onClearTerminal={handleClearTerminal}
                  onProvisionVM={handleProvisionVM}
                  onShutdownVM={handleShutdownVM}
                  onSubmitFlag={handleSubmitFlag}
                  onAddXp={addXp}
                  onNotify={triggerNotification}
                />
              </motion.div>
            )}

            {activeTab === "osint" && (
              <motion.div
                key="osint"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ height: "100%", overflow: "auto" }}
              >
                <OsintPage
                  userProfile={userProfile}
                  onAddXp={addXp}
                  onCompleteOsint={handleCompleteOsint}
                />
              </motion.div>
            )}

            {activeTab === "community" && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ height: "100%", overflow: "auto" }}
              >
                <CommunityPage
                  userProfile={userProfile}
                  onNotify={triggerNotification}
                />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ height: "100%", overflow: "auto" }}
              >
                <ProfilePage
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onAddXp={addXp}
                  onNotify={triggerNotification}
                  onClearAndLogout={handleClearAndLogout}
                />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                style={{ height: "100%", overflow: "auto" }}
              >
                <SettingsPage
                  username={userProfile.username}
                  onNotify={triggerNotification}
                  onLogout={handleLogout}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {recoveryMode && (
        <PasswordRecoveryModal
          onDone={() => { setRecoveryMode(false); triggerNotification("Password updated. You're signed in.", "success"); }}
        />
      )}
    </>
  );
}
