"use client";

import { useState } from "react";

export function AboutTabs({ children }: { children: React.ReactNode[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    "Our History", 
    "Our Vision", 
    "Our Mission", 
    "Pulse Quest Magazine", 
    "Milestones", 
    "Annual Events", 
    "Old Photo Archive"
  ];

  return (
    <div className="w-full">
      <div className="flex space-x-2 border-b border-maroon-200 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-maroon-300">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === i
                ? "bg-maroon-900 text-white"
                : "text-maroon-800 hover:bg-maroon-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="w-full">
        {children[activeTab]}
      </div>
    </div>
  );
}
