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

// ─── Restaurant Types ─────────────────────────────────────────────

export type TableShape = "square" | "round" | "rectangle";
export type TableStatus = "available" | "occupied" | "reserved" | "cleaning";
export type OrderStatus = "open" | "billed" | "paid" | "cancelled";
export type PaymentMethod = "cash" | "card" | "mixed";

export type TableSection = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
};

export type Table = {
  id: string;
  number: number;
  name: string | null;
  sectionId: string | null;
  sectionName: string | null;
  sectionColor: string | null;
  shape: TableShape;
  seats: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
};

export type TableWithStatus = Table & {
  status: TableStatus;
  activeOrder: ActiveOrderSummary | null;
};

export type ActiveOrderSummary = {
  id: string;
  guestCount: number;
  total: number;
  itemCount: number;
  openedAt: string;
  openedByName: string;
  minutesOpen: number;
};

export type MenuCategory = {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  itemCount: number;
  createdAt: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  available: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  sentAt: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  tableId: string;
  tableNumber: number;
  tableName: string | null;
  status: OrderStatus;
  guestCount: number;
  items: OrderItem[];
  notes: string;
  openedBy: string;
  openedByName: string;
  closedAt: string | null;
  total: number;
  cashReceived: number | null;
  change: number | null;
  paymentMethod: PaymentMethod | null;
  folio: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantStats = {
  tablesTotal: number;
  tablesOccupied: number;
  tablesAvailable: number;
  openOrders: number;
  totalRevenuToday: number;
  ordersToday: number;
  averageTicket: number;
  topItems: Array<{ name: string; count: number }>;
};
