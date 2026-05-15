import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login");
  }
  return <>{children}</>;
}
