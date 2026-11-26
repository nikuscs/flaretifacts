'use client';

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { match, P } from 'ts-pattern';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';

interface ArtifactsHtmlFrameProps {
  html: string;
  title: string;
  embedded?: boolean;
}

export function ArtifactsHtmlFrame({ html, title, embedded = false }: ArtifactsHtmlFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(ARTIFACTS_UI.html.height.initial);

  const subscribe = (onChange: () => void) => {
    const observer = new MutationObserver(onChange);

    observer.observe(window.document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });

    return () => observer.disconnect();
  };

  const dark = useSyncExternalStore(subscribe, () => window.document.documentElement.classList.contains('dark'), () => false);
  const appearance = dark ? 'dark' : 'light';
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => null);
  const { csp, base, kit, bootstrap } = ARTIFACTS_UI.html;
  const policy = origin ? csp.replace(ARTIFACTS_UI.html.imageSources, `${ARTIFACTS_UI.html.imageSources} ${origin}${ARTIFACTS_UI.html.assetsPath}`) : csp;

  const document = `<!doctype html><html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${policy}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${base}
${kit}${embedded ? ARTIFACTS_UI.html.embedded : ''}</style>
<script>${bootstrap}</script>
</head><body>${html}</body></html>`;

  const postTheme = () => {
    const styles = getComputedStyle(window.document.documentElement);

    frame.current?.contentWindow?.postMessage({
      type: ARTIFACTS_UI.html.message.theme,
      appearance,
      tokens: Object.fromEntries(ARTIFACTS_UI.html.tokens.map((token) => [token, styles.getPropertyValue(token).trim()])),
    }, '*');
  };

  useEffect(postTheme);

  useLayoutEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) {
        return;
      }

      match(event.data)
        .with({ type: ARTIFACTS_UI.html.message.height, height: P.number }, (message) => {
          setHeight(Math.max(ARTIFACTS_UI.html.height.min, Math.min(ARTIFACTS_UI.html.height.max, message.height)));
        })
        .with({ type: ARTIFACTS_UI.html.message.link, url: P.string }, ({ url }) => {
          const target = URL.canParse(url) ? new URL(url) : null;

          if (target && ['http:', 'https:'].includes(target.protocol) && window.document.activeElement === frame.current && navigator.userActivation.isActive) {
            window.open(target.href, '_blank', 'noopener,noreferrer');
          }
        })
        .otherwise(() => undefined);
    };

    window.addEventListener('message', onMessage);

    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <iframe
      className="block w-full border-0"
      ref={frame}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts"
      srcDoc={document}
      style={{ height, colorScheme: embedded ? 'normal' : appearance }}
      title={title}
      onLoad={postTheme}
    />
  );
}
