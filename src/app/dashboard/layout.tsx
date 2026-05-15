import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 py-8 sm:px-6 lg:gap-8 lg:px-8">
      {/* Sidebar – hidden on mobile, visible lg+ */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <DashboardSidebar role={session.user.role} />
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
