'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      const role = data.user?.role;
      router.push(role === 'student' ? '/student' : '/org');
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-prajna-bg">
      <div className="w-full max-w-md p-8 rounded-xl border bg-prajna-card border-prajna-border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-prajna-accent">PRAJNA</h1>
          <p className="text-sm text-prajna-muted mt-1">
            Predictive Resource Allocation for JEE/NEET Aspirants
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-prajna-muted text-xs uppercase tracking-wider block mb-1">Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-prajna-surface border border-prajna-border text-prajna-text text-sm outline-none focus:border-prajna-accent"
              placeholder="student@pw.live"
              required
            />
          </div>
          <div>
            <label className="text-prajna-muted text-xs uppercase tracking-wider block mb-1">Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-prajna-surface border border-prajna-border text-prajna-text text-sm outline-none focus:border-prajna-accent"
              placeholder="Enter password"
              required
            />
          </div>
          {error && <p className="text-prajna-warn text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-prajna-accent hover:bg-prajna-accent/90 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
