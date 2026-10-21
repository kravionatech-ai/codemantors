"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin" | "super_admin" | "support";
  avatar?: string;
  headline?: string;
  bio?: string;
  unreadNotifications?: number;
  activeEnrollmentsCount?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (userData: UserProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const authRevision = useRef(0);
  const logoutInProgress = useRef(false);

  const refreshUser = useCallback(async () => {
    if (logoutInProgress.current) {
      setUser(null);
      setLoading(false);
      return;
    }

    const revision = authRevision.current;
    try {
      const res = await fetch(`/api/auth/me?_t=${Date.now()}`, {
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (revision !== authRevision.current || logoutInProgress.current) return;

      if (res.ok) {
        const data = await res.json();
        if (revision !== authRevision.current || logoutInProgress.current) return;
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      if (revision === authRevision.current && !logoutInProgress.current) {
        setUser(null);
      }
    } finally {
      if (revision === authRevision.current && !logoutInProgress.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshUser();
    return () => {
      authRevision.current += 1;
    };
  }, [refreshUser]);

  const login = (userData: UserProfile) => {
    authRevision.current += 1;
    logoutInProgress.current = false;
    setUser(userData);
    setLoading(false);
  };

  const logout = async () => {
    logoutInProgress.current = true;
    authRevision.current += 1;
    setUser(null);
    setLoading(false);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Logout request failed with status ${response.status}`);
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      authRevision.current += 1;
      setUser(null);
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
