import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  contact: string;
  address?: string;
  role?: string;
  department?: string;
  badge?: string;
  status?: string;
}

interface SupabaseUserContextType {
  session: Session | null;
  user: UserInfo | null;
  users: UserInfo[];
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<UserInfo>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserInfo>) => Promise<{ error: any }>;
  loadUsers: () => Promise<void>;
  addUser: (userData: UserInfo & { password: string }) => Promise<{ error: any }>;
  updateUser: (id: string, updates: Partial<UserInfo>) => Promise<{ error: any }>;
  deleteUser: (id: string) => Promise<{ error: any }>;
}

const SupabaseUserContext = createContext<SupabaseUserContextType | undefined>(undefined);

export const SupabaseUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserInfo>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              ...userData,
            },
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: profileError };
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<UserInfo>) => {
    if (!session?.user) return { error: 'No user logged in' };

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', session.user.id);

      if (!error) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const addUser = async (userData: UserInfo & { password: string }) => {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });

      if (error) return { error };

      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: userData.email,
              name: userData.name,
              contact: userData.contact,
              address: userData.address,
              role: userData.role,
              department: userData.department,
              badge: userData.badge,
              status: userData.status || 'active',
            },
          ]);

        if (profileError) return { error: profileError };
        
        await loadUsers();
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateUser = async (id: string, updates: Partial<UserInfo>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);

      if (!error) {
        await loadUsers();
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (!error) {
        await loadUsers();
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  return (
    <SupabaseUserContext.Provider
      value={{
        session,
        user,
        users,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        loadUsers,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </SupabaseUserContext.Provider>
  );
};

export function useSupabaseUser() {
  const context = useContext(SupabaseUserContext);
  if (!context) {
    throw new Error('useSupabaseUser must be used within a SupabaseUserProvider');
  }
  return context;
}