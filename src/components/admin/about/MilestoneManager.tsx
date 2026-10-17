"use client";

import React, { useState, useEffect } from "react";
import { createMilestone, updateMilestone, deleteMilestone, updateMilestoneOrder } from "@/app/admin/actions";
import { Trash2, Edit, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableMilestone({ id, item, editingId, setEditingId, handleUpdate, handleDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (editingId === item.id) {
    return (
      <div ref={setNodeRef} style={style} className="bg-white p-4 border rounded-xl shadow-sm z-10 relative">
        <form onSubmit={(e) => handleUpdate(e, item.id)} className="grid gap-4 md:grid-cols-2">
          <input type="text" name="year" defaultValue={item.year} required className="px-3 py-2 border rounded-lg" />
          <input type="text" name="title" defaultValue={item.title} required className="px-3 py-2 border rounded-lg" />
          <textarea name="description" defaultValue={item.description} required rows={2} className="px-3 py-2 border rounded-lg md:col-span-2" />
          <div className="flex gap-2">
            <button type="submit" className="bg-maroon-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-maroon-900 transition-colors">Save</button>
            <button type="button" onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 border rounded-xl flex items-start shadow-sm">
      <div 
        {...attributes} 
        {...listeners}
        className="mr-3 mt-1 text-gray-400 hover:text-maroon-600 cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={20} />
      </div>
      <div className="flex-1">
        <span className="text-maroon-600 font-bold text-sm mr-2">{item.year}</span>
        <h4 className="font-bold inline">{item.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
      </div>
      <div className="flex gap-2 ml-4 shrink-0">
        <button type="button" onClick={() => setEditingId(item.id)} className="p-2 text-gray-400 hover:text-maroon-600"><Edit size={16}/></button>
        <button type="button" onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
      </div>
    </div>
  );
}

export function MilestoneManager({ initialData = [] }: { initialData: any[] }) {
  const [items, setItems] = useState(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialData);
  }, [initialData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over?.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      
      const orderedIds = newItems.map(item => item.id);
      await updateMilestoneOrder(orderedIds);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    await createMilestone({
      year: formData.get("year"),
      title: formData.get("title"),
      description: formData.get("description"),
      orderIndex: items.length
    });
    form.reset();
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateMilestone(id, {
      year: formData.get("year"),
      title: formData.get("title"),
      description: formData.get("description")
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this milestone?")) {
      await deleteMilestone(id);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid gap-4 grid-cols-1 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-gray-500">Year</label>
          <input type="text" name="year" required placeholder="e.g. 1970s" className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500">Title</label>
          <input type="text" name="title" required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-500">Description</label>
          <textarea name="description" required rows={2} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2 flex justify-end mt-2">
          <button type="submit" className="bg-maroon-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-maroon-900 transition-colors">Add Milestone</button>
        </div>
      </form>

      <DndContext 
        id="dnd-milestones"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          <SortableContext 
            items={items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableMilestone 
                key={item.id} 
                id={item.id} 
                item={item} 
                editingId={editingId}
                setEditingId={setEditingId}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}
