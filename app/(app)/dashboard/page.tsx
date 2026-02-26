import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { formatDateTime } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/store";

const movementLabels = {
  entrada: "Entrada",
  salida: "Salida",
  traslado: "Traslado",
};

export default function DashboardPage() {
  const metrics = getDashboardMetrics();

  const topCards = [
    {
      label: "Productos activos",
      value: metrics.totalProducts,
      hint: "SKU en operacion",
    },
    {
      label: "Almacenes",
      value: metrics.totalWarehouses,
      hint: "Ubicaciones habilitadas",
    },
    {
      label: "Stock total",
      value: metrics.totalStock,
      hint: "Unidades disponibles",
    },
    {
      label: "Movimientos hoy",
      value: metrics.movementsToday,
      hint: "Actividad del turno",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="app-enter rounded-xl border border-[color:rgba(148,163,184,0.34)] bg-white p-5 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.5)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="pill-label">Resumen operativo</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">Estado general</h2>
          </div>
          <p className="text-sm text-[var(--ink-soft)]">Monitorea inventario y actividad diaria</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {topCards.map((card, index) => (
            <article
              key={card.label}
              className="panel-soft app-enter px-3 py-3"
              style={{ animationDelay: `${index * 60 + 90}ms` }}
            >
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                {card.label}
              </p>
              <p className="mt-1 text-3xl font-semibold leading-none text-[var(--foreground)]">{card.value}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{card.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Ultimos movimientos"
          description="Registro cronologico con usuario responsable y almacenes involucrados"
        >
          {metrics.latestMovements.length === 0 ? (
            <div className="panel-soft rounded-2xl border-dashed p-6 text-sm text-[var(--ink-soft)]">
              Aun no hay movimientos registrados. Puedes comenzar desde la pestaña de
              movimientos.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2 md:hidden">
                {metrics.latestMovements.map((movement) => (
                  <article
                    key={movement.id}
                    className="rounded-xl border border-[color:rgba(148,163,184,0.3)] bg-[color:rgba(255,255,255,0.85)] px-3 py-3"
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
                      <p className="text-[var(--ink-soft)]">Usuario: {movement.performedByName}</p>
                      <p className="font-semibold text-[var(--foreground)]">Cant. {movement.quantity}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-[color:rgba(148,163,184,0.34)] text-left text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                      <th className="pb-2 pr-3">Tipo</th>
                      <th className="pb-2 pr-3">Producto</th>
                      <th className="pb-2 pr-3">Cantidad</th>
                      <th className="pb-2 pr-3">Usuario</th>
                      <th className="pb-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.latestMovements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="border-b border-[color:rgba(148,163,184,0.28)] transition hover:bg-[color:rgba(31,99,85,0.05)]"
                      >
                        <td className="py-2 pr-3 text-[var(--foreground)]">
                          <span className="rounded-full border border-[color:rgba(31,99,85,0.24)] bg-[color:rgba(31,99,85,0.1)] px-2 py-1 text-xs font-semibold text-[var(--primary-strong)]">
                            {movementLabels[movement.type]}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-[var(--foreground)]">{movement.productName}</td>
                        <td className="py-2 pr-3 font-semibold text-[var(--foreground)]">
                          {movement.quantity}
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

        <SectionCard
          title="Alerta de stock"
          description="Productos con inventario total en umbral bajo (<= 10)"
        >
          {metrics.lowStockProducts.length === 0 ? (
            <p className="rounded-2xl border border-[color:rgba(15,157,114,0.34)] bg-[color:rgba(15,157,114,0.1)] px-4 py-3 text-sm text-[var(--success)]">
              Sin alertas por ahora. El nivel de inventario luce estable.
            </p>
          ) : (
            <ul className="space-y-2">
              {metrics.lowStockProducts.map((product) => (
                <li
                  key={product.sku}
                  className="rounded-2xl border border-[color:rgba(217,45,32,0.34)] bg-[color:rgba(217,45,32,0.08)] px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 break-words text-sm font-semibold leading-snug text-[var(--danger)]">
                      {product.name}
                    </p>
                    <span className="shrink-0 rounded-full border border-[color:rgba(217,45,32,0.3)] bg-[color:rgba(255,255,255,0.8)] px-2 py-0.5 text-[0.68rem] font-semibold text-[color:#9b2c2c]">
                      {product.totalQty}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[color:#9b2c2c]">SKU {product.sku}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </section>

      <section className="panel app-enter app-enter-delay-2 p-5">
        <h2 className="text-[1.2rem] leading-tight text-[var(--foreground)]">Accesos rapidos</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/movimientos" className="action-btn action-btn-primary">
            Registrar movimiento
          </Link>
          <Link href="/productos" className="action-btn action-btn-soft">
            Ver catalogo de productos
          </Link>
          <Link href="/almacenes" className="action-btn action-btn-soft">
            Revisar almacenes
          </Link>
        </div>
      </section>
    </div>
  );
}
