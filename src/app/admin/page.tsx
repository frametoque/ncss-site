import pool from "@/lib/db";
import Link from "next/link";
import { Megaphone, FileText, BookOpen, Trophy, Users, ArrowRight, ClipboardList } from "lucide-react";

async function getStats() {
  const [posts, magazines, competitions, team, formsTotal, formsActive] = await Promise.all([
    pool.query('SELECT count(*) FROM "post"'),
    pool.query('SELECT count(*) FROM "magazine"'),
    pool.query('SELECT count(*) FROM "competition"'),
    pool.query('SELECT count(*) FROM "executiveBoard"'),
    pool.query('SELECT count(*) FROM "form"'),
    pool.query('SELECT count(*) FROM "form" WHERE "isActive" = true')
  ]);

  return {
    posts: parseInt(posts.rows[0].count),
    magazines: parseInt(magazines.rows[0].count),
    competitions: parseInt(competitions.rows[0].count),
    team: parseInt(team.rows[0].count),
    forms: {
      total: parseInt(formsTotal.rows[0].count),
      active: parseInt(formsActive.rows[0].count)
    }
  };
}

export const metadata = {
  title: "Admin Dashboard | Nalanda College Science Society",
  description: "Manage content, view submissions, and configure the website.",
};

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { title: "Posts", count: stats.posts, icon: FileText, href: "/admin/posts" },
    { title: "Magazines", count: stats.magazines, icon: BookOpen, href: "/admin/magazines" },
    { title: "Competitions", count: stats.competitions, icon: Trophy, href: "/admin/competitions" },
    { title: "Executive Board", count: stats.team, icon: Users, href: "/admin/board" },
    { 
      title: "Forms", 
      count: (
        <span className="flex items-baseline gap-2">
          {stats.forms.total} 
          <span className="text-sm font-medium text-maroon-600/70">
            ({stats.forms.active} Active)
          </span>
        </span>
      ), 
      icon: ClipboardList, 
      href: "/admin/forms" 
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-maroon-900">Dashboard Overview</h1>
        <p className="text-maroon-700/70 mt-2">Manage all the content on your website from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="group block">
            <div className="bg-white rounded-xl shadow border border-maroon-100 p-6 hover:shadow-lg hover:border-maroon-300 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-maroon-700/70">{card.title}</p>
                  <p className="text-3xl font-bold text-maroon-900 mt-2">{card.count}</p>
                </div>
                <div className="p-4 rounded-full text-white bg-maroon-600 group-hover:bg-maroon-700 transition-colors">
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-maroon-600 group-hover:text-maroon-800">
                Manage <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
