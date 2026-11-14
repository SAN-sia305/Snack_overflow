import { z } from "zod";

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function requestJson(
  input: string,
  init?: RequestInit
): Promise<unknown> {
  const response = await fetch(input, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiClientError(
        "The request failed.",
        "REQUEST_FAILED",
        response.status
      );
    }
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload);
    if (parsedError.success) {
      throw new ApiClientError(
        parsedError.data.error.message,
        parsedError.data.error.code,
        response.status
      );
    }
    throw new ApiClientError(
      "The request failed.",
      "REQUEST_FAILED",
      response.status
    );
  }

  return payload;
}
