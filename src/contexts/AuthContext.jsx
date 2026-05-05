import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

const CURRENT_USER_KEY = 'location_app_current_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        try {
          // Refresh user data from server
          const freshUser = await api.getUser(parsed.username);
          setUser(freshUser);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(freshUser));
        } catch {
          // If server fails, use cached data
          setUser(parsed);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const persistSession = (session) => {
    setUser(session);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  };

  const register = async (username, password, inviteToken) => {
    const userSession = await api.register(username, password, inviteToken);
    persistSession(userSession);
    return userSession;
  };

  const login = async (username, password) => {
    const response = await api.login(username, password);
    // If migration is required, do NOT establish a session — caller must complete migration first
    if (response.needsMigration) {
      return response;
    }
    persistSession(response);
    return response;
  };

  const completeMigration = async (currentUsername, password, newUsername) => {
    const response = await api.migrateUsername(currentUsername, password, newUsername);
    persistSession(response);
    return response;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateLocation = async (location, coordinates) => {
    const updatedUser = await api.updateUser(user.username, { location, coordinates });
    persistSession(updatedUser);
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await api.updateUser(user.username, profileData);
    persistSession(updatedUser);
  };

  const changePassword = async (currentPassword, newPassword) => {
    await api.changePassword(user.username, currentPassword, newPassword);
  };

  const refreshUser = async () => {
    if (!user?.username) return;
    const freshUser = await api.getUser(user.username);
    persistSession(freshUser);
  };

  const value = {
    user,
    loading,
    register,
    login,
    completeMigration,
    logout,
    updateLocation,
    updateProfile,
    changePassword,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
