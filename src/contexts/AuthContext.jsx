import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

const CURRENT_USER_KEY = 'location_app_current_user';
const ADMIN_USERS = ['guntharp'];

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
          freshUser.isAdmin = ADMIN_USERS.includes(freshUser.username);
          setUser(freshUser);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(freshUser));
        } catch {
          // If server fails, use cached data
          parsed.isAdmin = ADMIN_USERS.includes(parsed.username);
          setUser(parsed);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const register = async (username, password) => {
    const userSession = await api.register(username, password);
    userSession.isAdmin = ADMIN_USERS.includes(username);
    setUser(userSession);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
    return userSession;
  };

  const login = async (username, password) => {
    const userSession = await api.login(username, password);
    userSession.isAdmin = ADMIN_USERS.includes(username);
    setUser(userSession);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
    return userSession;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateLocation = async (location, coordinates) => {
    const updatedUser = await api.updateUser(user.username, { location, coordinates });
    updatedUser.isAdmin = user.isAdmin;
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await api.updateUser(user.username, profileData);
    updatedUser.isAdmin = user.isAdmin;
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  };

  const changePassword = async (currentPassword, newPassword) => {
    await api.changePassword(user.username, currentPassword, newPassword);
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateLocation,
    updateProfile,
    changePassword,
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
