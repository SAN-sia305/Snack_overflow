import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth";

export default async function RootIndexPage() {
  const user = await getCurrentUser();
  redirect(user?.role === "admin" ? "/dashboard" : user ? "/home" : "/login");
}
