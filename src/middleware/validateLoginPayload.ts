import { LoginResult } from "../types/authTypes";

export function validateLoginPayload(
  body: string | null | undefined,
): LoginResult {
  if (!body) {
    return { ok: false, message: "Request body is required" };
  }

  let parsed: { email?: string; password?: string };
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, message: "Invalid JSON body" };
  }

  const email = parsed.email?.trim().toLowerCase();
  const password = parsed.password;

  if (!email) {
    return { ok: false, message: "Email is required" };
  }

  if (!password) {
    return { ok: false, message: "Password is required" };
  }

  return { ok: true, email, password };
}
