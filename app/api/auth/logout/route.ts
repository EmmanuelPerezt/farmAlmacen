import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookie(response);

  return response;
}
