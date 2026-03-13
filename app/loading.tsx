export default function GlobalLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-8 w-72 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[1.15rem] border border-slate-200 bg-white/70" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-[1.25rem] border border-slate-200 bg-white/70" />
    </div>
  );
}
