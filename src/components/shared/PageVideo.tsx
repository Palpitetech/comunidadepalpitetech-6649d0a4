import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PageVideoProps {
  videoId: string;
  title?: string;
}

export function PageVideo({ videoId, title = "Vídeo tutorial" }: PageVideoProps) {
  if (!videoId) return null;

  return (
    <div className="mb-8 w-full overflow-hidden rounded-xl shadow-md bg-muted border border-border">
      <AspectRatio ratio={16 / 9}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </AspectRatio>
    </div>
  );
}
