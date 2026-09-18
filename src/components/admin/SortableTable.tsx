"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface SortableTableProps {
  items: any[];
  columns: { key: string; label: string }[];
  basePath: string;
  onReorder: (ids: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showQuizzesLink?: boolean;
}

function SortableRow({ item, columns, basePath, onDelete, showQuizzesLink }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this?")) {
      setIsDeleting(true);
      await onDelete(item.id);
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-maroon-50 hover:bg-maroon-50/50 transition-colors bg-white relative"
    >
      <td className="p-4 w-12 text-maroon-300">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-maroon-600 transition-colors">
          <GripVertical className="w-5 h-5" />
        </button>
      </td>
      {columns.map((col: any) => (
        <td key={col.key} className="p-4 font-medium text-maroon-950">
          {item[col.key]}
        </td>
      ))}
      <td className="p-4 flex items-center justify-end gap-2">
        {showQuizzesLink && item.isQuiz && (
          <Link
            href={`${basePath}/${item.id}/quizzes`}
            className="px-3 py-1.5 bg-maroon-50 text-maroon-700 rounded-lg hover:bg-maroon-100 transition-colors text-sm font-medium mr-2"
          >
            Quizzes
          </Link>
        )}
        <Link
          href={`${basePath}/${item.id}`}
          className="p-2 text-maroon-700 hover:bg-maroon-100 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 text-maroon-800 hover:bg-maroon-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </td>
    </tr>
  );
}

export function SortableTable({ items: initialItems, columns, basePath, onReorder, onDelete, showQuizzesLink }: SortableTableProps) {
  const [items, setItems] = useState(initialItems);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      
      // Save the new order
      setIsSaving(true);
      await onReorder(newItems.map((i) => i.id));
      setIsSaving(false);
    }
  }

  // Update internal state if props change (e.g. after delete or creation)
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  if (!isMounted) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-maroon-100 p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 text-maroon-300 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-maroon-100 p-8 text-center text-maroon-700/60">
        No items found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-maroon-100 overflow-hidden relative">
      {isSaving && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-maroon-100 overflow-hidden z-10">
           <div className="h-full bg-maroon-500 w-1/3 animate-pulse transition-all"></div>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-maroon-50 border-b border-maroon-100 text-sm text-maroon-800">
            <th className="p-4 font-medium w-12"></th>
            {columns.map((col) => (
              <th key={col.key} className="p-4 font-medium">
                {col.label}
              </th>
            ))}
            <th className="p-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
          <tbody>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <SortableRow key={item.id} item={item} columns={columns} basePath={basePath} onDelete={onDelete} showQuizzesLink={showQuizzesLink} />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
