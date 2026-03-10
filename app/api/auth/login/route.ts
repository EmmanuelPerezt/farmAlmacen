import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { setSessionCookie } from "@/lib/auth";
import { authenticateUser } from "@/lib/db";

function redirectWithError(request: NextRequest, message: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!username || !password) {
    return redirectWithError(request, "Debes ingresar usuario y contrasena.");
  }

  const session = await authenticateUser(username, password);
  if (!session) {
    return redirectWithError(request, "Credenciales invalidas.");
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  setSessionCookie(response, session);

  return response;
}
