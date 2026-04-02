import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { readSearchParam } from "@/lib/query";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSessionFromCookies();
  if (session) redirect("/mesas");

  const resolvedParams = searchParams ? await searchParams : undefined;
  const error = readSearchParam(resolvedParams?.error);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[#0d0f14]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(251,146,60,0.05) 0%, transparent 50%)" }} />
        {/* Decorative grid */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f59e0b" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center app-enter">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Restaurant<span className="text-amber-400">OS</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Sistema de punto de venta para restaurantes
          </p>
        </div>

        {/* Login Card */}
        <div className="app-enter app-enter-delay-1 panel p-8">
          <h2 className="text-lg font-semibold text-white">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Ingresa con tus credenciales para continuar
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Usuario</span>
              <input required name="username" type="text" placeholder="admin" className="form-input" autoComplete="username" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Contraseña</span>
              <input required name="password" type="password" placeholder="••••••••" className="form-input" autoComplete="current-password" />
            </label>

            <button type="submit" className="action-btn action-btn-primary w-full justify-center py-3 text-sm">
              Entrar al sistema
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="app-enter app-enter-delay-2 mt-4 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500/80">Credenciales demo</p>
          <div className="mt-2 space-y-1 text-xs text-[var(--ink-muted)]">
            <p><span className="text-amber-400/80">Admin:</span> admin / admin123</p>
            <p><span className="text-amber-400/80">Mesero:</span> empleado / empleado123</p>
            <p><span className="text-amber-400/80">Cocina:</span> cocina / cocina123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
