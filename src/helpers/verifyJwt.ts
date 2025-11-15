import * as jwt from "jsonwebtoken";
import { HttpApiEvent } from "../types/httpTypes";
import { AuthenticatedUser } from "../types/userTypes";
import { VerifyJwtFailure, VerifyJwtSuccess } from "../types/jwtTypes";

const JWT_SECRET = process.env.JWT_SECRET;

export function extractBearerToken(
  headers?: Record<string, string | undefined>,
): string | null {
  if (!headers) return null;

  const authHeader =
    headers["authorization"] ?? headers["Authorization"] ?? null;

  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

export function verifyJwt(
  event: HttpApiEvent,
): VerifyJwtSuccess | VerifyJwtFailure {
  if (!JWT_SECRET) {
    return {
      ok: false,
      statusCode: 500,
      message: "Server configuration error: JWT_SECRET is not set",
    };
  }

  const token = extractBearerToken(event.headers);

  if (!token) {
    return {
      ok: false,
      statusCode: 401,
      message: "Missing or invalid Authorization header",
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== "object" || decoded === null) {
      return {
        ok: false,
        statusCode: 401,
        message: "Invalid token payload",
      };
    }

    const { sub, email, role } = decoded as {
      sub?: string;
      email?: string;
      role?: string;
    };

    if (!sub || !email || !role) {
      return {
        ok: false,
        statusCode: 401,
        message: "Token is missing required claims",
      };
    }

    const user: AuthenticatedUser = {
      userId: sub,
      email,
      role: role as any,
    };

    return { ok: true, user };
  } catch (error) {
    console.error("JWT verification error:", error);

    return {
      ok: false,
      statusCode: 401,
      message: "Invalid or expired token",
    };
  }
}
