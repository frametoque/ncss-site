"use client";

import { useEffect, useRef } from "react";

const REVEAL_RADIUS = 130;

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Extended characters with Chemistry (⌬, ⏣), Physics (∿, ϟ, ↭), and ICT (⌘, ⌥, ⎋, ⌤, {}, <>, [], /\, &, @, #) non-emoji unicodes
    const chars = "01ΩΨΦΔΣλμπ∇∞∂∫≈≡∝√mc²ħℏ∑∏∈∉∩∪⊂⊃⊆⊇∀∃∄⊕⊗±∓×÷⌈⌉⌊⌋αβγδεζηθικνξρστυφχψω℃°′″∠⊥∥→⇒∵∴ℝℕℤℚℂ∮∯∰ℓ∗⌬⏣∿ϟ↭⌘⌥⎋⌤{}<>[]|\\/@#_~^".split("");

    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1).map(() => Math.random() * -50);

    const draw = () => {
      // Use a subtle maroon-50 tint for the trail fade to match background
      ctx.fillStyle = "rgba(254, 243, 242, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      columns = Math.floor(canvas.width / fontSize);

      const mouse = mouseRef.current;

      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        let proximityAlpha = 0;
        if (mouse) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REVEAL_RADIUS) {
            proximityAlpha = Math.pow(1 - dist / REVEAL_RADIUS, 1.6);
          }
        }

        if (proximityAlpha > 0.01) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const progress = drops[i] / (canvas.height / fontSize);
          const baseAlpha = Math.max(0.15, 0.7 - progress * 0.15);
          const isHead = Math.random() > 0.95;

          // Adapted colors to Red (from your previous instruction)
          if (isHead) {
            // Light Red (maroon-200 equivalent)
            ctx.fillStyle = `rgba(242, 184, 181, ${Math.min(baseAlpha * 5, 1.0) * proximityAlpha})`;
          } else {
            // Base Red (maroon-500 equivalent)
            ctx.fillStyle = `rgba(210, 50, 41, ${Math.min(baseAlpha * 3, 0.9) * proximityAlpha})`;
          }

          ctx.font = `${fontSize}px monospace`;
          ctx.fillText(char, x, y);
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = null;
    };

    const parent = canvas.parentElement;
    parent?.addEventListener("mousemove", handleMouseMove);
    parent?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
      parent?.removeEventListener("mousemove", handleMouseMove);
      parent?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
