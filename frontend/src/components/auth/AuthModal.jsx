import React, { useState } from 'react';
import { login, fetchMe } from '../../services/api';

export default function AuthModal({ isOpen, onClose, onAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login(username, password);
      let user = data.user || null;
      if (!user && data.access_token) {
        try { user = await fetchMe(data.access_token); } catch { /* ignore */ }
      }
      onAuth({ token: data.access_token, user });
      onClose();
    } catch {
      setError('Invalid credentials or auth service offline.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="club-card w-full max-w-sm rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="h-1.5 w-10 rounded-full bg-club-tang mb-3" />
        <h3 className="text-lg font-extrabold text-club-ink">Officer Sign-In</h3>
        <p className="text-xs text-club-ink/60 mb-4">RBAC-protected C2 access · Home Department</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Username" autoComplete="username"
            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#EADFC6] text-sm text-club-ink placeholder:text-club-ink/40 focus:outline-none focus:border-club-pine"
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password" autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#EADFC6] text-sm text-club-ink placeholder:text-club-ink/40 focus:outline-none focus:border-club-pine"
          />
          {error && <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-2">{error}</div>}
          <button
            type="submit" disabled={busy}
            className="w-full py-2.5 rounded-full bg-club-tang hover:brightness-110 disabled:opacity-50 text-white text-sm font-bold transition-all"
          >
            {busy ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
