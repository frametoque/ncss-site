import { Calendar, User } from "lucide-react";
import pool from "@/lib/db";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const res = await pool.query('SELECT title, excerpt FROM "post" WHERE slug = $1', [slug]);
  if (res.rows.length === 0) return {};
  const post = res.rows[0];
  
  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} from the Nalanda College Science Society.`,
    openGraph: {
      title: post.title,
      description: post.excerpt,
    }
  };
}
export default async function NewsDetailsPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const newsRes = await pool.query('SELECT * FROM "post" WHERE slug = $1', [slug]);
  if (newsRes.rows.length === 0) {
    notFound();
  }
  const newsItem = newsRes.rows[0];

  return (
    <article className="container mx-auto px-4 md:px-8 pt-8 pb-16 md:py-16 max-w-[1600px]">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-20 items-start">
        {/* Main Content Column */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-3 lg:mb-6">
            <span className="font-semibold text-maroon-600 tracking-wider uppercase bg-maroon-50 px-3 py-1 rounded-md text-sm">
              {newsItem.category}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-900 mb-3 lg:mb-6 leading-tight">
            {newsItem.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-gray-500 text-sm mb-5 lg:mb-10 pb-5 lg:pb-10 border-b border-gray-100">
            <div className="flex items-center gap-2">
               <Calendar className="h-4 w-4" />
               <span>{new Date(newsItem.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{newsItem.author}</span>
            </div>
          </div>

          {/* Mobile Image (Hidden on Desktop) */}
          <div className="lg:hidden w-full bg-gray-100 rounded-3xl flex items-center justify-center border border-gray-200 overflow-hidden shadow-xl mb-8">
            {newsItem.coverImage ? (
              <div className="w-full relative aspect-video">
                <Image src={newsItem.coverImage} alt={newsItem.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center">
                <span className="text-gray-400 font-medium text-lg">Cover Image Placeholder</span>
              </div>
            )}
          </div>
          
          <div 
            className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-a:text-maroon-600 hover:prose-a:text-maroon-800 prose-blockquote:border-l-maroon-500 prose-blockquote:bg-maroon-50 prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-gray-700 break-words whitespace-pre-wrap overflow-hidden"
            dangerouslySetInnerHTML={{ __html: newsItem.content }}
          />
        </div>

        {/* Right Side: Desktop Image */}
        <div className="hidden lg:flex relative sticky top-24 justify-center">
          <div className="w-full max-w-md bg-gray-100 rounded-3xl flex items-center justify-center border border-gray-200 overflow-hidden shadow-2xl">
            {newsItem.coverImage ? (
              <div className="w-full relative aspect-video">
                <Image src={newsItem.coverImage} alt={newsItem.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center">
                <span className="text-gray-400 font-medium text-lg">Cover Image Placeholder</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
