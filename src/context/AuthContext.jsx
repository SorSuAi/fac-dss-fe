import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_PROD); // Default to Production

  useEffect(() => {
    const detectBackend = async () => {
      try {
        // Ping local server with a short timeout
        await axios.get(`${import.meta.env.VITE_API_LOCAL}/auth/ping`, { timeout: 1500 });
        setApiUrl(import.meta.env.VITE_API_LOCAL);
        console.log("⚡ Local Backend Detected: Running on Port 5001");
      } catch (err) {
        setApiUrl(import.meta.env.VITE_API_PROD);
        console.log("🌍 Local Backend Offline: Falling back to Render");
      }
    };
    detectBackend();
  }, []);

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/fac-dss-fe/';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, apiUrl }}>
      {children}
    </AuthContext.Provider>
  );
};