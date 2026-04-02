import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { updateTable, deleteTable, getTable } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const table = await getTable(id);
  if (!table) return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  return NextResponse.json({ table });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const table = await updateTable(id, body);
    return NextResponse.json({ table });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  const { id } = await params;
  await deleteTable(id);
  return NextResponse.json({ ok: true });
}
