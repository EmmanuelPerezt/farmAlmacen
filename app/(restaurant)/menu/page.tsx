import { requireSession } from "@/lib/auth";
import { MenuManager } from "@/components/restaurant/menu-manager";
import { listMenuCategories, listMenuItems } from "@/lib/db";

export default async function MenuPage() {
  const session = await requireSession();
  const [categories, items] = await Promise.all([listMenuCategories(), listMenuItems()]);
  return <MenuManager categories={categories} items={items} session={session} />;
}
