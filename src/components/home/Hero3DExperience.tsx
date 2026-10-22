"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, GraduationCap, Sparkles, Terminal } from "lucide-react";

/**
 * Generates an offscreen canvas texture depicting an authentic code editor.
 */
function createCodeEditorCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Background - Deep modern code editor
  ctx.fillStyle = "#0B132B";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top window control bar
  ctx.fillStyle = "#16203B";
  ctx.fillRect(0, 0, canvas.width, 52);

  // Window dots
  const dots = [
    { x: 30, color: "#EF4444" },
    { x: 54, color: "#F59E0B" },
    { x: 78, color: "#10B981" },
  ];
  dots.forEach(({ x, color }) => {
    ctx.beginPath();
    ctx.arc(x, 26, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // Tab
  ctx.fillStyle = "#0B132B";
  ctx.beginPath();
  ctx.roundRect(110, 8, 220, 44, [8, 8, 0, 0]);
  ctx.fill();

  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 16px 'JetBrains Mono', 'Fira Code', monospace";
  ctx.fillText("CodeMentors.tsx", 140, 34);

  // Tab indicator
  ctx.fillStyle = "#2563EB";
  ctx.fillRect(110, 50, 220, 2);

  // Editor content
  ctx.font = "bold 23px 'Consolas', 'Fira Code', 'JetBrains Mono', monospace";

  const lines = [
    { num: "01", tokens: [{ t: "import", c: "#F472B6" }, { t: " { useMentorship } ", c: "#F1F5F9" }, { t: "from", c: "#F472B6" }, { t: " '@codementors/pro';", c: "#34D399" }] },
    { num: "02", tokens: [{ t: "import", c: "#F472B6" }, { t: " { RealWorldProject } ", c: "#F1F5F9" }, { t: "from", c: "#F472B6" }, { t: " '@codementors/labs';", c: "#34D399" }] },
    { num: "03", tokens: [] },
    { num: "04", tokens: [{ t: "export", c: "#F472B6" }, { t: " function ", c: "#38BDF8" }, { t: "AccelerateCareer", c: "#FBBF24" }, { t: "() {", c: "#F1F5F9" }] },
    { num: "05", tokens: [{ t: "  const", c: "#F472B6" }, { t: " { mentor, reviewCode } = ", c: "#F1F5F9" }, { t: "useMentorship", c: "#38BDF8" }, { t: "();", c: "#F1F5F9" }] },
    { num: "06", tokens: [{ t: "  const", c: "#F472B6" }, { t: " isJobReady = ", c: "#F1F5F9" }, { t: "true", c: "#F59E0B" }, { t: ";", c: "#F1F5F9" }] },
    { num: "07", tokens: [] },
    { num: "08", tokens: [{ t: "  return (", c: "#F1F5F9" }] },
    { num: "09", tokens: [{ t: "    <", c: "#38BDF8" }, { t: "RealWorldProject", c: "#60A5FA" }] },
    { num: "10", tokens: [{ t: "      stack", c: "#FBBF24" }, { t: "={['Next.js', 'Node.js', 'SystemDesign']}", c: "#34D399" }] },
    { num: "11", tokens: [{ t: "      feedback", c: "#FBBF24" }, { t: "='1:1 Expert Code Review'", c: "#34D399" }] },
    { num: "12", tokens: [{ t: "      verifiedStatus", c: "#FBBF24" }, { t: "={isJobReady}", c: "#38BDF8" }] },
    { num: "13", tokens: [{ t: "    />", c: "#38BDF8" }] },
    { num: "14", tokens: [{ t: "  );", c: "#F1F5F9" }] },
    { num: "15", tokens: [{ t: "}", c: "#F1F5F9" }] },
  ];

  let y = 100;
  lines.forEach((line) => {
    // Line number
    ctx.fillStyle = "#475569";
    ctx.fillText(line.num, 30, y);

    let x = 80;
    line.tokens.forEach(({ t, c }) => {
      ctx.fillStyle = c;
      ctx.fillText(t, x, y);
      x += ctx.measureText(t).width;
    });
    y += 34;
  });

  // Glowing status pill at bottom right
  ctx.fillStyle = "rgba(37, 99, 235, 0.25)";
  ctx.beginPath();
  ctx.roundRect(canvas.width - 240, canvas.height - 42, 210, 28, [14]);
  ctx.fill();

  ctx.fillStyle = "#60A5FA";
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillText("● Live 1:1 Session Active", canvas.width - 225, canvas.height - 23);

  return canvas;
}

export function Hero3DExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [webglSupported, setWebglSupported] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Mouse parallax state
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (shouldReduceMotion) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 560;
    const height = container.clientHeight || 440;

    // 1. WebGL Renderer with safe fallback
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    } catch (err) {
      console.warn("WebGL initialization failed, falling back to 3D CSS depth composition:", err);
      setWebglSupported(false);
      return;
    }

    // 2. Scene setup
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.9, 4.4);

    // 2. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xe0e7ff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-4, 2, -2);
    scene.add(rimLight);

    const screenGlowLight = new THREE.PointLight(0x2563eb, 1.2, 3);
    screenGlowLight.position.set(0, 0.3, 0.6);
    scene.add(screenGlowLight);

    // 3. 3D Laptop Mesh Group
    const workstationGroup = new THREE.Group();
    scene.add(workstationGroup);

    // Laptop Base Materials
    const aluminumMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.75,
      roughness: 0.28,
    });

    const darkTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.6,
      roughness: 0.4,
    });

    // Base Chassis
    const baseGeo = new THREE.BoxGeometry(2.5, 0.08, 1.7);
    const baseMesh = new THREE.Mesh(baseGeo, aluminumMaterial);
    baseMesh.position.y = -0.04;
    workstationGroup.add(baseMesh);

    // Keyboard Deck Inset
    const keyboardDeckGeo = new THREE.BoxGeometry(2.3, 0.015, 0.95);
    const keyboardDeck = new THREE.Mesh(keyboardDeckGeo, darkTrimMaterial);
    keyboardDeck.position.set(0, 0.005, -0.2);
    workstationGroup.add(keyboardDeck);

    // Trackpad
    const trackpadGeo = new THREE.BoxGeometry(0.85, 0.01, 0.55);
    const trackpadMat = new THREE.MeshStandardMaterial({
      color: 0x273549,
      metalness: 0.5,
      roughness: 0.35,
    });
    const trackpad = new THREE.Mesh(trackpadGeo, trackpadMat);
    trackpad.position.set(0, 0.005, 0.45);
    workstationGroup.add(trackpad);

    // Screen Lid (Tilted ~105 degrees)
    const screenGroup = new THREE.Group();
    screenGroup.position.set(0, 0, -0.85);
    screenGroup.rotation.x = THREE.MathUtils.degToRad(-15); // Tilted back nicely
    workstationGroup.add(screenGroup);

    // Screen Back Shell
    const screenShellGeo = new THREE.BoxGeometry(2.5, 1.62, 0.06);
    const screenShell = new THREE.Mesh(screenShellGeo, aluminumMaterial);
    screenShell.position.set(0, 0.81, 0);
    screenGroup.add(screenShell);

    // Screen Bezel (Dark Front)
    const bezelGeo = new THREE.BoxGeometry(2.46, 1.58, 0.02);
    const bezel = new THREE.Mesh(bezelGeo, darkTrimMaterial);
    bezel.position.set(0, 0.81, 0.035);
    screenGroup.add(bezel);

    // Live Code Editor Screen Surface
    const codeCanvas = createCodeEditorCanvas();
    const codeTexture = new THREE.CanvasTexture(codeCanvas);
    codeTexture.colorSpace = THREE.SRGBColorSpace;
    codeTexture.minFilter = THREE.LinearFilter;
    codeTexture.magFilter = THREE.LinearFilter;

    const screenDisplayGeo = new THREE.PlaneGeometry(2.34, 1.46);
    const screenDisplayMat = new THREE.MeshBasicMaterial({
      map: codeTexture,
    });
    const screenDisplay = new THREE.Mesh(screenDisplayGeo, screenDisplayMat);
    screenDisplay.position.set(0, 0.81, 0.048);
    screenGroup.add(screenDisplay);

    // Subtle soft shadow plane underneath workstation
    const shadowGeo = new THREE.PlaneGeometry(3.2, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0b1730,
      transparent: true,
      opacity: 0.28,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.09;
    workstationGroup.add(shadowMesh);

    // 4. Floating 3D Code Symbols Orbiting the Workstation
    const symbolsGroup = new THREE.Group();
    scene.add(symbolsGroup);

    // Helper to create glowing floating badge mesh
    const createFloatingToken = (
      text: string,
      color: string,
      bgHex: number,
      pos: [number, number, number],
      scale = 0.5
    ) => {
      const tokenCanvas = document.createElement("canvas");
      tokenCanvas.width = 160;
      tokenCanvas.height = 160;
      const tCtx = tokenCanvas.getContext("2d");
      if (tCtx) {
        tCtx.fillStyle = "rgba(15, 23, 42, 0.9)";
        tCtx.beginPath();
        tCtx.roundRect(10, 10, 140, 140, 36);
        tCtx.fill();

        tCtx.lineWidth = 6;
        tCtx.strokeStyle = color;
        tCtx.stroke();

        tCtx.fillStyle = color;
        tCtx.font = "bold 56px 'JetBrains Mono', monospace";
        tCtx.textAlign = "center";
        tCtx.textBaseline = "middle";
        tCtx.fillText(text, 80, 80);
      }

      const tokenTexture = new THREE.CanvasTexture(tokenCanvas);
      tokenTexture.colorSpace = THREE.SRGBColorSpace;

      const tokenGeo = new THREE.PlaneGeometry(scale, scale);
      const tokenMat = new THREE.MeshBasicMaterial({
        map: tokenTexture,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const tokenMesh = new THREE.Mesh(tokenGeo, tokenMat);
      tokenMesh.position.set(...pos);
      symbolsGroup.add(tokenMesh);
      return tokenMesh;
    };

    // 3 Floating Tokens with distinct vibrant identities
    const tokenTag = createFloatingToken("</>", "#38BDF8", 0x0284c7, [-1.7, 1.1, 0.4], 0.65);
    const tokenCurl = createFloatingToken("{ }", "#60A5FA", 0x2563eb, [1.8, 1.3, 0.2], 0.65);
    const tokenBinary = createFloatingToken("01", "#34D399", 0x059669, [-1.6, -0.1, 0.8], 0.55);

    // 5. Floating Dust / Code Particles
    const particleCount = 28;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 5;
      particlePos[i + 1] = (Math.random() - 0.2) * 3;
      particlePos[i + 2] = (Math.random() - 0.5) * 3;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Initial position & tilt
    workstationGroup.rotation.y = THREE.MathUtils.degToRad(-14);
    workstationGroup.rotation.x = THREE.MathUtils.degToRad(8);
    workstationGroup.position.set(0.1, -0.35, 0);

    setIsLoaded(true);

    // 6. Mouse Interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.current.targetX = x;
      mouse.current.targetY = y;
    };

    const handleMouseLeave = () => {
      mouse.current.targetX = 0;
      mouse.current.targetY = 0;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // 7. Visibility IntersectionObserver (Pauses loop when offscreen)
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 8. Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return; // Save GPU/CPU when scrolled away

      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth mouse lerp
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

      // Base idle floating oscillation + mouse parallax tilt
      const idleFloat = Math.sin(elapsedTime * 1.2) * 0.04;
      workstationGroup.position.y = -0.35 + idleFloat;
      workstationGroup.rotation.y = THREE.MathUtils.degToRad(-14) + mouse.current.x * 0.18;
      workstationGroup.rotation.x = THREE.MathUtils.degToRad(8) - mouse.current.y * 0.12;

      // Bobbing floating tokens
      tokenTag.position.y = 1.1 + Math.sin(elapsedTime * 1.5 + 0.5) * 0.06;
      tokenTag.rotation.z = Math.sin(elapsedTime * 0.8) * 0.05;

      tokenCurl.position.y = 1.3 + Math.sin(elapsedTime * 1.4 + 2.0) * 0.07;
      tokenCurl.rotation.z = -Math.sin(elapsedTime * 0.9) * 0.05;

      tokenBinary.position.y = -0.1 + Math.sin(elapsedTime * 1.6 + 3.5) * 0.05;

      // Slowly rotate particle field
      particles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);

      renderer.dispose();
      baseGeo.dispose();
      keyboardDeckGeo.dispose();
      trackpadGeo.dispose();
      screenShellGeo.dispose();
      bezelGeo.dispose();
      screenDisplayGeo.dispose();
      shadowGeo.dispose();
      particleGeo.dispose();
      codeTexture.dispose();
      aluminumMaterial.dispose();
      darkTrimMaterial.dispose();
      trackpadMat.dispose();
      screenDisplayMat.dispose();
      shadowMat.dispose();
      particleMat.dispose();
    };
  }, [shouldReduceMotion]);

  // If user prefers reduced motion or WebGL failed, render graceful static 3D depth composition
  if (shouldReduceMotion || !webglSupported) {
    return (
      <div className="relative w-full aspect-[4/3] sm:aspect-[14/11] rounded-2xl overflow-hidden shadow-2xl border border-[#E2E8F0] bg-[#0B132B] flex items-center justify-center p-6">
        <img
          src="/images/hero-developer.jpg"
          alt="CodeMentors 3D Developer Workstation"
          className="w-full h-full object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14213D]/40 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] sm:aspect-[14/11] select-none flex items-center justify-center"
      style={{ perspective: "1000px" }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Subtle depth lighting overlay */}
      <div className="absolute -inset-4 bg-radial from-blue-500/10 via-transparent to-transparent blur-2xl pointer-events-none -z-10" />

      {/* Floating Card 1: Live Mentorship (with 3D perspective depth) */}
      <motion.div
        className="absolute -top-3 -left-2 sm:top-4 sm:-left-5 p-3 sm:p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-xl flex items-center gap-3 z-20 pointer-events-auto"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        whileHover={{ y: -4, scale: 1.02 }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-[#14213D]">Live Mentorship</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5 overflow-hidden">
              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="/images/mentor-aman.jpg" alt="Aman" />
              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="/images/mentor-neha.jpg" alt="Neha" />
              <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="/images/mentor-rohit.jpg" alt="Rohit" />
            </div>
            <span className="text-[11px] font-medium text-[#64748B]">1:1 Guidance</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Card 2: Structured Learning (with 3D perspective depth) */}
      <motion.div
        className="absolute -bottom-4 sm:bottom-4 left-2 sm:-left-4 p-3.5 sm:p-4 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-xl z-20 space-y-2 pointer-events-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        whileHover={{ y: -4, scale: 1.02 }}
      >
        <p className="text-xs font-bold text-[#14213D]">Structured Learning</p>
        <div className="space-y-1.5 text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[#14213D] font-medium">Watch Lessons</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[#14213D] font-medium">Practice & Build</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[#14213D] font-medium">Get Certified</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Icon 3: Graduation Cap Badge */}
      <motion.div
        className="absolute top-2 right-2 sm:-top-3 sm:-right-3 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#06B6D4] text-white flex items-center justify-center shadow-lg z-20"
        whileHover={{ scale: 1.1, rotate: 6 }}
        transition={{ duration: 0.2 }}
      >
        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.div>
    </div>
  );
}

export default Hero3DExperience;
