"use client";

import React, { useState } from "react";
import { createAnnualEvent, updateAnnualEvent, deleteAnnualEvent } from "@/app/admin/actions";
import { Trash2, Edit } from "lucide-react";

export function EventManager({ initialData = [] }: { initialData: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    await createAnnualEvent({
      title: formData.get("title"),
      description: formData.get("description"),
      orderIndex: parseInt(formData.get("orderIndex") as string) || 0
    });
    form.reset();
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateAnnualEvent(id, {
      title: formData.get("title"),
      description: formData.get("description")
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid gap-4 grid-cols-1 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-gray-500">Event Title</label>
          <input type="text" name="title" required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500">Order Index</label>
          <input type="number" name="orderIndex" defaultValue={0} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-500">Description</label>
          <textarea name="description" required rows={2} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="bg-maroon-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-maroon-800">Add Event</button>
        </div>
      </form>

      <div className="space-y-4">
        {initialData.map((item) => (
          editingId === item.id ? (
            <form key={item.id} onSubmit={(e) => handleUpdate(e, item.id)} className="bg-white p-4 border rounded-xl grid gap-4 shadow-sm">
              <input type="text" name="title" defaultValue={item.title} required className="px-3 py-2 border rounded-lg" />
              <textarea name="description" defaultValue={item.description} required rows={2} className="px-3 py-2 border rounded-lg" />
              <div className="flex gap-2">
                <button type="submit" className="bg-maroon-700 text-white px-4 py-2 rounded-lg text-sm">Save</button>
                <button type="button" onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          ) : (
            <div key={item.id} className="bg-white p-4 border rounded-xl flex items-start justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                <p className="text-xs text-gray-400 mt-2">Order: {item.orderIndex}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingId(item.id)} className="p-2 text-gray-400 hover:text-maroon-600"><Edit size={16}/></button>
                <button onClick={() => deleteAnnualEvent(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
