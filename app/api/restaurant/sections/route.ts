import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listTableSections, createTableSection } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const sections = await listTableSections();
  return NextResponse.json({ sections });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { name, color = "#f59e0b" } = await req.json();
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 422 });
  const section = await createTableSection({ name, color });
  return NextResponse.json({ section }, { status: 201 });
}
