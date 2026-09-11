import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isCompetitionEnded(comp: { date?: string | null, deadline?: string | null, isEnded?: boolean }): boolean {
  if (comp.isEnded) return true; // Fallback to existing flag if still manually checked in DB
  
  const strToUse = comp.deadline || comp.date;
  if (!strToUse) return false;

  // Try to parse range (e.g. "Feb 10 - Feb 20, 2024")
  const parts = strToUse.split('-');
  let lastPart = parts[parts.length - 1].trim();

  let parsedDate = new Date(lastPart);
  
  if (isNaN(parsedDate.getTime())) {
    parsedDate = new Date(strToUse);
  }
  
  if (isNaN(parsedDate.getTime())) {
    return false; // Can't parse date, assume not ended
  }
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of today
  
  return parsedDate < now;
}
