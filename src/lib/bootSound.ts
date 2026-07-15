/**
 * Procedural boot SFX for the ARCH-X entry sequence — no audio file, no license.
 * Synthesized with the Web Audio API and scheduled against the exact
 * LogoPreloader phase timeline so sound and visuals land together:
 *
 *   0.00s  power hum + sub rumble fade in            (Phase 1 — boot)
 *   0.65s  confirm-blip  (hex frame)                 (Phase 2 — construction)
 *   1.20s  confirm-blip  (arch)
 *   1.70s  confirm-blip  (X)
 *   2.35s  riser + low growl building                (Phase 3 — dragon)
 *   4.05s  bright ping   (eye ignites)
 *   4.35s  power-on chord swell "system online"      (Phase 4 — activation)
 *   5.60s  downward whoosh, everything fades          (Phase 5 — dissolve)
 *
 * Best-effort under autoplay policy: the context is created and resumed; if the
 * browser blocks it (common on a cold first load), a one-time pointer/key
 * listener resumes it so it still fires if the user interacts during the intro.
 * Silent, never throwing, if Web Audio is unavailable.
 *
 * Returns a stop() that fades out and closes the context.
 */
export function playBootSequence(): () => void {
  if (typeof window === "undefined") return () => {};
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return () => {};

  let ctx: AudioContext;
  try { ctx = new AC(); } catch { return () => {}; }

  // Autoplay may suspend the context — resume now, and again on first gesture.
  const tryResume = () => { void ctx.resume?.().catch(() => {}); };
  tryResume();
  const onGesture = () => { tryResume(); cleanupGesture(); };
  const cleanupGesture = () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
  };
  if (ctx.state === "suspended") {
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
  }

  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  const t0 = ctx.currentTime + 0.03;
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.32, t0 + 0.25); // tuned: tasteful, not blaring

  // ── helpers ────────────────────────────────────────────────────────
  // Short percussive "machine confirm" tone.
  const blip = (
    freq: number, at: number, dur = 0.18,
    type: OscillatorType = "triangle", gain = 0.24,
  ) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0 + at);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0 + at);
    g.gain.exponentialRampToValueAtTime(gain, t0 + at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
    o.connect(g); g.connect(master);
    o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
  };

  // ── Phase 1 — power hum drone (filter rises through construction) ───
  const drone = ctx.createOscillator();
  drone.type = "sawtooth";
  drone.frequency.value = 55;
  const droneLp = ctx.createBiquadFilter();
  droneLp.type = "lowpass";
  droneLp.frequency.setValueAtTime(180, t0);
  droneLp.frequency.exponentialRampToValueAtTime(1400, t0 + 4.35);
  const droneG = ctx.createGain();
  droneG.gain.value = 0.0001;
  drone.connect(droneLp); droneLp.connect(droneG); droneG.connect(master);
  droneG.gain.exponentialRampToValueAtTime(0.11, t0 + 1.0);
  droneG.gain.setValueAtTime(0.11, t0 + 5.6);
  droneG.gain.exponentialRampToValueAtTime(0.0001, t0 + 6.3);
  drone.start(t0); drone.stop(t0 + 6.5);

  // Sub-bass rumble under the boot.
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 42;
  const subG = ctx.createGain();
  subG.gain.value = 0.0001;
  sub.connect(subG); subG.connect(master);
  subG.gain.exponentialRampToValueAtTime(0.24, t0 + 0.5);
  subG.gain.setValueAtTime(0.24, t0 + 4.2);
  subG.gain.exponentialRampToValueAtTime(0.0001, t0 + 6.3);
  sub.start(t0); sub.stop(t0 + 6.5);

  // ── Phase 2 — ascending confirm blips as framework paths complete ──
  blip(523.25, 0.65, 0.16, "triangle", 0.22); // hex  (C5)
  blip(659.25, 1.20, 0.16, "triangle", 0.22); // arch (E5)
  blip(783.99, 1.70, 0.18, "triangle", 0.24); // X    (G5)

  // ── Phase 3 — dragon materialization: noise riser + low growl ──────
  const bufLen = Math.floor(ctx.sampleRate * 2.5);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf; noise.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(280, t0 + 2.35);
  bp.frequency.exponentialRampToValueAtTime(4200, t0 + 4.35);
  const noiseG = ctx.createGain();
  noiseG.gain.value = 0.0001;
  noise.connect(bp); bp.connect(noiseG); noiseG.connect(master);
  noiseG.gain.exponentialRampToValueAtTime(0.14, t0 + 4.2);
  noiseG.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.6);
  noise.start(t0 + 2.35); noise.stop(t0 + 4.7);

  const growl = ctx.createOscillator();
  growl.type = "sawtooth";
  growl.frequency.setValueAtTime(48, t0 + 2.35);
  growl.frequency.exponentialRampToValueAtTime(96, t0 + 4.35);
  const growlG = ctx.createGain();
  growlG.gain.value = 0.0001;
  growl.connect(growlG); growlG.connect(master);
  growlG.gain.exponentialRampToValueAtTime(0.1, t0 + 3.8);
  growlG.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.5);
  growl.start(t0 + 2.35); growl.stop(t0 + 4.6);

  // Eye ignites — bright ping.
  blip(1760, 4.05, 0.28, "sine", 0.16);

  // ── Phase 4 — power-on chord swell ("system online") ───────────────
  [110, 164.81, 220, 277.18].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = i === 3 ? "triangle" : "sawtooth";
    o.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    o.connect(lp); lp.connect(g); g.connect(master);
    g.gain.exponentialRampToValueAtTime(0.13, t0 + 4.35 + 0.28);
    g.gain.setValueAtTime(0.13, t0 + 5.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 6.2);
    o.start(t0 + 4.35); o.stop(t0 + 6.3);
  });
  // Shimmer on top of the chord.
  blip(1318.5, 4.42, 0.6, "sine", 0.12);
  blip(2637, 4.5, 0.5, "sine", 0.07);

  // ── Phase 5 — dissolve whoosh (downward sweep) ─────────────────────
  const whoosh = ctx.createOscillator();
  whoosh.type = "sawtooth";
  whoosh.frequency.setValueAtTime(1200, t0 + 5.6);
  whoosh.frequency.exponentialRampToValueAtTime(110, t0 + 6.3);
  const whooshLp = ctx.createBiquadFilter();
  whooshLp.type = "lowpass"; whooshLp.frequency.value = 1800;
  const whooshG = ctx.createGain();
  whooshG.gain.value = 0.0001;
  whoosh.connect(whooshLp); whooshLp.connect(whooshG); whooshG.connect(master);
  whooshG.gain.exponentialRampToValueAtTime(0.12, t0 + 5.72);
  whooshG.gain.exponentialRampToValueAtTime(0.0001, t0 + 6.3);
  whoosh.start(t0 + 5.6); whoosh.stop(t0 + 6.4);

  // ── teardown ───────────────────────────────────────────────────────
  let closed = false;
  const closeTimer = setTimeout(() => {
    if (!closed) { closed = true; void ctx.close().catch(() => {}); }
  }, 6800);

  return () => {
    cleanupGesture();
    clearTimeout(closeTimer);
    if (closed) return;
    closed = true;
    try {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    } catch { /* ignore */ }
    setTimeout(() => { void ctx.close().catch(() => {}); }, 200);
  };
}
