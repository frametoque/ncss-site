import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import pool from "@/lib/db";

export async function MagazineCTA() {
  const magRes = await pool.query('SELECT * FROM "magazine" ORDER BY "createdAt" DESC LIMIT 1');

  if (magRes.rows.length === 0) return null;

  const latest = magRes.rows[0];

  return (
    <section className="py-24 bg-maroon-700 text-white relative overflow-hidden">
      {/* Background decorative circle */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-maroon-800 blur-3xl opacity-50" />

      <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-center gap-16 max-w-5xl">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 font-semibold bg-maroon-800 px-3 py-1 rounded-xl text-sm mb-6 text-maroon-100">
            <BookOpen className="h-4 w-4" />
            <span>Latest Release</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
            {latest.title} is out now!
          </h2>
          <p className="text-maroon-50 text-lg mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
            Explore the latest breakthroughs, student research papers, and stunning scientific photography in our Pulse Quest Magazine. Available now for digital reading.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button size="lg" className="bg-white text-maroon-700 hover:bg-gray-100 rounded-xl h-14 px-8 text-lg font-bold" asChild>
              <Link href={`/magazine/${latest.slug}`}>Read Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="border-maroon-400 text-maroon-50 hover:bg-maroon-800 hover:text-white rounded-xl h-14 px-8 text-lg font-bold" asChild>
              <Link href="/magazine">All Issues</Link>
            </Button>
          </div>
        </div>
        <div className="w-64 md:w-80 shrink-0 relative group perspective-[1000px]">
          {/* Book cover with real image */}
          <div className="w-full aspect-[3/4] rounded-r-xl rounded-l-md shadow-[20px_20px_40px_rgba(0,0,0,0.4)] -rotate-y-12 rotate-x-6 group-hover:rotate-y-0 group-hover:rotate-x-0 transition-transform duration-500 transform-style-3d relative overflow-hidden">
            <Image
              src={latest.outNowImage || "/publications/vol3-outnow.png"}
              alt={latest.title}
              fill
              className="object-cover"
            />
            {/* Binder edge */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/20 rounded-l-sm" />
          </div>
        </div>
      </div>
    </section>
  );
}
