import Link from "next/link";
import { Crown } from "lucide-react";

interface SiteLogoProps {
  className?: string;
}

export function SiteLogo({ className }: SiteLogoProps) {
  return (
    <Link
      href="/"
      className={`group flex items-center gap-2 transition-opacity hover:opacity-80 ${className ?? ""}`}
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        <Crown className="size-4.5" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">
          Glam<span className="text-primary">World</span>Face
        </span>
      </div>
    </Link>
  );
}
