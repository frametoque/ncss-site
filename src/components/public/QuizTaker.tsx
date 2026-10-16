"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Clock, Lock, Loader2, Code2, ZoomIn, X, ImageIcon } from "lucide-react";
import { highlightCode } from "@/lib/prism";
import { MathText } from "@/components/common/MathText";

function CodeViewer({ code, language }: { code: string; language?: string }) {
  const langLabel = (language || "code").toUpperCase();

  const highlightedLines = React.useMemo(() => {
    const html = highlightCode(code, language);
    return html.split("\n");
  }, [code, language]);

  return (
    <div 
      className="w-full rounded-2xl overflow-hidden border border-[#333333] bg-[#1e1e1e] shadow-xl flex flex-col h-full min-h-[200px] max-h-[520px] select-none"
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <div className="bg-[#252526] px-3.5 sm:px-4 py-2.5 border-b border-[#333333] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-[#9cdcfe] bg-[#1e1e1e] border border-[#3c3c3c] px-2 py-0.5 rounded">
            {langLabel}
          </span>
          <span className="text-xs text-[#858585] font-mono hidden sm:inline">code_attachment</span>
        </div>
      </div>

      <div 
        className="code-scroll overflow-auto font-mono text-xs sm:text-sm leading-relaxed flex-1 select-none pointer-events-auto bg-[#1e1e1e] overscroll-contain relative p-3 sm:p-4"
        onCopy={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          scrollbarWidth: 'thin',
          scrollbarColor: '#4a4a4a #1e1e1e',
        }}
      >
        <div className="flex flex-col min-h-full w-full">
          {highlightedLines.map((lineHtml, i) => (
            <div key={i} className="flex items-start min-w-full leading-relaxed hover:bg-[#2a2d2e]/30 rounded-xs">
              <span className="select-none text-[#858585] text-right pr-3 sm:pr-4 border-r border-[#333333] shrink-0 font-mono text-xs sm:text-sm w-7 sm:w-9 leading-relaxed">
                {i + 1}
              </span>
              <pre 
                className="vscode-theme pl-3 sm:pl-4 font-mono text-xs sm:text-sm leading-relaxed flex-1 select-none m-0 p-0 whitespace-pre-wrap [word-break:break-word] overflow-wrap-anywhere"
                style={{ backgroundColor: "transparent" }}
              >
                <code 
                  className="vscode-theme"
                  dangerouslySetInnerHTML={{ __html: lineHtml || "&nbsp;" }} 
                />
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuizTaker({ 
  category, 
  competitionTitle, 
  questions, 
  schoolAccessId, 
  schoolName, 
  slug 
}: { 
  category: any; 
  competitionTitle: string; 
  questions: any[]; 
  schoolAccessId: string; 
  schoolName: string; 
  slug: string;
}) {
  const perQuestionDuration = (category.questionTimer && Number(category.questionTimer) > 0)
    ? Number(category.questionTimer)
    : 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(perQuestionDuration);
  const [warningTimeLeft, setWarningTimeLeft] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string; badge?: string } | null>(null);

  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSubmittingRef = useRef(false);
  const isAdvancingRef = useRef(false);
  const timeSavedPerQuestionRef = useRef<Record<number, number>>({});

  const STORAGE_KEY = `quiz_${slug}_${category.id}_${schoolAccessId}`;

  const submitQuiz = async (currentAnswers: Record<string, string>, finalTotalTimeLeft: number = 0) => {
    if (isSubmittingRef.current || submitted) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.id,
          schoolAccessId,
          answers: currentAnswers,
          totalTimeLeft: finalTotalTimeLeft
        })
      });
      if (res.ok) {
        setSubmitted(true);
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Submission failed: ${errData.error || res.statusText}. Please try again.`);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (e) {
      alert("Submission error occurred while submitting quiz.");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleNextRef = useRef<(() => void) | null>(null);

  // Auto-advance logic: ONLY called when question timer or anti-cheat timer expires
  const handleNext = () => {
    if (isAdvancingRef.current || isSubmittingRef.current || submitted) return;
    isAdvancingRef.current = true;

    // Record time left for this question if any
    if (questionTimeLeft > 0 && !(currentIndex in timeSavedPerQuestionRef.current)) {
      timeSavedPerQuestionRef.current[currentIndex] = questionTimeLeft;
    }

    setCurrentIndex(prev => {
      if (prev < questions.length - 1) {
        setQuestionTimeLeft(perQuestionDuration);
        setTimeout(() => {
          isAdvancingRef.current = false;
        }, 400);
        return prev + 1;
      } else {
        // Last question timer ended -> automatically submit quiz
        let totalTimeLeft = 0;
        for (const time of Object.values(timeSavedPerQuestionRef.current)) {
          totalTimeLeft += time;
        }
        submitQuiz(answersRef.current, totalTimeLeft);
        return prev;
      }
    });
  };

  useEffect(() => {
    handleNextRef.current = handleNext;
  });

  // Restore state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.submitted) {
          setSubmitted(true);
        } else {
          setCurrentIndex(parsed.currentIndex || 0);
          setAnswers(parsed.answers || {});
          answersRef.current = parsed.answers || {};
          timeSavedPerQuestionRef.current = parsed.timeSavedPerQuestion || {};
          if (parsed.questionTimeLeft !== undefined && parsed.questionTimeLeft !== null && parsed.questionTimeLeft > 0) {
            setQuestionTimeLeft(parsed.questionTimeLeft);
          } else {
            setQuestionTimeLeft(perQuestionDuration);
          }
        }
      } catch (e) {
        console.error("Failed to restore quiz state", e);
      }
    } else {
      setQuestionTimeLeft(perQuestionDuration);
    }
    setIsRestoring(false);
  }, [STORAGE_KEY, perQuestionDuration]);

  // Save state continuously
  useEffect(() => {
    if (isRestoring || submitted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentIndex,
      answers,
      timeSavedPerQuestion: timeSavedPerQuestionRef.current,
      questionTimeLeft,
      submitted
    }));
  }, [currentIndex, answers, questionTimeLeft, submitted, isRestoring, STORAGE_KEY]);

  // Watch for main question timer hitting 0
  useEffect(() => {
    if (questionTimeLeft === 0 && !isRestoring && !submitted && !isSubmitting) {
      handleNextRef.current?.();
    }
  }, [questionTimeLeft, isRestoring, submitted, isSubmitting]);

  // Main countdown interval (1 second ticks)
  useEffect(() => {
    if (submitted || isRestoring || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, submitted, isRestoring, isSubmitting]);

  // Anti-cheat tab blur detection
  useEffect(() => {
    const handleBlur = () => {
      if (submitted || isSubmitting) return;
      setWarningTimeLeft(10);
    };

    const handleFocus = () => {
      setWarningTimeLeft(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        setWarningTimeLeft(10);
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        setWarningTimeLeft(10);
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        setWarningTimeLeft(10);
        e.preventDefault();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [submitted, isSubmitting]);

  // Tab switch warning countdown
  useEffect(() => {
    if (warningTimeLeft === null) {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
      document.title = `${competitionTitle} - ${category.name}`;
      return;
    }
    
    document.title = `⚠️ RETURN IN ${warningTimeLeft}s ⚠️`;

    warningTimerRef.current = setInterval(() => {
      setWarningTimeLeft(prev => {
        if (prev === null || prev <= 0) return prev;
        if (prev - 1 === 0) {
          setTimeout(() => handleNextRef.current?.(), 0);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [warningTimeLeft, competitionTitle, category.name]);

  useEffect(() => {
    if (submitted) {
      const t = setTimeout(() => {
        router.push('/');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [submitted, router]);

  const selectOption = (questionId: string, optionIndex: string) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: optionIndex };
      answersRef.current = newAnswers;
      return newAnswers;
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded-3xl text-center shadow-lg max-w-lg w-full flex flex-col items-center">
          <CheckCircle className="w-16 h-16 text-green-600 mb-6" />
          <h2 className="text-3xl font-bold mb-4">Quiz Submitted Successfully!</h2>
          <p className="text-lg">Thank you for participating in the {category.name} Quiz.</p>
        </div>
      </div>
    );
  }

  if (isRestoring) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 animate-pulse">Restoring your quiz session...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div>No questions available for this quiz.</div>;
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 animate-pulse">Processing your answers...</p>
      </div>
    );
  }

  const timeProgressPercent = Math.max(0, Math.min(100, (questionTimeLeft / perQuestionDuration) * 100));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { display: none !important; }
        }
      `}} />

      {/* Focus Lost Anti-Cheat Alert */}
      {warningTimeLeft !== null && (
        <div className="fixed inset-0 bg-red-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-red-700 mb-4">Focus Lost!</h2>
            <p className="text-gray-700 text-lg mb-6">
              You left the quiz tab. Please return immediately. Your question will be skipped automatically if you do not return in time.
            </p>
            <div className="text-5xl font-mono font-bold text-red-600 mb-4">{warningTimeLeft}s</div>
            <p className="text-sm text-gray-500">Click anywhere here to resume the quiz.</p>
          </div>
        </div>
      )}
      
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col w-full select-none my-auto"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        {/* Top Header */}
        <div className="bg-maroon-900 text-white px-3 py-2 sm:px-6 sm:py-3 flex justify-between items-center gap-2 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-[11px] font-medium text-maroon-300 uppercase tracking-wider truncate max-w-[120px] sm:max-w-none">{competitionTitle}</span>
              <span className="text-maroon-500">•</span>
              <span className="text-xs sm:text-sm font-bold text-white truncate">{category.name}</span>
            </div>
            {/* Question numbers row: horizontal scroll on mobile so it doesn't wrap and eat vertical space */}
            <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 overflow-x-auto no-scrollbar py-1 flex-nowrap max-w-full">
              {questions.map((q, i) => {
                const isCurrent = i === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                
                let circleClass = "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-all duration-200 shrink-0 select-none ";
                let textColor = "#f4c3c3";
                
                if (isCurrent) {
                  circleClass += " border-2 border-white bg-white shadow-md transform scale-110";
                  textColor = "#4d0000";
                } else if (isAnswered) {
                  circleClass += " border border-white/80 bg-white/95 shadow-xs";
                  textColor = "#4d0000";
                } else {
                  circleClass += " border border-maroon-700/80 bg-maroon-950/70 hover:bg-maroon-900";
                  textColor = "#f4c3c3";
                }

                return (
                  <div key={q.id} className={circleClass} title={`Question ${i + 1}`}>
                    <span style={{ color: textColor, fontWeight: isCurrent ? 900 : 700 }}>
                      {i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <p className="text-[9px] sm:text-[10px] text-maroon-200 uppercase tracking-wider">Your School</p>
            <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-[110px] sm:max-w-xs">{schoolName}</p>
          </div>
        </div>

        {/* Question Area */}
        <div className="p-4 sm:p-6 md:p-7 flex flex-col">
          {/* Top section: Question Text & Timer */}
          <div className="shrink-0 mb-4 sm:mb-5">
            <div className="flex justify-between items-start gap-3 sm:gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-maroon-700 font-bold mb-1">
                  Question {currentIndex + 1} of {questions.length}
                </div>
                <h3 className="text-base sm:text-lg md:text-xl text-gray-900 font-semibold leading-relaxed whitespace-pre-line break-normal [word-break:normal]">
                  <MathText text={currentQ.questionText} />
                </h3>
              </div>
              <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-center shrink-0 border shadow-xs transition-colors ${
                questionTimeLeft <= 5 
                  ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' 
                  : questionTimeLeft <= 10 
                    ? 'bg-amber-50 text-amber-800 border-amber-200' 
                    : 'bg-maroon-50 text-maroon-800 border-maroon-200'
              }`}>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5">Time Left</p>
                <p className="text-lg sm:text-2xl font-mono font-bold leading-none">{questionTimeLeft}s</p>
              </div>
            </div>

            {/* Animated Time Progress Bar */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  questionTimeLeft <= 5 
                    ? 'bg-red-500' 
                    : questionTimeLeft <= 10 
                      ? 'bg-amber-500' 
                      : 'bg-maroon-600'
                }`}
                style={{ width: `${timeProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Middle section: Options & Optional Attachments (Image and/or Code) */}
          {(() => {
            const rawOpts = typeof currentQ.options === 'string' ? JSON.parse(currentQ.options) : currentQ.options;
            const currentOptions: any[] = Array.isArray(rawOpts) ? rawOpts : [];
            const hasImage = !!currentQ.image;
            const hasCode = !!(currentQ.code && currentQ.code.trim());
            const hasAttachments = hasImage || hasCode;

            const normalizedOptions = currentOptions.map((opt: any) => {
              if (typeof opt === 'string') {
                return { text: opt, image: null };
              }
              return {
                text: typeof opt?.text === 'string' ? opt.text : '',
                image: opt?.image || null,
              };
            });

            const hasOptionImages = normalizedOptions.some((opt: any) => !!opt.image);

            const renderOptions = (
              <div className={`w-full ${
                hasOptionImages
                  ? hasAttachments
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3'
                    : 'grid grid-cols-1 sm:grid-cols-2 gap-3.5'
                  : hasAttachments
                    ? 'space-y-3 sm:space-y-3.5'
                    : 'space-y-3 sm:space-y-3.5 max-w-3xl mx-auto'
              }`}>
                {normalizedOptions.map((opt: { text: string; image: string | null }, i: number) => {
                  if ((!opt.text || opt.text.trim() === '') && !opt.image) {
                    return null;
                  }
                  const isSelected = answers[currentQ.id] === i.toString();
                  const letter = String.fromCharCode(65 + i);

                  if (hasOptionImages) {
                    return (
                      <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectOption(currentQ.id, i.toString())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            selectOption(currentQ.id, i.toString());
                          }
                        }}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-150 flex flex-col justify-between shrink-0 relative group cursor-pointer select-none ${
                          isSelected 
                            ? 'border-maroon-600 bg-maroon-50/80 text-maroon-900 shadow-md ring-2 ring-maroon-600/30' 
                            : 'border-gray-200 hover:border-maroon-300 hover:bg-gray-50/70 bg-white text-gray-800'
                        }`}
                      >
                        {/* Option Header: Letter & Zoom Button */}
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                              isSelected ? 'bg-maroon-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {letter}
                            </span>
                            {isSelected && (
                              <span className="text-[11px] font-bold text-maroon-700 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-maroon-600" /> Selected
                              </span>
                            )}
                          </div>

                          {opt.image && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomedImage({
                                  url: opt.image!,
                                  title: `Answer ${i + 1}`,
                                  badge: letter,
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setZoomedImage({
                                    url: opt.image!,
                                    title: `Answer ${i + 1}`,
                                    badge: letter,
                                  });
                                }
                              }}
                              className="text-gray-400 hover:text-maroon-700 p-1.5 hover:bg-maroon-100/60 rounded-lg transition-colors cursor-zoom-in"
                              title="Zoom in on diagram"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </span>
                          )}
                        </div>

                        {/* Image Box */}
                        {opt.image && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImage({
                                url: opt.image!,
                                title: `Answer ${i + 1}`,
                                badge: letter,
                              });
                            }}
                            className="w-full bg-white rounded-xl border border-gray-200/80 p-2 mb-2 flex items-center justify-center overflow-hidden min-h-[90px] max-h-[160px] sm:max-h-[180px] cursor-zoom-in"
                            title="Click to zoom in"
                          >
                            <img
                              src={opt.image}
                              alt={`Option ${letter}`}
                              className="max-h-[150px] sm:max-h-[170px] w-auto max-w-full object-contain pointer-events-none select-none"
                              draggable={false}
                            />
                          </div>
                        )}

                        {/* Text description (if present) */}
                        {opt.text && (
                          <p className={`text-xs sm:text-sm font-medium leading-relaxed whitespace-normal break-normal [word-break:normal] mt-1 ${
                            isSelected ? 'text-maroon-950 font-semibold' : 'text-gray-800'
                          }`}>
                            <MathText text={opt.text} />
                          </p>
                        )}
                      </div>
                    );
                  }

                  // Standard text-only option layout
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectOption(currentQ.id, i.toString())}
                      className={`w-full text-left py-3 px-4 sm:py-3.5 sm:px-5 rounded-2xl border-2 transition-all duration-150 flex items-center gap-3.5 shrink-0 cursor-pointer ${
                        isSelected 
                          ? 'border-maroon-600 bg-maroon-50 text-maroon-950 font-semibold shadow-xs ring-2 ring-maroon-600/30' 
                          : 'border-gray-200 hover:border-maroon-300 hover:bg-gray-50 text-gray-800 bg-white shadow-xs'
                      }`}
                    >
                      <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
                        isSelected ? 'bg-maroon-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base md:text-[1.02rem] leading-relaxed whitespace-normal break-normal [word-break:normal] flex-1">
                        <MathText text={opt.text} />
                      </span>
                    </button>
                  );
                })}
              </div>
            );

            return (
              <div className="w-full">
                {hasAttachments ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pb-2">
                    <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-start gap-4">
                      {hasImage && (
                        <div 
                          className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 p-2 min-h-[140px] flex items-center justify-center shrink-0 group cursor-pointer"
                          onClick={() => setZoomedImage({
                            url: currentQ.image,
                            title: `Question ${currentIndex + 1}`,
                          })}
                          title="Click to enlarge diagram"
                        >
                          <img 
                            src={currentQ.image} 
                            alt="Question figure" 
                            className="w-full h-full max-h-[240px] lg:max-h-[420px] object-contain pointer-events-none select-none" 
                            draggable={false}
                          />
                          <div className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                      {hasCode && (
                        <div className="flex-1 flex flex-col h-full min-h-[200px]">
                          <CodeViewer code={currentQ.code} language={currentQ.codeLanguage} />
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-start">
                      {renderOptions}
                    </div>
                  </div>
                ) : (
                  <div className="w-full pb-2 max-w-3xl mx-auto">
                    {renderOptions}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bottom Bar: Automated Progression (No manual Next button) */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 pt-3.5 sm:pt-4 border-t border-gray-100 shrink-0 mt-5 bg-white">
            {/* Status of answer selection */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              {answers[currentQ.id] !== undefined ? (
                <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 font-medium w-full sm:w-auto">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span>
                    Option <strong>{String.fromCharCode(65 + parseInt(answers[currentQ.id]))}</strong> selected.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium w-full sm:w-auto">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Please select an option before time expires.</span>
                </div>
              )}
            </div>

            {/* Auto-advance Locked Status Badge */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              {isSubmitting ? (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-maroon-50 text-maroon-800 rounded-lg font-bold text-xs sm:text-sm border border-maroon-200 shadow-sm animate-pulse w-full sm:w-auto justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-maroon-700" />
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium text-xs sm:text-sm shadow-inner w-full sm:w-auto justify-center">
                  <Lock className="w-3.5 h-3.5 text-maroon-700 shrink-0" />
                  <span>
                    {currentIndex < questions.length - 1 ? (
                      <>Next in <strong className="font-mono text-maroon-800">{questionTimeLeft}s</strong></>
                    ) : (
                      <>Submits in <strong className="font-mono text-maroon-800">{questionTimeLeft}s</strong></>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged Diagram Lightbox */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-3 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                {zoomedImage.badge && (
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-maroon-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs">
                    {zoomedImage.badge}
                  </span>
                )}
                <span className="text-sm sm:text-base font-bold text-maroon-950">
                  {zoomedImage.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] w-full flex items-center justify-center p-2 bg-gray-50/50 rounded-2xl border border-gray-100">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="max-h-[70vh] w-auto max-w-full object-contain pointer-events-none select-none"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
