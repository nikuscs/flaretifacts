import Link from 'next/link';
import { ShellThemeToggle } from '@/components/shell/shell-theme-toggle';
import { SHELL } from '@/constants/shell.constants';
import type { ReactNode } from 'react';

interface ShellHeaderProps {
  defaultDark: boolean;
  signedIn: boolean;
  children?: ReactNode;
}

export function ShellHeader({ defaultDark, signedIn, children }: ShellHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-(--shell-header) shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-8">
      {signedIn ? (
        <Link className="flex items-center gap-2 text-sm font-medium" href="/">
          <img
            alt=""
            className="size-6 rounded-full"
            height={24}
            src={SHELL.logo}
            width={24}
          />
          {SHELL.appName}
        </Link>
      ) : (
        <span className="flex items-center gap-2 text-sm font-medium">
          <img
            alt=""
            className="size-6 rounded-full"
            height={24}
            src={SHELL.logo}
            width={24}
          />
          {SHELL.appName}
        </span>
      )}
      <div className="flex-1">{children}</div>
      <ShellThemeToggle defaultDark={defaultDark} />
    </header>
  );
}
