import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snack Overflow — Never run out",
  description:
    "Collaborative office pantry management platform for Bipolar Factory. Discover, consume, vote, and request office snacks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

