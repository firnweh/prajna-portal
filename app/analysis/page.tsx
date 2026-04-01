import { StreamlitEmbed } from '@/components/layout/StreamlitEmbed';

export default function AnalysisPage() {
  const url = process.env.NEXT_PUBLIC_STREAMLIT_URL || 'http://localhost:8501';
  return <StreamlitEmbed url={url} />;
}
