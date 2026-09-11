import pool from "@/lib/db";
import { Metadata } from "next";
import { NewsClient } from "./NewsClient";
import { SlideUp } from "@/components/animations/SlideUp";

export const metadata: Metadata = {
  title: "News",
  description: "Read the latest news, announcements, and research articles from the Nalanda College Science Society.",
};

export default async function NewsPage() {
  // Fetch all posts
  const newsRes = await pool.query('SELECT * FROM "post" ORDER BY "createdAt" DESC');
  const news = newsRes.rows;

  // Fetch unique categories that have been created in the admin dashboard
  const catRes = await pool.query('SELECT DISTINCT category FROM "post" WHERE category IS NOT NULL ORDER BY category ASC');
  const categories = catRes.rows.map(row => row.category);

  return (
    <div className="container mx-auto px-4 py-16">
      <SlideUp className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-6">News</h1>
        <p className="text-lg text-gray-600">
          Explore articles, research papers, and event recaps written by our members and guest contributors.
        </p>
      </SlideUp>

      <NewsClient initialPosts={news} categories={categories} />
    </div>
  );
}
