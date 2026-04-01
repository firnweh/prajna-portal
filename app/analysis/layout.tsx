import { Sidebar } from '@/components/layout/Sidebar';

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-prajna-bg">
      <Sidebar role="student" />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
