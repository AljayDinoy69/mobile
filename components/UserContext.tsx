import { supabase } from '@/lib/supabase';
import { SyncService } from '@/lib/sync-service';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface UserInfo {
  id?: string;
  name: string;
  email: string;
  contact: string;
  address?: string;
  role?: string;
  department?: string;
  badge?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserContextType {
  session: Session | null;
  user: UserInfo | null;
  users: UserInfo[];
  loading: boolean;
  setUser: (user: UserInfo | null) => void;
  signUp: (email: string, password: string, userData: Partial<UserInfo>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  addUser: (user: UserInfo & { password: string }) => Promise<void>;
  getUserByEmail: (email: string) => UserInfo | undefined;
  updateUser: (email: string, updated: Partial<UserInfo>) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUserState] = useState<UserInfo | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncService, setSyncService] = useState<SyncService | null>(null);

  // Initialize auth and load data
  useEffect(() => {
    initializeSync();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUserState(null);
      }
      setLoading(false);
    });

    // Load all users
    loadUsers();

    // Set up real-time subscription for users
    const usersSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' },
        () => {
          loadUsers(); // Reload users when any change occurs
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      usersSubscription.unsubscribe();
      if (syncService) {
        syncService.stopSync();
      }
    };
  }, []);

  const initializeSync = async () => {
    try {
      const deviceId = await SyncService.generateDeviceId();
      const syncServiceInstance = SyncService.getInstance({
        deviceId,
        platform: Platform.OS,
        syncInterval: 30000, // 30 seconds
        userId: undefined // Will be set when user logs in
      });
      
      setSyncService(syncServiceInstance);
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
    }
  };

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
        setUserState(data);
        
        // Update sync service with user ID and start syncing
        if (syncService) {
          syncService['config'].userId = data.id;
          await syncService.startSync();
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
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

  const setUser = useCallback(async (user: UserInfo | null) => {
    setUserState(user);
  }, []);

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
              name: userData.name || '',
              contact: userData.contact || '',
              address: userData.address || '',
              role: userData.role || 'user',
              department: userData.department || '',
              badge: userData.badge || '',
              status: 'active',
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
    if (syncService) {
      await syncService.stopSync();
    }
    await supabase.auth.signOut();
    setUserState(null);
  };

  const addUser = async (newUser: UserInfo & { password: string }) => {
    try {
      // For admin creating users, we'll insert directly into the users table
      // In a real app, you'd use Supabase Admin API or a server function
      const { error } = await supabase
        .from('users')
        .insert([
          {
            email: newUser.email,
            name: newUser.name,
            contact: newUser.contact,
            address: newUser.address || '',
            role: newUser.role || 'user',
            department: newUser.department || '',
            badge: newUser.badge || '',
            status: 'active',
          },
        ]);

      if (error) {
        console.error('Error adding user:', error);
        throw error;
      }

      // Broadcast update to all devices
      if (syncService) {
        await syncService.broadcastUpdate('users', 'insert', newUser.email);
      }

      await loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (email: string, updated: Partial<UserInfo>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updated,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }

      // Broadcast update to all devices
      if (syncService) {
        await syncService.broadcastUpdate('users', 'update', email);
      }

      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (email: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('email', email);

      if (error) {
        console.error('Error deleting user:', error);
        throw error;
      }

      // Broadcast update to all devices
      if (syncService) {
        await syncService.broadcastUpdate('users', 'delete', email);
      }

      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const getUserByEmail = useCallback((email: string) => {
    return users.find(u => u.email === email);
  }, [users]);

  return (
    <UserContext.Provider value={{
      session,
      user,
      users,
      loading,
      setUser,
      signUp,
      signIn,
      signOut,
      addUser,
      getUserByEmail,
      updateUser,
      deleteUser,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}