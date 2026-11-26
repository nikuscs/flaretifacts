import { GoogleFont, render } from '@cf-wasm/og/workerd';
import { OG } from '@/services/og/og.constants';
import * as OgUtils from '@/services/og/og.utils';
import type { Deps } from '@/types/deps.types';
import type { OgCard, OgServeInput } from '@/types/og.types';

export async function ogServe(deps: Deps, params: OgServeInput): Promise<Response | null> {
  const [, id] = OG.path.exec(params.pathname) ?? [];

  if (!id) {
    return null;
  }

  const row = await deps.artifactsStore().get(id, null);

  if (!row) {
    return new Response('Not found', { status: 404 });
  }

  const site = OgUtils.ogSite(deps.appOrigin, params.host);

  const card: OgCard = row.visibility === 'public'
    ? { emoji: row.emoji, title: row.title, subtitle: OG.subtitle, site }
    : { ...OG.locked, site };

  const key = row.visibility === 'public' ? `${id}${OG.keyPart}${await OgUtils.ogHash(`${OG.version}|${card.emoji}|${card.title}|${card.site}`)}.png` : OG.lockedKey;
  const stored = await deps.assetsBucket.get(key);

  if (stored) {
    return new Response(stored.body, { headers: OG.headers });
  }

  const png = await render(OgUtils.ogCardElement(card), {
    width: OG.width,
    height: OG.height,
    emoji: OG.emoji,
    fonts: [new GoogleFont(OG.font, { weight: 400 }), new GoogleFont(OG.font, { weight: 700 })],
  }).asPng();

  await deps.assetsBucket.put(key, png.image.buffer, { httpMetadata: { contentType: 'image/png' }, customMetadata: {} });

  return new Response(png.image, { headers: OG.headers });
}
