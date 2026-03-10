import { PosRegister } from "@/components/pos-register";
import { readSearchParam } from "@/lib/query";
import { listProductsWithStockByWarehouse, listWarehouses } from "@/lib/store";

export const dynamic = "force-dynamic";

type PosPageProps = {
  searchParams?: Promise<{
    warehouseId?: string | string[];
    error?: string | string[];
  }>;
};

export default async function PosPage({ searchParams }: PosPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const warehouseId = readSearchParam(resolvedParams?.warehouseId);
  const error = readSearchParam(resolvedParams?.error);

  const warehouses = listWarehouses();
  const products = warehouseId ? listProductsWithStockByWarehouse(warehouseId) : [];

  return (
    <PosRegister
      warehouses={warehouses}
      products={products}
      activeWarehouseId={warehouseId}
      error={error}
    />
  );
}
