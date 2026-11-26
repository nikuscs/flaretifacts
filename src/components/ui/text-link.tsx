import type { ReactNode } from 'react';

interface TextLinkProps {
  href?: string | null;
  children: ReactNode;
}

export function TextLink({ href, children }: TextLinkProps) {
  return href ? (
    <a
      className="underline decoration-current/0 underline-offset-2 transition-colors hover:decoration-current/40"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ) : children;
}
