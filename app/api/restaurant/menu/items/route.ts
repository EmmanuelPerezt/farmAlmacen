import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listMenuItems, createMenuItem } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const items = await listMenuItems(categoryId);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { name, description = "", price, categoryId } = await req.json();
  if (!name || !price || !categoryId) return NextResponse.json({ error: "Datos incompletos" }, { status: 422 });
  const item = await createMenuItem({ name, description, price: Number(price), categoryId });
  return NextResponse.json({ item }, { status: 201 });
}
