export type UserRole = "admin" | "member";

export type SnackCategory = "sweet" | "savoury" | "drink" | "healthy-ish";

export type SnackStatus = "stocked" | "running_low" | "gone";

export type ProductRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "purchased"
  | "available";

export type ActivityAction = "consumed" | "restocked";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isVerified: boolean;
  department?: string;
}

export type AuthUser = Omit<User, "isVerified">;

export interface Snack {
  id: string;
  name: string;
  category: SnackCategory;
  description: string;
  imageUrl: string;
  quantity: number;
  lowStockThreshold: number;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  arrivalUntil?: string; // ISO date string if it's considered a New Arrival
  priceInr?: number;
}

export interface Vote {
  id: string;
  userId: string;
  snackId: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  snackId: string;
  snackName: string;
  action: ActivityAction;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface MemberSnackRequest {
  id: string;
  productRequestId: string;
  userId: string;
  userName?: string;
  expectedPriceInr: number;
  note?: string;
  createdAt: string;
}

export interface SnackProductRequest {
  id: string;
  normalizedProductKey: string;
  productName: string;
  status: ProductRequestStatus;
  requests: MemberSnackRequest[];
  distinctRequesterCount: number;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  decisionNote?: string;
  purchasedAt?: string;
  availableAt?: string;
  linkedSnackId?: string;
  actualQuantityAdded?: number;
}

export interface AdminAlert {
  id: string;
  type: "low_stock" | "pending_requests";
  title: string;
  count: number;
  description: string;
  href: string;
}

