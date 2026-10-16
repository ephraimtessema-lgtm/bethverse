import React, { createContext, useContext } from 'react';

/** Offline app — no cloud auth. Provider kept for compatibility with existing hooks. */
const AuthContext = createContext(null);

const offlineAuth = {
  user: { id: 'local', email: 'offline@local', role: 'user' },
  isAuthenticated: true,
  isLoadingAuth: false,
  isLoadingPublicSettings: false,
  authError: null,
  authChecked: true,
  appPublicSettings: null,
  logout: () => {},
  navigateToLogin: () => {},
  checkUserAuth: async () => {},
  checkAppState: async () => {},
};

export const AuthProvider = ({ children }) => (
  <AuthContext.Provider value={offlineAuth}>{children}</AuthContext.Provider>
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
