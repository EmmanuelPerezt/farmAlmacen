import { PrismaClient, type Prisma } from "@prisma/client";

import type {
  CashRegisterSession,
  DashboardMetrics,
  Movement,
  MovementType,
  Product,
  ProductWithStock,
  Role,
  Sale,
  SaleLineItem,
  SaleType,
  Session,
  User,
  Warehouse,
  WarehouseStockSummary,
} from "@/lib/types";

const LOW_STOCK_THRESHOLD = 10;

declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// ─── Type converters ─────────────────────────────────────────────────────────

type RawProduct = {
  sku: number;
  name: string;
  price: number;
  expirationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RawWarehouse = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

type RawUser = {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: string;
  createdAt: Date;
};

type RawMovement = {
  id: string;
  type: string;
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
  createdAt: Date;
};

type RawSale = {
  id: string;
  warehouseId: string;
  warehouseName: string;
  items: string;
  itemCount: number;
  total: number;
  cashReceived: number;
  change: number;
  saleType: string;
  authorizedBy: string | null;
  authorizedByName: string | null;
  cashRegisterSessionId: string | null;
  performedBy: string;
  performedByName: string;
  createdAt: Date;
};

type RawCashRegisterSession = {
  id: string;
  warehouseId: string;
  warehouseName: string;
  openingBalance: number;
  closedAt: Date | null;
  openedBy: string;
  openedByName: string;
  createdAt: Date;
};

function toProduct(raw: RawProduct): Product {
  return {
    sku: raw.sku,
    name: raw.name,
    price: raw.price,
    expirationDate: raw.expirationDate?.toISOString() ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}

function toWarehouse(raw: RawWarehouse): Warehouse {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}

function toUser(raw: RawUser): User {
  return {
    id: raw.id,
    username: raw.username,
    password: raw.password,
    displayName: raw.displayName,
    role: raw.role as Role,
    createdAt: raw.createdAt.toISOString(),
  };
}

function toMovement(raw: RawMovement): Movement {
  return {
    id: raw.id,
    type: raw.type as MovementType,
    sku: raw.sku,
    productName: raw.productName,
    quantity: raw.quantity,
    sourceWarehouseId: raw.sourceWarehouseId,
    sourceWarehouseName: raw.sourceWarehouseName,
    targetWarehouseId: raw.targetWarehouseId,
    targetWarehouseName: raw.targetWarehouseName,
    sourceBeforeQty: raw.sourceBeforeQty,
    sourceAfterQty: raw.sourceAfterQty,
    targetBeforeQty: raw.targetBeforeQty,
    targetAfterQty: raw.targetAfterQty,
    performedBy: raw.performedBy,
    performedByName: raw.performedByName,
    note: raw.note,
    createdAt: raw.createdAt.toISOString(),
  };
}

function parseSale(raw: RawSale): Sale {
  return {
    id: raw.id,
    warehouseId: raw.warehouseId,
    warehouseName: raw.warehouseName,
    items: JSON.parse(raw.items) as SaleLineItem[],
    itemCount: raw.itemCount,
    total: raw.total,
    cashReceived: raw.cashReceived,
    change: raw.change,
    saleType: (raw.saleType as SaleType) ?? "normal",
    authorizedBy: raw.authorizedBy,
    authorizedByName: raw.authorizedByName,
    cashRegisterSessionId: raw.cashRegisterSessionId,
    performedBy: raw.performedBy,
    performedByName: raw.performedByName,
    createdAt: raw.createdAt.toISOString(),
  };
}

async function parseCashRegisterSession(
  raw: RawCashRegisterSession,
): Promise<CashRegisterSession> {
  const sales = await prisma.sale.findMany({
    where: { cashRegisterSessionId: raw.id },
  });

  const normalSales = sales.filter((s) => s.saleType === "normal" || !s.saleType);
  const cortesiaSales = sales.filter((s) => s.saleType === "cortesia");

  const totalSales = Number(
    normalSales.reduce((acc, s) => acc + s.total, 0).toFixed(2),
  );
  const totalCortesia = Number(
    cortesiaSales.reduce((acc, s) => acc + s.total, 0).toFixed(2),
  );

  return {
    id: raw.id,
    warehouseId: raw.warehouseId,
    warehouseName: raw.warehouseName,
    openingBalance: raw.openingBalance,
    closedAt: raw.closedAt?.toISOString() ?? null,
    openedBy: raw.openedBy,
    openedByName: raw.openedByName,
    createdAt: raw.createdAt.toISOString(),
    totalSales,
    totalCortesia,
    expectedBalance: Number((raw.openingBalance + totalSales).toFixed(2)),
  };
}

function toPublicUser(user: User): Omit<User, "password"> {
  const { password, ...safeUser } = user;
  void password;
  return safeUser;
}

// ─── Input types ─────────────────────────────────────────────────────────────

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
  saleType?: SaleType;
  authorizedBy?: string;
  authorizedByName?: string;
  cashRegisterSessionId?: string;
  actor: Session;
};

type CashRegisterSessionInput = {
  warehouseId: string;
  openingBalance: number;
  actor: Session;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function authenticateUser(username: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findFirst({
    where: { username, password },
  });

  if (!user) {
    return null;
  }

  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role as Role,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<Array<Omit<User, "password">>> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return users.map((u) => toPublicUser(toUser(u)));
}

export async function createUser(input: {
  username: string;
  password: string;
  displayName: string;
  role: Role;
}): Promise<Omit<User, "password">> {
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

  try {
    const created = await prisma.user.create({
      data: { username, password, displayName, role: input.role },
    });
    return toPublicUser(toUser(created));
  } catch (error) {
    const msg = (error as { code?: string }).code;
    if (msg === "P2002") {
      throw new Error("Ya existe un usuario con ese nombre.");
    }
    throw error;
  }
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export async function listWarehouses(): Promise<Warehouse[]> {
  const warehouses = await prisma.warehouse.findMany({ orderBy: { name: "asc" } });
  return warehouses.map(toWarehouse);
}

export async function listWarehousesWithStock(): Promise<WarehouseStockSummary[]> {
  const [warehouses, inventoryRecords] = await Promise.all([
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
    prisma.inventory.findMany(),
  ]);

  return warehouses.map((warehouse) => {
    const warehouseInventory = inventoryRecords.filter((i) => i.warehouseId === warehouse.id);
    const totalQty = warehouseInventory.reduce((acc, i) => acc + i.qty, 0);
    const totalProducts = warehouseInventory.filter((i) => i.qty > 0).length;

    return {
      ...toWarehouse(warehouse),
      totalQty,
      totalProducts,
    };
  });
}

export async function createWarehouse(input: {
  name: string;
  description?: string;
}): Promise<Warehouse> {
  const name = input.name.trim();
  const description = (input.description ?? "").trim();

  if (!name) {
    throw new Error("El nombre del almacen es obligatorio.");
  }

  try {
    const warehouse = await prisma.warehouse.create({
      data: { name, description },
    });
    return toWarehouse(warehouse);
  } catch (error) {
    const msg = (error as { code?: string }).code;
    if (msg === "P2002") {
      throw new Error("Ya existe un almacen con ese nombre.");
    }
    throw error;
  }
}

export async function updateWarehouse(input: {
  id: string;
  name: string;
  description?: string;
}): Promise<Warehouse> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del almacen es obligatorio.");
  }

  const existing = await prisma.warehouse.findUnique({ where: { id: input.id } });
  if (!existing) {
    throw new Error("El almacen seleccionado no existe.");
  }

  // Check unique name among other warehouses (case-insensitive in code for SQLite)
  const others = await prisma.warehouse.findMany({ where: { id: { not: input.id } } });
  if (others.some((w) => w.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Ya existe un almacen con ese nombre.");
  }

  const warehouse = await prisma.warehouse.update({
    where: { id: input.id },
    data: { name, description: (input.description ?? "").trim() },
  });
  return toWarehouse(warehouse);
}

export async function deleteWarehouse(warehouseId: string): Promise<void> {
  const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!warehouse) {
    throw new Error("El almacen seleccionado no existe.");
  }

  const stockCount = await prisma.inventory.aggregate({
    where: { warehouseId },
    _sum: { qty: true },
  });

  if ((stockCount._sum.qty ?? 0) > 0) {
    throw new Error("No se puede eliminar un almacen con stock disponible.");
  }

  await prisma.warehouse.delete({ where: { id: warehouseId } });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function listProductsWithStock(): Promise<ProductWithStock[]> {
  const [products, warehouses, inventoryRecords] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ orderBy: { name: "asc" } }),
    prisma.inventory.findMany(),
  ]);

  return products.map((product) => {
    const stockByWarehouse = warehouses.map((warehouse) => {
      const inv = inventoryRecords.find(
        (i) => i.warehouseId === warehouse.id && i.sku === product.sku,
      );
      return {
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        qty: inv?.qty ?? 0,
      };
    });

    const totalQty = stockByWarehouse.reduce((acc, item) => acc + item.qty, 0);

    return {
      ...toProduct(product),
      totalQty,
      stockByWarehouse,
    };
  });
}

export async function createProduct(input: {
  sku: number;
  name: string;
  price: number;
  expirationDate?: string;
  initialQty?: number;
  initialWarehouseId?: string;
}): Promise<Product> {
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

  const initialQty = input.initialQty ?? 0;
  if (initialQty > 0 && !input.initialWarehouseId) {
    throw new Error("Selecciona un almacen para asignar el stock inicial.");
  }

  if (input.initialWarehouseId) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: input.initialWarehouseId },
    });
    if (!warehouse) {
      throw new Error("El almacen seleccionado no existe.");
    }
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: input.sku,
          name,
          price: Number(input.price.toFixed(2)),
          expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
        },
      });

      if (initialQty > 0 && input.initialWarehouseId) {
        await tx.inventory.upsert({
          where: {
            warehouseId_sku: {
              warehouseId: input.initialWarehouseId,
              sku: input.sku,
            },
          },
          update: { qty: Math.trunc(initialQty) },
          create: {
            warehouseId: input.initialWarehouseId,
            sku: input.sku,
            qty: Math.trunc(initialQty),
          },
        });
      }

      return created;
    });

    return toProduct(product);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      throw new Error("Ya existe un producto con ese SKU.");
    }
    throw error;
  }
}

export async function updateProduct(input: {
  sku: number;
  name: string;
  price: number;
  expirationDate?: string | null;
}): Promise<Product> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("El nombre del producto es obligatorio.");
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error("El precio debe ser un numero mayor o igual a 0.");
  }

  const existing = await prisma.product.findUnique({ where: { sku: input.sku } });
  if (!existing) {
    throw new Error("El producto seleccionado no existe.");
  }

  const data: Prisma.ProductUpdateInput = {
    name,
    price: Number(input.price.toFixed(2)),
  };

  if (input.expirationDate !== undefined) {
    data.expirationDate = input.expirationDate ? new Date(input.expirationDate) : null;
  }

  const product = await prisma.product.update({
    where: { sku: input.sku },
    data,
  });
  return toProduct(product);
}

export async function deleteProduct(sku: number): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { sku } });
  if (!existing) {
    throw new Error("El producto seleccionado no existe.");
  }

  const stockCount = await prisma.inventory.aggregate({
    where: { sku },
    _sum: { qty: true },
  });

  if ((stockCount._sum.qty ?? 0) > 0) {
    throw new Error("No se puede eliminar un producto con stock disponible.");
  }

  await prisma.product.delete({ where: { sku } });
}

// ─── Movements ────────────────────────────────────────────────────────────────

export async function listMovements(limit?: number): Promise<Movement[]> {
  const movements = await prisma.movement.findMany({
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
  return movements.map(toMovement);
}

async function createMovementTx(
  tx: Prisma.TransactionClient,
  input: MovementInput,
): Promise<Movement> {
  const qty = Math.trunc(input.quantity);

  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error("La cantidad debe ser un numero entero positivo.");
  }

  const product = await tx.product.findUnique({ where: { sku: input.sku } });
  if (!product) {
    throw new Error("El producto seleccionado no existe.");
  }

  let sourceWarehouse: { id: string; name: string } | null = null;
  let targetWarehouse: { id: string; name: string } | null = null;

  if (input.type === "salida" || input.type === "traslado") {
    if (!input.sourceWarehouseId) {
      throw new Error("Debes seleccionar un almacen origen.");
    }
    sourceWarehouse = await tx.warehouse.findUnique({
      where: { id: input.sourceWarehouseId },
    });
    if (!sourceWarehouse) {
      throw new Error("El almacen seleccionado no existe.");
    }
  }

  if (input.type === "entrada" || input.type === "traslado") {
    if (!input.targetWarehouseId) {
      throw new Error("Debes seleccionar un almacen destino.");
    }
    targetWarehouse = await tx.warehouse.findUnique({
      where: { id: input.targetWarehouseId },
    });
    if (!targetWarehouse) {
      throw new Error("El almacen seleccionado no existe.");
    }
  }

  if (sourceWarehouse && targetWarehouse && sourceWarehouse.id === targetWarehouse.id) {
    throw new Error("El traslado requiere almacenes distintos.");
  }

  const sourceInv = sourceWarehouse
    ? await tx.inventory.findUnique({
        where: { warehouseId_sku: { warehouseId: sourceWarehouse.id, sku: product.sku } },
      })
    : null;
  const targetInv = targetWarehouse
    ? await tx.inventory.findUnique({
        where: { warehouseId_sku: { warehouseId: targetWarehouse.id, sku: product.sku } },
      })
    : null;

  const sourceBeforeQty =
    sourceWarehouse !== null ? (sourceInv?.qty ?? 0) : null;
  const targetBeforeQty =
    targetWarehouse !== null ? (targetInv?.qty ?? 0) : null;

  if (sourceWarehouse && sourceBeforeQty !== null && sourceBeforeQty < qty) {
    throw new Error("Stock insuficiente en el almacen origen. No se permite stock negativo.");
  }

  const sourceAfterQty =
    sourceWarehouse && sourceBeforeQty !== null ? sourceBeforeQty - qty : null;
  const targetAfterQty =
    targetWarehouse && targetBeforeQty !== null ? targetBeforeQty + qty : null;

  if (sourceWarehouse && sourceAfterQty !== null) {
    if (sourceAfterQty <= 0) {
      await tx.inventory.deleteMany({
        where: { warehouseId: sourceWarehouse.id, sku: product.sku },
      });
    } else {
      await tx.inventory.upsert({
        where: { warehouseId_sku: { warehouseId: sourceWarehouse.id, sku: product.sku } },
        update: { qty: sourceAfterQty },
        create: { warehouseId: sourceWarehouse.id, sku: product.sku, qty: sourceAfterQty },
      });
    }
  }

  if (targetWarehouse && targetAfterQty !== null) {
    await tx.inventory.upsert({
      where: { warehouseId_sku: { warehouseId: targetWarehouse.id, sku: product.sku } },
      update: { qty: targetAfterQty },
      create: { warehouseId: targetWarehouse.id, sku: product.sku, qty: targetAfterQty },
    });
  }

  const movement = await tx.movement.create({
    data: {
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
    },
  });

  return toMovement(movement);
}

export async function createMovement(input: MovementInput): Promise<Movement> {
  return prisma.$transaction((tx) => createMovementTx(tx, input));
}

export async function listProductsWithStockByWarehouse(
  warehouseId: string,
): Promise<Array<Product & { qty: number }>> {
  const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!warehouse) {
    throw new Error("El almacen seleccionado no existe.");
  }

  const inventoryRecords = await prisma.inventory.findMany({
    where: { warehouseId, qty: { gt: 0 } },
    include: { product: true },
    orderBy: { product: { name: "asc" } },
  });

  return inventoryRecords.map((inv) => ({
    ...toProduct(inv.product),
    qty: inv.qty,
  }));
}

// ─── Cash Register Sessions ───────────────────────────────────────────────────

export async function createCashRegisterSession(
  input: CashRegisterSessionInput,
): Promise<CashRegisterSession> {
  const warehouse = await prisma.warehouse.findUnique({ where: { id: input.warehouseId } });
  if (!warehouse) {
    throw new Error("El almacen seleccionado no existe.");
  }

  if (!Number.isFinite(input.openingBalance) || input.openingBalance < 0) {
    throw new Error("El fondo inicial debe ser un numero mayor o igual a 0.");
  }

  const session = await prisma.cashRegisterSession.create({
    data: {
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      openingBalance: Number(input.openingBalance.toFixed(2)),
      openedBy: input.actor.username,
      openedByName: input.actor.displayName,
    },
  });

  return parseCashRegisterSession(session);
}

export async function findCashRegisterSession(id: string): Promise<CashRegisterSession> {
  const session = await prisma.cashRegisterSession.findUnique({ where: { id } });
  if (!session) {
    throw new Error("La sesion de caja no existe.");
  }
  return parseCashRegisterSession(session);
}

export async function closeCashRegisterSession(id: string): Promise<CashRegisterSession> {
  const session = await prisma.cashRegisterSession.findUnique({ where: { id } });
  if (!session) {
    throw new Error("La sesion de caja no existe.");
  }

  const updated = await prisma.cashRegisterSession.update({
    where: { id },
    data: { closedAt: new Date() },
  });
  return parseCashRegisterSession(updated);
}

export async function listAdminUsers(): Promise<Array<Omit<User, "password">>> {
  const users = await prisma.user.findMany({
    where: { role: "admin" },
    orderBy: { displayName: "asc" },
  });
  return users.map((u) => toPublicUser(toUser(u)));
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export async function createSale(input: SaleInput): Promise<Sale> {
  const saleType = input.saleType ?? "normal";
  const isCortesia = saleType === "cortesia";

  return prisma.$transaction(async (tx) => {
    const warehouse = await tx.warehouse.findUnique({ where: { id: input.warehouseId } });
    if (!warehouse) {
      throw new Error("El almacen seleccionado no existe.");
    }

    if (!input.items.length) {
      throw new Error("El carrito esta vacio.");
    }

    if (isCortesia && !input.authorizedBy) {
      throw new Error("Las salidas sin pago requieren autorizacion de un administrador.");
    }

    const lineItems: SaleLineItem[] = [];

    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { sku: item.sku } });
      if (!product) {
        throw new Error("El producto seleccionado no existe.");
      }

      const qty = Math.trunc(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`Cantidad invalida para ${product.name}.`);
      }

      const inv = await tx.inventory.findUnique({
        where: { warehouseId_sku: { warehouseId: warehouse.id, sku: product.sku } },
      });
      const available = inv?.qty ?? 0;

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

    if (!isCortesia) {
      if (!Number.isFinite(input.cashReceived) || input.cashReceived < total) {
        throw new Error("El monto recibido es insuficiente.");
      }
    }

    const movementNote = isCortesia
      ? `Salida sin pago - Autorizado por: ${input.authorizedByName ?? input.authorizedBy}`
      : "Venta POS";

    for (const item of lineItems) {
      await createMovementTx(tx, {
        type: "salida",
        sku: item.sku,
        quantity: item.quantity,
        sourceWarehouseId: warehouse.id,
        note: movementNote,
        actor: input.actor,
      });
    }

    const cashReceived = isCortesia ? 0 : input.cashReceived;
    const change = isCortesia ? 0 : Number((input.cashReceived - total).toFixed(2));

    const sale = await tx.sale.create({
      data: {
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        items: JSON.stringify(lineItems),
        itemCount: lineItems.reduce((acc, item) => acc + item.quantity, 0),
        total,
        cashReceived,
        change,
        saleType,
        authorizedBy: input.authorizedBy ?? null,
        authorizedByName: input.authorizedByName ?? null,
        cashRegisterSessionId: input.cashRegisterSessionId ?? null,
        performedBy: input.actor.username,
        performedByName: input.actor.displayName,
      },
    });

    return parseSale(sale);
  });
}

export async function listSales(limit?: number): Promise<Sale[]> {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
  return sales.map(parseSale);
}

export async function findSaleById(id: string): Promise<Sale> {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) {
    throw new Error("La venta no existe.");
  }
  return parseSale(sale);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const EXPIRATION_THRESHOLD_DAYS = 30;

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [products, warehouses, inventoryRecords, movementsToday, latestMovements] =
    await Promise.all([
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.warehouse.findMany(),
      prisma.inventory.findMany(),
      prisma.movement.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.movement.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

  const productWithTotals = products.map((product) => {
    const totalQty = inventoryRecords
      .filter((i) => i.sku === product.sku)
      .reduce((acc, i) => acc + i.qty, 0);
    return { ...product, totalQty };
  });

  const totalStock = productWithTotals.reduce((acc, p) => acc + p.totalQty, 0);

  const lowStockProducts = productWithTotals
    .filter((p) => p.totalQty <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.totalQty - b.totalQty)
    .slice(0, 6)
    .map((p) => ({ sku: p.sku, name: p.name, totalQty: p.totalQty }));

  const now = new Date();
  const thresholdDate = new Date(now.getTime() + EXPIRATION_THRESHOLD_DAYS * 86_400_000);

  const expiringProducts = products
    .filter((p) => p.expirationDate && p.expirationDate <= thresholdDate)
    .sort((a, b) => a.expirationDate!.getTime() - b.expirationDate!.getTime())
    .slice(0, 6)
    .map((p) => ({
      sku: p.sku,
      name: p.name,
      expirationDate: p.expirationDate!.toISOString(),
      daysUntilExpiration: Math.ceil(
        (p.expirationDate!.getTime() - now.getTime()) / 86_400_000,
      ),
    }));

  return {
    totalProducts: products.length,
    totalWarehouses: warehouses.length,
    totalStock,
    movementsToday,
    lowStockProducts,
    expiringProducts,
    latestMovements: latestMovements.map(toMovement),
  };
}
