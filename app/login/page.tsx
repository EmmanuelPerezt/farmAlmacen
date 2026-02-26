import { redirect } from "next/navigation";

import { NoticeBanner } from "@/components/notice-banner";
import { getSessionFromCookies } from "@/lib/auth";
import { readSearchParam } from "@/lib/query";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSessionFromCookies();

  if (session) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const error = readSearchParam(resolvedSearchParams?.error);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(31,99,85,0.16),transparent_34%),radial-gradient(circle_at_88%_14%,rgba(47,138,119,0.16),transparent_35%),linear-gradient(140deg,#f6f9f4_0%,#eef4ef_55%,#e6ede4_100%)]" />

      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_1.05fr]">
        <section className="panel app-enter app-enter-delay-1 overflow-hidden p-7">
          <div className="mt-auto rounded-lg border border-[color:rgba(31,99,85,0.24)] bg-[color:rgba(31,99,85,0.07)] px-4 py-3 text-xs text-[var(--foreground)]">
            <p className="font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Credenciales demo
            </p>
            <p className="mt-1">Admin: admin / admin123</p>
            <p>Empleado: empleado / empleado123</p>
          </div>
        </section>

        <section className="panel app-enter app-enter-delay-2 p-7 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Acceso seguro
          </p>
          <h2 className="mt-2 text-[1.9rem] leading-none text-[var(--foreground)]">Iniciar sesion</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Ingresa con un usuario autorizado para continuar.
          </p>

          <div className="mt-5">
            <NoticeBanner error={error} />
          </div>

          <form action="/api/auth/login" method="post" className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Usuario</span>
              <input required name="username" type="text" placeholder="admin" className="form-input" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Contrasena
              </span>
              <input
                required
                name="password"
                type="password"
                placeholder="admin123"
                className="form-input"
              />
            </label>

            <button type="submit" className="action-btn action-btn-primary w-full">
              Entrar al panel
            </button>
          </form>

          <p className="mt-4 text-xs text-[var(--ink-soft)]">
            Este MVP usa almacenamiento en memoria para acelerar la validacion funcional.
          </p>
        </section>
      </div>
    </div>
  );
}
