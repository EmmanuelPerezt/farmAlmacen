import { NoticeBanner } from "@/components/notice-banner";
import { MovementWizardModal } from "@/components/movement-wizard-modal";
import { SectionCard } from "@/components/section-card";
import { SectionCardTop } from "@/components/sectionCardTop";
import { formatDateTime } from "@/lib/format";
import { readSearchParam } from "@/lib/query";
import { listMovements, listProductsWithStock, listWarehouses } from "@/lib/store";

const movementLabels = {
  entrada: "Entrada",
  salida: "Salida",
  traslado: "Traslado",
};

type MovementsPageProps = {
  searchParams?: Promise<{
    success?: string | string[];
    error?: string | string[];
  }>;
};

export default async function MovementsPage({ searchParams }: MovementsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const success = readSearchParam(resolvedSearchParams?.success);
  const error = readSearchParam(resolvedSearchParams?.error);

  const products = listProductsWithStock();
  const warehouses = listWarehouses();
  const movements = listMovements();

  return (
    <div className="space-y-6" >
      <NoticeBanner success={success} error={error} />
      <SectionCardTop
        title="Registrar movimiento"
        description="Asistente guiado por pasos para registrar entradas, salidas y traslados."
      >
        <MovementWizardModal products={products} warehouses={warehouses} formError={error} />
      </SectionCardTop>
      <SectionCard
        title="Historial de movimientos"
        description="Detalle de trazabilidad por usuario, almacenes y balance antes/despues"
      >
        {movements.length === 0 ? (
          <div className="panel-soft rounded-2xl border-dashed p-6 text-sm text-[var(--ink-soft)]">
            No hay movimientos registrados todavia.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 md:hidden">
              {movements.map((movement) => (
                <article
                  key={movement.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-[color:rgba(31,99,85,0.24)] bg-[color:rgba(31,99,85,0.1)] px-2 py-1 text-[0.68rem] font-semibold text-[var(--primary-strong)]">
                      {movementLabels[movement.type]}
                    </span>
                    <span className="text-[0.68rem] text-[var(--ink-soft)]">
                      {formatDateTime(movement.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[var(--foreground)]">{movement.productName}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <p className="min-w-0 truncate text-[var(--ink-soft)]">Usuario: {movement.performedByName}</p>
                    <p className="font-semibold text-[var(--foreground)]">Cant. {movement.quantity}</p>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-glass)] px-2 py-1.5">
                      <p className="text-[var(--ink-soft)]">Origen</p>
                      <p className="min-w-0 break-words text-[var(--foreground)]">
                        {movement.sourceWarehouseName ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-glass)] px-2 py-1.5">
                      <p className="text-[var(--ink-soft)]">Destino</p>
                      <p className="min-w-0 break-words text-[var(--foreground)]">
                        {movement.targetWarehouseName ?? "-"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-[0.68rem] text-[var(--ink-soft)]">ID {movement.id}</p>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    <th className="pb-2 pr-3">ID</th>
                    <th className="pb-2 pr-3">Tipo</th>
                    <th className="pb-2 pr-3">Producto</th>
                    <th className="pb-2 pr-3">Cant.</th>
                    <th className="pb-2 pr-3">Origen</th>
                    <th className="pb-2 pr-3">Destino</th>
                    <th className="pb-2 pr-3">Usuario</th>
                    <th className="pb-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-[var(--border)] align-top transition hover:bg-[color:rgba(31,99,85,0.05)]"
                    >
                      <td className="py-2 pr-3 text-xs font-semibold text-[var(--foreground)]">{movement.id}</td>
                      <td className="py-2 pr-3 text-[var(--foreground)]">{movementLabels[movement.type]}</td>
                      <td className="py-2 pr-3 text-[var(--foreground)]">{movement.productName}</td>
                      <td className="py-2 pr-3 font-semibold text-[var(--foreground)]">{movement.quantity}</td>
                      <td className="py-2 pr-3 text-[var(--ink-soft)]">
                        {movement.sourceWarehouseName ?? "-"}
                      </td>
                      <td className="py-2 pr-3 text-[var(--ink-soft)]">
                        {movement.targetWarehouseName ?? "-"}
                      </td>
                      <td className="py-2 pr-3 text-[var(--ink-soft)]">{movement.performedByName}</td>
                      <td className="py-2 text-[var(--ink-soft)]">{formatDateTime(movement.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
