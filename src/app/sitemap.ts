import { MetadataRoute } from 'next'
import pool from "@/lib/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ncss.lk'

  // Fetch dynamic routes
  const [postsRes, compsRes, magsRes, formsRes] = await Promise.all([
    pool.query('SELECT slug, "updatedAt" FROM "post"'),
    pool.query('SELECT slug, "updatedAt" FROM "competition"'),
    pool.query('SELECT id, "updatedAt" FROM "magazine"'),
    pool.query('SELECT slug, "updatedAt" FROM "form" WHERE "isActive" = true'),
  ])

  const posts = postsRes.rows.map((post) => ({
    url: `${baseUrl}/news/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const competitions = compsRes.rows.map((comp) => ({
    url: `${baseUrl}/competitions/${comp.slug}`,
    lastModified: comp.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const magazines = magsRes.rows.map((mag) => ({
    url: `${baseUrl}/magazine/${mag.id}`,
    lastModified: mag.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const forms = formsRes.rows.map((form) => ({
    url: `${baseUrl}/forms/${form.slug}`,
    lastModified: form.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const routes = [
    '',
    '/about',
    '/news',
    '/competitions',
    '/magazine',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.9,
  }))

  return [...routes, ...posts, ...competitions, ...magazines, ...forms]
}
