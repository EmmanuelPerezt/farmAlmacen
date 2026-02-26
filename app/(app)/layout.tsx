import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await requireSession();

  return <AppShell user={session}>{children}</AppShell>;
}
