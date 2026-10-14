"use client";

import React, { useState, useRef } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import Link from "next/link";
import Image from "next/image";
import { isRedirectError } from "@/lib/is-redirect-error";



interface MagazineFormProps {
  initialData?: any;
  action: (formData: FormData) => Promise<void>;
}

export function MagazineForm({ initialData, action }: MagazineFormProps) {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialData?.coverThumbnail || null);
  const [outNowPreview, setOutNowPreview] = useState<string | null>(initialData?.outNowImage || null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfError(null);
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    if (file.size > 5 * 1024 * 1024) {
      setPdfError("File size exceeds 5MB limit. Please compress the PDF via iLovePDF.");
      e.target.value = "";
      setThumbnailPreview(initialData?.coverThumbnail || null);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
      return;
    }

    setIsExtracting(true);
    try {
      // Load PDF.js from CDN dynamically to completely bypass Next.js/Turbopack bundler
      if (!(window as any).pdfjsLib) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const arrayBuffer = await file.arrayBuffer();
      // Pass a copy to pdfjsLib so it doesn't detach the original buffer
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Could not get canvas context");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      // Convert canvas to Blob
      canvas.toBlob((blob) => {
        if (!blob) return;

        // Create a fake File object to append to the form
        const thumbFile = new File([blob], "thumbnail.png", { type: "image/png" });

        // We can't directly set a FileList to an input[type="file"] securely without a DataTransfer
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(thumbFile);

        if (thumbnailInputRef.current) {
          thumbnailInputRef.current.files = dataTransfer.files;
        }

        // Update preview
        const url = URL.createObjectURL(blob);
        setThumbnailPreview(url);
        setIsExtracting(false);
      }, "image/png");

    } catch (error) {
      if (isRedirectError(error)) throw error;
      console.error("Error extracting PDF thumbnail:", error);
      setIsExtracting(false);
      alert("Failed to automatically extract thumbnail from PDF. You may need to try again or ensure it's a valid PDF.");
    }
  };

  const handleOutNowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOutNowPreview(URL.createObjectURL(file));
    } else {
      setOutNowPreview(initialData?.outNowImage || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const uploadFileWithProgress = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
        const { upload } = await import('@/lib/upload-client');
        const res = await upload(`magazine/${file.name}`, file, onProgress ? (pct) => onProgress(pct) : undefined);
        return res.url;
      };

      // Direct Client Uploads to R2
      const uploadFile = async (fieldName: string, fileRef: React.RefObject<HTMLInputElement | null>) => {
        const file = fileRef.current?.files?.[0];
        if (file) {
          const url = await uploadFileWithProgress(
            file, 
            fieldName === 'pdfUrl' ? setUploadProgress : undefined
          );
          formData.set(fieldName, url);
        }
      };

      await Promise.all([
        uploadFile('pdfUrl', fileInputRef),
        uploadFile('coverThumbnail', thumbnailInputRef),
      ]);

      const outNowFile = formData.get('outNowImage') as File;
      if (outNowFile && outNowFile.size > 0) {
        const url = await uploadFileWithProgress(outNowFile);
        formData.set('outNowImage', url);
      } else if (outNowFile?.size === 0) {
        formData.delete('outNowImage');
      }

      await action(formData);
    } catch (err: any) {
      if (isRedirectError(err)) throw err;
      console.error(err);
      alert("Failed to upload files: " + (err.message || "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-maroon-900">
          {initialData ? "Edit Magazine" : "New Magazine"}
        </h1>
        <Link href="/admin/magazines" className="text-maroon-700/70 hover:text-maroon-800">
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-maroon-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="volumeNumber" className="block text-sm font-medium text-maroon-800">Volume Number</label>
            <input type="number" id="volumeNumber" name="volumeNumber" defaultValue={initialData?.volumeNumber || 1} required className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="issueNumber" className="block text-sm font-medium text-maroon-800">Issue Number</label>
            <input type="number" id="issueNumber" name="issueNumber" defaultValue={initialData?.issueNumber} required className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-maroon-800">Title</label>
            <input type="text" id="title" name="title" defaultValue={initialData?.title} required className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" />
          </div>
          <div className="space-y-2">
            <label htmlFor="createdAt" className="block text-sm font-medium text-maroon-800">Published Date</label>
            <input 
              type="date" 
              id="createdAt" 
              name="createdAt" 
              defaultValue={initialData?.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
              required 
              className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500" 
            />
          </div>
        </div>

        {/* Hidden inputs to hold the generated thumbnail */}
        <input type="file" name="coverThumbnail" ref={thumbnailInputRef} className="hidden" />

        <div className="space-y-2">
          <label htmlFor="pdfUrl" className="block text-sm font-medium text-maroon-800">
            Magazine PDF (Max 5MB)
          </label>
          <p className="text-xs text-maroon-600 mb-2">
            Please compress the PDF via <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" rel="noopener noreferrer" className="text-maroon-700 hover:underline">iLovePDF</a> before uploading if it exceeds the limit.
            {initialData?.pdfUrl && " Current PDF is uploaded. Selecting a new one will replace it."}
          </p>
          <input
            type="file"
            accept="application/pdf"
            id="pdfUrl"
            name="pdfUrl"
            ref={fileInputRef}
            required={!initialData?.pdfUrl}
            onChange={handlePdfChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-maroon-500 focus:border-maroon-500 ${pdfError ? 'border-red-500 bg-red-50' : 'border-maroon-200'}`}
          />
          {pdfError && (
            <div className="mt-2 p-3 bg-red-100 text-red-800 text-sm rounded-lg border border-red-200 shadow-sm flex items-start gap-2">
              <span className="font-semibold whitespace-nowrap">⚠️ Size Error:</span>
              <span>
                {pdfError} <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-red-900 ml-1">Click here to open iLovePDF</a>
              </span>
            </div>
          )}
        </div>

        {isExtracting && (
          <div className="p-4 bg-maroon-50 rounded-lg text-sm text-maroon-800 flex items-center animate-pulse">
            Extracting cover thumbnail from PDF...
          </div>
        )}

        {isUploading && (
          <div className="p-4 bg-maroon-50 rounded-lg text-sm text-maroon-800 flex items-center animate-pulse border border-maroon-200 shadow-sm">
            Uploading files... {uploadProgress > 0 && <span className="font-bold ml-1 mr-2">{uploadProgress}%</span>} Please do not close this window.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-maroon-800 mb-2">Thumbnail Preview</label>
            <div className="w-full aspect-[3/4] bg-maroon-50 border border-maroon-100 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
              {thumbnailPreview ? (
                <Image src={thumbnailPreview} alt="Cover Preview" fill sizes="(max-width: 1024px) 100vw, 384px" className="object-cover" />
              ) : (
                <span className="text-maroon-300 text-sm">No image</span>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <label htmlFor="outNowImage" className="block text-sm font-medium text-maroon-800">Out Now Promo Image</label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              id="outNowImage"
              name="outNowImage"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setOutNowPreview(file ? URL.createObjectURL(file) : (initialData?.outNowImage || null));
              }}
              className="w-full px-4 py-2 border border-maroon-200 rounded-lg focus:ring-maroon-500 focus:border-maroon-500"
            />
            <div className="w-full aspect-video mt-2 bg-maroon-50 border border-maroon-100 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
              {outNowPreview ? (
                <Image src={outNowPreview} alt="Promo Preview" fill sizes="(max-width: 1024px) 100vw, 384px" className="object-contain" />
              ) : (
                <span className="text-maroon-300 text-sm">No image</span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-maroon-100">
          <SubmitButton disabled={isUploading}>{initialData ? "Update Magazine" : "Create Magazine"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
