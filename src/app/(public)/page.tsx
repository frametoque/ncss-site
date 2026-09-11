import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trophy, Users, Calendar, Bell, Lightbulb } from "lucide-react";
import { HeroCanvas } from "@/components/ui/HeroCanvas";
import { HeroLogo } from "@/components/ui/HeroLogo";
import { MatrixRain } from "@/components/ui/MatrixRain";
import { AnimatedCounters } from "@/components/ui/AnimatedCounters";
import { MagazineCTA } from "@/components/sections/MagazineCTA";
import { EKuppiyaCTA } from "@/components/sections/EKuppiyaCTA";
import { InstagramSlider } from "@/components/ui/InstagramSlider";
import pool from "@/lib/db";
import { isCompetitionEnded } from "@/lib/utils";
import { SlideUp } from "@/components/animations/SlideUp";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerGroup";

export default async function Home() {
  const compRes = await pool.query('SELECT * FROM "competition" ORDER BY "createdAt" DESC');
  const competitions = compRes.rows;
  
  const upcomingCompetitions = competitions.filter(comp => !isCompetitionEnded(comp)).slice(0, 3);

  const newsRes = await pool.query('SELECT * FROM "post" ORDER BY "createdAt" DESC LIMIT 4');
  const news = newsRes.rows;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-maroon-50 min-h-screen flex items-center justify-center group">
        {/* Matrix Rain Interactive Background */}
        <MatrixRain />
        
        {/* Three.js Floating Icons */}
        <HeroCanvas />
        
        {/* Optional subtle gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-0 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl flex flex-col items-center justify-center mt-12 md:mt-24">
          
          <SlideUp delay={0.1}>
            <HeroLogo />
          </SlideUp>
          
          <SlideUp delay={0.2}>
            <h1 className="text-5xl md:text-7xl font-bold font-heading text-gray-900 mb-6 leading-tight">
              Nalanda College <br className="hidden md:block" />
              <span className="text-maroon-600">Science Society</span>
            </h1>
          </SlideUp>
          
          <SlideUp delay={0.3}>
            <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-2xl mx-auto font-medium">
              Fostering scientific inquiry, critical thinking, and innovation among students since its inception. Join us in our journey of discovery.
            </p>
          </SlideUp>
          
          <SlideUp delay={0.4} className="w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-lg shadow-maroon-500/30" asChild>
                <Link href="/news">
                  Explore News <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white" asChild>
                <Link href="/about">About Us</Link>
              </Button>
            </div>
          </SlideUp>
        </div>
      </section>

      {/* Stats Section */}
      <AnimatedCounters />

      {/* Competitions Preview Section */}
      {upcomingCompetitions.length > 0 && (
        <section className="py-24 bg-white border-b border-gray-100">
          <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-4">Upcoming Competitions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Test your knowledge and showcase your skills in our society competitions.</p>
          </FadeIn>
          
          <StaggerContainer className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {upcomingCompetitions.map((comp) => (
              <StaggerItem key={comp.id}>
                <Link href={`/competitions/${comp.slug}`} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full">
                  <div className="aspect-square bg-gray-100 w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-maroon-900/5 group-hover:bg-transparent transition-colors z-10" />
                    {comp.coverImage ? (
                      <Image src={comp.coverImage} alt={comp.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                        1:1 Cover Image
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1 items-center text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-maroon-600 transition-colors leading-snug">
                      {comp.title}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-maroon-500" />
                      <span>{comp.deadline || comp.date}</span>
                    </div>
                    <div className="mt-auto pt-4 w-full border-t border-gray-100 flex justify-center">
                      <span className="text-maroon-600 text-sm font-bold inline-flex items-center group-hover:underline underline-offset-4">
                        View Details <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <FadeIn delay={0.4} className="mt-12 text-center">
            <Button size="lg" className="rounded-xl shadow-md" asChild>
              <Link href="/competitions">View All Competitions <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </FadeIn>
          </div>
        </section>
      )}

      {/* Latest Blog Posts Preview */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 mb-4">Latest News</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Read our latest articles, research summaries, and event recaps written by our members.</p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {news.map((post) => (
              <StaggerItem key={post.id} className="h-full">
                <Link href={`/news/${post.slug}`} className="group flex flex-col h-full">
                  <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg transition-shadow flex flex-col h-full">
                    <div className="aspect-square bg-gray-200 w-full relative shrink-0">
                      {post.coverImage ? (
                        <Image src={post.coverImage} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          Cover Image
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold text-maroon-500 tracking-wider uppercase">{post.category}</span>
                        <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-maroon-600 transition-colors line-clamp-2 h-[3.5rem] leading-snug">
                        {post.title}
                      </h3>
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
            ))}
          </StaggerContainer>

          <FadeIn delay={0.4} className="mt-12 text-center">
            <Button size="lg" className="rounded-xl shadow-md" asChild>
              <Link href="/news">View All News <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <InstagramSlider />

      {/* Newest Magazine Release */}
      <MagazineCTA />

      {/* E-Kuppiya Section */}
      <EKuppiyaCTA />

      {/* About Section Preview */}
      <section className="py-32 relative flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/cover.jpg')" }}
        />
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10" />
        
        <FadeIn className="container mx-auto px-4 text-center max-w-3xl relative z-20 text-white drop-shadow-xl">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-8">Our Legacy & Mission</h2>
          <p className="text-xl text-maroon-50 mb-10 leading-relaxed font-medium">
            Since its founding, the Nalanda College Science Society has been at the forefront of scientific exploration within the school. We strive to bridge the gap between theoretical learning and practical application, inspiring the next generation of innovators and thinkers.
          </p>
          <Button size="lg" className="rounded-xl h-14 px-8 text-lg bg-white text-maroon-900 hover:bg-gray-100 shadow-lg shadow-black/30" asChild>
            <Link href="/about">Learn More About Us <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </FadeIn>
      </section>
    </div>
  );
}
