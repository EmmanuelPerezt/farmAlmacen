import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";
import { getThemeFromCookies } from "@/lib/theme";

export const dynamic = "force-dynamic";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await requireSession();
  const theme = await getThemeFromCookies();

  return <AppShell user={session} theme={theme}>{children}</AppShell>;
}
