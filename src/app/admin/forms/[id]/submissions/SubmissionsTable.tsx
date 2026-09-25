"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { deleteSubmission } from "../../../form-actions";

export default function SubmissionsTable({ fields, submissions, formId }: { fields: any[], submissions: any[], formId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const previewFields = fields.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-maroon-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-maroon-50/50 border-b border-maroon-100">
              <th className="p-4 font-semibold text-maroon-900 whitespace-nowrap">Date</th>
              <th className="p-4 font-semibold text-maroon-900 whitespace-nowrap">Submitter Email</th>
              {previewFields.map(f => (
                <th key={f.id} className="p-4 font-semibold text-maroon-900 whitespace-nowrap">{f.displayLabel}</th>
              ))}
              <th className="p-4 font-semibold text-maroon-900 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={previewFields.length + 3} className="p-8 text-center text-maroon-400">
                  No submissions yet.
                </td>
              </tr>
            ) : submissions.map((sub) => {
              const data = typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data;
              const isExpanded = expandedId === sub.id;
              
              return (
                <React.Fragment key={sub.id}>
                  <tr 
                    className={`border-b border-maroon-50 transition-colors cursor-pointer ${isExpanded ? 'bg-maroon-50/30' : 'hover:bg-maroon-50/50'}`}
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  >
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {sub.submitterEmail}
                    </td>
                    {previewFields.map(f => {
                      const val = data[f.id];
                      return (
                        <td key={f.id} className="p-4 text-gray-800 max-w-xs truncate">
                          {f.type === 'FILE' && val ? "File(s) uploaded" : String(val || '')}
                        </td>
                      );
                    })}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this submission? This cannot be undone.")) {
                              deleteSubmission(formId, sub.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete Submission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button> */}
                        <button className="text-maroon-600 hover:text-maroon-800 p-2 hover:bg-maroon-100 rounded-full transition-colors flex items-center justify-center">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-gray-50/80 border-b border-maroon-100">
                      <td colSpan={previewFields.length + 3} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {fields.slice(3).map(f => {
                            const val = data[f.id];
                            return (
                              <div key={f.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <p className="text-xs text-gray-500 font-medium mb-1">{f.displayLabel}</p>
                                <div className="text-sm font-semibold text-gray-900 break-words">
                                  {f.type === 'FILE' && val ? (
                                    Array.isArray(val) ? (
                                      <div className="flex flex-col gap-1">
                                        {val.map((url: string, i: number) => (
                                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-maroon-600 hover:underline">
                                            View File {i + 1}
                                          </a>
                                        ))}
                                      </div>
                                    ) : (
                                      <a href={val} target="_blank" rel="noopener noreferrer" className="text-maroon-600 hover:underline">View File</a>
                                    )
                                  ) : (
                                    String(val || '-')
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
