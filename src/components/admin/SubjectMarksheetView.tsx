"use client";

import React, { useRef, useState } from "react";
import {
  FileDown,
  Code2,
  Loader2,
} from "lucide-react";
import { MathText } from "@/components/common/MathText";
import { highlightCode, escapeHtml } from "@/lib/prism";
import { SubjectMarksheetData, MarksheetQuestion } from "@/app/admin/competitions/[id]/quizzes/actions";
import { exportMarksheetAsPdf } from "@/lib/exportMarksheetPdf";

interface SubjectMarksheetViewProps {
  data: SubjectMarksheetData;
  competitionId?: string;
  showBackLink?: boolean;
  hideTopButton?: boolean;
}

function CodeBlock({ code, language }: { code: string; language?: string | null }) {
  const highlighted = React.useMemo(() => {
    return highlightCode(code, language || undefined);
  }, [code, language]);

  return (
    <div className="my-2.5 rounded-xl bg-[#1e1e1e] text-[#d4d4d4] border border-[#333333] overflow-hidden shadow-xs">
      <div className="bg-[#252526] px-3 py-1.5 border-b border-[#333333] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#9cdcfe]">
          <Code2 className="w-3.5 h-3.5 text-[#9cdcfe]" />
          <span>{(language || "code").toUpperCase()}</span>
        </div>
      </div>
      <div className="p-3 text-xs sm:text-sm font-mono overflow-x-auto">
        <pre className="vscode-theme m-0 p-0 whitespace-pre-wrap leading-relaxed font-mono">
          <code
            className="vscode-theme font-mono"
            dangerouslySetInnerHTML={{ __html: highlighted || escapeHtml(code) }}
          />
        </pre>
      </div>
    </div>
  );
}

export function SubjectMarksheetView({
  data,
  hideTopButton = false,
}: SubjectMarksheetViewProps) {
  const marksheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Group categories by medium
  const englishCat = data.categories.find(
    (c) => (c.medium || "").toLowerCase().includes("english")
  );
  const sinhalaCat = data.categories.find(
    (c) => (c.medium || "").toLowerCase().includes("sinhala")
  );
  const otherCats = data.categories.filter(
    (c) => c !== englishCat && c !== sinhalaCat
  );

  // Fallback to first available category if neither explicitly named english nor sinhala
  const englishQuestions: MarksheetQuestion[] =
    englishCat?.questions || (sinhalaCat ? [] : data.categories[0]?.questions || []);
  const sinhalaQuestions: MarksheetQuestion[] =
    sinhalaCat?.questions || (englishCat ? [] : data.categories[1]?.questions || []);

  const maxQuestionCount = Math.max(
    englishQuestions.length,
    sinhalaQuestions.length,
    ...otherCats.map((c) => c.questions.length),
    0
  );

  async function handleExportPdf() {
    const el = marksheetRef.current || document.getElementById("subject-marksheet-printable");
    if (!el || isExporting) return;

    setIsExporting(true);
    try {
      await exportMarksheetAsPdf({
        element: el,
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
    <div className="space-y-4">
      {/* Top Action Button (Hidden on print or if embedded in modal with top bar button) */}
      {!hideTopButton && (
        <div className="no-print flex items-center justify-end">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-maroon-900 hover:to-black text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            title="Export as PDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-white" />
                <span>Export as PDF</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Marksheet Printable Sheet */}
      <div
        id="subject-marksheet-printable"
        ref={marksheetRef}
        className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-200 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none"
      >
        {/* Document Header */}
        <div id="document-header" className="border-b-2 border-maroon-800 pb-5 print:pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-maroon-700">
                INFINITAS &apos;26
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-maroon-950 mt-1">
                {data.subject.toUpperCase()} — ANSWERS
              </h1>
            </div>
          </div>
        </div>

        {/* Questions Loop */}
        {maxQuestionCount === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No questions found for this subject.
          </div>
        ) : (
          <div className="space-y-6 print:space-y-5">
            {Array.from({ length: maxQuestionCount }).map((_, qIdx) => {
              const qNum = qIdx + 1;
              const enQ = englishQuestions[qIdx];
              const siQ = sinhalaQuestions[qIdx];

              const showEn = !!enQ;
              const showSi = !!siQ;

              const optCount = Math.max(
                enQ?.options?.length || 0,
                siQ?.options?.length || 0
              );

              return (
                <div
                  key={qIdx}
                  className="question-card print-page-break-avoid rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-shadow"
                >
                  {/* Question Header Banner */}
                  <div className="bg-gradient-to-r from-maroon-50 via-gray-50 to-white px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-maroon-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {qNum}
                      </span>
                      <span className="text-xs font-bold text-maroon-950 uppercase tracking-wide">
                        Question {qNum}
                      </span>
                    </div>
                  </div>

                  {/* Question Content: English Q -> Sinhala Q -> Code/Media -> Answers */}
                  <div className="p-4 sm:p-6 space-y-4">
                    {/* 1. English Question Text */}
                    {showEn && (
                      <div className="text-sm sm:text-base text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                        <MathText text={enQ.questionText} />
                      </div>
                    )}

                    {/* 2. Sinhala Question Text */}
                    {showSi && (
                      <div className={`text-sm sm:text-base text-gray-900 font-medium leading-relaxed font-sinhala whitespace-pre-wrap ${showEn ? "pt-3 border-t border-dashed border-gray-200" : ""}`}>
                        <MathText text={siQ.questionText} />
                      </div>
                    )}

                    {/* 3. Code block (rendered once after questions) */}
                    {(enQ?.code || siQ?.code) && (
                      <CodeBlock
                        code={enQ?.code || siQ?.code || ""}
                        language={enQ?.codeLanguage || siQ?.codeLanguage}
                      />
                    )}

                    {/* 4. Diagram Image (rendered once, keep one image) */}
                    {(enQ?.image || siQ?.image) && (
                      <div className="max-w-md my-2 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-1">
                        <img
                          src={enQ?.image || siQ?.image || undefined}
                          alt={`Question ${qNum} diagram`}
                          className="w-full h-auto max-h-64 object-contain rounded-lg"
                        />
                      </div>
                    )}

                    {/* 5. Combined Answers: both languages on the same answer square (omitting empty options) */}
                    <div className="space-y-2 pt-2">
                      {Array.from({ length: optCount })
                        .map((_, oIdx) => {
                          const optLetter = String.fromCharCode(65 + oIdx);
                          const enOpt = enQ?.options?.[oIdx];
                          const siOpt = siQ?.options?.[oIdx];

                          const enOptText = (typeof enOpt === "string" ? enOpt : enOpt?.text || "").trim();
                          const enOptImg = typeof enOpt === "object" ? enOpt?.image : null;

                          const siOptText = (typeof siOpt === "string" ? siOpt : siOpt?.text || "").trim();
                          const siOptImg = typeof siOpt === "object" ? siOpt?.image : null;
                          const optImg = enOptImg || siOptImg;

                          const hasContent = Boolean(enOptText || siOptText || optImg);

                          const normEn = enOptText.toLowerCase().replace(/\s+/g, "").replace(/[$`"'\\]/g, "");
                          const normSi = siOptText.toLowerCase().replace(/\s+/g, "").replace(/[$`"'\\]/g, "");

                          const isOptTextIdentical = Boolean(
                            enOptText &&
                            siOptText &&
                            (enOptText.toLowerCase() === siOptText.toLowerCase() ||
                             (normEn !== "" && normEn === normSi))
                          );

                          const isEnCorrect =
                            enQ?.correctOption !== undefined &&
                            enQ?.correctOption !== null &&
                            enQ.correctOption.toString() === oIdx.toString();
                          const isSiCorrect =
                            siQ?.correctOption !== undefined &&
                            siQ?.correctOption !== null &&
                            siQ.correctOption.toString() === oIdx.toString();
                          const isCorrect = isEnCorrect || isSiCorrect;

                          return {
                            oIdx,
                            optLetter,
                            enOptText,
                            siOptText,
                            optImg,
                            hasContent,
                            isOptTextIdentical,
                            isCorrect,
                          };
                        })
                        .filter((opt) => opt.hasContent)
                        .map((opt) => {
                          const hasSiLine = Boolean(opt.siOptText && !opt.isOptTextIdentical);
                          const shownLinesCount = (opt.enOptText ? 1 : 0) + (hasSiLine ? 1 : 0);
                          const isSingleAnswer = !opt.optImg && shownLinesCount === 1;

                          return (
                            <div
                              key={opt.oIdx}
                              className={`flex ${isSingleAnswer ? "items-center" : "items-start"} gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-colors ${
                                opt.isCorrect
                                  ? "bg-emerald-50/80 border-emerald-400 text-emerald-950 font-medium ring-1 ring-emerald-500/30"
                                  : "bg-rose-50/30 border-rose-200/80 text-rose-950"
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                  isSingleAnswer ? "" : "mt-0.5"
                                } ${
                                  opt.isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-rose-100 text-rose-700 border border-rose-300"
                                }`}
                              >
                                {opt.optLetter}
                              </span>

                              <div className="flex-1 min-w-0 text-xs sm:text-sm space-y-1">
                                {opt.enOptText && (
                                  <div className="leading-snug text-gray-900 font-medium">
                                    <MathText text={opt.enOptText} />
                                  </div>
                                )}

                                {opt.siOptText && !opt.isOptTextIdentical && (
                                  <div className={`leading-snug font-sinhala ${opt.enOptText ? "text-gray-700 text-xs sm:text-sm" : "text-gray-900 font-medium"}`}>
                                    <MathText text={opt.siOptText} />
                                  </div>
                                )}

                                {opt.optImg && (
                                  <div className="mt-1.5 max-w-xs rounded-lg border border-gray-200 overflow-hidden bg-white p-1">
                                    <img
                                      src={opt.optImg}
                                      alt={`Option ${opt.optLetter}`}
                                      className="w-full h-auto max-h-32 object-contain rounded"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Document Footer (Print visible) */}
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-xs text-gray-500">
          <span>ncsciencesociety.com</span>
          <span>Nalanda College Science Society</span>
        </div>
      </div>
    </div>
  );
}
