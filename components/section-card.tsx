type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="panel app-enter app-enter-delay-1 p-4 sm:p-5">
      <header className="mb-3">
        <h2 className="text-lg font-semibold leading-tight text-[var(--foreground)]">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
