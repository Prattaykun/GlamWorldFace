import { Container } from "@/components/container";
import { CompetitionForm } from "@/components/admin/competition-form";

export const metadata = {
  title: "Create Competition | Admin",
};

export default function CreateCompetitionPage() {
  return (
    <Container className="py-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Competition</h1>
        <p className="text-muted-foreground mt-2">
          Add a new competition for contestants to join.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <CompetitionForm />
      </div>
    </Container>
  );
}
