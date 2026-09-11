"use client";

import { useRef, useState, useEffect } from "react";

import Image from "next/image";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const ChevronLeft = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

export function InstagramSliderClient({ posts }: { posts: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Modal state
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [posts]);

  // Handle escape key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPost(null);
    };
    if (selectedPost) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedPost]);

  const scrollBy = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320 + 16; 
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <>
      <div className="relative group">
        {/* Scrollable track */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-8 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {posts.map((post) => (
            <button 
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative h-[280px] sm:h-[360px] flex-shrink-0 snap-center sm:snap-start rounded-none overflow-hidden group/post shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-100 cursor-pointer"
            >
              <Image 
                src={(('thumbnail_url' in post && post.thumbnail_url) ? post.thumbnail_url : post.media_url) as string} 
                alt="Instagram Post" 
                loading="lazy"
                width={320}
                height={320}
                className="h-full w-auto min-w-[200px] object-cover transition-transform duration-700 group-hover/post:scale-110" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover/post:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <InstagramIcon className="text-white opacity-0 group-hover/post:opacity-100 transform scale-50 group-hover/post:scale-100 transition-all duration-300 w-12 h-12" />
              </div>
            </button>
          ))}
        </div>

        {/* Navigation Arrows */}
        {canScrollLeft && (
          <button 
            onClick={() => scrollBy("left")}
            className="absolute left-0 top-1/2 -translate-y-[calc(50%+1rem)] -ml-4 md:-ml-6 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg backdrop-blur z-10 transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Previous posts"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {canScrollRight && (
          <button 
            onClick={() => scrollBy("right")}
            className="absolute right-0 top-1/2 -translate-y-[calc(50%+1rem)] -mr-4 md:-mr-6 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg backdrop-blur z-10 transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Next posts"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Instagram Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
            onClick={() => setSelectedPost(null)}
          />
          
          <div className="relative w-full max-w-5xl max-h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 border border-gray-100">
            {/* Close Button (Mobile float, Desktop float) */}
            <button 
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors md:hidden"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* Image Section */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-0 relative">
              <Image 
                src={(('thumbnail_url' in selectedPost && selectedPost.thumbnail_url) ? selectedPost.thumbnail_url : selectedPost.media_url) as string} 
                alt="Instagram Post Content" 
                width={800}
                height={800}
                className="w-full h-full object-contain max-h-[50vh] md:max-h-[85vh]"
              />
            </div>

            {/* Content/Caption Section */}
            <div className="w-full md:w-[400px] lg:w-[450px] bg-white flex flex-col max-h-[40vh] md:max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 p-0.5">
                    <Image src="/ig-dp.jpg" alt="DP" width={40} height={40} className="w-full h-full rounded-full object-cover border-2 border-white" />
                  </div>
                  <a href="https://www.instagram.com/nalanda_science_society" target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:underline">
                    nalanda_science_society
                  </a>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="hidden md:flex hover:bg-gray-100 p-2 rounded-full transition-colors"
                >
                  <XIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Caption */}
              <div className="p-4 overflow-y-auto flex-1 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                <span className="font-semibold mr-2">nalanda_science_society</span>
                {selectedPost.caption || "View more on our Instagram page! Follow us to stay updated."}
              </div>

              {/* Footer / CTA */}
              <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <a 
                  href={selectedPost.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md"
                >
                  <InstagramIcon className="w-5 h-5" />
                  View on Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
