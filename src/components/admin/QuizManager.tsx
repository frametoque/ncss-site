"use client";

import React, { useState } from "react";
import { saveQuizQuestions } from "@/app/admin/competitions/[id]/quizzes/actions";
import { useRouter } from "next/navigation";

export function QuizManager({ category, initialQuestions }: { category: any, initialQuestions: any[] }) {
  const [questions, setQuestions] = useState<any[]>(initialQuestions.map(q => ({
    ...q,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
  })));
  const router = useRouter();

  const addQuestion = () => {
    setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctOption: "0" }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQ = [...questions];
    newQ[qIndex].options[oIndex] = value;
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
        const res = await upload(file, onProgress ? (pct) => onProgress(pct) : undefined);
        return res.url;
      };

      for (let i = 0; i < finalQuestions.length; i++) {
        if (finalQuestions[i].imageFile) {
          const url = await uploadFile(finalQuestions[i].imageFile);
          finalQuestions[i].image = url;
        }
        // Remove file object so we can pass to server action safely
        delete finalQuestions[i].imageFile; 
      }

      await saveQuizQuestions(category.id, finalQuestions);
      alert("Questions saved!");
      router.refresh();
    } catch (e) {
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
        <h2 className="text-lg font-semibold text-maroon-900 mb-4">Questions ({questions.length})</h2>
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div 
              key={qIndex} 
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                setDraggedQuestionIndex(qIndex);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropQuestion(e, qIndex)}
              className={`p-4 border rounded-lg space-y-4 transition-all ${draggedQuestionIndex === qIndex ? 'opacity-50 border-dashed border-maroon-400' : 'border-maroon-200 bg-maroon-50/30'}`}
            >
              <div className="flex justify-between items-start cursor-move">
                <h4 className="font-medium text-maroon-900 flex items-center gap-2">
                  <span className="text-maroon-300">⋮⋮</span> Question {qIndex + 1}
                </h4>
                <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-maroon-800 mb-1">Question Text</label>
                  <textarea 
                    value={q.questionText} 
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                    className="w-full px-3 py-2 border border-maroon-200 rounded-lg text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-maroon-800 mb-1">Question Image (optional)</label>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => updateQuestion(qIndex, 'imageFile', e.target.files?.[0] || null)}
                    className="w-full px-3 py-1.5 border border-maroon-200 rounded-lg text-sm bg-white"
                  />
                  {q.image && !q.imageFile && (
                    <p className="text-xs text-maroon-600 mt-1">Current image: {q.image}</p>
                  )}
                  {q.imageFile && (
                    <p className="text-xs text-green-600 mt-1">New image selected: {q.imageFile.name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-maroon-800">Options & Correct Answer</label>
                {q.options.map((opt: string, oIndex: number) => (
                  <div 
                    key={oIndex} 
                    className={`flex gap-2 items-center transition-all ${draggedOption?.qIndex === qIndex && draggedOption?.oIndex === oIndex ? 'opacity-50' : ''}`}
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
                    <span className="text-maroon-300 cursor-move text-xl leading-none px-1">⋮</span>
                    <input 
                      type="radio" 
                      name={`correct-${qIndex}`} 
                      checked={q.correctOption === oIndex.toString()}
                      onChange={() => updateQuestion(qIndex, 'correctOption', oIndex.toString())}
                      className="text-maroon-600 focus:ring-maroon-500 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={opt} 
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-maroon-200 rounded-md text-sm cursor-text"
                      placeholder={`Option ${oIndex + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex gap-4">
            <button onClick={addQuestion} className="px-4 py-2 border border-dashed border-maroon-300 text-maroon-700 rounded-lg hover:bg-maroon-50 text-sm font-medium w-full">
              + Add Question
            </button>
          </div>
          
          <div className="pt-4 border-t border-maroon-100 flex justify-end">
            <button onClick={saveQuestions} disabled={isSaving} className="px-6 py-2 bg-maroon-800 text-white rounded-lg hover:bg-maroon-900 font-medium disabled:opacity-50">
              {isSaving ? "Saving..." : "Save Questions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
