"use client";

import React, { useState, useEffect } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import Link from "next/link";

import { useRef } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import RichTextEditor from "./RichTextEditor";

interface PostFormProps {
  initialData?: any;
  categories: string[];
  authors: string[];
  action: (formData: FormData) => Promise<void>;
}

export function PostForm({ initialData, categories, authors, action }: PostFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.coverImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState(initialData?.content || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [isExcerptDirty, setIsExcerptDirty] = useState(!!initialData?.excerpt);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [isSlugDirty, setIsSlugDirty] = useState(!!initialData?.slug);

  useEffect(() => {
    if (!isSlugDirty) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [title, isSlugDirty]);

  // Category state
  const defaultCategory = initialData?.category || (categories.length > 0 ? categories[0] : "");
  const isCategoryCustom = initialData?.category && !categories.includes(initialData.category);
  const [isNewCategory, setIsNewCategory] = useState(categories.length === 0 || isCategoryCustom);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);

  // Author state
  const defaultAuthor = initialData?.author || (authors.length > 0 ? authors[0] : "");
  const isAuthorCustom = initialData?.author && !authors.includes(initialData.author);
  const [isNewAuthor, setIsNewAuthor] = useState(authors.length === 0 || isAuthorCustom);
  const [selectedAuthor, setSelectedAuthor] = useState(defaultAuthor);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(initialData?.coverImage || null);
    }
  };

  // Auto-generate excerpt from content if user hasn't manually edited it
  useEffect(() => {
    if (!isExcerptDirty) {
      const plainText = content.replace(/<[^>]*>?/gm, '');
      // Take first 150 characters
      const generated = plainText.substring(0, 150) + (plainText.length > 150 ? "..." : "");
      setExcerpt(generated);
    }
  }, [content, isExcerptDirty]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const uploadFileWithProgress = (file: File, onProgress?: (pct: number) => void): Promise<string> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload-server');
          
          if (onProgress) {
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
              }
            };
          }
          
          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              resolve(response.url);
            } else {
              reject(new Error('Upload failed with status ' + xhr.status + ': ' + xhr.responseText));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error during upload'));
          
          const uploadData = new FormData();
          uploadData.append('file', file);
          xhr.send(uploadData);
        });
      };

      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const url = await uploadFileWithProgress(file, setUploadProgress);
        formData.set('coverImage', url);
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
          {initialData ? "Edit Article" : "New Article"}
        </h1>
        <Link href="/admin/posts" className="text-maroon-700/70 hover:text-maroon-800">
          Cancel
        </Link>
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
            <label htmlFor="categorySelect" className="block text-sm font-medium text-maroon-800">Category</label>
            <div className="flex gap-2">
              <select
                id="categorySelect"
                className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500"
                value={isNewCategory ? 'new' : (selectedCategory || "")}
                onChange={(e) => {
                  if (e.target.value === 'new') setIsNewCategory(true);
                  else {
                    setIsNewCategory(false);
                    setSelectedCategory(e.target.value);
                  }
                }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="new">+ Create New...</option>
              </select>
            </div>
            {isNewCategory ? (
              <input type="text" name="category" placeholder="Type new category..." defaultValue={isCategoryCustom ? initialData.category : ""} required className="w-full mt-2 px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
            ) : (
              <input type="hidden" name="category" value={selectedCategory || ""} />
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="authorSelect" className="block text-sm font-medium text-maroon-800">Author</label>
            <div className="flex gap-2">
              <select
                id="authorSelect"
                className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500"
                value={isNewAuthor ? 'new' : (selectedAuthor || "")}
                onChange={(e) => {
                  if (e.target.value === 'new') setIsNewAuthor(true);
                  else {
                    setIsNewAuthor(false);
                    setSelectedAuthor(e.target.value);
                  }
                }}
              >
                {authors.map(a => <option key={a} value={a}>{a}</option>)}
                <option value="new">+ Create New...</option>
              </select>
            </div>
            {isNewAuthor ? (
              <input type="text" name="author" placeholder="Type new author..." defaultValue={isAuthorCustom ? initialData.author : ""} required className="w-full mt-2 px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
            ) : (
              <input type="hidden" name="author" value={selectedAuthor || ""} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="space-y-6 w-full">
            <div className="space-y-2">
              <label htmlFor="coverImage" className="block text-sm font-medium text-maroon-800">
                Cover Image {initialData && "(Leave empty to keep existing)"}
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                id="coverImage"
                name="coverImage"
                ref={fileInputRef}
                onChange={handleImageChange}
                required={!initialData}
                className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="block text-sm font-medium text-maroon-800">Content</label>
              <RichTextEditor 
                value={content}
                onChange={setContent}
                placeholder="Write your article here..."
              />
              <input type="hidden" name="content" value={content} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="excerpt" className="block text-sm font-medium text-maroon-800">Excerpt (Short Description)</label>
                <button
                  type="button"
                  onClick={() => setIsExcerptDirty(false)}
                  className="text-xs text-maroon-600 hover:text-maroon-800 underline"
                >
                  Auto-generate
                </button>
              </div>
              <textarea
                id="excerpt"
                name="excerpt"
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  setIsExcerptDirty(true);
                }}
                required
                rows={3}
                className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500"
              ></textarea>
            </div>
          </div>

          <div className="space-y-2 sticky top-6 pt-7">
            <label className="block text-sm font-medium text-maroon-800 mb-2">Image Preview</label>
            <div className="w-full aspect-square bg-maroon-50 border border-maroon-100 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
              {imagePreview ? (
                <img src={imagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-maroon-300 text-sm">No image</span>
              )}
            </div>

          </div>
        </div>

        {isUploading && (
          <div className="p-4 bg-maroon-50 rounded-lg text-sm text-maroon-800 flex items-center animate-pulse border border-maroon-200 shadow-sm">
            Uploading files... {uploadProgress > 0 && <span className="font-bold ml-1 mr-2">{uploadProgress}%</span>} Please do not close this window.
          </div>
        )}

        <div className="pt-6 border-t border-maroon-100">
          <SubmitButton disabled={isUploading}>{initialData ? "Update Article" : "Create Article"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
