import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// Base path: '/' locally and in the apps, '/<repo>/' on GitHub Pages (set by the workflow via VITE_BASE)
const base = process.env.VITE_BASE ?? '/';

// Content Security Policy for the web build (GitHub Pages cannot send headers, so it goes in a <meta> tag).
// No network access at all: every resource is local, reports are generated in the page.
const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "font-src 'self' data:", "connect-src 'self'", "worker-src 'self'", "manifest-src 'self'",
  "object-src 'none'", "base-uri 'self'", "form-action 'none'",
].join('; ');
const cspPlugin = {
  name: 'csp-meta',
  apply: 'build' as const,
  transformIndexHtml: (html: string) => html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}">\n<meta name="referrer" content="no-referrer">`),
};

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  base,
  plugins: [
    cspPlugin,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'PhySec Audit',
        short_name: 'PhySec Audit',
        description: 'Physical security audit tool (ISO 27001 · ISO 27002 · NIST SP 800-53 r5 · ASIS PAP-2021). Offline, data stays on the device.',
        lang: 'hu',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'any',
        background_color: '#F5F9FD',
        theme_color: '#F5F9FD',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: { environment: 'node' },
} as any);
