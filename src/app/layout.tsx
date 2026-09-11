/**
 * Root layout. Loads the fonts, resolves the theme server-side so there is no
 * flash, and mounts the single Toaster. Nothing product-specific belongs here.
 */
import type { Metadata, Viewport } from 'next';

import { ServiceWorker } from '@/components/app/service-worker';
import { Toaster } from '@/components/ui/toast';
import { fontVariables } from '@/lib/fonts';
import { getTheme, themeAttribute } from '@/lib/theme';

import './globals.css';

export const metadata: Metadata = {
  title: { default: 'hackathon-base', template: '%s · hackathon-base' },
  description: 'Notes that stay out of your way.',
  // No indexing until there is a product here.
  robots: { index: false, follow: false },
  applicationName: 'Base',
  // Installed on iOS, where there is no manifest support for display mode.
  appleWebApp: { capable: true, title: 'Base', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

/**
 * The browser chrome colour, matched to the palette so an installed window
 * does not show a white bar above a dark app.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f2' },
    { media: '(prefers-color-scheme: dark)', color: '#100e0c' },
  ],
  // Installed apps extend under the status bar on notched devices.
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();

  return (
    <html lang="en" data-theme={themeAttribute(theme)} className={`${fontVariables} h-full`}>
      <body className="min-h-full">
        {children}
        <Toaster />
        <ServiceWorker />
      </body>
    </html>
  );
}
