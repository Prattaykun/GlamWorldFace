"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { upsertProfileAction, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Field helpers ─────────────────────────────────────────────

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-destructive">{messages[0]}</p>;
}

function FieldGroup({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error?.length && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      <FieldError messages={error} />
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────

export type DefaultValues = {
  name: string;
  age: number | null;
  gender: string | null;
  country: string | null;
  height: number | null;
  weight: number | null;
  bodyType: string | null;
  eyeColor: string | null;
  hairColor: string | null;
  bio: string | null;
  instagram: string | null;
  portfolioUrl: string | null;
  goals: string | null;
  achievements: string | null;
  languages: string | null;
  occupation: string | null;
  personality: string | null;
};

// ── Component ─────────────────────────────────────────────────

export function ProfileForm({ defaultValues }: { defaultValues: DefaultValues }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    upsertProfileAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Profile saved successfully!");
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const e = state?.errors ?? {};

  return (
    <form action={action} className="space-y-8">
      {/* ── Section: Personal Information ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Personal Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Full Name *" htmlFor="name" error={e.name}>
            <Input
              id="name"
              name="name"
              placeholder="Your full name"
              defaultValue={defaultValues.name}
              required
            />
          </FieldGroup>

          <FieldGroup label="Age" htmlFor="age" hint="Must be 16–65" error={e.age}>
            <Input
              id="age"
              name="age"
              type="number"
              min={16}
              max={65}
              placeholder="25"
              defaultValue={defaultValues.age ?? ""}
            />
          </FieldGroup>

          <FieldGroup label="Gender" htmlFor="gender" error={e.gender}>
            <Select
              name="gender"
              defaultValue={defaultValues.gender ?? undefined}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Non-binary">Non-binary</SelectItem>
                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Country" htmlFor="country" error={e.country}>
            <Input
              id="country"
              name="country"
              placeholder="e.g. India"
              defaultValue={defaultValues.country ?? ""}
            />
          </FieldGroup>
        </div>
      </section>

      {/* ── Section: Physical Details ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Physical Details</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldGroup label="Height (cm)" htmlFor="height" error={e.height}>
            <Input
              id="height"
              name="height"
              type="number"
              step="0.1"
              placeholder="168"
              defaultValue={defaultValues.height ?? ""}
            />
          </FieldGroup>

          <FieldGroup label="Weight (kg)" htmlFor="weight" error={e.weight}>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              placeholder="58"
              defaultValue={defaultValues.weight ?? ""}
            />
          </FieldGroup>

          <FieldGroup label="Body Type" htmlFor="bodyType" error={e.bodyType}>
            <Select
              name="bodyType"
              defaultValue={defaultValues.bodyType ?? undefined}
            >
              <SelectTrigger id="bodyType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Slim">Slim</SelectItem>
                <SelectItem value="Athletic">Athletic</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="Curvy">Curvy</SelectItem>
                <SelectItem value="Plus-size">Plus-size</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Eye Color" htmlFor="eyeColor" error={e.eyeColor}>
            <Input
              id="eyeColor"
              name="eyeColor"
              placeholder="e.g. Brown"
              defaultValue={defaultValues.eyeColor ?? ""}
            />
          </FieldGroup>

          <FieldGroup label="Hair Color" htmlFor="hairColor" error={e.hairColor}>
            <Input
              id="hairColor"
              name="hairColor"
              placeholder="e.g. Black"
              defaultValue={defaultValues.hairColor ?? ""}
            />
          </FieldGroup>
        </div>
      </section>

      {/* ── Section: Bio & Social ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Bio & Social</h2>
        <div className="grid gap-4">
          <FieldGroup
            label="Bio"
            htmlFor="bio"
            hint="Max 1000 characters. Tell judges and voters about yourself."
            error={e.bio}
          >
            <Textarea
              id="bio"
              name="bio"
              rows={4}
              placeholder="Share your story, aspirations, and what makes you unique…"
              defaultValue={defaultValues.bio ?? ""}
              className="resize-none"
            />
          </FieldGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup
              label="Instagram Handle"
              htmlFor="instagram"
              hint="Without the @ symbol"
              error={e.instagram}
            >
              <div className="flex items-center">
                <span className="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  id="instagram"
                  name="instagram"
                  placeholder="yourhandle"
                  defaultValue={defaultValues.instagram?.replace(/^@/, "") ?? ""}
                  className="rounded-l-none"
                />
              </div>
            </FieldGroup>

            <FieldGroup
              label="Portfolio / Website"
              htmlFor="portfolioUrl"
              hint="Full URL including https://"
              error={e.portfolioUrl}
            >
              <Input
                id="portfolioUrl"
                name="portfolioUrl"
                type="url"
                placeholder="https://yoursite.com"
                defaultValue={defaultValues.portfolioUrl ?? ""}
              />
            </FieldGroup>
          </div>
        </div>
      </section>

      {/* ── Section: Extended Profile ── */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Extended Profile</h2>
        <p className="mb-4 text-xs text-muted-foreground">These fields help both human jurors and our AI scoring system evaluate your profile more accurately.</p>
        <div className="grid gap-4">
          <FieldGroup
            label="Goals & Aspirations"
            htmlFor="goals"
            hint="What are you working towards? Max 500 chars."
            error={e.goals}
          >
            <Textarea
              id="goals"
              name="goals"
              rows={3}
              placeholder="I aspire to represent my country on international stages…"
              defaultValue={defaultValues.goals ?? ""}
              className="resize-none"
            />
          </FieldGroup>

          <FieldGroup
            label="Achievements & Awards"
            htmlFor="achievements"
            hint="Past pageants, titles, or relevant achievements."
            error={e.achievements}
          >
            <Textarea
              id="achievements"
              name="achievements"
              rows={3}
              placeholder="Winner of Regional Beauty 2025, Top 10 at…"
              defaultValue={defaultValues.achievements ?? ""}
              className="resize-none"
            />
          </FieldGroup>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Languages" htmlFor="languages" hint="Comma-separated" error={e.languages}>
              <Input
                id="languages"
                name="languages"
                placeholder="English, Hindi, French"
                defaultValue={defaultValues.languages ?? ""}
              />
            </FieldGroup>

            <FieldGroup label="Occupation" htmlFor="occupation" error={e.occupation}>
              <Input
                id="occupation"
                name="occupation"
                placeholder="Model, Student, Designer…"
                defaultValue={defaultValues.occupation ?? ""}
              />
            </FieldGroup>
          </div>

          <FieldGroup
            label="Personality Highlights"
            htmlFor="personality"
            hint="Hobbies, interests, what makes you unique."
            error={e.personality}
          >
            <Textarea
              id="personality"
              name="personality"
              rows={3}
              placeholder="I'm passionate about fitness, love public speaking, and volunteer at…"
              defaultValue={defaultValues.personality ?? ""}
              className="resize-none"
            />
          </FieldGroup>
        </div>
      </section>

      {/* ── Submit ── */}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
