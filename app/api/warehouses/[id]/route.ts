import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { deleteWarehouse, updateWarehouse } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para esta accion." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json() as { name?: unknown; description?: unknown };

  try {
    const warehouse = await updateWarehouse({
      id,
      name: String(body.name ?? ""),
      description: typeof body.description === "string" ? body.description : "",
    });
    return NextResponse.json({ warehouse });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible actualizar el almacen.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para esta accion." }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteWarehouse(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible eliminar el almacen.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
