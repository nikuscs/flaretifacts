import { match } from 'ts-pattern';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';

export function codeTokens(code: string, language: string) {
  const hashComments = ARTIFACTS_UI.code.hashComments.has(language);
  const parts: { text: string; kind: keyof typeof ARTIFACTS_UI.code.colors | null }[] = [];
  let cursor = 0;

  for (const found of code.matchAll(ARTIFACTS_UI.code.tokens)) {
    const value = found[0];
    const at = found.index;
    const after = code.slice(at + value.length);
    const keyed = /^\s*:/.test(after);

    const kind = match(value)
      .when((text) => text.startsWith('#'), () => (hashComments && /^\s?$/.test(code.charAt(at - 1)) ? 'comment' as const : 'skip' as const))
      .when((text) => /^(?:\/\/|\/\*|<!--)/.test(text), () => 'comment' as const)
      .when((text) => /^["'`]/.test(text), () => (keyed && ARTIFACTS_UI.code.keyed.has(language) ? 'property' as const : 'string' as const))
      .when((text) => /^\d/.test(text), () => 'number' as const)
      .when((text) => ARTIFACTS_UI.code.keywords.test(text), () => 'keyword' as const)
      .when(() => /^\s*\(/.test(after) && language !== 'json', () => 'function' as const)
      .when(() => keyed && ARTIFACTS_UI.code.keyed.has(language), () => 'property' as const)
      .otherwise(() => null);

    if (kind !== 'skip') {
      parts.push({ text: code.slice(cursor, at), kind: null }, { text: value, kind });
      cursor = at + value.length;
    }
  }

  parts.push({ text: code.slice(cursor), kind: null });

  return parts.filter((part) => part.text.length > 0);
}
