import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface HeroSceneProps {
  className?: string;
}

export default function HeroScene({ className = "" }: HeroSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── WebGL availability check ───────────────────────────────
    const testCtx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!testCtx) {
      setWebglOk(false);
      return;
    }

    // ── Renderer ───────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch {
      setWebglOk(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      50,
      canvas.offsetWidth / canvas.offsetHeight,
      0.1,
      100
    );
    camera.position.z = 6;

    // ── Main Wireframe Sphere ──────────────────────────────────
    const mainGeo = new THREE.IcosahedronGeometry(2, 3);
    const mainMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const mainMesh = new THREE.Mesh(mainGeo, mainMat);
    scene.add(mainMesh);

    // Inner dark fill to create depth illusion
    const fillGeo = new THREE.IcosahedronGeometry(1.94, 3);
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x04040d,
      transparent: true,
      opacity: 0.95,
    });
    const fillMesh = new THREE.Mesh(fillGeo, fillMat);
    scene.add(fillMesh);

    // ── Outer Orbit Rings ──────────────────────────────────────
    const ring1Geo = new THREE.TorusGeometry(3.0, 0.018, 16, 180);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.28,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3.5;
    ring1.rotation.y = Math.PI / 6;
    scene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.6, 0.012, 16, 180);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.14,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 5;
    ring2.rotation.z = Math.PI / 4;
    scene.add(ring2);

    // ── Particle Field ─────────────────────────────────────────
    const COUNT = 2800;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Spherical distribution for a starfield feel
      const r = 8 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.028,
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Floating mini orbs ────────────────────────────────────
    const miniOrbs: THREE.Mesh[] = [];
    const miniPositions = [
      [3.2, 1.5, -1], [-2.8, -1.8, 0.5], [2.4, -2.2, 1],
      [-3.0, 1.2, -0.8], [1.8, 2.8, 0.3],
    ];
    miniPositions.forEach(([x, y, z]) => {
      const og = new THREE.SphereGeometry(0.045, 8, 8);
      const om = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.7 });
      const o = new THREE.Mesh(og, om);
      o.position.set(x, y, z);
      scene.add(o);
      miniOrbs.push(o);
    });

    // ── Mouse Parallax ─────────────────────────────────────────
    let targetX = 0, targetY = 0;
    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 0.8;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Animation Loop ─────────────────────────────────────────
    const clock = new THREE.Clock();
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      mainMesh.rotation.x = t * 0.08;
      mainMesh.rotation.y = t * 0.12;
      fillMesh.rotation.x = -t * 0.06;
      fillMesh.rotation.y = -t * 0.10;
      ring1.rotation.z    =  t * 0.05;
      ring2.rotation.z    = -t * 0.035;
      particles.rotation.y = t * 0.018;

      miniOrbs.forEach((o, i) => {
        o.position.y += Math.sin(t * 0.8 + i * 1.3) * 0.002;
        o.position.x += Math.cos(t * 0.6 + i * 0.9) * 0.001;
      });

      // Smooth camera follow mouse
      camera.position.x += (targetX * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (-targetY * 0.4 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ─────────────────────────────────────────────────
    const onResize = () => {
      if (!canvas) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mainGeo.dispose(); mainMat.dispose();
      fillGeo.dispose(); fillMat.dispose();
      ring1Geo.dispose(); ring1Mat.dispose();
      ring2Geo.dispose(); ring2Mat.dispose();
      particleGeo.dispose(); particleMat.dispose();
    };
  }, []);

  // CSS-only fallback when WebGL is unavailable (screenshot bots, old browsers)
  if (!webglOk) {
    return (
      <div
        className={className}
        style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Animated wireframe fallback via CSS */}
        <div style={{
          width: "320px", height: "320px", borderRadius: "50%",
          border: "1px solid rgba(34,211,238,0.35)",
          boxShadow: "0 0 80px rgba(34,211,238,0.08), inset 0 0 80px rgba(34,211,238,0.04)",
          position: "relative",
          animation: "spin 18s linear infinite",
        }}>
          <div style={{
            position: "absolute", inset: "16%",
            borderRadius: "50%",
            border: "1px solid rgba(167,139,250,0.25)",
            animation: "spin 12s linear infinite reverse",
          }} />
          <div style={{
            position: "absolute", inset: "34%",
            borderRadius: "50%",
            border: "1px solid rgba(34,211,238,0.4)",
            background: "rgba(34,211,238,0.03)",
          }} />
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
