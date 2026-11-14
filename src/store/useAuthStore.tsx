"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import { createStore, StoreApi, useStore } from "zustand";
import { z } from "zod";
import { AuthUser } from "@/types";
import { requestJson } from "@/lib/api/client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "error";

export interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  error: string | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "member"]),
  avatarUrl: z.string().optional(),
  department: z.string().optional(),
});

const authResponseSchema = z.object({ user: authUserSchema });
const AuthStoreContext = createContext<StoreApi<AuthState> | null>(null);

function createAuthStore(initialUser: AuthUser | null) {
  return createStore<AuthState>((set) => ({
    currentUser: initialUser,
    isAuthenticated: initialUser !== null,
    status: initialUser ? "authenticated" : "loading",
    error: null,

    refresh: async () => {
      set({ status: "loading", error: null });
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (response.status === 401) {
          set({
            isAuthenticated: false,
            status: "unauthenticated",
            error: null,
          });
          return;
        }
        if (!response.ok) {
          throw new Error("Unable to verify the current session.");
        }

        const { user } = authResponseSchema.parse(await response.json());
        set({
          currentUser: user,
          isAuthenticated: true,
          status: "authenticated",
          error: null,
        });
      } catch {
        set({
          status: "error",
          error: "Unable to verify your session. Please retry.",
        });
      }
    },

    login: async (email, password) => {
      const payload = await requestJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const { user } = authResponseSchema.parse(payload);
      set({
        currentUser: user,
        isAuthenticated: true,
        status: "authenticated",
        error: null,
      });
      return user;
    },

    logout: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("Unable to sign out. Please try again.");
      }

      set({
        isAuthenticated: false,
        status: "unauthenticated",
        error: null,
      });
    },
  }));
}

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser | null;
  children: ReactNode;
}) {
  const storeRef = useRef<StoreApi<AuthState> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createAuthStore(initialUser);
  }

  useEffect(() => {
    void storeRef.current?.getState().refresh();
  }, []);

  return (
    <AuthStoreContext.Provider value={storeRef.current}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuthStore(): AuthState {
  const store = useContext(AuthStoreContext);
  if (!store) {
    throw new Error("useAuthStore must be used within AuthProvider.");
  }
  return useStore(store);
}

export function useCurrentUser(): AuthUser {
  const { currentUser } = useAuthStore();
  if (!currentUser) {
    throw new Error("A server-authenticated user is required here.");
  }
  return currentUser;
}
