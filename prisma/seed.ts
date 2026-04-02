import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_DATE = new Date("2024-01-01T00:00:00.000Z");

async function main() {
  console.log("🌱 Seeding restaurant database...");

  // ── Users ──────────────────────────────────────────────
  const users = [
    { id: "usr-1", username: "admin", password: "admin123", displayName: "Administrador", role: "admin" },
    { id: "usr-2", username: "empleado", password: "empleado123", displayName: "Mesero", role: "empleado" },
    { id: "usr-3", username: "cocina", password: "cocina123", displayName: "Chef Principal", role: "empleado" },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { ...user, createdAt: SEED_DATE },
    });
  }

  // ── Table Sections ─────────────────────────────────────
  const sections = [
    { id: "sec-1", name: "Salón Principal", color: "#f59e0b", sortOrder: 0 },
    { id: "sec-2", name: "Terraza", color: "#10b981", sortOrder: 1 },
    { id: "sec-3", name: "Barra", color: "#8b5cf6", sortOrder: 2 },
    { id: "sec-4", name: "VIP", color: "#ef4444", sortOrder: 3 },
  ];

  for (const sec of sections) {
    await prisma.tableSection.upsert({
      where: { id: sec.id },
      update: {},
      create: { ...sec, createdAt: SEED_DATE },
    });
  }

  // ── Tables ─────────────────────────────────────────────
  const tables = [
    // Salón Principal - 8 mesas
    { id: "tbl-01", number: 1,  sectionId: "sec-1", shape: "square",    seats: 4, posX: 80,  posY: 80,  width: 110, height: 110, rotation: 0 },
    { id: "tbl-02", number: 2,  sectionId: "sec-1", shape: "square",    seats: 4, posX: 220, posY: 80,  width: 110, height: 110, rotation: 0 },
    { id: "tbl-03", number: 3,  sectionId: "sec-1", shape: "square",    seats: 4, posX: 360, posY: 80,  width: 110, height: 110, rotation: 0 },
    { id: "tbl-04", number: 4,  sectionId: "sec-1", shape: "square",    seats: 6, posX: 80,  posY: 220, width: 110, height: 110, rotation: 0 },
    { id: "tbl-05", number: 5,  sectionId: "sec-1", shape: "square",    seats: 6, posX: 220, posY: 220, width: 110, height: 110, rotation: 0 },
    { id: "tbl-06", number: 6,  sectionId: "sec-1", shape: "square",    seats: 4, posX: 360, posY: 220, width: 110, height: 110, rotation: 0 },
    { id: "tbl-07", number: 7,  sectionId: "sec-1", shape: "rectangle", seats: 8, posX: 80,  posY: 360, width: 250, height: 110, rotation: 0 },
    { id: "tbl-08", number: 8,  sectionId: "sec-1", shape: "square",    seats: 4, posX: 360, posY: 360, width: 110, height: 110, rotation: 0 },
    // Terraza - 4 mesas redondas
    { id: "tbl-09", number: 9,  sectionId: "sec-2", shape: "round",     seats: 4, posX: 600, posY: 80,  width: 110, height: 110, rotation: 0 },
    { id: "tbl-10", number: 10, sectionId: "sec-2", shape: "round",     seats: 4, posX: 740, posY: 80,  width: 110, height: 110, rotation: 0 },
    { id: "tbl-11", number: 11, sectionId: "sec-2", shape: "round",     seats: 2, posX: 600, posY: 220, width: 90,  height: 90,  rotation: 0 },
    { id: "tbl-12", number: 12, sectionId: "sec-2", shape: "round",     seats: 2, posX: 720, posY: 220, width: 90,  height: 90,  rotation: 0 },
    // Barra - 3 mesas pequeñas
    { id: "tbl-13", number: 13, sectionId: "sec-3", shape: "round",     seats: 2, posX: 600, posY: 360, width: 80,  height: 80,  rotation: 0 },
    { id: "tbl-14", number: 14, sectionId: "sec-3", shape: "round",     seats: 2, posX: 710, posY: 360, width: 80,  height: 80,  rotation: 0 },
    { id: "tbl-15", number: 15, sectionId: "sec-3", shape: "round",     seats: 2, posX: 820, posY: 360, width: 80,  height: 80,  rotation: 0 },
    // VIP - 2 mesas grandes
    { id: "tbl-16", number: 16, name: "VIP 1", sectionId: "sec-4", shape: "rectangle", seats: 10, posX: 500, posY: 480, width: 220, height: 120, rotation: 0 },
    { id: "tbl-17", number: 17, name: "VIP 2", sectionId: "sec-4", shape: "rectangle", seats: 10, posX: 750, posY: 480, width: 220, height: 120, rotation: 0 },
  ];

  for (const tbl of tables) {
    await prisma.table.upsert({
      where: { id: tbl.id },
      update: {},
      create: { ...tbl, name: tbl.name ?? null, createdAt: SEED_DATE, updatedAt: SEED_DATE },
    });
  }

  // ── Menu Categories ────────────────────────────────────
  const categories = [
    { id: "cat-1", name: "Entradas",         emoji: "🥗", sortOrder: 0 },
    { id: "cat-2", name: "Sopas y Cremas",   emoji: "🍲", sortOrder: 1 },
    { id: "cat-3", name: "Platos Fuertes",   emoji: "🍖", sortOrder: 2 },
    { id: "cat-4", name: "Pastas y Arroces", emoji: "🍝", sortOrder: 3 },
    { id: "cat-5", name: "Postres",          emoji: "🍮", sortOrder: 4 },
    { id: "cat-6", name: "Bebidas",          emoji: "🥤", sortOrder: 5 },
    { id: "cat-7", name: "Vinos",            emoji: "🍷", sortOrder: 6 },
    { id: "cat-8", name: "Cócteles",         emoji: "🍹", sortOrder: 7 },
  ];

  for (const cat of categories) {
    await prisma.menuCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: { ...cat, createdAt: SEED_DATE },
    });
  }

  // ── Menu Items ─────────────────────────────────────────
  const items = [
    // Entradas
    { id: "itm-01", name: "Tabla de Quesos y Embutidos",  description: "Selección de quesos artesanales con embutidos importados", price: 185, categoryId: "cat-1", sortOrder: 0 },
    { id: "itm-02", name: "Bruschetta Tricolor",           description: "Pan artesanal con jitomate, albahaca y mozzarella fresca", price: 95,  categoryId: "cat-1", sortOrder: 1 },
    { id: "itm-03", name: "Ceviche de Camarón",            description: "Camarón fresco marinado con limón, chile y cilantro", price: 145,  categoryId: "cat-1", sortOrder: 2 },
    { id: "itm-04", name: "Carpaccio de Res",              description: "Res premium rebanada, rúcula, parmesano y alcaparras", price: 165,  categoryId: "cat-1", sortOrder: 3 },
    { id: "itm-05", name: "Alitas BBQ (12 pzas)",          description: "Alitas crujientes con salsa BBQ casera y celery", price: 155,  categoryId: "cat-1", sortOrder: 4 },
    // Sopas
    { id: "itm-06", name: "Sopa de Elote",                 description: "Crema de elote con chorizo crocante y crema agria", price: 85,  categoryId: "cat-2", sortOrder: 0 },
    { id: "itm-07", name: "Caldo Tlalpeño",                description: "Caldo tradicional con pollo, chipotle y epazote", price: 95,  categoryId: "cat-2", sortOrder: 1 },
    { id: "itm-08", name: "Minestrone de la Casa",         description: "Sopa italiana de verduras con pasta y parmesano", price: 90,  categoryId: "cat-2", sortOrder: 2 },
    // Platos Fuertes
    { id: "itm-09", name: "Filete Mignon 250g",            description: "Corte premium con salsa de vino tinto y puré de papa", price: 395, categoryId: "cat-3", sortOrder: 0 },
    { id: "itm-10", name: "Pollo a la Toscana",            description: "Pechuga de pollo con espinacas, jitomates y crema", price: 225, categoryId: "cat-3", sortOrder: 1 },
    { id: "itm-11", name: "Salmón a la Plancha",           description: "Salmón noruego con espárragos y salsa de limón", price: 285, categoryId: "cat-3", sortOrder: 2 },
    { id: "itm-12", name: "Costillar de Cerdo BBQ",        description: "Rack de costillas ahumadas con guarnición de la casa", price: 345, categoryId: "cat-3", sortOrder: 3 },
    { id: "itm-13", name: "Arrachera Norteña",             description: "Arrachera marinada con guacamole y tortillas de harina", price: 265, categoryId: "cat-3", sortOrder: 4 },
    { id: "itm-14", name: "Chiles en Nogada",              description: "Platillo mexicano de temporada con granada y perejil", price: 295, categoryId: "cat-3", sortOrder: 5 },
    // Pastas y Arroces
    { id: "itm-15", name: "Pasta Carbonara",               description: "Espagueti con panceta, yema de huevo y parmesano", price: 175, categoryId: "cat-4", sortOrder: 0 },
    { id: "itm-16", name: "Risotto de Hongos",             description: "Arroz arbóreo cremoso con hongos mixtos y trufa", price: 195, categoryId: "cat-4", sortOrder: 1 },
    { id: "itm-17", name: "Pasta Primavera",               description: "Penne con verduras de temporada en salsa de albahaca", price: 155, categoryId: "cat-4", sortOrder: 2 },
    { id: "itm-18", name: "Linguine al Frutti di Mare",    description: "Pasta con mariscos en salsa de jitomate y vino blanco", price: 245, categoryId: "cat-4", sortOrder: 3 },
    // Postres
    { id: "itm-19", name: "Lava Cake de Chocolate",        description: "Pastel tibio con corazón líquido y helado de vainilla", price: 95,  categoryId: "cat-5", sortOrder: 0 },
    { id: "itm-20", name: "Tiramisú Clásico",              description: "Postre italiano con mascarpone, espresso y cacao", price: 85,  categoryId: "cat-5", sortOrder: 1 },
    { id: "itm-21", name: "Crème Brûlée",                  description: "Crema francesa caramelizada con frambuesas frescas", price: 90,  categoryId: "cat-5", sortOrder: 2 },
    { id: "itm-22", name: "Helado Artesanal (3 bolas)",    description: "Elección de sabores: vainilla, chocolate o fresa", price: 75,  categoryId: "cat-5", sortOrder: 3 },
    // Bebidas
    { id: "itm-23", name: "Agua Natural 600ml",            description: "", price: 25,  categoryId: "cat-6", sortOrder: 0 },
    { id: "itm-24", name: "Refresco",                      description: "Coca-Cola, Sprite, Fanta, Squirt", price: 35,  categoryId: "cat-6", sortOrder: 1 },
    { id: "itm-25", name: "Jugo Natural",                  description: "Naranja, piña, zanahoria o mezcla", price: 55,  categoryId: "cat-6", sortOrder: 2 },
    { id: "itm-26", name: "Café Americano",                description: "Café de grano recién molido", price: 45,  categoryId: "cat-6", sortOrder: 3 },
    { id: "itm-27", name: "Cappuccino",                    description: "Espresso doble con espuma de leche", price: 65,  categoryId: "cat-6", sortOrder: 4 },
    { id: "itm-28", name: "Agua de Jamaica / Horchata",    description: "Bebida fresca de temporada", price: 40,  categoryId: "cat-6", sortOrder: 5 },
    // Vinos
    { id: "itm-29", name: "Vino Tinto Copa",               description: "Selección del sommelier - vinos de Valle de Guadalupe", price: 95,  categoryId: "cat-7", sortOrder: 0 },
    { id: "itm-30", name: "Vino Blanco Copa",              description: "Chardonnay o Sauvignon Blanc de la casa", price: 85,  categoryId: "cat-7", sortOrder: 1 },
    { id: "itm-31", name: "Vino Tinto Botella",            description: "Botella de vino tinto premium Valle de Guadalupe", price: 450, categoryId: "cat-7", sortOrder: 2 },
    { id: "itm-32", name: "Vino Blanco Botella",           description: "Botella de vino blanco selección del sommelier", price: 380, categoryId: "cat-7", sortOrder: 3 },
    // Cócteles
    { id: "itm-33", name: "Margarita Clásica",             description: "Tequila, Cointreau, limón y sal", price: 115, categoryId: "cat-8", sortOrder: 0 },
    { id: "itm-34", name: "Mojito",                        description: "Ron, menta, limón, azúcar y soda", price: 105, categoryId: "cat-8", sortOrder: 1 },
    { id: "itm-35", name: "Gin Tónic",                     description: "Gin premium con agua tónica artesanal y botánicos", price: 125, categoryId: "cat-8", sortOrder: 2 },
    { id: "itm-36", name: "Paloma",                        description: "Tequila blanco, toronja y sal de gusano", price: 110, categoryId: "cat-8", sortOrder: 3 },
  ];

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, createdAt: SEED_DATE, updatedAt: SEED_DATE },
    });
  }

  // ── OrderSequence singleton ────────────────────────────
  await prisma.orderSequence.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", value: 100 },
  });

  console.log("✅ Seed complete!");
  console.log("   • 3 users (admin/admin123, empleado/empleado123, cocina/cocina123)");
  console.log("   • 4 sections, 17 tables");
  console.log("   • 8 menu categories, 36 items");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
