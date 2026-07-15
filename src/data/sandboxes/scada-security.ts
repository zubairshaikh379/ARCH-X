// ICS / SCADA / OT security sandbox
// Authorized-education, conceptual lab. Learners triage a Modbus/TCP traffic
// capture and an OT asset inventory to distinguish routine engineering-station
// polling from an unauthorized write to a safety-critical PLC coil, attribute it
// to a rogue OT host that is not in the authorized asset list, and take the
// SAFE containment action (isolate the rogue host at the OT firewall) rather than
// touching the live process. Confirming the CORRECT rogue host reveals the flag.
export const SANDBOX = {
  objective:
    "A pressure-relief PLC on the OT network just received a write it should never have gotten during normal operation. You have three artifacts: the Modbus/TCP traffic log, the authorized OT asset inventory, and the operator's notes. Separate legitimate read-only polling by the engineering workstation from an UNAUTHORIZED write command (Modbus function code 05/06/16) sent to the safety PLC, attribute that write to the source IP that issued it, and confirm that source is a rogue host NOT present in the authorized asset list. SAFETY FIRST: do not stop the process or force the PLC — the correct action is to isolate the rogue host at the OT firewall. Isolating the CORRECT rogue host reveals the flag.",
  hints: [
    "Start by exploring. Run 'ls' to see the artifacts, then read the operator's notes with 'cat notes.txt' to learn what normal traffic looks like, which IP is the authorized engineering workstation, and which PLC is safety-critical.",
    "In Modbus, reads are harmless but WRITES change the physical process. Read the capture with 'cat modbus_log.txt' and look for write function codes — 05 (Write Single Coil), 06 (Write Single Register), 16 (Write Multiple Registers) — aimed at the safety PLC. Routine polling uses read codes (01/02/03/04).",
    "A write alone isn't proof of an attack — the engineering station is allowed to write during maintenance. Cross-check the SOURCE IP of that write against the authorized inventory with 'cat ot_assets.txt'. The offender is a host that issued a write to the safety PLC yet does NOT appear as an authorized asset. Do NOT halt the PLC or the line — that could trip the very safety function you are protecting.",
    "Once you've matched the unauthorized write to a source IP that is absent from the authorized asset list, contain it without touching the process. The command form is:  isolate-host <ip>  — substitute the exact rogue OT host IP you identified from the logs.",
  ],
  files: {
    "notes.txt":
      "OT INCIDENT #OT-1187 — Site: Plant-3 Pumping Station (OT VLAN 172.16.40.0/24)\n" +
      "Trigger: SCADA HMI raised an unexpected setpoint-change alarm on the pressure-relief PLC.\n" +
      "Artifacts: Modbus/TCP capture (modbus_log.txt), authorized asset inventory (ot_assets.txt).\n" +
      "\n" +
      "Baseline / what is NORMAL on this network:\n" +
      "  - Engineering workstation ENG-WS01 = 172.16.40.10 polls PLCs read-only (FC 01/03/04).\n" +
      "  - SCADA HMI server = 172.16.40.5 reads process values, does not issue coil writes.\n" +
      "  - Safety-critical device: PLC-SAFE-01 (pressure relief) at 172.16.40.21, Unit ID 1.\n" +
      "    Writes to PLC-SAFE-01 are ONLY permitted from ENG-WS01 during a scheduled\n" +
      "    maintenance window — and there is NO maintenance window open right now.\n" +
      "\n" +
      "SAFETY POLICY (read before acting):\n" +
      "  Never stop the process, force a coil, or power-cycle a live safety PLC from the\n" +
      "  console — that can trip the relief function and cause an unsafe state. The correct\n" +
      "  containment is to ISOLATE the offending host at the OT firewall so it can send no\n" +
      "  further commands, then let the process engineers verify PLC state on-site.\n" +
      "  One write in the capture targets the safety PLC from an IP that is NOT in the\n" +
      "  authorized inventory. Attribute it, verify it is unauthorized, then isolate it.",
    "modbus_log.txt":
      "TIME(local)   SRC IP          DST IP (PLC)     UNIT  FC   OP                         DETAIL\n" +
      "---------------------------------------------------------------------------------------------------\n" +
      "09:00:02      172.16.40.10    172.16.40.21     1     03   Read Holding Registers      addr 100 qty 4  (poll)\n" +
      "09:00:05      172.16.40.5     172.16.40.21     1     04   Read Input Registers        addr 30 qty 2   (HMI read)\n" +
      "09:00:11      172.16.40.10    172.16.40.22     1     01   Read Coils                  addr 0 qty 8    (poll)\n" +
      "09:00:18      172.16.40.10    172.16.40.21     1     03   Read Holding Registers      addr 100 qty 4  (poll)\n" +
      "09:00:23      172.16.40.66    172.16.40.21     1     06   Write Single Register       addr 40  val 0  (SETPOINT!)\n" +
      "09:00:24      172.16.40.66    172.16.40.21     1     05   Write Single Coil           addr 2  val ON   (RELIEF OVERRIDE!)\n" +
      "09:00:31      172.16.40.5     172.16.40.22     1     04   Read Input Registers        addr 30 qty 2   (HMI read)\n" +
      "09:00:39      172.16.40.10    172.16.40.21     1     03   Read Holding Registers      addr 100 qty 4  (poll)\n" +
      "---------------------------------------------------------------------------------------------------\n" +
      "OBS: All 172.16.40.10 (ENG-WS01) and 172.16.40.5 (HMI) traffic is READ-ONLY (FC 01/03/04).\n" +
      "The only WRITE traffic (FC 06 then FC 05) to safety device PLC-SAFE-01 (172.16.40.21) comes\n" +
      "from 172.16.40.66 — an IP not seen polling and not on the authorized list. That is the\n" +
      "unauthorized PLC command. Attribute the source before acting.",
    "ot_assets.txt":
      "AUTHORIZED OT ASSET INVENTORY — Plant-3 Pumping Station (172.16.40.0/24)\n" +
      "-------------------------------------------------------------------------\n" +
      "IP              HOSTNAME        ROLE                         WRITE-TO-PLC?\n" +
      "172.16.40.5     SCADA-HMI-01    HMI / operator display       no (read-only)\n" +
      "172.16.40.10    ENG-WS01        Engineering workstation      yes, ENG-WS01 only, maint window\n" +
      "172.16.40.21    PLC-SAFE-01     Safety PLC (pressure relief) n/a (device)\n" +
      "172.16.40.22    PLC-PUMP-02     Pump control PLC             n/a (device)\n" +
      "172.16.40.40    HIST-01         Process historian            no\n" +
      "-------------------------------------------------------------------------\n" +
      "NOTE: 172.16.40.66 does NOT appear in this inventory. It is a ROGUE OT host —\n" +
      "an unmanaged device that has no authorization to be on the OT VLAN, let alone\n" +
      "to write to the safety PLC. Any host absent from this list is untrusted.",
  },
  commands: {
    "isolate-host 172.16.40.10":
      "WARNING: 172.16.40.10 is ENG-WS01, the AUTHORIZED engineering workstation. Its\n" +
      "traffic in the capture is entirely read-only polling (FC 01/03/04) — it issued no\n" +
      "write to the safety PLC. Isolating it would blind your legitimate operators and\n" +
      "does not stop the attacker. No flag — re-check which SOURCE IP issued the FC 05/06\n" +
      "write and whether that IP is on the authorized asset list.",
    "isolate-host 172.16.40.21":
      "DANGER: 172.16.40.21 is PLC-SAFE-01, the live safety-critical pressure-relief PLC.\n" +
      "Isolating or interfering with the PLC itself can trip the relief function and drive\n" +
      "the process to an UNSAFE state — never contain by touching the device. No flag —\n" +
      "contain the rogue HOST that sent the command, not the safety controller.",
    "isolate-host 172.16.40.66":
      "SAFE ACTION CONFIRMED: 172.16.40.66 is a rogue host absent from the authorized OT\n" +
      "asset inventory, and it is the source of the unauthorized Modbus writes (FC 06\n" +
      "setpoint change + FC 05 relief-override) to safety PLC-SAFE-01 (172.16.40.21).\n" +
      "Isolated at the OT firewall — it can issue no further commands. The live process\n" +
      "and safety PLC were left untouched for on-site engineers to verify.\n" +
      "Rogue OT host contained. Flag decrypted:\n" +
      "FLAG: {{FLAG}}\n" +
      "Submit it above to close incident OT-1187.",
  },
} as const;
