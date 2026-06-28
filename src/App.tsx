import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { motion } from "motion/react";
import { AnimatePresence } from "motion/react";
import { supabase } from "./lib/supabase";
import {
  ProfileStore, getSession, onAuthChange, signOut,
  usernameFromUser, isMfaEnabled,
} from "./lib/auth";
import type { User } from "@supabase/supabase-js";
import { ACCENT_COLORS, DEFAULT_PROFILE } from "./types";
import type { UserProfile, Notification, VmStatus, AppPage, AppTab } from "./types";
import type { Course } from "./data/courses";

import LandingPage     from "./pages/LandingPage";
import AuthPage        from "./pages/AuthPage";
import HomePage        from "./pages/HomePage";
import CoursesPage     from "./pages/CoursesPage";
import OsintPage       from "./pages/OsintPage";
import CommunityPage   from "./pages/CommunityPage";
import ProfilePage     from "./pages/ProfilePage";
import Sidebar         from "./components/layout/Sidebar";
import NotificationStack from "./components/layout/NotificationStack";
import VMStatusOverlay from "./components/VMStatusOverlay";

// ─── Pure terminal command executor ──────────────────────────────
function executeCmd(
  cmd: string,
  course: Course,
  username: string,
  ip: string,
  port: number
): string {
  const parts = cmd.trim().split(/\s+/);
  const base  = parts[0].toLowerCase();

  switch (base) {
    case "help":
      return [
        "Available commands:",
        "  help           — Show this message",
        "  whoami         — Current operator ID",
        "  pwd            — Working directory",
        "  ls             — List files",
        "  cat [file]     — Read file (try: flag.txt, .env, notes.md)",
        "  env            — Container environment variables",
        "  uname -a       — System information",
        "  nmap [target]  — Network port scan",
        "  ping [target]  — Ping a host",
        "  ssh [host]     — Open SSH session",
        "  clear          — Clear terminal",
        "",
        "Course-specific commands are listed in the SOP tab.",
      ].join("\n");

    case "whoami":
      return username;

    case "pwd":
      return `/home/${username}/workspace/${course.id}`;

    case "ls":
      return "flag.txt  .env  notes.md  workspace/  logs/  captures/";

    case "cat":
      if (!parts[1])         return "cat: missing file operand";
      if (parts[1] === "flag.txt")  return "[ENCRYPTED] Use the course attack vectors to retrieve the flag.";
      if (parts[1] === ".env")      return `CONTAINER_IP=${ip}\nCONTAINER_PORT=${port}\nVM_STATUS=RUNNING`;
      if (parts[1] === "notes.md")  return "# Mission Notes\nReview the SOP tab for step-by-step guidance.";
      return `cat: ${parts[1]}: No such file or directory`;

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

    case "grep":
      return "grep: usage: grep [PATTERN] [FILE]\n(Tip: Try grepping your logs/ directory)";

    default: {
      // Exact course command lookup
      const exact = course.simulation.commands[cmd]
                 || course.simulation.commands[cmd.toLowerCase()];
      if (exact) return exact;

      // Fuzzy match by base verb
      const fuzzy = Object.entries(course.simulation.commands)
        .find(([k]) => k.toLowerCase().startsWith(base));
      if (fuzzy) {
        return `Command not found: '${cmd}'\nDid you mean: ${fuzzy[0]}?\n(Check the SOP tab for exact syntax)`;
      }

      return `Command not found: '${cmd}'\nType 'help' for a list of available commands.`;
    }
  }
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  // ── Routing ──────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage]             = useState<AppPage>("landing");
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
  // Restore from the Supabase Auth session (a verified JWT), not a forgeable
  // localStorage username. Also reacts to sign-out from any tab.
  useEffect(() => {
    let active = true;
    getSession().then(session => {
      if (active && session?.user) handleAuthSuccess(session.user);
    });
    // React to sign-out (this tab, another tab, or token expiry).
    const unsub = onAuthChange(session => {
      if (!session) {
        setIsLoggedIn(false);
        setUserProfile(DEFAULT_PROFILE);
      }
    });
    return () => { active = false; unsub(); };
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
    ProfileStore.save(profile.id, profile as unknown as Record<string, unknown>);
    try {
      await supabase.from("profiles").upsert({
        id:                profile.id,
        username:          profile.username,
        callsign:          profile.callsign,
        accent_color:      profile.accentColor,
        xp:                profile.xp,
        level:             profile.level,
        completed_courses: profile.completedCourses,
        completed_osint:   profile.completedOsint,
        bio:               profile.bio,
        avatar:            profile.avatar,
        last_diagnostics_run: profile.lastDiagnosticsRun,
        updated_at:        new Date().toISOString(),
      }, { onConflict: "id" });
    } catch { /* silent — localStorage is the fallback */ }
  }, []);

  const addXp = useCallback((amount: number, message: string) => {
    setUserProfile(prev => {
      const nextXp    = prev.xp + amount;
      const nextLevel = Math.floor(nextXp / 1000) + 1;
      const updated   = { ...prev, xp: nextXp, level: nextLevel };
      ProfileStore.save(prev.id, updated as unknown as Record<string, unknown>);
      void supabase.from("profiles")
        .update({ xp: nextXp, level: nextLevel })
        .eq("id", prev.id)
        .then(undefined, () => {});
      return updated;
    });
    triggerNotification(`+${amount} XP — ${message}`, "success");
  }, [triggerNotification]);

  // ── Auth ──────────────────────────────────────────────────────
  const handleAuthSuccess = useCallback(async (user: User) => {
    const id = user.id;
    const username = usernameFromUser(user);
    const email = user.email ?? "";

    // Start from default + any local cache (keyed by auth user id)
    const local = ProfileStore.get(id) as Partial<UserProfile> | null;
    let profile: UserProfile = {
      ...DEFAULT_PROFILE,
      ...(local || {}),
      id,
      username,
      email,
    };

    // Sync from Supabase
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        profile = {
          ...profile,
          callsign:           data.callsign      || profile.callsign,
          accentColor:        data.accent_color  || profile.accentColor,
          xp:                 Math.max(profile.xp, data.xp || 0),
          level:              Math.max(profile.level, data.level || 1),
          bio:                data.bio ?? profile.bio,
          avatar:             data.avatar ?? profile.avatar,
          lastDiagnosticsRun: data.last_diagnostics_run ?? profile.lastDiagnosticsRun,
          completedCourses: Array.from(new Set([
            ...profile.completedCourses,
            ...(data.completed_courses || []),
          ])),
          completedOsint:   Array.from(new Set([
            ...(profile.completedOsint || []),
            ...(data.completed_osint   || []),
          ])),
        };
      } else {
        // Profile row missing (e.g. signup trigger not installed) — create it.
        await supabase.from("profiles").upsert({
          id,
          username,
          callsign:          profile.callsign,
          accent_color:      profile.accentColor,
          xp:                profile.xp,
          level:             profile.level,
          completed_courses: profile.completedCourses,
          completed_osint:   profile.completedOsint,
        }, { onConflict: "id" });
      }
    } catch { /* local fallback */ }

    try { profile.mfaEnabled = await isMfaEnabled(); } catch { /* ignore */ }

    ProfileStore.save(id, profile as unknown as Record<string, unknown>);
    setUserProfile(profile);
    setTerminalHistory([
      "[ARCH-X Terminal v2.0]",
      `Operator ${username} authenticated.`,
      'Type "help" for commands. Select a course and start a container to begin.',
    ]);
    setIsLoggedIn(true);
    setPage("landing"); // clear page state
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
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
    ProfileStore.clear(userProfileRef.current.id);
    void handleLogout();
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
        await supabase.from("user_vms").upsert({
          user_id:   userProfileRef.current.id,
          course_id: selectedCourse.id,
          status:    "running",
          ip_address: newIP,
          port:      newPort,
          flag:      newFlag,
          solved:    false,
        }, { onConflict: "user_id,course_id" });
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
          .eq("user_id", userProfileRef.current.id)
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
            .eq("user_id", userProfileRef.current.id)
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

    const output = executeCmd(trimmed, selectedCourse, userProfileRef.current.username, vmIP, vmPort);
    setTerminalHistory(prev => [...prev, prompt, output]);
  }, [selectedCourse, vmStatus, vmIP, vmPort]);

  const handleClearTerminal = useCallback(() => setTerminalHistory([]), []);

  // ── OSINT completion ──────────────────────────────────────────
  const handleCompleteOsint = useCallback((id: string) => {
    setUserProfile(prev => {
      const newList = Array.from(new Set([...(prev.completedOsint || []), id]));
      const updated = { ...prev, completedOsint: newList };
      ProfileStore.save(prev.id, updated as unknown as Record<string, unknown>);
      void supabase.from("profiles")
        .update({ completed_osint: newList })
        .eq("id", prev.id)
        .then(undefined, () => {});
      return updated;
    });
  }, []);

  // ── Profile update (from ProfilePage) ────────────────────────
  const handleUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...updates };
      ProfileStore.save(prev.id, updated as unknown as Record<string, unknown>);
      void supabase.from("profiles").upsert({
        id:                prev.id,
        username:          prev.username,
        callsign:          updated.callsign,
        accent_color:      updated.accentColor,
        xp:                updated.xp,
        level:             updated.level,
        completed_courses: updated.completedCourses,
        completed_osint:   updated.completedOsint,
        bio:               updated.bio,
        avatar:            updated.avatar,
        last_diagnostics_run: updated.lastDiagnosticsRun,
        updated_at:        new Date().toISOString(),
      }, { onConflict: "id" }).then(undefined, () => {});
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
          onAuthSuccess={handleAuthSuccess}
          onBack={() => setPage("landing")}
        />
      );
    }
    return <LandingPage onGetStarted={() => setPage("auth")} />;
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
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
