"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  saveSchoolAccesses, 
  getFormSchoolCandidates, 
  importSelectedSchools, 
  deleteSchoolFromAllCategories,
  RegisteredSchoolCandidate 
} from "@/app/admin/competitions/[id]/quizzes/actions";
import { 
  groupCategoriesBySubject, 
  getSubjectName, 
  parseCategorySubject,
  SubjectGroup 
} from "@/lib/quizSubjects";
import { 
  exportSubjectAccessCodesPdf,
  exportMasterAccessCodesPdf
} from "@/lib/schoolAccessPdf";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Copy, 
  RotateCw, 
  Check, 
  AlertCircle, 
  Download,
  X,
  FileDown,
  FileText,
  ChevronDown,
  Search,
  Save
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface SchoolAccess {
  id?: string;
  competitionId: string;
  categoryId: string | null;
  schoolName: string;
  accessCode: string;
}

export function SchoolAccessManager({ 
  competitionId, 
  competitionTitle = "Competition",
  categories = [], 
  initialAccesses = [],
  selectedCategoryId,
  linkedForms = []
}: { 
  competitionId: string;
  competitionTitle?: string;
  categories: Category[];
  initialAccesses: any[];
  selectedCategoryId?: string;
  linkedForms?: { id: string; title: string }[];
}) {
  const router = useRouter();

  const subjectGroups = useMemo(() => {
    return groupCategoriesBySubject(categories);
  }, [categories]);

  const [accesses, setAccesses] = useState<SchoolAccess[]>(() => {
    return initialAccesses.map(a => ({
      ...a,
      categoryId: a.categoryId || (categories.length === 1 ? categories[0].id : null)
    }));
  });

  useEffect(() => {
    setAccesses(
      initialAccesses.map(a => ({
        ...a,
        categoryId: a.categoryId || (categories.length === 1 ? categories[0].id : null)
      }))
    );
  }, [initialAccesses, categories]);

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingToAll, setIsAddingToAll] = useState(false);
  const [deletingSchoolName, setDeletingSchoolName] = useState<string | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [newSchoolNameModal, setNewSchoolNameModal] = useState("");
  const [showAddToAllModal, setShowAddToAllModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal for Sync from Registrations
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidates, setCandidates] = useState<RegisteredSchoolCandidate[]>([]);
  const [selectedCandidateNames, setSelectedCandidateNames] = useState<Set<string>>(new Set());
  const [candidateFilterTab, setCandidateFilterTab] = useState<"pending" | "all">("pending");

  // Prevent background scrolling when sync modal is open
  useEffect(() => {
    if (showSyncModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showSyncModal]);

  // Helper to generate a unique random code that doesn't conflict with existing codes
  const generateUniqueCode = (existingCodesSet: Set<string>): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous 0/O, 1/I
    for (let attempt = 0; attempt < 500; attempt++) {
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!existingCodesSet.has(code)) {
        existingCodesSet.add(code);
        return code;
      }
    }
    const fallback = Math.random().toString(36).substring(2, 8).toUpperCase();
    existingCodesSet.add(fallback);
    return fallback;
  };

  const allCodesSet = useMemo(() => {
    return new Set(accesses.map(a => a.accessCode?.trim().toUpperCase()).filter(Boolean));
  }, [accesses]);

  /**
   * Validate duplicate codes:
   * Having the same code across mediums of the SAME subject for the SAME school is EXPECTED.
   * A code is ONLY a duplicate error if:
   * 1. It is used by two DIFFERENT schools.
   * 2. It is used by two DIFFERENT subjects.
   */
  const duplicateErrors = useMemo(() => {
    const codeMap = new Map<string, Array<{ schoolName: string; subject: string }>>();
    for (const a of accesses) {
      const code = a.accessCode?.trim().toUpperCase();
      if (!code) continue;
      const sName = a.schoolName?.trim() || "Unnamed School";
      const cat = categories.find(c => c.id === a.categoryId);
      const subject = cat ? getSubjectName(cat.name) : "General";

      if (!codeMap.has(code)) {
        codeMap.set(code, []);
      }
      codeMap.get(code)!.push({ schoolName: sName, subject });
    }

    const errors: string[] = [];
    codeMap.forEach((occurrences, code) => {
      const schools = Array.from(new Set(occurrences.map(o => o.schoolName)));
      const subjects = Array.from(new Set(occurrences.map(o => o.subject)));

      if (schools.length > 1) {
        errors.push(`Code "${code}" is assigned to multiple schools (${schools.join(", ")}).`);
      } else if (subjects.length > 1) {
        errors.push(`Code "${code}" for "${schools[0]}" is shared across multiple subjects (${subjects.join(", ")}). Each subject must have a unique code.`);
      }
    });

    return errors;
  }, [accesses, categories]);

  // Update a school's code for a specific subject (applies across all mediums/categories of this subject)
  const updateSchoolSubjectCode = (schoolName: string, catIds: string[], newCode: string) => {
    const upperCode = newCode.toUpperCase().trim();
    const schoolLower = schoolName.trim().toLowerCase();

    setAccesses(prev => {
      const next = prev.map(a => {
        if (a.categoryId && catIds.includes(a.categoryId) && a.schoolName?.trim().toLowerCase() === schoolLower) {
          return { ...a, accessCode: upperCode };
        }
        return a;
      });

      const existingInSubject = next.filter(
        a => a.categoryId && catIds.includes(a.categoryId) && a.schoolName?.trim().toLowerCase() === schoolLower
      );
      const coveredCatIds = new Set(existingInSubject.map(a => a.categoryId));

      for (const catId of catIds) {
        if (!coveredCatIds.has(catId)) {
          next.push({
            competitionId,
            categoryId: catId,
            schoolName,
            accessCode: upperCode
          });
        }
      }

      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Regenerate a school's code for a specific subject
  const regenerateSchoolSubjectCode = (schoolName: string, catIds: string[]) => {
    const existingCodes = new Set(allCodesSet);
    const newCode = generateUniqueCode(existingCodes);
    updateSchoolSubjectCode(schoolName, catIds, newCode);
  };

  // Add school to ALL subjects with distinct unique codes across subjects (and shared within mediums)
  const handleAddSchoolToAllSubjects = async () => {
    const trimmed = newSchoolNameModal.trim();
    if (!trimmed || isAddingToAll) return;

    setIsAddingToAll(true);
    try {
      await importSelectedSchools(competitionId, [trimmed]);
      setNewSchoolNameModal("");
      setShowAddToAllModal(false);
      setHasUnsavedChanges(false);
      router.refresh();
    } catch (err: any) {
      alert(`Failed to add school: ${err.message || "Unknown error"}`);
    } finally {
      setIsAddingToAll(false);
    }
  };

  // Delete school from all categories
  const handleDeleteSchoolFromAll = async (schoolName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${schoolName}" and all its access codes across all subjects?`)) {
      return;
    }

    setDeletingSchoolName(schoolName);
    try {
      await deleteSchoolFromAllCategories(competitionId, schoolName);
      setAccesses(prev => prev.filter(a => a.schoolName?.trim().toLowerCase() !== schoolName.trim().toLowerCase()));
      router.refresh();
    } catch (err: any) {
      alert(`Failed to delete school: ${err.message || "Unknown error"}`);
    } finally {
      setDeletingSchoolName(null);
    }
  };

  // Open Sync Modal and load candidates from registration form
  const openSyncModal = async () => {
    if (linkedForms.length === 0) return;
    setShowSyncModal(true);
    setIsLoadingCandidates(true);
    try {
      const data = await getFormSchoolCandidates(competitionId, linkedForms[0].id);
      setCandidates(data);
      
      const pendingSchools = data.filter(c => !c.isAlreadyAdded);
      setSelectedCandidateNames(new Set(pendingSchools.map(c => c.schoolName)));
      setCandidateFilterTab("pending");
    } catch (err: any) {
      alert(`Failed to load registrations: ${err.message || "Unknown error"}`);
      setShowSyncModal(false);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const toggleSelectCandidate = (name: string) => {
    setSelectedCandidateNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const selectAllVisibleCandidates = (names: string[]) => {
    setSelectedCandidateNames(prev => {
      const next = new Set(prev);
      names.forEach(n => next.add(n));
      return next;
    });
  };

  const deselectAllVisibleCandidates = (names: string[]) => {
    setSelectedCandidateNames(prev => {
      const next = new Set(prev);
      names.forEach(n => next.delete(n));
      return next;
    });
  };

  const handleImportSelected = async () => {
    if (selectedCandidateNames.size === 0 || isImporting) return;
    setIsImporting(true);
    try {
      const res = await importSelectedSchools(competitionId, Array.from(selectedCandidateNames));
      setShowSyncModal(false);
      setHasUnsavedChanges(false);
      router.refresh();
    } catch (e: any) {
      alert(`Failed to import schools: ${e.message || "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered candidate list based on active tab ("pending" vs "all")
  const visibleCandidates = useMemo(() => {
    if (candidateFilterTab === "pending") {
      return candidates.filter(c => !c.isAlreadyAdded);
    }
    return candidates;
  }, [candidates, candidateFilterTab]);

  const visibleCandidateNames = useMemo(() => {
    return visibleCandidates.map(c => c.schoolName);
  }, [visibleCandidates]);

  // Save changes across all subjects and schools
  const saveAllChanges = async () => {
    if (duplicateErrors.length > 0) {
      alert(`Cannot save: Duplicate access code issues found:\n- ${duplicateErrors.join("\n- ")}`);
      return;
    }

    setIsSaving(true);
    try {
      await saveSchoolAccesses(competitionId, accesses, null);
      setHasUnsavedChanges(false);
      alert("All access codes saved successfully!");
      router.refresh();
    } catch (e: any) {
      alert(`Failed to save access codes: ${e.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Export codes to clipboard
  const copyCodesToClipboard = () => {
    let text = `=== Quiz Access Codes by Subject ===\n`;
    text += `Note: One code works for all mediums in each subject.\n\n`;

    subjectGroups.forEach(grp => {
      const mediumsText = grp.categories.map(c => parseCategorySubject(c.name).medium || c.name).join(" & ");
      text += `--- ${grp.subject} (${mediumsText}) ---\n`;
      const catIds = new Set(grp.categoryIds);
      const schoolMap = new Map<string, string>();
      for (const a of accesses) {
        if (a.categoryId && catIds.has(a.categoryId)) {
          const sName = a.schoolName?.trim();
          const code = a.accessCode?.trim().toUpperCase();
          if (sName && code && !schoolMap.has(sName)) {
            schoolMap.set(sName, code);
          }
        }
      }
      let idx = 1;
      schoolMap.forEach((code, school) => {
        text += `${idx++}. ${school}: ${code}\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2500);
  };

  // Unique school names across all categories for matrix view
  const allUniqueSchools = useMemo(() => {
    const set = new Set<string>();
    for (const a of accesses) {
      const name = a.schoolName?.trim();
      if (name) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [accesses]);

  // Filter schools by search query
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return allUniqueSchools;
    const q = searchQuery.toLowerCase().trim();
    return allUniqueSchools.filter(s => s.toLowerCase().includes(q));
  }, [allUniqueSchools, searchQuery]);

  // PDF Export State & Handlers
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportSubjectPdf = (grp: SubjectGroup<Category>) => {
    setIsExportingPdf(true);
    setShowExportMenu(false);
    setTimeout(() => {
      try {
        const catIds = new Set(grp.categoryIds);
        const map = new Map<string, string>();
        for (const a of accesses) {
          if (a.categoryId && catIds.has(a.categoryId)) {
            const sName = a.schoolName?.trim();
            const code = a.accessCode?.trim().toUpperCase();
            if (sName && code && !map.has(sName)) {
              map.set(sName, code);
            }
          }
        }
        const rows = Array.from(map.entries())
          .filter(([schoolName]) => !schoolName.toLowerCase().includes("test"))
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([schoolName, accessCode]) => ({ schoolName, accessCode }));

        exportSubjectAccessCodesPdf({
          competitionTitle,
          subjectGroup: grp,
          schoolRows: rows,
        });
      } catch (err: any) {
        alert(`Failed to export PDF: ${err.message || "Unknown error"}`);
      } finally {
        setIsExportingPdf(false);
      }
    }, 50);
  };

  const handleExportMasterPdf = () => {
    setIsExportingPdf(true);
    setShowExportMenu(false);
    setTimeout(() => {
      try {
        const rows = allUniqueSchools.map(schoolName => {
          const codes: Record<string, string> = {};
          subjectGroups.forEach(grp => {
            const catIds = new Set(grp.categoryIds);
            const match = accesses.find(
              a => a.categoryId && catIds.has(a.categoryId) && a.schoolName?.trim().toLowerCase() === schoolName.toLowerCase()
            );
            if (match?.accessCode) {
              codes[grp.subject] = match.accessCode;
            }
          });
          return { schoolName, codes };
        });

        exportMasterAccessCodesPdf({
          competitionTitle,
          subjectGroups,
          schoolRows: rows,
        });
      } catch (err: any) {
        alert(`Failed to export Master PDF: ${err.message || "Unknown error"}`);
      } finally {
        setIsExportingPdf(false);
      }
    }, 50);
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm text-center">
        <h3 className="text-lg font-semibold text-maroon-900 mb-1">No Subjects / Categories Created</h3>
        <p className="text-sm text-gray-500">
          Create at least one subject/category above to configure school access codes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-maroon-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-maroon-900">Subject-Specific School Access Codes</h2>
          <p className="text-xs text-maroon-700/70 mt-0.5">
            Master overview: access codes are shared across all mediums of each subject for each school.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {linkedForms.length > 0 && (
            <button
              type="button"
              onClick={openSyncModal}
              disabled={isImporting}
              className="px-3 py-1.5 bg-maroon-50 text-maroon-800 rounded-lg text-xs font-semibold hover:bg-maroon-100 border border-maroon-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title={`Review and sync registered schools from ${linkedForms[0].title}`}
            >
              <Download className="w-3.5 h-3.5" />
              Sync from Registrations
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddToAllModal(true)}
            className="px-3 py-1.5 bg-maroon-50 text-maroon-800 rounded-lg text-xs font-semibold hover:bg-maroon-100 border border-maroon-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add School to All Subjects
          </button>
          
          <button
            type="button"
            onClick={copyCodesToClipboard}
            className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 border border-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSubject ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSubject ? "Copied!" : "Copy Codes"}
          </button>

          {/* Export PDF Button Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              disabled={isExportingPdf}
              className="px-3 py-1.5 bg-maroon-800 text-white rounded-lg text-xs font-semibold hover:bg-maroon-900 border border-maroon-900 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              title="Export Access Codes as PDF"
            >
              {isExportingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? "Exporting..." : "Export PDF"}</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-30 text-left">
                <button
                  type="button"
                  onClick={handleExportMasterPdf}
                  className="w-full px-3 py-2 text-left text-xs text-maroon-900 font-bold hover:bg-maroon-50 flex items-center gap-2 transition-colors cursor-pointer border-b border-gray-100"
                >
                  <FileText className="w-3.5 h-3.5 text-maroon-700 shrink-0" />
                  <span>Master PDF (All Subjects)</span>
                </button>

                <div className="px-3 py-1 mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Subject-Specific PDFs</p>
                </div>
                {subjectGroups.map(grp => (
                  <button
                    key={grp.subject}
                    type="button"
                    onClick={() => handleExportSubjectPdf(grp)}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-800 hover:bg-maroon-50 hover:text-maroon-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-900">{grp.subject}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save All Changes Button */}
          <button
            type="button"
            onClick={saveAllChanges}
            disabled={isSaving || duplicateErrors.length > 0}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
              hasUnsavedChanges
                ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                : "bg-maroon-900 hover:bg-black text-white"
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{hasUnsavedChanges ? "Save Changes *" : "Save Changes"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Duplicate warning banner */}
      {duplicateErrors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1 text-xs text-red-800">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Duplicate access code conflicts detected:</span>
          </div>
          <ul className="list-disc pl-6 space-y-0.5">
            {duplicateErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Search & Summary Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search school name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-maroon-600 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-maroon-900">{filteredSchools.length}</span> of {allUniqueSchools.length} schools
        </div>
      </div>

      {/* Modal: Add school to all subjects */}
      {showAddToAllModal && (
        <div className="p-4 bg-maroon-50/70 border border-maroon-200 rounded-xl space-y-3">
          <h4 className="text-sm font-bold text-maroon-900">
            Add School to All Subjects Simultaneously
          </h4>
          <p className="text-xs text-maroon-700/80">
            Enter the school name below. It will automatically be added to every subject with a unique, distinct access code generated for each subject (shared across all its mediums).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Royal College, Colombo"
              value={newSchoolNameModal}
              onChange={e => setNewSchoolNameModal(e.target.value)}
              className="flex-1 px-3 py-2 border border-maroon-200 rounded-lg text-sm bg-white"
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSchoolToAllSubjects();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddSchoolToAllSubjects}
              disabled={!newSchoolNameModal.trim() || isAddingToAll}
              className="px-4 py-2 bg-maroon-800 text-white rounded-lg text-xs font-bold hover:bg-maroon-900 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isAddingToAll ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add to All Subjects</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowAddToAllModal(false)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal: Sync schools from registration form */}
      {showSyncModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSyncModal(false);
          }}
        >
          <div 
            data-lenis-prevent="true"
            className="bg-white rounded-2xl shadow-2xl border border-maroon-100 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden overscroll-contain"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-maroon-50/70 to-white">
              <div>
                <h3 className="text-base font-bold text-maroon-900">Sync Schools from Registrations</h3>
                <p className="text-xs text-maroon-700/70">
                  {linkedForms[0]?.title || "Registration Form"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {isLoadingCandidates ? (
              <div className="p-12 text-center text-maroon-700 space-y-3">
                <div className="w-8 h-8 border-3 border-maroon-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium">Scanning registration form for schools...</p>
              </div>
            ) : (
              <>
                {/* Tabs & Search Toolbar */}
                <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setCandidateFilterTab("pending")}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          candidateFilterTab === "pending"
                            ? "bg-white text-maroon-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <span>Pending to Add</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          candidateFilterTab === "pending" ? "bg-maroon-100 text-maroon-900" : "bg-gray-300 text-gray-700"
                        }`}>
                          {candidates.filter(c => !c.isAlreadyAdded).length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCandidateFilterTab("all")}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                          candidateFilterTab === "all"
                            ? "bg-white text-maroon-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <span>All Registered</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          candidateFilterTab === "all" ? "bg-maroon-100 text-maroon-900" : "bg-gray-300 text-gray-700"
                        }`}>
                          {candidates.length}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => selectAllVisibleCandidates(visibleCandidateNames)}
                        className="text-maroon-800 hover:underline font-semibold cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        type="button"
                        onClick={() => deselectAllVisibleCandidates(visibleCandidateNames)}
                        className="text-gray-600 hover:underline font-medium cursor-pointer"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Candidates List */}
                <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
                  {visibleCandidates.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      {candidateFilterTab === "pending" 
                        ? "All registered schools have already been added!" 
                        : "No school submissions found in this form."}
                    </div>
                  ) : (
                    visibleCandidates.map(c => {
                      const isSelected = selectedCandidateNames.has(c.schoolName);
                      return (
                        <label 
                          key={c.schoolName}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-maroon-50/50 border-maroon-300 shadow-xs" 
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCandidate(c.schoolName)}
                            className="mt-1 rounded text-maroon-800 focus:ring-maroon-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-gray-900 truncate">
                                {c.schoolName}
                              </span>
                              {c.isAlreadyAdded ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                  Already Added
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                  Pending to Add
                                </span>
                              )}
                            </div>
                            {c.submitterEmail && (
                              <div className="text-xs text-gray-500 mt-1">
                                <span>{c.submitterEmail}</span>
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSyncModal(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleImportSelected}
                      disabled={selectedCandidateNames.size === 0 || isImporting}
                      className="px-4 py-2 bg-maroon-800 hover:bg-maroon-900 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Adding Schools...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add {selectedCandidateNames.size} Selected School{selectedCandidateNames.size === 1 ? "" : "s"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Master Overview Matrix Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-maroon-900 text-white font-semibold">
              <th className="p-3 w-12 text-center border-r border-maroon-800">#</th>
              <th className="p-3 border-r border-maroon-800 min-w-[220px]">School Name</th>
              {subjectGroups.map(grp => {
                const mediums = grp.categories.map(c => parseCategorySubject(c.name).medium || c.name);
                return (
                  <th key={grp.subject} className="p-3 border-r border-maroon-800 text-center min-w-[150px]">
                    <div className="font-bold text-xs">{grp.subject}</div>
                    <div className="text-[10px] font-normal text-maroon-200 mt-0.5">
                      {mediums.join(" / ")}
                    </div>
                  </th>
                );
              })}
              <th className="p-3 text-right w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSchools.length === 0 ? (
              <tr>
                <td colSpan={subjectGroups.length + 3} className="p-8 text-center text-gray-400">
                  {searchQuery ? `No schools match "${searchQuery}".` : "No schools configured yet. Click 'Add School to All Subjects' or 'Sync from Registrations' above."}
                </td>
              </tr>
            ) : (
              filteredSchools.map((schoolName, idx) => (
                <tr key={schoolName} className="hover:bg-maroon-50/30 transition-colors">
                  <td className="p-3 text-center text-xs text-gray-400 font-mono border-r border-gray-200">
                    {idx + 1}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 border-r border-gray-200">
                    {schoolName}
                  </td>
                  {subjectGroups.map(grp => {
                    const catIds = new Set(grp.categoryIds);
                    const match = accesses.find(
                      a => a.categoryId && catIds.has(a.categoryId) && a.schoolName?.trim().toLowerCase() === schoolName.toLowerCase()
                    );
                    const code = match?.accessCode?.toUpperCase() || "";
                    const isDup = code && duplicateErrors.some(e => e.includes(`"${code}"`));

                    return (
                      <td key={grp.subject} className="p-2.5 text-center border-r border-gray-200">
                        <div className="inline-flex items-center gap-1 justify-center">
                          <input
                            type="text"
                            value={code}
                            placeholder="—"
                            onChange={e => updateSchoolSubjectCode(schoolName, grp.categoryIds, e.target.value)}
                            className={`w-24 px-2 py-1 text-center font-mono font-bold text-xs uppercase border rounded-lg transition-colors ${
                              isDup 
                                ? "border-red-400 bg-red-50 text-red-900" 
                                : code 
                                  ? "border-maroon-200 bg-maroon-50/60 text-maroon-900 focus:bg-white focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600 focus:outline-none" 
                                  : "border-gray-200 bg-gray-50 text-gray-400 focus:bg-white focus:border-maroon-600 focus:outline-none"
                            }`}
                          />
                          <button
                            type="button"
                            title={`Regenerate unique code for ${grp.subject}`}
                            onClick={() => regenerateSchoolSubjectCode(schoolName, grp.categoryIds)}
                            className="p-1.5 text-gray-400 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteSchoolFromAll(schoolName)}
                      disabled={deletingSchoolName === schoolName}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
                      title={`Delete "${schoolName}" from all subjects`}
                    >
                      {deletingSchoolName === schoolName ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowAddToAllModal(true)}
          className="px-4 py-2 border-2 border-dashed border-maroon-300 text-maroon-800 rounded-xl hover:bg-maroon-50 text-xs font-bold flex items-center gap-2 w-full sm:w-auto justify-center transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Another School
        </button>

        <button
          type="button"
          onClick={saveAllChanges}
          disabled={isSaving || duplicateErrors.length > 0}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all w-full sm:w-auto cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
            hasUnsavedChanges
              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 animate-pulse"
              : "bg-maroon-800 hover:bg-maroon-900 text-white shadow-maroon-800/20"
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{hasUnsavedChanges ? "Save All Changes *" : "Save All Changes"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
