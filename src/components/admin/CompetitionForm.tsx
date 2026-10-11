"use client";

import React, { useState, useRef, useEffect } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import Link from "next/link";
import Image from "next/image";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import RichTextEditor from "./RichTextEditor";

interface CompetitionFormProps {
  initialData?: any;
  action: (formData: FormData) => Promise<void>;
}

export function CompetitionForm({ initialData, action }: CompetitionFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImage || null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const rulesInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState(initialData?.content || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugDirty, setIsSlugDirty] = useState(!!initialData?.slug);

  useEffect(() => {
    if (!isSlugDirty) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [title, isSlugDirty]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview(initialData?.coverImage || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData(e.currentTarget);
      
      const uploadFileWithProgress = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
        const { upload } = await import('@/lib/upload-client');
        const res = await upload(`competitions/${file.name}`, file, onProgress ? (pct) => onProgress(pct) : undefined);
        return res.url;
      };

      const coverFile = coverInputRef.current?.files?.[0];
      if (coverFile) {
        const url = await uploadFileWithProgress(coverFile, setUploadProgress);
        formData.set('coverImage', url);
      } else {
        formData.delete('coverImage');
      }

      const rulesFile = rulesInputRef.current?.files?.[0];
      if (rulesFile) {
        const url = await uploadFileWithProgress(rulesFile, setUploadProgress);
        formData.set('rulesPdf', url);
      } else {
        formData.delete('rulesPdf');
      }

      await action(formData);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      console.error(err);
      alert("Failed to save. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">
          {initialData ? "Edit Competition" : "New Competition"}
        </h1>
        <div className="flex gap-4 items-center">
          {initialData?.isQuiz && (
            <Link href={`/admin/competitions/${initialData.id}/quizzes`} className="px-4 py-2 bg-maroon-100 text-maroon-800 rounded-lg hover:bg-maroon-200 text-sm font-medium">
              Manage Quizzes
            </Link>
          )}
          <Link href="/admin/competitions" className="text-maroon-700/70 hover:text-maroon-800">Cancel</Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-maroon-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-maroon-800">Title</label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium text-maroon-800">Slug (URL)</label>
            <input 
              type="text" 
              id="slug" 
              name="slug" 
              value={slug} 
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugDirty(true);
              }} 
              required 
              className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium text-maroon-800">Date</label>
            <input type="date" id="date" name="date" defaultValue={initialData?.date || ""} className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="time" className="block text-sm font-medium text-maroon-800">Time</label>
            <input type="time" id="time" name="time" defaultValue={initialData?.time || ""} className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-medium text-maroon-800">Location</label>
            <input type="text" id="location" name="location" defaultValue={initialData?.location || ""} className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="deadline" className="block text-sm font-medium text-maroon-800">Deadline</label>
            <input type="datetime-local" id="deadline" name="deadline" defaultValue={initialData?.deadline || ""} className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
        </div>

        <div className="flex gap-6 p-4 bg-maroon-50 border border-maroon-100 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-maroon-900">
            <input type="checkbox" name="isEnded" defaultChecked={initialData?.isEnded} className="w-4 h-4 text-maroon-600 focus:ring-maroon-500 border-maroon-300 rounded" />
            Competition has ended
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-maroon-900">
            <input type="checkbox" name="isQuiz" defaultChecked={initialData?.isQuiz} className="w-4 h-4 text-maroon-600 focus:ring-maroon-500 border-maroon-300 rounded" />
            This is a Quiz Competition
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-maroon-50">
          <div className="space-y-2">
            <label htmlFor="coverImage" className="block text-sm font-medium text-maroon-800">Cover Photo</label>
            <input 
              type="file" 
              id="coverImage" 
              name="coverImage" 
              accept="image/png, image/jpeg, image/webp"
              ref={coverInputRef} 
              onChange={handleCoverChange}
              className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" 
            />
            {initialData?.coverImage && (
              <p className="text-xs text-maroon-600 mt-1">Current cover photo is set.</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="rulesPdf" className="block text-sm font-medium text-maroon-800">Rules & Regulations (PDF)</label>
            <input 
              type="file" 
              id="rulesPdf" 
              name="rulesPdf" 
              accept="application/pdf"
              ref={rulesInputRef} 
              className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" 
            />
            {initialData?.rulesPdf && (
              <p className="text-xs text-maroon-600 mt-1">Current rules PDF is set.</p>
            )}
            
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-maroon-800">Cover Image Preview</label>
              <div className="w-full aspect-video bg-maroon-50 border border-maroon-100 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
                {coverPreview ? (
                  <Image src={coverPreview} alt="Cover Preview" fill sizes="(max-width: 1024px) 100vw, 384px" className="object-cover" />
                ) : (
                  <span className="text-maroon-300 text-sm">No image</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-maroon-800">Short Description</label>
          <textarea id="description" name="description" defaultValue={initialData?.description} required rows={2} className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500"></textarea>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-maroon-800">Rich Content</label>
          <RichTextEditor 
            value={content}
            onChange={setContent}
            placeholder="Write the full competition details here..."
          />
          <input type="hidden" name="content" value={content} />
        </div>

        {isUploading && (
          <div className="p-4 bg-maroon-50 rounded-lg text-sm text-maroon-800 flex items-center animate-pulse border border-maroon-200 shadow-sm">
            Uploading files... {uploadProgress > 0 && <span className="font-bold ml-1 mr-2">{uploadProgress}%</span>} Please do not close this window.
          </div>
        )}

        <div className="pt-4">
          <SubmitButton disabled={isUploading}>
            {initialData ? "Update Competition" : "Create Competition"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
