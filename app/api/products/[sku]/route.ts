import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { deleteProduct, updateProduct } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> },
): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para esta accion." }, { status: 403 });
  }

  const { sku: skuParam } = await params;
  const sku = Number(skuParam);
  const body = await request.json() as { name?: unknown; price?: unknown };

  try {
    const product = await updateProduct({
      sku,
      name: String(body.name ?? ""),
      price: Number(body.price),
    });
    return NextResponse.json({ product });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible actualizar el producto.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sku: string }> },
): Promise<NextResponse> {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para esta accion." }, { status: 403 });
  }

  const { sku: skuParam } = await params;
  const sku = Number(skuParam);

  try {
    await deleteProduct(sku);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No fue posible eliminar el producto.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
