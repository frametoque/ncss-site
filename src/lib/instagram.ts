export interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
}

export async function getInstagramPosts(): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const feedUrl = process.env.INSTAGRAM_FEED_URL; // e.g., from rss.app
  
  try {
    // 1. Try official API if token exists
    if (token) {
      const res = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url&access_token=${token}&limit=24`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || [];
      }
    }
    
    // 2. Try third-party JSON feed (like rss.app) if URL exists
    if (feedUrl) {
      const res = await fetch(feedUrl, { 
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        // Map standard JSON feed format to our interface
        const items = Array.isArray(data.items) ? data.items : [];
        return items.slice(0, 24).map((item: Record<string, unknown>) => {
          const attachments = Array.isArray(item.attachments) ? item.attachments : [];
          const firstAttachmentUrl = attachments[0] && typeof attachments[0] === 'object' && 'url' in attachments[0] ? String(attachments[0].url) : '';
          return {
            id: String(item.id || Math.random().toString()),
            media_type: 'IMAGE',
            media_url: String(item.image || firstAttachmentUrl || ''),
            permalink: String(item.url || item.link || 'https://www.instagram.com/nalanda_science_society'),
            caption: String(item.content_text || item.title || item.summary || ''),
          };
        });
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching Instagram posts:", error);
    return [];
  }
}
