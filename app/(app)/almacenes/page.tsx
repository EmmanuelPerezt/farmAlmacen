import { SectionCard } from "@/components/section-card";
import { SectionCardTop } from "@/components/sectionCardTop";
import { WarehouseActions } from "@/components/warehouse-actions";
import { WarehouseCreateModal } from "@/components/warehouse-create-modal";
import { requireSession } from "@/lib/auth";
import { listWarehousesWithStock } from "@/lib/db";

export default async function WarehousesPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";

  const warehouses = await listWarehousesWithStock();

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <SectionCardTop
          title="Crear almacen"
          description="Asistente guiado para crear almacenes sin friccion"
        >
          <WarehouseCreateModal />
        </SectionCardTop>
      ) : (
        <div className="rounded-2xl border border-[color:rgba(31,99,85,0.3)] bg-[color:rgba(31,99,85,0.09)] px-4 py-3 text-sm text-[var(--foreground)]">
          Modo empleado: puedes consultar almacenes y niveles de inventario. Solo admin gestiona
          la estructura de almacenes.
        </div>
      )}

      <SectionCard
        title="Almacenes registrados"
        description="Cada tarjeta resume inventario total y variedad de productos"
      >
        {warehouses.length === 0 ? (
          <div className="panel-soft rounded-2xl border-dashed p-6 text-sm text-[var(--ink-soft)]">
            No hay almacenes cargados.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {warehouses.map((warehouse) => (
              <article
                key={warehouse.id}
                className="panel-soft rounded-2xl px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{warehouse.name}</p>
                    <p className="text-xs text-[var(--ink-soft)]">
                      {warehouse.description || "Sin descripcion"}
                    </p>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                    {warehouse.id}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                    <p className="text-xs text-[var(--ink-soft)]">Stock total</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{warehouse.totalQty}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                    <p className="text-xs text-[var(--ink-soft)]">Productos</p>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{warehouse.totalProducts}</p>
                  </div>
                </div>

                {isAdmin ? (
                  <WarehouseActions
                    warehouseId={warehouse.id}
                    warehouseName={warehouse.name}
                    warehouseDescription={warehouse.description}
                  />
                ) : null}
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
