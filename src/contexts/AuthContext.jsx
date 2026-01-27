import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const USERS_KEY = 'location_app_users';
const CURRENT_USER_KEY = 'location_app_current_user';
const ADMIN_USERS = ['guntharp'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      parsed.isAdmin = ADMIN_USERS.includes(parsed.username);
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  const getUsers = () => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  };

  const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const register = (username, password) => {
    const users = getUsers();

    if (users[username]) {
      throw new Error('Username already exists');
    }

    const newUser = {
      username,
      password,
      fullName: '',
      location: null,
      coordinates: null,
    };

    users[username] = newUser;
    saveUsers(users);

    const userSession = { username, fullName: '', location: null, coordinates: null, isAdmin: ADMIN_USERS.includes(username) };
    setUser(userSession);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));

    return userSession;
  };

  const login = (username, password) => {
    const users = getUsers();
    const storedUser = users[username];

    if (!storedUser || storedUser.password !== password) {
      throw new Error('Invalid username or password');
    }

    const userSession = {
      username: storedUser.username,
      fullName: storedUser.fullName || '',
      location: storedUser.location,
      coordinates: storedUser.coordinates,
      isAdmin: ADMIN_USERS.includes(storedUser.username),
    };

    setUser(userSession);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));

    return userSession;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const updateLocation = (location, coordinates) => {
    const users = getUsers();

    if (users[user.username]) {
      users[user.username].location = location;
      users[user.username].coordinates = coordinates;
      saveUsers(users);
    }

    const updatedUser = { ...user, location, coordinates };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  };

  const updateProfile = (profileData) => {
    const users = getUsers();

    if (users[user.username]) {
      users[user.username] = { ...users[user.username], ...profileData };
      saveUsers(users);
    }

    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  };

  const changePassword = (currentPassword, newPassword) => {
    const users = getUsers();
    const storedUser = users[user.username];

    if (!storedUser || storedUser.password !== currentPassword) {
      throw new Error('Current password is incorrect');
    }

    users[user.username].password = newPassword;
    saveUsers(users);
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
