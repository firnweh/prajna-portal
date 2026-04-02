'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { NavItem, studentNav, orgNav, getSubjectLinks } from '@/lib/nav-config';

function NavLink({ item }: { item: NavItem }) {
  const path = usePathname();
  const base = item.href.split('?')[0];
  const active = path === base || (base !== '/student' && base !== '/org' && path.startsWith(base));

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-prajna-accent/12 text-prajna-accent font-semibold'
          : 'text-prajna-muted hover:text-prajna-text hover:bg-white/[0.03]'
      }`}
    >
      <span className="text-base">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar({ role }: { role: 'student' | 'center' | 'central' }) {
  const { exam, year, user, setUser } = useStore();
  const router = useRouter();

  // Hydrate user from JWT cookie on mount (survives page refresh)
  useEffect(() => {
    if (user) return; // already hydrated
    try {
      const token = document.cookie
        .split('; ')
        .find(r => r.startsWith('prajna_token='))
        ?.split('=')[1];
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.exp * 1000 > Date.now()) {
          setUser({
            userId: String(payload.userId || ''),
            role: payload.role,
            branch: payload.branch || null,
            studentId: payload.studentId || null,
            exam: payload.exam || null,
          });
        }
      }
    } catch { /* invalid token — middleware will redirect to login */ }
  }, [user, setUser]);
  const isStudent = role === 'student';
  const mainNav = isStudent ? studentNav : orgNav;
  const subjectLinks = isStudent ? getSubjectLinks(exam) : [];

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <aside className="w-[260px] min-h-screen bg-prajna-surface border-r border-prajna-border flex flex-col shrink-0">
      <div className="p-4 pb-3">
        <h1 className="text-lg font-bold text-prajna-accent tracking-tight">PRAJNA</h1>
        <p className="text-[0.68rem] text-prajna-muted italic leading-tight mt-0.5">
          Predictive Resource Allocation<br/>for JEE/NEET Aspirants
        </p>
      </div>

      <div className="h-px bg-prajna-border" />

      <nav className="flex-1 p-3 space-y-0.5">
        {mainNav.map(item => <NavLink key={item.href} item={item} />)}

        {subjectLinks.length > 0 && (
          <>
            <div className="h-px bg-prajna-border my-3" />
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-prajna-muted px-3 mb-1">
              Subjects
            </p>
            {subjectLinks.map(item => <NavLink key={item.href} item={item} />)}
          </>
        )}
      </nav>

      <div className="h-px bg-prajna-border" />

      <div className="p-4 space-y-1.5">
        <p className="text-xs text-prajna-muted">
          {exam.toUpperCase()} · {year}
        </p>
        {user && (
          <p className="text-xs text-prajna-text truncate">{user.userId}</p>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-prajna-muted hover:text-prajna-warn transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
