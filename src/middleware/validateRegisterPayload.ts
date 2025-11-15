import { RegistrationResult } from "../types/authTypes";
import { RegisterUserPayload } from "../types/userTypes";

export default function validateRegisterPayload(
  body: string | null | undefined,
): RegistrationResult {
  if (!body) {
    return { ok: false, message: "Request body is required" };
  }

  let parsed: RegisterUserPayload;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, message: "Invalid JSON body" };
  }

  const email = parsed.email?.trim().toLowerCase();
  const password = parsed.password;
  const name = parsed.name?.trim();

  if (!email) {
    return { ok: false, message: "Email is required" };
  }

  if (!email.includes("@") || !email.includes(".")) {
    return { ok: false, message: "Email format is invalid" };
  }

  if (!password) {
    return { ok: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return {
      ok: false,
      message: "Password must be at least 8 characters long",
    };
  }

  return { ok: true, value: { email, password, name } };
}
