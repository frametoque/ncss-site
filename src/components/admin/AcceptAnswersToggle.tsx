"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptAnswersToggle({ competitionId, initialState }: { competitionId: string, initialState: boolean }) {
  const [isAccepting, setIsAccepting] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setIsLoading(true);
    const newState = !isAccepting;
    setIsAccepting(newState);
    try {
      await fetch(`/api/admin/competitions/${competitionId}/toggle-answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptingQuizAnswers: newState })
      });
      router.refresh();
    } catch (e) {
      alert("Failed to update status");
      setIsAccepting(!newState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-maroon-900">Quiz Status</h2>
      </div>
      <button 
        onClick={toggle} 
        disabled={isLoading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:ring-offset-2 ${
          isAccepting ? 'bg-green-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isAccepting ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
