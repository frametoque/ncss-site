import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 text-gray-400 mb-8 shadow-inner border border-gray-100">
          <Search className="w-10 h-10" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black font-heading text-maroon-900 mb-4 tracking-tight">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Page Not Found</h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto mb-10 leading-relaxed">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="rounded-xl px-8" asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
          <Button variant="outline" size="lg" className="rounded-xl px-8" asChild>
            <Link href="/news">Read Latest News</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
}
