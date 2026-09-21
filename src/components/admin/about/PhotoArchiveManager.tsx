"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPhotoArchive, deletePhotoArchive, updatePhotoArchiveOrder } from "@/app/admin/actions";
import { Trash2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from "next/image";

function SortableItem({ id, item, onDelete }: { id: string, item: any, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group cursor-grab active:cursor-grabbing aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200">
      <Image src={item.photoUrl} alt="Archive" fill className="object-cover" />
      
      {/* Permanent delete button */}
      <button 
        type="button"
        onClick={() => onDelete(id)} 
        className="absolute top-2 right-2 bg-white/90 text-red-600 p-2 rounded-full hover:bg-red-50 hover:text-red-700 shadow-sm transition-colors z-20 cursor-pointer"
        title="Delete Photo"
      >
        <Trash2 size={16}/>
      </button>

      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      >
        <div className="absolute top-2 left-2 bg-black/50 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
}

export function PhotoArchiveManager({ initialData = [] }: { initialData: any[] }) {
  const [items, setItems] = useState(initialData);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await updatePhotoArchiveOrder(orderedIds);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { upload } = await import('@vercel/blob/client');
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload'
        });
        
        await createPhotoArchive({
          photoUrl: blob.url,
          orderIndex: items.length + i
        });
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch(err) {
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      await deletePhotoArchive(id);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleUpload} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Select Photos (Multiple allowed)</label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            ref={fileInputRef} 
            required 
            className="w-full px-3 py-2 border rounded-lg bg-white" 
          />
        </div>
        <button type="submit" disabled={isUploading} className="w-full md:w-auto bg-maroon-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-maroon-800 disabled:opacity-50 whitespace-nowrap">
          {isUploading ? "Uploading..." : "Upload Photos"}
        </button>
      </form>

      <DndContext 
        id="dnd-photo-archive"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SortableContext 
            items={items.map(i => i.id)}
            strategy={rectSortingStrategy}
          >
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id} item={item} onDelete={handleDelete} />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
}
