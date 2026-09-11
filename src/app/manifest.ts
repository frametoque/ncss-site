import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nalanda College Science Society',
    short_name: 'NCSS',
    description: 'Official website of the Nalanda College Science Society (NCSS).',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7a0c2e',
    icons: [
      {
        src: '/favicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
