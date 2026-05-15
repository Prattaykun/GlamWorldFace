"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareButtonClient({ name }: { name: string }) {
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vote for ${name} on GlamWorldFace!`,
          text: `Support ${name} in this beauty pageant competition 👑`,
          url,
        });
      } catch {
        // User cancelled or share not supported
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!", { position: "bottom-center" });
      } catch {
        toast.error("Could not copy link.");
      }
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
      <Share2 className="size-4" />
      Share
    </Button>
  );
}
