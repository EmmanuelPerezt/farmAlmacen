import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createMovement } from "@/lib/store";
import type { MovementType } from "@/lib/types";

function redirectToMovements(
  request: NextRequest,
  params: { success?: string; error?: string },
): NextResponse {
  const url = new URL("/movimientos", request.url);

  if (params.success) {
    url.searchParams.set("success", params.success);
  }

  if (params.error) {
    url.searchParams.set("error", params.error);
  }

  return NextResponse.redirect(url);
}

function parseInteger(value: FormDataEntryValue | null): number {
  return Number(String(value ?? ""));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const type = String(formData.get("type") ?? "") as MovementType;

  try {
    createMovement({
      type,
      sku: parseInteger(formData.get("sku")),
      quantity: parseInteger(formData.get("quantity")),
      sourceWarehouseId: String(formData.get("sourceWarehouseId") ?? "").trim() || undefined,
      targetWarehouseId: String(formData.get("targetWarehouseId") ?? "").trim() || undefined,
      note: String(formData.get("note") ?? ""),
      actor: session,
    });

    return redirectToMovements(request, { success: "Movimiento registrado correctamente." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible registrar el movimiento.";
    return redirectToMovements(request, { error: message });
  }
}
