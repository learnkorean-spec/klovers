/**
 * Backend-outage helpers (17 Oct 2026). The Supabase database stopped answering
 * for 16+ hours; supabase-js has no request timeout of its own, so login and
 * signup spinners ran forever and a 504 was reported as "wrong password".
 */
export class TimeoutError extends Error {
  constructor(label = "request") {
    super(`${label} timed out`);
    this.name = "TimeoutError";
  }
}

/** Resolve with `promise`, or reject with TimeoutError after `ms`. */
export function withTimeout<T>(promise: PromiseLike<T>, ms: number, label?: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new TimeoutError(label)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * True when an error means "our servers are unreachable or failing", as opposed
 * to something the visitor did wrong (bad password, existing account).
 */
export function isServiceOutage(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof TimeoutError) return true;
  const e = err as { status?: number; name?: string; message?: string };
  if (typeof e.status === "number" && (e.status >= 500 || e.status === 0)) return true;
  const msg = `${e.name ?? ""} ${e.message ?? ""}`.toLowerCase();
  return /failed to fetch|networkerror|network request failed|load failed|timed out|timeout|retryable|gateway|upstream/.test(msg);
}
