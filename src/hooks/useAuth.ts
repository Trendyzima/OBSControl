import { useState, useEffect, useCallback } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

function mapUser(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email!,
    username: user.user_metadata?.username || user.user_metadata?.full_name || user.email!.split('@')[0],
  };
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [authEmail, setAuthEmail] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) setUser(mapUser(session.user));
      if (mounted) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) { setUser(mapUser(session.user)); setLoading(false); }
      else if (event === 'SIGNED_OUT') { setUser(null); setLoading(false); }
      else if (event === 'TOKEN_REFRESHED' && session?.user) setUser(mapUser(session.user));
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) { toast.error(error.message); return false; }
    setAuthEmail(email);
    setOtpSent(true);
    toast.success('Check your email for the verification code');
    return true;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string, password: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) { toast.error(error.message); return false; }
    const { data: ud, error: ue } = await supabase.auth.updateUser({
      password,
      data: { username: email.split('@')[0] },
    });
    if (ue) { toast.error(ue.message); return false; }
    if (ud.user) setUser(mapUser(ud.user));
    toast.success('Welcome to Broadcast Studio!');
    return true;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); return false; }
    if (data.user) setUser(mapUser(data.user));
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOtpSent(false);
    toast('Signed out');
  }, []);

  return { user, loading, otpSent, authEmail, sendOtp, verifyOtp, signIn, signOut };
}
