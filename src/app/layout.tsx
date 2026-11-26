import { cookies, headers } from 'next/headers';
import { ProvidersQuery } from '@/components/providers/providers-query';
import { ShellHeader } from '@/components/shell/shell-header';
import { ToastStack, ToastStackProvider } from '@/components/ui/toast-stack';
import { SHELL } from '@/constants/shell.constants';
import { usersOfRequest } from '@/services/users/users.utils';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import './globals.css';

export const metadata: Metadata = {
  title: SHELL.appName,
  applicationName: SHELL.appName,
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const preferences = await cookies();
  const dark = preferences.get('theme')?.value !== 'light';
  const user = usersOfRequest(await headers());

  return (
    <html className={dark ? 'dark' : undefined} lang="en">
      <body>
        <ProvidersQuery>
          <ToastStackProvider>
            <ShellHeader defaultDark={dark} signedIn={user !== null} />
            <main className="flex min-h-[calc(100dvh-var(--shell-header))] flex-col">{children}</main>
            <ToastStack />
          </ToastStackProvider>
        </ProvidersQuery>
      </body>
    </html>
  );
}
