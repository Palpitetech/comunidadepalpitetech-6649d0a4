import { Skeleton } from "@/components/ui/skeleton";

interface PostCardSkeletonProps {
  count?: number;
}

export function PostCardSkeleton({ count = 3 }: PostCardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          {/* Título */}
          <Skeleton className="h-5 w-3/4 mb-3" />

          {/* Mídia */}
          <Skeleton className="aspect-[3/4] w-full rounded-lg mb-3" />

          {/* Footer */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
