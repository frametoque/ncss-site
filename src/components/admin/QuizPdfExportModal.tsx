"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  FileText,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  exportQuizSubmissionsPdf,
  QuizPdfColumnsConfig,
  QuizPdfScope,
  QuizSubmissionItem,
  isTestUser,
  formatMediumLabel,
} from "@/lib/quizSubmissionsPdf";

export interface QuizPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionTitle: string;
  subjectName: string;
  mediumFilter?: string; // e.g. "ALL" or specific medium
  submissions: QuizSubmissionItem[];
}

export default function QuizPdfExportModal({
  isOpen,
  onClose,
  competitionTitle,
  subjectName,
  mediumFilter = "ALL",
  submissions,
}: QuizPdfExportModalProps) {
  const isAllMediums = !mediumFilter || mediumFilter === "ALL";

  // Configuration states
  const [showTopInfoBar, setShowTopInfoBar] = useState<boolean>(true);
  const [scope, setScope] = useState<QuizPdfScope>("all");
  const [customLimit, setCustomLimit] = useState<number>(15);
  const [columns, setColumns] = useState<QuizPdfColumnsConfig>({
    rank: true,
    schoolName: true,
    medium: isAllMediums,
    score: true,
    submittedAt: true,
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute genuine submissions count
  const genuineSubmissions = useMemo(() => {
    const nonTest = submissions.filter((s) => !isTestUser(s.schoolName));
    if (isAllMediums) return nonTest;
    return nonTest.filter(
      (s) => (s.medium || "").trim().toLowerCase() === mediumFilter.trim().toLowerCase()
    );
  }, [submissions, mediumFilter, isAllMediums]);

  const totalGenuineCount = genuineSubmissions.length;

  const exportCount = useMemo(() => {
    if (scope === "top10") return Math.min(10, totalGenuineCount);
    if (scope === "top20") return Math.min(20, totalGenuineCount);
    if (scope === "custom") return Math.min(customLimit, totalGenuineCount);
    return totalGenuineCount;
  }, [scope, customLimit, totalGenuineCount]);

  const selectedColCount = useMemo(() => {
    return Object.values(columns).filter(Boolean).length;
  }, [columns]);

  if (!isOpen) return null;

  function toggleColumn(key: keyof QuizPdfColumnsConfig) {
    setErrorMsg(null);
    setColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleSelectAllColumns() {
    setErrorMsg(null);
    setColumns({
      rank: true,
      schoolName: true,
      medium: true,
      score: true,
      submittedAt: true,
    });
  }

  function handleResetColumns() {
    setErrorMsg(null);
    setColumns({
      rank: true,
      schoolName: true,
      medium: isAllMediums,
      score: true,
      submittedAt: true,
    });
    setScope("all");
    setShowTopInfoBar(true);
  }

  function handleGeneratePdf() {
    if (selectedColCount === 0) {
      setErrorMsg("Please select at least one column to include in the PDF.");
      return;
    }

    if (totalGenuineCount === 0) {
      setErrorMsg("No genuine submissions found to export.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    // Yield so loading UI updates immediately
    setTimeout(() => {
      try {
        const res = exportQuizSubmissionsPdf({
          competitionTitle,
          subjectName,
          mediumFilter,
          submissions,
          options: {
            showTopInfoBar,
            scope,
            customLimit,
            columns,
          },
        });

        if (!res.success) {
          setErrorMsg(res.error || "Failed to generate PDF.");
        } else {
          onClose();
        }
      } catch (err: any) {
        console.error("PDF generation failed:", err);
        setErrorMsg(err?.message || "An unexpected error occurred while generating the PDF.");
      } finally {
        setIsGenerating(false);
      }
    }, 60);
  }

  const mediumDisplay = isAllMediums ? "All Mediums" : formatMediumLabel(mediumFilter);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) {
          onClose();
        }
      }}
    >
      <div
        data-lenis-prevent="true"
        className="bg-white rounded-2xl shadow-2xl border border-maroon-100 w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden overscroll-contain"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-maroon-900 via-maroon-850 to-maroon-800 text-white flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white border border-white/10 shrink-0 mt-0.5">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                Export PDF
              </h3>
              <p className="text-xs text-maroon-200 mt-0.5 line-clamp-1">
                {competitionTitle} • {subjectName} ({mediumDisplay})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)] text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Top Info Bar */}
          <label
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
              showTopInfoBar
                ? "bg-maroon-50/50 border-maroon-300 shadow-xs ring-1 ring-maroon-400/20"
                : "bg-gray-50/70 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="checkbox"
              checked={showTopInfoBar}
              onChange={(e) => setShowTopInfoBar(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-maroon-800 focus:ring-maroon-500 accent-maroon-800 cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-900">
              Top Info Bar
            </span>
          </label>

          {/* Section 2: Leaderboard Scope (All Places, Top 10, Top 20, Custom) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Option: All places */}
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`py-2.5 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                scope === "all"
                  ? "bg-maroon-50 border-maroon-600 text-maroon-950 font-bold ring-2 ring-maroon-500/20 shadow-xs"
                  : "bg-white border-gray-200 hover:border-maroon-200 hover:bg-gray-50/60 text-gray-700 font-semibold"
              }`}
            >
              <span className="text-xs">All Places</span>
              {scope === "all" && (
                <span className="w-3.5 h-3.5 rounded-full bg-maroon-800 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </button>

            {/* Option: Top 10 */}
            <button
              type="button"
              onClick={() => setScope("top10")}
              className={`py-2.5 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                scope === "top10"
                  ? "bg-maroon-50 border-maroon-600 text-maroon-950 font-bold ring-2 ring-maroon-500/20 shadow-xs"
                  : "bg-white border-gray-200 hover:border-maroon-200 hover:bg-gray-50/60 text-gray-700 font-semibold"
              }`}
            >
              <span className="text-xs">Top 10</span>
              {scope === "top10" && (
                <span className="w-3.5 h-3.5 rounded-full bg-maroon-800 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </button>

            {/* Option: Top 20 */}
            <button
              type="button"
              onClick={() => setScope("top20")}
              className={`py-2.5 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                scope === "top20"
                  ? "bg-maroon-50 border-maroon-600 text-maroon-950 font-bold ring-2 ring-maroon-500/20 shadow-xs"
                  : "bg-white border-gray-200 hover:border-maroon-200 hover:bg-gray-50/60 text-gray-700 font-semibold"
              }`}
            >
              <span className="text-xs">Top 20</span>
              {scope === "top20" && (
                <span className="w-3.5 h-3.5 rounded-full bg-maroon-800 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </button>

            {/* Option: Custom Amount */}
            <div
              onClick={() => setScope("custom")}
              className={`py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1 ${
                scope === "custom"
                  ? "bg-maroon-50 border-maroon-600 text-maroon-950 font-bold ring-2 ring-maroon-500/20 shadow-xs"
                  : "bg-white border-gray-200 hover:border-maroon-200 hover:bg-gray-50/60 text-gray-700 font-semibold"
              }`}
            >
              <span className="text-xs shrink-0">Top</span>
              <input
                type="number"
                min={1}
                max={9999}
                value={customLimit}
                onChange={(e) => {
                  setScope("custom");
                  const val = parseInt(e.target.value, 10);
                  setCustomLimit(isNaN(val) || val < 1 ? 1 : val);
                }}
                className="w-12 px-1 py-1 text-xs text-center border border-maroon-200 rounded-lg bg-white font-bold text-maroon-950 focus:outline-none focus:ring-1 focus:ring-maroon-500"
                placeholder="15"
                title="Enter custom top number"
              />
              {scope === "custom" && (
                <span className="w-3.5 h-3.5 rounded-full bg-maroon-800 text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>

          {/* Section 3: Columns Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-maroon-900">
                Columns to Include
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="text-maroon-700 hover:text-maroon-900 font-semibold cursor-pointer hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={handleResetColumns}
                  className="text-gray-500 hover:text-gray-800 cursor-pointer hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-1.5 bg-gray-50/60 p-2.5 rounded-xl border border-gray-200/80">
              {/* Column: Rank */}
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  columns.rank
                    ? "bg-white border-maroon-200 text-gray-900 shadow-2xs"
                    : "bg-gray-100/50 border-transparent text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={columns.rank}
                  onChange={() => toggleColumn("rank")}
                  className="h-4 w-4 rounded border-gray-300 text-maroon-800 focus:ring-maroon-500 accent-maroon-800 cursor-pointer"
                />
                <span className="text-xs font-semibold">Rank</span>
              </label>

              {/* Column: School Name */}
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  columns.schoolName
                    ? "bg-white border-maroon-200 text-gray-900 shadow-2xs"
                    : "bg-gray-100/50 border-transparent text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={columns.schoolName}
                  onChange={() => toggleColumn("schoolName")}
                  className="h-4 w-4 rounded border-gray-300 text-maroon-800 focus:ring-maroon-500 accent-maroon-800 cursor-pointer"
                />
                <span className="text-xs font-semibold">School Name</span>
              </label>

              {/* Column: Medium */}
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  columns.medium
                    ? "bg-white border-maroon-200 text-gray-900 shadow-2xs"
                    : "bg-gray-100/50 border-transparent text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={columns.medium}
                  onChange={() => toggleColumn("medium")}
                  className="h-4 w-4 rounded border-gray-300 text-maroon-800 focus:ring-maroon-500 accent-maroon-800 cursor-pointer"
                />
                <span className="text-xs font-semibold">Medium</span>
              </label>

              {/* Column: Score */}
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  columns.score
                    ? "bg-white border-maroon-200 text-gray-900 shadow-2xs"
                    : "bg-gray-100/50 border-transparent text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={columns.score}
                  onChange={() => toggleColumn("score")}
                  className="h-4 w-4 rounded border-gray-300 text-maroon-800 focus:ring-maroon-500 accent-maroon-800 cursor-pointer"
                />
                <span className="text-xs font-semibold">Score</span>
              </label>

              {/* Column: Submitted At */}
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  columns.submittedAt
                    ? "bg-white border-maroon-200 text-gray-900 shadow-2xs"
                    : "bg-gray-100/50 border-transparent text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={columns.submittedAt}
                  onChange={() => toggleColumn("submittedAt")}
                  className="h-4 w-4 rounded border-gray-300 text-maroon-800 focus:ring-maroon-500 accent-maroon-800 cursor-pointer"
                />
                <span className="text-xs font-semibold">Submitted At</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating || selectedColCount === 0 || totalGenuineCount === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-maroon-900 hover:to-black text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
