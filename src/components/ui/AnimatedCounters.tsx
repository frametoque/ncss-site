"use client";

import { useEffect, useState, useRef } from "react";
import { Users, Calendar, Trophy, Lightbulb } from "lucide-react";
import { useInView } from "framer-motion";

function Counter({ endValue, suffix = "" }: { endValue: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number | null = null;
    const duration = 2000; // 2 seconds

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // easeOutExpo for a nice smooth slowdown at the end
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeOut * endValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, endValue]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

export function AnimatedCounters() {
  const stats = [
    { label: "Active Members", value: 300, suffix: "+", icon: Users },
    { label: "Events Held", value: 45, suffix: "", icon: Calendar },
    { label: "Competitions Won", value: 30, suffix: "+", icon: Trophy },
    { label: "Intra School Projects", value: 50, suffix: "+", icon: Lightbulb },
  ];

  return (
    <section className="py-20 bg-gray-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-full bg-maroon-100 flex items-center justify-center mb-4 text-maroon-600">
                <stat.icon className="h-7 w-7" />
              </div>
              <div className="text-4xl font-bold font-heading text-gray-900 mb-2">
                <Counter endValue={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
