import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listMenuCategories, createMenuCategory } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const categories = await listMenuCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { name, emoji = "🍽️" } = await req.json();
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 422 });
  const category = await createMenuCategory({ name, emoji });
  return NextResponse.json({ category }, { status: 201 });
}
