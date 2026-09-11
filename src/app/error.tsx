"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-50 text-red-500 mb-8 shadow-inner border border-red-100">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-5xl md:text-6xl font-black font-heading text-gray-900 mb-6 tracking-tight">Something went wrong</h1>
        <p className="text-lg text-gray-600 max-w-md mx-auto mb-10 leading-relaxed">
          We encountered an unexpected error while trying to process your request. Our technical team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="rounded-xl px-8 bg-gray-900 hover:bg-gray-800" onClick={() => reset()}>
            Try Again
          </Button>
          <Button variant="outline" size="lg" className="rounded-xl px-8" asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
}
