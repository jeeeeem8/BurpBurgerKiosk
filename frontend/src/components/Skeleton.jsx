export const SkeletonBox = ({ className = '' }) => (
  <div className={`skeleton rounded ${className}`} />
);

export const SkeletonTableRows = ({ rows = 6, cols = 5 }) => (
  <>
    {Array.from({ length: rows }, (_, i) => (
      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
        {Array.from({ length: cols }, (_, j) => (
          <td key={j} className="px-5 py-3.5">
            <SkeletonBox className={`h-4 ${j === 0 ? 'w-32' : j === cols - 1 ? 'w-16' : 'w-24'}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const SkeletonPage = () => (
  <div className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <SkeletonBox className="mb-3 h-7 w-52" />
      <SkeletonBox className="h-4 w-80" />
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SkeletonBox className="mb-3 h-3 w-24" />
          <SkeletonBox className="h-7 w-28" />
        </div>
      ))}
    </div>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-11 bg-slate-900" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`flex gap-6 border-b border-slate-100 px-5 py-4 last:border-0 ${
            i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
          }`}
        >
          <SkeletonBox className="h-4 w-8" />
          <SkeletonBox className="h-4 w-24" />
          <SkeletonBox className="h-4 w-16" />
          <SkeletonBox className="h-4 w-20" />
          <SkeletonBox className="h-4 w-12" />
        </div>
      ))}
    </div>
  </div>
);
