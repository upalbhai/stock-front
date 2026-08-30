import { MetadataRoute } from 'next';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'MiniHisab',
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '144x144',
        type: 'image/x-icon',
      },
      {
        src: '/logo.webp',
        sizes: '512x512',
        type: 'image/webp',
      },
    ],
  };
}
