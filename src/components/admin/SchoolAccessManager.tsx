"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  saveSchoolAccesses, 
  importSchoolsFromForm, 
  getFormSchoolCandidates, 
  importSelectedSchools, 
  deleteSchoolFromAllCategories,
  RegisteredSchoolCandidate 
} from "@/app/admin/competitions/[id]/quizzes/actions";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Copy, 
  RotateCw, 
  Check, 
  AlertCircle, 
  Sparkles,
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

  // If a specific categoryId was passed (e.g. from category edit page), lock or default to it
  const defaultTab = selectedCategoryId || "overview";
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

  // Helper to generate a unique random code that doesn't conflict with existing codes in the competition
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

  // Check for duplicate codes across the entire competition
  const duplicateCodes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of accesses) {
      const code = a.accessCode?.trim().toUpperCase();
      if (code) {
        counts.set(code, (counts.get(code) || 0) + 1);
      }
    }
    const duplicates = new Set<string>();
    counts.forEach((count, code) => {
      if (count > 1) duplicates.add(code);
    });
    return duplicates;
  }, [accesses]);

  // Add school to currently active subject
  const addSchoolToCurrentSubject = () => {
    if (activeTab === "overview") return;
    const existingCodes = new Set(allCodesSet);
    const newCode = generateUniqueCode(existingCodes);

    setAccesses(prev => [
      ...prev,
      {
        competitionId,
        categoryId: activeTab,
        schoolName: "",
        accessCode: newCode
      }
    ]);
  };

  // Add school to ALL subjects with distinct unique codes and persist directly to DB
  const handleAddSchoolToAllSubjects = async () => {
    const trimmed = newSchoolNameModal.trim();
    if (!trimmed || isAddingToAll) return;

    setIsAddingToAll(true);
    try {
      const res = await importSelectedSchools(competitionId, [trimmed]);
      alert(`Successfully added "${trimmed}" to all subjects!`);
      setNewSchoolNameModal("");
      setShowAddToAllModal(false);
      router.refresh();
    } catch (err: any) {
      alert(`Failed to add school: ${err.message || "Unknown error"}`);
    } finally {
      setIsAddingToAll(false);
    }
  };

  // Copy schools from another subject to current subject
  const copySchoolsFromSubject = (sourceCategoryId: string) => {
    if (!sourceCategoryId || activeTab === "overview") return;
    
    const sourceSchools = accesses.filter(a => a.categoryId === sourceCategoryId);
    if (sourceSchools.length === 0) {
      alert("Selected source subject has no schools to copy.");
      return;
    }

    const currentSchoolNames = new Set(
      accesses
        .filter(a => a.categoryId === activeTab)
        .map(a => a.schoolName.trim().toLowerCase())
    );

    const existingCodes = new Set(allCodesSet);
    const toAdd: SchoolAccess[] = [];

    for (const src of sourceSchools) {
      const name = src.schoolName.trim();
      if (!name) continue;
      // If not already in current subject
      if (!currentSchoolNames.has(name.toLowerCase())) {
        toAdd.push({
          competitionId,
          categoryId: activeTab,
          schoolName: name,
          accessCode: generateUniqueCode(existingCodes)
        });
      }
    }

    if (toAdd.length === 0) {
      alert("All schools from the source subject are already present in this subject.");
      return;
    }

    setAccesses(prev => [...prev, ...toAdd]);
  };

  const updateAccessField = (targetIndex: number, field: keyof SchoolAccess, value: string) => {
    setAccesses(prev => {
      const copy = [...prev];
      copy[targetIndex] = {
        ...copy[targetIndex],
        [field]: field === "accessCode" ? value.toUpperCase() : value
      };
      return copy;
    });
  };

  const regenerateCode = (targetIndex: number) => {
    const existingCodes = new Set(allCodesSet);
    // Remove the current code so we don't consider it
    const currentCode = accesses[targetIndex]?.accessCode?.trim().toUpperCase();
    if (currentCode) existingCodes.delete(currentCode);

    const newCode = generateUniqueCode(existingCodes);
    updateAccessField(targetIndex, "accessCode", newCode);
  };

  const removeAccess = (targetIndex: number) => {
    setAccesses(prev => prev.filter((_, i) => i !== targetIndex));
  };

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
  const saveCurrentAccesses = async (onlyCurrentCategory: boolean = true) => {
    if (duplicateCodes.size > 0) {
      alert(`Cannot save: Duplicate access codes found (${Array.from(duplicateCodes).join(", ")}). Each code must be unique across all subjects.`);
      return;
    }

    setIsSaving(true);
    try {
      if (onlyCurrentCategory && activeTab !== "overview") {
        const catAccesses = accesses.filter(a => a.categoryId === activeTab);
        await saveSchoolAccesses(competitionId, catAccesses, activeTab);
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
  const copySubjectCodesToClipboard = (catId?: string) => {
    const targetCatId = catId || (activeTab !== "overview" ? activeTab : null);
    let text = "";

    if (targetCatId) {
      const cat = categories.find(c => c.id === targetCatId);
      const catAccesses = accesses.filter(a => a.categoryId === targetCatId);
      text = `=== ${cat?.name || "Subject"} Quiz Access Codes ===\n\n`;
      catAccesses.forEach((a, i) => {
        text += `${i + 1}. ${a.schoolName || "Unnamed School"}: ${a.accessCode}\n`;
      });
    } else {
      text = `=== All Quiz Access Codes by Subject ===\n\n`;
      categories.forEach(cat => {
        text += `--- ${cat.name} ---\n`;
        const catAccesses = accesses.filter(a => a.categoryId === cat.id);
        catAccesses.forEach((a, i) => {
          text += `${i + 1}. ${a.schoolName || "Unnamed School"}: ${a.accessCode}\n`;
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

  const activeCategory = categories.find(c => c.id === activeTab);
  const activeCategoryAccesses = accesses
    .map((a, originalIndex) => ({ a, originalIndex }))
    .filter(item => item.a.categoryId === activeTab);

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
              className="px-3 py-1.5 bg-maroon-50 text-maroon-800 rounded-lg text-xs font-semibold hover:bg-maroon-100 border border-maroon-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title={`Review and sync registered schools from ${linkedForms[0].title}`}
            >
              <Download className="w-3.5 h-3.5" />
              Sync from Registrations
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddToAllModal(true)}
            className="px-3 py-1.5 bg-maroon-50 text-maroon-800 rounded-lg text-xs font-semibold hover:bg-maroon-100 border border-maroon-200 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add School to All Subjects
          </button>
          
          <button
            type="button"
            onClick={() => copySubjectCodesToClipboard()}
            className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 border border-gray-200 flex items-center gap-1.5 transition-colors"
          >
            {copiedSubject ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSubject ? "Copied to Clipboard!" : "Copy Codes"}
          </button>
        </div>
      </div>

      {/* Duplicate warning banner */}
      {duplicateCodes.size > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            <strong>Warning:</strong> Duplicate access codes detected: {Array.from(duplicateCodes).join(", ")}. Every subject and school must have a unique code.
          </span>
        </div>
      )}

      {/* Modal: Add school to all subjects */}
      {showAddToAllModal && (
        <div className="p-4 bg-maroon-50/70 border border-maroon-200 rounded-xl space-y-3">
          <h4 className="text-sm font-bold text-maroon-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-maroon-600" />
            Add School to All Subjects Simultaneously
          </h4>
          <p className="text-xs text-maroon-700/80">
            Enter the school name below. It will automatically be added to every subject with a unique, distinct access code generated for each subject.
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
              className="px-4 py-2 bg-maroon-800 text-white rounded-lg text-xs font-bold hover:bg-maroon-900 disabled:opacity-50 flex items-center gap-1.5"
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
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
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
                        Uncheck All
                      </button>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs font-bold text-maroon-900 bg-maroon-100 px-2 py-0.5 rounded-md">
                        {selectedCandidateNames.size} selected
                      </span>
                    </div>
                  </div>
                </div>

                {/* Candidate list */}
                <div 
                  data-lenis-prevent="true"
                  className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 overscroll-contain"
                >
                  {visibleCandidates.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">
                      {candidateFilterTab === "pending"
                        ? "No pending schools found. All registered schools have already been added to quizzes!"
                        : "No registered schools found."}
                    </div>
                  ) : (
                    visibleCandidates.map(c => {
                      const isChecked = selectedCandidateNames.has(c.schoolName);
                      return (
                        <label
                          key={c.schoolName}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? "bg-maroon-50/40 border-maroon-200 shadow-xs"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectCandidate(c.schoolName)}
                            className="mt-1 w-4 h-4 text-maroon-800 rounded border-gray-300 focus:ring-maroon-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-bold text-gray-900 leading-tight">
                                {c.schoolName}
                              </span>
                              {c.isAlreadyAdded ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                  Already in Quizzes
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
      {!selectedCategoryId && (
        <div className="flex items-center gap-2 flex-wrap border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center ${
              activeTab === "overview"
                ? "bg-maroon-800 text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-maroon-50 hover:text-maroon-800 border border-gray-200"
            }`}
          >
            <span>All Subjects</span>
          </button>

          {categories.map(cat => {
            const count = accesses.filter(a => a.categoryId === cat.id).length;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  isActive 
                    ? "bg-maroon-800 text-white shadow-sm" 
                    : "bg-gray-50 text-gray-600 hover:bg-maroon-50 hover:text-maroon-800 border border-gray-200"
                }`}
              >
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-maroon-700 text-white" : "bg-gray-200 text-gray-700"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Subject Table View */}
      {activeTab !== "overview" && activeCategory && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-maroon-50/50 p-3 rounded-lg border border-maroon-100">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-maroon-700">Active Subject</span>
              <h3 className="text-base font-bold text-maroon-900">{activeCategory.name}</h3>
            </div>

            {/* Quick Actions for this subject */}
            <div className="flex items-center gap-2 flex-wrap">
              {categories.filter(c => c.id !== activeTab).length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">Copy schools from:</span>
                  <select
                    className="px-2 py-1 bg-white border border-maroon-200 rounded-lg text-xs font-medium text-maroon-800"
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        copySchoolsFromSubject(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>Select Subject...</option>
                    {categories.filter(c => c.id !== activeTab).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-maroon-50 text-maroon-900 text-xs font-semibold border-b border-maroon-200">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">School Name</th>
                  <th className="p-3 w-64">Access Code for {activeCategory.name}</th>
                  <th className="p-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeCategoryAccesses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8 text-sm">
                      No schools configured for {activeCategory.name} yet. Click "+ Add School" below to get started.
                    </td>
                  </tr>
                ) : (
                  activeCategoryAccesses.map(({ a, originalIndex }, idx) => {
                    const isDup = a.accessCode && duplicateCodes.has(a.accessCode.trim().toUpperCase());
                    return (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3 text-center text-xs text-gray-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="School name (e.g. Nalanda College)"
                            value={a.schoolName}
                            onChange={e => updateAccessField(originalIndex, "schoolName", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-maroon-500 focus:ring-1 focus:ring-maroon-500"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={a.accessCode}
                              onChange={e => updateAccessField(originalIndex, "accessCode", e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg text-sm font-mono tracking-wider uppercase font-bold ${
                                isDup 
                                  ? "border-red-400 bg-red-50 text-red-900" 
                                  : "border-gray-300 text-maroon-900 bg-white"
                              }`}
                            />
                            <button
                              type="button"
                              title="Regenerate random unique code"
                              onClick={() => regenerateCode(originalIndex)}
                              className="p-2 text-gray-500 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg border border-gray-200 transition-colors"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeAccess(originalIndex)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove school"
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
              className="px-4 py-2 border-2 border-dashed border-maroon-300 text-maroon-800 rounded-xl hover:bg-maroon-50 text-xs font-bold flex items-center gap-2 w-full sm:w-auto justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add School to {activeCategory.name}
            </button>

            <button
              type="button"
              onClick={() => saveCurrentAccesses(true)}
              disabled={isSaving || duplicateCodes.size > 0}
              className="px-6 py-2.5 bg-maroon-800 text-white rounded-xl hover:bg-maroon-900 text-sm font-bold shadow-md shadow-maroon-800/20 disabled:opacity-50 w-full sm:w-auto"
            >
              {isSaving ? "Saving..." : `Save ${activeCategory.name} Codes`}
            </button>
          </div>
        </div>
      )}

      {/* All Subjects Overview Matrix */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-maroon-900 text-white font-semibold">
                  <th className="p-3 border-r border-maroon-800 min-w-[200px]">School Name</th>
                  {categories.map(cat => (
                    <th key={cat.id} className="p-3 border-r border-maroon-800 text-center min-w-[120px]">
                      {cat.name}
                    </th>
                  ))}
                  <th className="p-3 text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allUniqueSchools.length === 0 ? (
                  <tr>
                    <td colSpan={categories.length + 2} className="p-8 text-center text-gray-400">
                      No schools configured yet. Add schools via any subject tab above.
                    </td>
                  </tr>
                ) : (
                  allUniqueSchools.map((schoolName, idx) => (
                    <tr key={idx} className="hover:bg-maroon-50/30 transition-colors">
                      <td className="p-3 font-semibold text-gray-900 border-r border-gray-200">
                        {schoolName}
                      </td>
                      {categories.map(cat => {
                        const match = accesses.find(
                          a => a.categoryId === cat.id && a.schoolName?.trim().toLowerCase() === schoolName.toLowerCase()
                        );
                        return (
                          <td key={cat.id} className="p-3 text-center border-r border-gray-200 font-mono">
                            {match ? (
                              <span className="px-2 py-1 bg-maroon-50 text-maroon-900 rounded font-bold border border-maroon-200 tracking-wider">
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
