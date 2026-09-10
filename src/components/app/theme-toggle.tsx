/** Cycles light -> dark -> system. Writes a cookie server-side, then refreshes. */
'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Moon, Sun } from 'lucide-react';

import { setTheme } from '@/app/actions/theme';
import { Button } from '@/components/ui/button';

const ORDER = ['light', 'dark', 'system'] as const;
const ICONS = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle({ theme }: { theme: 'light' | 'dark' | 'system' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const Icon = ICONS[theme];

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    startTransition(async () => {
      await setTheme(next);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      disabled={pending}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />
    </Button>
  );
}
