type NoticeBannerProps = {
  success?: string;
  error?: string;
};

export function NoticeBanner({ success, error }: NoticeBannerProps) {
  if (!success && !error) {
    return null;
  }

  if (error) {
    return (
      <div className="app-enter mb-4 rounded-lg border border-[color:rgba(217,45,32,0.28)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger-text)]">
        {error}
      </div>
    );
  }

  return (
    <div className="app-enter mb-4 rounded-lg border border-[color:rgba(15,157,114,0.28)] bg-[color:rgba(15,157,114,0.08)] px-3 py-2 text-sm text-[var(--success-text)]">
      {success}
    </div>
  );
}
