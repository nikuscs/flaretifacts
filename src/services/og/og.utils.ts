import { createElement } from 'react';
import { OG } from '@/services/og/og.constants';
import type { OgCard } from '@/types/og.types';

export function ogCardElement(card: OgCard) {
  const title = card.title.length > OG.titleMax ? `${card.title.slice(0, OG.titleMax - 1)}…` : card.title;

  return createElement('div', {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 36,
      padding: '80px 96px',
      backgroundColor: '#0b0b0f',
      backgroundImage: OG.background,
      color: '#fafafa',
      fontFamily: OG.font,
    },
  }, createElement('div', { style: { display: 'flex', fontSize: 88 } }, card.emoji), createElement('div', {
    style: {
      display: 'flex',
      fontSize: title.length > 48 ? 60 : 72,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: -1.5,
    },
  }, title), createElement('div', {
    style: {
      display: 'flex',
      fontSize: 28,
      color: 'rgba(250, 250, 250, 0.5)',
    },
  }, card.site));
}

export function ogSite(appOrigin: string, host?: string | null) {
  if (appOrigin) {
    try {
      return new URL(appOrigin).host;
    } catch {
      return appOrigin;
    }
  }

  return host ?? '';
}

export async function ogHash(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

  return [...new Uint8Array(digest)].slice(0, 8).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
