"use client";
import { useEffect, useRef } from "react";

export function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Use our Science/Math unicode set
    const symbols = [
      "∑", "π", "∞", "∫", "≈", "±", "√", "+", "-", "×", "÷",
      "∠", "∆", "∇", "∅", "µ", "Ω", "λ", "φ", "θ",
      "⌬", "⚗", "⚛", "ϟ", "↭", "{", "}", "<", ">", "0", "1"
    ];
    // Red color palette
    const maroons = ["#D23229", "#B82820", "#982019", "#7A1B16", "#E05A52", "#EA8B86", "#F9E0DF"];

    const COUNT = 30; // Kept lower to prevent clutter as requested earlier

    type Particle = {
      el: HTMLSpanElement;
      x: number; y: number;
      vx: number; vy: number;
      phase: number; speed: number;
      rotSpeed: number; rot: number;
      opacity: number;
      color: string;
      hovered: boolean;
      glowT: number;
      bounceT: number;
    };

    const particles: Particle[] = [];

    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement("span");
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const color = maroons[Math.floor(Math.random() * maroons.length)];
      const fontSize = 12 + Math.random() * 28;
      const opacity = 0.15 + Math.random() * 0.55;

      el.textContent = sym;
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = `
        position: absolute;
        left: 0; top: 0;
        font-family: var(--font-heading), Georgia, serif;
        font-size: ${fontSize}px;
        font-weight: ${Math.random() > 0.5 ? "700" : "400"};
        color: ${color};
        opacity: ${opacity};
        pointer-events: auto;
        user-select: none;
        cursor: default;
        will-change: transform;
        white-space: nowrap;
        z-index: 1;
      `;

      container.appendChild(el);

      const w = container.clientWidth || 400;
      const h = container.clientHeight || 400;
      
      const cx = w / 2;
      const cy = h * 0.25; // Logo is at top: 25%
      
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 180; // Spawn within 180px radius

      const p: Particle = {
        el,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.004,
        rotSpeed: (Math.random() - 0.5) * 1.2,
        rot: Math.random() * 360,
        opacity,
        color,
        hovered: false,
        glowT: 0,
        bounceT: 0,
      };

      el.addEventListener("mouseenter", () => { p.hovered = true; p.bounceT = 0; });
      el.addEventListener("mouseleave", () => { p.hovered = false; });
      particles.push(p);
    }

    // --- Center 3D floating logo ---
    const logoWrap = document.createElement("div");
    logoWrap.style.cssText = `
      position: absolute;
      left: 50%;
      top: 25%; /* Center Top placement as requested */
      transform: translate(-50%, -50%);
      z-index: 10;
      pointer-events: none;
      perspective: 600px;
    `;

    const logoInner = document.createElement("div");
    logoInner.style.cssText = `
      width: 150px;
      height: 150px;
      transform-style: preserve-3d;
      will-change: transform;
      position: relative;
    `;

    // Shadow layer (depth illusion) — decorative
    const shadow = document.createElement("div");
    shadow.setAttribute("aria-hidden", "true");
    shadow.style.cssText = `
      position: absolute;
      bottom: -24px;
      left: 50%;
      transform: translateX(-50%);
      width: 90px;
      height: 18px;
      background: radial-gradient(ellipse, rgba(210,50,41,0.25) 0%, transparent 70%); /* Red tint */
      border-radius: 50%;
      filter: blur(4px);
    `;

    // Glow ring behind logo — decorative
    const glowRing = document.createElement("div");
    glowRing.setAttribute("aria-hidden", "true");
    glowRing.style.cssText = `
      position: absolute;
      inset: -16px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(242,184,181,0.18) 0%, rgba(210,50,41,0.08) 50%, transparent 70%); /* Red glow */
      animation: pulse-ring 3s ease-in-out infinite;
    `;

    const img = document.createElement("img");
    img.src = "/ncss-logo.png";
    img.alt = "NCSS Logo";
    
    // Fallback if logo doesn't exist yet, shows a transparent blank so it doesn't show broken image
    img.onerror = () => {
      img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237A0C2E' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M10 2v7.31'/%3E%3Cpath d='M14 9.3V1.99'/%3E%3Cpath d='M8.5 2h7'/%3E%3Cpath d='M14 9.3a6.5 6.5 0 1 1-4 0'/%3E%3Cpath d='M5.52 16h12.96'/%3E%3C/svg%3E";
    };

    img.style.cssText = `
      width: 150px;
      height: 150px;
      display: block;
      position: relative;
      z-index: 2;
      object-fit: contain;
      transform: scale(1.2);
      transform-origin: center;
      filter: drop-shadow(0 10px 15px rgba(122, 12, 46, 0.2));
    `;

    logoInner.appendChild(glowRing);
    logoInner.appendChild(img);
    logoInner.appendChild(shadow);
    logoWrap.appendChild(logoInner);
    container.appendChild(logoWrap);

    // Inject keyframes
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse-ring {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.08); }
      }
    `;
    document.head.appendChild(style);

    // Animation
    let raf: number;
    let t = 0;
    let mouseX = -9999, mouseY = -9999;

    const onMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onLeave = () => { mouseX = -9999; mouseY = -9999; };
    container.addEventListener("mousemove", onMouse);
    container.addEventListener("mouseleave", onLeave);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.016;

      const w = container.clientWidth;
      const h = container.clientHeight;

      // --- Logo 3D float ---
      const floatY = Math.sin(t * 0.9) * 10;
      const floatX = Math.cos(t * 0.5) * 4;
      const tiltX = Math.sin(t * 0.7) * 10;
      const tiltY = Math.cos(t * 0.5) * 14;

      // Subtle mouse-tracking tilt
      const logoCx = w / 2, logoCy = h * 0.25;
      const mxNorm = mouseX > 0 ? (mouseX - logoCx) / logoCx : 0;
      const myNorm = mouseY > 0 ? (mouseY - logoCy) / logoCy : 0;
      const mouseTiltX = myNorm * -8;
      const mouseTiltY = mxNorm * 8;

      logoInner.style.transform = `
        translateX(${floatX}px)
        translateY(${floatY}px)
        rotateX(${tiltX + mouseTiltX}deg)
        rotateY(${tiltY + mouseTiltY}deg)
      `;

      // Shadow scales with float height
      const shadowScale = 0.7 + (floatY + 10) / 40;
      shadow.style.transform = `translateX(-50%) scaleX(${shadowScale})`;
      shadow.style.opacity = `${0.5 - (floatY + 10) / 40}`;

      // --- Particles ---
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(t * p.speed * 60 + p.phase) * 0.25;
        p.y += p.vy + Math.cos(t * p.speed * 48 + p.phase) * 0.18;
        p.rot += p.rotSpeed * 0.3;

        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 0) {
          const force = (80 - dist) / 80 * 1.5;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // Constrain to around the logo (radius ~220px)
        const distFromLogo = Math.sqrt(Math.pow(p.x - logoCx, 2) + Math.pow(p.y - logoCy, 2));
        if (distFromLogo > 220) {
          // Wrap around to the opposite edge of the cluster
          const wrapAngle = Math.atan2(p.y - logoCy, p.x - logoCx);
          p.x = logoCx - Math.cos(wrapAngle) * 210;
          p.y = logoCy - Math.sin(wrapAngle) * 210;
        }

        p.glowT = p.hovered ? Math.min(p.glowT + 0.1, 1) : Math.max(p.glowT - 0.06, 0);
        if (p.hovered) p.bounceT += 0.25;
        const bounceScale = p.hovered ? 1 + Math.sin(p.bounceT) * 0.25 : 1;

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scale(${bounceScale})`;
        p.el.style.opacity = `${Math.min(p.opacity + p.glowT * 0.4, 1)}`;
        
        // Hover glow maroon tint
        p.el.style.textShadow = p.glowT > 0.01
          ? `0 0 ${p.glowT * 14}px ${p.color}, 0 0 ${p.glowT * 6}px #cc869a`
          : "none";
        p.el.style.color = p.glowT > 0.5 ? "#a6244a" : p.color;
      });
    };

    animate();

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("mousemove", onMouse);
      container.removeEventListener("mouseleave", onLeave);
      particles.forEach(p => p.el.remove());
      logoWrap.remove();
      style.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full z-10"
      style={{ overflow: "hidden" }}
    />
  );
}
