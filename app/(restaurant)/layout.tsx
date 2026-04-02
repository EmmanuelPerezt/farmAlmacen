import { requireSession } from "@/lib/auth";
import { RestaurantShell } from "@/components/restaurant/restaurant-shell";

export default async function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return <RestaurantShell session={session}>{children}</RestaurantShell>;
}
