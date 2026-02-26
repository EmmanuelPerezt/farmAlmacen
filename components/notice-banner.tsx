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
      <div className="app-enter mb-4 rounded-lg border border-[color:rgba(185,28,28,0.28)] bg-[color:rgba(185,28,28,0.08)] px-3 py-2 text-sm text-[color:#991b1b]">
        {error}
      </div>
    );
  }

  return (
    <div className="app-enter mb-4 rounded-lg border border-[color:rgba(4,120,87,0.28)] bg-[color:rgba(4,120,87,0.08)] px-3 py-2 text-sm text-[color:#047857]">
      {success}
    </div>
  );
}
