import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createProduct, deleteProduct, updateProduct } from "@/lib/store";

type ProductIntent = "create" | "update" | "delete";

function redirectToProducts(
  request: NextRequest,
  params: { success?: string; error?: string; context?: ProductIntent },
): NextResponse {
  const url = new URL("/productos", request.url);

  if (params.success) {
    url.searchParams.set("success", params.success);
  }

  if (params.error) {
    url.searchParams.set("error", params.error);
  }

  if (params.context) {
    url.searchParams.set("context", params.context);
  }

  return NextResponse.redirect(url);
}

function requireAdmin(request: NextRequest): NextResponse | null {
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.role !== "admin") {
    return redirectToProducts(request, { error: "No tienes permisos para esta accion." });
  }

  return null;
}

function parseIntField(value: FormDataEntryValue | null): number {
  return Number(String(value ?? ""));
}

function parseFloatField(value: FormDataEntryValue | null): number {
  return Number(String(value ?? ""));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAdmin(request);
  if (authError) {
    return authError;
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "") as ProductIntent;

  try {
    if (intent === "create") {
      const initialQtyRaw = String(formData.get("initialQty") ?? "0").trim();

      createProduct({
        sku: parseIntField(formData.get("sku")),
        name: String(formData.get("name") ?? ""),
        price: parseFloatField(formData.get("price")),
        initialQty: initialQtyRaw ? parseIntField(formData.get("initialQty")) : 0,
        initialWarehouseId: String(formData.get("initialWarehouseId") ?? "").trim() || undefined,
      });

      return redirectToProducts(request, {
        success: "Producto creado correctamente.",
        context: "create",
      });
    }

    if (intent === "update") {
      updateProduct({
        sku: parseIntField(formData.get("sku")),
        name: String(formData.get("name") ?? ""),
        price: parseFloatField(formData.get("price")),
      });

      return redirectToProducts(request, {
        success: "Producto actualizado.",
        context: "update",
      });
    }

    if (intent === "delete") {
      deleteProduct(parseIntField(formData.get("sku")));
      return redirectToProducts(request, {
        success: "Producto eliminado.",
        context: "delete",
      });
    }

    return redirectToProducts(request, { error: "Operacion no reconocida." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible procesar la solicitud.";
    const context: ProductIntent | undefined =
      intent === "create" || intent === "update" || intent === "delete" ? intent : undefined;

    return redirectToProducts(request, { error: message, context });
  }
}
