import { Sidebar } from '@/components/layout/Sidebar';

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-prajna-bg">
      <Sidebar role="central" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
