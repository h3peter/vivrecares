const SkeletonBlock = ({ className = '' }) => (
    <div className={`rounded-xl bg-gray-200/80 ${className}`} />
);

export const PageHeaderSkeleton = ({ action = false }) => (
    <div className="mb-8 animate-pulse">
        <SkeletonBlock className="mb-3 h-4 w-44" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full">
                <SkeletonBlock className="h-10 w-full max-w-xl" />
                <SkeletonBlock className="mt-3 h-4 w-full max-w-md" />
            </div>
            {action && <SkeletonBlock className="h-12 w-40" />}
        </div>
    </div>
);

export const MetricSkeletonGrid = ({ count = 4 }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="mt-5 h-9 w-28" />
                <SkeletonBlock className="mt-4 h-4 w-40" />
            </div>
        ))}
    </div>
);

export const FilterPanelSkeleton = ({ fields = 4 }) => (
    <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index}>
                    <SkeletonBlock className="mb-2 h-3 w-24" />
                    <SkeletonBlock className="h-12 w-full" />
                </div>
            ))}
        </div>
    </div>
);

export const TableRowsSkeleton = ({ rows = 5, columns = 4 }) => (
    <div className="animate-pulse space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex}>
                <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 lg:hidden">
                    <div className="flex items-start gap-3">
                        <SkeletonBlock className="h-12 w-12 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <SkeletonBlock className="h-4 w-2/3" />
                            <SkeletonBlock className="h-3 w-1/3" />
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <SkeletonBlock className="h-12 w-full" />
                        <SkeletonBlock className="h-12 w-full" />
                    </div>
                </div>

                <div className="hidden items-center gap-4 rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 lg:grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <SkeletonBlock key={colIndex} className="h-5 w-full" />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export const DashboardSkeleton = () => (
    <div className="min-h-screen bg-[#f4f4f4] p-6 sm:p-8 lg:p-12">
        <PageHeaderSkeleton action />
        <MetricSkeletonGrid />
        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
            <PanelSkeleton tall />
            <PanelSkeleton />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
            <PanelSkeleton />
            <PanelSkeleton />
        </div>
    </div>
);

export const FormPageSkeleton = ({ fields = 5 }) => (
    <div className="animate-pulse rounded-[2rem] border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 bg-[#faf9f6] p-8">
            <SkeletonBlock className="h-7 w-64" />
            <SkeletonBlock className="mt-3 h-3 w-52" />
        </div>
        <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index}>
                    <SkeletonBlock className="mb-3 h-3 w-28" />
                    <SkeletonBlock className="h-14 w-full" />
                </div>
            ))}
            <div className="md:col-span-2">
                <SkeletonBlock className="mb-3 h-3 w-36" />
                <SkeletonBlock className="h-32 w-full" />
            </div>
        </div>
    </div>
);

export const PanelSkeleton = ({ tall = false }) => (
    <div className={`animate-pulse rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm lg:p-8 ${tall ? 'min-h-[24rem]' : 'min-h-[16rem]'}`}>
        <SkeletonBlock className="h-3 w-36" />
        <SkeletonBlock className="mt-4 h-7 w-64 max-w-full" />
        <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-8 space-y-4">
            <SkeletonBlock className="h-12 w-full" />
            <SkeletonBlock className="h-12 w-11/12" />
            <SkeletonBlock className="h-12 w-10/12" />
        </div>
    </div>
);

export default DashboardSkeleton;
