import { Sidebar } from '@/components/layout/Sidebar';

export default function QuestionBankLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-prajna-bg">
      <Sidebar role="student" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
