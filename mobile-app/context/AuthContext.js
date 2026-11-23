import React, { createContext, useContext, useState } from "react";
import { API_URL } from "../config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sign in with email and password
  async function login(email, password) {
    setLoading(true);
    try {
      let response;
      try {
        response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        });
      } catch {
        // Same network failure wording the web data layer surfaces.
        throw new Error("The backend is not reachable.");
      }

      const data = await response.json();
      if (!response.ok) {
        // Surface the backend's own message (401 bad credentials, 403
        // disabled account) the way the web login page does.
        throw new Error(data.message || "Sign-in failed.");
      }

      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }

  // Register a new buyer account; the backend signs the user in on
  // success (201 + session), so set the local session too — the register
  // screen then redirects straight to the home landing, no sign-in step.
  async function register(username, email, password) {
    setLoading(true);
    try {
      let response;
      try {
        response = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        });
      } catch {
        // Same network failure wording the web data layer surfaces.
        throw new Error("The backend is not reachable.");
      }

      const data = await response.json();
      if (!response.ok) {
        // 409 duplicate -> "Account name or email is already in use.";
        // 400 invalid fields -> the backend's message. Both land under
        // the email field on the register screen, like the web page.
        throw new Error(data.message || "Registration failed.");
      }

      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  }

  // Sign out and clear active session
  async function logout() {
    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Silently clear local session even if backend call fails
      }
    }
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        loading,
        login,
        register,
        logout,
        setToken,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

