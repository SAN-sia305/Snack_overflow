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

async function errorFromResponse(response: Response): Promise<ApiClientError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return new ApiClientError(
      "The request failed.",
      "REQUEST_FAILED",
      response.status
    );
  }

  const parsedError = apiErrorSchema.safeParse(payload);
  if (!parsedError.success) {
    return new ApiClientError(
      "The request failed.",
      "REQUEST_FAILED",
      response.status
    );
  }

  return new ApiClientError(
    parsedError.data.error.message,
    parsedError.data.error.code,
    response.status
  );
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

  if (!response.ok) {
    throw await errorFromResponse(response);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  return payload;
}

export async function requestVoid(
  input: string,
  init?: RequestInit
): Promise<void> {
  const response = await fetch(input, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
  });
  if (!response.ok) {
    throw await errorFromResponse(response);
  }
}
