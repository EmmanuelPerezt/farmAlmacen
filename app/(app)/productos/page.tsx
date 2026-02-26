import { NoticeBanner } from "@/components/notice-banner";
import { ProductCreateModal } from "@/components/product-create-modal";
import { ProductsCatalog } from "@/components/products-catalog";
import { SectionCard } from "@/components/section-card";
import { SectionCardTop } from "@/components/sectionCardTop";
import { requireSession } from "@/lib/auth";
import { readSearchParam } from "@/lib/query";
import { listProductsWithStock, listWarehouses } from "@/lib/store";

type ProductsPageProps = {
  searchParams?: Promise<{
    success?: string | string[];
    error?: string | string[];
    context?: string | string[];
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await requireSession();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const success = readSearchParam(resolvedSearchParams?.success);
  const error = readSearchParam(resolvedSearchParams?.error);
  const context = readSearchParam(resolvedSearchParams?.context);
  const createError = context === "create" ? error : undefined;
  const pageError = context === "create" ? undefined : error;

  const products = listProductsWithStock();
  const warehouses = listWarehouses();
  const isAdmin = session.role === "admin";

  return (
    <div className="space-y-6">
      <NoticeBanner success={success} error={pageError} />

      {isAdmin ? (
        <SectionCardTop
          title="Crear producto"
          description="Asistente guiado para crear SKU, precio y stock inicial en pasos."
        >
          <ProductCreateModal warehouses={warehouses} formError={createError} />
        </SectionCardTop>
      ) : (
        <div className="rounded-2xl border border-[color:rgba(31,99,85,0.3)] bg-[color:rgba(31,99,85,0.09)] px-4 py-3 text-sm text-[var(--foreground)]">
          Modo empleado: puedes consultar productos y su stock. Solo admin puede crear o editar.
        </div>
      )}

      <SectionCard
        title="Catalogo de productos"
        description="Agrega Productos"
      >
        {products.length === 0 ? (
          <div className="panel-soft rounded-2xl border-dashed p-6 text-sm text-[var(--ink-soft)]">
            Aun no hay productos registrados.
          </div>
        ) : (
          <ProductsCatalog products={products} isAdmin={isAdmin} />
        )}
      </SectionCard>
    </div>
  );
}
