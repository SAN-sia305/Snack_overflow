import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthenticationError } from "@/lib/server/auth";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return apiError(error.code, error.message, error.status);
  }

  if (error instanceof AuthenticationError) {
    return apiError(
      error.status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
      error.message,
      error.status
    );
  }

  if (error instanceof ZodError) {
    return apiError("INVALID_INPUT", "One or more inputs are invalid.", 400);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return apiError("CONFLICT", "The requested change conflicts with existing data.", 409);
    }
    if (error.code === "P2025") {
      return apiError("NOT_FOUND", "The requested resource was not found.", 404);
    }
  }

  console.error("Unhandled API error.");
  return apiError("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
