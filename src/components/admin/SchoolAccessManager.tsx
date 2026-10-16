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
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Copy, 
  RotateCw, 
  Check, 
  AlertCircle, 
  Download,
  X
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

interface SchoolSubjectRow {
  schoolName: string;
  accessCode: string;
  accessIds: (string | undefined)[];
}

export function SchoolAccessManager({ 
  competitionId, 
  categories = [], 
  initialAccesses = [],
  selectedCategoryId,
  linkedForms = []
}: { 
  competitionId: string;
  categories: Category[];
  initialAccesses: any[];
  selectedCategoryId?: string;
  linkedForms?: { id: string; title: string }[];
}) {
  const router = useRouter();

  const subjectGroups = useMemo(() => {
    return groupCategoriesBySubject(categories);
  }, [categories]);

  // If a specific categoryId was passed (e.g. from category edit page), map to its subject
  const defaultTab = useMemo(() => {
    if (selectedCategoryId) {
      const match = subjectGroups.find(g => g.categoryIds.includes(selectedCategoryId));
      return match ? match.subject : "overview";
    }
    return "overview";
  }, [selectedCategoryId, subjectGroups]);

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

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
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingToAll, setIsAddingToAll] = useState(false);
  const [deletingSchoolName, setDeletingSchoolName] = useState<string | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [newSchoolNameModal, setNewSchoolNameModal] = useState("");
  const [showAddToAllModal, setShowAddToAllModal] = useState(false);

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

  // Active Subject Group
  const activeSubjectGroup = useMemo(() => {
    if (activeTab === "overview") return null;
    return subjectGroups.find(g => g.subject.toLowerCase() === activeTab.toLowerCase()) || null;
  }, [activeTab, subjectGroups]);

  // Aggregate rows for the active subject group (one row per school)
  const activeSubjectSchoolRows = useMemo((): SchoolSubjectRow[] => {
    if (!activeSubjectGroup) return [];
    const catIds = new Set(activeSubjectGroup.categoryIds);
    const map = new Map<string, { schoolName: string; accessCode: string; accessIds: (string | undefined)[] }>();

    for (const a of accesses) {
      if (a.categoryId && catIds.has(a.categoryId)) {
        const sName = a.schoolName?.trim();
        if (!sName) continue;
        const key = sName.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            schoolName: sName,
            accessCode: a.accessCode?.trim().toUpperCase() || "",
            accessIds: [a.id]
          });
        } else {
          const entry = map.get(key)!;
          if (a.id) entry.accessIds.push(a.id);
          // If code was missing in first row, populate it
          if (!entry.accessCode && a.accessCode) {
            entry.accessCode = a.accessCode.trim().toUpperCase();
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.schoolName.localeCompare(b.schoolName));
  }, [activeSubjectGroup, accesses]);

  // Update a school's code for the active subject (applies across all mediums of this subject)
  const updateSchoolSubjectCode = (schoolName: string, newCode: string) => {
    if (!activeSubjectGroup) return;
    const catIds = activeSubjectGroup.categoryIds;
    const upperCode = newCode.toUpperCase();
    const schoolLower = schoolName.trim().toLowerCase();

    setAccesses(prev => {
      // 1. Update existing matching entries for this school & subject categories
      let updatedAny = false;
      const next = prev.map(a => {
        if (a.categoryId && catIds.includes(a.categoryId) && a.schoolName?.trim().toLowerCase() === schoolLower) {
          updatedAny = true;
          return { ...a, accessCode: upperCode };
        }
        return a;
      });

      // 2. If any category in this subject didn't have an entry for this school, add it
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
  };

  // Regenerate a school's code for the active subject
  const regenerateSchoolSubjectCode = (schoolName: string) => {
    const existingCodes = new Set(allCodesSet);
    const newCode = generateUniqueCode(existingCodes);
    updateSchoolSubjectCode(schoolName, newCode);
  };

  // Add a new school to the active subject (adds across all mediums of this subject)
  const addSchoolToCurrentSubject = () => {
    if (!activeSubjectGroup) return;
    const existingCodes = new Set(allCodesSet);
    const newCode = generateUniqueCode(existingCodes);

    const newEntries: SchoolAccess[] = activeSubjectGroup.categoryIds.map(catId => ({
      competitionId,
      categoryId: catId,
      schoolName: "",
      accessCode: newCode
    }));

    setAccesses(prev => [...prev, ...newEntries]);
  };

  // Remove a school completely from the active subject
  const removeSchoolFromCurrentSubject = (schoolName: string) => {
    if (!activeSubjectGroup) return;
    const catIds = new Set(activeSubjectGroup.categoryIds);
    const schoolLower = schoolName.trim().toLowerCase();

    setAccesses(prev =>
      prev.filter(a => !(a.categoryId && catIds.has(a.categoryId) && a.schoolName?.trim().toLowerCase() === schoolLower))
    );
  };

  // Add school to ALL subjects with distinct unique codes across subjects (and shared within mediums)
  const handleAddSchoolToAllSubjects = async () => {
    const trimmed = newSchoolNameModal.trim();
    if (!trimmed || isAddingToAll) return;

    setIsAddingToAll(true);
    try {
      await importSelectedSchools(competitionId, [trimmed]);
      alert(`Successfully added "${trimmed}" to all subjects with unified medium codes!`);
      setNewSchoolNameModal("");
      setShowAddToAllModal(false);
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
      alert(`Successfully added ${res.count} school entries across all subjects!`);
      setShowSyncModal(false);
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

  // Save changes
  const saveCurrentAccesses = async (onlyCurrentSubject: boolean = true) => {
    if (duplicateErrors.length > 0) {
      alert(`Cannot save: Duplicate access code issues found:\n- ${duplicateErrors.join("\n- ")}`);
      return;
    }

    setIsSaving(true);
    try {
      if (onlyCurrentSubject && activeSubjectGroup) {
        const catIds = new Set(activeSubjectGroup.categoryIds);
        const subAccesses = accesses.filter(a => a.categoryId && catIds.has(a.categoryId));
        await saveSchoolAccesses(competitionId, subAccesses, activeSubjectGroup.categoryIds[0]);
      } else {
        await saveSchoolAccesses(competitionId, accesses, null);
      }
      alert("Access codes saved successfully!");
      router.refresh();
    } catch (e: any) {
      alert(`Failed to save access codes: ${e.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Export codes to clipboard
  const copyCodesToClipboard = (subjectName?: string) => {
    let text = "";

    if (subjectName && subjectName !== "overview") {
      const grp = subjectGroups.find(g => g.subject.toLowerCase() === subjectName.toLowerCase());
      if (grp) {
        const mediumsText = grp.categories.map(c => parseCategorySubject(c.name).medium || c.name).join(" & ");
        text = `=== ${grp.subject} Quiz Access Codes ===\n`;
        text += `Note: Each code works for all mediums (${mediumsText})\n\n`;

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
      }
    } else {
      text = `=== Quiz Access Codes by Subject ===\n`;
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
    }

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

  if (categories.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm text-center">
        <h3 className="text-lg font-semibold text-maroon-900 mb-1">No Subjects / Categories Created</h3>
        <p className="text-sm text-gray-500">
          Create at least one subject/category above to configure subject-specific school access codes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-maroon-100 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-maroon-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-maroon-900">Subject-Specific School Access Codes</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={() => copyCodesToClipboard(activeTab)}
            className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 border border-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedSubject ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSubject ? "Copied to Clipboard!" : "Copy Codes"}
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

      {/* Subject Tabs */}
      <div className="flex items-center gap-2 flex-wrap border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center cursor-pointer ${
            activeTab === "overview"
              ? "bg-maroon-800 text-white shadow-sm"
              : "bg-gray-50 text-gray-600 hover:bg-maroon-50 hover:text-maroon-800 border border-gray-200"
          }`}
        >
          <span>All</span>
        </button>

        {subjectGroups.map(grp => {
          const catIds = new Set(grp.categoryIds);
          // Count unique schools in this subject
          const schoolSet = new Set<string>();
          for (const a of accesses) {
            if (a.categoryId && catIds.has(a.categoryId) && a.schoolName?.trim()) {
              schoolSet.add(a.schoolName.trim().toLowerCase());
            }
          }
          const count = schoolSet.size;
          const isActive = activeTab.toLowerCase() === grp.subject.toLowerCase();
          const mediumsText = grp.categories.map(c => parseCategorySubject(c.name).medium || c.name).join(", ");

          return (
            <button
              key={grp.subject}
              type="button"
              onClick={() => setActiveTab(grp.subject)}
              title={`Manage ${grp.subject} access codes (${mediumsText})`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isActive 
                  ? "bg-maroon-800 text-white shadow-sm" 
                  : "bg-gray-50 text-gray-600 hover:bg-maroon-50 hover:text-maroon-800 border border-gray-200"
              }`}
            >
              <span>{grp.subject}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-maroon-700 text-white" : "bg-gray-200 text-gray-700"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Subject Table View */}
      {activeTab !== "overview" && activeSubjectGroup && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-maroon-50/50 p-4 rounded-xl border border-maroon-100">
            <div>
              <h3 className="text-lg font-bold text-maroon-900">{activeSubjectGroup.subject}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyCodesToClipboard(activeSubjectGroup.subject)}
                className="px-3 py-1.5 bg-white text-maroon-800 rounded-lg text-xs font-semibold hover:bg-maroon-100/50 border border-maroon-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSubject ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy {activeSubjectGroup.subject} Codes</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-maroon-50 text-maroon-900 text-xs font-semibold border-b border-maroon-200">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">School Name</th>
                  <th className="p-3 w-72">
                    Access Code for {activeSubjectGroup.subject}
                    <span className="block text-[10px] font-normal text-maroon-600">
                      Shared across all mediums
                    </span>
                  </th>
                  <th className="p-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeSubjectSchoolRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8 text-sm">
                      No schools configured for {activeSubjectGroup.subject} yet. Click "+ Add School" below to get started.
                    </td>
                  </tr>
                ) : (
                  activeSubjectSchoolRows.map((row, idx) => {
                    const isDup = duplicateErrors.some(e => e.includes(`"${row.accessCode}"`));
                    return (
                      <tr key={row.schoolName || idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3 text-center text-xs text-gray-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-medium text-gray-900 text-sm">
                          {row.schoolName || (
                            <span className="italic text-gray-400">Unnamed School</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={row.accessCode}
                              onChange={e => updateSchoolSubjectCode(row.schoolName, e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono tracking-wider uppercase font-bold ${
                                isDup 
                                  ? "border-red-400 bg-red-50 text-red-900" 
                                  : "border-gray-300 text-maroon-900 bg-white"
                              }`}
                            />
                            <button
                              type="button"
                              title="Regenerate random unique code"
                              onClick={() => regenerateSchoolSubjectCode(row.schoolName)}
                              className="p-2 text-gray-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeSchoolFromCurrentSubject(row.schoolName)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title={`Remove from ${activeSubjectGroup.subject}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3">
            <button
              type="button"
              onClick={addSchoolToCurrentSubject}
              className="px-4 py-2 border-2 border-dashed border-maroon-300 text-maroon-800 rounded-xl hover:bg-maroon-50 text-xs font-bold flex items-center gap-2 w-full sm:w-auto justify-center transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add School to {activeSubjectGroup.subject}
            </button>

            <button
              type="button"
              onClick={() => saveCurrentAccesses(true)}
              disabled={isSaving || duplicateErrors.length > 0}
              className="px-6 py-2.5 bg-maroon-800 text-white rounded-xl hover:bg-maroon-900 text-sm font-bold shadow-md shadow-maroon-800/20 disabled:opacity-50 w-full sm:w-auto cursor-pointer"
            >
              {isSaving ? "Saving..." : `Save ${activeSubjectGroup.subject} Codes`}
            </button>
          </div>
        </div>
      )}

      {/* All Subjects Overview Matrix */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-maroon-900 text-white font-semibold">
                  <th className="p-3 border-r border-maroon-800 min-w-[200px]">School Name</th>
                  {subjectGroups.map(grp => {
                    const mediums = grp.categories.map(c => parseCategorySubject(c.name).medium || c.name);
                    return (
                      <th key={grp.subject} className="p-3 border-r border-maroon-800 text-center min-w-[130px]">
                        <div>{grp.subject}</div>
                        <div className="text-[10px] font-normal text-maroon-200 mt-0.5">
                          {mediums.join(" / ")}
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allUniqueSchools.length === 0 ? (
                  <tr>
                    <td colSpan={subjectGroups.length + 2} className="p-8 text-center text-gray-400">
                      No schools configured yet. Add schools via any subject tab above or click "Sync from Registrations".
                    </td>
                  </tr>
                ) : (
                  allUniqueSchools.map((schoolName, idx) => (
                    <tr key={idx} className="hover:bg-maroon-50/30 transition-colors">
                      <td className="p-3 font-semibold text-gray-900 border-r border-gray-200">
                        {schoolName}
                      </td>
                      {subjectGroups.map(grp => {
                        const catIds = new Set(grp.categoryIds);
                        const match = accesses.find(
                          a => a.categoryId && catIds.has(a.categoryId) && a.schoolName?.trim().toLowerCase() === schoolName.toLowerCase()
                        );
                        return (
                          <td key={grp.subject} className="p-3 text-center border-r border-gray-200 font-mono">
                            {match?.accessCode ? (
                              <span className="inline-flex items-center px-2.5 py-1 bg-maroon-50 text-maroon-900 rounded-md font-bold border border-maroon-200 tracking-wider">
                                {match.accessCode}
                              </span>
                            ) : (
                              <span className="text-gray-300 italic text-[11px]">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSchoolFromAll(schoolName)}
                          disabled={deletingSchoolName === schoolName}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
                          title={`Delete ${schoolName} from all subjects`}
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
        </div>
      )}
    </div>
  );
}
