import { PrismaClient } from "@prisma/client";
import type {
  User,
  Session,
  TableSection,
  Table,
  TableWithStatus,
  TableStatus,
  TableShape,
  MenuItem,
  MenuCategory,
  Order,
  OrderItem,
  RestaurantStats,
} from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({ log: [] });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

// ─── Converters ───────────────────────────────────────────────────

function toUser(r: {
  id: string; username: string; password: string;
  displayName: string; role: string; createdAt: Date;
}): User {
  return { id: r.id, username: r.username, password: r.password,
    displayName: r.displayName, role: r.role as User["role"],
    createdAt: r.createdAt.toISOString() };
}

function toTableSection(r: {
  id: string; name: string; color: string; sortOrder: number; createdAt: Date;
}): TableSection {
  return { id: r.id, name: r.name, color: r.color, sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString() };
}

function toTable(r: {
  id: string; number: number; name: string | null; sectionId: string | null;
  shape: string; seats: number; posX: number; posY: number;
  width: number; height: number; rotation: number;
  createdAt: Date; updatedAt: Date;
  section?: { name: string; color: string } | null;
}): Table {
  return {
    id: r.id, number: r.number, name: r.name, sectionId: r.sectionId,
    sectionName: r.section?.name ?? null, sectionColor: r.section?.color ?? null,
    shape: r.shape as TableShape, seats: r.seats,
    posX: r.posX, posY: r.posY, width: r.width, height: r.height, rotation: r.rotation,
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
  };
}

function toMenuItem(r: {
  id: string; name: string; description: string; price: number;
  categoryId: string; available: boolean; sortOrder: number;
  createdAt: Date; updatedAt: Date;
  category?: { name: string } | null;
}): MenuItem {
  return {
    id: r.id, name: r.name, description: r.description, price: r.price,
    categoryId: r.categoryId, categoryName: r.category?.name ?? "",
    available: r.available, sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
  };
}

function toOrderItem(r: {
  id: string; orderId: string; menuItemId: string; name: string;
  unitPrice: number; quantity: number; notes: string;
  sentAt: Date | null; createdAt: Date;
}): OrderItem {
  return {
    id: r.id, orderId: r.orderId, menuItemId: r.menuItemId, name: r.name,
    unitPrice: r.unitPrice, quantity: r.quantity, notes: r.notes,
    sentAt: r.sentAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(),
  };
}

function toOrder(r: {
  id: string; tableId: string; status: string; guestCount: number;
  notes: string; openedBy: string; openedByName: string;
  closedAt: Date | null; total: number; cashReceived: number | null;
  change: number | null; paymentMethod: string | null; folio: number | null;
  createdAt: Date; updatedAt: Date;
  table?: { number: number; name: string | null } | null;
  items?: Array<{ id: string; orderId: string; menuItemId: string; name: string;
    unitPrice: number; quantity: number; notes: string; sentAt: Date | null; createdAt: Date; }>;
}): Order {
  return {
    id: r.id, tableId: r.tableId, tableNumber: r.table?.number ?? 0,
    tableName: r.table?.name ?? null, status: r.status as Order["status"],
    guestCount: r.guestCount, items: (r.items ?? []).map(toOrderItem),
    notes: r.notes, openedBy: r.openedBy, openedByName: r.openedByName,
    closedAt: r.closedAt?.toISOString() ?? null, total: r.total,
    cashReceived: r.cashReceived, change: r.change,
    paymentMethod: r.paymentMethod as Order["paymentMethod"], folio: r.folio,
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
  };
}

// ─── Users / Auth ─────────────────────────────────────────────────

export async function authenticateUser(username: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.password !== password) return null;
  return { username: user.username, displayName: user.displayName, role: user.role as Session["role"] };
}

export async function listUsers(): Promise<User[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toUser);
}

// ─── Table Sections ───────────────────────────────────────────────

export async function listTableSections(): Promise<TableSection[]> {
  const rows = await prisma.tableSection.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(toTableSection);
}

export async function createTableSection(data: { name: string; color: string }): Promise<TableSection> {
  const count = await prisma.tableSection.count();
  const row = await prisma.tableSection.create({ data: { ...data, sortOrder: count } });
  return toTableSection(row);
}

export async function updateTableSection(id: string, data: { name?: string; color?: string; sortOrder?: number }): Promise<TableSection> {
  const row = await prisma.tableSection.update({ where: { id }, data });
  return toTableSection(row);
}

export async function deleteTableSection(id: string): Promise<void> {
  await prisma.tableSection.delete({ where: { id } });
}

// ─── Tables ───────────────────────────────────────────────────────

export async function listTables(): Promise<Table[]> {
  const rows = await prisma.table.findMany({ include: { section: true }, orderBy: { number: "asc" } });
  return rows.map(toTable);
}

export async function listTablesWithStatus(): Promise<TableWithStatus[]> {
  const tables = await prisma.table.findMany({
    include: {
      section: true,
      orders: {
        where: { status: { in: ["open", "billed"] } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { number: "asc" },
  });

  return tables.map((t) => {
    const active = t.orders[0] ?? null;
    const status: TableStatus = active ? "occupied" : "available";
    return {
      ...toTable(t),
      status,
      activeOrder: active
        ? {
            id: active.id,
            guestCount: active.guestCount,
            total: active.total,
            itemCount: active.items.reduce((s, i) => s + i.quantity, 0),
            openedAt: active.createdAt.toISOString(),
            openedByName: active.openedByName,
            minutesOpen: Math.floor((Date.now() - active.createdAt.getTime()) / 60000),
          }
        : null,
    };
  });
}

export async function getTable(id: string): Promise<Table | null> {
  const row = await prisma.table.findUnique({ where: { id }, include: { section: true } });
  return row ? toTable(row) : null;
}

export async function createTable(data: {
  number: number; name?: string; sectionId?: string; shape: string;
  seats: number; posX: number; posY: number; width: number; height: number;
}): Promise<Table> {
  const row = await prisma.table.create({
    data: { ...data, name: data.name ?? null, sectionId: data.sectionId ?? null },
    include: { section: true },
  });
  return toTable(row);
}

export async function updateTable(id: string, data: Partial<{
  number: number; name: string | null; sectionId: string | null;
  shape: string; seats: number; posX: number; posY: number;
  width: number; height: number; rotation: number;
}>): Promise<Table> {
  const row = await prisma.table.update({ where: { id }, data, include: { section: true } });
  return toTable(row);
}

export async function updateTableLayout(updates: Array<{
  id: string; posX: number; posY: number; width: number; height: number; rotation: number;
}>): Promise<void> {
  await Promise.all(updates.map((u) =>
    prisma.table.update({ where: { id: u.id }, data: { posX: u.posX, posY: u.posY, width: u.width, height: u.height, rotation: u.rotation } })
  ));
}

export async function deleteTable(id: string): Promise<void> {
  await prisma.table.delete({ where: { id } });
}

// ─── Menu Categories ──────────────────────────────────────────────

export async function listMenuCategories(): Promise<MenuCategory[]> {
  const rows = await prisma.menuCategory.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({
    id: r.id, name: r.name, emoji: r.emoji, sortOrder: r.sortOrder,
    itemCount: r._count.items, createdAt: r.createdAt.toISOString(),
  }));
}

export async function createMenuCategory(data: { name: string; emoji: string }): Promise<MenuCategory> {
  const count = await prisma.menuCategory.count();
  const row = await prisma.menuCategory.create({
    data: { ...data, sortOrder: count },
    include: { _count: { select: { items: true } } },
  });
  return { id: row.id, name: row.name, emoji: row.emoji, sortOrder: row.sortOrder, itemCount: 0, createdAt: row.createdAt.toISOString() };
}

export async function updateMenuCategory(id: string, data: { name?: string; emoji?: string; sortOrder?: number }): Promise<MenuCategory> {
  const row = await prisma.menuCategory.update({
    where: { id }, data,
    include: { _count: { select: { items: true } } },
  });
  return { id: row.id, name: row.name, emoji: row.emoji, sortOrder: row.sortOrder, itemCount: row._count.items, createdAt: row.createdAt.toISOString() };
}

export async function deleteMenuCategory(id: string): Promise<void> {
  await prisma.menuCategory.delete({ where: { id } });
}

// ─── Menu Items ───────────────────────────────────────────────────

export async function listMenuItems(categoryId?: string): Promise<MenuItem[]> {
  const rows = await prisma.menuItem.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });
  return rows.map(toMenuItem);
}

export async function createMenuItem(data: { name: string; description: string; price: number; categoryId: string }): Promise<MenuItem> {
  const count = await prisma.menuItem.count({ where: { categoryId: data.categoryId } });
  const row = await prisma.menuItem.create({ data: { ...data, sortOrder: count }, include: { category: true } });
  return toMenuItem(row);
}

export async function updateMenuItem(id: string, data: Partial<{
  name: string; description: string; price: number;
  categoryId: string; available: boolean; sortOrder: number;
}>): Promise<MenuItem> {
  const row = await prisma.menuItem.update({ where: { id }, data, include: { category: true } });
  return toMenuItem(row);
}

export async function deleteMenuItem(id: string): Promise<void> {
  await prisma.menuItem.delete({ where: { id } });
}

// ─── Orders ───────────────────────────────────────────────────────

async function nextFolio(): Promise<number> {
  const seq = await prisma.orderSequence.upsert({
    where: { id: "singleton" },
    update: { value: { increment: 1 } },
    create: { id: "singleton", value: 101 },
  });
  return seq.value;
}

const ORDER_INCLUDE = {
  table: true,
  items: { orderBy: { createdAt: "asc" as const } },
} as const;

export async function listOrders(opts?: { status?: string | string[]; tableId?: string; limit?: number }): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: {
      ...(opts?.status ? { status: Array.isArray(opts.status) ? { in: opts.status } : opts.status } : {}),
      ...(opts?.tableId ? { tableId: opts.tableId } : {}),
    },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 200,
  });
  return rows.map(toOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  return row ? toOrder(row) : null;
}

export async function getActiveOrderForTable(tableId: string): Promise<Order | null> {
  const row = await prisma.order.findFirst({
    where: { tableId, status: { in: ["open", "billed"] } },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return row ? toOrder(row) : null;
}

export async function createOrder(data: {
  tableId: string; guestCount: number; openedBy: string; openedByName: string; notes?: string;
}): Promise<Order> {
  const row = await prisma.order.create({
    data: { tableId: data.tableId, guestCount: data.guestCount,
      openedBy: data.openedBy, openedByName: data.openedByName,
      notes: data.notes ?? "", status: "open" },
    include: ORDER_INCLUDE,
  });
  return toOrder(row);
}

export async function updateOrder(id: string, data: Partial<{ guestCount: number; notes: string; status: string }>): Promise<Order> {
  const row = await prisma.order.update({ where: { id }, data, include: ORDER_INCLUDE });
  return toOrder(row);
}

export async function addOrderItem(orderId: string, data: { menuItemId: string; quantity: number; notes?: string }): Promise<Order> {
  const menuItem = await prisma.menuItem.findUnique({ where: { id: data.menuItemId } });
  if (!menuItem) throw new Error("Item de menú no encontrado");
  const notes = data.notes ?? "";
  const existing = await prisma.orderItem.findFirst({ where: { orderId, menuItemId: data.menuItemId, notes } });
  if (existing) {
    await prisma.orderItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + data.quantity } });
  } else {
    await prisma.orderItem.create({ data: { orderId, menuItemId: data.menuItemId, name: menuItem.name, unitPrice: menuItem.price, quantity: data.quantity, notes } });
  }
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  await prisma.order.update({ where: { id: orderId }, data: { total } });
  const row = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  return toOrder(row);
}

export async function updateOrderItem(itemId: string, data: { quantity?: number; notes?: string }): Promise<Order> {
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: itemId } });
  if (data.quantity !== undefined && data.quantity <= 0) {
    await prisma.orderItem.delete({ where: { id: itemId } });
  } else {
    await prisma.orderItem.update({ where: { id: itemId }, data });
  }
  const items = await prisma.orderItem.findMany({ where: { orderId: item.orderId } });
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  await prisma.order.update({ where: { id: item.orderId }, data: { total } });
  const row = await prisma.order.findUniqueOrThrow({ where: { id: item.orderId }, include: ORDER_INCLUDE });
  return toOrder(row);
}

export async function removeOrderItem(itemId: string): Promise<Order> {
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: itemId } });
  await prisma.orderItem.delete({ where: { id: itemId } });
  const items = await prisma.orderItem.findMany({ where: { orderId: item.orderId } });
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  await prisma.order.update({ where: { id: item.orderId }, data: { total } });
  const row = await prisma.order.findUniqueOrThrow({ where: { id: item.orderId }, include: ORDER_INCLUDE });
  return toOrder(row);
}

export async function markItemsSent(orderId: string): Promise<Order> {
  await prisma.orderItem.updateMany({ where: { orderId, sentAt: null }, data: { sentAt: new Date() } });
  const row = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
  return toOrder(row);
}

export async function billOrder(orderId: string): Promise<Order> {
  const folio = await nextFolio();
  const row = await prisma.order.update({ where: { id: orderId }, data: { status: "billed", folio }, include: ORDER_INCLUDE });
  return toOrder(row);
}

export async function payOrder(orderId: string, data: { cashReceived?: number; paymentMethod: string }): Promise<Order> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const folio = order.folio ?? (await nextFolio());
  const cashReceived = data.cashReceived ?? order.total;
  const change = Math.max(0, cashReceived - order.total);
  const row = await prisma.order.update({
    where: { id: orderId },
    data: { status: "paid", folio, cashReceived, change, paymentMethod: data.paymentMethod, closedAt: new Date() },
    include: ORDER_INCLUDE,
  });
  return toOrder(row);
}

export async function cancelOrder(orderId: string): Promise<Order> {
  const row = await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled", closedAt: new Date() },
    include: ORDER_INCLUDE,
  });
  return toOrder(row);
}

// ─── Stats ────────────────────────────────────────────────────────

export async function getRestaurantStats(): Promise<RestaurantStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [tables, openOrders, todayOrders] = await Promise.all([
    prisma.table.findMany({ include: { orders: { where: { status: { in: ["open", "billed"] } } } } }),
    prisma.order.count({ where: { status: { in: ["open", "billed"] } } }),
    prisma.order.findMany({ where: { createdAt: { gte: startOfDay }, status: { in: ["paid", "billed"] } }, include: { items: true } }),
  ]);

  const tablesOccupied = tables.filter((t) => t.orders.length > 0).length;
  const totalRevenuToday = todayOrders.reduce((s, o) => s + o.total, 0);
  const itemCounts: Record<string, { name: string; count: number }> = {};
  for (const order of todayOrders) {
    for (const item of order.items) {
      if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, count: 0 };
      itemCounts[item.name].count += item.quantity;
    }
  }
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  return {
    tablesTotal: tables.length, tablesOccupied, tablesAvailable: tables.length - tablesOccupied,
    openOrders, totalRevenuToday, ordersToday: todayOrders.length,
    averageTicket: todayOrders.length > 0 ? totalRevenuToday / todayOrders.length : 0,
    topItems,
  };
}
