import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface UserInfo {
  name: string;
  email: string;
  contact: string;
  address?: string;
  role?: string; // 'user', 'admin', 'responder', etc.
  password: string;
  department?: string;
  badge?: string;
  roleColor?: string;
  status?: string; // 'active' or 'inactive'
}

interface UserContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  users: UserInfo[];
  addUser: (user: UserInfo) => Promise<void>;
  getUserByEmail: (email: string) => UserInfo | undefined;
  updateUser: (email: string, updated: Partial<UserInfo>) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'user-info';
const USERS_STORAGE_KEY = 'user-list';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserInfo | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);

  // Load user and users from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUserState(JSON.parse(storedUser));
        }
        const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        } else {
          // Initialize with default admin
          const defaultAdmin = [{
            name: 'Emergency Administrator',
            email: 'group10@gmail.com',
            contact: 'N/A',
            role: 'admin',
            address: '',
            password: 'admin123',
          }];
          setUsers(defaultAdmin);
          await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultAdmin));
        }
      } catch (e) {
        console.error('Failed to load user(s) from storage', e);
      }
    })();
  }, []);

  // Save user to AsyncStorage whenever it changes
  const setUser = useCallback(async (user: UserInfo | null) => {
    setUserState(user);
    try {
      if (user) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
  }, []);

  // Add a new user to the users list
  const addUser = useCallback(async (newUser: UserInfo) => {
    setUsers(prev => {
      const updated = [...prev, newUser];
      AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Update a user by email
  const updateUser = useCallback(async (email: string, updated: Partial<UserInfo>) => {
    setUsers(prev => {
      const updatedUsers = prev.map(u => u.email === email ? { ...u, ...updated } : u);
      AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
    });
  }, []);

  // Delete a user by email
  const deleteUser = useCallback(async (email: string) => {
    setUsers(prev => {
      const updatedUsers = prev.filter(u => u.email !== email);
      AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
    });
  }, []);

  // Get user by email
  const getUserByEmail = useCallback((email: string) => {
    return users.find(u => u.email === email);
  }, [users]);

  return (
    <UserContext.Provider value={{ user, setUser, users, addUser, getUserByEmail, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
} 