import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Fetch authenticated user's profile from public.profiles
   */
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, is_vip, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[AdminAuth] Profile fetch error:', error.message);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[AdminAuth] Exception in fetchProfile:', err);
      return null;
    }
  }, []);

  /**
   * Initialize session on app startup and listen for auth state updates
   */
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession?.user && mounted) {
          const userProfile = await fetchProfile(existingSession.user.id);

          if (userProfile?.role === 'admin') {
            setUser(existingSession.user);
            setSession(existingSession);
            setProfile(userProfile);
          } else {
            // Not an admin: clear session
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('[AdminAuth] Session init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !currentSession) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const userProfile = await fetchProfile(currentSession.user.id);
        if (userProfile?.role === 'admin') {
          setUser(currentSession.user);
          setSession(currentSession);
          setProfile(userProfile);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          setAuthError('You do not have permission to access the Admin Dashboard.');
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * Sign In with Email & Password
   */
  const signIn = async ({ email, password }) => {
    setAuthError(null);
    if (!supabase) throw new Error('Supabase client is not configured.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      const msg = error.message || 'Invalid login credentials.';
      setAuthError(msg);
      throw error;
    }

    if (!data?.user) {
      throw new Error('Authentication failed.');
    }

    // Verify role in public.profiles
    const userProfile = await fetchProfile(data.user.id);

    if (!userProfile || userProfile.role !== 'admin') {
      await supabase.auth.signOut();
      const denialMessage = 'You do not have permission to access the Admin Dashboard.';
      setAuthError(denialMessage);
      throw new Error(denialMessage);
    }

    setUser(data.user);
    setSession(data.session);
    setProfile(userProfile);
    return { user: data.user, profile: userProfile };
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AdminAuth] Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setAuthError(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    authError,
    isAuthenticated: Boolean(user && profile?.role === 'admin'),
    isAdmin: profile?.role === 'admin',
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
