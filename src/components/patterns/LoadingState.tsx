export function LoadingCard({ height = 96 }: { height?: number }) {
  return <div className="shimmer rounded-card" style={{ height }} />;
}

export function LoadingRow() {
  return (
    <div className="flex items-center gap-3 rounded-card border border-divider bg-surface p-4">
      <div className="shimmer h-10 w-10 rounded-full" />
      <div className="flex-1">
        <div className="shimmer h-3 w-1/3 rounded-full" />
        <div className="shimmer mt-2 h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export function LoadingShim({ width = 80, height = 16 }: { width?: number; height?: number }) {
  return <span className="shimmer inline-block rounded-full align-middle" style={{ width, height }} />;
}
