"use client";

import React, { useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure the worker correctly for Next.js App Router
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;



interface FlipbookProps {
  pdfUrl: string;
}

export default function Flipbook({ pdfUrl }: FlipbookProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1000));
  const [windowHeight, setWindowHeight] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 800));

  const pdfOptions = React.useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const flipBookRef = React.useRef<React.ElementRef<typeof HTMLFlipBook> | null>(null);

  useEffect(() => {
    // Create Audio instance on client mount for reliable playback
    const audio = new Audio('/sounds/page-flip-02.wav');
    audio.volume = 0.5;
    audio.preload = 'auto';
    audioRef.current = audio;

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
        (flipBookRef.current as { pageFlip: () => { flipNext: () => void } }).pageFlip().flipNext();
      } else if (e.key === 'ArrowLeft') {
        (flipBookRef.current as { pageFlip: () => { flipPrev: () => void } }).pageFlip().flipPrev();
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

  return (
    <div 
      className="flex flex-col items-center justify-center py-2 md:py-4 select-none w-full"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="bg-[#1a1a1a] p-2 md:p-6 rounded-xl shadow-2xl relative max-w-full overflow-hidden flex items-center justify-center">
        <Document 
          file={pdfUrl} 
          options={pdfOptions}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div 
              className="flex flex-col items-center justify-center"
              style={{ width: isMobile ? pageWidth : pageWidth * 2, height: pageHeight }}
            >
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-4 border-maroon-500 border-t-white animate-spin mb-4" />
                <p className="text-gray-400 font-medium mt-4">Loading Magazine...</p>
              </div>
            </div>
          }
        >
          {numPages && (
            /* @ts-expect-error - react-pageflip has outdated types */
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
              onChangeState={(e: { data: string }) => {
                if (e.data === 'flipping') {
                  playFlipSound();
                }
              }}
              className="flipbook-demo"
            >
              {Array.from(new Array(numPages), (el, index) => {
                const isLeftPage = index % 2 !== 0;
                const isRightPage = index !== 0 && index % 2 === 0;
                
                return (
                  <div key={`page_${index + 1}`} className="bg-white overflow-hidden flex items-center justify-center relative">
                    <Page 
                      pageNumber={index + 1} 
                      width={pageWidth} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                      renderMode="canvas"
                      devicePixelRatio={typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2}
                      loading={<div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400 text-sm">Loading...</div>}
                    />
                    
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
          )}
        </Document>
      </div>
      
      <p className="mt-6 text-gray-500 text-sm flex items-center gap-2">
        <span className="hidden md:inline">Click corners or use arrow keys to flip pages</span>
        <span className="md:hidden">Swipe to flip pages</span>
      </p>
    </div>
  );
}
