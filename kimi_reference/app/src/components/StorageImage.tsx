import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";

/** Renders an image from object storage via a short-lived presigned URL. */
export function StorageImage({
  fileKey,
  alt,
  className,
}: {
  fileKey: string;
  alt: string;
  className?: string;
}) {
  const { data } = trpc.storage.url.useQuery(
    { key: fileKey },
    { staleTime: 8 * 60 * 1000, retry: false },
  );
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [fileKey]);
  if (!data?.url || failed) {
    return (
      <span className={`flex items-center justify-center bg-secondary text-[10px] text-muted-foreground ${className ?? ""}`}>
        photo
      </span>
    );
  }
  return (
    <img
      src={data.url}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
