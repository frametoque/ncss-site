"use client";

import React, { useState } from "react";
import { saveSchoolAccesses } from "@/app/admin/competitions/[id]/quizzes/actions";
import { useRouter } from "next/navigation";

export function SchoolAccessManager({ competitionId, initialAccesses }: { competitionId: string, initialAccesses: any[] }) {
  const [accesses, setAccesses] = useState<any[]>(initialAccesses);
  const router = useRouter();

  const addAccess = () => {
    setAccesses([...accesses, { schoolName: "", accessCode: Math.random().toString(36).substring(2, 8).toUpperCase() }]);
  };

  const updateAccess = (index: number, field: string, value: string) => {
    const newA = [...accesses];
    newA[index][field] = value;
    setAccesses(newA);
  };

  const removeAccess = (index: number) => {
    setAccesses(accesses.filter((_, i) => i !== index));
  };

  const saveAccess = async () => {
    try {
      await saveSchoolAccesses(competitionId, accesses);
      alert("Access codes saved!");
      router.refresh();
    } catch (e) {
      alert("Failed to save access codes");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm">
      <h2 className="text-lg font-semibold text-maroon-900 mb-2">School Access Codes</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-maroon-50 rounded-lg text-sm font-medium text-maroon-900">
          <div className="col-span-5">School Name</div>
          <div className="col-span-5">Access Code</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {accesses.map((a, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5">
              <input 
                type="text" 
                value={a.schoolName} 
                onChange={(e) => updateAccess(index, 'schoolName', e.target.value)}
                className="w-full px-3 py-2 border border-maroon-200 rounded-lg text-sm"
              />
            </div>
            <div className="col-span-5">
              <input 
                type="text" 
                value={a.accessCode} 
                onChange={(e) => updateAccess(index, 'accessCode', e.target.value)}
                className="w-full px-3 py-2 border border-maroon-200 rounded-lg text-sm font-mono"
              />
            </div>
            <div className="col-span-2 text-right">
              <button onClick={() => removeAccess(index)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
            </div>
          </div>
        ))}

        {accesses.length === 0 && (
          <div className="text-center text-maroon-500 py-4 text-sm">No schools added yet.</div>
        )}

        <button onClick={addAccess} className="px-4 py-2 border border-dashed border-maroon-300 text-maroon-700 rounded-lg hover:bg-maroon-50 text-sm font-medium w-full mt-2">
          + Add School
        </button>

        <div className="pt-4 border-t border-maroon-100 flex justify-end">
          <button onClick={saveAccess} className="px-6 py-2 bg-maroon-800 text-white rounded-lg hover:bg-maroon-900 font-medium">
            Save Access Codes
          </button>
        </div>
      </div>
    </div>
  );
}
