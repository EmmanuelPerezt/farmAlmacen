export type Role = "admin" | "empleado";

export type Session = {
  username: string;
  displayName: string;
  role: Role;
};

export type User = {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: Role;
  createdAt: string;
};

export type Product = {
  sku: number;
  name: string;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type Warehouse = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type StockByWarehouse = {
  warehouseId: string;
  warehouseName: string;
  qty: number;
};

export type ProductWithStock = Product & {
  totalQty: number;
  stockByWarehouse: StockByWarehouse[];
};

export type MovementType = "entrada" | "salida" | "traslado";

export type Movement = {
  id: string;
  type: MovementType;
  sku: number;
  productName: string;
  quantity: number;
  sourceWarehouseId: string | null;
  sourceWarehouseName: string | null;
  targetWarehouseId: string | null;
  targetWarehouseName: string | null;
  sourceBeforeQty: number | null;
  sourceAfterQty: number | null;
  targetBeforeQty: number | null;
  targetAfterQty: number | null;
  performedBy: string;
  performedByName: string;
  note: string;
  createdAt: string;
};

export type WarehouseStockSummary = Warehouse & {
  totalQty: number;
  totalProducts: number;
};

export type SaleLineItem = {
  sku: number;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type Sale = {
  id: string;
  warehouseId: string;
  warehouseName: string;
  items: SaleLineItem[];
  itemCount: number;
  total: number;
  cashReceived: number;
  change: number;
  performedBy: string;
  performedByName: string;
  createdAt: string;
};

export type DashboardMetrics = {
  totalProducts: number;
  totalWarehouses: number;
  totalStock: number;
  movementsToday: number;
  lowStockProducts: Array<{
    sku: number;
    name: string;
    totalQty: number;
  }>;
  latestMovements: Movement[];
};
