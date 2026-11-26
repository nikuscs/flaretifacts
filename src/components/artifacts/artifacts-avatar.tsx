'use client';

import { cn } from 'cn';
import { useState } from 'react';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import UserIcon from '~icons/lucide/user';

interface ArtifactsAvatarProps {
  name?: string;
  src?: string | null;
  emoji?: string;
  size: keyof typeof ARTIFACTS_UI.avatars;
  tone?: keyof typeof ARTIFACTS_UI.tones;
}

export function ArtifactsAvatar({ name = '', src, emoji, size, tone }: ArtifactsAvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const sizes = ARTIFACTS_UI.avatars[size];
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join('');

  return (
    <span className="relative inline-flex shrink-0" title={name || undefined}>
      {src && failed !== src ? (
        <img
          alt=""
          className={cn('shrink-0 rounded-full border bg-muted object-cover', sizes.box)}
          loading="lazy"
          src={src}
          onError={() => setFailed(src)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'grid shrink-0 place-items-center rounded-full border bg-muted leading-none text-foreground/80 select-none [&_svg]:size-4',
            sizes.box,
            emoji ? sizes.emoji : ['font-semibold tracking-wide uppercase', sizes.initials],
          )}
        >
          {emoji ?? (initials === '' ? <UserIcon /> : initials)}
        </span>
      )}
      {tone ? <span aria-hidden="true" className={cn('absolute right-0 bottom-0 rounded-full ring-2 ring-card', sizes.dot, ARTIFACTS_UI.tones[tone])} /> : null}
    </span>
  );
}
