'use client';

export function StreamlitEmbed({ url }: { url: string }) {
  return (
    <div className="w-full h-[calc(100vh-48px)]">
      <iframe
        src={url}
        className="w-full h-full border-none"
        allow="clipboard-write"
        title="PRAJNA Deep Analysis"
      />
    </div>
  );
}
