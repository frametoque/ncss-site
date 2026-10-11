"use client";

import React, { useState, useRef } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";


interface BoardFormProps {
  initialData?: any;
  action: (formData: FormData) => Promise<void>;
}

export function BoardForm({ initialData, action }: BoardFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const uploadFileWithProgress = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
        const { upload } = await import('@/lib/upload-client');
        const res = await upload(`about/executive-board/${file.name}`, file, onProgress ? (pct) => onProgress(pct) : undefined);
        return res.url;
      };

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const url = await uploadFileWithProgress(file, undefined);
        formData.set('photoUrl', url);
      }

      await action(formData);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      console.error(err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">
          {initialData ? "Edit Board Member" : "New Board Member"}
        </h1>
        <Link href="/admin/board" className="text-maroon-700/70 hover:text-maroon-800">
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-maroon-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-maroon-800">Name</label>
            <input type="text" id="name" name="name" defaultValue={initialData?.name} required className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-maroon-800">Role</label>
            <input type="text" id="role" name="role" defaultValue={initialData?.role} required className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="contactNumber" className="block text-sm font-medium text-maroon-800">Contact Number (Optional)</label>
            <input type="text" id="contactNumber" name="contactNumber" defaultValue={initialData?.contactNumber} className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" placeholder="+94 7X XXX XXXX" />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="photoUrl" className="block text-sm font-medium text-maroon-800">
            Photo {initialData && "(Leave empty to keep existing)"}
          </label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            id="photoUrl"
            name="photoUrl"
            ref={fileInputRef}
            className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500"
          />
        </div>

        {isUploading && (
          <div className="p-4 bg-maroon-50 rounded-lg text-sm text-maroon-800 flex items-center animate-pulse border border-maroon-200 shadow-sm">
            Uploading files... Please do not close this window.
          </div>
        )}

        <div className="pt-6 border-t border-maroon-100">
          <SubmitButton disabled={isUploading}>{initialData ? "Update Board Member" : "Add Board Member"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
