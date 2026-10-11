"use client";

import React, { useState, useRef, useEffect } from "react";
import { updateHistorySection } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import RichTextEditor from "@/components/admin/RichTextEditor";
import Image from "next/image";

interface HistoryFormProps {
  sectionKey: string;
  initialData?: any;
  hasImage?: boolean;
}

export function HistoryForm({ sectionKey, initialData, hasImage = false }: HistoryFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState(initialData?.content || "");

  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const file = fileInputRef.current?.files?.[0];

    if (
      title !== (initialData?.title || "") ||
      content !== (initialData?.content || "") ||
      file
    ) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  };

  useEffect(() => {
    // To handle onChange for the RichTextEditor manually since it doesn't bubble like standard inputs
    const formElement = document.getElementById(`form-${sectionKey}`) as HTMLFormElement;
    if (formElement) {
       handleFormChange({ currentTarget: formElement } as React.FormEvent<HTMLFormElement>);
    }
  }, [content]);

  useEffect(() => {
    setContent(initialData?.content || "");
  }, [initialData, sectionKey]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const uploadFile = async (file: File) => {
        const { upload } = await import('@/lib/upload-client');
        const res = await upload(`about/history/${file.name}`, file);
        return res.url;
      };

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const url = await uploadFile(file);
        formData.set('photoUrl', url);
      }

      await updateHistorySection(sectionKey, {
        title: formData.get("title"),
        content: content,
        photoUrl: formData.get("photoUrl"),
      });
      alert("Successfully updated!");
      setHasChanges(false);
      
      // Update local initialData effectively for future comparisons
      if (initialData) {
        initialData.title = formData.get("title");
        initialData.content = content;
        if (file) {
          initialData.photoUrl = formData.get("photoUrl");
        }
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update section.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form id={`form-${sectionKey}`} onSubmit={handleSubmit} onChange={handleFormChange} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-maroon-800">Title</label>
        <input type="text" name="title" defaultValue={initialData?.title || ""} required className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-maroon-800">Content</label>
        <RichTextEditor 
          value={content}
          onChange={setContent}
          placeholder="Write your content here..."
        />
        <input type="hidden" name="content" value={content} />
      </div>

      {hasImage && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-maroon-800">Photo / Image</label>
          {initialData?.photoUrl && (
            <Image src={initialData.photoUrl} alt="Preview" width={200} height={128} className="h-32 w-auto rounded-lg object-cover mb-2" />
          )}
          <input type="file" accept="image/*" name="photoUrl" ref={fileInputRef} className="w-full px-4 py-2 border border-maroon-200 rounded-lg" />
        </div>
      )}

      <SubmitButton disabled={isUploading || !hasChanges}>
        {isUploading ? "Saving..." : !hasChanges ? "No Changes" : "Save Section"}
      </SubmitButton>
    </form>
  );
}
