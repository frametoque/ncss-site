"use client";

import React, { useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure the worker correctly for Next.js App Router
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FlipbookProps {
  pdfUrl: string;
}

export default function Flipbook({ pdfUrl }: FlipbookProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(1000);
  const [windowHeight, setWindowHeight] = useState(800);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const flipBookRef = React.useRef<any>(null);

  useEffect(() => {
    // Create Audio instance on client mount for reliable playback
    const audio = new Audio('/sounds/page-flip-02.wav');
    audio.volume = 0.5;
    audio.preload = 'auto';
    audioRef.current = audio;

    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!flipBookRef.current) return;
      if (e.key === 'ArrowRight') {
        flipBookRef.current.pageFlip().flipNext();
      } else if (e.key === 'ArrowLeft') {
        flipBookRef.current.pageFlip().flipPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const playFlipSound = () => {
    if (audioRef.current) {
      // Clone the audio to allow overlapping plays
      const sound = audioRef.current.cloneNode() as HTMLAudioElement;
      sound.volume = 0.5;
      sound.play().catch(() => {});
    }
  };

  // Calculate dimensions based on screen size to maximize space
  const isMobile = windowWidth < 768;
  const paddingX = isMobile ? 30 : 60; // padding inside the dark container + margins
  
  // Available width for a single page
  const maxAvailableWidth = isMobile ? windowWidth - paddingX : (windowWidth - paddingX) / 2;
  // Available height (subtracting rough height of header, margins, and padding)
  const maxAvailableHeight = windowHeight - 200; 

  // Standard portrait magazine page ratio (approx 1:1.414)
  const ratio = 1.414;
  
  let calculatedWidth = maxAvailableWidth;
  let calculatedHeight = calculatedWidth * ratio;

  // If height exceeds available vertical space, scale down based on height
  if (calculatedHeight > maxAvailableHeight) {
    calculatedHeight = maxAvailableHeight;
    calculatedWidth = calculatedHeight / ratio;
  }
  
  const pageWidth = Math.max(315, calculatedWidth); // Ensure it doesn't go below minimum
  const pageHeight = Math.max(400, calculatedHeight);

  if (!numPages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="hidden"
        />
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-maroon-200 border-t-maroon-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium mt-4">Loading Magazine...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center py-2 md:py-4 select-none w-full"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="bg-[#1a1a1a] p-2 md:p-6 rounded-xl shadow-2xl relative max-w-full overflow-hidden flex items-center justify-center">
        {/* @ts-ignore - react-pageflip has outdated types */}
        <HTMLFlipBook
          ref={flipBookRef}
          width={pageWidth}
          height={pageHeight}
          size="fixed"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          drawShadow={true}
          maxShadowOpacity={0.8}
          showCover={true}
          mobileScrollSupport={true}
          usePortrait={isMobile}
          onChangeState={(e: any) => {
            if (e.data === 'flipping') {
              playFlipSound();
            }
          }}
          className="flipbook-demo"
        >
          {Array.from(new Array(numPages), (el, index) => {
            const isLeftPage = index % 2 !== 0; // Page 2, 4, 6... (index 1, 3, 5...)
            const isRightPage = index !== 0 && index % 2 === 0; // Page 3, 5, 7... (index 2, 4, 6...)
            
            return (
              <div key={`page_${index + 1}`} className="bg-white overflow-hidden flex items-center justify-center relative">
                <Document file={pdfUrl} loading={<div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400 text-sm">Loading...</div>}>
                  <Page 
                    pageNumber={index + 1} 
                    width={pageWidth} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false} 
                  />
                </Document>
                
                {/* Spine shadows for realistic book divider */}
                {isLeftPage && (
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/30 to-transparent pointer-events-none z-10" />
                )}
                {isRightPage && (
                  <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/30 to-transparent pointer-events-none z-10" />
                )}
              </div>
            );
          })}
        </HTMLFlipBook>
      </div>
      
      <p className="mt-6 text-gray-500 text-sm flex items-center gap-2">
        <span className="hidden md:inline">Click corners or use arrow keys to flip pages</span>
        <span className="md:hidden">Swipe to flip pages</span>
      </p>
    </div>
  );
}
