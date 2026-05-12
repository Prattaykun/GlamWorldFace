import Link from "next/link";
import { Crown } from "lucide-react";
import { Container } from "@/components/container";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <Container className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Crown className="size-4 text-primary" />
          <span>
            © {new Date().getFullYear()} GlamWorldFace. All rights reserved.
          </span>
        </div>

        {/* Footer links */}
        <nav
          className="flex gap-4 text-sm text-muted-foreground"
          aria-label="Footer navigation"
        >
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-foreground"
          >
            Contact
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
