import { artifactsBlocksVideo } from '@/types/artifacts-blocks.types';
import type { ArtifactsBlocksProps } from '@/types/artifacts-blocks.types';

interface ArtifactsVideoProps {
  block: ArtifactsBlocksProps<'Video'>;
}

export function ArtifactsVideo({ block: { url, title, caption } }: ArtifactsVideoProps) {
  const id = artifactsBlocksVideo.exec(url)?.[1] ?? '';
  const src = url.includes('vimeo.com') ? `https://player.vimeo.com/video/${id}?dnt=1` : `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

  return (
    <figure className="m-0 flex flex-col gap-2">
      <div className="aspect-video overflow-hidden rounded-(--radius-panel) border bg-muted">
        <iframe
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          className="size-full"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={src}
          title={title}
        />
      </div>
      {caption ? <figcaption className="text-xs text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}
