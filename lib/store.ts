import type {
  DashboardMetrics,
  Movement,
  MovementType,
  Product,
  ProductWithStock,
  Role,
  Sale,
  SaleLineItem,
  Session,
  User,
  Warehouse,
  WarehouseStockSummary,
} from "@/lib/types";

const LOW_STOCK_THRESHOLD = 10;

type InventoryKey = `${string}:${number}`;

type MovementInput = {
  type: MovementType;
  sku: number;
  quantity: number;
  sourceWarehouseId?: string;
  targetWarehouseId?: string;
  note?: string;
  actor: Session;
};

type SaleInput = {
  warehouseId: string;
  items: Array<{ sku: number; quantity: number }>;
  cashReceived: number;
  actor: Session;
};

type Store = {
  users: User[];
  products: Product[];
  warehouses: Warehouse[];
  inventory: Map<InventoryKey, number>;
  movements: Movement[];
  sales: Sale[];
  nextMovementNumber: number;
  nextWarehouseNumber: number;
  nextUserNumber: number;
  nextSaleNumber: number;
};

declare global {
  var __farmAlmacenStore: Store | undefined;
}

function nowIso(): string {
  return new Date().toISOString();
}

function inventoryKey(warehouseId: string, sku: number): InventoryKey {
  return `${warehouseId}:${sku}`;
}

function createInitialStore(): Store {
  const timestamp = nowIso();

  return {
    users: [
      {
        id: "usr-1",
        username: "admin",
        password: "admin123",
        displayName: "Administrador",
        role: "admin",
        createdAt: timestamp,
      },
      {
        id: "usr-2",
        username: "empleado",
        password: "empleado123",
        displayName: "Operador",
        role: "empleado",
        createdAt: timestamp,
      },
    ],
    products: [
      {
        sku: 1001,
        name: "Paracetamol 500mg",
        price: 4.25,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        sku: 1002,
        name: "Ibuprofeno 400mg",
        price: 5.5,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    warehouses: [
      {
        id: "alm-1",
        name: "Almacen Central",
        description: "Bodega principal de recepcion",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "alm-2",
        name: "Almacen Mostrador",
        description: "Stock de despacho diario",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    inventory: new Map<InventoryKey, number>([
      [inventoryKey("alm-1", 1001), 180],
      [inventoryKey("alm-1", 1002), 120],
      [inventoryKey("alm-2", 1001), 45],
      [inventoryKey("alm-2", 1002), 32],
    ]),
    movements: [],
    sales: [],
    nextMovementNumber: 1,
    nextWarehouseNumber: 3,
    nextUserNumber: 3,
    nextSaleNumber: 1,
  };
}

function getStore(): Store {
  if (!globalThis.__farmAlmacenStore) {
    globalThis.__farmAlmacenStore = createInitialStore();
  }

  return globalThis.__farmAlmacenStore;
}

function findWarehouseById(warehouseId: string): Warehouse {
  const warehouse = getStore().warehouses.find((item) => item.id === warehouseId);

  if (!warehouse) {
    throw new Error("El almacen seleccionado no existe.");
  }

  return warehouse;
}

function findProductBySku(sku: number): Product {
  const product = getStore().products.find((item) => item.sku === sku);

  if (!product) {
    throw new Error("El producto seleccionado no existe.");
  }

  return product;
}

function getStock(warehouseId: string, sku: number): number {
  return getStore().inventory.get(inventoryKey(warehouseId, sku)) ?? 0;
}

function setStock(warehouseId: string, sku: number, value: number): void {
  const key = inventoryKey(warehouseId, sku);

  if (value <= 0) {
    getStore().inventory.delete(key);
    return;
  }

  getStore().inventory.set(key, value);
}

function totalStockBySku(sku: number): number {
  let total = 0;

  for (const warehouse of getStore().warehouses) {
    total += getStock(warehouse.id, sku);
  }

  return total;
}

function toPublicUser(user: User): Omit<User, "password"> {
  const { password, ...safeUser } = user;
  void password;
  return safeUser;
}

export function authenticateUser(username: string, password: string): Session | null {
  const user = getStore().users.find(
    (item) => item.username === username && item.password === password,
  );

  if (!user) {
    return null;
  }

  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}

export function listUsers(): Array<Omit<User, "password">> {
  return getStore().users.map(toPublicUser);
}

export function createUser(input: {
  username: string;
  password: string;
  displayName: string;
  role: Role;
}): Omit<User, "password"> {
  const username = input.username.trim().toLowerCase();
  const password = input.password.trim();
  const displayName = input.displayName.trim();

  if (!username) {
    throw new Error("El nombre de usuario es obligatorio.");
  }

  if (password.length < 4) {
    throw new Error("La contrasena debe tener al menos 4 caracteres.");
  }

  if (!displayName) {
    throw new Error("El nombre para mostrar es obligatorio.");
  }

  if (getStore().users.some((item) => item.username === username)) {
    throw new Error("Ya existe un usuario con ese nombre.");
  }

  const id = `usr-${getStore().nextUserNumber}`;
  getStore().nextUserNumber += 1;

  const createdUser: User = {
    id,
    username,
    password,
    displayName,
    role: input.role,
    createdAt: nowIso(),
  };

  getStore().users.push(createdUser);

  return toPublicUser(createdUser);
}

export function listWarehouses(): Warehouse[] {
  return [...getStore().warehouses].sort((a, b) => a.name.localeCompare(b.name));
}

export function listWarehousesWithStock(): WarehouseStockSummary[] {
  const products = getStore().products;

  return listWarehouses().map((warehouse) => {
    let totalQty = 0;
    let totalProducts = 0;

    for (const product of products) {
      const qty = getStock(warehouse.id, product.sku);
      totalQty += qty;

      if (qty > 0) {
        totalProducts += 1;
      }
    }

    return {
      ...warehouse,
      totalQty,
      totalProducts,
    };
  });
}

export function createWarehouse(input: { name: string; description?: string }): Warehouse {
  const name = input.name.trim();
  const description = (input.description ?? "").trim();

  if (!name) {
    throw new Error("El nombre del almacen es obligatorio.");
  }

  if (getStore().warehouses.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Ya existe un almacen con ese nombre.");
  }

  const id = `alm-${getStore().nextWarehouseNumber}`;
  getStore().nextWarehouseNumber += 1;

  const warehouse: Warehouse = {
    id,
    name,
    description,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  getStore().warehouses.push(warehouse);
  return warehouse;
}

export function updateWarehouse(input: {
  id: string;
  name: string;
  description?: string;
}): Warehouse {
  const warehouse = findWarehouseById(input.id);
  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del almacen es obligatorio.");
  }

  if (
    getStore().warehouses.some(
      (item) => item.id !== warehouse.id && item.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    throw new Error("Ya existe un almacen con ese nombre.");
  }

  warehouse.name = name;
  warehouse.description = (input.description ?? "").trim();
  warehouse.updatedAt = nowIso();

  return warehouse;
}

export function deleteWarehouse(warehouseId: string): void {
  findWarehouseById(warehouseId);

  for (const product of getStore().products) {
    const qty = getStock(warehouseId, product.sku);

    if (qty > 0) {
      throw new Error("No se puede eliminar un almacen con stock disponible.");
    }
  }

  getStore().warehouses = getStore().warehouses.filter((item) => item.id !== warehouseId);
}

export function listProductsWithStock(): ProductWithStock[] {
  const warehouses = listWarehouses();

  return [...getStore().products]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((product) => {
      const stockByWarehouse = warehouses.map((warehouse) => ({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        qty: getStock(warehouse.id, product.sku),
      }));

      const totalQty = stockByWarehouse.reduce((acc, item) => acc + item.qty, 0);

      return {
        ...product,
        totalQty,
        stockByWarehouse,
      };
    });
}

export function createProduct(input: {
  sku: number;
  name: string;
  price: number;
  initialQty?: number;
  initialWarehouseId?: string;
}): Product {
  if (!Number.isInteger(input.sku) || input.sku <= 0) {
    throw new Error("El SKU debe ser un numero entero positivo.");
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("El nombre del producto es obligatorio.");
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error("El precio debe ser un numero mayor o igual a 0.");
  }

  if (getStore().products.some((item) => item.sku === input.sku)) {
    throw new Error("Ya existe un producto con ese SKU.");
  }

  const product: Product = {
    sku: input.sku,
    name,
    price: Number(input.price.toFixed(2)),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  getStore().products.push(product);

  const initialQty = input.initialQty ?? 0;
  if (initialQty > 0) {
    if (!input.initialWarehouseId) {
      throw new Error("Selecciona un almacen para asignar el stock inicial.");
    }

    findWarehouseById(input.initialWarehouseId);
    setStock(input.initialWarehouseId, input.sku, Math.trunc(initialQty));
  }

  return product;
}

export function updateProduct(input: { sku: number; name: string; price: number }): Product {
  const product = findProductBySku(input.sku);
  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del producto es obligatorio.");
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error("El precio debe ser un numero mayor o igual a 0.");
  }

  product.name = name;
  product.price = Number(input.price.toFixed(2));
  product.updatedAt = nowIso();

  return product;
}

export function deleteProduct(sku: number): void {
  findProductBySku(sku);

  const totalStock = totalStockBySku(sku);
  if (totalStock > 0) {
    throw new Error("No se puede eliminar un producto con stock disponible.");
  }

  getStore().products = getStore().products.filter((item) => item.sku !== sku);
}

export function listMovements(limit?: number): Movement[] {
  const data = [...getStore().movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!limit) {
    return data;
  }

  return data.slice(0, limit);
}

export function createMovement(input: MovementInput): Movement {
  const qty = Math.trunc(input.quantity);

  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error("La cantidad debe ser un numero entero positivo.");
  }

  const product = findProductBySku(input.sku);

  let sourceWarehouse: Warehouse | null = null;
  let targetWarehouse: Warehouse | null = null;

  if (input.type === "salida" || input.type === "traslado") {
    if (!input.sourceWarehouseId) {
      throw new Error("Debes seleccionar un almacen origen.");
    }

    sourceWarehouse = findWarehouseById(input.sourceWarehouseId);
  }

  if (input.type === "entrada" || input.type === "traslado") {
    if (!input.targetWarehouseId) {
      throw new Error("Debes seleccionar un almacen destino.");
    }

    targetWarehouse = findWarehouseById(input.targetWarehouseId);
  }

  if (sourceWarehouse && targetWarehouse && sourceWarehouse.id === targetWarehouse.id) {
    throw new Error("El traslado requiere almacenes distintos.");
  }

  const sourceBeforeQty = sourceWarehouse ? getStock(sourceWarehouse.id, product.sku) : null;
  const targetBeforeQty = targetWarehouse ? getStock(targetWarehouse.id, product.sku) : null;

  if (sourceWarehouse && sourceBeforeQty !== null && sourceBeforeQty < qty) {
    throw new Error("Stock insuficiente en el almacen origen. No se permite stock negativo.");
  }

  const sourceAfterQty =
    sourceWarehouse && sourceBeforeQty !== null ? sourceBeforeQty - qty : null;
  const targetAfterQty =
    targetWarehouse && targetBeforeQty !== null ? targetBeforeQty + qty : null;

  if (sourceWarehouse && sourceAfterQty !== null) {
    setStock(sourceWarehouse.id, product.sku, sourceAfterQty);
  }

  if (targetWarehouse && targetAfterQty !== null) {
    setStock(targetWarehouse.id, product.sku, targetAfterQty);
  }

  const movementId = `mov-${String(getStore().nextMovementNumber).padStart(5, "0")}`;
  getStore().nextMovementNumber += 1;

  const movement: Movement = {
    id: movementId,
    type: input.type,
    sku: product.sku,
    productName: product.name,
    quantity: qty,
    sourceWarehouseId: sourceWarehouse?.id ?? null,
    sourceWarehouseName: sourceWarehouse?.name ?? null,
    targetWarehouseId: targetWarehouse?.id ?? null,
    targetWarehouseName: targetWarehouse?.name ?? null,
    sourceBeforeQty,
    sourceAfterQty,
    targetBeforeQty,
    targetAfterQty,
    performedBy: input.actor.username,
    performedByName: input.actor.displayName,
    note: (input.note ?? "").trim(),
    createdAt: nowIso(),
  };

  getStore().movements.push(movement);

  return movement;
}

export function listProductsWithStockByWarehouse(
  warehouseId: string,
): Array<Product & { qty: number }> {
  findWarehouseById(warehouseId);

  return getStore()
    .products.map((product) => ({
      ...product,
      qty: getStock(warehouseId, product.sku),
    }))
    .filter((item) => item.qty > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createSale(input: SaleInput): Sale {
  const warehouse = findWarehouseById(input.warehouseId);

  if (!input.items.length) {
    throw new Error("El carrito esta vacio.");
  }

  const lineItems: SaleLineItem[] = [];

  for (const item of input.items) {
    const product = findProductBySku(item.sku);
    const qty = Math.trunc(item.quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error(`Cantidad invalida para ${product.name}.`);
    }

    const available = getStock(warehouse.id, product.sku);

    if (available < qty) {
      throw new Error(
        `Stock insuficiente para ${product.name}. Disponible: ${available}, solicitado: ${qty}.`,
      );
    }

    lineItems.push({
      sku: product.sku,
      productName: product.name,
      price: product.price,
      quantity: qty,
      subtotal: Number((product.price * qty).toFixed(2)),
    });
  }

  const total = Number(lineItems.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2));

  if (!Number.isFinite(input.cashReceived) || input.cashReceived < total) {
    throw new Error("El monto recibido es insuficiente.");
  }

  const saleId = `vta-${String(getStore().nextSaleNumber).padStart(5, "0")}`;
  getStore().nextSaleNumber += 1;

  for (const item of lineItems) {
    createMovement({
      type: "salida",
      sku: item.sku,
      quantity: item.quantity,
      sourceWarehouseId: warehouse.id,
      note: `Venta POS ${saleId}`,
      actor: input.actor,
    });
  }

  const sale: Sale = {
    id: saleId,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    items: lineItems,
    itemCount: lineItems.reduce((acc, item) => acc + item.quantity, 0),
    total,
    cashReceived: input.cashReceived,
    change: Number((input.cashReceived - total).toFixed(2)),
    performedBy: input.actor.username,
    performedByName: input.actor.displayName,
    createdAt: nowIso(),
  };

  getStore().sales.push(sale);

  return sale;
}

export function listSales(limit?: number): Sale[] {
  const data = [...getStore().sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!limit) {
    return data;
  }

  return data.slice(0, limit);
}

export function findSaleById(id: string): Sale {
  const sale = getStore().sales.find((item) => item.id === id);

  if (!sale) {
    throw new Error("La venta no existe.");
  }

  return sale;
}

export function getDashboardMetrics(): DashboardMetrics {
  const products = listProductsWithStock();
  const movements = listMovements();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const movementsToday = movements.filter(
    (movement) => new Date(movement.createdAt).getTime() >= startOfDay.getTime(),
  ).length;

  const totalStock = products.reduce((acc, item) => acc + item.totalQty, 0);

  const lowStockProducts = products
    .filter((item) => item.totalQty <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.totalQty - b.totalQty)
    .slice(0, 6)
    .map((item) => ({
      sku: item.sku,
      name: item.name,
      totalQty: item.totalQty,
    }));

  return {
    totalProducts: products.length,
    totalWarehouses: listWarehouses().length,
    totalStock,
    movementsToday,
    lowStockProducts,
    latestMovements: movements.slice(0, 8),
  };
}
