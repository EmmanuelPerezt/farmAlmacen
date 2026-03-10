import { PosRegister } from "@/components/pos-register";
import { readSearchParam } from "@/lib/query";
import { listProductsWithStockByWarehouse, listWarehouses } from "@/lib/db";

export const dynamic = "force-dynamic";

type PosPageProps = {
  searchParams?: Promise<{
    warehouseId?: string | string[];
  }>;
};

export default async function PosPage({ searchParams }: PosPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const warehouseId = readSearchParam(resolvedParams?.warehouseId);

  const warehouses = await listWarehouses();
  const products = warehouseId ? await listProductsWithStockByWarehouse(warehouseId) : [];

  return (
    <PosRegister
      warehouses={warehouses}
      products={products}
      activeWarehouseId={warehouseId}
    />
  );
}
