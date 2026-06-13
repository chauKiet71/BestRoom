"use client";

type PageLoaderProps = {
  text?: string;
  className?: string;
};

export default function PageLoader({ text = "Đang tải dữ liệu...", className = "" }: PageLoaderProps) {
  return (
    <div className={`mx-auto flex max-w-[1200px] flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8 ${className}`}>
      <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
        <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-20" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-blue-100">
          <img src="/bestroom-logo.png" alt="BestRoom" className="h-7 w-9 object-contain" />
        </div>
      </div>
      <p className="animate-pulse text-sm font-medium text-gray-500">{text}</p>
    </div>
  );
}
