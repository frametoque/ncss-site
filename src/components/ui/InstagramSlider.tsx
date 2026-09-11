import { getInstagramPosts } from "@/lib/instagram";
import { InstagramSliderClient } from "./InstagramSliderClient";
import Image from "next/image";


const InstagramIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export async function InstagramSlider() {
  const realPosts = await getInstagramPosts();

  return (
    <section className="py-24 bg-white border-t border-gray-100 overflow-hidden">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 p-0.5 flex-shrink-0">
              <div className="w-full h-full bg-white rounded-full p-0.5 relative overflow-hidden">
                <Image src="/ig-dp.jpg" alt="Instagram DP" fill className="object-cover rounded-full" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 flex items-center justify-center md:justify-start gap-2 mb-1">
                Recent Updates
              </h2>
              <a href="https://www.instagram.com/nalanda_science_society" target="_blank" rel="noopener noreferrer" className="text-maroon-600 font-medium hover:underline text-lg">
                @nalanda_science_society
              </a>
            </div>
          </div>
          
          <a href="https://www.instagram.com/nalanda_science_society" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg flex-shrink-0">
            <InstagramIcon className="w-5 h-5 mr-2" /> Follow on Instagram
          </a>
        </div>

        {realPosts.length > 0 ? (
          <InstagramSliderClient posts={realPosts} />
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
            No recent updates to display. Check back later!
          </div>
        )}
        
      </div>
    </section>
  );
}
