export function hasTrustedOrigin(request: Request): boolean {
  const configuredOrigin = process.env.APP_ORIGIN;
  const requestOrigin = request.headers.get("origin");

  if (!configuredOrigin || !requestOrigin) {
    return false;
  }

  try {
    return new URL(requestOrigin).origin === new URL(configuredOrigin).origin;
  } catch {
    return false;
  }
}
