"use client";

import { useState } from "react";
import { updateForm, saveFormFields } from "../../../form-actions";
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Settings, GripVertical, ChevronDown } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";

type FieldType = "TEXT" | "TEXTAREA" | "EMAIL" | "NUMBER" | "DROPDOWN" | "CHECKBOX" | "FILE" | "SECTION_DIVIDER";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string | null;
  isRequired: boolean;
  options: string | null;
  validation: string | null;
}


function SortableFieldItem({ field, index, total, updateField, removeField, moveField, handleAddField }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as any,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group p-4 border ${isDragging ? 'border-maroon-400 shadow-md bg-white' : 'border-gray-200 bg-gray-50'} rounded-lg flex gap-4 transition-colors`}>
      <div className="flex flex-col items-center gap-1 mt-1">
        <button type="button" onClick={() => moveField(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-maroon-600 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
        <div {...attributes} {...listeners} className="cursor-grab hover:text-maroon-600 text-gray-400 p-1 active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </div>
        <button type="button" onClick={() => moveField(index, 1)} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-maroon-600 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1 mr-4">
            <div className="relative inline-block">
              <select
                value={field.type}
                onChange={(e) => {
                  const t = e.target.value as FieldType;
                  updateField(field.id, { 
                    type: t,
                    options: (!field.options && (t === "DROPDOWN" || t === "CHECKBOX")) ? '["Option 1", "Option 2"]' : field.options,
                    validation: (!field.validation && t === "FILE") ? '{"allowedFileTypes": [".pdf", ".jpg", ".png"], "maxSizeMb": 5, "maxFiles": 1}' : (!field.validation && t === "CHECKBOX") ? '{"maxSelect": null}' : field.validation
                  });
                }}
                className="bg-maroon-100 text-maroon-800 text-xs font-bold pl-2 pr-6 py-1 rounded whitespace-nowrap outline-none cursor-pointer appearance-none hover:bg-maroon-200 transition-colors"
              >
                {(["TEXT", "TEXTAREA", "EMAIL", "NUMBER", "DROPDOWN", "CHECKBOX", "FILE", "SECTION_DIVIDER"] as FieldType[]).map(t => (
                  <option key={t} value={t}>{t === "SECTION_DIVIDER" ? "SECTION" : t}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-maroon-800">
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
            <input 
              type="text" 
              value={field.label} 
              onChange={(e) => updateField(field.id, { label: e.target.value })} 
              className="flex-1 w-full font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-maroon-500 focus:outline-none px-1"
              placeholder="Field Label"
            />
          </div>
          <button type="button" onClick={() => removeField(field.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
        </div>
        
        {field.type !== 'SECTION_DIVIDER' && (
          <div className="grid grid-cols-2 gap-4">
            {field.type !== 'CHECKBOX' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Placeholder</label>
                <input type="text" value={field.placeholder || ""} onChange={e => updateField(field.id, { placeholder: e.target.value })} className="w-full px-2 py-1 text-sm border rounded" />
              </div>
            )}
            <div className="flex items-center mt-5">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={field.isRequired} onChange={e => updateField(field.id, { isRequired: e.target.checked })} className="rounded text-maroon-600 focus:ring-maroon-500" />
                Required Field
              </label>
            </div>
          </div>
        )}

        {(field.type === 'DROPDOWN' || field.type === 'CHECKBOX') && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-700 block mb-1">Options (One per line)</label>
            <textarea 
              rows={3}
              value={(() => {
                try { return JSON.parse(field.options || '[]').join('\n'); }
                catch { return field.options || ""; }
              })()}
              onChange={e => {
                const lines = e.target.value.split('\n');
                updateField(field.id, { options: JSON.stringify(lines) });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500 outline-none transition-shadow"
              placeholder="Option 1
Option 2
Option 3"
            />
          </div>
        )}

        {field.type === 'CHECKBOX' && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-700 block mb-1">Maximum Selections Allowed</label>
            <input 
              type="number" 
              min="1"
              value={(() => {
                try { return JSON.parse(field.validation || '{}').maxSelect || ""; }
                catch { return ""; }
              })()}
              onChange={e => {
                const valStr = e.target.value;
                let current = {};
                try { current = JSON.parse(field.validation || '{}'); } catch {}
                if (valStr) {
                  updateField(field.id, { validation: JSON.stringify({ ...current, maxSelect: Number(valStr) }) });
                } else {
                  const { maxSelect, ...rest } = current as any;
                  updateField(field.id, { validation: JSON.stringify(rest) });
                }
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500 outline-none transition-shadow" 
              placeholder="e.g. 2 (Leave empty for unlimited)"
            />
          </div>
        )}

        {field.type === 'FILE' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Max Files</label>
              <input 
                type="number" 
                min="1"
                value={(() => {
                  try { return JSON.parse(field.validation || '{}').maxFiles || "1"; }
                  catch { return "1"; }
                })()}
                onChange={e => {
                  const valStr = e.target.value;
                  let current = {};
                  try { current = JSON.parse(field.validation || '{}'); } catch {}
                  if (valStr) {
                    updateField(field.id, { validation: JSON.stringify({ ...current, maxFiles: Number(valStr) }) });
                  } else {
                    const { maxFiles, ...rest } = current as any;
                    updateField(field.id, { validation: JSON.stringify(rest) });
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500 outline-none transition-shadow"
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Max Size (MB)</label>
              <input 
                type="number" 
                min="1"
                value={(() => {
                  try { return JSON.parse(field.validation || '{}').maxSizeMb || ""; }
                  catch { return ""; }
                })()}
                onChange={e => {
                  const valStr = e.target.value;
                  let current = {};
                  try { current = JSON.parse(field.validation || '{}'); } catch {}
                  if (valStr) {
                    updateField(field.id, { validation: JSON.stringify({ ...current, maxSizeMb: Number(valStr) }) });
                  } else {
                    const { maxSizeMb, ...rest } = current as any;
                    updateField(field.id, { validation: JSON.stringify(rest) });
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500 outline-none transition-shadow"
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Allowed Types</label>
              <input 
                type="text" 
                value={(() => {
                  try { return (JSON.parse(field.validation || '{}').allowedFileTypes || []).join(', '); }
                  catch { return ""; }
                })()}
                onChange={e => {
                  const valStr = e.target.value;
                  let current = {};
                  try { current = JSON.parse(field.validation || '{}'); } catch {}
                  const exts = valStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
                  updateField(field.id, { validation: JSON.stringify({ ...current, allowedFileTypes: exts }) });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500 outline-none transition-shadow"
                placeholder=".pdf, .jpg, .png"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          type="button"
          onClick={() => handleAddField('TEXT', index + 1)} 
          className="bg-white border border-gray-200 shadow-sm rounded-full p-1.5 text-gray-400 hover:text-maroon-600 hover:border-maroon-200 transition-colors flex items-center justify-center"
          title="Add field here"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function FormBuilderClient({ form, initialFields, competitions }: { form: any, initialFields: any[], competitions: any[] }) {
  const router = useRouter();
  
  // Form Metadata State
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description || "");
  const [slug, setSlug] = useState(form.slug);
  const [competitionId, setCompetitionId] = useState(form.competitionId || "none");
  const [isActive, setIsActive] = useState(form.isActive);
  
  const [limitOnePerEmail, setLimitOnePerEmail] = useState(form.limitOnePerEmail || false);
  const [successMessage, setSuccessMessage] = useState(form.successMessage || `<h3>Submitted Successfully!</h3><p>Thank you for submitting <strong>${form.title}</strong>.</p>`);
  
  // Fields State
  const [fields, setFields] = useState<FormField[]>(
    initialFields.map(f => ({
      ...f,
      id: f.id,
      options: typeof f.options === 'string' ? f.options : (f.options ? JSON.stringify(f.options) : null),
      validation: typeof f.validation === 'string' ? f.validation : (f.validation ? JSON.stringify(f.validation) : null)
    }))
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddField = (type: FieldType, insertAt?: number) => {
    const newField: FormField = {
      id: "new_" + Math.random().toString(36).substring(2, 9),
      type,
      label: type === "SECTION_DIVIDER" ? "New Page / Section" : "New " + type.toLowerCase() + " field",
      placeholder: "",
      isRequired: false,
      options: (type === "DROPDOWN" || type === "CHECKBOX") ? '["Option 1", "Option 2"]' : null,
      validation: type === "FILE" ? '{"allowedFileTypes": [".pdf", ".jpg", ".png"], "maxSizeMb": 5, "maxFiles": 1}' : type === "CHECKBOX" ? '{"maxSelect": null}' : null
    };
    if (typeof insertAt === 'number') {
      const newFields = [...fields];
      newFields.splice(insertAt, 0, newField);
      setFields(newFields);
    } else {
      setFields([...fields, newField]);
    }
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const moveField = (index: number, dir: -1 | 1) => {
    if (index + dir < 0 || index + dir >= fields.length) return;
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[index + dir];
    newFields[index + dir] = temp;
    setFields(newFields);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateForm(form.id, {
        title,
        description,
        slug,
        competitionId: competitionId === "none" ? null : competitionId,
        isActive,
        limitOnePerEmail,
        successMessage
      });
      
      // Parse JSON fields before saving so they are clean objects instead of double-escaped strings
      const cleanedFields = fields.map(f => ({
        ...f,
        options: f.options ? JSON.parse(f.options) : null,
        validation: f.validation ? JSON.parse(f.validation) : null
      }));
      
      await saveFormFields(form.id, cleanedFields);
      alert("Form saved successfully!");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Error saving form. Check console.");
    }
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COL: Builder */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-maroon-100">
          <h2 className="text-xl font-bold text-maroon-900 mb-4">Form Fields</h2>
          
          <div className="space-y-4 mb-6">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {fields.map((field, index) => (
                  <SortableFieldItem 
                    key={field.id}
                    field={field}
                    index={index}
                    total={fields.length}
                    updateField={updateField}
                    removeField={removeField}
                    moveField={moveField}
                    handleAddField={handleAddField}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {fields.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
                No fields added yet. Add one from the panel below.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-maroon-900 mb-3">Add New Field</p>
            <div className="flex flex-wrap gap-2">
              {(["TEXT", "TEXTAREA", "EMAIL", "NUMBER", "DROPDOWN", "CHECKBOX", "FILE", "SECTION_DIVIDER"] as FieldType[]).map(type => (
                <button key={type} type="button" onClick={() => handleAddField(type)} className="px-3 py-1.5 bg-gray-100 hover:bg-maroon-50 text-gray-700 hover:text-maroon-700 rounded-md text-sm font-medium flex items-center gap-1 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> {type === "SECTION_DIVIDER" ? "Section Break" : type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COL: Settings & Save */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-maroon-100">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-maroon-700" />
            <h2 className="text-lg font-bold text-maroon-900">Form Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Competition</label>
              <select value={competitionId} onChange={e => setCompetitionId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="none">Standalone Form</option>
                {competitions.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded text-maroon-600" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Form is Active</label>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="limitOnePerEmail" checked={limitOnePerEmail} onChange={e => setLimitOnePerEmail(e.target.checked)} className="rounded text-maroon-600" />
              <label htmlFor="limitOnePerEmail" className="text-sm font-medium text-gray-700">Limit to 1 response per email</label>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Success Message</label>
              <p className="text-xs text-gray-500 mb-2">Optional custom message shown after submission.</p>
              <div className="bg-white border rounded-lg overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-container]:border-none [&_.ql-editor]:min-h-[150px]">
                <RichTextEditor value={successMessage} onChange={setSuccessMessage} />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full bg-maroon-600 hover:bg-maroon-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors shadow-sm"
        >
          {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
