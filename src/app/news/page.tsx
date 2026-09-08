import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">News & Updates</h1>
        <p className="text-lg text-gray-600">
          Explore articles, research papers, and event recaps written by our members and guest contributors.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12 border-b border-gray-100 pb-4">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <button className="px-5 py-2 rounded-full bg-maroon-600 text-white font-medium text-sm whitespace-nowrap transition-colors">
            All
          </button>
          <button className="px-5 py-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium text-sm whitespace-nowrap transition-colors">
            Updates
          </button>
          <button className="px-5 py-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium text-sm whitespace-nowrap transition-colors">
            Events
          </button>
          <button className="px-5 py-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium text-sm whitespace-nowrap transition-colors">
            Research
          </button>
        </div>
        <div className="w-full md:w-auto flex-shrink-0">
          <input 
            type="text" 
            placeholder="Search news..." 
            className="px-5 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-maroon-500 w-full md:w-72 bg-gray-50/50 shadow-sm text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Link href={`/news/post-${i}`} key={i} className="group flex flex-col">
            <div className="rounded-2xl overflow-hidden mb-4 border border-gray-100 bg-white hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-200 w-full relative">
                 <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    1:1 Cover Image
                  </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-maroon-500 tracking-wider uppercase">Science</span>
                  <span className="text-xs text-gray-400">Oct 12, 2023</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-maroon-600 transition-colors">
                  The Future of Quantum Computing in Education {i}
                </h2>
                <p className="text-gray-600 text-sm line-clamp-2">
                  An exploration of how quantum mechanics could revolutionize the way we process information and solve complex problems in schools.
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Button variant="outline">Load More</Button>
      </div>
    </div>
  );
}
