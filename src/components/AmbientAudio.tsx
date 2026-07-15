import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Procedural "galaxy" ambient pad via the Web Audio API — no audio file, no license.
 * Detuned low sine oscillators + filtered noise "space wind", a slow LFO drifting the
 * filter for movement. Starts OFF (browser autoplay policy blocks sound before a user
 * gesture); the toggle IS that gesture. Choice persists in localStorage.
 */
const LS_KEY = "archx_ambient";

export default function AmbientAudio() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  // Build the audio graph lazily on first enable (needs a user gesture).
  const buildGraph = () => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Low detuned sine pad (three voices → shimmer)
    const oscs: OscillatorNode[] = [];
    const padGain = ctx.createGain();
    padGain.gain.value = 0.12;
    padGain.connect(master);
    [55, 82.4, 110].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.detune.value = (i - 1) * 6;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.4 : 0.7;
      o.connect(g); g.connect(padGain);
      o.start();
      oscs.push(o);
    });

    // Filtered noise "space wind"
    const bufLen = 2 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf; noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 480; lp.Q.value = 6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(lp); lp.connect(noiseGain); noiseGain.connect(master);
    noise.start();

    // Slow LFO drifts the filter cutoff for movement
    const lfo = ctx.createOscillator();
    lfo.type = "sine"; lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
    lfo.start();

    ctxRef.current = ctx;
    masterRef.current = master;
    nodesRef.current = {
      stop: () => { oscs.forEach(o => o.stop()); noise.stop(); lfo.stop(); },
    };
  };

  const enable = async () => {
    if (!ctxRef.current) buildGraph();
    const ctx = ctxRef.current!, master = masterRef.current!;
    if (ctx.state === "suspended") await ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1.2);  // gentle fade-in
    setOn(true);
    try { localStorage.setItem(LS_KEY, "on"); } catch { /* ignore */ }
  };

  const disable = () => {
    const ctx = ctxRef.current, master = masterRef.current;
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    }
    setOn(false);
    try { localStorage.setItem(LS_KEY, "off"); } catch { /* ignore */ }
  };

  const toggle = () => { on ? disable() : void enable(); };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { nodesRef.current?.stop(); } catch { /* already stopped */ }
      void ctxRef.current?.close();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`ambient-toggle${on ? " is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? "Mute ambient sound" : "Play ambient sound"}
      title={on ? "Mute ambient sound" : "Play ambient sound"}
    >
      {on ? <Volume2 size={17} /> : <VolumeX size={17} />}
    </button>
  );
}
