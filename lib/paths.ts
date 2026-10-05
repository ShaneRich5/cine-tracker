/** Accepts only same-origin paths like "/movies/harbor-lights", so ?from= can't redirect off-site. */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }
  return value;
}
