'use client';

export function StreamlitEmbed({ url }: { url: string }) {
  // Hide Streamlit's own sidebar and header since the portal has its own
  // We inject CSS via the iframe's onLoad to clean up the embedded view
  return (
    <div className="w-full h-[calc(100vh-48px)] bg-prajna-bg">
      <iframe
        src={`${url}?embed=true&embed_options=hide_sidebar`}
        className="w-full h-full border-none rounded-none"
        allow="clipboard-write"
        title="PRAJNA Deep Analysis"
        style={{ colorScheme: 'dark' }}
      />
    </div>
  );
}
