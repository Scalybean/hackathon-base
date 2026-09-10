/**
 * The two typefaces, plus a mono for code and ids. Loaded through next/font so
 * they are self-hosted with no layout shift and no request to Google at runtime.
 * Deliberately not Inter: the pairing is the app's fingerprint.
 */
import { Archivo, Fraunces, JetBrains_Mono } from 'next/font/google';

/** Display face. Fraunces' WONK and SOFT axes give headings printed character. */
export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});

/** Body face. A sturdy grotesque that holds up in dense tables and sidebars. */
export const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const fontVariables = `${fraunces.variable} ${archivo.variable} ${jetbrainsMono.variable}`;
