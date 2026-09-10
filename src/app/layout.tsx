/**
 * Root layout. Loads the fonts, resolves the theme server-side so there is no
 * flash, and mounts the single Toaster. Nothing product-specific belongs here.
 */
import type { Metadata } from 'next';

import { Toaster } from '@/components/ui/toast';
import { fontVariables } from '@/lib/fonts';
import { getTheme, themeAttribute } from '@/lib/theme';

import './globals.css';

export const metadata: Metadata = {
  title: { default: 'hackathon-base', template: '%s · hackathon-base' },
  description: 'A secure Next.js and Supabase base template.',
  // No indexing until there is a product here.
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();

  return (
    <html lang="en" data-theme={themeAttribute(theme)} className={`${fontVariables} h-full`}>
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
