import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createSale } from "@/lib/store";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const warehouseId = String(formData.get("warehouseId") ?? "").trim();
  const cashReceived = Number(String(formData.get("cashReceived") ?? "0"));
  const itemsJson = String(formData.get("items") ?? "[]");

  try {
    const items = JSON.parse(itemsJson) as Array<{ sku: number; quantity: number }>;

    const sale = createSale({
      warehouseId,
      items,
      cashReceived,
      actor: session,
    });

    return NextResponse.redirect(new URL(`/pos/recibo?saleId=${sale.id}`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible registrar la venta.";
    const url = new URL("/pos", request.url);
    url.searchParams.set("error", message);
    if (warehouseId) {
      url.searchParams.set("warehouseId", warehouseId);
    }
    return NextResponse.redirect(url);
  }
}
