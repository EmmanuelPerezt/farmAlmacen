import { ProductCreateModal } from "@/components/product-create-modal";
import { ProductsCatalog } from "@/components/products-catalog";
import { SectionCard } from "@/components/section-card";
import { SectionCardTop } from "@/components/sectionCardTop";
import { requireSession } from "@/lib/auth";
import { listProductsWithStock, listWarehouses } from "@/lib/db";

export default async function ProductsPage() {
  const session = await requireSession();

  const [products, warehouses] = await Promise.all([
    listProductsWithStock(),
    listWarehouses(),
  ]);
  const isAdmin = session.role === "admin";

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <SectionCardTop
          title="Crear producto"
          description="Asistente guiado para crear SKU, precio y stock inicial en pasos."
        >
          <ProductCreateModal warehouses={warehouses} />
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
