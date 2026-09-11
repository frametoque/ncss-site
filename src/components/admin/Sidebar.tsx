"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Megaphone, FileText, BookOpen, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react";

import { logout } from "@/app/admin/login/actions";

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load preference from local storage if desired
    const saved = localStorage.getItem("ncss_admin_sidebar_collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("ncss_admin_sidebar_collapsed", String(newState));
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Forms", href: "/admin/forms", icon: FileText },
    { name: "News", href: "/admin/posts", icon: FileText },
    { name: "Magazine", href: "/admin/magazines", icon: BookOpen },
    { name: "Competitions", href: "/admin/competitions", icon: Trophy },
    { name: "Executive Board", href: "/admin/board", icon: Users },
    { name: "About Content", href: "/admin/about", icon: FileText },
  ];

  if (!mounted) return <aside className="w-64 bg-maroon-900 text-white min-h-screen flex flex-col shadow-xl"></aside>;

  const visuallyCollapsed = isCollapsed && !isHovered;

  // We wrap the aside in a container so that unfolding it on hover floats over the main content 
  // without pushing it and causing jitter.
  return (
    <div className={`${isCollapsed ? "w-20" : "w-64"} flex-shrink-0 transition-all duration-300 relative z-50`}>
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${visuallyCollapsed ? "w-20" : "w-64"} bg-maroon-900 text-white min-h-screen flex flex-col shadow-xl transition-all duration-300 absolute inset-y-0 left-0 overflow-hidden`}
      >
        <div className="h-20 flex items-center px-4 relative">
          <h2 className={`absolute left-16 text-2xl font-bold tracking-tight whitespace-nowrap transition-opacity duration-300 ${visuallyCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            Admin
          </h2>
          <button
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg hover:bg-maroon-800 text-maroon-200 hover:text-white transition-all flex-shrink-0 absolute ${visuallyCollapsed ? "left-1/2 -translate-x-1/2" : "right-4"}`}
            title={isCollapsed ? "Pin Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                title={visuallyCollapsed ? item.name : undefined}
                className={`flex items-center gap-4 px-4 h-12 rounded-lg transition-colors font-medium ${isActive
                    ? "bg-white text-maroon-900 shadow-sm"
                    : "text-maroon-100 hover:bg-maroon-800 hover:text-white"
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={`whitespace-nowrap transition-opacity duration-300 ${visuallyCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-maroon-800 space-y-4 overflow-hidden">
          <form action={logout}>
            <button type="submit" title={visuallyCollapsed ? "Log out" : undefined} className={`flex items-center gap-4 px-4 h-10 w-full text-left rounded-lg transition-colors font-medium text-maroon-200 hover:bg-maroon-800 hover:text-white`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span className={`whitespace-nowrap transition-opacity duration-300 ${visuallyCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                Log out
              </span>
            </button>
          </form>
          <Link href="/" title={visuallyCollapsed ? "Back to Main Site" : undefined} className={`flex items-center gap-4 px-4 h-10 text-sm text-maroon-200 hover:text-white transition-colors font-medium`}>
            <span className="flex-shrink-0 text-lg w-5 text-center">&larr;</span>
            <span className={`whitespace-nowrap transition-opacity duration-300 ${visuallyCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              Back
            </span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
