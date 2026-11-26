import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsQuoteProps {
  block: ArtifactsBlocksProps<'Quote'>;
}

export function ArtifactsQuote({ block: { text, author, source, url } }: ArtifactsQuoteProps) {
  return (
    <figure className="m-0 flex flex-col gap-3 border-l-2 border-(--border-strong) py-1 pl-5">
      <blockquote className="m-0 text-lg leading-relaxed font-medium tracking-tight text-pretty">{`“${text}”`}</blockquote>
      {author || source ? (
        <figcaption className="text-sm text-muted-foreground">
          {author ? <span className="font-medium text-foreground">{author}</span> : null}
          {author && source ? ', ' : null}
          {url && source ? (
            <a
              className="underline decoration-current/30 underline-offset-2 hover:decoration-current"
              href={url}
              rel="noreferrer"
              target="_blank"
            >
              {source}
            </a>
          ) : source}
        </figcaption>
      ) : null}
    </figure>
  );
}
