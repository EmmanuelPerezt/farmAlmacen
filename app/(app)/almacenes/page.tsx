import { NoticeBanner } from "@/components/notice-banner";
import { SectionCard } from "@/components/section-card";
import { SectionCardTop } from "@/components/sectionCardTop";
import { WarehouseCreateModal } from "@/components/warehouse-create-modal";
import { requireSession } from "@/lib/auth";
import { readSearchParam } from "@/lib/query";
import { listWarehousesWithStock } from "@/lib/store";

type WarehousesPageProps = {
  searchParams?: Promise<{
    success?: string | string[];
    error?: string | string[];
    context?: string | string[];
  }>;
};

export default async function WarehousesPage({ searchParams }: WarehousesPageProps) {
  const session = await requireSession();
  const isAdmin = session.role === "admin";

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const success = readSearchParam(resolvedSearchParams?.success);
  const error = readSearchParam(resolvedSearchParams?.error);
  const context = readSearchParam(resolvedSearchParams?.context);
  const createError = context === "create" ? error : undefined;
  const pageError = context === "create" ? undefined : error;

  const warehouses = listWarehousesWithStock();

  return (
    <div className="space-y-6">
      <NoticeBanner success={success} error={pageError} />

      {isAdmin ? (
        <SectionCardTop
          title="Crear almacen"
          description="Asistente guiado para crear almacenes sin friccion"
        >
          <WarehouseCreateModal formError={createError} />
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
                  <div className="mt-4 border-t border-[var(--border)] pt-3">
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[color:rgba(31,99,85,0.45)] [&::-webkit-details-marker]:hidden">
                        Editar
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden="true"
                          className="h-4 w-4 text-[var(--ink-soft)] transition-transform group-open:rotate-180"
                        >
                          <path
                            d="m5 8 5 5 5-5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </summary>

                      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                        <form action="/api/warehouses" method="post" className="grid gap-2">
                          <input type="hidden" name="intent" value="update" />
                          <input type="hidden" name="id" value={warehouse.id} />

                          <input
                            name="name"
                            type="text"
                            required
                            defaultValue={warehouse.name}
                            className="form-input"
                          />
                          <input
                            name="description"
                            type="text"
                            defaultValue={warehouse.description}
                            className="form-input"
                          />
                          <button
                            type="submit"
                            className="action-btn action-btn-soft"
                          >
                            Actualizar almacen
                          </button>
                        </form>

                        <form action="/api/warehouses" method="post">
                          <input type="hidden" name="intent" value="delete" />
                          <input type="hidden" name="id" value={warehouse.id} />
                          <button
                            type="submit"
                            className="action-btn action-btn-danger"
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </details>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
