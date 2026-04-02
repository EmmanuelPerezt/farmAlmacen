import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listTablesWithStatus, createTable } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const tables = await listTablesWithStatus();
  return NextResponse.json({ tables });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  try {
    const body = await req.json();
    const { number, name, sectionId, shape = "square", seats = 4, posX = 100, posY = 100, width = 110, height = 110 } = body;
    if (!number) return NextResponse.json({ error: "El número de mesa es requerido" }, { status: 422 });
    const table = await createTable({ number, name, sectionId, shape, seats, posX, posY, width, height });
    return NextResponse.json({ table }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al crear mesa";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
