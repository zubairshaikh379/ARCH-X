import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HeroSceneProps {
  className?: string;
}

const PLATINUM = 0xc8ccd2;
const CYBER = 0x38e6ff; // electric cyan — network/wireframe/atmosphere accent

/** Pseudo-continent mask from a point direction — layered trig "noise" so a subset
 *  of the dot-grid reads as landmasses (bright) vs ocean (dim). Deterministic, cheap. */
function continentMask(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 3.1 + 1.3) * Math.cos(y * 2.7) +
    Math.sin(z * 2.3 + 0.7) * Math.cos(x * 1.9) +
    Math.sin(y * 4.1) * Math.cos(z * 3.3 + 2.1) * 0.6
  );
}

/**
 * Stylized "cyber globe": glowing dot-grid continents, faint wireframe, an atmosphere
 * rim glow, and animated great-circle arc paths. Drag / touch to rotate (with inertia);
 * auto-spins when idle. Pure procedural — no texture assets, works offline.
 */
export default function HeroScene({ className = "" }: HeroSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use a throwaway probe canvas to test WebGL availability — calling
    // getContext() on the real canvas first would lock it to that context
    // type and make THREE.WebGLRenderer's own getContext() call fail with
    // "Canvas has an existing context of a different type".
    const probe = document.createElement("canvas");
    const testCtx = probe.getContext("webgl") || probe.getContext("experimental-webgl");
    if (!testCtx) { setWebglOk(false); return; }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch { setWebglOk(false); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Use clientWidth/clientHeight (layout-resolved) for correct initial size
    const initW = canvas.clientWidth || window.innerWidth;
    const initH = canvas.clientHeight || window.innerHeight;
    renderer.setSize(initW, initH, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, initW / initH, 0.1, 100);
    camera.position.z = 4.6;

    const R = 1.5;
    // Group holds everything that rotates with drag.
    const globe = new THREE.Group();
    scene.add(globe);

    // ── Dot-grid sphere (fibonacci points; land bright / ocean dim) ──────────────
    const DOTS = 2600;
    const dpos = new Float32Array(DOTS * 3);
    const dcol = new Float32Array(DOTS * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const land = new THREE.Color(0.82, 0.85, 0.9);
    const ocean = new THREE.Color(0.16, 0.19, 0.24);
    for (let i = 0; i < DOTS; i++) {
      const yy = 1 - (i / (DOTS - 1)) * 2;      // −1 .. 1
      const rad = Math.sqrt(1 - yy * yy);
      const th = golden * i;
      const x = Math.cos(th) * rad, z = Math.sin(th) * rad;
      dpos[i * 3] = x * R; dpos[i * 3 + 1] = yy * R; dpos[i * 3 + 2] = z * R;
      const c = continentMask(x, yy, z) > 0.35 ? land : ocean;
      dcol[i * 3] = c.r; dcol[i * 3 + 1] = c.g; dcol[i * 3 + 2] = c.b;
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    dotGeo.setAttribute("color", new THREE.BufferAttribute(dcol, 3));
    const dotMat = new THREE.PointsMaterial({
      size: 0.032, vertexColors: true, transparent: true, opacity: 0.95,
      sizeAttenuation: true, depthWrite: false,
    });
    globe.add(new THREE.Points(dotGeo, dotMat));

    // ── Pulsing data nodes — bright cyan pings at a handful of "cities" ──────────
    const NODE_COUNT = reduced ? 0 : 5;
    interface Node { mesh: THREE.Mesh; phase: number; }
    const nodes: Node[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const p = randSurfaceEarly();
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshBasicMaterial({ color: CYBER, transparent: true, opacity: 1 })
      );
      mesh.position.copy(p);
      globe.add(mesh);
      nodes.push({ mesh, phase: Math.random() });
    }
    function randSurfaceEarly() {
      const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      return new THREE.Vector3(Math.cos(t) * r, u, Math.sin(t) * r).multiplyScalar(R * 1.002);
    }

    // ── Faint wireframe shell ────────────────────────────────────────────────────
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 0.995, 3)),
      new THREE.LineBasicMaterial({ color: CYBER, transparent: true, opacity: 0.1 })
    );
    globe.add(wire);

    // ── Atmosphere rim glow (Fresnel, back-side, additive) ───────────────────────
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.14, 48, 48),
      new THREE.ShaderMaterial({
        transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
        uniforms: { uColor: { value: new THREE.Color(CYBER) } },
        vertexShader: `
          varying vec3 vN; varying vec3 vP;
          void main(){ vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz;
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `
          varying vec3 vN; varying vec3 vP; uniform vec3 uColor;
          void main(){ vec3 vd = normalize(-vP);
            float f = pow(1.0 - abs(dot(vN, vd)), 3.0);
            gl_FragColor = vec4(uColor, f * 0.75); }`,
      })
    );
    globe.add(atmo);

    // ── Animated arc paths ("attack paths") ──────────────────────────────────────
    const randSurface = () => {
      const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      return new THREE.Vector3(Math.cos(t) * r, u, Math.sin(t) * r).multiplyScalar(R);
    };
    const ARC_SEG = 60;
    interface Arc { line: THREE.Line; geo: THREE.BufferGeometry; phase: number; }
    const arcs: Arc[] = [];
    const makeArc = (): Arc => {
      const a = randSurface(), b = randSurface();
      const mid = a.clone().add(b).normalize().multiplyScalar(R * (1.28 + Math.random() * 0.28));
      const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(ARC_SEG);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: CYBER, transparent: true, opacity: 0,
      }));
      geo.setDrawRange(0, 1);
      globe.add(line);
      return { line, geo, phase: Math.random() };
    };
    const ARC_COUNT = reduced ? 3 : 9;
    for (let i = 0; i < ARC_COUNT; i++) arcs.push(makeArc());

    // ── Ambient dust behind the globe ────────────────────────────────────────────
    const DUST = 500;
    const upos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      const r = 5 + Math.random() * 14, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      upos[i * 3] = r * Math.sin(p) * Math.cos(t);
      upos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      upos[i * 3 + 2] = r * Math.cos(p);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(upos, 3));
    const dustMat = new THREE.PointsMaterial({ size: 0.02, color: PLATINUM, transparent: true, opacity: 0.28, sizeAttenuation: true });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ── Drag / touch rotation with inertia ───────────────────────────────────────
    let dragging = false, lastX = 0, lastY = 0;
    let velX = 0, velY = 0;          // angular velocity
    globe.rotation.y = 0.4;

    const onDown = (e: PointerEvent) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      velX = 0; velY = 0;
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      velY = dx * 0.005;             // horizontal drag → yaw
      velX = dy * 0.005;             // vertical drag → pitch
      globe.rotation.y += velY;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + velX, -0.6, 0.6);
    };
    const onUp = (e: PointerEvent) => { dragging = false; canvas.releasePointerCapture?.(e.pointerId); };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onUp);

    // ── Loop ─────────────────────────────────────────────────────────────────────
    const timer = new THREE.Timer();
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      timer.update();
      const t = timer.getElapsed();

      if (!dragging) {
        // inertia decay + idle auto-spin
        globe.rotation.y += velY;
        globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + velX, -0.6, 0.6);
        velY *= 0.95; velX *= 0.95;
        if (!reduced && Math.abs(velY) < 0.0012) globe.rotation.y += 0.0016;
      }

      // arc draw-on → hold → fade → recycle
      if (!reduced) {
        for (const arc of arcs) {
          arc.phase += 0.0045;
          if (arc.phase >= 1) {
            arc.phase = 0;
            arc.geo.dispose();
            (arc.line.material as THREE.Material).dispose();
            globe.remove(arc.line);
            const fresh = makeArc();
            arc.line = fresh.line; arc.geo = fresh.geo;
          }
          const p = arc.phase;
          const draw = p < 0.5 ? p / 0.5 : 1;                    // draw in first half
          const fade = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;        // fade out tail
          arc.geo.setDrawRange(0, Math.max(1, Math.floor(draw * (ARC_SEG + 1))));
          (arc.line.material as THREE.LineBasicMaterial).opacity = 0.85 * fade;
        }
      } else {
        for (const arc of arcs) {
          arc.geo.setDrawRange(0, ARC_SEG + 1);
          (arc.line.material as THREE.LineBasicMaterial).opacity = 0.45;
        }
      }

      if (!reduced) dust.rotation.y = t * 0.012;

      for (const n of nodes) {
        n.phase += 0.012;
        const s = 1 + Math.sin(n.phase * Math.PI * 2) * 0.9;
        n.mesh.scale.setScalar(Math.max(0.3, s));
        (n.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(n.phase * Math.PI * 2) * 0.5;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      timer.dispose();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onUp);
      window.removeEventListener("resize", onResize);
      dotGeo.dispose(); dotMat.dispose();
      wire.geometry.dispose(); (wire.material as THREE.Material).dispose();
      atmo.geometry.dispose(); (atmo.material as THREE.Material).dispose();
      dustGeo.dispose(); dustMat.dispose();
      for (const arc of arcs) { arc.geo.dispose(); (arc.line.material as THREE.Material).dispose(); }
      for (const n of nodes) { n.mesh.geometry.dispose(); (n.mesh.material as THREE.Material).dispose(); }
      renderer.dispose();
    };
  }, []);

  // CSS-only fallback globe (WebGL unavailable — screenshot bots, old GPUs)
  if (!webglOk) {
    return (
      <div className={className} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "min(48vmin, 380px)", aspectRatio: "1", borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #e8eef5 0%, #9aa1ac 32%, #3a3f48 66%, #0a0b10 100%)",
          boxShadow: "0 0 120px rgba(200,204,210,0.18), inset -20px -20px 60px rgba(0,0,0,0.5)",
          animation: "float-y 6s ease-in-out infinite",
        }} />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", pointerEvents: "auto", touchAction: "pan-y", cursor: "grab" }}
    />
  );
}
