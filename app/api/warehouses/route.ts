import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/lib/auth";
import { createWarehouse, deleteWarehouse, updateWarehouse } from "@/lib/store";

type WarehouseIntent = "create" | "update" | "delete";

function redirectToWarehouses(
  request: NextRequest,
  params: { success?: string; error?: string; context?: WarehouseIntent },
): NextResponse {
  const url = new URL("/almacenes", request.url);

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
    return redirectToWarehouses(request, { error: "No tienes permisos para esta accion." });
  }

  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAdmin(request);
  if (authError) {
    return authError;
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "") as WarehouseIntent;

  try {
    if (intent === "create") {
      createWarehouse({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
      });

      return redirectToWarehouses(request, {
        success: "Almacen creado correctamente.",
        context: "create",
      });
    }

    if (intent === "update") {
      updateWarehouse({
        id: String(formData.get("id") ?? ""),
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
      });

      return redirectToWarehouses(request, {
        success: "Almacen actualizado.",
        context: "update",
      });
    }

    if (intent === "delete") {
      deleteWarehouse(String(formData.get("id") ?? ""));
      return redirectToWarehouses(request, {
        success: "Almacen eliminado.",
        context: "delete",
      });
    }

    return redirectToWarehouses(request, { error: "Operacion no reconocida." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible procesar la solicitud.";
    const context: WarehouseIntent | undefined =
      intent === "create" || intent === "update" || intent === "delete" ? intent : undefined;

    return redirectToWarehouses(request, { error: message, context });
  }
}
