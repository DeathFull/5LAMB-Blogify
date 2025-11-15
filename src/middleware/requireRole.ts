import { RequireRoleResult } from "../types/authTypes";
import { AuthenticatedUser, UserRole } from "../types/userTypes";

export function requireRole(
  user: AuthenticatedUser,
  allowedRoles: UserRole[],
): RequireRoleResult {
  if (allowedRoles.includes(user.role)) {
    return { ok: true };
  }
  return {
    ok: false,
    message: "You do not have permission to perform this action",
  };
}
