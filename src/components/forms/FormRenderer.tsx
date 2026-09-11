"use client";

import { useState, useRef } from "react";
import { submitPublicForm } from "@/app/form-submit-action";
import { Upload, X, File as FileIcon, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export function FormRenderer({ form, fields }: { form: any, fields: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      
      // Override file inputs in formData with our tracked selectedFiles state
      fields.forEach(field => {
        if (field.type === 'FILE') {
          formData.delete(field.id);
          formData.delete(`${field.id}[]`);
          const files = selectedFiles[field.id] || [];
          files.forEach(file => {
            formData.append(field.id, file); // Always append to the same base field.id
          });
        }
      });

      await submitPublicForm(form.id, formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="bg-maroon-50 text-maroon-800 p-8 rounded-xl text-center shadow-sm border border-maroon-100">
        <h3 className="text-2xl font-bold mb-2">Submitted Successfully!</h3>
        <p>Thank you for submitting <strong>{form.title}</strong>.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{form.title}</h2>
        {form.description && <p className="text-gray-600">{form.description}</p>}
      </div>

      {error && (
        <div className="bg-maroon-50 text-maroon-700 p-4 rounded-lg mb-6 text-sm font-medium border border-maroon-100">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Built-in mandatory email field */}
        <div className="flex flex-col gap-1.5 p-4 bg-maroon-50/50 border border-maroon-100 rounded-xl mb-6">
          <label className="font-medium text-maroon-900 text-sm">
            Email Address <span className="text-maroon-700">*</span>
          </label>
          <input 
            type="email" 
            name="__system_email" 
            required 
            placeholder="you@example.com" 
            className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-shadow outline-none bg-white" 
          />
          <p className="text-xs text-maroon-700/70 mt-1">
            {form.limitOnePerEmail 
              ? "This form is limited to 1 response per email." 
              : "" }
          </p>
        </div>

        {fields.map(field => (
          <div key={field.id} className="flex flex-col gap-1.5">
            <label className="font-medium text-gray-900 text-sm">
              {field.label} {field.isRequired && <span className="text-maroon-700">*</span>}
            </label>
            
            {field.type === 'TEXT' && (
              <input type="text" name={field.id} required={field.isRequired} placeholder={field.placeholder || ""} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-shadow outline-none" />
            )}
            
            {field.type === 'EMAIL' && (
              <input type="email" name={field.id} required={field.isRequired} placeholder={field.placeholder || ""} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-shadow outline-none" />
            )}
            
            {field.type === 'NUMBER' && (
              <input type="number" name={field.id} required={field.isRequired} placeholder={field.placeholder || ""} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-shadow outline-none" />
            )}
            
            {field.type === 'TEXTAREA' && (
              <textarea name={field.id} required={field.isRequired} placeholder={field.placeholder || ""} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-shadow outline-none" />
            )}
            
            {field.type === 'DROPDOWN' && (
              <select name={field.id} required={field.isRequired} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-maroon-500 transition-shadow outline-none bg-white">
                <option value="">{field.placeholder || "-- Select an option --"}</option>
                {(() => {
                  const opts = typeof field.options === 'string' ? JSON.parse(field.options || '[]') : (field.options || []);
                  return opts.map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>);
                })()}
              </select>
            )}

            {field.type === 'CHECKBOX' && (
              <div className="flex flex-col gap-2 mt-2">
                {(() => {
                  const opts = typeof field.options === 'string' ? JSON.parse(field.options || '[]') : (field.options || []);
                  const val = typeof field.validation === 'string' ? JSON.parse(field.validation || '{}') : (field.validation || {});
                  const maxSelect = val.maxSelect;
                  return (
                    <>
                      {maxSelect && <p className="text-xs text-gray-500 mb-1">Select up to {maxSelect} options</p>}
                      {opts.map((opt: string, i: number) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" name={field.id} value={opt} className="rounded text-maroon-600 focus:ring-maroon-500 w-4 h-4 border-gray-300" onChange={(e) => {
                            if (maxSelect && e.target.checked) {
                              const checkedCount = e.target.form?.querySelectorAll(`input[name="${field.id}"]:checked`).length || 0;
                              if (checkedCount > maxSelect) {
                                e.target.checked = false;
                                alert(`You can only select up to ${maxSelect} options.`);
                              }
                            }
                          }} />
                          <span className="text-gray-700 group-hover:text-gray-900 text-sm">{opt}</span>
                        </label>
                      ))}
                    </>
                  );
                })()}
              </div>
            )}

            {field.type === 'FILE' && (
              <div className="mt-1">
                {(() => {
                  const val = typeof field.validation === 'string' ? JSON.parse(field.validation || '{}') : (field.validation || {});
                  const maxFiles = val.maxFiles || 1;
                  const currentFiles = selectedFiles[field.id] || [];
                  const allowMultiple = maxFiles > 1;

                  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files.length > 0) {
                      let newFiles = Array.from(e.target.files);
                      if (allowMultiple) {
                        newFiles = [...currentFiles, ...newFiles].slice(0, maxFiles);
                      } else {
                        newFiles = [newFiles[0]];
                      }
                      setSelectedFiles(prev => ({ ...prev, [field.id]: newFiles }));
                    }
                  };

                  const removeFile = (index: number) => {
                    const newFiles = [...currentFiles];
                    newFiles.splice(index, 1);
                    setSelectedFiles(prev => ({ ...prev, [field.id]: newFiles }));
                    
                    // Reset input so the same file can be selected again if needed
                    const inputEl = formRef.current?.elements.namedItem(field.id) as HTMLInputElement;
                    if (inputEl) inputEl.value = '';
                  };

                  return (
                    <div className="space-y-4">
                      {currentFiles.length < maxFiles && (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500">
                              {val.allowedFileTypes?.join(', ') || 'Any file'} 
                              {val.maxSizeMb ? ` (Max ${val.maxSizeMb}MB)` : ''}
                              {allowMultiple ? ` • Up to ${maxFiles} files` : ''}
                            </p>
                          </div>
                          <input 
                            type="file" 
                            name={allowMultiple ? `${field.id}[]` : field.id} 
                            required={field.isRequired && currentFiles.length === 0} 
                            className="hidden" 
                            multiple={allowMultiple}
                            accept={val.allowedFileTypes?.join(',') || '*/*'} 
                            onChange={handleFileChange}
                          />
                        </label>
                      )}

                      {/* We inject actual selected files into the form via hidden file inputs for native FormData to pick them up... 
                          Wait, hidden file inputs can't have files set programmatically for security reasons.
                          Instead of replacing the input, we can just leave the actual input alone and clear it if they delete.
                          BUT to support MULTIPLE appends safely without custom fetch logic, we need to rely on the actual input state, OR intercept onSubmit.
                          Since we use `new FormData(e.currentTarget)`, let's modify `handleSubmit` instead to override the file data,
                          or just append `selectedFiles` directly to `formData` before `submitPublicForm`. */}

                      {currentFiles.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {currentFiles.map((file, idx) => {
                            const isImage = file.type.startsWith('image/');
                            return (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center border border-gray-200">
                                  {isImage ? (
                                    <div className="relative w-full h-full">
                                      <Image src={URL.createObjectURL(file)} alt={file.name} fill className="object-cover" />
                                    </div>
                                  ) : (
                                    <FileIcon className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button type="button" onClick={() => removeFile(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto px-8 py-3 bg-maroon-600 hover:bg-maroon-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
