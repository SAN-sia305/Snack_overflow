import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { QueryProvider } from "@/lib/api/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snack Overflow — Never run out",
  description:
    "Collaborative office pantry management platform for Bipolar Factory. Discover, consume, vote, and request office snacks.",
  applicationName: "Snack Overflow",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans selection:bg-orange-500 selection:text-white bg-background text-foreground">
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
