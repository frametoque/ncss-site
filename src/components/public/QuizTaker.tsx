"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export function QuizTaker({ category, competitionTitle, questions, schoolAccessId, schoolName, slug }: { category: any, competitionTitle: string, questions: any[], schoolAccessId: string, schoolName: string, slug: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(category.questionTimer || null);

  const [warningTimeLeft, setWarningTimeLeft] = useState<number | null>(null);

  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSubmittingRef = useRef(false);
  const timeSavedPerQuestionRef = useRef<Record<number, number>>({});

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
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Submission failed: ${errData.error || res.statusText}. Please try again.`);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (e) {
      alert("Submission error");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleNextRef = useRef<(() => void) | null>(null);

  const handleNext = () => {
    // Add time for current question (ensures we only save the final time they spent on this index)
    if (questionTimeLeft !== null && questionTimeLeft > 0) {
      if (!(currentIndex in timeSavedPerQuestionRef.current)) {
        timeSavedPerQuestionRef.current[currentIndex] = questionTimeLeft;
      }
    }

    setCurrentIndex(prev => {
      if (prev < questions.length - 1) {
        setQuestionTimeLeft(category.questionTimer || null);
        return prev + 1;
      }
      return prev;
    });

    if (currentIndex >= questions.length - 1) {
      // Calculate total time saved across all questions
      let totalTimeLeft = 0;
      for (const time of Object.values(timeSavedPerQuestionRef.current)) {
        totalTimeLeft += time;
      }
      submitQuiz(answersRef.current, totalTimeLeft);
    }
  };

  useEffect(() => {
    handleNextRef.current = handleNext;
  });

  const STORAGE_KEY = `quiz_${slug}_${schoolAccessId}`;

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
          if (parsed.questionTimeLeft !== undefined && parsed.questionTimeLeft !== null) {
            setQuestionTimeLeft(parsed.questionTimeLeft);
          }
        }
      } catch (e) {
        console.error("Failed to restore quiz state", e);
      }
    }
    setIsRestoring(false);
  }, [slug, schoolAccessId, STORAGE_KEY]);

  // Save state continuously
  useEffect(() => {
    if (isRestoring) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentIndex,
      answers,
      timeSavedPerQuestion: timeSavedPerQuestionRef.current,
      questionTimeLeft,
      submitted
    }));
  }, [currentIndex, answers, questionTimeLeft, submitted, isRestoring, STORAGE_KEY]);

  // Watch for main timer hitting 0
  useEffect(() => {
    if (questionTimeLeft === 0) {
      handleNextRef.current?.();
    }
  }, [questionTimeLeft]);

  useEffect(() => {
    if (submitted || isRestoring) return;

    timerRef.current = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev === null || prev <= 0) return prev;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, answers, submitted, isRestoring]);

  useEffect(() => {
    const handleBlur = () => {
      if (submitted) return;
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
  }, [submitted]);

  useEffect(() => {
    if (warningTimeLeft === null) {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
      document.title = competitionTitle;
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
  }, [warningTimeLeft, competitionTitle]);

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
          <p className="text-lg">Thank you for participating.</p>
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { display: none !important; }
        }
      `}} />
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
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col flex-1 h-full min-h-0 select-none"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
      >
        <div className="bg-maroon-900 text-white p-6 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-sm font-medium text-maroon-300 uppercase tracking-wider mb-1">{competitionTitle}</h1>
          <h2 className="text-xl font-bold">{category.name}</h2>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap max-w-2xl">
            {questions.map((q, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = answers[q.id] !== undefined;
              
              let circleClass = "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-200 ";
              
              if (isCurrent) {
                circleClass += " border-white bg-transparent text-white ring-2 ring-white/30 ring-offset-1 ring-offset-maroon-900 shadow-sm transform scale-110";
              } else if (isAnswered) {
                circleClass += " border-white bg-white text-maroon-900 shadow-sm";
              } else {
                circleClass += " border-maroon-700 bg-maroon-900/50 text-maroon-500";
              }

              return (
                <div key={q.id} className={circleClass} title={`Question ${i + 1}`}>
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div>
            <p className="text-xs text-maroon-200 uppercase tracking-wider mb-0.5">Your School</p>
            <p className="text-sm font-semibold text-white">{schoolName}</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col min-h-0">
        <div className="mb-6 flex justify-between items-start gap-4 shrink-0">
          <div className="flex-1">
            <h3 className="text-2xl text-gray-900 font-medium leading-relaxed">
              {currentQ.questionText}
            </h3>
          </div>
          {questionTimeLeft !== null && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-center shrink-0 border border-red-100 shadow-sm">
              <p className="text-xs font-bold uppercase mb-0.5">Time Left</p>
              <p className="text-2xl font-mono leading-none">{questionTimeLeft}s</p>
            </div>
          )}
        </div>

        <div className={`gap-8 flex-1 min-h-0 mb-6 ${currentQ.image ? 'grid grid-cols-1 md:grid-cols-2 items-stretch' : 'flex flex-col justify-center'}`}>
          {currentQ.image && (
            <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 p-2 min-h-[300px]">
              <img src={currentQ.image} alt="Question figure" className="w-full h-full object-contain" />
            </div>
          )}
          
          <div className="space-y-4 flex flex-col justify-center overflow-y-auto px-1">
            {currentQ.options.map((opt: string, i: number) => {
              const isSelected = answers[currentQ.id] === i.toString();
              return (
                <button
                  key={i}
                  onClick={() => selectOption(currentQ.id, i.toString())}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 shrink-0 ${
                    isSelected 
                      ? 'border-maroon-600 bg-maroon-50 text-maroon-900' 
                      : 'border-gray-200 hover:border-maroon-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-sm shrink-0 ${
                      isSelected ? 'bg-maroon-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-lg">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 shrink-0">
          <Button 
            size="lg" 
            onClick={handleNext} 
            disabled={isSubmitting}
            className="px-10 h-14 text-lg rounded-xl shadow-lg shadow-maroon-500/30"
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
