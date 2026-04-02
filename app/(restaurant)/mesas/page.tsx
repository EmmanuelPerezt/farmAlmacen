import { requireSession } from "@/lib/auth";
import { FloorMap } from "@/components/restaurant/floor-map";
import { listTablesWithStatus, listTableSections } from "@/lib/db";

export default async function MesasPage() {
  await requireSession();
  const [tables, sections] = await Promise.all([listTablesWithStatus(), listTableSections()]);
  return <FloorMap initialTables={tables} sections={sections} />;
}
