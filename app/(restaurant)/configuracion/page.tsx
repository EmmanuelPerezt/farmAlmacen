import { requireAdminSession } from "@/lib/auth";
import { TableDesigner } from "@/components/restaurant/table-designer";
import { listTablesWithStatus, listTableSections } from "@/lib/db";

export default async function ConfiguracionPage() {
  await requireAdminSession();
  const [tables, sections] = await Promise.all([listTablesWithStatus(), listTableSections()]);
  return <TableDesigner initialTables={tables} sections={sections} />;
}
