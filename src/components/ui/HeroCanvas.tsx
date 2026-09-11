"use client";
import { useEffect, useRef } from "react";

export function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Use our Science/Math unicode set
    const symbols = [
      // Mathematics
      "∑", "∏", "∫", "∮", "∂", "∇", "√", "∛",
      "∞", "≈", "≠", "≡", "≤", "≥", "∝",
      "±", "∓", "∴", "∵", "∈", "∉", "∅",
      "∪", "∩", "⊂", "⊃", "∀", "∃",
      "∧", "∨", "¬", "⇒", "⇔", "→", "←", "↔",
      "∠", "⊥", "∥", "°",

      // Physics
      "ℏ", "Δ", "δ", "λ", "ν", "ω", "μ", "ρ",
      "σ", "τ", "φ", "Φ", "θ", "α", "β", "γ",
      "κ", "χ", "ψ", "Ψ", "Ω", "Γ", "ξ", "η",
      "⊙", "⊗", "⊕",

      // Chemistry
      "⇌", "⇄", "↑", "↓", "·", "⋅",
      "₊", "₋", "⁺", "⁻",
      "₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉",
      "⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹",

      // ICT
      "⌘", "⌥", "⌃", "⇧", "⎋", "↵", "⇥",
      "⟨", "⟩", "⟦", "⟧", "⌈", "⌉", "⌊", "⌋",
      "⊕", "⊗", "λ", "∅",

      // Greek
      "α", "β", "γ", "δ", "ε", "θ", "λ", "μ",
      "ν", "ξ", "π", "ρ", "σ", "τ", "φ", "χ", "ψ", "ω",
      "Γ", "Δ", "Θ", "Λ", "Π", "Σ", "Φ", "Ψ", "Ω",

      // Basic
      "+", "-", "×", "÷", "=", "<", ">", "{", "}",
      "[", "]", "(", ")", "0", "1"
    ];

    // Red color palette
    const maroons = ["#D23229", "#B82820", "#982019", "#7A1B16", "#E05A52", "#EA8B86", "#F9E0DF"];

    const COUNT = 12; // Reduced density to prevent distraction

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

      const w = container.clientWidth || 1000;
      const h = container.clientHeight || 800;

      let px = 0;
      // Spawn in left 25% or right 25% to keep center clear
      if (Math.random() > 0.5) {
        px = Math.random() * (w * 0.25);
      } else {
        px = w * 0.75 + Math.random() * (w * 0.25);
      }
      const py = Math.random() * h;

      const p: Particle = {
        el,
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.003,
        rotSpeed: (Math.random() - 0.5) * 1.5,
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

        // Constrain to left and right columns (avoiding center)
        const centerLeft = w * 0.25;
        const centerRight = w * 0.75;

        // Bounce off screen edges
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > h) { p.y = h; p.vy *= -1; }

        // Bounce off center column
        if (p.x > centerLeft && p.x < centerRight) {
          if (p.x < w / 2) {
            p.x = centerLeft;
            p.vx = -Math.abs(p.vx);
          } else {
            p.x = centerRight;
            p.vx = Math.abs(p.vx);
          }
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
