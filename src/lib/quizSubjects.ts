/**
 * Utility functions for parsing and grouping quiz categories by subject and medium.
 * Example:
 * "Biology - English Medium" -> Subject: "Biology", Medium: "English Medium"
 * "Biology - Sinhala Medium" -> Subject: "Biology", Medium: "Sinhala Medium"
 */

export interface ParsedCategorySubject {
  subject: string;
  medium: string | null;
}

export function parseCategorySubject(categoryName: string): ParsedCategorySubject {
  if (!categoryName) return { subject: "", medium: null };
  const trimmed = categoryName.trim();

  // Pattern: "Subject - Medium Medium", "Subject - Medium", "Subject (Medium)", etc.
  const match = trimmed.match(
    /^(.*?)(?:\s*(?:[-–—]|\(|\/)\s*(English|Sinhala|Tamil)(?:\s+Medium)?\s*\)?)?$/i
  );
  if (match && match[2]) {
    const rawSubject = match[1].trim();
    const lang = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
    return {
      subject: rawSubject || trimmed,
      medium: `${lang} Medium`
    };
  }

  // Pattern: "Subject English Medium" without separator
  const matchEnd = trimmed.match(/^(.*?)\s+(English|Sinhala|Tamil)\s+Medium$/i);
  if (matchEnd) {
    const lang = matchEnd[2].charAt(0).toUpperCase() + matchEnd[2].slice(1).toLowerCase();
    return {
      subject: matchEnd[1].trim(),
      medium: `${lang} Medium`
    };
  }

  return { subject: trimmed, medium: null };
}

export function getSubjectName(categoryName: string): string {
  return parseCategorySubject(categoryName).subject;
}

export interface SubjectGroup<T> {
  subject: string;
  categories: T[];
  categoryIds: string[];
}

export function groupCategoriesBySubject<T extends { id: string; name: string }>(
  categories: T[]
): SubjectGroup<T>[] {
  const map = new Map<string, { subject: string; categories: T[]; categoryIds: string[] }>();

  for (const cat of categories) {
    const { subject } = parseCategorySubject(cat.name);
    const key = subject.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        subject,
        categories: [],
        categoryIds: []
      });
    }
    const group = map.get(key)!;
    group.categories.push(cat);
    group.categoryIds.push(cat.id);
  }

  return Array.from(map.values()).sort((a, b) => a.subject.localeCompare(b.subject));
}
