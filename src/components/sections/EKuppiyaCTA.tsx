import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, MonitorPlay } from "lucide-react";
import Image from "next/image";

export function EKuppiyaCTA() {
  return (
    <section className="py-24 bg-gray-50 border-b border-gray-100 overflow-hidden relative">
      <div className="absolute top-0 left-0 -ml-32 -mt-32 w-96 h-96 rounded-full bg-maroon-100 blur-3xl opacity-50" />

      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-center gap-16 max-w-6xl relative z-10">
        <div className="flex-1 text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-2 font-semibold bg-maroon-50 px-3 py-1 rounded-xl text-sm text-maroon-600 justify-center lg:justify-start">
            <MonitorPlay className="h-4 w-4" />
            <span>Digital Learning</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-900 leading-tight">
            NCSS <span className="text-maroon-600">E-Kuppiya</span>
          </h2>

          <div className="space-y-6 text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
            <p>
              Initiated as a groundbreaking effort to make quality academic resources freely accessible to students across Sri Lanka. What began as a simple Google Drive repository has evolved into a dedicated platform designed for organized and convenient learning.
            </p>
            <p>
              The platform brings together G.C.E. Advanced Level past papers from 1990-2025, marking schemes, comprehensive short notes, and practical video resources all in one centralized space.
            </p>
          </div>

          <div className="pt-4 flex justify-center lg:justify-start">
            <Button size="lg" className="rounded-xl h-14 px-8 text-lg shadow-lg shadow-maroon-500/20" asChild>
              <Link href="https://ncsskuppiya.netlify.app/" target="_blank" rel="noopener noreferrer">
                Explore E-Kuppiya <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="w-full lg:w-[500px] shrink-0 mt-12 lg:mt-0">
          <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            <Image
              src="/kuppiya.webp"
              alt="NCSS E-KUPPIYA"
              fill
              sizes="(max-width: 1024px) 100vw, 500px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
