"use client";

import React, { useState, useRef, useMemo } from "react";
import { saveQuizQuestions } from "@/app/admin/competitions/[id]/quizzes/actions";
import { useRouter } from "next/navigation";
import { Code2, Trash2, Plus, GripVertical, CheckCircle, FileCode } from "lucide-react";
import { highlightCode } from "@/lib/prism";

const CODE_LANGUAGES = [
  { value: "python", label: "Python", ext: "py" },
  { value: "php", label: "PHP", ext: "php" },
  { value: "html", label: "HTML / CSS", ext: "html" },
  { value: "sql", label: "SQL", ext: "sql" },
  { value: "plaintext", label: "Pseudocode / Plain Text", ext: "txt" },
];

function CodeSnippetEditor({
  code,
  language,
  onChange,
  onRemove,
}: {
  code: string;
  language: string;
  onChange: (val: string) => void;
  onRemove: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumsRef = useRef<HTMLDivElement>(null);

  const currentLang = CODE_LANGUAGES.find(l => l.value === (language || "python")) || CODE_LANGUAGES[0];

  const highlightedHtml = useMemo(() => {
    return highlightCode(code || "", language);
  }, [code, language]);

  const lines = (code || "").split("\n");

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const top = e.currentTarget.scrollTop;
    const left = e.currentTarget.scrollLeft;
    if (preRef.current) {
      preRef.current.scrollTop = top;
      preRef.current.scrollLeft = left;
    }
    if (lineNumsRef.current) {
      lineNumsRef.current.scrollTop = top;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const newVal = val.substring(0, start) + "  " + val.substring(end);
      onChange(newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div 
      className="rounded-xl overflow-hidden border border-[#333333] bg-[#1e1e1e] shadow-lg flex flex-col resize-y"
      style={{ minHeight: '180px', height: '240px' }}
    >
      {/* VS Code Window Header */}
      <div className="bg-[#252526] px-3.5 py-2 border-b border-[#333333] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block" />
          </div>
          <span className="ml-1.5 text-[11px] font-mono font-medium text-[#9cdcfe]">
            snippet.{currentLang.ext}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#858585] font-mono">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex relative bg-[#1e1e1e] flex-1 min-h-0 overflow-hidden">
        {/* Line Numbers */}
        <div
          ref={lineNumsRef}
          aria-hidden="true"
          className="select-none py-3 pl-3 pr-2.5 text-right text-[#858585] border-r border-[#333333] shrink-0 font-mono text-xs leading-[20px] overflow-hidden bg-[#1e1e1e]"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
            minWidth: '42px',
          }}
        >
          {lines.map((_, i) => (
            <div key={i} style={{ height: '20px', lineHeight: '20px' }}>{i + 1}</div>
          ))}
        </div>

        {/* Code Canvas & Live Input */}
        <div className="relative flex-1 h-full min-h-0 overflow-hidden">
          {/* Syntax Highlighted Layer Underneath */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="vscode-theme absolute inset-0 m-0 p-3 pointer-events-none select-none font-mono text-xs leading-[20px] whitespace-pre overflow-hidden"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
              tabSize: 2,
              backgroundColor: '#1e1e1e',
            }}
            dangerouslySetInnerHTML={{
              __html: (highlightedHtml || "") + (code?.endsWith("\n") ? "\n " : ""),
            }}
          />

          {/* Interactive Input Layer */}
          <textarea
            ref={textareaRef}
            value={code || ""}
            onChange={(e) => onChange(e.target.value)}
            onScroll={syncScroll}
            onKeyDown={handleKeyDown}
            placeholder={`// Paste or type ${currentLang.label} code snippet here...`}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 w-full h-full m-0 p-3 font-mono text-xs leading-[20px] bg-transparent text-transparent caret-white selection:bg-[#264f78]/60 focus:outline-none resize-none whitespace-pre overflow-auto placeholder-[#6a9955]/70"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
              tabSize: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function QuizManager({ category, initialQuestions }: { category: any, initialQuestions: any[] }) {
  const isIctCategory = Boolean(
    category?.name && (
      category.name.toLowerCase().includes("ict") || 
      category.name.toLowerCase().includes("information communication") ||
      category.name.toLowerCase().includes("information and communication")
    )
  );

  const [questions, setQuestions] = useState<any[]>(() => {
    return initialQuestions.map(q => {
      const parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      const opts = Array.isArray(parsedOptions) ? [...parsedOptions] : [];
      // Ensure at least 5 options by default
      while (opts.length < 5) {
        opts.push("");
      }
      return {
        ...q,
        options: opts,
        correctOption: q.correctOption !== undefined && q.correctOption !== null ? q.correctOption.toString() : "0",
        code: q.code || "",
        codeLanguage: q.codeLanguage || "python",
        showCodeEditor: !!(q.code && q.code.trim()),
      };
    });
  });

  const router = useRouter();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        options: ["", "", "", "", ""],
        correctOption: "0",
        code: "",
        codeLanguage: "python",
        showCodeEditor: false,
      }
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], [field]: value };
    setQuestions(newQ);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQ = [...questions];
    const newOpts = [...newQ[qIndex].options];
    newOpts[oIndex] = value;
    newQ[qIndex] = { ...newQ[qIndex], options: newOpts };
    setQuestions(newQ);
  };

  const addOption = (qIndex: number) => {
    const newQ = [...questions];
    const currentOpts = newQ[qIndex].options || [];
    if (currentOpts.length >= 8) return;
    newQ[qIndex] = {
      ...newQ[qIndex],
      options: [...currentOpts, ""]
    };
    setQuestions(newQ);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQ = [...questions];
    const currentOpts = newQ[qIndex].options || [];
    if (currentOpts.length <= 2) return; // Keep at least 2 options
    const newOpts = currentOpts.filter((_: any, i: number) => i !== oIndex);
    
    let correct = parseInt(newQ[qIndex].correctOption || "0");
    if (correct === oIndex) {
      correct = 0;
    } else if (correct > oIndex) {
      correct = Math.max(0, correct - 1);
    }

    newQ[qIndex] = {
      ...newQ[qIndex],
      options: newOpts,
      correctOption: correct.toString()
    };
    setQuestions(newQ);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const [isSaving, setIsSaving] = useState(false);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null);
  const [draggedOption, setDraggedOption] = useState<{qIndex: number, oIndex: number} | null>(null);

  const saveQuestions = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const finalQuestions = [...questions];
      
      const uploadFile = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
        const { upload } = await import('@/lib/upload-client');
        const res = await upload(`competitions/quiz/${file.name}`, file, onProgress ? (pct) => onProgress(pct) : undefined);
        return res.url;
      };

      for (let i = 0; i < finalQuestions.length; i++) {
        if (finalQuestions[i].imageFile) {
          const url = await uploadFile(finalQuestions[i].imageFile);
          finalQuestions[i].image = url;
        }
        // Remove transient client state
        delete finalQuestions[i].imageFile; 
        delete finalQuestions[i].showCodeEditor;

        // Clean code snippet - only ICT category retains code attachments
        if (!isIctCategory || !finalQuestions[i].code || !finalQuestions[i].code.trim()) {
          finalQuestions[i].code = null;
          finalQuestions[i].codeLanguage = null;
        }
      }

      await saveQuizQuestions(category.id, finalQuestions);
      alert("Questions saved successfully!");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to save questions");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDropQuestion = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedQuestionIndex === null || draggedQuestionIndex === dropIndex) return;
    const newQ = [...questions];
    const [removed] = newQ.splice(draggedQuestionIndex, 1);
    newQ.splice(dropIndex, 0, removed);
    setQuestions(newQ);
    setDraggedQuestionIndex(null);
  };

  const handleDropOption = (e: React.DragEvent, qIndex: number, dropOIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedOption || draggedOption.qIndex !== qIndex) return;
    const dragOIndex = draggedOption.oIndex;
    if (dragOIndex === dropOIndex) return;

    const newQ = [...questions];
    const question = { ...newQ[qIndex] };
    const newOptions = [...question.options];
    
    const [removed] = newOptions.splice(dragOIndex, 1);
    newOptions.splice(dropOIndex, 0, removed);
    
    let correctOpt = parseInt(question.correctOption || "0");
    if (correctOpt === dragOIndex) {
      correctOpt = dropOIndex;
    } else if (dragOIndex < correctOpt && dropOIndex >= correctOpt) {
      correctOpt--;
    } else if (dragOIndex > correctOpt && dropOIndex <= correctOpt) {
      correctOpt++;
    }
    
    question.options = newOptions;
    question.correctOption = correctOpt.toString();
    newQ[qIndex] = question;
    setQuestions(newQ);
    setDraggedOption(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-maroon-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-maroon-900">Questions ({questions.length})</h2>
          </div>
          <button 
            onClick={addQuestion} 
            className="px-4 py-2 bg-maroon-50 text-maroon-800 hover:bg-maroon-100 border border-maroon-200 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIndex) => {
            const hasCode = !!(q.code && q.code.trim());
            const currentLang = CODE_LANGUAGES.find(l => l.value === (q.codeLanguage || "python")) || CODE_LANGUAGES[0];

            return (
              <div 
                key={qIndex} 
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDraggedQuestionIndex(qIndex);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropQuestion(e, qIndex)}
                className={`p-5 border rounded-xl space-y-4 transition-all ${draggedQuestionIndex === qIndex ? 'opacity-50 border-dashed border-maroon-400' : 'border-maroon-200 bg-maroon-50/20'}`}
              >
                <div className="flex justify-between items-center cursor-move border-b border-maroon-100 pb-3">
                  <h4 className="font-semibold text-maroon-900 flex items-center gap-2">
                    <span className="text-maroon-400 cursor-grab hover:text-maroon-600"><GripVertical className="w-4 h-4 inline" /></span> Question {qIndex + 1}
                  </h4>
                  <div className="flex items-center gap-3">
                    {isIctCategory && hasCode && (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Code2 className="w-3 h-3" /> Code attached ({currentLang.label})
                      </span>
                    )}
                    {q.image && (
                      <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                        Image attached
                      </span>
                    )}
                    <button 
                      onClick={() => removeQuestion(qIndex)} 
                      className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Question
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-maroon-800 mb-1">Question Text</label>
                    <textarea 
                      value={q.questionText} 
                      onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                      className="w-full px-3 py-2 border border-maroon-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-maroon-500"
                      rows={2}
                      placeholder="e.g. What will be the output of the following code snippet?"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-maroon-800 mb-1">Question Image (optional)</label>
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => updateQuestion(qIndex, 'imageFile', e.target.files?.[0] || null)}
                      className="w-full px-3 py-1.5 border border-maroon-200 rounded-lg text-sm bg-white file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-maroon-50 file:text-maroon-700 hover:file:bg-maroon-100"
                    />
                    {q.image && !q.imageFile && (
                      <p className="text-xs text-maroon-600 mt-1 truncate">Current: {q.image}</p>
                    )}
                    {q.imageFile && (
                      <p className="text-xs text-green-600 mt-1">New image selected: {q.imageFile.name}</p>
                    )}
                  </div>

                  {/* Code Attachment Section (ICT Only) */}
                  {isIctCategory && (
                    <div className="md:col-span-2">
                      <div className="border border-maroon-200 rounded-xl bg-white p-3.5 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-maroon-700" />
                            <span className="text-xs font-semibold text-maroon-900 uppercase tracking-wide">
                              Code Attachment (Optional)
                            </span>
                          </div>
                          {hasCode || q.showCodeEditor ? (
                            <button
                              type="button"
                              onClick={() => {
                                updateQuestion(qIndex, 'code', '');
                                updateQuestion(qIndex, 'showCodeEditor', false);
                              }}
                              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Remove Code
                            </button>
                          ) : null}
                        </div>

                        {!hasCode && !q.showCodeEditor ? (
                          <div className="py-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateQuestion(qIndex, 'showCodeEditor', true);
                                if (!q.codeLanguage) updateQuestion(qIndex, 'codeLanguage', 'python');
                              }}
                              className="text-xs font-medium text-maroon-700 hover:text-maroon-900 bg-maroon-50 hover:bg-maroon-100 border border-maroon-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Attach Code to Question
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-700">Language:</label>
                                <select
                                  value={q.codeLanguage || "python"}
                                  onChange={(e) => updateQuestion(qIndex, 'codeLanguage', e.target.value)}
                                  className="text-xs bg-white border border-maroon-200 rounded-md px-2.5 py-1 text-gray-800 focus:outline-none focus:ring-1 focus:ring-maroon-500"
                                >
                                  {CODE_LANGUAGES.map(lang => (
                                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                                  ))}
                                </select>
                              </div>
                              <span className="text-[11px] text-gray-500">
                                Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Tab</kbd> inside editor to indent 2 spaces
                              </span>
                            </div>

                            <CodeSnippetEditor
                              code={q.code || ""}
                              language={q.codeLanguage || "python"}
                              onChange={(val) => updateQuestion(qIndex, 'code', val)}
                              onRemove={() => {
                                updateQuestion(qIndex, 'code', "");
                                updateQuestion(qIndex, 'showCodeEditor', false);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Options & Correct Answer Section (5 options default) */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-maroon-800">
                      Options & Correct Answer ({q.options.length} options)
                    </label>
                    <span className="text-[11px] text-gray-500">Select the radio button for the correct answer</span>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt: string, oIndex: number) => {
                      const letter = String.fromCharCode(65 + oIndex); // A, B, C, D, E...
                      const isCorrect = q.correctOption === oIndex.toString();

                      return (
                        <div 
                          key={oIndex} 
                          className={`flex gap-2 items-center p-1.5 rounded-lg border transition-all ${
                            isCorrect ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-maroon-100'
                          } ${draggedOption?.qIndex === qIndex && draggedOption?.oIndex === oIndex ? 'opacity-40' : ''}`}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDraggedOption({ qIndex, oIndex });
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => handleDropOption(e, qIndex, oIndex)}
                        >
                          <span className="text-maroon-300 hover:text-maroon-600 cursor-grab px-1 text-base leading-none">
                            <GripVertical className="w-3.5 h-3.5 inline" />
                          </span>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="radio" 
                              name={`correct-${qIndex}`} 
                              checked={isCorrect}
                              onChange={() => updateQuestion(qIndex, 'correctOption', oIndex.toString())}
                              className="text-maroon-600 focus:ring-maroon-500 cursor-pointer w-4 h-4"
                            />
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-maroon-100 text-maroon-800'
                            }`}>
                              {letter}
                            </span>
                          </label>

                          <input 
                            type="text" 
                            value={opt} 
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-maroon-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-maroon-500"
                            placeholder={`Option ${letter} (Option ${oIndex + 1})`}
                          />

                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                              title="Delete option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.options.length < 8 && (
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-xs text-maroon-700 hover:text-maroon-900 font-medium flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add another option
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className="flex gap-4">
            <button 
              onClick={addQuestion} 
              className="px-4 py-2.5 border-2 border-dashed border-maroon-300 text-maroon-800 hover:bg-maroon-50 rounded-xl text-sm font-semibold w-full flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
          
          <div className="pt-4 border-t border-maroon-100 flex justify-end">
            <button 
              onClick={saveQuestions} 
              disabled={isSaving} 
              className="px-6 py-2.5 bg-maroon-800 text-white rounded-lg hover:bg-maroon-900 font-semibold disabled:opacity-50 shadow-sm transition-all"
            >
              {isSaving ? "Saving Questions..." : "Save Questions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
