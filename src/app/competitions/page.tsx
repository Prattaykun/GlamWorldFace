import { Container } from "@/components/container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "Browse active beauty pageant competitions — Jury-based and Public Voting events.",
};

export default function CompetitionsPage() {
  return (
    <Container as="section" className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Competitions
        </h1>
        <p className="mt-3 text-muted-foreground">
          Browse, join, and compete in active beauty pageant competitions.
        </p>
      </div>

      {/* Placeholder — will be replaced by the competitions list */}
      <div className="mt-12 flex items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-20">
        <p className="text-sm text-muted-foreground">
          Competition listings coming soon…
        </p>
      </div>
    </Container>
  );
}
