"use client";

import { useEffect, useState } from "react";
import { useThemeStore, Theme } from "@/store/useThemeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { setTheme } = useThemeStore();

  useEffect(() => {
    const savedTheme = localStorage.getItem("snackoverflow-theme") as Theme | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme: Theme = savedTheme || (systemDark ? "dark" : "light");

    setTheme(initialTheme);
    setMounted(true);
  }, [setTheme]);

  // Avoid layout flash before hydration
  return <>{children}</>;
}

