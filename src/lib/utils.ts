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
  const lastPart = parts[parts.length - 1].trim();

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

export function formatDateString(dateString?: string | null): string {
  if (!dateString) return "";
  
  // If it's a datetime-local format (e.g. 2026-10-13T00:00)
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  } else {
    // If it's just a YYYY-MM-DD string
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
      }
    }
  }
  
  // Return original string if it's some other format (e.g. "TBA", "Feb 10 - Feb 20, 2024")
  return dateString;
}
