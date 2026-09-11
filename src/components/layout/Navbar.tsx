"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

const leftLinks = [
  { name: "Home", href: "/" },
  { name: "News", href: "/news" },
  { name: "Competitions", href: "/competitions" },
];

const rightLinks = [
  { name: "Magazine", href: "/magazine" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

// Combine for mobile drawer
const allLinks = [...leftLinks, ...rightLinks];

function NavItem({ link, pathname }: { link: { name: string; href: string }, pathname: string }) {
  const isActive = link.href === "/" 
    ? pathname === "/" 
    : pathname.startsWith(link.href);
    
  return (
    <Link
      href={link.href}
      className={cn(
        "text-[15px] font-medium transition-all duration-200 hover:text-maroon-600 relative py-2",
        isActive ? "text-maroon-600 font-semibold" : "text-gray-600"
      )}
    >
      {link.name}
      {isActive && (
        <motion.span 
          layoutId="activeNavUnderline"
          className="absolute left-0 right-0 -bottom-1 h-0.5 bg-maroon-500 rounded-full" 
        />
      )}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    // Check initial scroll position
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";

  return (
    <>
      {/* Spacer to prevent content from going under the fixed header on non-hero pages */}
      {!isHome && <div className="h-16 md:h-28 w-full" />}
      
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center md:top-6 md:px-6 pointer-events-none">
        <motion.div 
          layoutRoot
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "w-full md:w-auto md:min-w-[800px] pointer-events-auto transition-all duration-500 flex items-center justify-between md:justify-center h-16 md:h-20 px-4 md:px-12 relative",
            isScrolled || !isHome
              ? "bg-white/70 backdrop-blur-3xl backdrop-saturate-150 border-b md:border border-white/20 md:rounded-2xl shadow-lg md:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
              : "bg-transparent border-transparent shadow-none"
          )}
        >
          
          {/* Mobile view: Logo left, Menu right */}
          <Link href="/" className="flex items-center md:hidden group h-8 overflow-hidden">
            <Image
              src="/ncss-logo-name-black.png"
              alt="NCSS Logo"
              width={300}
              height={100}
              className="h-16 w-auto max-w-none object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          
          <button
            className="md:hidden p-2 -mr-2 text-gray-600 hover:text-maroon-500 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Desktop view: Left Links, Center Logo, Right Links */}
          <div className="hidden md:flex items-center w-full max-w-4xl">
            <LayoutGroup>
              {/* Left Links */}
              <motion.nav 
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex justify-end items-center gap-8 pr-8"
              >
                {leftLinks.map((link) => (
                  <NavItem key={link.name} link={link} pathname={pathname} />
                ))}
              </motion.nav>

              {/* Center Logo */}
              <Link href="/" className="flex-shrink-0 group mx-4 hover:scale-[1.03] transition-transform duration-300 relative z-10 flex items-center h-11 overflow-hidden">
                <Image
                  src="/ncss-logo-name-black.png"
                  alt="NCSS Logo"
                  width={300}
                  height={100}
                  className="h-24 w-auto max-w-none object-contain"
                />
              </Link>

              {/* Right Links */}
              <motion.nav 
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex justify-start items-center gap-8 pl-8"
              >
                {rightLinks.map((link) => (
                  <NavItem key={link.name} link={link} pathname={pathname} />
                ))}
              </motion.nav>
            </LayoutGroup>
          </div>
        </motion.div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl pointer-events-auto overflow-hidden"
            >
              <nav className="flex flex-col p-4 space-y-2">
                {allLinks.map((link) => {
                  const isActive = link.href === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        "text-lg font-medium px-4 py-3 rounded-2xl transition-colors",
                        isActive ? "bg-maroon-50 text-maroon-600" : "text-gray-700 hover:bg-gray-50 hover:text-maroon-600"
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
