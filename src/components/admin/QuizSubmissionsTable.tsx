"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, XCircle, MinusCircle, Download, Search, Filter } from "lucide-react";

export interface SubmissionRow {
  id: string;
  categoryId: string;
  categoryName: string;
  medium: string;
  schoolName: string;
  score: number;
  totalQuestions: number;
  totalTimeLeft: number;
  createdAt: string;
  answers: Record<string, string>;
  questions: Array<{
    id: string;
    questionText: string;
    correctOption: string;
  }>;
}

interface QuizSubmissionsTableProps {
  submissions: SubmissionRow[];
  subjectName: string;
}

export function QuizSubmissionsTable({ submissions, subjectName }: QuizSubmissionsTableProps) {
  const [selectedMedium, setSelectedMedium] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract unique mediums
  const availableMediums = useMemo(() => {
    const set = new Set<string>();
    for (const sub of submissions) {
      if (sub.medium) set.add(sub.medium);
    }
    return Array.from(set).sort();
  }, [submissions]);

  // Medium counts
  const mediumCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: submissions.length };
    for (const med of availableMediums) {
      map[med] = submissions.filter(s => s.medium === med).length;
    }
    return map;
  }, [submissions, availableMediums]);

  // Filtered and sorted
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchesMedium = selectedMedium === "ALL" || sub.medium === selectedMedium;
      const matchesSearch = !searchQuery.trim() || sub.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMedium && matchesSearch;
    });
  }, [submissions, selectedMedium, searchQuery]);

  function exportCSV() {
    if (filteredSubmissions.length === 0) return;
    const headers = ["Rank", "School Name", "Medium", "Score", "Total Questions", "Percentage", "Time Saved (s)", "Submitted At"];
    const rows = filteredSubmissions.map((sub, idx) => {
      const pct = sub.totalQuestions > 0 ? Math.round((sub.score / sub.totalQuestions) * 100) : 0;
      const dateStr = new Date(sub.createdAt).toLocaleString("en-US", { timeZone: "Asia/Colombo" });
      return [
        idx + 1,
        `"${sub.schoolName.replace(/"/g, '""')}"`,
        `"${sub.medium.replace(/"/g, '""')}"`,
        sub.score,
        sub.totalQuestions,
        `${pct}%`,
        sub.totalTimeLeft || 0,
        `"${dateStr}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${subjectName.toLowerCase().replace(/\s+/g, "_")}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getMediumBadgeStyle(medium: string) {
    const lower = medium.toLowerCase();
    if (lower.includes("english")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (lower.includes("sinhala")) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (lower.includes("tamil")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar: Medium Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-maroon-100 shadow-xs">
        {/* Medium Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedMedium("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              selectedMedium === "ALL"
                ? "bg-maroon-800 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>All Mediums</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              selectedMedium === "ALL" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
            }`}>
              {mediumCounts["ALL"] || 0}
            </span>
          </button>

          {availableMediums.map(med => (
            <button
              key={med}
              type="button"
              onClick={() => setSelectedMedium(med)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedMedium === med
                  ? "bg-maroon-800 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{med}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedMedium === med ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
              }`}>
                {mediumCounts[med] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Export */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search school..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-maroon-500 bg-white"
            />
          </div>

          <button
            type="button"
            onClick={exportCSV}
            disabled={filteredSubmissions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-maroon-50 text-maroon-800 hover:bg-maroon-100 border border-maroon-200 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-maroon-100 shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center text-maroon-500 py-12">
            No submissions found{searchQuery ? ` matching "${searchQuery}"` : ""}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-maroon-100 bg-maroon-50/50">
                  <th className="p-3 text-xs font-bold text-maroon-900 uppercase tracking-wider">Rank</th>
                  <th className="p-3 text-xs font-bold text-maroon-900 uppercase tracking-wider">School Name</th>
                  <th className="p-3 text-xs font-bold text-maroon-900 uppercase tracking-wider">Medium</th>
                  <th className="p-3 text-xs font-bold text-maroon-900 uppercase tracking-wider">Score</th>
                  <th className="p-3 text-xs font-bold text-maroon-900 uppercase tracking-wider">Time Saved</th>
                  <th className="p-3 text-xs font-bold text-maroon-900 uppercase tracking-wider">Submitted At</th>
                  <th className="p-3 text-xs font-bold text-maroon-900 uppercase tracking-wider min-w-[280px]">Answers Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-maroon-50">
                {filteredSubmissions.map((sub, index) => {
                  let rankClass = "text-gray-500 font-semibold";
                  let rankBadge = "bg-gray-100 text-gray-700";
                  let rankText = `${index + 1}th`;

                  if (index === 0) {
                    rankClass = "text-amber-600 font-bold";
                    rankBadge = "bg-amber-100 text-amber-900 border border-amber-300 font-bold";
                    rankText = "1st 🏆";
                  } else if (index === 1) {
                    rankClass = "text-slate-600 font-bold";
                    rankBadge = "bg-slate-100 text-slate-800 border border-slate-300 font-bold";
                    rankText = "2nd 🥈";
                  } else if (index === 2) {
                    rankClass = "text-amber-800 font-bold";
                    rankBadge = "bg-amber-50 text-amber-900 border border-amber-200 font-bold";
                    rankText = "3rd 🥉";
                  } else if (index === 3) {
                    rankText = "4th";
                  }

                  const pct = sub.totalQuestions > 0 ? Math.round((sub.score / sub.totalQuestions) * 100) : 0;

                  return (
                    <tr key={sub.id} className="hover:bg-maroon-50/20 transition-colors">
                      <td className="p-3 text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${rankBadge}`}>
                          {rankText}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-maroon-950 font-bold">
                        {sub.schoolName}
                      </td>
                      <td className="p-3 text-xs">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getMediumBadgeStyle(sub.medium)}`}>
                          {sub.medium}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-maroon-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-base">{sub.score}</span>
                          <span className="text-gray-400 font-medium text-xs">/ {sub.totalQuestions}</span>
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-maroon-700 font-mono font-medium">
                        {sub.totalTimeLeft || 0}s
                      </td>
                      <td className="p-3 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(sub.createdAt).toLocaleString("en-US", { timeZone: "Asia/Colombo" })}
                      </td>
                      <td className="p-3 text-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {sub.questions.map((q, i) => {
                            let isCorrect = false;
                            let answered = false;
                            if (sub.answers && sub.answers[q.id] !== undefined) {
                              answered = true;
                              isCorrect = sub.answers[q.id] === q.correctOption;
                            }
                            return (
                              <div
                                key={q.id}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${
                                  isCorrect
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : answered
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : "bg-gray-50 border-gray-200 text-gray-400"
                                }`}
                                title={`Q${i + 1}: ${answered ? (isCorrect ? "Correct" : "Incorrect") : "Unanswered"}`}
                              >
                                <span>Q{i + 1}</span>
                                {isCorrect ? (
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                ) : answered ? (
                                  <XCircle className="w-3 h-3 shrink-0" />
                                ) : (
                                  <MinusCircle className="w-3 h-3 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
