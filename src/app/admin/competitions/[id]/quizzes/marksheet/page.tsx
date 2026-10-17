import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import pool from "@/lib/db";
import { parseCategorySubject } from "@/lib/quizSubjects";
import { getSubjectMarksheetData } from "../actions";
import { SubjectMarksheetView } from "@/components/admin/SubjectMarksheetView";

export const dynamic = "force-dynamic";

interface MarksheetPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subject?: string; catIds?: string }>;
}

export default async function MarksheetPage({ params, searchParams }: MarksheetPageProps) {
  const { id: competitionId } = await params;
  const { subject, catIds } = await searchParams;

  let targetCatIds: string[] = [];

  if (catIds) {
    targetCatIds = catIds.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (subject) {
    // Find all categories matching the subject name in this competition
    const catsRes = await pool.query(
      'SELECT id, name FROM quiz_category WHERE "competitionId" = $1',
      [competitionId]
    );

    targetCatIds = catsRes.rows
      .filter((cat) => {
        const parsed = parseCategorySubject(cat.name);
        return parsed.subject.trim().toLowerCase() === subject.trim().toLowerCase();
      })
      .map((cat) => cat.id);
  }

  if (targetCatIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-4 text-center">
        <h1 className="text-xl font-bold text-maroon-900">Marksheet Not Found</h1>
        <p className="text-sm text-gray-600">
          No categories found for subject &quot;{subject || "Unknown"}&quot;.
        </p>
        <Link
          href={`/admin/competitions/${competitionId}/quizzes`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-maroon-800 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>
      </div>
    );
  }

  const marksheetData = await getSubjectMarksheetData(competitionId, targetCatIds);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Back button (hidden when printing) */}
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/admin/competitions/${competitionId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon-700 hover:text-maroon-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      <SubjectMarksheetView
        data={marksheetData}
        competitionId={competitionId}
        showBackLink={true}
      />
    </div>
  );
}
