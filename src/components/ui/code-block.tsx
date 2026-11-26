'use client';

import { cn } from 'cn';
import { Fragment, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/components/ui/copy';
import { ARTIFACTS_UI } from '@/constants/artifacts.constants';
import { codeTokens } from '@/utils/code.utils';
import Check from '~icons/lucide/check';
import ChevronDown from '~icons/lucide/chevron-down';
import CopyIcon from '~icons/lucide/copy';
import FileCode from '~icons/lucide/file-code';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  maxLines?: number;
}

function CodeBlock({ code, language = '', filename, maxLines }: CodeBlockProps) {
  const id = useId();
  const { copied, copy } = useCopy('code');
  const [expanded, setExpanded] = useState(false);
  const lines = code.split('\n').length;
  const folds = maxLines !== undefined && lines > maxLines;
  const lang = language.toLowerCase().replace(/^\./, '');

  return (
    <section aria-label={filename ? `${filename} source` : 'Code'} className="min-w-0 overflow-hidden rounded-(--radius-panel) border bg-(--surface)" data-slot="code-block">
      <header className="flex min-h-11 items-center justify-between gap-3 border-b border-(--border-subtle) bg-(--surface-raised) py-1.5 pr-2 pl-4">
        <span className="flex min-w-0 items-baseline gap-2 text-sm font-medium text-(--text-secondary)">
          <FileCode aria-hidden="true" className="size-4 shrink-0 self-center text-(--text-muted)" />
          <span className="truncate text-foreground">{filename ?? 'Code'}</span>
          {lang ? <span className="shrink-0 font-mono text-xs font-normal text-(--text-muted) before:mr-2 before:text-(--border-strong) before:content-['·']">{lang}</span> : null}
        </span>
        <Button
          aria-label={copied ? 'Copied' : 'Copy code'}
          size="xs"
          variant="ghost"
          onClick={() => void copy(code)}
        >
          {copied ? <Check /> : <CopyIcon />}
          <span className="max-sm:sr-only">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </header>
      <div className="overflow-hidden" style={folds && !expanded ? { maxHeight: `calc(${maxLines} * 1.7em + 2.5rem)` } : undefined}>
        <pre className="m-0 overflow-x-auto p-5 font-mono text-[13px] leading-[1.7] tab-2 [font-variant-ligatures:none] max-sm:p-4 max-sm:text-xs" id={id}>
          <code>
            {codeTokens(code, lang).map((part, index) => (part.kind
              ? <span className={ARTIFACTS_UI.code.colors[part.kind]} key={index}>{part.text}</span>
              : <Fragment key={index}>{part.text}</Fragment>))}
          </code>
        </pre>
      </div>
      {folds ? (
        <button
          aria-controls={id}
          aria-expanded={expanded}
          className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 border-t border-(--border-subtle) bg-(--surface-raised) px-4 text-sm font-medium text-(--text-secondary) transition-colors hover:bg-(--surface-muted) hover:text-foreground"
          type="button"
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Show fewer lines' : `Show all ${lines} lines`}
          <ChevronDown aria-hidden="true" className={cn('size-4 text-(--text-muted) transition-transform duration-(--duration-fast)', expanded && 'rotate-180')} />
        </button>
      ) : null}
    </section>
  );
}

export { CodeBlock };
