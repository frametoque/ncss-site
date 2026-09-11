"use client";
import { Trash2 } from "lucide-react";

export function DeleteButton() {
  return (
    <button 
      type="submit" 
      className="p-2 text-maroon-700 hover:bg-maroon-50 rounded-lg transition-colors" 
      title="Delete Form" 
      onClick={(e) => !confirm('Delete this form and all its submissions?') && e.preventDefault()}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
