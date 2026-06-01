// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import sentry from '@sentry/astro';

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
    // Sentry — client + page SSR error reporting. Reads dsn + auth from
    // env vars; integration is a no-op when SENTRY_DSN is unset (dev /
    // forked deploys still build cleanly). Fine-grained config lives in
    // sentry.client.config.js + sentry.server.config.js at project root.
    sentry({
      dsn: process.env.SENTRY_DSN,
      sourceMapsUploadOptions: {
        project: process.env.SENTRY_PROJECT || 'danijelpevec',
        org: process.env.SENTRY_ORG,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
  ],
  // Emit /blog/index.html, /assessment/index.html — clean URLs at every depth,
  // and the HR root resolves to /hr/ rather than /hr.html.
  build: {
    format: 'directory',
  },
  // Vite-level build options.
  // - `sourcemap: 'hidden'` emits .map files (so Sentry can upload +
  //   symbolicate) but strips the //# sourceMappingURL= reference from
  //   the bundled JS — browsers won't fetch them, public source maps
  //   don't ship.
  // - `define` exposes the server-side SENTRY_DSN to client code
  //   without needing a separate PUBLIC_SENTRY_DSN env var on Vercel.
  //   The Astro Sentry integration above passes DSN to server init;
  //   this define passes the same value through Vite into client bundles
  //   so sentry.client.config.js can read it.
  vite: {
    build: {
      sourcemap: 'hidden',
    },
    define: {
      __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN ?? ''),
    },
  },
});
