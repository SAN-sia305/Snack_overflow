import { Snack, SnackCategory, SnackStatus } from "@/types";
import { mockStore, getStockStatus } from "../store";
import { simulateLatency } from "../latency";

export interface GetSnacksParams {
  search?: string;
  category?: SnackCategory | "all";
  status?: SnackStatus | "all";
  sortBy?: "name-asc" | "name-desc" | "votes-desc" | "quantity-asc" | "quantity-desc" | "newest";
}

export interface CreateSnackInput {
  name: string;
  category: SnackCategory;
  description: string;
  quantity: number;
  lowStockThreshold: number;
  imageUrl: string;
  priceInr?: number;
}

function validateNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative whole number.`);
  }
}

function validatePrice(priceInr: number | undefined): void {
  if (
    priceInr !== undefined &&
    (!Number.isFinite(priceInr) || priceInr <= 0)
  ) {
    throw new Error("Price must be a positive amount in INR.");
  }
}

export const snackService = {
  async getSnacks(params: GetSnacksParams = {}): Promise<Snack[]> {
    await simulateLatency(120, 250);
    const { snacks } = mockStore.get();
    let result = [...snacks];

    // Filter by search query
    if (params.search && params.search.trim() !== "") {
      const q = params.search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (params.category && params.category !== "all") {
      result = result.filter((s) => s.category === params.category);
    }

    // Filter by stock status
    if (params.status && params.status !== "all") {
      result = result.filter(
        (s) => getStockStatus(s.quantity, s.lowStockThreshold) === params.status
      );
    }

    // Sorting
    if (params.sortBy) {
      switch (params.sortBy) {
        case "name-asc":
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name-desc":
          result.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "votes-desc":
          result.sort((a, b) => b.voteCount - a.voteCount);
          break;
        case "quantity-asc":
          result.sort((a, b) => a.quantity - b.quantity);
          break;
        case "quantity-desc":
          result.sort((a, b) => b.quantity - a.quantity);
          break;
        case "newest":
          result.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
      }
    }

    return result;
  },

  async getSnackById(id: string): Promise<Snack | null> {
    await simulateLatency(80, 180);
    const { snacks } = mockStore.get();
    return snacks.find((s) => s.id === id) || null;
  },

  async getSnackOfTheWeek(): Promise<Snack | null> {
    await simulateLatency(80, 180);
    const { snacks } = mockStore.get();
    if (snacks.length === 0) return null;
    // Highest voted available or stocked snack
    return (
      [...snacks].sort((a, b) => b.voteCount - a.voteCount)[0] || snacks[0]
    );
  },

  async getNewArrivals(): Promise<Snack[]> {
    await simulateLatency(100, 200);
    const { snacks } = mockStore.get();
    const now = new Date().getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    return snacks
      .filter((s) => {
        if (s.arrivalUntil) {
          return new Date(s.arrivalUntil).getTime() >= now;
        }
        const createdTime = new Date(s.createdAt).getTime();
        return now - createdTime <= sevenDaysMs;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  /**
   * Concurrency-simulated Consume operation.
   * If stock is 0, throws a conflict error.
   */
  async consumeSnack(
    snackId: string,
    user: { id: string; name: string; role: "admin" | "member" }
  ): Promise<Snack> {
    await simulateLatency(180, 320);
    const { snacks } = mockStore.get();
    const snack = snacks.find((s) => s.id === snackId);

    if (!snack) {
      throw new Error("Snack not found");
    }

    if (snack.quantity <= 0) {
      const error: any = new Error(
        "Someone beat you to the last packet. Better luck next time."
      );
      error.code = "STOCK_CONFLICT";
      error.status = 409;
      throw error;
    }

    // Decrement stock
    snack.quantity = snack.quantity - 1;
    snack.updatedAt = new Date().toISOString();

    // Log atomic activity
    mockStore.addActivity({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      snackId: snack.id,
      snackName: snack.name,
      action: "consumed",
      amount: 1,
      createdAt: new Date().toISOString(),
    });

    mockStore.updateSnacks(() => snacks);
    return { ...snack };
  },

  async restockSnack(
    snackId: string,
    quantityToAdd: number,
    note?: string,
    user?: { id: string; name: string; role: "admin" | "member" }
  ): Promise<Snack> {
    await simulateLatency(180, 320);

    if (quantityToAdd <= 0 || !Number.isInteger(quantityToAdd)) {
      throw new Error("Restock quantity must be a positive integer.");
    }

    const { snacks } = mockStore.get();
    const snack = snacks.find((s) => s.id === snackId);

    if (!snack) {
      throw new Error("Snack not found");
    }

    snack.quantity += quantityToAdd;
    snack.updatedAt = new Date().toISOString();

    // Log atomic activity
    mockStore.addActivity({
      userId: user?.id || "usr_admin_1",
      userName: user?.name || "Arun Kumar",
      userRole: user?.role || "admin",
      snackId: snack.id,
      snackName: snack.name,
      action: "restocked",
      amount: quantityToAdd,
      note: note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    mockStore.updateSnacks(() => snacks);
    return { ...snack };
  },

  async createSnack(input: CreateSnackInput): Promise<Snack> {
    await simulateLatency(180, 320);
    const name = input.name.trim();
    if (!name) {
      throw new Error("Snack name is required.");
    }
    validateNonNegativeInteger(input.quantity, "Quantity");
    validateNonNegativeInteger(input.lowStockThreshold, "Low-stock threshold");
    validatePrice(input.priceInr);

    const { snacks } = mockStore.get();

    // Prevent duplicate snack names (case-insensitive)
    const normalizedInputName = name.toLowerCase();
    const exists = snacks.some(
      (s) => s.name.trim().toLowerCase() === normalizedInputName
    );

    if (exists) {
      throw new Error(`A snack named "${name}" already exists in the pantry.`);
    }

    const newSnack: Snack = {
      id: "snack_" + Math.random().toString(36).substring(2, 9),
      name,
      category: input.category,
      description: input.description.trim(),
      quantity: Math.max(0, Math.floor(input.quantity)),
      lowStockThreshold: input.lowStockThreshold,
      imageUrl:
        input.imageUrl ||
        "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
      voteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priceInr: input.priceInr,
    };

    mockStore.updateSnacks((prev) => [newSnack, ...prev]);

    // Record initial restock activity if quantity > 0
    if (newSnack.quantity > 0) {
      mockStore.addActivity({
        userId: "usr_admin_1",
        userName: "Arun Kumar",
        userRole: "admin",
        snackId: newSnack.id,
        snackName: newSnack.name,
        action: "restocked",
        amount: newSnack.quantity,
        note: "Initial pantry inventory creation.",
        createdAt: new Date().toISOString(),
      });
    }

    return newSnack;
  },

  async updateSnack(id: string, updates: Partial<CreateSnackInput>): Promise<Snack> {
    await simulateLatency(150, 280);
    const { snacks } = mockStore.get();
    const index = snacks.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error("Snack not found");
    }

    if (updates.name !== undefined) {
      const name = updates.name.trim();
      if (!name) {
        throw new Error("Snack name is required.");
      }
      const normalizedNewName = name.toLowerCase();
      const duplicate = snacks.some(
        (s) => s.id !== id && s.name.trim().toLowerCase() === normalizedNewName
      );
      if (duplicate) {
        throw new Error(`Another snack named "${name}" already exists.`);
      }
      updates = { ...updates, name };
    }

    if (updates.quantity !== undefined) {
      validateNonNegativeInteger(updates.quantity, "Quantity");
    }
    if (updates.lowStockThreshold !== undefined) {
      validateNonNegativeInteger(
        updates.lowStockThreshold,
        "Low-stock threshold"
      );
    }
    validatePrice(updates.priceInr);

    const current = snacks[index];
    const updated: Snack = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    snacks[index] = updated;
    mockStore.updateSnacks(() => [...snacks]);
    return updated;
  },

  async deleteSnack(id: string): Promise<void> {
    await simulateLatency(150, 250);
    if (!mockStore.get().snacks.some((snack) => snack.id === id)) {
      throw new Error("Snack not found");
    }
    mockStore.deleteSnack(id);
  },
};
