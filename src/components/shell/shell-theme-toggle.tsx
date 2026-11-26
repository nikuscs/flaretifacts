'use client';

import { useState } from 'react';
import { ThemeSwitch } from '@/components/ui/theme-switch';

interface ShellThemeToggleProps {
  defaultDark: boolean;
}

export function ShellThemeToggle({ defaultDark }: ShellThemeToggleProps) {
  const [dark, setDark] = useState(defaultDark);

  const shellThemeChange = (next: boolean, trigger: HTMLButtonElement) => {
    const apply = () => {
      document.documentElement.classList.toggle('dark', next);
      document.cookie = `theme=${next ? 'dark' : 'light'}; Path=/; Max-Age=31536000; SameSite=Lax`;
      setDark(next);
    };

    if (!Object.hasOwn(Document.prototype, 'startViewTransition') || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply();
      return;
    }

    const { left, top, width, height } = trigger.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = document.startViewTransition(apply);
    void transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 480,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    }).catch(() => undefined);
  };

  return <ThemeSwitch dark={dark} onThemeChange={shellThemeChange} />;
}
