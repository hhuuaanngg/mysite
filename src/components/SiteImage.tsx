import type { ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
};

// Preserve the existing geometry while serving the original static images.
export function SiteImage({ fill, priority, style, loading, ...props }: Props) {
  return (
    <img
      {...props}
      loading={priority ? "eager" : loading ?? "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      style={fill ? {
        position: "absolute", height: "100%", width: "100%", inset: 0,
        color: "transparent", ...style,
      } : { color: "transparent", ...style }}
    />
  );
}
