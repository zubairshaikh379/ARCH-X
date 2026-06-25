import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ArrowRight,
  Terminal,
  Compass,
  Users,
  Award,
  BookOpen,
  Send,
  Zap,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Mail,
  Shield,
  Clock,
  Eye,
  RotateCcw,
  PlusCircle,
  ThumbsUp,
  Cpu,
  Globe,
  Database,
  Lock,
  ChevronDown,
  Github,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle,
  Play,
  Square,
  RefreshCw,
  Folder,
  File,
  FileCode,
  Check,
  AlertTriangle,
  Server,
  HardDrive,
  Target,
  Sliders,
  Key,
  Activity,
  Fingerprint
} from "lucide-react";
import { COURSES, OSINT_CHALLENGES, MOCK_LEADERBOARD, Course, OSINTChallenge } from "./data/courses";
import { supabase } from "./lib/supabase";
import { COURSE_GUIDEBOOKS } from "./data/guidebooks";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { VMStatusOverlay } from "./components/VMStatusOverlay";
import { BackgroundPaths } from "./components/BackgroundPaths";
import { ArchXLogo } from "./components/ArchXLogo";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

export interface VMFile {
  name: string;
  content: string;
  isDir?: boolean;
}

export function getDefaultVMFiles(courseId: string, flag: string): VMFile[] {
  switch (courseId) {
    case "soc-analyst":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nLocate repeated authentication failures targeting the root user, identify the offending IP address, and apply a firewall block list.\n\nType 'ls' to see the directories, and 'cat README.txt' or 'cat audit_log.json' to review files.\nOnce you locate the attacking IP, use 'block-ip <IP_ADDRESS>' to lock down the interface.\nType 'env' to find the CTF flag key!" },
        { name: "audit_log.json", content: `[\n  {"time": "14:02:11", "src": "198.51.100.12", "evt": "SSH_FAILED", "user": "root"},\n  {"time": "14:02:12", "src": "198.51.100.12", "evt": "SSH_FAILED", "user": "admin"},\n  {"time": "14:02:14", "src": "198.51.100.12", "evt": "SSH_FAILED", "user": "db_admin"},\n  {"time": "14:02:15", "src": "198.51.100.12", "evt": "SSH_SUCCESS", "user": "root"}\n]` },
        { name: "system_status.log", content: "SSHD Active: Listening on port 22\nAuth Protocol: Password Bypass Flag is set to ALLOWED\nWarning: Unauthorized logins logged in audit_log.json." },
        { name: "flag.txt", content: `CTF flag is stored in host environment parameters. Run 'env' to read environment variables.` }
      ];
    case "pentest":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nPerform port scanning on the target host 10.10.1.5, identify the vulnerable service version, and trigger the remote execution API payload.\n\nCommands:\n- nmap -sV 10.10.1.5 (discover open ports)\n- exploit-api --version v1.02 (exploit the vulnerability)\n- env (check environment variables)" },
        { name: "exploit_helper.py", content: "import socket\nimport sys\n\ndef craft_overflow():\n    # Buffer length of 512 bytes triggers instruction pointer rewrite\n    return b'A' * 512 + b'\\x90\\x90\\x90\\x90' + b'EXPL'" },
        { name: "nmap_cache.log", content: "Scan initialized 2026-06-24. 0 of 1000 ports scanned. Run 'nmap -sV 10.10.1.5' to execute a live probe." }
      ];
    case "devsecops":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nAudit codebase history and file structures, identify the AWS credentials leaked in the production branch, and revoke the key to patch the pipeline.\n\nCommands:\n- git-scan (find exposed keys)\n- invalidate-key <key_id> (revoke the leaked key)" },
        { name: "config/production.yaml", content: "database:\n  host: prod-rds.arch-x.internal\n  port: 5432\naws_credentials:\n  region: us-east-1\n  AWS_ACCESS_KEY_ID: AKIA_LEAKED_SECRET_99\n  AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'" }
      ];
    case "network-security":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nMonitor live packet traffic, isolate the spoofed routing source IP (ARP Spoofing), and filter out the malicious host.\n\nCommands:\n- sniff-traffic (analyze live packets on interface eth0)\n- drop-route <IP> (filter out target route)" },
        { name: "eth0_sniff.pcap", content: "Packet Capture Stream (104 KB binary). Trace logs show frequent ARP Broadcast packages claiming gateway address belongs to 192.168.1.5." }
      ];
    case "digital-forensics":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nAnalyze active process streams in volatile RAM dumps, identify masquerading executables in unusual system locations, and quarantine the thread PID.\n\nCommands:\n- ps -list (print running process list with directories)\n- quarantine-pid <PID> (freeze threads)" }
      ];
    case "threat-hunter":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nScan user folders for file hashes matching active indicator logs, identify the malware executable, and deploy a Sigma alert rule.\n\nCommands:\n- file-hash-audit (find bad file hashes)\n- deploy-rule (register Sigma detection filter)" }
      ];
    case "reverse-engineer":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nAnalyze decompiled program assembly, trace CPU register comparators, find the hardcoded passphrase string, and submit it to the binary executor.\n\nCommands:\n- decompile-main (print assembly structure)\n- test-key <passphrase> (submit validation)" },
        { name: "decompiled_main.asm", content: "0x00401000: MOV EAX, [0x00405020]\n0x00401005: CMP EAX, 'ARCHX_DECOMP_KEY_99'\n0x0040100A: JE 0x00401015\n0x0040100C: XOR EAX, EAX\n0x0040100E: RET" }
      ];
    case "cloud-security":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nAudit public S3 storage permissions, identify public reading scopes exposing financials, and secure IAM policy blocks.\n\nCommands:\n- cloud-bucket-audit (scan bucket configs)\n- secure-bucket-iam <bucket_id> (patch permissions)" }
      ];
    case "identity-access":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nInspect active authorization headers, verify signature algorithm, identify the 'none'-algorithm vulnerability, and update validation filters.\n\nCommands:\n- view-token (view JWT parameters)\n- reconfigure-jwt-verify (disable none-algorithm support)" }
      ];
    case "incident-responder":
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nDetect ransomware encryption spikes on client drives, find the source host, and isolate network container routes.\n\nCommands:\n- monitor-file-activity (audit file write speeds)\n- isolate-host <host_id> (quarantine infected host)" }
      ];
    default:
      return [
        { name: "README.txt", content: "MISSION OBJECTIVE:\nExplore file structures, run security utilities, and capture the CTF flag.\n\nCommands:\n- help\n- ls\n- cat <filename>" }
      ];
  }
}

export default function App() {
  // 5. Parallax position tracking (Direct CSS property updates for maximum scrolling smoothness)
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const x = (clientX / width) - 0.5;
    const y = (clientY / height) - 0.5;
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.setProperty("--mouse-x", x.toString());
      target.style.setProperty("--mouse-y", y.toString());
    }
  };

  // 4. Random glitch triggers
  const [isTerminalGlitching, setIsTerminalGlitching] = useState(false);
  const [isLogsGlitching, setIsLogsGlitching] = useState(false);

  useEffect(() => {
    const terminalInterval = setInterval(() => {
      if (Math.random() > 0.45) {
        setIsTerminalGlitching(true);
        setTimeout(() => setIsTerminalGlitching(false), 300);
      }
    }, 4000);

    const logsInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        setIsLogsGlitching(true);
        setTimeout(() => setIsLogsGlitching(false), 200);
      }
    }, 5500);

    return () => {
      clearInterval(terminalInterval);
      clearInterval(logsInterval);
    };
  }, []);

  // Navigation states
  const [activeTab, setActiveTab] = useState<"home" | "courses" | "osint" | "community" | "profile">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Experience / Profile states (stored in localStorage)
  const [userProfile, setUserProfile] = useState({
    username: "",
    xp: 0,
    level: 1,
    completedCourses: [] as string[],
    completedOsint: [] as string[],
    callsign: "Security Operator",
    accentColor: "slate",
    avatar: "shield",
    bio: "ACTIVE AGENT // SECURING THE FRONTIER",
  });

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authCallsign, setAuthCallsign] = useState("Security Operator");
  const [authAccentColor, setAuthAccentColor] = useState("slate"); // slate, zinc, emerald, amber, rose, indigo
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState<boolean>(false);
  const [mfaTargetUser, setMfaTargetUser] = useState<any>(null);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isGuidebookExpanded, setIsGuidebookExpanded] = useState<boolean>(false);
  const [showPracticeHint, setShowPracticeHint] = useState<boolean>(false);
  const [showSecurityBenefitsModal, setShowSecurityBenefitsModal] = useState<boolean>(false);

  // Current active selections
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCourseTab, setSelectedCourseTab] = useState<"sop" | "theory" | "practice" | "guidebook">("sop");
  
  // Quiz progress inside current course
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizPassed, setQuizPassed] = useState<boolean>(false);

  // Terminal state
  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // OSINT states
  const [selectedOsint, setSelectedOsint] = useState<OSINTChallenge | null>(OSINT_CHALLENGES[0]);
  const [osintInput, setOsintInput] = useState("");
  const [osintFeedback, setOsintFeedback] = useState<{ status: "idle" | "correct" | "incorrect"; msg: string }>({ status: "idle", msg: "" });
  const [revealedHints, setRevealedHints] = useState<{ [challengeId: string]: number }>({});

  // Interactive ARCH-X Diagnostics Deck States (replaces the Cloud rotating nodes)
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([
    "[ARCH-X] Simulator core initialized successfully.",
    "[ARCH-X] Ready to audit local memory buffers."
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [encryptionStandard, setEncryptionStandard] = useState("AES-GCM-256");

  // Community Idea Board states
  const [communityIdeas, setCommunityIdeas] = useState(() => {
    const saved = localStorage.getItem("archx_community_ideas");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: "id-1", title: "Interactive Splunk SPL Query Simulator", desc: "A playground to write real Splunk queries and search log repositories.", category: "Feature", votes: 42, author: "CyberPro_20" },
      { id: "id-2", title: "Metasploit Exploit DB payload checks", desc: "Let beginners execute interactive exploits with visual indicators.", category: "Content", votes: 31, author: "RootSlayer" },
      { id: "id-3", title: "Automated threat hunting playbook builder", desc: "A UI drag-and-drop to design automated scripts reacting to alert logs.", category: "Feature", votes: 19, author: "ShieldAnalyst" }
    ];
  });
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaDesc, setNewIdeaDesc] = useState("");
  const [newIdeaCategory, setNewIdeaCategory] = useState("Feature");
  const [votedIdeas, setVotedIdeas] = useState<string[]>(() => {
    const saved = localStorage.getItem("archx_voted_ideas");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  // Supabase VM Orchestration state
  const [usingSupabase, setUsingSupabase] = useState<boolean>(false);
  const [vmStatus, setVmStatus] = useState<'off' | 'provisioning' | 'running'>('off');
  const [vmIP, setVmIP] = useState<string>("");
  const [vmPort, setVmPort] = useState<number>(22);
  const [vmUptime, setVmUptime] = useState<number>(0);
  const [vmCPU, setVmCPU] = useState<number>(0);
  const [vmRAM, setVmRAM] = useState<number>(0);
  const [vmFiles, setVmFiles] = useState<VMFile[]>([]);
  const [vmFlag, setVmFlag] = useState<string>("");
  const [vmSolved, setVmSolved] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<VMFile | null>(null);

  // Custom user CTF Flag Input
  const [ctfFlagInput, setCtfFlagInput] = useState<string>("");
  const [ctfFeedback, setCtfFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg: string }>({ status: 'idle', msg: '' });

  // Active user VMs state for profile monitor
  const [activeUserVMs, setActiveUserVMs] = useState<any[]>([]);
  const [metricHistory, setMetricHistory] = useState<{ time: string; cpu: number; ram: number }[]>([]);

  // Fetch all user active VMs for the profile monitor
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let lastErrorShown = 0;
    async function fetchAllUserVMs() {
      if (!isLoggedIn || !userProfile.username) return;
      try {
        const { data, error } = await supabase
          .from("user_vms")
          .select("*")
          .eq("username", userProfile.username);
        
        if (error) {
          console.error("[Database Connection Alert] Failed to fetch active VM instances from Supabase server:", error.message);
          const now = Date.now();
          if (now - lastErrorShown > 15000) { // Throttle notifications so as not to flood the interface
            triggerNotification("Security Notice: Database query failed. Cloud VM syncing is currently offline.");
            lastErrorShown = now;
          }
        } else if (data) {
          setActiveUserVMs(data);
        }
      } catch (err: any) {
        console.error("[Database Connectivity Fault] Unreachable remote server while querying active VMs:", err);
        const now = Date.now();
        if (now - lastErrorShown > 15000) {
          triggerNotification("Network Warning: Connection timed out or database unreachable.");
          lastErrorShown = now;
        }
      }
    }

    if (activeTab === "profile" && isLoggedIn) {
      fetchAllUserVMs();
      timer = setInterval(fetchAllUserVMs, 4000);
    }
    return () => clearInterval(timer);
  }, [activeTab, isLoggedIn, userProfile.username]);

  // Notification Banner (made interactive, closeable, and supports multiple concurrent toasts)
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([
    {
      id: "initial-system",
      message: "ARCH-X security training laboratories are live. Pick an active track to launch simulations."
    }
  ]);

  // Load / Save Profile state & Session Checking and Sync with Supabase if available
  useEffect(() => {
    async function initAndSync() {
      // Test connection
      let isReachable = false;
      try {
        const { data: testData, error: testErr } = await supabase.from("profiles").select("username").limit(1);
        if (testErr) {
          console.warn("[Supabase Handshake Warning] Unable to contact public.profiles table. Operating with local storage fallback mode.", testErr.message);
        } else {
          isReachable = true;
        }
      } catch (err: any) {
        console.error("[Supabase Handshake Exception] Server query failed during initialization check:", err);
      }
      setUsingSupabase(isReachable);

      const sessionUser = localStorage.getItem("archx_session_username");
      if (sessionUser) {
        let loadedProfile = null;

        // Try load from Supabase if connected
        if (isReachable) {
          try {
            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("username", sessionUser)
              .single();
            
            if (error) {
              console.error(`[Supabase Fetch Error] Failed to retrieve cloud profile for user "${sessionUser}":`, error.message);
              triggerNotification(`Could not sync cloud profile for ${sessionUser}. Running with local data.`);
            } else if (data) {
              loadedProfile = {
                username: data.username,
                xp: data.xp,
                level: data.level,
                completedCourses: data.completed_courses || [],
                completedOsint: data.completed_osint || [],
                callsign: data.callsign,
                accentColor: data.accent_color || "slate",
                avatar: data.avatar || "shield",
                bio: data.bio || "ACTIVE AGENT // SECURING THE FRONTIER",
              };
            }
          } catch (err: any) {
            console.error(`[Supabase Fetch Exception] Connectivity failure during cloud profile retrieval for user "${sessionUser}":`, err);
            triggerNotification("Database connection interrupted. Local session profile loaded.");
          }
        }

        // Fallback to local storage
        if (!loadedProfile) {
          const savedUser = localStorage.getItem("archx_user_profile_" + sessionUser);
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              loadedProfile = {
                username: parsed.username,
                xp: parsed.xp || 0,
                level: parsed.level || 1,
                completedCourses: parsed.completedCourses || [],
                completedOsint: parsed.completedOsint || [],
                callsign: parsed.callsign || "Security Operator",
                accentColor: parsed.accentColor || "slate",
                avatar: parsed.avatar || "shield",
                bio: parsed.bio || "ACTIVE AGENT // SECURING THE FRONTIER",
              };
            } catch (e) {
              console.error("Local storage profile parsing error:", e);
            }
          }
        }

        if (loadedProfile) {
          setUserProfile(loadedProfile);
          setIsLoggedIn(true);
        }
      }
    }
    initAndSync();
  }, []);

  // Fetch VM status once when logged-in user or active course changes (Avoids circular boot reset)
  useEffect(() => {
    async function checkActiveVM() {
      if (!isLoggedIn || !userProfile.username || !selectedCourse) return;
      
      try {
        const { data, error } = await supabase
          .from("user_vms")
          .select("*")
          .eq("username", userProfile.username)
          .eq("course_id", selectedCourse.id)
          .maybeSingle();

        if (error) {
          console.error(`[Supabase VM Check Error] Query failed for active VM matching user "${userProfile.username}" and course "${selectedCourse.id}":`, error.message);
          triggerNotification("Notice: Unable to check cloud VM status. Offline simulation active.");
        } else if (data) {
          setVmStatus(data.status);
          setVmIP(data.ip_address || "");
          setVmPort(data.port || 22);
          setVmUptime(data.uptime_seconds || 0);
          setVmCPU(data.cpu_usage || 0);
          setVmRAM(data.ram_usage || 0);
          setVmFlag(data.flag || "");
          setVmSolved(data.solved || false);
          
          if (data.files_json) {
            try {
              const files = Array.isArray(data.files_json) 
                ? data.files_json 
                : JSON.parse(data.files_json as string);
              setVmFiles(files);
              if (files.length > 0 && !selectedFile) {
                setSelectedFile(files[0]);
              }
            } catch (e) {
              console.error("Error parsing VM files:", e);
            }
          }
        } else {
          // Reset local VM states if no DB entry exists
          setVmStatus('off');
          setVmIP("");
          setVmPort(22);
          setVmUptime(0);
          setVmCPU(0);
          setVmRAM(0);
          setVmFiles([]);
          setVmFlag("");
          setVmSolved(false);
          setSelectedFile(null);
        }
      } catch (err: any) {
        console.error("[Supabase VM Check Exception] Exception caught during active VM state check:", err);
        triggerNotification("Connection to cloud VM orchestrator is currently offline.");
      }
    }

    if (isLoggedIn && selectedCourse) {
      checkActiveVM();
    }
  }, [isLoggedIn, selectedCourse, userProfile.username]);

  // Handle real-time fluctuation of metrics and uptime for a running VM instance
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (vmStatus === 'running') {
      interval = setInterval(() => {
        // Calculate realistic fluctuation representing container microtasks and background system cycles
        const baseCpu = 1.0 + Math.random() * 2.5;
        const sineBonus = Math.abs(Math.sin(Date.now() / 6000)) * 4.5; // Simulate periodic request load
        const nextCPU = Math.round((baseCpu + sineBonus) * 10) / 10;

        const baseRam = 24.2 + Math.random() * 0.8;
        const cosBonus = Math.abs(Math.cos(Date.now() / 10000)) * 1.5; // Simulate minor memory allocations
        const nextRAM = Math.round((baseRam + cosBonus) * 10) / 10;

        setVmCPU(nextCPU);
        setVmRAM(nextRAM);
        setVmUptime(prev => prev + 1);

        setMetricHistory(prev => {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          const updated = [...prev, { time: timeStr, cpu: nextCPU, ram: nextRAM }];
          // Keep last 15 seconds of records for graph responsiveness
          if (updated.length > 15) {
            return updated.slice(updated.length - 15);
          }
          return updated;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [vmStatus]);

  // Sync profile edits to Supabase in background
  const saveProfile = async (newProfile: typeof userProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem("archx_user_profile", JSON.stringify(newProfile));
    if (newProfile.username) {
      localStorage.setItem("archx_user_profile_" + newProfile.username, JSON.stringify(newProfile));
      
      // Update in registered directory list
      const usersRaw = localStorage.getItem("archx_registered_users");
      if (usersRaw) {
        try {
          const usersList = JSON.parse(usersRaw);
          const idx = usersList.findIndex((u: any) => u.username.toLowerCase() === newProfile.username.toLowerCase());
          if (idx !== -1) {
            usersList[idx] = { ...usersList[idx], ...newProfile };
            localStorage.setItem("archx_registered_users", JSON.stringify(usersList));
          } else {
            usersList.push(newProfile);
            localStorage.setItem("archx_registered_users", JSON.stringify(usersList));
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem("archx_registered_users", JSON.stringify([newProfile]));
      }

      // Supabase persistent replication
      if (usingSupabase) {
        try {
          const { error } = await supabase.from("profiles").upsert({
            username: newProfile.username,
            callsign: newProfile.callsign,
            accent_color: newProfile.accentColor,
            xp: newProfile.xp,
            level: newProfile.level,
            completed_courses: newProfile.completedCourses,
            completed_osint: newProfile.completedOsint,
            updated_at: new Date().toISOString()
          });
          
          if (error) {
            console.error(`[Supabase Profile Upsert Error] Failed to replicate profile updates for user "${newProfile.username}" to cloud:`, error.message);
            triggerNotification("Profile Sync Warning: Unable to backup profile to the secure database.");
          }
        } catch (err: any) {
          console.error(`[Supabase Profile Upsert Exception] Network error replicating profile updates for "${newProfile.username}":`, err);
          triggerNotification("Connection issue: Profile saved locally, but database sync failed.");
        }
      }
    }
  };

  const addXp = (amount: number, message: string) => {
    const nextXp = userProfile.xp + amount;
    const nextLevel = Math.floor(nextXp / 1000) + 1;
    const nextProfile = {
      ...userProfile,
      xp: nextXp,
      level: nextLevel
    };
    saveProfile(nextProfile);
    triggerNotification(`+${amount} XP Earned! ${message}`);
  };

  const triggerNotification = (msg: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => {
      // Avoid duplicate concurrent alerts to keep the UI clean
      if (prev.some(n => n.message === msg)) return prev;
      return [...prev, { id, message: msg }];
    });

    // Automatically dismiss after 8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  // Auth Action Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authUsername.trim()) {
      setAuthError("Operator handle cannot be empty.");
      return;
    }

    const cleanedUsername = authUsername.trim();
    const usersRaw = localStorage.getItem("archx_registered_users");
    const usersList = usersRaw ? JSON.parse(usersRaw) : [];

    // Check if user exists
    const existingUser = usersList.find((u: any) => u.username.toLowerCase() === cleanedUsername.toLowerCase());

    if (!existingUser) {
      setAuthError("No such operator registered in the ARCH-X mainframe.");
      return;
    }

    if (existingUser.password && existingUser.password !== authPassword) {
      setAuthError("Invalid credentials. Mainframe decryption failed.");
      return;
    }

    // Generate random 6-digit OTP code for 2FA verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setMfaTargetUser(existingUser);
    setMfaChallenge(true);
    setAuthOtp(""); // Clear any stale input
    setAuthError("");
    setAuthSuccess(`MFA Code dispatched. Enter verification passkey sent to ${existingUser.email || "registered email"}.`);

    triggerNotification(`[MFA Security] OTP challenge code for ${cleanedUsername}: ${otp}`);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authUsername.trim()) {
      setAuthError("Operator handle cannot be empty.");
      return;
    }

    const cleanedUsername = authUsername.trim();
    if (cleanedUsername.length < 3) {
      setAuthError("Operator handle must be at least 3 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanedUsername)) {
      setAuthError("Handle can only contain alphanumeric characters, underscores, and dashes.");
      return;
    }

    if (!authEmail.trim() || !authEmail.includes("@")) {
      setAuthError("Please specify a valid operational email for secure 2FA dispatch.");
      return;
    }

    if (!authPassword) {
      setAuthError("Mainframe password cannot be blank.");
      return;
    }

    if (authPassword.length < 4) {
      setAuthError("Mainframe passkey must be at least 4 characters.");
      return;
    }

    if (authPassword !== authConfirmPassword) {
      setAuthError("Passkey confirmation mismatch.");
      return;
    }

    const usersRaw = localStorage.getItem("archx_registered_users");
    const usersList = usersRaw ? JSON.parse(usersRaw) : [];

    const exists = usersList.some((u: any) => u.username.toLowerCase() === cleanedUsername.toLowerCase());
    if (exists) {
      setAuthError("An operator with this handle is already enlisted.");
      return;
    }

    // Create pending profile
    const pendingProfile = {
      username: cleanedUsername,
      password: authPassword,
      email: authEmail.trim(),
      callsign: authCallsign,
      accentColor: authAccentColor,
      xp: 0,
      level: 1,
      completedCourses: [] as string[],
      completedOsint: [] as string[],
    };

    // Generate random 6-digit OTP code for registration email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setMfaTargetUser(pendingProfile);
    setMfaChallenge(true);
    setAuthOtp(""); // Clear stale input
    setAuthError("");
    setAuthSuccess(`Verification pending. Registration OTP passkey dispatched to ${authEmail.trim()}.`);

    triggerNotification(`[Enlistment Sec] Registration verification code sent to ${authEmail.trim()}: ${otp}`);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const cleanedOtp = authOtp.trim();
    if (!cleanedOtp) {
      setAuthError("Verification passkey cannot be empty.");
      return;
    }

    // Support standard dynamic OTP and general dev override "777777" for convenience
    if (cleanedOtp !== generatedOtp && cleanedOtp !== "777777") {
      setAuthError("Decryption failed. Invalid 2FA verification passkey.");
      return;
    }

    const profile = mfaTargetUser;
    if (!profile) {
      setAuthError("Pending registration/login session was lost. Please restart authorization.");
      setMfaChallenge(false);
      return;
    }

    if (authMode === "forgot") {
      setAuthMode("reset");
      setMfaChallenge(false);
      setAuthOtp("");
      setAuthSuccess("Verification cleared. Decryption keys unlocked. Define your new passkey.");
      return;
    }

    const usersRaw = localStorage.getItem("archx_registered_users");
    let usersList = usersRaw ? JSON.parse(usersRaw) : [];

    if (authMode === "register") {
      // Save to registered list
      const exists = usersList.some((u: any) => u.username.toLowerCase() === profile.username.toLowerCase());
      if (!exists) {
        usersList.push(profile);
        localStorage.setItem("archx_registered_users", JSON.stringify(usersList));
      }

      // Save active session
      localStorage.setItem("archx_session_username", profile.username);
      localStorage.setItem("archx_user_profile_" + profile.username, JSON.stringify(profile));

      // Sync registration with Supabase
      if (usingSupabase) {
        try {
          const { error } = await supabase.from("profiles").upsert({
            username: profile.username,
            callsign: profile.callsign,
            accent_color: profile.accentColor,
            xp: 0,
            level: 1,
            completed_courses: [],
            completed_osint: [],
            updated_at: new Date().toISOString()
          });
          
          if (error) {
            console.error(`[Supabase Registration Error] Failed to replicate operator "${profile.username}" profile to cloud:`, error.message);
            triggerNotification("Warning: Local registration succeeded, but database sync failed.");
          }
        } catch (err: any) {
          console.error("[Supabase Registration Exception] Exception caught during registration query:", err);
          triggerNotification("Connection Warning: Profile registered offline. Database sync will retry later.");
        }
      }

      setUserProfile(profile);
      setIsLoggedIn(true);
      setAuthPassword("");
      setAuthConfirmPassword("");
      setAuthUsername("");
      setAuthEmail("");
      setAuthOtp("");
      setMfaChallenge(false);
      setMfaTargetUser(null);
      setAuthSuccess("Enlistment complete. Secure credentials registered.");
      triggerNotification(`Operator ${profile.username} has been registered and cleared for duty.`);
    } else {
      // Login session
      localStorage.setItem("archx_session_username", profile.username);
      localStorage.setItem("archx_user_profile_" + profile.username, JSON.stringify(profile));

      setUserProfile(profile);
      setIsLoggedIn(true);
      setAuthPassword("");
      setAuthUsername("");
      setAuthEmail("");
      setAuthOtp("");
      setMfaChallenge(false);
      setMfaTargetUser(null);
      triggerNotification(`Welcome back, Operator ${profile.username}. MFA cleared. Session initialized.`);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authUsername.trim()) {
      setAuthError("Operator handle cannot be empty.");
      return;
    }
    if (!authEmail.trim()) {
      setAuthError("Operational email address is required.");
      return;
    }

    const cleanedUsername = authUsername.trim();
    const cleanedEmail = authEmail.trim();

    const usersRaw = localStorage.getItem("archx_registered_users");
    const usersList = usersRaw ? JSON.parse(usersRaw) : [];

    const foundUser = usersList.find(
      (u: any) =>
        u.username.toLowerCase() === cleanedUsername.toLowerCase() &&
        u.email?.toLowerCase() === cleanedEmail.toLowerCase()
    );

    if (!foundUser) {
      setAuthError("No matching operator found with this handle and email.");
      return;
    }

    // Generate random 6-digit OTP code for reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setMfaTargetUser(foundUser);
    setMfaChallenge(true);
    setAuthOtp(""); // Clear stale input
    setAuthSuccess(`Authorization bypass dispatching. Enter verification passkey sent to ${cleanedEmail}.`);

    triggerNotification(`[Security Mainframe] Password reset OTP bypass code: ${otp}`);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!resetNewPassword) {
      setAuthError("New passkey string cannot be empty.");
      return;
    }
    if (resetNewPassword.length < 4) {
      setAuthError("New passkey must be at least 4 characters.");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setAuthError("Passkey confirmation mismatch.");
      return;
    }

    const usersRaw = localStorage.getItem("archx_registered_users");
    const usersList = usersRaw ? JSON.parse(usersRaw) : [];

    const updatedUsers = usersList.map((u: any) => {
      if (u.username.toLowerCase() === mfaTargetUser.username.toLowerCase()) {
        return { ...u, password: resetNewPassword };
      }
      return u;
    });

    localStorage.setItem("archx_registered_users", JSON.stringify(updatedUsers));

    // Log the operator in directly
    const updatedProfile = {
      ...mfaTargetUser,
      avatar: mfaTargetUser.avatar || "shield",
      bio: mfaTargetUser.bio || "ACTIVE AGENT // SECURING THE FRONTIER",
      password: resetNewPassword
    };

    localStorage.setItem("archx_session_username", updatedProfile.username);
    localStorage.setItem("archx_user_profile_" + updatedProfile.username, JSON.stringify(updatedProfile));

    setUserProfile(updatedProfile);
    setIsLoggedIn(true);

    // Clear states
    setAuthPassword("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setAuthUsername("");
    setAuthEmail("");
    setMfaTargetUser(null);
    setMfaChallenge(false);
    setAuthMode("login");

    triggerNotification("Security credentials re-encrypted. Mainframe access authorized.");
  };

  const handleGuestLogin = async () => {
    const guestUsername = "Recruit_" + Math.floor(1000 + Math.random() * 9000);
    const guestProfile = {
      username: guestUsername,
      password: "",
      callsign: "Security Operator",
      accentColor: "slate",
      xp: 0,
      level: 1,
      completedCourses: [] as string[],
      completedOsint: [] as string[],
    };

    localStorage.setItem("archx_session_username", guestUsername);
    localStorage.setItem("archx_user_profile_" + guestUsername, JSON.stringify(guestProfile));
    
    if (usingSupabase) {
      try {
        const { error } = await supabase.from("profiles").upsert({
          username: guestUsername,
          callsign: "Security Operator",
          accent_color: "slate",
          xp: 0,
          level: 1,
          completed_courses: [],
          completed_osint: [],
          updated_at: new Date().toISOString()
        });
        
        if (error) {
          console.error(`[Supabase Guest Error] Failed to upload temporary guest profile "${guestUsername}" to database:`, error.message);
        }
      } catch (err: any) {
        console.error("[Supabase Guest Exception] Network failure during guest enrollment:", err);
      }
    }

    setUserProfile(guestProfile);
    setIsLoggedIn(true);
    triggerNotification(`Initialized guest bypass as ${guestUsername}. Access granted.`);
  };

  const handleLogout = () => {
    localStorage.removeItem("archx_session_username");
    setIsLoggedIn(false);
    triggerNotification("Mainframe session terminated safely. Logged out.");
  };

  // Auto-scroll terminal history to bottom
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalHistory]);

  // Handle dynamic VM container provisioning / deployment on Supabase
  const handleProvisionVM = async () => {
    if (!isLoggedIn || !userProfile.username || !selectedCourse) {
      triggerNotification("Please log in first to provision dedicated virtual environments.");
      return;
    }

    setVmStatus('provisioning');
    triggerNotification(`Initializing deployment pipeline for dedicated container VM...`);

    const finalFlag = `ARCHX_${selectedCourse.id.toUpperCase()}_CTF_${Math.floor(1000 + Math.random() * 9000)}`;
    const mockIP = `10.124.${Math.floor(2 + Math.random() * 250)}.${Math.floor(2 + Math.random() * 250)}`;
    const mockPort = Math.floor(1024 + Math.random() * 50000);
    const initialFiles = getDefaultVMFiles(selectedCourse.id, finalFlag);

    // Update locally immediately
    setVmIP(mockIP);
    setVmPort(mockPort);
    setVmUptime(0);
    setVmFiles(initialFiles);
    setVmFlag(finalFlag);
    setVmSolved(false);
    setSelectedFile(initialFiles[0] || null);

    // Simulate real Docker image download and container spin-up (3.5 seconds)
    setTimeout(async () => {
      setVmStatus('running');
      setVmCPU(1.2);
      setVmRAM(24.5);
      
      const nextHistory = [
        `Connecting to orchestration host...`,
        `Pulling lightweight secure Docker runtime for course: ${selectedCourse.id}...`,
        `Creating container namespace: archx-${userProfile.username}-${selectedCourse.id}...`,
        `Mounting virtual disk file volumes successfully.`,
        `Binding socket listening daemon on dedicated IP ${mockIP}:${mockPort}...`,
        `\n--- Container VM Live Connection Shell Established ---`,
        `Type 'ls' to audit directory and 'cat README.txt' for next steps.`,
        `Warning: Ensure you solve the challenge and find the CTF flag key!`
      ];
      setTerminalHistory(nextHistory);
      triggerNotification(`Dedicated Container VM running at address ${mockIP}:${mockPort}`);

      // Push VM state to Supabase user_vms for durable user-specific VM tracking
      if (usingSupabase) {
        try {
          const { error } = await supabase.from("user_vms").upsert({
            username: userProfile.username,
            course_id: selectedCourse.id,
            status: 'running',
            ip_address: mockIP,
            port: mockPort,
            uptime_seconds: 0,
            files_json: initialFiles,
            flag: finalFlag,
            solved: false,
            cpu_usage: 1.2,
            ram_usage: 24.5,
            created_at: new Date().toISOString()
          }, { onConflict: 'username,course_id' });
          
          if (error) {
            console.error("[Supabase VM Upsert Error] Failed to upload dynamic VM container state:", error.message);
            triggerNotification("Orchestration Sync Alert: VM running, but status could not sync to cloud db.");
          }
        } catch (err: any) {
          console.error("[Supabase VM Upsert Exception] Network/connectivity failure during VM sync:", err);
          triggerNotification("Connection Interrupted: Running VM locally. Cloud syncing paused.");
        }
      }
    }, 3500);
  };

  // Terminate VM Container
  const handleShutdownVM = async () => {
    if (!isLoggedIn || !userProfile.username || !selectedCourse) return;

    setVmStatus('off');
    setVmIP("");
    setVmPort(22);
    setVmUptime(0);
    setVmCPU(0);
    setVmRAM(0);
    setVmFiles([]);
    setVmFlag("");
    setVmSolved(false);
    setSelectedFile(null);
    setTerminalHistory([`Container VM destroyed. Orchestrator daemon released system resources.`]);
    triggerNotification(`Active Container VM destroyed. Resources released.`);

    if (usingSupabase) {
      try {
        const { error } = await supabase
          .from("user_vms")
          .delete()
          .eq("username", userProfile.username)
          .eq("course_id", selectedCourse.id);
        if (error) {
          console.error("[Supabase VM Delete Error] Failed to delete user_vms row on remote database:", error.message);
          triggerNotification("Notice: Cloud VM de-provisioning returned an error. Local cleanup complete.");
        }
      } catch (err: any) {
        console.error("[Supabase VM Delete Exception] Connection issue while de-provisioning VM on remote database:", err);
        triggerNotification("Connection Interrupted: Cloud VM release is pending connection.");
      }
    }
  };

  // Submit CTF Flag
  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    setCtfFeedback({ status: 'idle', msg: '' });

    if (!ctfFlagInput.trim()) {
      setCtfFeedback({ status: 'error', msg: 'Please provide a non-empty flag string.' });
      return;
    }

    const cleanInput = ctfFlagInput.trim();
    if (cleanInput === vmFlag || (vmFlag === "" && cleanInput.toLowerCase().includes("flag"))) {
      setCtfFeedback({ status: 'success', msg: 'Decrypting Flag... Correct! Flag matches container master signature.' });
      setVmSolved(true);
      triggerNotification("CTF Challenge Solved! Awarding 400 XP.");

      // Complete the course
      if (!userProfile.completedCourses.includes(selectedCourse!.id)) {
        const nextCompleted = [...userProfile.completedCourses, selectedCourse!.id];
        saveProfile({ ...userProfile, completedCourses: nextCompleted });
        addXp(400, `Completed active Container VM simulation lab for ${selectedCourse!.title}!`);
      }

      // Record victory in Supabase
      if (usingSupabase) {
        try {
          const { error } = await supabase
            .from("user_vms")
            .update({ solved: true })
            .eq("username", userProfile.username)
            .eq("course_id", selectedCourse!.id);
          if (error) {
            console.error("[Supabase VM Update Error] Failed to record challenge victory in user_vms table:", error.message);
            triggerNotification("Scoreboard Notice: Victory recorded locally, but cloud sync is pending.");
          }
        } catch (err: any) {
          console.error("[Supabase VM Update Exception] Connection failed while uploading challenge completion state:", err);
          triggerNotification("Connection Warning: Scoreboard sync is currently offline. Victory cached locally.");
        }
      }
    } else {
      setCtfFeedback({ status: 'error', msg: 'Decrypting Flag... Verification Mismatch! Key does not unlock this container.' });
    }
  };

  // Handle simulated terminal execution
  const executeTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalCommand.trim();
    if (!cmd) return;

    const nextHistory = [...terminalHistory, `recruit@arch-x-terminal:~$ ${cmd}`];
    
    if (selectedCourse) {
      if (vmStatus !== 'running') {
        nextHistory.push("Orchestrated VM Container is offline. Please hit 'START DEDICATED VM' to boot up your terminal pipeline.");
        setTerminalHistory(nextHistory);
        setTerminalCommand("");
        return;
      }

      // Parse commands and arguments
      const parts = cmd.split(/\s+/);
      const baseCmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (baseCmd === "clear") {
        setTerminalHistory([]);
        setTerminalCommand("");
        return;
      }

      if (baseCmd === "help") {
        nextHistory.push("Available UNIX System Utilities inside active VM container:");
        nextHistory.push("  ls [-la]             List file descriptors in current directory with metadata");
        nextHistory.push("  cat <file>           Concatenate and display text content of a file");
        nextHistory.push("  grep <term> <file>   Search file content for lines matching pattern");
        nextHistory.push("  whoami               Display current active operator authority name");
        nextHistory.push("  pwd                  Print name of current working directory");
        nextHistory.push("  uname -a             Print complete kernel & operating system release details");
        nextHistory.push("  date                 Display current system local date and time");
        nextHistory.push("  history              Show sequence of operator console commands");
        nextHistory.push("  ping <host>          Test connectivity to target node IP address");
        nextHistory.push("  env                  Read environmental variables and secrets");
        
        // Add course-specific commands help
        const courseHelp = selectedCourse.simulation.commands["help"];
        if (courseHelp) {
          nextHistory.push("\nCourse-Specific security tools:");
          nextHistory.push("  " + courseHelp.replace("Commands:\n", "").replace(/\n/g, "\n  "));
        }
      }
      else if (baseCmd === "ls") {
        const isLong = args.includes("-la") || args.includes("-l") || args.includes("-a");
        if (vmFiles && vmFiles.length > 0) {
          if (isLong) {
            nextHistory.push("total 16");
            vmFiles.forEach(f => {
              const isExecutable = f.name.endsWith(".py") || f.name.endsWith(".sh");
              const perms = isExecutable ? "-rwxr-xr-x" : "-rw-r--r--";
              const size = f.content.length;
              nextHistory.push(`${perms}  operator  sec-ops  ${size.toString().padStart(5)} Jun 25 04:12 ${f.name}`);
            });
          } else {
            const names = vmFiles.map(f => f.name).join("   ");
            nextHistory.push(names);
          }
        } else {
          nextHistory.push("Virtual disk is empty.");
        }
      }
      else if (baseCmd === "cat") {
        if (args.length === 0) {
          nextHistory.push("cat: missing file operand. Usage: cat <filename>");
        } else {
          const fileName = args[0];
          const found = vmFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
          if (found) {
            nextHistory.push(found.content);
          } else {
            nextHistory.push(`cat: ${fileName}: No such file or directory`);
          }
        }
      }
      else if (baseCmd === "grep") {
        if (args.length < 2) {
          nextHistory.push("grep: missing search pattern or file. Usage: grep <pattern> <filename>");
        } else {
          const pattern = args[0].replace(/['"]/g, ""); // strip quotes
          const fileName = args[1];
          const found = vmFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase());
          if (found) {
            const lines = found.content.split("\n");
            const matchingLines = lines.filter(line => line.toLowerCase().includes(pattern.toLowerCase()));
            if (matchingLines.length > 0) {
              matchingLines.forEach(l => nextHistory.push(l));
            } else {
              // silent failure (typical Unix grep)
            }
          } else {
            nextHistory.push(`grep: ${fileName}: No such file or directory`);
          }
        }
      }
      else if (baseCmd === "whoami") {
        nextHistory.push(`${userProfile.username || "operator"}`);
      }
      else if (baseCmd === "pwd") {
        nextHistory.push("/home/operator/sec-core-deck");
      }
      else if (baseCmd === "uname") {
        nextHistory.push("Linux arch-x-secure-sandbox 5.15.0-76-generic #83-Ubuntu SMP x86_64 x86_64 GNU/Linux");
      }
      else if (baseCmd === "date") {
        nextHistory.push(new Date().toString());
      }
      else if (baseCmd === "history") {
        // List previous commands from nextHistory excluding prefix
        const prevCmds = nextHistory
          .filter(h => h.startsWith("recruit@arch-x-terminal:~$ "))
          .map(h => h.replace("recruit@arch-x-terminal:~$ ", ""));
        prevCmds.forEach((pc, idx) => nextHistory.push(`  ${idx + 1}  ${pc}`));
      }
      else if (baseCmd === "ping") {
        if (args.length === 0) {
          nextHistory.push("ping: missing host operand. Usage: ping <host>");
        } else {
          const host = args[0];
          nextHistory.push(`PING ${host} (${host}) 56(84) bytes of data.`);
          nextHistory.push(`64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.342 ms`);
          nextHistory.push(`64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.411 ms`);
          nextHistory.push(`\n--- ${host} ping statistics ---`);
          nextHistory.push("2 packets transmitted, 2 received, 0% packet loss, time 1002ms");
          nextHistory.push("rtt min/avg/max/mdev = 0.342/0.376/0.411/0.034 ms");
        }
      }
      else if (baseCmd === "env") {
        nextHistory.push(`CONTAINER_IP=${vmIP}\nCONTAINER_PORT=${vmPort}\nCTF_FLAG_SECRET=${vmFlag}\nVM_ORCHESTRATOR=SUPABASE\nDOCKER_STATUS=RUNNING\nACTIVE_OPERATOR=${userProfile.username}`);
      }
      else {
        // Fallback to static matching in courses.ts
        const fullMatchedCmd = cmd;
        const customResponse = selectedCourse.simulation.commands[fullMatchedCmd] || selectedCourse.simulation.commands[cmd.toLowerCase()];
        if (customResponse) {
          nextHistory.push(customResponse);
          if (cmd.includes("block-ip") || cmd.includes("exploit-api") || cmd.includes("invalidate-key") || cmd.includes("drop-route") || cmd.includes("quarantine")) {
            triggerNotification("Simulation action detected! Find and submit the environment flag to solve this CTF course.");
          }
        } else {
          // Try to see if there's a dynamic parameter support in custom commands
          const matchBlockIP = cmd.match(/^block-ip\s+(198\.51\.100\.12)$/i);
          const matchExploitAPI = cmd.match(/^exploit-api\s+--version\s+v1\.02$/i);
          const matchInvalidateKey = cmd.match(/^invalidate-key\s+AKIA_LEAKED_SECRET_99$/i);
          const matchDropRoute = cmd.match(/^drop-route\s+192\.168\.1\.5$/i);
          const matchQuarantinePid = cmd.match(/^quarantine-pid\s+1900$/i);
          const matchSecureBucket = cmd.match(/^secure-bucket-iam\s+archx-finance-records-01$/i);
          const matchReconfigureJwt = cmd.match(/^reconfigure-jwt-verify$/i);
          const matchIsolateHost = cmd.match(/^isolate-host\s+db-client-99$/i);
          const matchQuarantineDomain = cmd.match(/^quarantine-domain\s+attacker-server\.net$/i);
          const matchPatchK8s = cmd.match(/^patch-k8s$/i);
          const matchPatchBola = cmd.match(/^patch-bola$/i);
          const matchMigrateGmsa = cmd.match(/^migrate-gmsa$/i);

          let runResponse = "";
          if (matchBlockIP) runResponse = selectedCourse.simulation.commands["block-ip 198.51.100.12"] || selectedCourse.simulation.commands["block-ip"];
          else if (matchExploitAPI) runResponse = selectedCourse.simulation.commands["exploit-api --version v1.02"];
          else if (matchInvalidateKey) runResponse = selectedCourse.simulation.commands["invalidate-key AKIA_LEAKED_SECRET_99"];
          else if (matchDropRoute) runResponse = selectedCourse.simulation.commands["drop-route 192.168.1.5"];
          else if (matchQuarantinePid) runResponse = selectedCourse.simulation.commands["quarantine-pid 1900"];
          else if (matchSecureBucket) runResponse = selectedCourse.simulation.commands["secure-bucket-iam archx-finance-records-01"];
          else if (matchReconfigureJwt) runResponse = selectedCourse.simulation.commands["reconfigure-jwt-verify"];
          else if (matchIsolateHost) runResponse = selectedCourse.simulation.commands["isolate-host db-client-99"];
          else if (matchQuarantineDomain) runResponse = selectedCourse.simulation.commands["quarantine-domain attacker-server.net"];
          else if (matchPatchK8s) runResponse = selectedCourse.simulation.commands["patch-k8s"];
          else if (matchPatchBola) runResponse = selectedCourse.simulation.commands["patch-bola"];
          else if (matchMigrateGmsa) runResponse = selectedCourse.simulation.commands["migrate-gmsa"];

          if (runResponse) {
            nextHistory.push(runResponse);
            triggerNotification("Simulation action detected! Find and submit the environment flag to solve this CTF course.");
          } else {
            nextHistory.push(`Command not found or parameter mismatch: '${cmd}'. Type 'help' to review simulated commands.`);
          }
        }
      }
    } else {
      nextHistory.push("Please select an active track or course to interact with the target terminal sandbox.");
    }

    setTerminalHistory(nextHistory);
    setTerminalCommand("");
  };

  // Run interactive laboratory diagnostic scan
  const triggerLabDiagnostics = () => {
    if (isScanning) return;
    setIsScanning(true);
    setDiagnosticLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Initializing full secure topology diagnostic audit...`]);
    
    const steps = [
      "Auditing active courses database... OK (11 targets mounted)",
      "Checking live OSINT indicators... OK (12 exercises parsed)",
      "Verifying user auth level... OK (Level " + userProfile.level + ")",
      "Scanning system loopholes... Clear. Security loops sealed.",
      "[DIAGNOSTICS_SUCCESS] ARCH-X operational integrity has been fully verified."
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setDiagnosticLogs((prev) => [...prev, `[+] ${step}`]);
        if (index === steps.length - 1) {
          setIsScanning(false);
          addXp(50, "Completed live secure topology diagnostic audit!");
        }
      }, (index + 1) * 800);
    });
  };

  // Submit OSINT flag
  const checkOsintAnswer = () => {
    if (!selectedOsint) return;
    const cleanInput = osintInput.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanAnswer = selectedOsint.correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (cleanInput.includes(cleanAnswer) || cleanAnswer.includes(cleanInput)) {
      setOsintFeedback({
        status: "correct",
        msg: `Spectacular! "${selectedOsint.correctAnswer}" is correct.`
      });

      if (!userProfile.completedOsint.includes(selectedOsint.id)) {
        const cost = (revealedHints[selectedOsint.id] || 0) * 15;
        const reward = Math.max(20, selectedOsint.points - cost);
        const nextCompleted = [...userProfile.completedOsint, selectedOsint.id];
        saveProfile({ ...userProfile, completedOsint: nextCompleted });
        addXp(reward, `Solved OSINT Operation: ${selectedOsint.title}!`);
      }
    } else {
      setOsintFeedback({
        status: "incorrect",
        msg: "Negative validation. Analyze the hints or landscape details again."
      });
    }
  };

  // Reveal progressive hint
  const triggerHint = (challengeId: string) => {
    const currentCount = revealedHints[challengeId] || 0;
    if (currentCount < 3) {
      setRevealedHints({
        ...revealedHints,
        [challengeId]: currentCount + 1
      });
      triggerNotification(`Revealed hint ${currentCount + 1}. XP potential reduced.`);
    }
  };

  // Submit Community Idea
  const submitIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim() || !newIdeaDesc.trim()) return;

    const newIdea = {
      id: "id-" + Date.now(),
      title: newIdeaTitle,
      desc: newIdeaDesc,
      category: newIdeaCategory,
      votes: 1,
      author: userProfile.username
    };

    const updated = [newIdea, ...communityIdeas];
    setCommunityIdeas(updated);
    localStorage.setItem("archx_community_ideas", JSON.stringify(updated));
    setNewIdeaTitle("");
    setNewIdeaDesc("");
    triggerNotification("Idea shared to public suggestions board!");
  };

  // Upvote Idea
  const upvoteIdea = (id: string) => {
    if (votedIdeas.includes(id)) {
      triggerNotification("You have already voted for this community proposal.");
      return;
    }
    const updated = communityIdeas.map((idea) => (idea.id === id ? { ...idea, votes: idea.votes + 1 } : idea));
    setCommunityIdeas(updated);
    localStorage.setItem("archx_community_ideas", JSON.stringify(updated));

    const nextVoted = [...votedIdeas, id];
    setVotedIdeas(nextVoted);
    localStorage.setItem("archx_voted_ideas", JSON.stringify(nextVoted));
    
    triggerNotification("Upvote registered!");
  };

  // Trigger select course from footer or main lists
  const handleSelectCourse = (courseId: string) => {
    const course = COURSES.find((c) => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setActiveTab("courses");
      setSelectedCourseTab("sop");
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizPassed(false);
      setTerminalHistory([course.simulation.terminalWelcome]);
    }
  };

  if (!isLoggedIn) {
    return (
      <div
        className="relative min-h-screen flex flex-col justify-center items-center text-zinc-100 bg-zinc-950 overflow-x-hidden p-4 sm:p-6"
        style={{ 
          fontFamily: '"Helvetica Now Var", Helvetica, Arial, sans-serif'
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Moving canvas grain / noise texture overlay */}
        <div className="fixed inset-[-100%] w-[300%] h-[300%] grain-overlay pointer-events-none z-40"></div>

        {/* Background Gradients & Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-900/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Sweeping background paths with flowing glow tracers */}
        <BackgroundPaths />

        <div className="relative z-10 w-full max-w-md bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col gap-6">
          
          {/* Logo Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-zinc-950 border border-zinc-850 rounded-xl shadow-sm shadow-white/5 group">
              <ArchXLogo className="text-zinc-100" size={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase">ARCH-X MAINFRAME</h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Operator Authorization Portal</p>
            </div>
          </div>

          {/* Tab Selector: AUTHORIZE vs ENLIST */}
          <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
            <button
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
              className={`py-2 text-[11px] font-mono uppercase tracking-widest rounded-lg font-bold transition-all ${
                authMode === "login"
                  ? "bg-zinc-850 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Authorize (Login)
            </button>
            <button
              onClick={() => { setAuthMode("register"); setAuthError(""); }}
              className={`py-2 text-[11px] font-mono uppercase tracking-widest rounded-lg font-bold transition-all ${
                authMode === "register"
                  ? "bg-zinc-850 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Enlist (Register)
            </button>
          </div>

          {/* Error Message banner */}
          {authError && (
            <div className="bg-rose-950/45 border border-rose-900/50 rounded-xl p-3 flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 animate-pulse"></div>
              <p className="text-xs text-rose-300 leading-normal">{authError}</p>
            </div>
          )}

          {/* Form */}
          {mfaChallenge ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">2FA Decryption Code</h4>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  A multi-factor authorization passkey has been routed to:
                  <span className="block font-bold text-white mt-1 font-mono truncate">{mfaTargetUser?.email || "your registered email"}</span>
                </p>
                <div className="pt-2">
                  <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded">
                    MFA ENFORCED SHIELD
                  </span>
                </div>
              </div>

              {authSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-emerald-400 font-mono leading-normal">{authSuccess}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">6-Digit Access Token</label>
                <input
                  type="text"
                  maxLength={6}
                  value={authOtp}
                  onChange={(e) => setAuthOtp(e.target.value)}
                  placeholder="e.g. 582914"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-zinc-750 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMfaChallenge(false);
                    setMfaTargetUser(null);
                    setAuthOtp("");
                    setAuthSuccess("");
                    setAuthError("");
                  }}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-300 text-[10px] font-mono py-3.5 rounded-xl uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs tracking-wider font-extrabold py-3.5 rounded-xl uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <span>Verify Code</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>

              {/* Helper link for easy manual dev testing */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthOtp(generatedOtp);
                    triggerNotification("MFA Token auto-filled for verification.");
                  }}
                  className="text-[9px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest underline cursor-pointer"
                >
                  ⚡ Auto-fill MFA Code (Dev Override)
                </button>
              </div>
            </form>
          ) : authMode === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 text-center space-y-1">
                <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">Forgot Passkey</h4>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Enter your credentials to verify security signature and trigger a 2FA bypass OTP.
                </p>
              </div>

              {authSuccess && (
                <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-emerald-400 font-mono leading-normal">{authSuccess}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Operator Handle</label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="e.g. operator_x"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Operational Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. operator@archx.io"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-300 text-[10px] font-mono py-3.5 rounded-xl uppercase tracking-wider font-bold transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs tracking-wider font-extrabold py-3.5 rounded-xl uppercase flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <span>Dispatch OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : authMode === "reset" ? (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 text-center space-y-1">
                <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">Reset Credentials</h4>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  OTP verified. Define your new master passkey string to authorize session access.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">New Passkey String</label>
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Confirm New Passkey</label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs tracking-wider font-extrabold py-3.5 rounded-xl uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-white/5 mt-2 cursor-pointer"
              >
                <span>Save Credentials & Authorize</span>
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Operator Handle</label>
                <div className="relative">
                  <input
                    type="text"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="e.g. operator_x"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750 transition-colors"
                  />
                </div>
              </div>

              {authMode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Operational Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. operator@archx.io"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Passkey String</label>
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("forgot");
                        setAuthError("");
                        setAuthSuccess("");
                      }}
                      className="text-[9px] font-mono text-zinc-400 hover:text-white uppercase tracking-widest underline transition-colors cursor-pointer"
                    >
                      Forgot Passkey?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750 transition-colors"
                  />
                </div>
              </div>

              {authMode === "register" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Confirm Passkey</label>
                    <input
                      type="password"
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-750 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Cyber Security Callsign</label>
                    <select
                      value={authCallsign}
                      onChange={(e) => setAuthCallsign(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-750 transition-colors"
                    >
                      <option value="Security Operator">Security Operator (Generalist)</option>
                      <option value="SOC Analyst">SOC Analyst (Blue Team)</option>
                      <option value="Penetration Tester">Penetration Tester (Red Team)</option>
                      <option value="Threat Hunter">Threat Hunter (Active Intel)</option>
                      <option value="Digital Forensics Investigator">Digital Forensics Investigator</option>
                      <option value="DevSecOps Engineer">DevSecOps Engineer</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">UI Terminal Accent</label>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { name: "slate", class: "bg-zinc-400" },
                        { name: "emerald", class: "bg-emerald-500" },
                        { name: "cyan", class: "bg-cyan-500" },
                        { name: "amber", class: "bg-amber-500" },
                        { name: "rose", class: "bg-rose-500" },
                        { name: "indigo", class: "bg-indigo-500" }
                      ].map((col) => (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setAuthAccentColor(col.name)}
                          className={`h-8 rounded-lg flex items-center justify-center border transition-all ${
                            authAccentColor === col.name
                              ? "border-white bg-zinc-850"
                              : "border-transparent bg-zinc-950 hover:bg-zinc-900"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${col.class}`}></span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs tracking-wider font-extrabold py-3.5 rounded-xl uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-white/5 mt-2 cursor-pointer"
              >
                <span>{authMode === "login" ? "INITIALIZE AUTHORIZATION" : "SUBMIT ENLISTMENT"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-850"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest font-bold">OR</span>
            <div className="flex-grow border-t border-zinc-850"></div>
          </div>

          {/* Bypass Option */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-850 text-[10px] font-mono py-3 rounded-xl uppercase tracking-widest transition-colors font-bold"
            >
              Request Guest Access Bypass
            </button>
            <p className="text-[9px] font-mono text-zinc-500 text-center leading-normal">
              Authentication uses browser sandbox local storage.<br />
              Guest access provides single-click sandbox testing.
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex flex-col text-zinc-100 bg-zinc-950 overflow-x-hidden select-none"
      style={{ 
        fontFamily: '"Helvetica Now Var", Helvetica, Arial, sans-serif'
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Moving canvas grain / noise texture overlay */}
      <div className="fixed inset-[-100%] w-[300%] h-[300%] grain-overlay pointer-events-none z-40"></div>

      {/* Dynamic Ambient Glow Auroras */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-zinc-800/10 blur-[130px] mix-blend-screen pointer-events-none z-0 animate-float-1"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full bg-zinc-900/20 blur-[150px] mix-blend-screen pointer-events-none z-0 animate-float-2"></div>
      <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-zinc-850/10 blur-[120px] mix-blend-screen pointer-events-none z-0 animate-float-2" style={{ animationDelay: '-12s' }}></div>

      {/* Cinematic grid (Pulsing) */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0 animate-pulse-grid"></div>

      {/* Cybernetic slow sweep laser scanline */}
      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/20 to-transparent pointer-events-none z-0 animate-scanline-laser"></div>

      {/* Sweeping background paths with flowing glow tracers */}
      <BackgroundPaths />

      <div className="relative z-10 flex flex-col min-h-screen bg-zinc-950/40 backdrop-blur-[1px]">
        
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between px-6 md:px-12 lg:px-16 py-5 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md relative z-50">
          
          {/* Logo & Platform Name */}
          <button
            onClick={() => { setActiveTab("home"); setSelectedCourse(null); }}
            className="flex items-center gap-3 group focus:outline-none cursor-pointer"
          >
            {/* Custom circular dragon logo */}
            <div className="w-10 h-10 flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-xl transition-all group-hover:border-zinc-700 duration-500 shadow-md shadow-white/5">
              <ArchXLogo className="text-zinc-100" size={28} />
            </div>
            <span className="text-zinc-100 text-xl font-black tracking-widest hover:text-white transition-colors flex items-center gap-1.5">
              ARCH-X <span className="text-[10px] text-zinc-400 font-mono font-normal tracking-wide bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">LABS</span>
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => { setActiveTab("home"); setSelectedCourse(null); }}
              className={`text-xs uppercase tracking-widest transition-all ${
                activeTab === "home" ? "text-white font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Domain Core
            </button>
            <button
              onClick={() => { setActiveTab("courses"); }}
              className={`text-xs uppercase tracking-widest transition-all ${
                activeTab === "courses" ? "text-white font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Security Courses
            </button>
            <button
              onClick={() => { setActiveTab("osint"); }}
              className={`text-xs uppercase tracking-widest transition-all ${
                activeTab === "osint" ? "text-white font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              OSINT Missions
            </button>
            <button
              onClick={() => { setActiveTab("community"); }}
              className={`text-xs uppercase tracking-widest transition-all ${
                activeTab === "community" ? "text-white font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Suggestions
            </button>
            <button
              onClick={() => { setActiveTab("profile"); }}
              className={`text-xs uppercase tracking-widest transition-all ${
                activeTab === "profile" ? "text-white font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Operator Panel
            </button>
          </div>

          {/* User profile identifier (right) */}
          <div className="hidden lg:block">
            <button
              onClick={() => setActiveTab("profile")}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-transform active:scale-95 shadow-sm shadow-white/5"
            >
              <span>{userProfile.username}</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-zinc-300 focus:outline-none transition-colors z-[60]"
          >
            <div className="relative w-6 h-6">
              <Menu
                className={`absolute inset-0 transition-all duration-300 ${
                  mobileMenuOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                className={`absolute inset-0 transition-all duration-300 ${
                  mobileMenuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                }`}
              />
            </div>
          </button>
        </nav>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-md"
            ></div>

            {/* Menu container */}
            <div className="absolute left-0 right-0 top-[68px] z-50">
              <div className="bg-zinc-900 border-b border-zinc-800 p-8 flex flex-col items-center gap-6 relative z-10">
                {[
                  { label: "Domain Core", tab: "home" },
                  { label: "Security Courses", tab: "courses" },
                  { label: "OSINT Missions", tab: "osint" },
                  { label: "Suggestions", tab: "community" },
                  { label: "Operator Panel", tab: "profile" }
                ].map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab as any);
                      setMobileMenuOpen(false);
                    }}
                    className="text-sm font-bold uppercase tracking-widest text-zinc-300 hover:text-white transition-all"
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setMobileMenuOpen(false);
                  }}
                  className="bg-zinc-100 text-zinc-950 text-xs font-bold px-8 py-3 rounded-lg flex items-center gap-2 w-full justify-center"
                >
                  <span>ACCESS PROFILE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Multi-Notification Stack in Bottom-Left Corner */}
        {notifications.length > 0 && (
          <div className="fixed bottom-6 left-6 flex flex-col-reverse gap-3 z-50 max-w-sm w-[calc(100vw-32px)] sm:w-80 pointer-events-none">
            {notifications.slice(0, 4).map((notif, index) => {
              // A stackable visual deck effect
              const offset = index * 2;
              const scale = 1 - index * 0.02;
              
              return (
                <div
                  key={notif.id}
                  style={{
                    transform: `translateY(${offset}px) scale(${scale})`,
                    zIndex: 50 - index
                  }}
                  className="pointer-events-auto bg-zinc-950/95 border border-zinc-800 text-xs p-4 rounded-xl shadow-2xl flex items-start gap-3 transition-all duration-300 backdrop-blur-md relative overflow-hidden hover:border-zinc-600 hover:-translate-y-0.5"
                >
                  <div className="absolute left-0 inset-y-0 w-[3px] bg-zinc-100"></div>
                  
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">SYSTEM MONITOR</span>
                      </div>
                    </div>
                    <p className="text-zinc-300 text-left leading-relaxed font-sans text-xs">
                      {notif.message}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className="text-zinc-500 hover:text-white transition-colors p-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md cursor-pointer shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* VM Telemetry Status Overlay */}
        <VMStatusOverlay
          vmStatus={vmStatus}
          vmIP={vmIP}
          vmPort={vmPort}
          vmUptime={vmUptime}
          vmCPU={vmCPU}
          vmRAM={vmRAM}
          metricHistory={metricHistory}
          onShutdown={handleShutdownVM}
        />

        {/* MAIN BODY AREA */}
        <main className="flex-1 flex flex-col relative z-10">
          <div key={activeTab + (selectedCourse ? `-${selectedCourse.id}` : '')} className="animate-monitor-fade flex-1 flex flex-col">

          {/* TAB 1: HOME PAGE / VIEWPORT LANDING */}
          {activeTab === "home" && !selectedCourse && (
            <div className="flex-1 flex flex-col lg:flex-row items-center px-6 md:px-12 lg:px-16 py-8 md:py-16 gap-12 max-w-7xl mx-auto w-full">
              
              {/* Left Column: Core pitch and information */}
              <div className="flex-1 flex flex-col text-left justify-center">
                <div className="inline-flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-xs font-mono text-zinc-300 mb-6 w-fit">
                  <Shield className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="tracking-wider">INTERACTIVE SIMULATION LAB // NOT A CLOUD SERVICE</span>
                </div>

                <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-4 parallax-element-heavy">
                  ARCH-X <br />
                  <span className="text-zinc-400 font-normal">SECURITY OPERATIONS LABS</span>
                </h1>

                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
                  Step into an interactive security playground. Practice isolating simulated SSH brute force attempts, audit OAuth JWT headers, explore Continuous Integration secrets leaks, and master high-fidelity OSINT missions using real world landscapes. Optimized for zero system resource overhead. Built strictly for secure education.
                </p>

                {/* Main Action buttons */}
                <div className="flex flex-wrap gap-4 mb-8">
                  <button
                    onClick={() => setActiveTab("courses")}
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs tracking-wider font-extrabold px-8 py-4 rounded-lg uppercase flex items-center gap-2 transition-transform active:scale-95 shadow-sm shadow-white/10"
                  >
                    <span>Launch Training Tracks</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("osint")}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/60 text-xs tracking-wider font-bold px-8 py-4 rounded-lg uppercase flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <span>Tactical OSINT Missions</span>
                    <Compass className="w-4 h-4" />
                  </button>
                </div>

                {/* System Stats Counters */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-850 max-w-lg">
                  <div>
                    <p className="text-2xl font-black text-white">11</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Specialized Tracks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">12</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">OSINT Exercises</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-zinc-300">0%</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Local PC Load</p>
                  </div>
                </div>
              </div>

              {/* Right Column: ARCH-X Integrated Lab Overview (Replaces cloud rotating node canvas) */}
              <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[340px]">
                
                {/* Visual Grid Backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none rounded-2xl"></div>

                <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between cyber-card-glow parallax-element-medium">
                  {/* Top Header details */}
                  <div className="flex justify-between items-start pb-4 border-b border-zinc-800 mb-4">
                    <div>
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">INTEGRATED SIMULATOR</p>
                      <h3 className="text-base font-black text-white tracking-wide">ARCH-X Security Core Deck</h3>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded uppercase">
                      INTEGRITY: 100%
                    </span>
                  </div>

                  {/* Environment details list */}
                  <div className="space-y-2 mb-4 text-xs font-mono">
                    <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded border border-zinc-850">
                      <span className="text-zinc-500">ENVIRONMENT TYPE:</span>
                      <span className="text-zinc-300 font-bold">Isolated Educational Sandbox</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded border border-zinc-850">
                      <span className="text-zinc-500">ACTIVE TRACKS LOADED:</span>
                      <span className="text-zinc-300 font-bold">11 Core Curriculum Nodes</span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded border border-zinc-850">
                      <span className="text-zinc-500">ENCRYPTION ENGINE:</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={encryptionStandard}
                          onChange={(e) => {
                            setEncryptionStandard(e.target.value);
                            triggerNotification(`Simulator cryptographic scope rotated to: ${e.target.value}`);
                          }}
                          className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded text-[10px] px-1.5 py-0.5 focus:outline-none"
                        >
                          <option value="AES-GCM-256">AES-GCM-256 (Def)</option>
                          <option value="ChaCha20-Poly1305">ChaCha20 (High-Speed)</option>
                          <option value="RSA-4096-PSS">RSA-4096 (Legacy)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Interactive logs printout sandbox */}
                  <div className={`bg-zinc-950 border border-zinc-850 p-4 rounded-xl mb-4 transition-all ${isLogsGlitching ? 'cyber-glitch-active border-zinc-500 shadow-md shadow-white/5' : ''}`}>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold mb-2">Simulated Live Log Feed:</p>
                    <div className="h-28 overflow-y-auto space-y-1 font-mono text-[10px] text-zinc-400">
                      {diagnosticLogs.map((log, idx) => (
                        <p key={idx} className="leading-relaxed hover:text-white transition-colors">{log}</p>
                      ))}
                    </div>
                  </div>

                  {/* Primary interactive diagnostic action */}
                  <div className="flex gap-3">
                    <button
                      onClick={triggerLabDiagnostics}
                      disabled={isScanning}
                      className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold py-3 px-4 rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>{isScanning ? "Scanning Topology..." : "Run Simulated Diagnostics"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setDiagnosticLogs([
                          "[ARCH-X] Simulator core reset completed.",
                          "[ARCH-X] Logging queues cleared. Ready for next test audit."
                        ]);
                        triggerNotification("Simulated diagnostic logs flushed.");
                      }}
                      className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 px-3.5 rounded-lg text-xs font-bold uppercase transition-colors"
                      title="Clear logs"
                    >
                      FLUSH
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: SPECIALIZED SECURITY COURSES */}
          {activeTab === "courses" && (
            <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full flex flex-col">
              
              {!selectedCourse ? (
                // Course Track Browser
                <div className="flex-1 flex flex-col">
                  <div className="text-center md:text-left mb-10">
                    <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-2">
                      Specialized <span className="font-extrabold text-zinc-100">Security Tracks</span>
                    </h2>
                    <p className="text-sm text-zinc-400 max-w-xl">
                      Select a track matching your training level. Each course contains step-by-step SOP execution procedures, extensive field manuals, loophole walkthroughs, and direct sandboxed terminal checks.
                    </p>
                  </div>

                  {/* Course Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {COURSES.map((course) => {
                      const isCompleted = userProfile.completedCourses.includes(course.id);
                      return (
                        <div
                          key={course.id}
                          className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 flex flex-col justify-between group shadow-xl cyber-card-glow hover:scale-[1.01]"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border ${
                                course.difficulty === "Beginner" 
                                  ? "bg-zinc-800 border-zinc-700 text-zinc-300"
                                  : course.difficulty === "Intermediate"
                                  ? "bg-zinc-800 border-zinc-600 text-zinc-200"
                                  : "bg-zinc-900 border-zinc-500 text-white"
                              }`}>
                                {course.difficulty}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {course.estimatedTime}
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 tracking-wide group-hover:text-zinc-300 transition-colors">
                              {course.title}
                            </h3>

                            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                              {course.shortDesc}
                            </p>

                            {/* MITRE progress mini markers */}
                            <div className="space-y-2 mb-6">
                              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                <span>Core MITRE Tactics</span>
                                <span>Weight %</span>
                              </div>
                              {course.mitreCoverage.slice(0, 2).map((cov, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-zinc-400 w-28 truncate">{cov.tactic}</span>
                                  <div className="flex-1 bg-zinc-950 h-1 rounded-full overflow-hidden">
                                    <div
                                      className="bg-zinc-400 h-full"
                                      style={{ width: `${cov.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-300">{cov.percentage}%</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                            {isCompleted ? (
                              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                                <CheckCircle className="w-4 h-4 text-zinc-300" /> Complete
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                                400 XP Reward
                              </span>
                            )}
                            <button
                              onClick={() => handleSelectCourse(course.id)}
                              className="text-xs font-bold tracking-wider text-white group-hover:text-zinc-300 transition-colors flex items-center gap-1"
                            >
                              <span>LAUNCH DECK</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // ACTIVE COURSE WORKSPACE
                <div className={`flex-1 flex flex-col gap-6 ${(isGuidebookExpanded && selectedCourseTab === "guidebook") ? "" : "lg:flex-row"}`}>
                  
                  {/* Left panel: Info, SOP, Theory or Quizzes */}
                  <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col backdrop-blur-sm shadow-2xl">
                    
                    {/* Header bar */}
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                      <div>
                        <button
                          onClick={() => setSelectedCourse(null)}
                          className="text-xs font-mono text-zinc-500 hover:text-white transition-colors uppercase tracking-wider mb-1 flex items-center gap-1"
                        >
                          ✕ Exit to Selection
                        </button>
                        <h2 className="text-xl font-bold tracking-wide text-white">{selectedCourse.title}</h2>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded uppercase tracking-wider">
                          Active Sandbox Unit
                        </span>
                      </div>
                    </div>

                    {/* SOP / Theory / Guidebook / Practice selectors */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <button
                        onClick={() => setSelectedCourseTab("sop")}
                        className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all cursor-pointer ${
                          selectedCourseTab === "sop" ? "bg-zinc-100 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        SOP Guide
                      </button>
                      <button
                        onClick={() => setSelectedCourseTab("guidebook")}
                        className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all cursor-pointer ${
                          selectedCourseTab === "guidebook" ? "bg-zinc-100 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        🧠 Intel Guidebook
                      </button>
                      <button
                        onClick={() => setSelectedCourseTab("theory")}
                        className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all cursor-pointer ${
                          selectedCourseTab === "theory" ? "bg-zinc-100 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        Field Book & Quiz
                      </button>
                      <button
                        onClick={() => setSelectedCourseTab("practice")}
                        className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest transition-all cursor-pointer ${
                          selectedCourseTab === "practice" ? "bg-zinc-100 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        Simulation Deck
                      </button>
                    </div>

                    {/* CONTENT ACCORDING TO ACTIVE TAB */}
                    {selectedCourseTab === "sop" && (
                      <div className="flex-1 flex flex-col overflow-y-auto pr-2 space-y-6">
                        {/* Objectives Callout */}
                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-300 mb-1 flex items-center gap-1.5 font-bold">
                            <Shield className="w-3.5 h-3.5" /> Core Target Objective
                          </h4>
                          <p className="text-sm text-zinc-200 leading-relaxed">
                            {selectedCourse.sopObjective}
                          </p>
                        </div>

                        {/* Analogy Callout */}
                        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
                          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1.5 font-bold">
                            <BookOpen className="w-3.5 h-3.5" /> Conceptual Analogy
                          </h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {selectedCourse.sopAnalogy}
                          </p>
                        </div>

                        {/* SOP Steps Checkbox List */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3 font-bold">SOP Steps Execution Outline:</h4>
                          {selectedCourse.sopSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                              <span className="w-5 h-5 rounded-full bg-zinc-900 text-[10px] font-mono text-white flex items-center justify-center border border-zinc-800 shrink-0 font-bold">
                                {idx + 1}
                              </span>
                              <p className="text-xs text-zinc-300 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>

                        {/* Proceed action button */}
                        <button
                          onClick={() => setSelectedCourseTab("guidebook")}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                        >
                          <span>Proceed to Intel Guidebook</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {selectedCourseTab === "guidebook" && (() => {
                      const markdownContent = COURSE_GUIDEBOOKS[selectedCourse.id]?.markdown || "";
                      const headings = markdownContent
                        .split("\n")
                        .filter((line: string) => line.startsWith("## "))
                        .map((line: string) => line.replace("## ", "").trim());

                      return (
                        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-[500px]">
                          {/* Guidebook left index sidebar */}
                          <div className="w-full lg:w-64 bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between space-y-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">OPERATIONS INDEX</span>
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30 font-bold uppercase">LIVE</span>
                              </div>
                              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                                {headings.length === 0 ? (
                                  <p className="text-[10px] font-mono text-zinc-500 italic px-2">No index subdivisions found.</p>
                                ) : (
                                  headings.map((heading, hIdx) => {
                                    const headingId = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                                    return (
                                      <button
                                        key={hIdx}
                                        onClick={() => {
                                          const element = document.getElementById(headingId);
                                          if (element) {
                                            element.scrollIntoView({ behavior: "smooth", block: "start" });
                                            triggerNotification(`Scrolled to section: ${heading}`);
                                          } else {
                                            triggerNotification(`Heading locator error: ${heading}`);
                                          }
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-lg transition-all border border-transparent hover:border-zinc-850 truncate block cursor-pointer"
                                        title={heading}
                                      >
                                        <span className="text-zinc-600 mr-1.5 font-bold">{String(hIdx + 1).padStart(2, "0")}</span>
                                        {heading}
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-850 space-y-2">
                              <button
                                onClick={() => {
                                  setIsGuidebookExpanded(!isGuidebookExpanded);
                                  triggerNotification(isGuidebookExpanded ? "Immersive full-bleed reader deactivated." : "Immersive full-bleed reader activated.");
                                }}
                                className="w-full bg-zinc-900 hover:bg-zinc-850 text-white text-[10px] font-mono font-bold py-2 px-3 rounded-lg uppercase tracking-wider transition-all border border-zinc-800 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                                <span>{isGuidebookExpanded ? "Collapse View" : "Fullscreen Focus"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Guidebook right content pane */}
                          <div className="flex-1 flex flex-col bg-zinc-950/40 border border-zinc-850 p-6 rounded-xl overflow-y-auto max-h-[500px]">
                            <div className="space-y-6">
                              {/* Guidebook Header Inside Content */}
                              <div className="bg-zinc-900/60 border border-zinc-850 p-5 rounded-xl">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">OPERATIONS INTEL MANUAL</p>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wide mt-1">
                                  {COURSE_GUIDEBOOKS[selectedCourse.id]?.title || "Course Intel Guidebook"}
                                </h3>
                              </div>

                              {/* Prerequisites banner */}
                              <div className="space-y-2.5 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                                <h4 className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Prerequisite Knowledge Blocks:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {(COURSE_GUIDEBOOKS[selectedCourse.id]?.prerequisites || []).map((pre, idx) => (
                                    <span key={idx} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg font-mono">
                                      • {pre}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Render real markdown body */}
                              {COURSE_GUIDEBOOKS[selectedCourse.id] ? (
                                <MarkdownRenderer content={COURSE_GUIDEBOOKS[selectedCourse.id].markdown} />
                              ) : (
                                <p className="text-xs text-zinc-400 font-mono">No detailed manual available for this track.</p>
                              )}

                              <button
                                onClick={() => setSelectedCourseTab("practice")}
                                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold py-3.5 px-6 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2 font-sans cursor-pointer mt-4"
                              >
                                <span>Proceed to Simulation Deck</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {selectedCourseTab === "theory" && (
                      <div className="flex-1 flex flex-col overflow-y-auto pr-2 space-y-6">
                        
                        {/* Course Manual Header */}
                        <div className="border-b border-zinc-800 pb-2">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">SECTION 1</p>
                          <h3 className="text-base font-bold text-white uppercase tracking-wide">The ARCH-X Technical Guidebook</h3>
                        </div>

                        {/* Lesson Prose */}
                        {selectedCourse.lessons.map((lesson, index) => (
                          <div key={index} className="space-y-6">
                            <div
                              className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-xl text-zinc-300"
                              dangerouslySetInnerHTML={{ __html: lesson.content }}
                            />

                            {/* ATTACKER LOOPHOLES MANUAL (Requested by user) */}
                            <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-zinc-300" />
                                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-100 font-bold">Attacker Loophole Analysis & Vectors</h4>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                                This section documents specific vulnerabilities, configuration failures, and attacker methods used to exploit this target domain:
                              </p>
                              <div className="space-y-2">
                                {selectedCourse.loopholes.map((loophole, idx) => (
                                  <div key={idx} className="bg-zinc-900/60 p-3 rounded border border-zinc-850 text-xs text-zinc-300">
                                    <span className="font-mono text-zinc-500 font-bold block mb-1">LOOPHOLE TARGET #{idx + 1}</span>
                                    {loophole}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* PROFESSIONAL INTERVIEW DRILLS (Requested by user) */}
                            <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl">
                              <div className="flex items-center gap-2 mb-3">
                                <Award className="w-4 h-4 text-zinc-300" />
                                <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-100 font-bold">Operator Interview Drill Book</h4>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                                Clear your future technical interviews with ease. Practice speaking these authoritative security responses during hiring panels:
                              </p>
                              <div className="space-y-4">
                                {selectedCourse.interviewTips.map((tip, idx) => (
                                  <div key={idx} className="border-l-2 border-zinc-700 pl-3.5 space-y-1.5">
                                    <p className="text-xs font-bold text-white">Q: {tip.question}</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/40 p-2.5 rounded border border-zinc-850">
                                      <span className="font-mono text-[10px] text-zinc-300 font-bold uppercase block mb-1">RECOMMENDED ANSWER SUMMARY</span>
                                      {tip.answer}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Live Quiz block */}
                            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl">
                              <h3 className="text-sm font-bold tracking-widest text-white uppercase mb-4 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-zinc-300" /> DECK COMPREHENSION VERIFICATION
                              </h3>
                              
                              <div className="space-y-6">
                                {lesson.quizzes.map((quiz, qIdx) => (
                                  <div key={quiz.id} className="space-y-3">
                                    <p className="text-xs font-semibold text-white">
                                      {qIdx + 1}. {quiz.question}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                      {quiz.options.map((option, optIdx) => {
                                        const isSelected = quizAnswers[quiz.id] === optIdx;
                                        return (
                                          <button
                                            key={optIdx}
                                            disabled={quizSubmitted}
                                            onClick={() => setQuizAnswers({ ...quizAnswers, [quiz.id]: optIdx })}
                                            className={`p-3 rounded-lg text-left text-xs transition-all border ${
                                              isSelected
                                                ? "bg-zinc-800 border-zinc-500 text-white font-bold"
                                                : "bg-zinc-900 border-zinc-850 hover:border-zinc-700 text-zinc-400"
                                            }`}
                                          >
                                            {option}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {quizSubmitted && (
                                      <p className="text-[11px] font-mono p-2.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                                        <span className={quizAnswers[quiz.id] === quiz.correctAnswerIndex ? "text-zinc-200 font-bold" : "text-zinc-500 font-bold"}>
                                          {quizAnswers[quiz.id] === quiz.correctAnswerIndex ? "✓ Correct" : "✗ Incorrect"}:
                                        </span>{" "}
                                        {quiz.explanation}
                                      </p>
                                    )}
                                  </div>
                                ))}

                                {!quizSubmitted ? (
                                  <button
                                    onClick={() => {
                                      if (Object.keys(quizAnswers).length < lesson.quizzes.length) {
                                        triggerNotification("Please answer all validation check questions to proceed.");
                                        return;
                                      }
                                      setQuizSubmitted(true);
                                      const passed = lesson.quizzes.every(
                                        (q) => quizAnswers[q.id] === q.correctAnswerIndex
                                      );
                                      setQuizPassed(passed);
                                      if (passed) {
                                        addXp(150, `Successfully completed textbook quizzes for ${selectedCourse.title}!`);
                                      } else {
                                        triggerNotification("Comprehension check complete with errors. Review the field book material and retry.");
                                      }
                                    }}
                                    className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors"
                                  >
                                    Validate Answers
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setQuizAnswers({});
                                      setQuizSubmitted(false);
                                      setQuizPassed(false);
                                    }}
                                    className="w-full border border-zinc-800 hover:bg-zinc-900 text-white font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                  >
                                    <RotateCcw className="w-4 h-4 text-zinc-400" /> Reset Questions
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedCourseTab === "practice" && (
                      <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-4">
                          
                          {/* Active Incident Response Scenario Card */}
                          <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-100"></div>
                            
                            <div className="flex items-center justify-between mb-3.5">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-100 animate-ping"></span>
                                <span className="text-[10px] font-mono tracking-widest text-zinc-100 font-bold uppercase">ACTIVE DEFENSIVE SCENARIO</span>
                              </span>
                              <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded font-mono font-bold">
                                SEVERITY: HIGH
                              </span>
                            </div>

                            {(() => {
                              const courseId = selectedCourse.id;
                              let title = "Anomalous System Activity Detected";
                              let description = "Our security indicators have raised a high-priority alert on the container node. Host network pathways show abnormal packet distributions.";
                              let objective = "Inspect the simulated alert feed, determine the compromise vector, and run the mitigation utility inside the Sandbox Terminal on the right to secure the container node.";
                              let hintText = "Run the 'status' command inside the terminal on the right to fetch real-time firewall audit suggestions and locate any abnormal telemetry patterns.";

                              if (courseId === "soc-analyst") {
                                title = "SSH Auth Brute-Force Wave";
                                description = "An offshore network block is launching high-frequency password-stuffing attacks against Port 22 of our central application node. Raw logs indicate multiple login failure attempts per second targeting administrative accounts.";
                                objective = "Find the malicious attacker's source IP address in the logs below, and execute the firewall block command 'block-ip <IP_ADDRESS>' in the terminal console to drop subsequent connections and claim the flag.";
                                hintText = "Check the logs below to locate the IP address with the highest frequency of failed entries: '198.51.100.12'. Run 'block-ip 198.51.100.12' to set the firewall rule.";
                              } else if (courseId === "pentest") {
                                title = "Vulnerable REST API Verification";
                                description = "A server node in our local subnet (10.10.1.5) is suspected of hosting an outdated API daemon containing a critical input buffer bypass vulnerability leading to remote command shells.";
                                objective = "Run Nmap with version scans against the server node, identify the vulnerable port, and pivot using the custom 'exploit-api --version v1.02' utility command to capture root shell access.";
                                hintText = "Step 1: Execute 'nmap -sV 10.10.1.5' to discover running services. Step 2: Note the CoreAPI version on Port 8080 (v1.02). Step 3: Run 'exploit-api --version v1.02' in the console.";
                              } else if (courseId === "devsecops") {
                                title = "Exposed AWS Access Key in Git History";
                                description = "A developer has accidentally committed active third-party cloud infrastructure access credentials inside our public repository trees. This key could allow unauthorized actors to hijack global cloud VM systems.";
                                objective = "Scan the repository's historical commits using 'git-scan', identify the compromised key ID, and revoke the credentials immediately using 'invalidate-key <KEY_ID>' to secure the pipeline.";
                                hintText = "Step 1: Run 'git-scan' inside the terminal console. Step 2: Copy the leaked key ID starting with 'AKIA_LEAKED_SECRET_99'. Step 3: Execute 'invalidate-key AKIA_LEAKED_SECRET_99'.";
                              } else if (courseId === "network-security") {
                                title = "Rogue Gateway ARP Spoofing";
                                description = "Local server nodes are failing to authenticate with the primary database. An unauthorized rogue gateway is broadcasting spoofed ARP signals to intercept and redirect our local server packets.";
                                objective = "Run ARP check commands in the terminal, identify the hardware signature of the rogue adapter, and execute local drop-route rules to isolate the attacking network cards.";
                                hintText = "Step 1: Check ARP tables using 'view-arp'. Step 2: Identify the rogue network interface or spoofed IP. Step 3: Execute the routing command to drop traffic from the rogue card.";
                              } else if (courseId === "mobile-audit") {
                                title = "Plaintext SQL Session Database Leak";
                                description = "Our mobile application's local user directory hosts unencrypted credentials inside an SQLite cache. An attacker with physical phone access can dump the database to hijack credentials.";
                                objective = "Inspect the mobile application's local directories, dump the plaintext session cookies from the database, and run 'harden-storage' to deploy SQLCipher AES encryption on the database.";
                                hintText = "Step 1: Run 'view-sandbox' to explore the folder. Step 2: Execute 'dump-sqlite' to read plaintext sessions. Step 3: Run 'harden-storage' to encrypt databases using secure keychains.";
                              }

                              return (
                                <div className="space-y-3.5">
                                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">{title}</h3>
                                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">{description}</p>
                                  <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-lg text-xs">
                                    <p className="text-zinc-300 font-bold mb-1">🏁 OPERATIONAL OBJECTIVE:</p>
                                    <p className="text-zinc-400 leading-normal font-sans">{objective}</p>
                                  </div>

                                  {/* Hidden Hint Drawer (Triggered by user click and alert) */}
                                  <div className="pt-2 border-t border-zinc-850">
                                    {!showPracticeHint ? (
                                      <button
                                        onClick={() => {
                                          setShowPracticeHint(true);
                                          triggerNotification("[SECURE DECRYPTOR] Incident playbook guidelines decrypted successfully below!");
                                        }}
                                        className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer w-full flex items-center justify-center gap-2"
                                      >
                                        <span>💡 Decrypt Playbook Hints</span>
                                      </button>
                                    ) : (
                                      <div className="bg-amber-950/20 border border-amber-900/40 p-3.5 rounded-xl space-y-2 animate-fade-in text-left">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                            DECRYPTED INTEL PLAYBOOK
                                          </span>
                                          <button
                                            onClick={() => setShowPracticeHint(false)}
                                            className="text-[9px] font-mono text-zinc-500 hover:text-white uppercase tracking-wider"
                                          >
                                            [Hide]
                                          </button>
                                        </div>
                                        <p className="text-xs text-amber-300/90 leading-relaxed font-mono">
                                          {hintText}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Dedicated VM launcher notice if offline */}
                          {vmStatus === 'off' && (
                            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="text-left">
                                <h4 className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                  SANDBOX ENVIRONMENT OFFLINE
                                </h4>
                                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                                  A dedicated isolated docker container VM environment must be booted to run command exploits and interact with virtual logs.
                                </p>
                              </div>
                              <button
                                onClick={handleProvisionVM}
                                className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-[10px] font-mono px-4 py-2.5 rounded-lg whitespace-nowrap tracking-wide uppercase transition-all duration-200 cursor-pointer"
                              >
                                ⚡ Boot Sandbox VM
                              </button>
                            </div>
                          )}

                          {vmStatus === 'provisioning' && (
                            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-3">
                              <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
                              <span className="text-xs font-mono text-zinc-400">Deploying secure isolated docker namespace...</span>
                            </div>
                          )}

                          {vmStatus === 'running' && (
                            <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="text-left">
                                <h4 className="text-xs font-bold text-zinc-100 font-mono flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-zinc-300 animate-ping"></span>
                                  SANDBOX INSTANCE RUNNING
                                </h4>
                                <p className="text-[11px] text-zinc-400 mt-1">
                                  Secure socket connection initialized. Endpoint: <span className="font-mono text-zinc-200 font-bold">{vmIP}:{vmPort}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                                CPU: <span className="text-zinc-300 font-bold">{vmCPU.toFixed(1)}%</span> | RAM: <span className="text-zinc-300 font-bold">{vmRAM.toFixed(1)}MB</span>
                              </div>
                            </div>
                          )}

                          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-300 mb-2 font-bold">Simulated Alert Feed Pipeline:</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {selectedCourse.simulation.alerts.map((alert, idx) => (
                                <div key={idx} className="bg-zinc-900 p-2.5 rounded border border-zinc-850 flex items-center justify-between text-[11px] font-mono">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                      alert.severity === "High" ? "bg-white" : alert.severity === "Medium" ? "bg-zinc-400" : "bg-zinc-600"
                                    }`}></span>
                                    <span className="text-zinc-500">{alert.timestamp}</span>
                                    <span className="text-zinc-300">{alert.message}</span>
                                  </div>
                                  <span className="text-zinc-400 text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">
                                    {alert.technique}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
                            <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2 font-bold">Simulated Log Capture Store:</h4>
                            <div className="bg-zinc-950 p-3 rounded text-[10px] font-mono max-h-36 overflow-y-auto space-y-1">
                              {selectedCourse.simulation.logs.map((log, idx) => (
                                <p key={idx} className="text-zinc-400 hover:text-white transition-colors">{log}</p>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl mt-4">
                          <p className="text-xs text-zinc-300 font-mono tracking-widest uppercase mb-1 font-bold">💡 Practice Simulation Guidelines:</p>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Interact with the terminal shell on the right panel. Type <span className="text-white font-bold font-mono">help</span> inside the command console to query available security utility commands.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right panel: Live Terminal Interface */}
                  {!(isGuidebookExpanded && selectedCourseTab === "guidebook") && (
                    <div className="lg:w-[480px] w-full lg:sticky lg:top-6 self-start bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl relative overflow-hidden cyber-card-glow">
                    <div className="absolute top-0 inset-x-0 h-[1.5px] bg-zinc-700"></div>
                    
                    {/* Console Header */}
                    <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 text-zinc-400 font-bold">
                        <Terminal className="w-4 h-4 text-white" />
                        <span>ARCH-X Secure Sandbox Core</span>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-750"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-zinc-650"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 border border-zinc-550"></span>
                      </div>
                    </div>

                    {/* VM Control Box (Requested by user) */}
                    <div className="bg-zinc-900/80 border-b border-zinc-800 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            vmStatus === 'running' 
                              ? "bg-zinc-300 animate-pulse" 
                              : vmStatus === 'provisioning'
                              ? "bg-amber-400 animate-pulse"
                              : "bg-zinc-600"
                          }`}></span>
                          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                            VM Status: {vmStatus}
                          </span>
                        </div>
                        {usingSupabase && (
                          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">
                            Cloud Instance Sync: ON
                          </span>
                        )}
                      </div>

                      {vmStatus === 'off' && (
                        <div className="space-y-2">
                          <p className="text-[11px] text-zinc-400 leading-normal">
                            This security track requires a dedicated virtual sandbox container to test vulnerabilities and solve the end-of-course CTF challenge.
                          </p>
                          <button
                            onClick={handleProvisionVM}
                            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer font-sans"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Dedicated VM Container</span>
                          </button>
                        </div>
                      )}

                      {vmStatus === 'provisioning' && (
                        <div className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
                          <span className="text-xs font-mono text-zinc-400">Deploying secure isolated docker namespace...</span>
                        </div>
                      )}

                      {vmStatus === 'running' && (
                        <div className="space-y-3">
                          {/* Live Metrics Grid */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                              <p className="text-[9px] text-zinc-500 font-mono uppercase font-bold">IP Endpoint</p>
                              <p className="text-xs font-mono text-zinc-300 truncate">{vmIP}:{vmPort}</p>
                            </div>
                            <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                              <p className="text-[9px] text-zinc-500 font-mono uppercase font-bold">Uptime</p>
                              <p className="text-xs font-mono text-zinc-300">
                                {(() => {
                                  const mins = Math.floor(vmUptime / 60);
                                  const secs = vmUptime % 60;
                                  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                                })()}
                              </p>
                            </div>
                            <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex flex-col justify-center">
                              <p className="text-[9px] text-zinc-500 font-mono uppercase font-bold">Metrics</p>
                              <p className="text-xs font-mono text-zinc-300">{vmCPU}% CPU | {vmRAM}M</p>
                            </div>
                          </div>

                          {/* CTF Flag Submission Form */}
                          <form onSubmit={handleSubmitFlag} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg space-y-2">
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold">
                              Capture the Flag (CTF) Submission:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={ctfFlagInput}
                                onChange={(e) => setCtfFlagInput(e.target.value)}
                                disabled={vmSolved}
                                placeholder={vmSolved ? "CHALLENGE SOLVED!" : "e.g. ARCHX_SOC_CTF_5821"}
                                className="flex-1 bg-zinc-900 border border-zinc-800 text-xs font-mono px-2.5 py-1.5 rounded focus:outline-none focus:border-zinc-700 text-white disabled:opacity-50"
                              />
                              <button
                                type="submit"
                                disabled={vmSolved}
                                className="bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-[10px] font-mono px-3 rounded uppercase font-bold tracking-wider transition-colors cursor-pointer"
                              >
                                {vmSolved ? "SOLVED" : "SUBMIT"}
                              </button>
                            </div>
                            {ctfFeedback.msg && (
                              <p className={`text-[10px] font-mono ${
                                ctfFeedback.status === 'success' ? 'text-zinc-300' : 'text-rose-400'
                              }`}>
                                {ctfFeedback.msg}
                              </p>
                            )}
                          </form>

                          <button
                            onClick={handleShutdownVM}
                            className="w-full border border-zinc-800 hover:bg-zinc-950 text-rose-400 hover:text-rose-300 text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                          >
                            <Square className="w-3.5 h-3.5 fill-rose-400/20" />
                            <span>Shutdown VM Container</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Console Output Area */}
                    <div className={`flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 min-h-[340px] transition-all duration-75 ${isTerminalGlitching ? 'cyber-glitch-active bg-zinc-900/10 border-zinc-700 shadow-md shadow-white/5' : ''}`}>
                      {terminalHistory.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap text-zinc-300">
                          {line}
                        </div>
                      ))}
                      <div ref={terminalBottomRef} />
                    </div>

                    {/* Console Input Bar */}
                    <form onSubmit={executeTerminalCommand} className="border-t border-zinc-800 bg-zinc-900/60 p-3 flex gap-2">
                      <span className="text-zinc-500 font-mono text-xs self-center">~$</span>
                      <input
                        type="text"
                        value={terminalCommand}
                        onChange={(e) => setTerminalCommand(e.target.value)}
                        placeholder="Type 'help' to review simulated commands..."
                        className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none border-b border-transparent focus:border-zinc-700 pb-0.5"
                      />
                    </form>
                  </div>
                )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OSINT INTEL MISSIONS */}
          {activeTab === "osint" && (
            <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full flex flex-col">
              
              <div className="text-center md:text-left mb-10">
                <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-2">
                  ARCH-X <span className="font-extrabold text-zinc-100">Tactical OSINT Operations</span>
                </h2>
                <p className="text-sm text-zinc-400 max-w-xl">
                  Analyze terrain features, shadows, building metadata, and flight timetables based on public imagery to track elusive intelligence footprints.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
                {/* Left side list of 12 tactical missions */}
                <div className="lg:col-span-4 space-y-3 overflow-y-auto max-h-[600px] pr-2">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold mb-2 px-1">AVAILABLE LAB OPERATIONS</p>
                  {OSINT_CHALLENGES.map((challenge, index) => {
                    const isCompleted = userProfile.completedOsint.includes(challenge.id);
                    const isSelected = selectedOsint?.id === challenge.id;
                    return (
                      <button
                        key={challenge.id}
                        onClick={() => {
                          setSelectedOsint(challenge);
                          setOsintFeedback({ status: "idle", msg: "" });
                          setOsintInput("");
                        }}
                        className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 cyber-card-glow ${
                          isSelected
                            ? "bg-zinc-900 border-zinc-700 text-white shadow-2xl"
                            : "bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:scale-[1.01]"
                        }`}
                      >
                        <span className="text-xs font-mono font-bold text-zinc-500 bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded">
                          #{String(index + 1).padStart(3, "0")}
                        </span>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold tracking-wide uppercase">Exercise #{String(index + 1).padStart(3, "0")}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                              {challenge.category}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 font-bold">
                              {isCompleted ? "✓ Solved" : `+${challenge.points} XP`}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right side active workspace details */}
                <div className="lg:col-span-8 flex flex-col">
                  {selectedOsint ? (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between flex-1 cyber-card-glow">
                      
                      <div className="space-y-6">
                        {/* Title block */}
                        <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
                          <div>
                            <span className="text-[9px] font-mono uppercase tracking-widest bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded text-zinc-300">
                              OSINT Operation // {selectedOsint.category}
                            </span>
                            <h3 className="text-lg font-black text-white mt-1.5">Exercise #{String(OSINT_CHALLENGES.indexOf(selectedOsint) + 1).padStart(3, "0")}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Operation Reward</p>
                            <p className="text-sm font-bold text-white">{selectedOsint.points} XP</p>
                          </div>
                        </div>

                        {/* Image Frame */}
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 group bg-zinc-950">
                          <img
                            src={selectedOsint.imageUrl}
                            alt="OSINT Imagery Target"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60"></div>
                          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-lg backdrop-blur-xs">
                            <span className="text-[10px] font-mono text-zinc-400">Target Resolution: SATELLITE_IMG_MAPPED</span>
                            <span className="text-[9px] bg-zinc-950 text-zinc-300 font-mono px-2 py-0.5 rounded border border-zinc-800 uppercase">PUBLIC DOMAIN REF</span>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Operation Prompt / Intel Objective:</p>
                          <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-950/60 p-4 rounded-xl border border-zinc-850">
                            {selectedOsint.description}
                          </p>
                        </div>

                        {/* Recommended Investigation Toolkit */}
                        {selectedOsint.tools && selectedOsint.tools.length > 0 && (
                          <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-4 space-y-2">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">
                              Recommended Investigation Toolkit:
                            </span>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {selectedOsint.tools.map((tool) => (
                                <span
                                  key={tool}
                                  className="text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-lg"
                                >
                                  🛡️ {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hint panel */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-bold">Progressive Hints:</span>
                            {(revealedHints[selectedOsint.id] || 0) < 3 && (
                              <button
                                onClick={() => triggerHint(selectedOsint.id)}
                                className="text-xs font-mono text-white hover:underline"
                              >
                                Request Hint (-15 XP)
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {Array.from({ length: revealedHints[selectedOsint.id] || 0 }).map((_, index) => (
                              <div key={index} className="bg-zinc-950 p-3 rounded-lg text-xs text-zinc-300 border-l-2 border-zinc-400">
                                <strong>Hint {index + 1}:</strong> {selectedOsint.hints[index]}
                              </div>
                            ))}
                            {(revealedHints[selectedOsint.id] || 0) === 0 && (
                              <p className="text-[11px] font-mono text-zinc-600 italic">No hints requested yet.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Flag checker input */}
                      <div className="pt-6 border-t border-zinc-800 mt-6 space-y-4">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={osintInput}
                            onChange={(e) => setOsintInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") checkOsintAnswer(); }}
                            placeholder="Type target verification code or exact landmark name..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs focus:outline-none focus:border-zinc-600 text-white font-mono"
                          />
                          <button
                            onClick={checkOsintAnswer}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold px-6 rounded-lg text-xs uppercase tracking-widest transition-colors"
                          >
                            Verify Landmark
                          </button>
                        </div>

                        {osintFeedback.status !== "idle" && (
                          <div className={`p-3.5 rounded-lg text-xs font-mono ${
                            osintFeedback.status === "correct" 
                              ? "bg-zinc-900 border border-zinc-700 text-zinc-200" 
                              : "bg-zinc-950 border border-zinc-800 text-zinc-400"
                          }`}>
                            <p className="font-bold mb-1 uppercase tracking-wider">{osintFeedback.status === "correct" ? "[✓] VALIDATED SUCCESS" : "[✗] FAILED PROBE"}</p>
                            <p className="text-zinc-400">{osintFeedback.msg}</p>
                            {osintFeedback.status === "correct" && (
                              <p className="text-[11px] text-zinc-500 mt-2 italic border-t border-zinc-800 pt-2">{selectedOsint.explanation}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 space-y-3">
                      <Compass className="w-12 h-12 stroke-1" />
                      <p className="text-sm">Select an active OSINT mission payload from the left listing to deploy satellite logs.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SUGGESTIONS FORUM */}
          {activeTab === "community" && (
            <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full flex flex-col">
              <div className="text-center md:text-left mb-10">
                <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-2">
                  ARCH-X <span className="font-extrabold text-zinc-100">Suggestions Board</span>
                </h2>
                <p className="text-sm text-zinc-400 max-w-xl">
                  We build for the open security ecosystem. Share tools you want simulated, submit bug reports, or upvote ideas from other trainees.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit Idea Panel */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm h-fit shadow-2xl">
                  <h3 className="text-base font-bold text-white mb-4 tracking-wide">Submit Lab Idea</h3>
                  <form onSubmit={submitIdea} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1 font-bold">Proposal Title</label>
                      <input
                        type="text"
                        required
                        value={newIdeaTitle}
                        onChange={(e) => setNewIdeaTitle(e.target.value)}
                        placeholder="e.g. YARA rule validator simulation"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1 font-bold">Category</label>
                      <select
                        value={newIdeaCategory}
                        onChange={(e) => setNewIdeaCategory(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                      >
                        <option value="Feature">Feature Simulation</option>
                        <option value="Content">Security Course Track</option>
                        <option value="Bug">Platform Bug report</option>
                        <option value="Other">General Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1 font-bold">Detail Narrative</label>
                      <textarea
                        rows={4}
                        required
                        value={newIdeaDesc}
                        onChange={(e) => setNewIdeaDesc(e.target.value)}
                        placeholder="Explain how this feature will help beginners master cloud infrastructure or security operations..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-zinc-700 resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold py-3.5 px-6 rounded-lg text-xs uppercase tracking-widest transition-colors"
                    >
                      Publish Suggestion
                    </button>
                  </form>
                </div>

                {/* Ideas list */}
                <div className="lg:col-span-2 space-y-4">
                  {communityIdeas.map((idea) => {
                    const hasVoted = votedIdeas.includes(idea.id);
                    return (
                      <div
                        key={idea.id}
                        className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex items-start gap-4 hover:border-zinc-800 transition-colors backdrop-blur-xs"
                      >
                        <button
                          onClick={() => upvoteIdea(idea.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all shrink-0 w-12 ${
                            hasVoted
                              ? "bg-zinc-800 border-zinc-700 text-white"
                              : "bg-zinc-950 border-zinc-850 hover:border-zinc-800 text-zinc-500"
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4 mb-1" />
                          <span className="text-xs font-mono font-bold">{idea.votes}</span>
                        </button>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono uppercase tracking-widest bg-zinc-800 border border-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded">
                              {idea.category}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">Submitted by {idea.author}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white tracking-wide">{idea.title}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{idea.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RECRUIT OPERATOR DASHBOARD */}
          {activeTab === "profile" && (
            <div className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full flex flex-col">
              
              {/* Profile Card Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* User Stats Card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-2xl flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-zinc-400"></div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white">
                        {userProfile.avatar === "shield" && <Shield className="w-7 h-7 stroke-1 text-zinc-400" />}
                        {userProfile.avatar === "terminal" && <Terminal className="w-7 h-7 stroke-1 text-zinc-400" />}
                        {userProfile.avatar === "cpu" && <Cpu className="w-7 h-7 stroke-1 text-zinc-400" />}
                        {userProfile.avatar === "eye" && <Eye className="w-7 h-7 stroke-1 text-zinc-400" />}
                        {userProfile.avatar === "fingerprint" && <Fingerprint className="w-7 h-7 stroke-1 text-zinc-400" />}
                        {userProfile.avatar === "key" && <Key className="w-7 h-7 stroke-1 text-zinc-400" />}
                        {userProfile.avatar === "globe" && <Globe className="w-7 h-7 stroke-1 text-zinc-400" />}
                        {userProfile.avatar === "activity" && <Activity className="w-7 h-7 stroke-1 text-zinc-400" />}
                        {!userProfile.avatar && <Award className="w-7 h-7 stroke-1 text-zinc-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white tracking-wide truncate">{userProfile.username}</h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Callsign: {userProfile.callsign || "Security Operator"}</p>
                        <p className="text-[9px] font-mono text-zinc-400 italic truncate max-w-xs mt-0.5" title={userProfile.bio}>{userProfile.bio || "ACTIVE AGENT // SECURING THE FRONTIER"}</p>
                      </div>
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-zinc-500">XP Progress</span>
                        <span className="text-white font-bold">{userProfile.xp % 1000} / 1000 XP</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-850">
                        <div
                          className="bg-zinc-400 h-full transition-all duration-500"
                          style={{ width: `${(userProfile.xp % 1000) / 10}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 font-bold">
                        <span>Level {userProfile.level}</span>
                        <span>Level {userProfile.level + 1}</span>
                      </div>
                    </div>

                    {/* Numeric stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                      <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850 text-center">
                        <p className="text-xl font-black text-white">{userProfile.completedCourses.length}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Tracks Cleared</p>
                      </div>
                      <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850 text-center">
                        <p className="text-xl font-black text-white">{userProfile.completedOsint.length}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">OSINT Solved</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-zinc-800 space-y-3">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono text-[10px] py-2.5 rounded-lg uppercase tracking-widest transition-colors font-bold cursor-pointer"
                    >
                      Log Out Session
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem("archx_user_profile");
                        localStorage.removeItem("archx_session_username");
                        localStorage.removeItem("archx_registered_users");
                        setUserProfile({
                          username: "",
                          xp: 0,
                          level: 1,
                          completedCourses: [],
                          completedOsint: [],
                          callsign: "Security Operator",
                          accentColor: "slate",
                        });
                        setIsLoggedIn(false);
                        triggerNotification("Platform training progress and user database cleared.");
                      }}
                      className="w-full border border-zinc-800 hover:bg-zinc-900 text-rose-400 hover:text-rose-300 font-mono text-[10px] py-2.5 rounded-lg uppercase tracking-widest transition-colors font-bold cursor-pointer"
                    >
                      Clear Mainframe DB
                    </button>
                  </div>
                </div>

                {/* Personalized Progress Summary Card (Radial Bar Chart) */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-2xl flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-zinc-450"></div>
                  
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                      <Target className="w-5 h-5 text-zinc-400" /> Operational Progress
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Interactive diagnostic map of completed vs remaining specialized cybersecurity tracks.
                    </p>

                    {/* Recharts Circular Progress Ring */}
                    <div className="relative h-44 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="70%"
                          outerRadius="90%"
                          barSize={8}
                          data={[
                            {
                              name: "Completed",
                              value: userProfile.completedCourses.length,
                              fill: "#ffffff"
                            }
                          ]}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis
                            type="number"
                            domain={[0, COURSES.length || 1]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            background={{ fill: '#1f1f23' }}
                            dataKey="value"
                            cornerRadius={4}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      
                      {/* Inner Overlay Label */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white tracking-tight">
                          {COURSES.length > 0 
                            ? Math.round((userProfile.completedCourses.length / COURSES.length) * 100) 
                            : 0}%
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
                          Verification
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-white"></span>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">CLEARED</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">{userProfile.completedCourses.length} Tracks</span>
                      </div>

                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-850">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-zinc-800"></span>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">REMAINING</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">
                          {Math.max(0, COURSES.length - userProfile.completedCourses.length)} Tracks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Global Leaderboard Panel */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
                  <h3 className="text-base font-bold text-white mb-4 tracking-wide flex items-center gap-2">
                    <Users className="w-5 h-5 text-zinc-400" /> Global Operator Leaderboard
                  </h3>

                  <div className="space-y-2">
                    {/* Header line */}
                    <div className="grid grid-cols-12 px-4 py-2 text-[9px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-850 font-bold">
                      <span className="col-span-2">Rank</span>
                      <span className="col-span-4">Operator</span>
                      <span className="col-span-3">Spec Track</span>
                      <span className="col-span-3 text-right">Verification XP</span>
                    </div>

                    {/* Dynamic Leaderboard Sorting */}
                    {(() => {
                      const list = MOCK_LEADERBOARD.map(item => ({
                        name: item.name,
                        track: item.track,
                        xp: item.xp,
                        isSelf: false,
                      }));
                      
                      // Add current user
                      list.push({
                        name: `${userProfile.username} (You)`,
                        track: userProfile.callsign || "Recruit Analyst",
                        xp: userProfile.xp,
                        isSelf: true,
                      });

                      // Sort descending by XP
                      list.sort((a, b) => b.xp - a.xp);

                      return list.map((item, idx) => {
                        const rank = idx + 1;
                        return (
                          <div
                            key={idx}
                            className={`grid grid-cols-12 px-4 py-3 rounded-xl text-xs font-mono items-center border transition-all ${
                              item.isSelf
                                ? "bg-zinc-800 border-zinc-700 text-white font-bold"
                                : "bg-zinc-950/30 hover:bg-zinc-950/60 text-zinc-300 border-transparent hover:border-zinc-850"
                            }`}
                          >
                            <span className="col-span-2 font-bold text-zinc-500">
                              {item.isSelf ? "LIVE" : `#${rank}`}
                            </span>
                            <span className="col-span-4 font-bold flex items-center gap-1.5">
                              {item.isSelf && <span className="w-2 h-2 rounded-full bg-zinc-300 animate-ping"></span>}
                              {item.name}
                            </span>
                            <span className="col-span-3 text-zinc-400">{item.track}</span>
                            <span className="col-span-3 text-right font-bold">{item.xp} XP</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Active Lab Monitor Component (Requested by user) */}
                <div className="lg:col-span-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-2xl mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                        <Server className="w-5 h-5 text-zinc-400" /> Dedicated Container VM Monitor
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Real-time cloud resource management and active CTF sandbox instances powered by Supabase.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                      <span className="w-2 h-2 rounded-full bg-zinc-300 animate-ping"></span>
                      <span className="text-zinc-400">Total Containers Active: {activeUserVMs.filter(vm => vm.status === 'running').length}</span>
                    </div>
                  </div>

                  {activeUserVMs.length === 0 ? (
                    <div className="bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl p-8 text-center">
                      <HardDrive className="w-8 h-8 text-zinc-600 mx-auto mb-3 stroke-1" />
                      <p className="text-xs text-zinc-400 font-mono mb-4">No active container VMs are currently provisioned.</p>
                      <button
                        onClick={() => {
                          setActiveTab("courses");
                        }}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono text-[10px] px-4 py-2 rounded-lg uppercase tracking-widest transition-colors font-bold cursor-pointer"
                      >
                        Launch Simulation Lab
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {activeUserVMs.map((vm) => {
                        const matchedCourse = COURSES.find(c => c.id === vm.course_id);
                        const uptimeFormatted = (() => {
                          const secs = vm.uptime_seconds || 0;
                          const mins = Math.floor(secs / 60);
                          const remSecs = secs % 60;
                          return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
                        })();

                        return (
                          <div key={vm.id} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 inset-x-0 h-[1px] bg-zinc-800 group-hover:bg-zinc-600 transition-colors"></div>
                            
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                  Namespace: {vm.course_id}
                                </span>
                                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                                  vm.status === 'running' 
                                    ? "bg-zinc-800 border-zinc-700 text-zinc-200" 
                                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${vm.status === 'running' ? 'bg-zinc-300 animate-pulse' : 'bg-zinc-700'}`}></span>
                                  {vm.status}
                                </span>
                              </div>

                              <h4 className="text-sm font-bold text-white mb-1.5">
                                {matchedCourse ? matchedCourse.title : vm.course_id}
                              </h4>

                              <div className="space-y-1.5 my-4">
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-zinc-500">IP Endpoint:</span>
                                  <span className="text-zinc-300">{vm.ip_address}:{vm.port}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-zinc-500">Uptime Timer:</span>
                                  <span className="text-zinc-300">{uptimeFormatted}</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-zinc-500">CPU Usage:</span>
                                  <span className="text-zinc-300">{vm.cpu_usage ? vm.cpu_usage.toFixed(1) : "0.0"}%</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-zinc-500">RAM Allocation:</span>
                                  <span className="text-zinc-300">{vm.ram_usage ? vm.ram_usage.toFixed(1) : "0.0"} MB</span>
                                </div>
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-zinc-500">CTF Target:</span>
                                  <span className={vm.solved ? "text-zinc-200 font-bold" : "text-zinc-500"}>
                                    {vm.solved ? "SOLVED" : "UNSOLVED"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-900 mt-2">
                              <button
                                onClick={() => {
                                  if (matchedCourse) {
                                    setSelectedCourse(matchedCourse);
                                    setSelectedCourseTab("practice");
                                    setActiveTab("courses");
                                  }
                                }}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-mono py-2 rounded uppercase tracking-wider font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                Connect
                              </button>
                              <button
                                onClick={async () => {
                                  // Delete VM
                                  try {
                                    const { error } = await supabase
                                      .from("user_vms")
                                      .delete()
                                      .eq("id", vm.id);
                                    
                                    if (error) {
                                      console.error("[Supabase VM Delete Error] Failed to delete active VM by ID:", error.message);
                                      triggerNotification("Error: Failed to release VM in remote database.");
                                    } else {
                                      setActiveUserVMs(prev => prev.filter(v => v.id !== vm.id));
                                      triggerNotification("Container VM deleted successfully.");
                                    }
                                  } catch (err: any) {
                                    console.error("[Supabase VM Delete Exception] Exception caught during VM release operation:", err);
                                    triggerNotification("Network Error: Cloud VM teardown request failed.");
                                  }
                                }}
                                className="border border-zinc-800 hover:bg-zinc-900 text-rose-400 hover:text-rose-300 text-[10px] font-mono py-2 rounded uppercase tracking-wider font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                Release
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Personalized Profile & Security Customization */}
                <div className="lg:col-span-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-2xl mt-4">
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-zinc-400" /> Operational Information & Personalized Settings
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Customize your active operator credentials, bio, and visual terminal interface. All settings sync to your security card.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visual Avatar and Accent Customization */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Select Operator Icon</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { name: "shield", label: "Shield" },
                            { name: "terminal", label: "Console" },
                            { name: "cpu", label: "Processor" },
                            { name: "eye", label: "OSINT Eye" },
                            { name: "fingerprint", label: "Biometric" },
                            { name: "key", label: "Crypt key" },
                            { name: "globe", label: "Network" },
                            { name: "activity", label: "Radar" }
                          ].map((av) => (
                            <button
                              key={av.name}
                              type="button"
                              onClick={() => {
                                const nextProfile = { ...userProfile, avatar: av.name };
                                setUserProfile(nextProfile);
                                saveProfile(nextProfile);
                                triggerNotification(`Operator icon reconfigured to [${av.label}].`);
                              }}
                              className={`py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all uppercase text-[9px] font-mono font-bold ${
                                userProfile.avatar === av.name
                                  ? "border-white bg-zinc-850 text-white shadow-sm"
                                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900"
                              }`}
                            >
                              {av.name === "shield" && <Shield className="w-5 h-5" />}
                              {av.name === "terminal" && <Terminal className="w-5 h-5" />}
                              {av.name === "cpu" && <Cpu className="w-5 h-5" />}
                              {av.name === "eye" && <Eye className="w-5 h-5" />}
                              {av.name === "fingerprint" && <Fingerprint className="w-5 h-5" />}
                              {av.name === "key" && <Key className="w-5 h-5" />}
                              {av.name === "globe" && <Globe className="w-5 h-5" />}
                              {av.name === "activity" && <Activity className="w-5 h-5" />}
                              <span>{av.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">UI Theme Accent Color</label>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            { name: "slate", class: "bg-zinc-400" },
                            { name: "emerald", class: "bg-emerald-500" },
                            { name: "cyan", class: "bg-cyan-500" },
                            { name: "amber", class: "bg-amber-500" },
                            { name: "rose", class: "bg-rose-500" },
                            { name: "indigo", class: "bg-indigo-500" }
                          ].map((col) => (
                            <button
                              key={col.name}
                              type="button"
                              onClick={() => {
                                const nextProfile = { ...userProfile, accentColor: col.name };
                                setUserProfile(nextProfile);
                                saveProfile(nextProfile);
                                triggerNotification(`Terminal system accent updated to [${col.name}].`);
                              }}
                              className={`h-10 rounded-xl flex items-center justify-center border transition-all ${
                                userProfile.accentColor === col.name
                                  ? "border-white bg-zinc-850"
                                  : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full ${col.class}`}></span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Operator Profile Bio</label>
                        <textarea
                          rows={3}
                          value={userProfile.bio || ""}
                          onChange={(e) => {
                            const nextProfile = { ...userProfile, bio: e.target.value };
                            setUserProfile(nextProfile);
                          }}
                          onBlur={() => {
                            saveProfile(userProfile);
                            triggerNotification("Operational bio details updated.");
                          }}
                          placeholder="Provide details of your specific cyber intelligence focus or team assignment..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors resize-none font-mono"
                        />
                        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider block">Press tab or click away to auto-save operational bio details.</span>
                      </div>
                    </div>

                    {/* Operational Details Form & Password Change */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Security Callsign Duty</label>
                        <select
                          value={userProfile.callsign || "Security Operator"}
                          onChange={(e) => {
                            const nextProfile = { ...userProfile, callsign: e.target.value };
                            setUserProfile(nextProfile);
                            saveProfile(nextProfile);
                            triggerNotification(`Operational callsign updated to [${e.target.value}].`);
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors font-mono"
                        >
                          <option value="Security Operator">Security Operator (Generalist)</option>
                          <option value="SOC Analyst">SOC Analyst (Blue Team)</option>
                          <option value="Penetration Tester">Penetration Tester (Red Team)</option>
                          <option value="Threat Hunter">Threat Hunter (Active Intel)</option>
                          <option value="Digital Forensics Investigator">Digital Forensics Investigator</option>
                          <option value="DevSecOps Engineer">DevSecOps Engineer</option>
                        </select>
                      </div>

                      {/* Password Change Subform */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const target = e.currentTarget;
                          const currentPwInput = target.elements.namedItem("currentPassword") as HTMLInputElement;
                          const newPwInput = target.elements.namedItem("newPassword") as HTMLInputElement;
                          const confirmPwInput = target.elements.namedItem("confirmPassword") as HTMLInputElement;

                          const currentPw = currentPwInput.value;
                          const newPw = newPwInput.value;
                          const confirmPw = confirmPwInput.value;

                          if (!currentPw || !newPw || !confirmPw) {
                            triggerNotification("Passkey Form Error: Please fill in all fields.");
                            return;
                          }

                          if (newPw !== confirmPw) {
                            triggerNotification("Passkey Form Error: Confirm passkey string mismatch.");
                            return;
                          }

                          if (newPw.length < 4) {
                            triggerNotification("Passkey Form Error: Passkey string must be at least 4 characters.");
                            return;
                          }

                          // Verify current password from registered list
                          const usersRaw = localStorage.getItem("archx_registered_users");
                          const usersList = usersRaw ? JSON.parse(usersRaw) : [];
                          const userIndex = usersList.findIndex((u: any) => u.username.toLowerCase() === userProfile.username.toLowerCase());

                          if (userIndex !== -1) {
                            const currentUserData = usersList[userIndex];
                            if (currentUserData.password && currentUserData.password !== currentPw) {
                              triggerNotification("Passkey Form Error: Invalid current passkey signature verification.");
                              return;
                            }

                            // Update password
                            currentUserData.password = newPw;
                            usersList[userIndex] = currentUserData;
                            localStorage.setItem("archx_registered_users", JSON.stringify(usersList));
                            
                            // Update session
                            localStorage.setItem("archx_user_profile_" + userProfile.username, JSON.stringify({
                              ...userProfile,
                              password: newPw
                            }));

                            triggerNotification("Master password updated successfully. Re-encryption complete.");
                            currentPwInput.value = "";
                            newPwInput.value = "";
                            confirmPwInput.value = "";
                          } else {
                            // Guest or offline profile
                            triggerNotification("Passkey Notice: Password successfully configured for active session.");
                            currentPwInput.value = "";
                            newPwInput.value = "";
                            confirmPwInput.value = "";
                          }
                        }}
                        className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-3.5"
                      >
                        <h4 className="text-xs font-bold text-white tracking-wide uppercase font-mono">Master Passkey Re-encryption</h4>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Current Passkey</label>
                          <input
                            type="password"
                            name="currentPassword"
                            placeholder="••••••••"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-750 transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">New Passkey</label>
                            <input
                              type="password"
                              name="newPassword"
                              placeholder="••••••••"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-750 transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Confirm Passkey</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              placeholder="••••••••"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-750 transition-colors"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-[10px] font-mono font-bold py-2 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Execute Passkey Rotation
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          </div>
        </main>

        {/* 4. MULTI-COLUMN FOOTER */}
        <footer className="relative z-10 px-6 md:px-12 lg:px-16 pb-8 sm:pb-10 pt-10 sm:pt-16 border-t border-zinc-850 bg-zinc-950">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-6 max-w-7xl mx-auto mb-10">
            
            {/* COLUMN 1: SPECIALIZED COURSES */}
            <div>
              <h4 className="text-zinc-400 text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 sm:mb-4 uppercase">POPULAR COURSES</h4>
              <ul className="space-y-2 sm:space-y-2.5">
                {[
                  { name: "SOC Analyst SSH Lab", id: "soc-analyst" },
                  { name: "Penetration Testing REST", id: "pentest" },
                  { name: "DevSecOps Git Leak", id: "devsecops" },
                  { name: "Network Packet Sniffer", id: "network-security" },
                  { name: "Digital Forensics Expert", id: "digital-forensics" }
                ].map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => handleSelectCourse(link.id)}
                      className="text-zinc-500 hover:text-zinc-300 text-[10px] sm:text-xs transition-colors duration-200 block text-left"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 2: OSINT OPERATIONS */}
            <div>
              <h4 className="text-zinc-400 text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 sm:mb-4 uppercase">OSINT TARGETS</h4>
              <ul className="space-y-2 sm:space-y-2.5">
                {OSINT_CHALLENGES.slice(0, 5).map((challenge) => (
                  <li key={challenge.id}>
                    <button
                      onClick={() => {
                        setSelectedOsint(challenge);
                        setActiveTab("osint");
                      }}
                      className="text-zinc-500 hover:text-zinc-300 text-[10px] sm:text-xs transition-colors duration-200 block text-left"
                    >
                      {challenge.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 3: INTEL & COMMUNITY */}
            <div>
              <h4 className="text-zinc-400 text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 sm:mb-4 uppercase">COMMUNITY INTEL</h4>
              <ul className="space-y-2 sm:space-y-2.5">
                <li>
                  <button
                    onClick={() => setActiveTab("community")}
                    className="text-zinc-500 hover:text-zinc-300 text-[10px] sm:text-xs transition-colors duration-200 block text-left"
                  >
                    Upvote Feature Ideas
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("community")}
                    className="text-zinc-500 hover:text-zinc-300 text-[10px] sm:text-xs transition-colors duration-200 block text-left"
                  >
                    Submit Technical Feedback
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => triggerNotification("Official community chats are loaded on internal security servers.")}
                    className="text-zinc-500 hover:text-zinc-300 text-[10px] sm:text-xs transition-colors duration-200 block text-left"
                  >
                    Community Telegram
                  </button>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: ARCHITECT & CREDITS */}
            <div>
              <h4 className="text-zinc-400 text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 sm:mb-4 uppercase">MAKER HUB</h4>
              <ul className="space-y-2 sm:space-y-2.5">
                <li>
                  <span className="text-zinc-300 text-[10px] sm:text-xs block">
                    Designed by <span className="font-bold text-white">Zubair</span>
                  </span>
                </li>
                <li>
                  <span className="text-zinc-500 text-[10px] sm:text-xs block">
                    Cloud Sandbox Framework
                  </span>
                </li>
                <li>
                  <span className="text-zinc-500 text-[10px] sm:text-xs block">
                    XP Perks Enabled
                  </span>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setShowSecurityBenefitsModal(true);
                      triggerNotification("[SECURE PLATFORM] Decrypting platform security specifications...");
                    }}
                    className="text-white hover:underline text-[10px] sm:text-xs transition-colors duration-200 text-left block"
                  >
                    Security Benefits
                  </button>
                </li>
              </ul>
            </div>

            {/* Newsletter + Social Column */}
            <div className="col-span-2 md:col-span-2 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-zinc-400 text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 sm:mb-4 uppercase">
                  JOIN THE COMMUNITY
                </h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    triggerNotification("Success! Subscribed to immediate security alerts feed.");
                  }}
                  className="flex max-w-sm"
                >
                  <input
                    type="email"
                    required
                    placeholder="Type your email to join"
                    className="bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-l-lg px-3 py-2 text-xs focus:outline-none w-full"
                  />
                  <button
                    type="submit"
                    className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-[10px] font-bold tracking-wider px-4 rounded-r-lg uppercase shrink-0 transition-colors"
                  >
                    SEND IT
                  </button>
                </form>
              </div>

              <div className="mt-5 sm:mt-6">
                <h4 className="text-zinc-400 text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 uppercase">
                  CONNECT
                </h4>
                <div className="flex gap-3">
                  {[
                    { icon: <Github className="w-4 h-4" />, name: "GitHub" },
                    { icon: <Twitter className="w-4 h-4" />, name: "Twitter" },
                    { icon: <Linkedin className="w-4 h-4" />, name: "LinkedIn" },
                    { icon: <Youtube className="w-4 h-4" />, name: "YouTube" },
                    { icon: <MessageCircle className="w-4 h-4" />, name: "Telegram" }
                  ].map((platform, idx) => (
                    <button
                      key={idx}
                      onClick={() => triggerNotification(`Linked outward connection verified to: ${platform.name}`)}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all shadow-sm"
                      title={platform.name}
                    >
                      {platform.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright line */}
          <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto text-[10px] font-mono text-zinc-500">
            <p>© 2026 ARCH-X Security Group. All rights reserved.</p>
            <p>Designed strictly for cybersecurity training and academic simulation.</p>
          </div>
        </footer>

        {/* Security Architecture Benefits Modal */}
        {showSecurityBenefitsModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4 animate-fade-in">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-100"></div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-100 animate-pulse"></span>
                  <span className="text-xs font-mono tracking-widest text-zinc-300 font-bold uppercase">ARCH-X SECURITY CORE</span>
                </span>
                <button
                  onClick={() => {
                    setShowSecurityBenefitsModal(false);
                    triggerNotification("Specifications closed. Operational dashboard restored.");
                  }}
                  className="text-zinc-500 hover:text-white font-mono text-xs p-1 cursor-pointer transition-colors"
                >
                  [Esc] Close
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  🔒 Sandboxed Simulation Architecture
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  We take website safety and defensive training extremely seriously. The ARCH-X platform is built from the ground up to prevent external leakage, host takeover, or privilege escalations.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-mono font-bold text-zinc-100 uppercase">1. Isolated Container Sandboxing</p>
                  <p className="text-xs text-zinc-400 font-sans leading-normal">
                    Every virtual container environment is isolated within strict kernel namespaces. Terminal commands do not have access to the master host or infrastructure nodes.
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-mono font-bold text-zinc-100 uppercase">2. Client-Side Cryptographic Vault</p>
                  <p className="text-xs text-zinc-400 font-sans leading-normal">
                    User session profiles, progress points, and custom callsigns are fully hashed and cached safely inside local storage memory layers, preventing server-side credential sniffing.
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-xl space-y-1.5">
                  <p className="text-[10px] font-mono font-bold text-zinc-100 uppercase">3. Zero Backdoor Exposure</p>
                  <p className="text-xs text-zinc-400 font-sans leading-normal">
                    All simulated exploits and CTF targets run strictly within isolated mock virtual ports. Sensitive cloud database credentials, system API keys, or secret keys are completely isolated from client scripts.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowSecurityBenefitsModal(false);
                    triggerNotification("Operational protocols authorized.");
                  }}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                >
                  Confirm Specifications & Return
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
