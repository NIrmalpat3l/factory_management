'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Define the new profile type based on the schema
export interface UserProfile {
  id: string;
  full_name: string;
  role: 'admin' | 'worker' | 'viewer';
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser(activeSession: Session | null) {
      if (!activeSession) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Find profile by auth id
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeSession.user.id)
        .single();

      let profile = null;
      if (data) {
        profile = data;
      } else {
        // Auto-create a profile for new signups
        const email = activeSession.user.email;
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            id: activeSession.user.id,
            full_name: email?.split('@')[0] || 'New User',
            role: 'worker', 
            is_active: true
          }])
          .select()
          .single();
          
        if (!insertError && newProfile) {
          profile = newProfile;
        } else {
          console.error("Failed to create profile:", insertError);
        }
      }

      if (mounted) {
        setUser(profile);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        setSession(currentSession);
        loadUser(currentSession);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        loadUser(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
