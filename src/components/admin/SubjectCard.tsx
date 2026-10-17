"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, Check, X, FileText, BookOpen } from "lucide-react";
import { parseCategorySubject } from "@/lib/quizSubjects";
import { 
  addMediumToSubject, 
  deleteQuizCategory, 
  deleteSubject,
  getSubjectQuizSubmissionsForPdf,
  getSubjectMarksheetData,
  SubjectMarksheetData,
} from "@/app/admin/competitions/[id]/quizzes/actions";
import QuizPdfExportModal from "@/components/admin/QuizPdfExportModal";
import SubjectMarksheetModal from "@/components/admin/SubjectMarksheetModal";

interface CategoryItem {
  id: string;
  name: string;
  questionTimer?: number | null;
}

interface SubjectCardProps {
  competitionId: string;
  competitionTitle?: string;
  subject: string;
  categories: CategoryItem[];
  questionCountMap: Record<string, number>;
  totalSubmissions: number;
}

export function SubjectCard({
  competitionId,
  competitionTitle = "Competition",
  subject,
  categories,
  questionCountMap,
  totalSubmissions
}: SubjectCardProps) {
  const [isAddingMedium, setIsAddingMedium] = useState(false);
  const [mediumInput, setMediumInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [timerInput, setTimerInput] = useState<number>(categories[0]?.questionTimer || 60);
  const [isSubmittingMedium, setIsSubmittingMedium] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfSubmissions, setPdfSubmissions] = useState<any[]>([]);
  const [isMarksheetModalOpen, setIsMarksheetModalOpen] = useState(false);
  const [marksheetData, setMarksheetData] = useState<SubjectMarksheetData | null>(null);
  const [isLoadingMarksheet, setIsLoadingMarksheet] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  const existingMediumsLower = new Set(
    categories.map(c => {
      const p = parseCategorySubject(c.name);
      return (p.medium || c.name).toLowerCase();
    })
  );

  // Suggested presets that aren't already added
  const allPresets = ["English Medium", "Sinhala Medium", "Tamil Medium"];
  const availablePresets = allPresets.filter(p => !existingMediumsLower.has(p.toLowerCase()));

  async function handleAddMedium(e: React.FormEvent) {
    e.preventDefault();
    const finalMedium = selectedPreset === "CUSTOM" || !selectedPreset 
      ? mediumInput.trim() 
      : selectedPreset;

    if (!finalMedium) return;

    try {
      setIsSubmittingMedium(true);
      await addMediumToSubject(competitionId, subject, finalMedium, timerInput || 60);
      setIsAddingMedium(false);
      setMediumInput("");
      setSelectedPreset("");
    } catch (err) {
      console.error("Failed to add medium:", err);
      alert("Failed to add medium. Please try again.");
    } finally {
      setIsSubmittingMedium(false);
    }
  }

  async function handleDeleteSingleMedium(catId: string, catName: string) {
    if (!confirm(`Are you sure you want to delete "${catName}"? This will delete all its questions and submissions.`)) {
      return;
    }
    try {
      setDeletingCatId(catId);
      await deleteQuizCategory(competitionId, catId);
    } catch (err) {
      console.error("Failed to delete medium:", err);
      alert("Failed to delete medium.");
    } finally {
      setDeletingCatId(null);
    }
  }

  async function handleDeleteEntireSubject() {
    if (!confirm(`Are you sure you want to delete the entire "${subject}" subject?\n\nThis will permanently delete all ${categories.length} mediums, their questions, submissions, and access codes.`)) {
      return;
    }
    try {
      setIsDeletingSubject(true);
      const catIds = categories.map(c => c.id);
      await deleteSubject(competitionId, catIds);
    } catch (err) {
      console.error("Failed to delete subject:", err);
      alert("Failed to delete subject.");
    } finally {
      setIsDeletingSubject(false);
    }
  }

  async function handleOpenPdfModal() {
    try {
      setIsExportingPdf(true);
      const catIds = categories.map(c => c.id);
      const subs = await getSubjectQuizSubmissionsForPdf(catIds);
      if (!subs || subs.length === 0) {
        alert("No genuine submissions found for this subject.");
        return;
      }
      setPdfSubmissions(subs);
      setIsPdfModalOpen(true);
    } catch (err: any) {
      console.error("PDF export error:", err);
      alert(`Failed to load submissions: ${err?.message || "Unknown error"}`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleOpenMarksheetModal() {
    try {
      setIsLoadingMarksheet(true);
      const catIds = categories.map(c => c.id);
      const data = await getSubjectMarksheetData(competitionId, catIds);
      setMarksheetData(data);
      setIsMarksheetModalOpen(true);
    } catch (err: any) {
      console.error("Marksheet load error:", err);
      alert(`Failed to load marksheet: ${err?.message || "Unknown error"}`);
    } finally {
      setIsLoadingMarksheet(false);
    }
  }

  const timer = categories[0]?.questionTimer || 60;

  return (
    <div className="bg-white p-5 rounded-2xl border border-maroon-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
      <div>
        {/* Header: Title & Badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-lg font-bold text-maroon-950 leading-snug">
            {subject}
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-maroon-50 text-maroon-700 border border-maroon-200 shrink-0">
            {categories.length} {categories.length === 1 ? "Medium" : "Mediums"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Timer: <span className="font-semibold text-maroon-800">{timer}s</span> per question
        </p>

        {/* Mediums Box */}
        <div className="space-y-2 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
          {categories.map(cat => {
            const parsed = parseCategorySubject(cat.name);
            const mediumLabel = parsed.medium || cat.name;
            const qCount = questionCountMap[cat.id] || 0;
            const isDeletingThis = deletingCatId === cat.id;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-white/70 hover:bg-white border border-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-gray-800 truncate">{mediumLabel}</span>
                  <span className="text-[10px] text-gray-400">({qCount} Qs)</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Link
                    href={`/admin/competitions/${competitionId}/quizzes/${cat.id}`}
                    className="px-2.5 py-1 bg-white hover:bg-maroon-100 text-maroon-800 rounded font-semibold text-[11px] border border-maroon-200 transition-colors"
                  >
                    Manage
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteSingleMedium(cat.id, cat.name)}
                    disabled={isDeletingThis}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-xs transition-colors cursor-pointer disabled:opacity-50"
                    title={`Delete ${cat.name}`}
                  >
                    {isDeletingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "×"
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Medium Button / Form */}
          {isAddingMedium ? (
            <form onSubmit={handleAddMedium} className="bg-white p-3 rounded-lg border border-maroon-200 shadow-xs space-y-2.5 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-maroon-900 tracking-wider">
                  Add Medium to {subject}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingMedium(false)}
                  className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset chips if available */}
              {availablePresets.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {availablePresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset);
                        setMediumInput(preset);
                      }}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        selectedPreset === preset
                          ? "bg-maroon-800 text-white border-maroon-800 font-semibold"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                      }`}
                    >
                      + {preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset("CUSTOM");
                      setMediumInput("");
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      selectedPreset === "CUSTOM"
                        ? "bg-maroon-800 text-white border-maroon-800 font-semibold"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              )}

              {/* Input for Medium Name */}
              {(selectedPreset === "CUSTOM" || availablePresets.length === 0) && (
                <div>
                  <input
                    type="text"
                    required
                    value={mediumInput}
                    onChange={e => setMediumInput(e.target.value)}
                    placeholder="e.g. Tamil Medium"
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 focus:outline-none focus:border-maroon-500 bg-white"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingMedium(false)}
                  className="px-2.5 py-1 text-xs text-gray-600 hover:text-gray-800 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMedium || (!mediumInput && !selectedPreset)}
                  className="px-3 py-1 bg-maroon-800 hover:bg-maroon-900 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingMedium ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  <span>Save Medium</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsAddingMedium(true);
                if (availablePresets.length > 0) {
                  setSelectedPreset(availablePresets[0]);
                  setMediumInput(availablePresets[0]);
                } else {
                  setSelectedPreset("CUSTOM");
                  setMediumInput("");
                }
              }}
              className="text-xs font-semibold text-maroon-700 hover:text-maroon-900 bg-white hover:bg-maroon-50 border border-dashed border-maroon-300 rounded-lg py-1.5 px-3 w-full flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medium</span>
            </button>
          )}
        </div>
      </div>

      {/* Card Footer: View Submissions & Action Exports */}
      <div className="pt-3 border-t border-maroon-50 space-y-2">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/competitions/${competitionId}/quizzes/${categories[0].id}/submissions`}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-maroon-800 text-white hover:bg-maroon-900 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <span>View Submissions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {totalSubmissions}
            </span>
          </Link>

          <button
            type="button"
            onClick={handleDeleteEntireSubject}
            disabled={isDeletingSubject}
            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-xl transition-colors flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
            title={`Delete entire ${subject} subject`}
          >
            {isDeletingSubject ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {totalSubmissions > 0 && (
            <button
              type="button"
              onClick={handleOpenPdfModal}
              disabled={isExportingPdf}
              className="flex-1 py-1.5 px-2 bg-maroon-50 text-maroon-800 hover:bg-maroon-100 border border-maroon-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs text-xs font-semibold"
              title={`Export ${subject} leaderboard PDF`}
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-maroon-800" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-maroon-800" />
              )}
              <span>Export Results</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenMarksheetModal}
            disabled={isLoadingMarksheet}
            className="flex-1 py-1.5 px-2 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs text-xs font-semibold"
            title={`Export ${subject} answers`}
          >
            {isLoadingMarksheet ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-amber-800" />
            )}
            <span>Export Answers</span>
          </button>
        </div>
      </div>

      {/* PDF Export Options Modal */}
      <QuizPdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        competitionTitle={competitionTitle}
        subjectName={subject}
        mediumFilter="ALL"
        submissions={pdfSubmissions}
      />

      {/* Marksheet & Question Paper Modal */}
      <SubjectMarksheetModal
        isOpen={isMarksheetModalOpen}
        onClose={() => setIsMarksheetModalOpen(false)}
        data={marksheetData}
        isLoading={isLoadingMarksheet}
        competitionId={competitionId}
      />
    </div>
  );
}
