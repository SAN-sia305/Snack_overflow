import { UserRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User } from "@phosphor-icons/react";

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  if (role === "admin") {
    return (
      <Badge variant="admin" className={className}>
        <ShieldCheck className="w-3.5 h-3.5" weight="fill" />
        <span>Admin</span>
      </Badge>
    );
  }

  return (
    <Badge variant="member" className={className}>
      <User className="w-3.5 h-3.5" weight="bold" />
      <span>Member</span>
    </Badge>
  );
}

