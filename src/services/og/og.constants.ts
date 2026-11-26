export const OG = {
  width: 1200,
  height: 630,
  path: /^\/a\/([0-9A-Za-z]{10})\/og\.png$/,
  keyPart: '/og/',
  lockedKey: 'og/locked-v2.png',
  version: 'v2',
  titleMax: 90,
  font: 'Inter',
  emoji: 'twemoji',
  headers: {
    'content-type': 'image/png',
    'cache-control': 'public, max-age=3600',
    'x-content-type-options': 'nosniff',
  },
  background: 'linear-gradient(135deg, #1c1830 0%, #0b0b0f 60%)',
  locked: {
    emoji: '🔒',
    title: 'A private artifact',
    subtitle: 'Open the link to sign in or type its passcode',
  },
  subtitle: 'An artifact made by an agent',
} as const;
