import { CreatePostPayload } from "../../types/postTypes";
import {
  CreatePostResult,
  CreatePostValid,
  RequestFailure,
  UpdatePostResult,
  UpdatePostValid,
} from "../../types/validationTypes";

export function validateCreatePostPayload(
  body: string | null | undefined,
): CreatePostResult {
  if (!body) {
    const result: RequestFailure = {
      ok: false,
      message: "Request body is required",
    };
    return result;
  }

  let parsed: CreatePostPayload;
  try {
    parsed = JSON.parse(body);
  } catch {
    const result: RequestFailure = {
      ok: false,
      message: "Invalid JSON body",
    };
    return result;
  }

  const title = parsed.title?.trim();
  const content = parsed.content?.trim();

  if (!title) {
    const result: RequestFailure = {
      ok: false,
      message: "Title is required",
    };
    return result;
  }

  if (title.length < 3) {
    const result: RequestFailure = {
      ok: false,
      message: "Title must be at least 3 characters long",
    };
    return result;
  }

  if (!content) {
    const result: RequestFailure = {
      ok: false,
      message: "Content is required",
    };
    return result;
  }

  if (content.length < 10) {
    const result: RequestFailure = {
      ok: false,
      message: "Content must be at least 10 characters long",
    };
    return result;
  }

  const result: CreatePostValid = {
    ok: true,
    value: { title, content },
  };
  return result;
}

export function validateUpdatePostPayload(
  body: string | null | undefined,
): UpdatePostResult {
  if (!body) {
    const result: RequestFailure = {
      ok: false,
      message: "Request body is required",
    };
    return result;
  }

  let parsed: CreatePostPayload;
  try {
    parsed = JSON.parse(body);
  } catch {
    const result: RequestFailure = {
      ok: false,
      message: "Invalid JSON body",
    };
    return result;
  }

  const rawTitle = parsed.title;
  const rawContent = parsed.content;

  const title = rawTitle !== undefined ? rawTitle.trim() : undefined;
  const content = rawContent !== undefined ? rawContent.trim() : undefined;

  if (title === undefined && content === undefined) {
    const result: RequestFailure = {
      ok: false,
      message: "At least one of title or content must be updated",
    };
    return result;
  }

  if (title !== undefined && title.length < 3) {
    const result: RequestFailure = {
      ok: false,
      message: "Title must be at least 3 characters long",
    };
    return result;
  }

  if (content !== undefined && content.length < 10) {
    const result: RequestFailure = {
      ok: false,
      message: "Content must be at least 10 characters long",
    };
    return result;
  }

  const result: UpdatePostValid = {
    ok: true,
    value: { title, content },
  };
  return result;
}
