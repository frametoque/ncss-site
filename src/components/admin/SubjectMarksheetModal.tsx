"use client";

import React, { useState } from "react";
import { X, Loader2, BookOpen, FileDown } from "lucide-react";
import { SubjectMarksheetData } from "@/app/admin/competitions/[id]/quizzes/actions";
import { SubjectMarksheetView } from "./SubjectMarksheetView";
import { exportMarksheetAsPdf } from "@/lib/exportMarksheetPdf";

export interface SubjectMarksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SubjectMarksheetData | null;
  isLoading: boolean;
  competitionId?: string;
}

export default function SubjectMarksheetModal({
  isOpen,
  onClose,
  data,
  isLoading,
  competitionId,
}: SubjectMarksheetModalProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  async function handleExportPdf() {
    if (!data || isExporting) return;
    const printEl = document.getElementById("subject-marksheet-printable");
    if (!printEl) return;

    setIsExporting(true);
    try {
      await exportMarksheetAsPdf({
        element: printEl,
        competitionTitle: data.competitionTitle,
        subject: data.subject,
      });
    } catch (err) {
      console.error("Export PDF error:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150 print:p-0 print:bg-white print:static print:inset-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !isExporting) {
          onClose();
        }
      }}
    >
      <div
        data-lenis-prevent="true"
        className="bg-gray-100 rounded-2xl shadow-2xl border border-maroon-100 w-full max-w-6xl flex flex-col max-h-[94vh] overflow-hidden overscroll-contain print:max-h-none print:h-auto print:border-none print:shadow-none print:bg-white print:overflow-visible print:rounded-none"
      >
        {/* Modal Top Bar (Hidden on print) */}
        <div className="no-print p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-maroon-900 via-maroon-850 to-maroon-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/10 text-white border border-white/10 shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold truncate leading-tight">
                {data ? `${data.subject} — Answers` : "Answers"}
              </h2>
              <p className="text-xs text-maroon-200 truncate mt-0.5">
                {data ? data.competitionTitle : "Loading subject questions..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {data && !isLoading && (
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-maroon-950 hover:bg-maroon-50 active:bg-maroon-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                title="Export as PDF"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-maroon-900 animate-spin" />
                    <span>Exporting PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-maroon-900" />
                    <span>Export as PDF</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 text-sm bg-gray-50 print:p-0 print:overflow-visible print:bg-white">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-maroon-700 mx-auto" />
              <p className="text-sm font-semibold text-maroon-900">
                Loading bilingual questions, LaTeX formulas, and answer schemes...
              </p>
            </div>
          ) : data ? (
            <SubjectMarksheetView data={data} competitionId={competitionId} hideTopButton={true} />
          ) : (
            <div className="py-16 text-center text-gray-500">
              No marksheet data found for this subject.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
