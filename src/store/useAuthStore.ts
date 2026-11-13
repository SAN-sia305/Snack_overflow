import { create } from "zustand";
import { User, UserRole } from "@/types";

export const DEMO_USERS: Record<string, User> = {
  admin: {
    id: "usr_admin_1",
    name: "Arun Kumar",
    email: "admin@bipolarfactory.com",
    role: "admin",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    department: "Operations & Pantry Ops",
  },
  member: {
    id: "usr_member_1",
    name: "Priya Sharma",
    email: "member@bipolarfactory.com",
    role: "member",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    department: "Computer Vision Engineering",
  },
  karthik: {
    id: "usr_member_2",
    name: "Karthik Raja",
    email: "karthik@bipolarfactory.com",
    role: "member",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    department: "Deep Learning Research",
  },
  ananya: {
    id: "usr_member_3",
    name: "Ananya Iyer",
    email: "ananya@bipolarfactory.com",
    role: "member",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    department: "Product Design",
  },
  vikram: {
    id: "usr_member_4",
    name: "Vikram Sethi",
    email: "vikram@bipolarfactory.com",
    role: "member",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    department: "Platform Infrastructure",
  },
  sneha: {
    id: "usr_member_5",
    name: "Sneha Nair",
    email: "sneha@bipolarfactory.com",
    role: "member",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    department: "Data Engineering",
  },
  rahul: {
    id: "usr_member_6",
    name: "Rahul Verma",
    email: "rahul@bipolarfactory.com",
    role: "member",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    department: "Robotics Core",
  },
  divya: {
    id: "usr_member_7",
    name: "Divya Menon",
    email: "divya@bipolarfactory.com",
    role: "member",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    isVerified: true,
    department: "Embedded Systems",
  },
};

interface AuthState {
  currentUser: User;
  isAuthenticated: boolean;
  loginAs: (role: UserRole) => void;
  setUser: (user: User) => void;
  switchRole: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: DEMO_USERS.member, // Default to Member demo user
  isAuthenticated: true,

  loginAs: (role: UserRole) => {
    if (role === "admin") {
      set({ currentUser: DEMO_USERS.admin, isAuthenticated: true });
    } else {
      set({ currentUser: DEMO_USERS.member, isAuthenticated: true });
    }
  },

  setUser: (user: User) => {
    set({ currentUser: user, isAuthenticated: true });
  },

  switchRole: () => {
    const current = get().currentUser;
    if (current.role === "admin") {
      set({ currentUser: DEMO_USERS.member });
    } else {
      set({ currentUser: DEMO_USERS.admin });
    }
  },

  logout: () => {
    set({ isAuthenticated: false });
  },
}));

