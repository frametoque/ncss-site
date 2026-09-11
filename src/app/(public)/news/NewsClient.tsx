"use client";

import { useState } from "react";
import { Calendar, User, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerGroup";

export function NewsClient({ initialPosts, categories }: { initialPosts: any[], categories: string[] }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = initialPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || 
                          (post.excerpt && post.excerpt.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-12 border-b border-gray-100 pb-6">
        <div className="flex flex-wrap justify-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory("All")}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === "All" ? "bg-maroon-600 text-white shadow-md shadow-maroon-600/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${selectedCategory === cat ? "bg-maroon-600 text-white shadow-md shadow-maroon-600/20" : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-full md:w-auto flex-shrink-0">
          <input 
            type="text" 
            placeholder="Search news..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-500 w-full md:w-72 bg-gray-50/50 shadow-sm text-sm transition-all focus:bg-white"
          />
        </div>
      </div>

      <StaggerContainer key={selectedCategory + search} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredPosts.length > 0 ? filteredPosts.map((post) => (
          <StaggerItem key={post.id} className="h-full">
            <Link href={`/news/${post.slug}`} className="group flex flex-col h-full">
              <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg transition-shadow flex flex-col h-full">
                <div className="w-full relative shrink-0 bg-gray-50 overflow-hidden">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-full h-auto block transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center text-gray-400">
                      1:1 Cover Image
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-maroon-500 tracking-wider uppercase">{post.category}</span>
                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-maroon-600 transition-colors line-clamp-2 h-[3.5rem] leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-2 h-[2.5rem] leading-relaxed mb-4 mt-auto">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm font-semibold text-maroon-600 mt-auto">
                    Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          </StaggerItem>
        )) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            No news articles found matching your criteria.
          </div>
        )}
      </StaggerContainer>

      {filteredPosts.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </>
  );
}
