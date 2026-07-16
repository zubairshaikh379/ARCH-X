import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import App from './App.tsx';
import CustomCursor from './components/CustomCursor.tsx';
import LogoPreloader from './components/LogoPreloader.tsx';
import AmbientAudio from './components/AmbientAudio.tsx';
import './index.css';

/**
 * Root shell + entry flow, once per tab session (sessionStorage guard so
 * in-session remounts / HMR don't replay it):
 *
 *   standby gate  →  INITIALIZE click  →  boot sequence  →  app
 *
 * The gate exists so the first click is a real user gesture — that unlocks
 * Web Audio, guaranteeing the boot SFX plays. "Enter without sound" lets the
 * user opt out explicitly rather than losing audio to a silent autoplay block.
 */
const BOOTED_KEY = 'archx_booted';

type Stage = 'gate' | 'boot' | 'app';

function Root() {
  const [stage, setStage] = useState<Stage>(() => {
    try { return sessionStorage.getItem(BOOTED_KEY) === '1' ? 'app' : 'boot'; }
    catch { return 'boot'; }
  });
  const [muted, setMuted] = useState(false);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const initialize = (withSound: boolean) => {
    setMuted(!withSound);
    setStage('boot');
  };

  const finish = () => {
    try { sessionStorage.setItem(BOOTED_KEY, '1'); } catch { /* ignore */ }
    setStage('app');
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {stage === 'gate' && (
          <motion.div
            key="gate"
            className="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <img
              className="gate__emblem"
              src="/arch-x-logo.svg"
              alt="ARCH-X"
              draggable={false}
            />
            <div className="gate__standby">
              <span className="dot" />
              Security System · Standby
            </div>
            <button
              className="gate__btn"
              onClick={() => initialize(true)}
              autoFocus
            >
              Initialize
            </button>
            {!reduce && (
              <button className="gate__muted" onClick={() => initialize(false)}>
                Enter without sound
              </button>
            )}
            <div className="gate__skip">ARCH-X · Cyber Range</div>
          </motion.div>
        )}

        {stage === 'boot' && (
          <LogoPreloader key="boot" onDone={finish} muted={muted} />
        )}
      </AnimatePresence>

      {stage === 'app' && (
        <>
          <App />
          <AmbientAudio />
          <CustomCursor />
        </>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
