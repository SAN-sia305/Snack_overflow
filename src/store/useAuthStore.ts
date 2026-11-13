import { create } from "zustand";
import { User, UserRole } from "@/types";
import { SEED_USERS } from "@/lib/mock/data/users";

const AUTH_STORAGE_KEY = "snackoverflow_auth_session_v1";

interface AuthState {
  currentUser: User;
  isAuthenticated: boolean;
  loginAs: (role: UserRole) => void;
  loginWithEmail: (email: string) => boolean;
  setUser: (user: User) => void;
  switchRole: () => void;
  logout: () => void;
}

function getInitialUser(): { user: User; isAuth: boolean } {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) {
          return { user: parsed.user, isAuth: parsed.isAuth ?? true };
        }
      }
    } catch {
      // Fallback
    }
  }
  // Default to Member (Priya Sharma)
  return { user: SEED_USERS[1], isAuth: true };
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initial = getInitialUser();

  const persist = (user: User, isAuth: boolean) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ user, isAuth })
        );
      } catch (e) {
        console.warn("Failed to persist auth state", e);
      }
    }
  };

  return {
    currentUser: initial.user,
    isAuthenticated: initial.isAuth,

    loginAs: (role: UserRole) => {
      const user =
        role === "admin"
          ? SEED_USERS[0] // Arun Kumar
          : SEED_USERS[1]; // Priya Sharma

      set({ currentUser: user, isAuthenticated: true });
      persist(user, true);
    },

    loginWithEmail: (email: string) => {
      const trimmed = email.trim().toLowerCase();
      const matched = SEED_USERS.find((u) => u.email.toLowerCase() === trimmed);

      if (matched) {
        set({ currentUser: matched, isAuthenticated: true });
        persist(matched, true);
        return true;
      }

      // If email doesn't match predefined users, allow demo login as a member
      const demoUser: User = {
        id: "usr_custom_" + Math.random().toString(36).substring(2, 7),
        name: email.split("@")[0] || "Team Member",
        email: trimmed,
        role: trimmed.includes("admin") ? "admin" : "member",
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        isVerified: true,
        department: "Bipolar Factory Team",
      };

      set({ currentUser: demoUser, isAuthenticated: true });
      persist(demoUser, true);
      return true;
    },

    setUser: (user: User) => {
      set({ currentUser: user, isAuthenticated: true });
      persist(user, true);
    },

    switchRole: () => {
      const current = get().currentUser;
      const nextUser =
        current.role === "admin"
          ? SEED_USERS[1] // Switch to Member Priya
          : SEED_USERS[0]; // Switch to Admin Arun

      set({ currentUser: nextUser, isAuthenticated: true });
      persist(nextUser, true);
    },

    logout: () => {
      set({ isAuthenticated: false });
      persist(get().currentUser, false);
    },
  };
});
