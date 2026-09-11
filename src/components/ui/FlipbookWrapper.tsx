"use client";

import dynamic from "next/dynamic";

const Flipbook = dynamic(() => import("./Flipbook"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full border-4 border-maroon-200 border-t-maroon-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium mt-4">Loading Magazine Viewer...</p>
      </div>
    </div>
  )
});

interface FlipbookWrapperProps {
  pdfUrl: string;
}

export default function FlipbookWrapper({ pdfUrl }: FlipbookWrapperProps) {
  return <Flipbook pdfUrl={pdfUrl} />;
}
