import { redirect } from "next/navigation";
import {
  AuthenticationError,
  requireAdmin,
} from "@/lib/server/auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthenticationError && error.status === 401) {
      redirect("/login");
    }
    if (error instanceof AuthenticationError && error.status === 403) {
      redirect("/home");
    }
    throw error;
  }

  return children;
}
