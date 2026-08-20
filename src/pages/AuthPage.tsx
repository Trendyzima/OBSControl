import { useState } from 'react';
import { Radio, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const { sendOtp, verifyOtp, signIn, otpSent, authEmail } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    await signIn(email, password);
    setBusy(false);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    await sendOtp(email);
    setBusy(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || !password) return;
    setBusy(true);
    await verifyOtp(authEmail, otp, password);
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[hsl(220,25%,3%)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.6)]">
            <Radio size={24} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-mono-console text-xl font-bold text-foreground uppercase tracking-widest">Broadcast Studio</h1>
            <p className="font-mono-console text-[10px] text-muted-foreground mt-1">Sign in to access cloud storage and your media library</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-border">
          {(['login', 'register'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-1 py-2.5 font-mono-console text-[10px] uppercase tracking-wider transition-colors',
                tab === t ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="p-5 rounded-2xl border border-border bg-secondary/10 space-y-3">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                  placeholder="your@email.com"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 font-mono-console text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full bg-input border border-border rounded-xl px-3 py-2.5 pr-10 font-mono-console text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={busy || !email || !password}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-mono-console text-sm font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-40">
                {busy ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>
          ) : otpSent ? (
            <form onSubmit={handleVerify} className="space-y-3">
              <div className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <p className="font-mono-console text-[10px] text-emerald-400">Code sent to {authEmail}</p>
              </div>
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Verification Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required autoFocus
                  placeholder="0000" maxLength={6}
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 font-mono-console text-2xl text-foreground text-center tracking-[0.5em] placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Set Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Min 6 characters"
                    className="w-full bg-input border border-border rounded-xl px-3 py-2.5 pr-10 font-mono-console text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={busy || !otp || !password}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-mono-console text-sm font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-40">
                {busy ? 'VERIFYING...' : 'CREATE ACCOUNT'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="font-mono-console text-[9px] text-muted-foreground uppercase block mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                  placeholder="your@email.com"
                  className="w-full bg-input border border-border rounded-xl px-3 py-2.5 font-mono-console text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={busy || !email}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-mono-console text-sm font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-40">
                {busy ? 'SENDING...' : 'SEND VERIFICATION CODE'}
              </button>
            </form>
          )}
        </div>

        <Link to="/" className="flex items-center justify-center gap-2 font-mono-console text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={12} /> Continue without account (local mode)
        </Link>
      </div>
    </div>
  );
}
