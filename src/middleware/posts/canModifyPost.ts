import { PostItem } from "../../types/postTypes";
import { AuthenticatedUser } from "../../types/userTypes";
import { RequireRoleResult } from "../../types/validationTypes";

export function canModifyPost(
  user: AuthenticatedUser,
  post: PostItem,
): RequireRoleResult {
  if (user.role === "ADMIN" || user.role === "EDITOR") {
    return { ok: true };
  }

  if (user.role === "AUTHOR" && post.authorId === user.userId) {
    return { ok: true };
  }

  return {
    ok: false,
    message: "You do not have permission to modify this post",
  };
}
