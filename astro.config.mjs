// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Astro config. Output is fully static (no SSR). Vercel auto-detects the
// `dist/` directory after `npm run build`. The React integration is only
// used for the assessment quiz (interactive island); every other page is
// pure server-rendered HTML.
export default defineConfig({
  site: 'https://www.danijelpevec.com',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      // Pair every HR URL with its EN counterpart and vice-versa. HR is the
      // default locale and sits at the root; EN lives under /en/.
      i18n: {
        defaultLocale: 'hr',
        locales: { hr: 'hr', en: 'en' },
      },
      filter: (page) =>
        !page.includes('/admin') && !page.includes('/api/'),
    }),
  ],
  // Emit /blog/index.html, /assessment/index.html — clean URLs at every depth,
  // and the HR root resolves to /hr/ rather than /hr.html.
  build: {
    format: 'directory',
  },
});
