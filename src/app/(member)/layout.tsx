import { redirect } from "next/navigation";
import {
  AuthenticationError,
  requireUser,
} from "@/lib/server/auth";

export default async function MemberLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireUser();
  } catch (error) {
    if (error instanceof AuthenticationError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  return children;
}
