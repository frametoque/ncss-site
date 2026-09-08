import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, Trophy, Users, Calendar, FlaskConical, Bell, Lightbulb } from "lucide-react";
import { HeroCanvas } from "@/components/ui/HeroCanvas";
import { MatrixRain } from "@/components/ui/MatrixRain";
import { AnimatedCounters } from "@/components/ui/AnimatedCounters";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-maroon-50 min-h-[calc(100vh-4rem)] flex items-center justify-center group">
        {/* Matrix Rain Interactive Background */}
        <MatrixRain />
        
        {/* Three.js Floating Icons around Logo */}
        <HeroCanvas />
        
        {/* Optional subtle gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-0 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl flex flex-col items-center pt-48">
          
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-gray-900 mb-6 leading-tight">
            Nalanda College <br className="hidden md:block" />
            <span className="text-maroon-600">Science Society</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto font-medium">
            Fostering scientific inquiry, critical thinking, and innovation among students since its inception. Join us in our journey of discovery.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-maroon-500/30" asChild>
              <Link href="/news">
                Explore News <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full bg-white/50 backdrop-blur-sm hover:bg-white" asChild>
              <Link href="/about">About Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Announcement Bar (Between Hero and Counters) */}
      <section className="bg-maroon-600 border-y border-maroon-700 text-white relative z-20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 font-semibold bg-maroon-700/50 px-3 py-1 rounded-full text-sm">
              <Bell className="h-4 w-4" />
              <span>Latest Announcement</span>
            </div>
            <p className="text-sm md:text-base font-medium truncate max-w-2xl">
              Registration for the Inter-School Science Olympiad 2024 is now open! 
            </p>
            <Link href="/competitions" className="text-sm font-bold text-maroon-100 hover:text-white underline underline-offset-2 whitespace-nowrap">
              Register Now
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <AnimatedCounters />

      {/* Competitions Preview Section */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-4">Upcoming Events & Competitions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Test your knowledge and showcase your skills in our society events.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: "Science Olympiad '24", date: "March 15, 2024", isEnded: false },
              { title: "Nalanda Astro Quiz", date: "Feb 10 - Feb 20, 2024", isEnded: false },
              { title: "Annual Science Fair", date: "Nov 5, 2023", isEnded: true }
            ].map((comp, i) => (
              <Link href="/competitions" key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 flex flex-col">
                <div className="aspect-square bg-gray-100 w-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-maroon-900/5 group-hover:bg-transparent transition-colors z-10" />
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                    1:1 Cover Image
                  </div>
                  {comp.isEnded && (
                    <div className="absolute top-4 right-4 z-20">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm bg-white/90 text-gray-700 border border-gray-200">
                        Event Ended
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 text-maroon-500" />
                    <span>{comp.date}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-maroon-600 transition-colors leading-snug">
                    {comp.title}
                  </h3>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <span className="text-maroon-600 text-sm font-bold inline-flex items-center group-hover:underline underline-offset-4">
                      View Details <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" className="rounded-full shadow-md" asChild>
              <Link href="/competitions">View All Competitions <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts Preview */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold font-heading text-gray-900 mb-4">News & Updates</h2>
              <p className="text-gray-600 max-w-2xl text-lg">Read our latest articles, research summaries, and event recaps written by our members.</p>
            </div>
            <Button variant="outline" className="shrink-0 rounded-full" asChild>
              <Link href="/news">View all news <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Placeholder Cards */}
            {[1, 2, 3].map((i) => (
              <Link href={`/news/placeholder-${i}`} key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                <div className="aspect-square bg-gray-200 w-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-maroon-900/10 group-hover:bg-transparent transition-colors z-10" />
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                    1:1 Image
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3 text-xs">
                    <span className="font-semibold text-maroon-600 tracking-wider uppercase bg-maroon-50 px-2 py-1 rounded-md">Update</span>
                    <span className="text-gray-400">Oct 12, 2023</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-maroon-600 transition-colors leading-snug">
                    Sample News Article {i}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                    This is a placeholder excerpt for the news post. In the actual implementation, this will fetch real data from the database.
                  </p>
                  <span className="text-maroon-600 text-sm font-bold inline-flex items-center group-hover:underline underline-offset-4">
                    Read article <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newest Magazine Release */}
      <section className="py-24 bg-maroon-900 text-white relative overflow-hidden">
        {/* Background decorative circle */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-maroon-800 blur-3xl opacity-50" />
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-center gap-16 max-w-5xl">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 font-semibold bg-maroon-800 px-3 py-1 rounded-full text-sm mb-6 text-maroon-200">
              <BookOpen className="h-4 w-4" />
              <span>Latest Release</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">Volume 12 is out now!</h2>
            <p className="text-maroon-100 text-lg mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
              Explore the latest breakthroughs, student research papers, and stunning scientific photography in our annual society magazine. Available now for digital download.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button size="lg" className="bg-white text-maroon-900 hover:bg-gray-100 rounded-full h-14 px-8 text-lg" asChild>
                <Link href="/magazines">View Issue <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="border-maroon-400 text-maroon-50 hover:bg-maroon-800 rounded-full h-14 px-8 text-lg" asChild>
                <Link href="/magazines">Past Issues</Link>
              </Button>
            </div>
          </div>
          <div className="w-64 md:w-80 shrink-0 relative group perspective-[1000px]">
             {/* Book cover placeholder */}
             <div className="w-full aspect-[3/4] bg-gradient-to-tr from-maroon-950 to-maroon-800 border-4 border-white/10 rounded-r-xl rounded-l-md shadow-[20px_20px_40px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center -rotate-y-12 rotate-x-6 group-hover:rotate-y-0 group-hover:rotate-x-0 transition-transform duration-500 transform-style-3d">
               <FlaskConical className="h-16 w-16 text-maroon-300 mb-4 opacity-50" />
               <span className="text-maroon-100 font-heading text-3xl font-bold text-center px-4">NCSS<br/>Magazine</span>
               <span className="text-maroon-400 mt-2 font-medium tracking-widest">VOL. 12</span>
               {/* Binder edge */}
               <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/20 rounded-l-sm" />
             </div>
          </div>
        </div>
      </section>

      {/* About Section Preview */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center justify-center p-4 bg-maroon-50 rounded-full mb-8">
            <Users className="h-10 w-10 text-maroon-600" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-gray-900 mb-8">Our Legacy & Mission</h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium">
            Since its founding, the Nalanda College Science Society has been at the forefront of scientific exploration within the school. We strive to bridge the gap between theoretical learning and practical application, inspiring the next generation of innovators and thinkers.
          </p>
          <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-lg shadow-maroon-500/20" asChild>
            <Link href="/about">Learn More About Us <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
