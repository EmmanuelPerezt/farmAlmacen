import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_DATE = new Date("2024-01-01T00:00:00.000Z");

const users = [
  {
    id: "usr-1",
    username: "admin",
    password: "admin123",
    displayName: "Administrador",
    role: "admin",
  },
  {
    id: "usr-2",
    username: "empleado",
    password: "empleado123",
    displayName: "Operador",
    role: "empleado",
  },
];

const products = [
  { sku: 1001, name: "Paracetamol 500mg", price: 4.25 },
  { sku: 1002, name: "Ibuprofeno 400mg", price: 5.5 },
  { sku: 1003, name: "Amoxicilina 500mg", price: 12.0 },
  { sku: 1004, name: "Omeprazol 20mg", price: 8.75 },
  { sku: 1005, name: "Metformina 500mg", price: 6.3 },
  { sku: 1006, name: "Atorvastatina 20mg", price: 15.9 },
  { sku: 1007, name: "Losartan 50mg", price: 7.2 },
  { sku: 1008, name: "Amlodipino 5mg", price: 9.5 },
  { sku: 1009, name: "Loratadina 10mg", price: 3.8 },
  { sku: 1010, name: "Diclofenaco 50mg", price: 4.6 },
];

const warehouses = [
  {
    id: "alm-1",
    name: "Almacen Central",
    description: "Bodega principal de recepcion",
  },
  {
    id: "alm-2",
    name: "Almacen Mostrador",
    description: "Stock de despacho diario",
  },
];

const inventory = [
  { warehouseId: "alm-1", sku: 1001, qty: 180 },
  { warehouseId: "alm-1", sku: 1002, qty: 120 },
  { warehouseId: "alm-1", sku: 1003, qty: 50 },
  { warehouseId: "alm-1", sku: 1004, qty: 30 },
  { warehouseId: "alm-1", sku: 1005, qty: 200 },
  { warehouseId: "alm-1", sku: 1006, qty: 25 },
  { warehouseId: "alm-1", sku: 1007, qty: 40 },
  { warehouseId: "alm-1", sku: 1008, qty: 35 },
  { warehouseId: "alm-1", sku: 1009, qty: 60 },
  { warehouseId: "alm-1", sku: 1010, qty: 5 },
  { warehouseId: "alm-2", sku: 1001, qty: 45 },
  { warehouseId: "alm-2", sku: 1002, qty: 32 },
  { warehouseId: "alm-2", sku: 1003, qty: 8 },
  { warehouseId: "alm-2", sku: 1004, qty: 5 },
  { warehouseId: "alm-2", sku: 1005, qty: 100 },
  { warehouseId: "alm-2", sku: 1006, qty: 3 },
  { warehouseId: "alm-2", sku: 1008, qty: 12 },
  { warehouseId: "alm-2", sku: 1009, qty: 20 },
  { warehouseId: "alm-2", sku: 1010, qty: 2 },
];

async function main() {
  console.log("Seeding database...");

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { ...user, createdAt: SEED_DATE },
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: { ...product, createdAt: SEED_DATE, updatedAt: SEED_DATE },
    });
  }

  for (const warehouse of warehouses) {
    await prisma.warehouse.upsert({
      where: { id: warehouse.id },
      update: {},
      create: { ...warehouse, createdAt: SEED_DATE, updatedAt: SEED_DATE },
    });
  }

  for (const inv of inventory) {
    await prisma.inventory.upsert({
      where: { warehouseId_sku: { warehouseId: inv.warehouseId, sku: inv.sku } },
      update: {},
      create: inv,
    });
  }

  console.log("Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
