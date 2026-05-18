"use client";

import { cn } from "@/lib/utils";

type AvatarProps = {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

export function Avatar({ name = "", src, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", sizeMap[size], className)}
      style={{ backgroundColor: stringToColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
